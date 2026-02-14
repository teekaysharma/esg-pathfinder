import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import ZAI from "z-ai-web-dev-sdk"
import { z } from "zod"

const csrdAssessmentSchema = z.object({
  doubleMateriality: z.object({
    financialMateriality: z.array(z.object({
      topic: z.string(),
      description: z.string(),
      impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
      timeframe: z.enum(["SHORT", "MEDIUM", "LONG"]),
      financialEffect: z.string()
    })),
    environmentalMateriality: z.array(z.object({
      topic: z.string(),
      description: z.string(),
      impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
      affectedStakeholders: z.array(z.string()),
      severity: z.enum(["LOW", "MEDIUM", "HIGH"])
    })),
    methodology: z.string(),
    assessmentDate: z.string()
  }).optional(),
  esrsReporting: z.object({
    esrs1: z.object({
      governance: z.object({
        sustainabilityGovernance: z.any(),
        businessModel: z.any(),
        policies: z.any()
      })
    }),
    esrs2: z.object({
        climateChange: z.any(),
        pollution: z.any(),
        waterAndMarine: z.any(),
        biodiversity: z.any(),
        circularEconomy: z.any()
    }),
    esrs3: z.object({
        ownWorkforce: z.any(),
        workersInValueChain: z.any(),
        affectedCommunities: z.any(),
        consumers: z.any()
    }),
    esrs5: z.object({
        businessConduct: z.any()
    })
  }).optional(),
  sectorSpecific: z.object({
    industryCode: z.string(),
    specificRequirements: z.any(),
    industryMetrics: z.any(),
    complianceStatus: z.string()
  }).optional(),
  dueDiligence: z.object({
    processDescription: z.string(),
    riskAssessment: z.any(),
    remediationMeasures: z.any(),
    stakeholderEngagement: z.string(),
    trackingProgress: z.any()
  }).optional(),
  datapoints: z.array(z.object({
    esrsCode: z.string(),
    datapointName: z.string(),
    value: z.any(),
    unit: z.string(),
    reportingPeriod: z.string(),
    confidence: z.number(),
    dataSource: z.string()
  }))
})

interface CSRDAssessmentRequest {
  projectId: string
  assessmentData?: z.infer<typeof csrdAssessmentSchema>
  generateFromScope?: boolean
}

interface CSRDAssessmentResponse {
  id: string
  projectId: string
  doubleMateriality: any
  esrsReporting: any
  sectorSpecific: any
  dueDiligence: any
  datapoints: any[]
  overallCompliance: number
  gapAnalysis: {
    criticalGaps: string[]
    recommendations: string[]
    implementationTimeline: string[]
  }
  createdAt: string
  updatedAt: string
}

const POSTHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id
    const body = await request.json() as CSRDAssessmentRequest

    // Check if project exists
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

    let assessmentData = body.assessmentData

    // Generate CSRD assessment from scope if requested
    if (body.generateFromScope && !assessmentData) {
      assessmentData = await generateCSRDFromScope(project)
    }

    // Validate assessment data if provided
    if (assessmentData) {
      const validatedData = csrdAssessmentSchema.parse(assessmentData)
      assessmentData = validatedData
    }

    // Calculate compliance score and gap analysis
    const { overallCompliance, gapAnalysis } = await calculateCSRDCompliance(assessmentData, project)

    // Create or update CSRD assessment
    const csrdAssessment = await db.cSRDAassessment.upsert({
      where: { projectId },
      update: {
        doubleMateriality: assessmentData?.doubleMateriality || {},
        esrsReporting: assessmentData?.esrsReporting || {},
        sectorSpecific: assessmentData?.sectorSpecific || {},
        dueDiligence: assessmentData?.dueDiligence || {},
        datapoints: assessmentData?.datapoints || [],
        overallCompliance,
        gapAnalysis
      },
      create: {
        projectId,
        doubleMateriality: assessmentData?.doubleMateriality || {},
        esrsReporting: assessmentData?.esrsReporting || {},
        sectorSpecific: assessmentData?.sectorSpecific || {},
        dueDiligence: assessmentData?.dueDiligence || {},
        datapoints: assessmentData?.datapoints || [],
        overallCompliance,
        gapAnalysis
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        actor: "system", // This should be the actual user ID
        action: "CSRD_ASSESSMENT_CREATED",
        detailJson: {
          projectId,
          assessmentId: csrdAssessment.id,
          overallCompliance,
          criticalGapsCount: gapAnalysis.criticalGaps.length,
          generatedFromScope: body.generateFromScope
        },
        projectId
      }
    })

    const response: CSRDAssessmentResponse = {
      id: csrdAssessment.id,
      projectId: csrdAssessment.projectId,
      doubleMateriality: csrdAssessment.doubleMateriality,
      esrsReporting: csrdAssessment.esrsReporting,
      sectorSpecific: csrdAssessment.sectorSpecific,
      dueDiligence: csrdAssessment.dueDiligence,
      datapoints: csrdAssessment.datapoints || [],
      overallCompliance: csrdAssessment.overallCompliance || 0,
      gapAnalysis: csrdAssessment.gapAnalysis || { criticalGaps: [], recommendations: [], implementationTimeline: [] },
      createdAt: csrdAssessment.createdAt.toISOString(),
      updatedAt: csrdAssessment.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "CSRD assessment completed successfully"
    })

  } catch (error) {
    console.error("Error creating CSRD assessment:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create CSRD assessment" },
      { status: 500 }
    )
  }
}

const GETHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id

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

    // Get CSRD assessment
    const csrdAssessment = await db.cSRDAassessment.findUnique({
      where: { projectId }
    })

    if (!csrdAssessment) {
      return NextResponse.json(
        { error: "CSRD assessment not found" },
        { status: 404 }
      )
    }

    const response: CSRDAssessmentResponse = {
      id: csrdAssessment.id,
      projectId: csrdAssessment.projectId,
      doubleMateriality: csrdAssessment.doubleMateriality,
      esrsReporting: csrdAssessment.esrsReporting,
      sectorSpecific: csrdAssessment.sectorSpecific,
      dueDiligence: csrdAssessment.dueDiligence,
      datapoints: csrdAssessment.datapoints || [],
      overallCompliance: csrdAssessment.overallCompliance || 0,
      gapAnalysis: csrdAssessment.gapAnalysis || { criticalGaps: [], recommendations: [], implementationTimeline: [] },
      createdAt: csrdAssessment.createdAt.toISOString(),
      updatedAt: csrdAssessment.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error("Error fetching CSRD assessment:", error)
    return NextResponse.json(
      { error: "Failed to fetch CSRD assessment" },
      { status: 500 }
    )
  }
}

async function generateCSRDFromScope(project: any): Promise<any> {
  const zai = await ZAI.create()

  const systemPrompt = `You are a CSRD (Corporate Sustainability Reporting Directive) expert. Your task is to analyze company scope information and generate a comprehensive CSRD assessment covering all key requirements:

1. Double Materiality Assessment (financial and environmental impact)
2. ESRS Reporting Standards (ESRS 1, 2, 3, 5)
3. Sector-Specific Requirements
4. Due Diligence Procedures
5. Data Points and Metrics

For each section, provide detailed analysis based on the company's scope, industry, and operations.

Output format must be JSON with the following structure:
{
  "doubleMateriality": {
    "financialMateriality": [
      {
        "topic": "ESG topic name",
        "description": "Description of financial impact",
        "impact": "LOW|MEDIUM|HIGH",
        "timeframe": "SHORT|MEDIUM|LONG",
        "financialEffect": "Description of financial effect"
      }
    ],
    "environmentalMateriality": [
      {
        "topic": "ESG topic name",
        "description": "Description of environmental impact",
        "impact": "LOW|MEDIUM|HIGH",
        "affectedStakeholders": ["stakeholder1", "stakeholder2"],
        "severity": "LOW|MEDIUM|HIGH"
      }
    ],
    "methodology": "Description of assessment methodology",
    "assessmentDate": "2024-01-01"
  },
  "esrsReporting": {
    "esrs1": {
      "governance": {
        "sustainabilityGovernance": {},
        "businessModel": {},
        "policies": {}
      }
    },
    "esrs2": {
      "climateChange": {},
      "pollution": {},
      "waterAndMarine": {},
      "biodiversity": {},
      "circularEconomy": {}
    },
    "esrs3": {
      "ownWorkforce": {},
      "workersInValueChain": {},
      "affectedCommunities": {},
      "consumers": {}
    },
    "esrs5": {
      "businessConduct": {}
    }
  },
  "sectorSpecific": {
    "industryCode": "NACE code",
    "specificRequirements": {},
    "industryMetrics": {},
    "complianceStatus": "NOT_STARTED"
  },
  "dueDiligence": {
    "processDescription": "Description of due diligence process",
    "riskAssessment": {},
    "remediationMeasures": {},
    "stakeholderEngagement": "Description of engagement",
    "trackingProgress": {}
  },
  "datapoints": [
    {
      "esrsCode": "ESRS code",
      "datapointName": "Datapoint name",
      "value": "value or null",
      "unit": "unit of measurement",
      "reportingPeriod": "period",
      "confidence": 0.8,
      "dataSource": "source of data"
    }
  ]
}`

  const userPrompt = `Generate a CSRD assessment for the following project:

Project: ${project.name}
Organization: ${project.organisation.name}
Sector: ${project.organisation.sector || "Not specified"}
Country: ${project.organisation.country || "Not specified"}

Scope Data:
${JSON.stringify(project.scopeStructuredJson, null, 2)}

Please analyze this information and generate a comprehensive CSRD assessment that addresses all key requirements of the Corporate Sustainability Reporting Directive. Consider the organization's industry, size, and geographic scope when making assessments. Pay special attention to the double materiality assessment and ESRS reporting standards.`

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
    max_tokens: 4000
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
    assessmentData = createFallbackCSRDAssessment(project.organisation.sector)
  }

  return assessmentData
}

async function calculateCSRDCompliance(assessmentData: any, project: any): Promise<{ overallCompliance: number; gapAnalysis: any }> {
  let complianceScore = 0
  const criticalGaps: string[] = []
  const recommendations: string[] = []
  const implementationTimeline: string[] = []

  // Double Materiality Assessment (25% of total score)
  if (assessmentData?.doubleMateriality) {
    const dm = assessmentData.doubleMateriality
    let dmScore = 0
    
    if (dm.financialMateriality && dm.financialMateriality.length > 0) dmScore += 8
    if (dm.environmentalMateriality && dm.environmentalMateriality.length > 0) dmScore += 8
    if (dm.methodology && dm.methodology.length > 100) dmScore += 5
    if (dm.assessmentDate) dmScore += 4
    
    complianceScore += dmScore * 0.25
    
    if (dmScore < 15) {
      criticalGaps.push("Double materiality assessment incomplete")
      recommendations.push("Complete comprehensive double materiality assessment covering both financial and environmental impacts")
      implementationTimeline.push("Month 1-2: Conduct double materiality assessment")
    }
  } else {
    criticalGaps.push("Double materiality assessment missing")
    recommendations.push("Implement double materiality assessment process")
    implementationTimeline.push("Month 1: Establish double materiality assessment framework")
  }

  // ESRS Reporting Standards (35% of total score)
  if (assessmentData?.esrsReporting) {
    const esrs = assessmentData.esrsReporting
    let esrsScore = 0
    
    if (esrs.esrs1) esrsScore += 7
    if (esrs.esrs2 && Object.keys(esrs.esrs2).length >= 5) esrsScore += 12
    if (esrs.esrs3 && Object.keys(esrs.esrs3).length >= 4) esrsScore += 10
    if (esrs.esrs5) esrsScore += 6
    
    complianceScore += esrsScore * 0.35
    
    if (esrsScore < 25) {
      criticalGaps.push("ESRS reporting standards coverage incomplete")
      recommendations.push("Enhance coverage of ESRS reporting standards, particularly ESRS 2 (Environmental) and ESRS 3 (Social)")
      implementationTimeline.push("Month 2-4: Implement ESRS reporting standards")
    }
  } else {
    criticalGaps.push("ESRS reporting standards not implemented")
    recommendations.push("Implement all relevant ESRS reporting standards")
    implementationTimeline.push("Month 2-6: Phase in ESRS standards implementation")
  }

  // Sector-Specific Requirements (20% of total score)
  if (assessmentData?.sectorSpecific) {
    const sector = assessmentData.sectorSpecific
    let sectorScore = 0
    
    if (sector.industryCode) sectorScore += 5
    if (sector.specificRequirements && Object.keys(sector.specificRequirements).length > 0) sectorScore += 8
    if (sector.industryMetrics) sectorScore += 4
    if (sector.complianceStatus && sector.complianceStatus !== "NOT_STARTED") sectorScore += 3
    
    complianceScore += sectorScore * 0.2
    
    if (sectorScore < 12) {
      criticalGaps.push("Sector-specific requirements not adequately addressed")
      recommendations.push("Develop industry-specific compliance approach and metrics")
      implementationTimeline.push("Month 3-5: Implement sector-specific requirements")
    }
  } else {
    criticalGaps.push("Sector-specific requirements missing")
    recommendations.push("Identify and implement sector-specific CSRD requirements")
    implementationTimeline.push("Month 3: Assess sector-specific requirements")
  }

  // Due Diligence Procedures (15% of total score)
  if (assessmentData?.dueDiligence) {
    const dd = assessmentData.dueDiligence
    let ddScore = 0
    
    if (dd.processDescription && dd.processDescription.length > 100) ddScore += 5
    if (dd.riskAssessment && Object.keys(dd.riskAssessment).length > 0) ddScore += 4
    if (dd.remediationMeasures && Object.keys(dd.remediationMeasures).length > 0) ddScore += 3
    if (dd.stakeholderEngagement && dd.stakeholderEngagement.length > 50) ddScore += 3
    
    complianceScore += ddScore * 0.15
    
    if (ddScore < 10) {
      criticalGaps.push("Due diligence procedures inadequate")
      recommendations.push("Strengthen due diligence processes with enhanced risk assessment and stakeholder engagement")
      implementationTimeline.push("Month 4-6: Enhance due diligence procedures")
    }
  } else {
    criticalGaps.push("Due diligence procedures not established")
    recommendations.push("Implement comprehensive due diligence procedures")
    implementationTimeline.push("Month 4: Establish due diligence framework")
  }

  // Data Points and Metrics (5% of total score)
  if (assessmentData?.datapoints && assessmentData.datapoints.length > 0) {
    const dataPoints = assessmentData.datapoints
    let dataScore = Math.min(dataPoints.length * 2, 10) // Max 10 points
    
    complianceScore += dataScore * 0.05
    
    if (dataPoints.length < 10) {
      recommendations.push("Expand data collection to cover all required ESRS datapoints")
      implementationTimeline.push("Month 5-8: Enhance data collection systems")
    }
  } else {
    criticalGaps.push("Insufficient data points and metrics")
    recommendations.push("Establish comprehensive data collection system for CSRD reporting")
    implementationTimeline.push("Month 5: Implement data collection framework")
  }

  // Size-specific recommendations
  const isLargeEnterprise = project.organisation.sector && 
    ["manufacturing", "energy", "financial", "utilities"].some(s => 
      project.organisation.sector.toLowerCase().includes(s)
    )

  if (isLargeEnterprise) {
    criticalGaps.push("Large enterprise requires immediate CSRD compliance")
    recommendations.push("Prioritize CSRD compliance for 2024 reporting deadline")
    implementationTimeline.unshift("Month 1: Establish CSRD compliance team")
  }

  // EU-specific recommendations
  if (project.organisation.country?.toLowerCase().includes("europe") || 
      ["germany", "france", "italy", "spain", "netherlands"].includes(project.organisation.country?.toLowerCase())) {
    recommendations.push("Ensure compliance with EU-specific CSRD requirements and national transposition laws")
    implementationTimeline.push("Month 6-9: Address EU-specific requirements")
  }

  return {
    overallCompliance: Math.round(complianceScore * 100) / 100,
    gapAnalysis: {
      criticalGaps: [...new Set(criticalGaps)],
      recommendations: [...new Set(recommendations)],
      implementationTimeline: [...new Set(implementationTimeline)].sort()
    }
  }
}

function createFallbackCSRDAssessment(sector: string): any {
  const isEU = ["germany", "france", "italy", "spain", "netherlands"].some(s => 
    sector?.toLowerCase().includes(s)
  )
  const isLargeEnterprise = ["manufacturing", "energy", "financial", "utilities"].some(s => 
    sector?.toLowerCase().includes(s)
  )

  return {
    doubleMateriality: {
      financialMateriality: [
        {
          topic: "Climate Change",
          description: "Financial impacts from climate-related risks and opportunities",
          impact: "MEDIUM",
          timeframe: "MEDIUM",
          financialEffect: "Potential impact on asset values and operational costs"
        }
      ],
      environmentalMateriality: [
        {
          topic: "Greenhouse Gas Emissions",
          description: "Environmental impact of company emissions",
          impact: "MEDIUM",
          affectedStakeholders: ["Local communities", "Environment", "Future generations"],
          severity: "MEDIUM"
        }
      ],
      methodology: "Initial assessment methodology needs to be formalized",
      assessmentDate: new Date().toISOString().split('T')[0]
    },
    esrsReporting: {
      esrs1: {
        governance: {
          sustainabilityGovernance: {},
          businessModel: {},
          policies: {}
        }
      },
      esrs2: {
        climateChange: {},
        pollution: {},
        waterAndMarine: {},
        biodiversity: {},
        circularEconomy: {}
      },
      esrs3: {
        ownWorkforce: {},
        workersInValueChain: {},
        affectedCommunities: {},
        consumers: {}
      },
      esrs5: {
        businessConduct: {}
      }
    },
    sectorSpecific: {
      industryCode: "Sector code to be determined",
      specificRequirements: {},
      industryMetrics: {},
      complianceStatus: "NOT_STARTED"
    },
    dueDiligence: {
      processDescription: "Due diligence process needs to be established",
      riskAssessment: {},
      remediationMeasures: {},
      stakeholderEngagement: "Stakeholder engagement process to be developed",
      trackingProgress: {}
    },
    datapoints: [
      {
        esrsCode: "ESRS_E1_1",
        datapointName: "Greenhouse gas emissions (Scope 1)",
        value: null,
        unit: "tCO2e",
        reportingPeriod: "Annual",
        confidence: 0,
        dataSource: "To be collected"
      }
    ]
  }
}

export const POST = withAuth(POSTHandler)
export const GET = withAuth(GETHandler)
