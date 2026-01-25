import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const validationSchema = z.object({
  validationRules: z.array(z.object({
    type: z.enum(["RANGE", "FORMAT", "REQUIRED", "CONSISTENCY", "COMPLETENESS"]),
    rule: z.string(),
    passed: z.boolean(),
    message: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  })),
  overallScore: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  recommendations: z.array(z.string()),
  validationStatus: z.enum(["VALIDATED", "REJECTED", "REVIEW"]),
  validatorNotes: z.string().optional()
})

interface ValidationRequest {
  projectId: string
  dataPointId: string
  validationData?: z.infer<typeof validationSchema>
  autoValidate?: boolean
}

interface ValidationResponse {
  id: string
  projectId: string
  dataPointId: string
  validationRules: any[]
  overallScore: number
  confidence: number
  recommendations: string[]
  validationStatus: string
  validatorNotes?: string
  validatedAt: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; dataPointId: string } }
) {
  try {
    const projectId = params.id
    const dataPointId = params.dataPointId
    const body = await request.json() as ValidationRequest

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Check if data point exists
    const dataPoint = await db.eSGDataPoint.findUnique({
      where: { id: dataPointId, projectId }
    })

    if (!dataPoint) {
      return NextResponse.json(
        { error: "Data point not found" },
        { status: 404 }
      )
    }

    let validationData = body.validationData

    // Auto-validate if requested
    if (body.autoValidate && !validationData) {
      validationData = await autoValidateDataPoint(dataPoint)
    }

    // Validate validation data if provided
    if (validationData) {
      const validatedData = validationSchema.parse(validationData)
      validationData = validatedData
    }

    // Update data point with validation results
    const updatedDataPoint = await db.eSGDataPoint.update({
      where: { id: dataPointId },
      data: {
        validationStatus: validationData?.validationStatus || dataPoint.validationStatus,
        confidence: validationData?.confidence || dataPoint.confidence,
        metadata: {
          ...dataPoint.metadata,
          validation: validationData,
          lastValidatedAt: new Date().toISOString()
        }
      }
    })

    // Log the validation action
    await db.auditLog.create({
      data: {
        actor: "system", // This should be the actual user ID
        action: "DATA_POINT_VALIDATED",
        detailJson: {
          projectId,
          dataPointId,
          validationStatus: validationData?.validationStatus,
          overallScore: validationData?.overallScore,
          autoValidated: body.autoValidate
        },
        projectId
      }
    })

    const response: ValidationResponse = {
      id: updatedDataPoint.id,
      projectId: updatedDataPoint.projectId,
      dataPointId: dataPointId,
      validationRules: validationData?.validationRules || [],
      overallScore: validationData?.overallScore || 0,
      confidence: validationData?.confidence || 0,
      recommendations: validationData?.recommendations || [],
      validationStatus: validationData?.validationStatus || updatedDataPoint.validationStatus,
      validatorNotes: validationData?.validatorNotes,
      validatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "Data point validated successfully"
    })

  } catch (error) {
    console.error("Error validating data point:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to validate data point" },
      { status: 500 }
    )
  }
}

async function autoValidateDataPoint(dataPoint: any): Promise<any> {
  const validationRules: any[] = []
  let overallScore = 1.0
  const recommendations: string[] = []

  // Rule 1: Required Value Check
  if (dataPoint.value === null || dataPoint.value === undefined) {
    validationRules.push({
      type: "REQUIRED",
      rule: "Value is required",
      passed: false,
      message: "Data point value is missing",
      severity: "HIGH"
    })
    overallScore -= 0.3
    recommendations.push("Provide a value for this data point")
  } else {
    validationRules.push({
      type: "REQUIRED",
      rule: "Value is required",
      passed: true,
      message: "Value is present",
      severity: "LOW"
    })
  }

  // Rule 2: Range Validation (for numeric values)
  if (dataPoint.value !== null && dataPoint.value !== undefined) {
    const rangeRules = getRangeRules(dataPoint.metricCode, dataPoint.category)
    
    for (const rangeRule of rangeRules) {
      const passed = dataPoint.value >= rangeRule.min && dataPoint.value <= rangeRule.max
      validationRules.push({
        type: "RANGE",
        rule: rangeRule.description,
        passed,
        message: passed ? "Value within acceptable range" : `Value ${dataPoint.value} is outside acceptable range [${rangeRule.min}, ${rangeRule.max}]`,
        severity: rangeRule.severity
      })
      
      if (!passed) {
        overallScore -= rangeRule.penalty
        recommendations.push(rangeRule.recommendation)
      }
    }
  }

  // Rule 3: Format Validation
  const formatRules = getFormatRules(dataPoint.metricCode, dataPoint.unit)
  
  for (const formatRule of formatRules) {
    const passed = validateFormat(dataPoint.value, formatRule.format)
    validationRules.push({
      type: "FORMAT",
      rule: formatRule.description,
      passed,
      message: passed ? "Format is valid" : `Invalid format for ${formatRule.format}`,
      severity: formatRule.severity
    })
    
    if (!passed) {
      overallScore -= formatRule.penalty
      recommendations.push(formatRule.recommendation)
    }
  }

  // Rule 4: Consistency Validation (compare with related data points)
  if (dataPoint.projectId) {
    const consistencyIssues = await checkConsistency(dataPoint)
    
    for (const issue of consistencyIssues) {
      validationRules.push({
        type: "CONSISTENCY",
        rule: issue.rule,
        passed: false,
        message: issue.message,
        severity: issue.severity
      })
      
      overallScore -= issue.penalty
      recommendations.push(issue.recommendation)
    }
  }

  // Rule 5: Completeness Validation
  const completenessIssues = checkCompleteness(dataPoint)
  
  for (const issue of completenessIssues) {
    validationRules.push({
      type: "COMPLETENESS",
      rule: issue.rule,
      passed: false,
      message: issue.message,
      severity: issue.severity
    })
    
    overallScore -= issue.penalty
    recommendations.push(issue.recommendation)
  }

  // Ensure score doesn't go below 0
  overallScore = Math.max(0, overallScore)

  // Determine validation status
  let validationStatus: "VALIDATED" | "REJECTED" | "REVIEW" = "VALIDATED"
  
  if (overallScore < 0.4) {
    validationStatus = "REJECTED"
  } else if (overallScore < 0.7) {
    validationStatus = "REVIEW"
  }

  return {
    validationRules,
    overallScore,
    confidence: overallScore,
    recommendations: [...new Set(recommendations)], // Remove duplicates
    validationStatus
  }
}

function getRangeRules(metricCode: string, category: string): any[] {
  const rules: any[] = []

  // Environmental metrics range rules
  if (category === "Environmental") {
    if (metricCode.includes("emission") || metricCode.includes("GHG")) {
      rules.push({
        min: 0,
        max: 10000000, // 10 million tons CO2e
        description: "GHG emissions should be non-negative and reasonable",
        severity: "HIGH",
        penalty: 0.2,
        recommendation: "Verify emission calculation methodology and data sources"
      })
    }
    
    if (metricCode.includes("energy") && metricCode.includes("consumption")) {
      rules.push({
        min: 0,
        max: 10000000, // 10 million GJ
        description: "Energy consumption should be non-negative",
        severity: "MEDIUM",
        penalty: 0.15,
        recommendation: "Review energy consumption data for accuracy"
      })
    }
  }

  // Social metrics range rules
  if (category === "Social") {
    if (metricCode.includes("turnover") || metricCode.includes("turnover")) {
      rules.push({
        min: 0,
        max: 100, // 100%
        description: "Employee turnover rate should be between 0-100%",
        severity: "MEDIUM",
        penalty: 0.15,
        recommendation: "Verify turnover rate calculation"
      })
    }
    
    if (metricCode.includes("diversity") || metricCode.includes("gender")) {
      rules.push({
        min: 0,
        max: 100, // 100%
        description: "Diversity percentage should be between 0-100%",
        severity: "MEDIUM",
        penalty: 0.1,
        recommendation: "Review diversity calculation methodology"
      })
    }
  }

  // Governance metrics range rules
  if (category === "Governance") {
    if (metricCode.includes("independence") || metricCode.includes("board")) {
      rules.push({
        min: 0,
        max: 100, // 100%
        description: "Board independence should be between 0-100%",
        severity: "MEDIUM",
        penalty: 0.1,
        recommendation: "Verify board independence calculation"
      })
    }
  }

  return rules
}

function getFormatRules(metricCode: string, unit: string): any[] {
  const rules: any[] = []

  // Percentage format validation
  if (unit === "percentage" || unit === "%") {
    rules.push({
      format: "percentage",
      description: "Value should be a percentage (0-100)",
      severity: "MEDIUM",
      penalty: 0.1,
      recommendation: "Ensure value is expressed as a percentage"
    })
  }

  // Currency format validation
  if (unit === "USD" || unit === "EUR" || unit === "GBP") {
    rules.push({
      format: "currency",
      description: "Value should be a valid currency amount",
      severity: "MEDIUM",
      penalty: 0.1,
      recommendation: "Verify currency format and amount"
    })
  }

  // Count format validation
  if (unit === "count" || unit === "number") {
    rules.push({
      format: "integer",
      description: "Value should be a whole number",
      severity: "LOW",
      penalty: 0.05,
      recommendation: "Ensure value is a whole number"
    })
  }

  return rules
}

function validateFormat(value: any, format: string): boolean {
  if (value === null || value === undefined) return true

  switch (format) {
    case "percentage":
      return typeof value === 'number' && value >= 0 && value <= 100
    case "currency":
      return typeof value === 'number' && value >= 0
    case "integer":
      return Number.isInteger(value) && value >= 0
    default:
      return true
  }
}

async function checkConsistency(dataPoint: any): Promise<any[]> {
  const issues: any[] = []

  try {
    // Get related data points for consistency checking
    const relatedDataPoints = await db.eSGDataPoint.findMany({
      where: {
        projectId: dataPoint.projectId,
        year: dataPoint.year,
        category: dataPoint.category,
        id: { not: dataPoint.id }
      }
    })

    // Check for logical consistency between related metrics
    if (dataPoint.metricCode.includes("emission") && dataPoint.value !== null) {
      const totalEmissions = relatedDataPoints
        .filter(dp => dp.metricCode.includes("emission") && dp.value !== null)
        .reduce((sum, dp) => sum + (dp.value || 0), 0)
      
      if (dataPoint.value > totalEmissions * 2) {
        issues.push({
          rule: "Emission consistency",
          message: "Emission value is significantly higher than related emission metrics",
          severity: "MEDIUM",
          penalty: 0.1,
          recommendation: "Verify emission calculation and ensure consistency across all emission metrics"
        })
      }
    }

    // Check for year-over-year consistency
    const previousYearData = await db.eSGDataPoint.findMany({
      where: {
        projectId: dataPoint.projectId,
        metricCode: dataPoint.metricCode,
        year: dataPoint.year - 1
      }
    })

    if (previousYearData.length > 0 && dataPoint.value !== null) {
      const previousValue = previousYearData[0].value
      if (previousValue !== null) {
        const changePercent = Math.abs((dataPoint.value - previousValue) / previousValue * 100)
        
        if (changePercent > 50) {
          issues.push({
            rule: "Year-over-year consistency",
            message: `Significant year-over-year change (${changePercent.toFixed(1)}%) detected`,
            severity: "MEDIUM",
            penalty: 0.1,
            recommendation: "Verify data accuracy and investigate significant changes"
          })
        }
      }
    }

  } catch (error) {
    console.error("Error checking consistency:", error)
  }

  return issues
}

function checkCompleteness(dataPoint: any): any[] {
  const issues: any[] = []

  // Check for missing required metadata
  if (!dataPoint.dataSource) {
    issues.push({
      rule: "Data source completeness",
      message: "Data source is not specified",
      severity: "LOW",
      penalty: 0.05,
      recommendation: "Provide data source information"
    })
  }

  // Check for unit consistency
  if (!dataPoint.unit) {
    issues.push({
      rule: "Unit completeness",
      message: "Unit of measurement is not specified",
      severity: "MEDIUM",
      penalty: 0.1,
      recommendation: "Specify unit of measurement"
    })
  }

  // Check for period consistency
  if (!dataPoint.period) {
    issues.push({
      rule: "Period completeness",
      message: "Reporting period is not specified",
      severity: "LOW",
      penalty: 0.05,
      recommendation: "Specify reporting period"
    })
  }

  return issues
}