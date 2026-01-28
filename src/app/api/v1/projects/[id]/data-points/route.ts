import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const dataPointSchema = z.object({
  category: z.enum(["Environmental", "Social", "Governance"]),
  subcategory: z.string(),
  metricName: z.string(),
  metricCode: z.string(),
  value: z.number().optional(),
  unit: z.string().optional(),
  year: z.number(),
  period: z.enum(["Annual", "Quarterly", "Monthly"]).default("Annual"),
  dataSource: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  validationStatus: z.enum(["PENDING", "VALIDATED", "REJECTED", "REVIEW"]).default("PENDING"),
  metadata: z.object({}).optional()
})

const bulkDataPointsSchema = z.object({
  dataPoints: z.array(dataPointSchema)
})

interface DataPointRequest {
  projectId: string
  dataPoint?: z.infer<typeof dataPointSchema>
  bulkDataPoints?: z.infer<typeof bulkDataPointsSchema>
  generateFromStandards?: boolean
  standards?: string[]
}

interface DataPointResponse {
  id: string
  projectId: string
  category: string
  subcategory: string
  metricName: string
  metricCode: string
  value?: number
  unit?: string
  year: number
  period: string
  dataSource?: string
  confidence?: number
  validationStatus: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json() as DataPointRequest

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

    let createdDataPoints: DataPointResponse[] = []

    // Handle bulk data points creation
    if (body.bulkDataPoints) {
      const validatedData = bulkDataPointsSchema.parse(body.bulkDataPoints)
      
      for (const dataPoint of validatedData.dataPoints) {
        const created = await createSingleDataPoint(projectId, dataPoint)
        createdDataPoints.push(created)
      }

      // Log the bulk action
      await db.auditLog.create({
        data: {
          actor: "system", // This should be the actual user ID
          action: "BULK_DATA_POINTS_CREATED",
          detailJson: {
            projectId,
            count: createdDataPoints.length,
            categories: [...new Set(createdDataPoints.map(dp => dp.category))]
          },
          projectId
        }
      })

      return NextResponse.json({
        success: true,
        data: createdDataPoints,
        message: `Successfully created ${createdDataPoints.length} data points`
      })
    }

    // Handle single data point creation
    if (body.dataPoint) {
      const validatedData = dataPointSchema.parse(body.dataPoint)
      const created = await createSingleDataPoint(projectId, validatedData)
      createdDataPoints.push(created)

      // Log the action
      await db.auditLog.create({
        data: {
          actor: "system", // This should be the actual user ID
          action: "DATA_POINT_CREATED",
          detailJson: {
            projectId,
            dataPointId: created.id,
            category: created.category,
            metricCode: created.metricCode
          },
          projectId
        }
      })

      return NextResponse.json({
        success: true,
        data: created,
        message: "Data point created successfully"
      })
    }

    // Generate data points from standards if requested
    if (body.generateFromStandards) {
      const generatedDataPoints = await generateDataPointsFromStandards(project, body.standards || [])
      
      for (const dataPoint of generatedDataPoints) {
        const created = await createSingleDataPoint(projectId, dataPoint)
        createdDataPoints.push(created)
      }

      // Log the action
      await db.auditLog.create({
        data: {
          actor: "system", // This should be the actual user ID
          action: "DATA_POINTS_GENERATED_FROM_STANDARDS",
          detailJson: {
            projectId,
            count: createdDataPoints.length,
            standards: body.standards
          },
          projectId
        }
      })

      return NextResponse.json({
        success: true,
        data: createdDataPoints,
        message: `Generated ${createdDataPoints.length} data points from standards`
      })
    }

    return NextResponse.json(
      { error: "No valid data provided" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error creating data points:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create data points" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const year = searchParams.get("year")
    const validationStatus = searchParams.get("validationStatus")

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

    // Build where clause
    const whereClause: any = { projectId }
    
    if (category) {
      whereClause.category = category
    }
    
    if (year) {
      whereClause.year = parseInt(year)
    }
    
    if (validationStatus) {
      whereClause.validationStatus = validationStatus
    }

    // Get data points
    const dataPoints = await db.eSGDataPoint.findMany({
      where: whereClause,
      orderBy: [
        { category: "asc" },
        { subcategory: "asc" },
        { metricName: "asc" },
        { year: "desc" }
      ]
    })

    const response: DataPointResponse[] = dataPoints.map(dp => ({
      id: dp.id,
      projectId: dp.projectId,
      category: dp.category,
      subcategory: dp.subcategory,
      metricName: dp.metricName,
      metricCode: dp.metricCode,
      value: dp.value,
      unit: dp.unit,
      year: dp.year,
      period: dp.period,
      dataSource: dp.dataSource,
      confidence: dp.confidence,
      validationStatus: dp.validationStatus,
      metadata: dp.metadata,
      createdAt: dp.createdAt.toISOString(),
      updatedAt: dp.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: response,
      count: response.length
    })

  } catch (error) {
    console.error("Error fetching data points:", error)
    return NextResponse.json(
      { error: "Failed to fetch data points" },
      { status: 500 }
    )
  }
}

async function createSingleDataPoint(projectId: string, dataPoint: any): Promise<DataPointResponse> {
  const created = await db.eSGDataPoint.create({
    data: {
      projectId,
      category: dataPoint.category,
      subcategory: dataPoint.subcategory,
      metricName: dataPoint.metricName,
      metricCode: dataPoint.metricCode,
      value: dataPoint.value,
      unit: dataPoint.unit,
      year: dataPoint.year,
      period: dataPoint.period,
      dataSource: dataPoint.dataSource,
      confidence: dataPoint.confidence,
      validationStatus: dataPoint.validationStatus,
      metadata: dataPoint.metadata
    }
  })

  return {
    id: created.id,
    projectId: created.projectId,
    category: created.category,
    subcategory: created.subcategory,
    metricName: created.metricName,
    metricCode: created.metricCode,
    value: created.value,
    unit: created.unit,
    year: created.year,
    period: created.period,
    dataSource: created.dataSource,
    confidence: created.confidence,
    validationStatus: created.validationStatus,
    metadata: created.metadata,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString()
  }
}

async function generateDataPointsFromStandards(project: any, standards: string[]): Promise<any[]> {
  const dataPoints: any[] = []
  const currentYear = new Date().getFullYear()

  // Standard ESG metrics mapping
  const standardMetrics: Record<string, any[]> = {
    GRI: [
      {
        category: "Environmental",
        subcategory: "Energy",
        metricName: "Energy consumption within the organization",
        metricCode: "GRI_302_1",
        unit: "GJ",
        period: "Annual"
      },
      {
        category: "Environmental",
        subcategory: "Emissions",
        metricName: "Direct (Scope 1) GHG emissions",
        metricCode: "GRI_305_1",
        unit: "tCO2e",
        period: "Annual"
      },
      {
        category: "Social",
        subcategory: "Labor Practices",
        metricName: "New employee hires during the reporting period",
        metricCode: "GRI_401_1",
        unit: "count",
        period: "Annual"
      },
      {
        category: "Governance",
        subcategory: "Ethics",
        metricName: "Board independence",
        metricCode: "GRI_102_18",
        unit: "percentage",
        period: "Annual"
      }
    ],
    SASB: [
      {
        category: "Environmental",
        subcategory: "Climate Change",
        metricName: "GHG emissions intensity",
        metricCode: "SASB_EM_MM_130A_1",
        unit: "tCO2e/revenue",
        period: "Annual"
      },
      {
        category: "Social",
        subcategory: "Human Capital",
        metricName: "Employee turnover",
        metricCode: "SASB_HC_RT_440A_1",
        unit: "percentage",
        period: "Annual"
      }
    ],
    TCFD: [
      {
        category: "Environmental",
        subcategory: "Climate Change",
        metricName: "Scope 1 emissions",
        metricCode: "TCFD_MET_001",
        unit: "tCO2e",
        period: "Annual"
      },
      {
        category: "Governance",
        subcategory: "Climate Governance",
        metricName: "Board oversight of climate-related risks",
        metricCode: "TCFD_GOV_001",
        unit: "binary",
        period: "Annual"
      }
    ],
    CSRD: [
      {
        category: "Environmental",
        subcategory: "Climate Change",
        metricName: "GHG emissions (Scope 1+2)",
        metricCode: "ESRS_E1_2",
        unit: "tCO2e",
        period: "Annual"
      },
      {
        category: "Social",
        subcategory: "Workforce",
        metricName: "Gender diversity in senior management",
        metricCode: "ESRS_S1_5",
        unit: "percentage",
        period: "Annual"
      }
    ]
  }

  // Generate data points for each requested standard
  for (const standard of standards) {
    const metrics = standardMetrics[standard]
    if (metrics) {
      for (const metric of metrics) {
        dataPoints.push({
          ...metric,
          year: currentYear,
          confidence: 0.5, // Default confidence for generated metrics
          validationStatus: "PENDING",
          dataSource: `Generated from ${standard} standard`,
          metadata: {
            generated: true,
            standard: standard,
            generatedAt: new Date().toISOString()
          }
        })
      }
    }
  }

  // If no standards specified, generate basic GRI metrics
  if (standards.length === 0) {
    const griMetrics = standardMetrics.GRI
    for (const metric of griMetrics) {
      dataPoints.push({
        ...metric,
        year: currentYear,
        confidence: 0.5,
        validationStatus: "PENDING",
        dataSource: "Generated from GRI standard",
        metadata: {
          generated: true,
          standard: "GRI",
          generatedAt: new Date().toISOString()
        }
      })
    }
  }

  // Add industry-specific metrics based on project sector
  const sector = project.organisation.sector?.toLowerCase() || ""
  
  if (sector.includes("energy") || sector.includes("utilities")) {
    dataPoints.push({
      category: "Environmental",
      subcategory: "Climate Change",
      metricName: "Renewable energy consumption",
      metricCode: "SECTOR_RE_001",
      unit: "percentage",
      year: currentYear,
      period: "Annual",
      confidence: 0.5,
      validationStatus: "PENDING",
      dataSource: "Generated for energy sector",
      metadata: {
        generated: true,
        sectorSpecific: true,
        generatedAt: new Date().toISOString()
      }
    })
  }

  if (sector.includes("manufacturing")) {
    dataPoints.push({
      category: "Environmental",
      subcategory: "Pollution",
      metricName: "Waste generated",
      metricCode: "SECTOR_MF_001",
      unit: "tonnes",
      year: currentYear,
      period: "Annual",
      confidence: 0.5,
      validationStatus: "PENDING",
      dataSource: "Generated for manufacturing sector",
      metadata: {
        generated: true,
        sectorSpecific: true,
        generatedAt: new Date().toISOString()
      }
    })
  }

  if (sector.includes("financial") || sector.includes("banking")) {
    dataPoints.push({
      category: "Governance",
      subcategory: "Ethics",
      metricName: "Sustainable finance portfolio percentage",
      metricCode: "SECTOR_FS_001",
      unit: "percentage",
      year: currentYear,
      period: "Annual",
      confidence: 0.5,
      validationStatus: "PENDING",
      dataSource: "Generated for financial sector",
      metadata: {
        generated: true,
        sectorSpecific: true,
        generatedAt: new Date().toISOString()
      }
    })
  }

  return dataPoints
}