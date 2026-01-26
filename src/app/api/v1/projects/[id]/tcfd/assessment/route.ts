import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import ZAI from "z-ai-web-dev-sdk"
import { z } from "zod"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { UserRole } from "@prisma/client"

const tcfdAssessmentSchema = z.object({
  governance: z.object({
    boardOversight: z.boolean(),
    managementResponsibility: z.boolean(),
    climateCompetency: z.boolean(),
    governanceDescription: z.string()
  }).optional(),
  strategy: z.object({
    climateRisks: z.array(z.object({
      type: z.enum(["TRANSITION", "PHYSICAL"]),
      description: z.string(),
      impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
      timeframe: z.enum(["SHORT", "MEDIUM", "LONG"]),
      financialImpact: z.string()
    })),
    climateOpportunities: z.array(z.object({
      type: z.string(),
      description: z.string(),
      impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
      timeframe: z.enum(["SHORT", "MEDIUM", "LONG"]),
      financialImpact: z.string()
    })),
    resilienceAnalysis: z.string(),
    strategyDescription: z.string()
  }).optional(),
  riskManagement: z.object({
    riskIdentificationProcess: z.string(),
    riskAssessmentMethodology: z.string(),
    riskMitigationStrategies: z.string(),
    integrationInOverallRisk: z.boolean(),
    riskManagementDescription: z.string()
  }).optional(),
  metricsTargets: z.object({
    ghgEmissions: z.array(z.object({
      scope: z.enum(["SCOPE_1", "SCOPE_2", "SCOPE_3"]),
      metric: z.string(),
      target: z.string(),
      baselineYear: z.number(),
      targetYear: z.number(),
      currentValue: z.number().optional(),
      unit: z.string()
    })),
    climateMetrics: z.array(z.object({
      name: z.string(),
      metric: z.string(),
      target: z.string(),
      baselineYear: z.number(),
      targetYear: z.number(),
      currentValue: z.number().optional(),
      unit: z.string()
    })),
    targetsDescription: z.string()
  }).optional()
})

interface TCFDAssessmentRequest {
  projectId: string
  assessmentData?: z.infer<typeof tcfdAssessmentSchema>
  generateFromScope?: boolean
}

interface TCFDAssessmentResponse {
  id: string
  projectId: string
  governance: any
  strategy: any
  riskManagement: any
  metricsTargets: any
  overallScore: number
  recommendations: string[]
  createdAt: string
  updatedAt: string
}

const tcfdAssessmentHandler = async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id
    const body = await req.json() as TCFDAssessmentRequest

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organisation: true,
        scopeStructuredJson: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Check if user has access to this project
    const hasAccess = req.user!.role === UserRole.ADMIN || 
                     req.user!.role === UserRole.AUDITOR || 
                     project.createdBy === req.user!.userId

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    let assessmentData = body.assessmentData

    // Generate TCFD assessment from scope if requested
    if (body.generateFromScope && !assessmentData) {
      assessmentData = await generateTCFDFromScope(project)
    }

    // Validate assessment data if provided
    if (assessmentData) {
      const validatedData = tcfdAssessmentSchema.parse(assessmentData)
      assessmentData = validatedData
    }

    // Calculate overall score and generate recommendations
    const { overallScore, recommendations } = await calculateTCFDScore(assessmentData, project)

    // Create or update TCFD assessment
    const tcfdAssessment = await db.tCFDAssessment.upsert({
      where: { projectId },
      update: {
        governance: assessmentData?.governance || {},
        strategy: assessmentData?.strategy || {},
        riskManagement: assessmentData?.riskManagement || {},
        metricsTargets: assessmentData?.metricsTargets || {},
        overallScore,
        recommendations
      },
      create: {
        projectId,
        governance: assessmentData?.governance || {},
        strategy: assessmentData?.strategy || {},
        riskManagement: assessmentData?.riskManagement || {},
        metricsTargets: assessmentData?.metricsTargets || {},
        overallScore,
        recommendations
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        actor: req.user!.userId,
        action: "TCFD_ASSESSMENT_CREATED",
        detailJson: {
          projectId,
          assessmentId: tcfdAssessment.id,
          overallScore,
          recommendationsCount: recommendations.length,
          generatedFromScope: body.generateFromScope
        },
        projectId
      }
    })

    const response: TCFDAssessmentResponse = {
      id: tcfdAssessment.id,
      projectId: tcfdAssessment.projectId,
      governance: tcfdAssessment.governance,
      strategy: tcfdAssessment.strategy,
      riskManagement: tcfdAssessment.riskManagement,
      metricsTargets: tcfdAssessment.metricsTargets,
      overallScore: tcfdAssessment.overallScore || 0,
      recommendations: tcfdAssessment.recommendations || [],
      createdAt: tcfdAssessment.createdAt.toISOString(),
      updatedAt: tcfdAssessment.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "TCFD assessment completed successfully"
    })

  } catch (error) {
    console.error("Error creating TCFD assessment:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create TCFD assessment" },
      { status: 500 }
    )
  }
}

const getTCFDAssessmentHandler = async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Check if user has access to this project
    const hasAccess = req.user!.role === UserRole.ADMIN || 
                     req.user!.role === UserRole.AUDITOR || 
                     project.createdBy === req.user!.userId

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Get TCFD assessment
    const tcfdAssessment = await db.tCFDAssessment.findUnique({
      where: { projectId }
    })

    if (!tcfdAssessment) {
      return NextResponse.json(
        { error: "TCFD assessment not found" },
        { status: 404 }
      )
    }

    const response: TCFDAssessmentResponse = {
      id: tcfdAssessment.id,
      projectId: tcfdAssessment.projectId,
      governance: tcfdAssessment.governance,
      strategy: tcfdAssessment.strategy,
      riskManagement: tcfdAssessment.riskManagement,
      metricsTargets: tcfdAssessment.metricsTargets,
      overallScore: tcfdAssessment.overallScore || 0,
      recommendations: tcfdAssessment.recommendations || [],
      createdAt: tcfdAssessment.createdAt.toISOString(),
      updatedAt: tcfdAssessment.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error("Error fetching TCFD assessment:", error)
    return NextResponse.json(
      { error: "Failed to fetch TCFD assessment" },
      { status: 500 }
    )
  }
}

export const POST = withAuth(tcfdAssessmentHandler)
export const GET = withAuth(getTCFDAssessmentHandler)

async function generateTCFDFromScope(project: any): Promise<any> {
  const zai = await ZAI.create()

  const systemPrompt = `You are a TCFD (Task Force on Climate-related Financial Disclosures) expert. Your task is to analyze company scope information and generate a comprehensive TCFD assessment covering all four pillars: Governance, Strategy, Risk Management, and Metrics & Targets.

For each pillar, provide:
1. Governance: Board oversight, management responsibility, climate competency
2. Strategy: Climate-related risks and opportunities, resilience analysis
3. Risk Management: Risk identification, assessment, and mitigation processes
4. Metrics & Targets: GHG emissions, climate-related metrics, and targets

Output format must be JSON with the following structure:
{
  "governance": {
    "boardOversight": boolean,
    "managementResponsibility": boolean,
    "climateCompetency": boolean,
    "governanceDescription": "Detailed description of governance structure"
  },
  "strategy": {
    "climateRisks": [
      {
        "type": "TRANSITION|PHYSICAL",
        "description": "Risk description",
        "impact": "LOW|MEDIUM|HIGH",
        "timeframe": "SHORT|MEDIUM|LONG",
        "financialImpact": "Description of financial impact"
      }
    ],
    "climateOpportunities": [
      {
        "type": "Opportunity type",
        "description": "Opportunity description",
        "impact": "LOW|MEDIUM|HIGH",
        "timeframe": "SHORT|MEDIUM|LONG",
        "financialImpact": "Description of financial impact"
      }
    ],
    "resilienceAnalysis": "Analysis of business resilience to climate change",
    "strategyDescription": "Overall climate strategy description"
  },
  "riskManagement": {
    "riskIdentificationProcess": "Description of risk identification process",
    "riskAssessmentMethodology": "Methodology for assessing climate risks",
    "riskMitigationStrategies": "Strategies for mitigating climate risks",
    "integrationInOverallRisk": boolean,
    "riskManagementDescription": "Overall risk management description"
  },
  "metricsTargets": {
    "ghgEmissions": [
      {
        "scope": "SCOPE_1|SCOPE_2|SCOPE_3",
        "metric": "Emission metric name",
        "target": "Target description",
        "baselineYear": number,
        "targetYear": number,
        "unit": "Unit of measurement"
      }
    ],
    "climateMetrics": [
      {
        "name": "Metric name",
        "metric": "Metric description",
        "target": "Target description",
        "baselineYear": number,
        "targetYear": number,
        "unit": "Unit of measurement"
      }
    ],
    "targetsDescription": "Overall targets and metrics description"
  }
}`

  const userPrompt = `Generate a TCFD assessment for the following project:

Project: ${project.name}
Organization: ${project.organisation.name}
Sector: ${project.organisation.sector || "Not specified"}
Country: ${project.organisation.country || "Not specified"}

Scope Data:
${JSON.stringify(project.scopeStructuredJson, null, 2)}

Please analyze this information and generate a comprehensive TCFD assessment that addresses all four pillars of the TCFD framework. Consider the organization's industry, size, and geographic scope when making assessments.`

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    temperature: 0.3,
    max_tokens: 3000
  })

  const aiResponse = completion.choices[0]?.message?.content

  if (!aiResponse) {
    throw new Error("No response from AI")
  }

  let assessmentData: any
  try {
    assessmentData = JSON.parse(aiResponse)
  } catch (parseError) {
    console.error("Failed to parse AI response as JSON:", parseError)
    assessmentData = createFallbackTCFDAssessment(project.organisation.sector)
  }

  return assessmentData
}

async function calculateTCFDScore(assessmentData: any, project: any): Promise<{ overallScore: number; recommendations: string[] }> {
  let score = 0
  const recommendations: string[] = []

  // Governance scoring (25% of total)
  if (assessmentData?.governance) {
    const gov = assessmentData.governance
    let govScore = 0
    
    if (gov.boardOversight) govScore += 8
    if (gov.managementResponsibility) govScore += 8
    if (gov.climateCompetency) govScore += 6
    if (gov.governanceDescription && gov.governanceDescription.length > 100) govScore += 3
    
    score += govScore * 0.25
    
    if (govScore < 15) {
      recommendations.push("Strengthen climate governance by establishing board-level oversight and management accountability")
    }
  } else {
    recommendations.push("Implement climate governance structure with clear board and management responsibilities")
  }

  // Strategy scoring (30% of total)
  if (assessmentData?.strategy) {
    const strat = assessmentData.strategy
    let stratScore = 0
    
    if (strat.climateRisks && strat.climateRisks.length > 0) stratScore += 10
    if (strat.climateOpportunities && strat.climateOpportunities.length > 0) stratScore += 8
    if (strat.resilienceAnalysis && strat.resilienceAnalysis.length > 100) stratScore += 7
    if (strat.strategyDescription && strat.strategyDescription.length > 100) stratScore += 5
    
    score += stratScore * 0.3
    
    if (stratScore < 20) {
      recommendations.push("Develop comprehensive climate strategy including risk assessment and resilience planning")
    }
  } else {
    recommendations.push("Create climate strategy addressing both risks and opportunities")
  }

  // Risk Management scoring (25% of total)
  if (assessmentData?.riskManagement) {
    const risk = assessmentData.riskManagement
    let riskScore = 0
    
    if (risk.riskIdentificationProcess && risk.riskIdentificationProcess.length > 50) riskScore += 8
    if (risk.riskAssessmentMethodology && risk.riskAssessmentMethodology.length > 50) riskScore += 7
    if (risk.riskMitigationStrategies && risk.riskMitigationStrategies.length > 50) riskScore += 7
    if (risk.integrationInOverallRisk) riskScore += 3
    
    score += riskScore * 0.25
    
    if (riskScore < 15) {
      recommendations.push("Enhance climate risk management processes and integrate with overall risk framework")
    }
  } else {
    recommendations.push("Implement climate risk management framework")
  }

  // Metrics & Targets scoring (20% of total)
  if (assessmentData?.metricsTargets) {
    const metrics = assessmentData.metricsTargets
    let metricsScore = 0
    
    if (metrics.ghgEmissions && metrics.ghgEmissions.length > 0) metricsScore += 10
    if (metrics.climateMetrics && metrics.climateMetrics.length > 0) metricsScore += 6
    if (metrics.targetsDescription && metrics.targetsDescription.length > 100) metricsScore += 4
    
    score += metricsScore * 0.2
    
    if (metricsScore < 12) {
      recommendations.push("Establish climate-related metrics and targets with clear baselines and timelines")
    }
  } else {
    recommendations.push("Set climate-related metrics and targets for performance tracking")
  }

  // Industry-specific recommendations
  const sector = project.organisation.sector?.toLowerCase() || ""
  if (sector.includes("energy") || sector.includes("utilities")) {
    recommendations.push("Focus on transition risks and renewable energy opportunities")
  } else if (sector.includes("financial") || sector.includes("banking")) {
    recommendations.push("Assess climate-related financial risks in lending and investment portfolios")
  } else if (sector.includes("manufacturing")) {
    recommendations.push("Address both physical risks to facilities and transition risks in supply chains")
  }

  return {
    overallScore: Math.round(score * 100) / 100,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  }
}

function createFallbackTCFDAssessment(sector: string): any {
  const isHighRiskSector = ["energy", "utilities", "transportation", "manufacturing"].some(s => 
    sector?.toLowerCase().includes(s)
  )

  return {
    governance: {
      boardOversight: false,
      managementResponsibility: false,
      climateCompetency: false,
      governanceDescription: "Climate governance structure needs to be established"
    },
    strategy: {
      climateRisks: isHighRiskSector ? [
        {
          type: "TRANSITION",
          description: "Regulatory changes and carbon pricing risks",
          impact: "MEDIUM",
          timeframe: "MEDIUM",
          financialImpact: "Potential increased compliance costs"
        },
        {
          type: "PHYSICAL",
          description: "Extreme weather events affecting operations",
          impact: "MEDIUM",
          timeframe: "LONG",
          financialImpact: "Potential operational disruptions"
        }
      ] : [
        {
          type: "TRANSITION",
          description: "General climate transition risks",
          impact: "LOW",
          timeframe: "MEDIUM",
          financialImpact: "Moderate financial impact expected"
        }
      ],
      climateOpportunities: [
        {
          type: "Energy Efficiency",
          description: "Cost savings through energy efficiency improvements",
          impact: "MEDIUM",
          timeframe: "SHORT",
          financialImpact: "Operational cost reductions"
        }
      ],
      resilienceAnalysis: "Climate resilience assessment needs to be conducted",
      strategyDescription: "Climate strategy needs to be developed"
    },
    riskManagement: {
      riskIdentificationProcess: "Climate risk identification process needs to be established",
      riskAssessmentMethodology: "Climate risk assessment methodology needs to be developed",
      riskMitigationStrategies: "Climate risk mitigation strategies need to be identified",
      integrationInOverallRisk: false,
      riskManagementDescription: "Climate risk management framework needs to be implemented"
    },
    metricsTargets: {
      ghgEmissions: [
        {
          scope: "SCOPE_1",
          metric: "Direct GHG emissions",
          target: "Reduce emissions by 30%",
          baselineYear: new Date().getFullYear(),
          targetYear: new Date().getFullYear() + 5,
          unit: "tCO2e"
        }
      ],
      climateMetrics: [
        {
          name: "Energy Consumption",
          metric: "Total energy consumption",
          target: "Reduce by 20%",
          baselineYear: new Date().getFullYear(),
          targetYear: new Date().getFullYear() + 5,
          unit: "MWh"
        }
      ],
      targetsDescription: "Climate targets need to be formally established and approved"
    }
  }
}