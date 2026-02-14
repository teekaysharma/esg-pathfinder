import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import ZAI from "z-ai-web-dev-sdk"
import { z } from "zod"

const issbAssessmentSchema = z.object({
  ifrsS1: z.object({
    generalRequirements: z.object({
      governance: z.any(),
      strategy: z.any(),
      riskManagement: z.any(),
      metricsTargets: z.any()
    }),
    sustainabilityStatement: z.object({
      content: z.string(),
      location: z.string(),
      approval: z.any()
    })
  }).optional(),
  ifrsS2: z.object({
    climateRelatedRisks: z.array(z.object({
      type: z.enum(["PHYSICAL", "TRANSITION"]),
      description: z.string(),
      impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
      timeframe: z.enum(["SHORT", "MEDIUM", "LONG"]),
      mitigation: z.string()
    })),
    climateOpportunities: z.array(z.object({
      type: z.string(),
      description: z.string(),
      impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
      timeframe: z.enum(["SHORT", "MEDIUM", "LONG"]),
      strategy: z.string()
    })),
    resilience: z.object({
      analysis: z.string(),
      scenarios: z.any(),
      adaptation: z.string()
    }),
    metrics: z.object({
      ghgEmissions: z.any(),
      climateMetrics: z.any(),
      targets: z.any(),
      baselines: z.any()
    })
  }).optional(),
  ifrsS3: z.object({
    natureDependencies: z.array(z.object({
      type: z.string(),
      description: z.string(),
      impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
      timeframe: z.enum(["SHORT", "MEDIUM", "LONG"]),
      mitigation: z.string()
    })),
    ecosystemServices: z.object({
      assessment: z.string(),
      valuation: z.any(),
      impact: z.string()
    }),
    biodiversity: z.object({
      metrics: z.any(),
      targets: z.any(),
      protection: z.string()
    })
  }).optional(),
  ifrsS4: z.object({
    humanRights: z.object({
      policy: z.string(),
      dueDiligence: z.string(),
      governance: z.any(),
      reporting: z.string()
    }),
    socialPerformance: z.object({
      workplace: z.any(),
      community: z.any(),
      supplyChain: z.any(),
      customers: z.any()
    }),
    stakeholderEngagement: z.object({
      process: z.string(),
      outcomes: z.any(),
      feedback: z.string()
    })
  }).optional(),
  ifrsS5: z.object({
    workforceManagement: z.object({
      composition: z.any(),
      development: z.any(),
      compensation: z.any(),
      wellbeing: z.any()
    }),
    laborRelations: z.object({
      collectiveBargaining: z.string(),
      healthSafety: z.any(),
      workLifeBalance: z.string()
    }),
      diversityInclusion: z.object({
      metrics: z.any(),
      policies: z.string(),
      initiatives: z.any()
    })
  }).optional(),
  ifrsS6: z.object({
    pollutionManagement: z.object({
      airQuality: z.any(),
      waterQuality: z.any(),
      soilQuality: z.any(),
      wasteManagement: z.any()
    }),
    resourceUse: z.object({
      materials: z.any(),
      water: z.any(),
      energy: z.any(),
      circularity: z.any()
    }),
    environmentalCompliance: z.object({
      permits: z.any(),
      violations: z.any(),
      remediation: z.string()
    })
  }).optional(),
  ifrsS7: z.object({
    circularStrategy: z.object({
      vision: z.string(),
      targets: z.any(),
      governance: z.any()
    }),
    resourceEfficiency: z.object({
      design: z.any(),
      production: z.any(),
      consumption: z.any(),
      endOfLife: z.any()
    }),
    valueRetention: z.object({
      reuse: z.any(),
      repair: z.any(),
      remanufacturing: z.any(),
      recycling: z.any()
    })
  }).optional(),
  sustainability: z.object({
    governance: z.any(),
    strategy: z.any(),
    riskManagement: z.any(),
    metrics: z.any()
  }).optional(),
  climate: z.object({
    governance: z.any(),
    strategy: z.any(),
    riskMetrics: z.any(),
    performance: z.any()
  }).optional()
})

interface ISSBAssessmentRequest {
  projectId: string
  assessmentData?: z.infer<typeof issbAssessmentSchema>
  generateFromScope?: boolean
}

interface ISSBAssessmentResponse {
  id: string
  projectId: string
  ifrsS1: any
  ifrsS2: any
  ifrsS3?: any
  ifrsS4?: any
  ifrsS5?: any
  ifrsS6?: any
  ifrsS7?: any
  sustainability: any
  climate: any
  nature?: any
  humanRights?: any
  resources?: any
  circularEconomy?: any
  overallScore: number
  recommendations: string[]
  readiness?: any
  createdAt: string
  updatedAt: string
}

const POSTHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id
    const body = await request.json() as ISSBAssessmentRequest

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

    // Generate ISSB assessment from scope if requested
    if (body.generateFromScope && !assessmentData) {
      assessmentData = await generateISSBFromScope(project)
    }

    // Validate assessment data if provided
    if (assessmentData) {
      const validatedData = issbAssessmentSchema.parse(assessmentData)
      assessmentData = validatedData
    }

    // Calculate overall score and generate recommendations
    const { overallScore, recommendations } = await calculateISSBScore(assessmentData, project)

    // Create or update ISSB assessment
    const issbAssessment = await db.iSSBAssessment.upsert({
      where: { projectId },
      update: {
        ifrsS1: assessmentData?.ifrsS1 || {},
        ifrsS2: assessmentData?.ifrsS2 || {},
        ifrsS3: assessmentData?.ifrsS3 || {},
        ifrsS4: assessmentData?.ifrsS4 || {},
        ifrsS5: assessmentData?.ifrsS5 || {},
        ifrsS6: assessmentData?.ifrsS6 || {},
        ifrsS7: assessmentData?.ifrsS7 || {},
        sustainability: assessmentData?.sustainability || {},
        climate: assessmentData?.climate || {},
        nature: assessmentData?.ifrsS3 ? {
          dependencies: assessmentData.ifrsS3.natureDependencies || [],
          ecosystemServices: assessmentData.ifrsS3.ecosystemServices || {},
          biodiversity: assessmentData.ifrsS3.biodiversity || {}
        } : {},
        humanRights: assessmentData?.ifrsS4 ? {
          policy: assessmentData.ifrsS4.humanRights?.policy || "",
          dueDiligence: assessmentData.ifrsS4.humanRights?.dueDiligence || "",
          governance: assessmentData.ifrsS4.humanRights?.governance || {},
          socialPerformance: assessmentData.ifrsS4?.socialPerformance || {},
          stakeholderEngagement: assessmentData.ifrsS4?.stakeholderEngagement || {}
        } : {},
        resources: assessmentData?.ifrsS6 ? {
          pollutionManagement: assessmentData.ifrsS6.pollutionManagement || {},
          resourceUse: assessmentData.ifrsS6.resourceUse || {},
          environmentalCompliance: assessmentData.ifrsS6.environmentalCompliance || {}
        } : {},
        circularEconomy: assessmentData?.ifrsS7 ? {
          strategy: assessmentData.ifrsS7.circularStrategy || {},
          resourceEfficiency: assessmentData.ifrsS7.resourceEfficiency || {},
          valueRetention: assessmentData.ifrsS7.valueRetention || {}
        } : {},
        overallScore,
        recommendations,
        readiness: await calculateIFRSReadiness(assessmentData, project)
      },
      create: {
        projectId,
        ifrsS1: assessmentData?.ifrsS1 || {},
        ifrsS2: assessmentData?.ifrsS2 || {},
        ifrsS3: assessmentData?.ifrsS3 || {},
        ifrsS4: assessmentData?.ifrsS4 || {},
        ifrsS5: assessmentData?.ifrsS5 || {},
        ifrsS6: assessmentData?.ifrsS6 || {},
        ifrsS7: assessmentData?.ifrsS7 || {},
        sustainability: assessmentData?.sustainability || {},
        climate: assessmentData?.climate || {},
        nature: assessmentData?.ifrsS3 ? {
          dependencies: assessmentData.ifrsS3.natureDependencies || [],
          ecosystemServices: assessmentData.ifrsS3.ecosystemServices || {},
          biodiversity: assessmentData.ifrsS3.biodiversity || {}
        } : {},
        humanRights: assessmentData?.ifrsS4 ? {
          policy: assessmentData.ifrsS4.humanRights?.policy || "",
          dueDiligence: assessmentData.ifrsS4.humanRights?.dueDiligence || "",
          governance: assessmentData.ifrsS4.humanRights?.governance || {},
          socialPerformance: assessmentData.ifrsS4?.socialPerformance || {},
          stakeholderEngagement: assessmentData.ifrsS4?.stakeholderEngagement || {}
        } : {},
        resources: assessmentData?.ifrsS6 ? {
          pollutionManagement: assessmentData.ifrsS6.pollutionManagement || {},
          resourceUse: assessmentData.ifrsS6.resourceUse || {},
          environmentalCompliance: assessmentData.ifrsS6.environmentalCompliance || {}
        } : {},
        circularEconomy: assessmentData?.ifrsS7 ? {
          strategy: assessmentData.ifrsS7.circularStrategy || {},
          resourceEfficiency: assessmentData.ifrsS7.resourceEfficiency || {},
          valueRetention: assessmentData.ifrsS7.valueRetention || {}
        } : {},
        overallScore,
        recommendations,
        readiness: await calculateIFRSReadiness(assessmentData, project)
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        actor: "system", // This should be the actual user ID
        action: "ISSB_ASSESSMENT_CREATED",
        detailJson: {
          projectId,
          assessmentId: issbAssessment.id,
          overallScore,
          recommendationsCount: recommendations.length,
          generatedFromScope: body.generateFromScope
        },
        projectId
      }
    })

    const response: ISSBAssessmentResponse = {
      id: issbAssessment.id,
      projectId: issbAssessment.projectId,
      ifrsS1: issbAssessment.ifrsS1,
      ifrsS2: issbAssessment.ifrsS2,
      ifrsS3: issbAssessment.ifrsS3,
      ifrsS4: issbAssessment.ifrsS4,
      ifrsS5: issbAssessment.ifrsS5,
      ifrsS6: issbAssessment.ifrsS6,
      ifrsS7: issbAssessment.ifrsS7,
      sustainability: issbAssessment.sustainability,
      climate: issbAssessment.climate,
      nature: issbAssessment.nature,
      humanRights: issbAssessment.humanRights,
      resources: issbAssessment.resources,
      circularEconomy: issbAssessment.circularEconomy,
      overallScore: issbAssessment.overallScore || 0,
      recommendations: issbAssessment.recommendations || [],
      readiness: issbAssessment.readiness,
      createdAt: issbAssessment.createdAt.toISOString(),
      updatedAt: issbAssessment.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "ISSB assessment completed successfully"
    })

  } catch (error) {
    console.error("Error creating ISSB assessment:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create ISSB assessment" },
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

    // Get ISSB assessment
    const issbAssessment = await db.iSSBAssessment.findUnique({
      where: { projectId }
    })

    if (!issbAssessment) {
      return NextResponse.json(
        { error: "ISSB assessment not found" },
        { status: 404 }
      )
    }

    const response: ISSBAssessmentResponse = {
      id: issbAssessment.id,
      projectId: issbAssessment.projectId,
      ifrsS1: issbAssessment.ifrsS1,
      ifrsS2: issbAssessment.ifrsS2,
      ifrsS3: issbAssessment.ifrsS3,
      ifrsS4: issbAssessment.ifrsS4,
      ifrsS5: issbAssessment.ifrsS5,
      ifrsS6: issbAssessment.ifrsS6,
      ifrsS7: issbAssessment.ifrsS7,
      sustainability: issbAssessment.sustainability,
      climate: issbAssessment.climate,
      nature: issbAssessment.nature,
      humanRights: issbAssessment.humanRights,
      resources: issbAssessment.resources,
      circularEconomy: issbAssessment.circularEconomy,
      overallScore: issbAssessment.overallScore || 0,
      recommendations: issbAssessment.recommendations || [],
      readiness: issbAssessment.readiness,
      createdAt: issbAssessment.createdAt.toISOString(),
      updatedAt: issbAssessment.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error("Error fetching ISSB assessment:", error)
    return NextResponse.json(
      { error: "Failed to fetch ISSB assessment" },
      { status: 500 }
    )
  }
}

async function generateISSBFromScope(project: any): Promise<any> {
  const zai = await ZAI.create()

  const systemPrompt = `You are an ISSB (International Sustainability Standards Board) expert. Your task is to analyze company scope information and generate a comprehensive ISSB assessment covering IFRS S1 and IFRS S2 requirements.

IFRS S1 covers general sustainability-related financial disclosures, while IFRS S2 specifically addresses climate-related disclosures.

For each standard, provide comprehensive analysis including:
1. Governance structures and oversight
2. Strategy and risk management
3. Metrics, targets, and reporting
4. Climate-specific requirements (for IFRS S2)

Output format must be JSON with the following structure:
{
  "ifrsS1": {
    "generalRequirements": {
      "governance": {},
      "strategy": {},
      "riskManagement": {},
      "metricsTargets": {}
    },
    "sustainabilityStatement": {
      "content": "Sustainability statement content",
      "location": "Where it's published",
      "approval": {}
    }
  },
  "ifrsS2": {
    "climateRelatedRisks": [
      {
        "type": "PHYSICAL|TRANSITION",
        "description": "Risk description",
        "impact": "LOW|MEDIUM|HIGH",
        "timeframe": "SHORT|MEDIUM|LONG",
        "mitigation": "Mitigation strategy"
      }
    ],
    "climateOpportunities": [
      {
        "type": "Opportunity type",
        "description": "Opportunity description",
        "impact": "LOW|MEDIUM|HIGH",
        "timeframe": "SHORT|MEDIUM|LONG",
        "strategy": "Strategy description"
      }
    ],
    "resilience": {
      "analysis": "Resilience analysis",
      "scenarios": {},
      "adaptation": "Adaptation measures"
    },
    "metrics": {
      "ghgEmissions": {},
      "climateMetrics": {},
      "targets": {},
      "baselines": {}
    }
  },
  "sustainability": {
    "governance": {},
    "strategy": {},
    "riskManagement": {},
    "metrics": {}
  },
  "climate": {
    "governance": {},
    "strategy": {},
    "riskMetrics": {},
    "performance": {}
  }
}`

  const userPrompt = `Generate an ISSB assessment for the following project:

Project: ${project.name}
Organization: ${project.organisation.name}
Sector: ${project.organisation.sector || "Not specified"}
Country: ${project.organisation.country || "Not specified"}

Scope Data:
${JSON.stringify(project.scopeStructuredJson, null, 2)}

Please analyze this information and generate a comprehensive ISSB assessment that addresses both IFRS S1 (General Requirements) and IFRS S2 (Climate-related Disclosures). Consider the organization's industry, size, and geographic scope when making assessments. Provide detailed recommendations for compliance with each standard.`

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
    max_tokens: 3500
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
    assessmentData = createFallbackISSBAssessment(project.organisation.sector)
  }

  return assessmentData
}

async function calculateISSBScore(assessmentData: any, project: any): Promise<{ overallScore: number; recommendations: string[] }> {
  let score = 0
  const recommendations: string[] = []

  // IFRS S1 Scoring (50% of total)
  if (assessmentData?.ifrsS1) {
    const s1 = assessmentData.ifrsS1
    let s1Score = 0
    
    if (s1.generalRequirements?.governance) s1Score += 10
    if (s1.generalRequirements?.strategy) s1Score += 10
    if (s1.generalRequirements?.riskManagement) s1Score += 10
    if (s1.generalRequirements?.metricsTargets) s1Score += 10
    if (s1.sustainabilityStatement?.content) s1Score += 10
    
    score += s1Score * 0.5
    
    if (s1Score < 40) {
      recommendations.push("Enhance IFRS S1 general requirements compliance, particularly governance and strategy")
    }
  } else {
    recommendations.push("Implement IFRS S1 general requirements for sustainability disclosures")
  }

  // IFRS S2 Scoring (50% of total)
  if (assessmentData?.ifrsS2) {
    const s2 = assessmentData.ifrsS2
    let s2Score = 0
    
    if (s2.climateRelatedRisks && s2.climateRelatedRisks.length > 0) s2Score += 12
    if (s2.climateOpportunities && s2.climateOpportunities.length > 0) s2Score += 8
    if (s2.resilience?.analysis) s2Score += 10
    if (s2.metrics?.ghgEmissions) s2Score += 12
    if (s2.metrics?.targets) s2Score += 8
    
    score += s2Score * 0.5
    
    if (s2Score < 35) {
      recommendations.push("Strengthen IFRS S2 climate-related disclosures, particularly risk assessment and metrics")
    }
  } else {
    recommendations.push("Implement IFRS S2 climate-related disclosure requirements")
  }

  // Industry-specific recommendations
  const sector = project.organisation.sector?.toLowerCase() || ""
  if (sector.includes("energy") || sector.includes("utilities")) {
    recommendations.push("Focus on climate transition risks and opportunities in energy sector")
  } else if (sector.includes("financial") || sector.includes("banking")) {
    recommendations.push("Address climate-related financial risks in lending and investment portfolios")
  } else if (sector.includes("manufacturing")) {
    recommendations.push("Consider both physical and transition climate risks in manufacturing operations")
  }

  return {
    overallScore: Math.round(score * 100) / 100,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  }
}

function createFallbackISSBAssessment(sector: string): any {
  const isHighClimateImpact = ["energy", "utilities", "transportation", "manufacturing"].some(s => 
    sector?.toLowerCase().includes(s)
  )

  return {
    ifrsS1: {
      generalRequirements: {
        governance: {
          boardOversight: "Board oversight of sustainability risks needs to be established",
          managementResponsibility: "Management responsibility for sustainability disclosures required"
        },
        strategy: {
          sustainabilityStrategy: "Sustainability strategy needs to be developed",
          riskManagement: "Sustainability risk management framework required"
        },
        riskManagement: {
          riskIdentification: "Sustainability risk identification process needed",
          riskAssessment: "Risk assessment methodology for sustainability impacts required"
        },
        metricsTargets: {
          sustainabilityMetrics: "Sustainability metrics and targets need to be established"
        }
      },
      sustainabilityStatement: {
        content: "Sustainability statement needs to be prepared and included in financial reports",
        location: "To be determined",
        approval: "Board approval process for sustainability statement required"
      }
    },
    ifrsS2: {
      climateRelatedRisks: isHighClimateImpact ? [
        {
          type: "TRANSITION",
          description: "Climate transition risks from regulatory changes and carbon pricing",
          impact: "MEDIUM",
          timeframe: "MEDIUM",
          mitigation: "Develop transition risk mitigation strategies"
        },
        {
          type: "PHYSICAL",
          description: "Physical climate risks to operations and assets",
          impact: "MEDIUM",
          timeframe: "LONG",
          mitigation: "Implement climate resilience measures"
        }
      ] : [
        {
          type: "TRANSITION",
          description: "General climate transition risks",
          impact: "LOW",
          timeframe: "MEDIUM",
          mitigation: "Monitor and assess transition risks"
        }
      ],
      climateOpportunities: [
        {
          type: "Energy Efficiency",
          description: "Cost savings and emissions reduction through energy efficiency",
          impact: "MEDIUM",
          timeframe: "SHORT",
          strategy: "Implement energy efficiency programs"
        }
      ],
      resilience: {
        analysis: "Climate resilience analysis needs to be conducted",
        scenarios: "Climate scenario analysis required",
        adaptation: "Climate adaptation measures need to be identified"
      },
      metrics: {
        ghgEmissions: {
          scope1: "Scope 1 emissions measurement required",
          scope2: "Scope 2 emissions measurement required",
          scope3: "Scope 3 emissions assessment needed"
        },
        climateMetrics: {
          energyConsumption: "Energy consumption metrics needed",
          waterUsage: "Water usage metrics required"
        },
        targets: {
          emissionTargets: "Science-based emission targets need to be set",
          climateTargets: "Climate-related performance targets required"
        },
        baselines: {
          baselineYear: "Baseline year for climate metrics needs to be established",
          methodology: "Measurement methodology needs to be defined"
        }
      }
    },
    sustainability: {
      governance: "Sustainability governance framework needs to be established",
      strategy: "Overall sustainability strategy needs to be developed",
      riskManagement: "Sustainability risk management processes required",
      metrics: "Sustainability performance metrics need to be defined"
    },
    climate: {
      governance: "Climate governance structure needs to be established",
      strategy: "Climate strategy needs to be developed",
      riskMetrics: "Climate risk metrics need to be established",
      performance: "Climate performance tracking needs to be implemented"
    }
  }
}

async function calculateIFRSReadiness(assessmentData: any, project: any): Promise<any> {
  const readiness = {
    overall: 0,
    standards: {
      ifrsS1: { score: 0, status: 'NOT_STARTED' as const, gaps: [] as string[] },
      ifrsS2: { score: 0, status: 'NOT_STARTED' as const, gaps: [] as string[] },
      ifrsS3: { score: 0, status: 'NOT_STARTED' as const, gaps: [] as string[] },
      ifrsS4: { score: 0, status: 'NOT_STARTED' as const, gaps: [] as string[] },
      ifrsS5: { score: 0, status: 'NOT_STARTED' as const, gaps: [] as string[] },
      ifrsS6: { score: 0, status: 'NOT_STARTED' as const, gaps: [] as string[] },
      ifrsS7: { score: 0, status: 'NOT_STARTED' as const, gaps: [] as string[] }
    },
    timeline: {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    },
    resources: {
      team: 'NOT_ESTABLISHED',
      budget: 'NOT_ALLOCATED',
      technology: 'NOT_IMPLEMENTED',
      training: 'NOT_PLANNED'
    }
  }

  // IFRS S1 Readiness
  if (assessmentData?.ifrsS1) {
    let s1Score = 0
    const s1Gaps = []
    
    if (assessmentData.ifrsS1.generalRequirements?.governance) {
      s1Score += 25
    } else {
      s1Gaps.push('Governance oversight for sustainability disclosures')
    }
    
    if (assessmentData.ifrsS1.generalRequirements?.strategy) {
      s1Score += 25
    } else {
      s1Gaps.push('Sustainability strategy integration')
    }
    
    if (assessmentData.ifrsS1.generalRequirements?.riskManagement) {
      s1Score += 25
    } else {
      s1Gaps.push('Sustainability risk management framework')
    }
    
    if (assessmentData.ifrsS1.generalRequirements?.metricsTargets) {
      s1Score += 25
    } else {
      s1Gaps.push('Sustainability metrics and targets')
    }
    
    readiness.standards.ifrsS1.score = s1Score
    readiness.standards.ifrsS1.gaps = s1Gaps
    readiness.standards.ifrsS1.status = s1Score >= 75 ? 'READY' : s1Score >= 50 ? 'IN_PROGRESS' : 'NOT_STARTED'
  } else {
    readiness.standards.ifrsS1.gaps = ['Complete IFRS S1 implementation required']
    readiness.timeline.immediate.push('Establish IFRS S1 governance and processes')
  }

  // IFRS S2 Readiness
  if (assessmentData?.ifrsS2) {
    let s2Score = 0
    const s2Gaps = []
    
    if (assessmentData.ifrsS2.climateRelatedRisks?.length > 0) {
      s2Score += 30
    } else {
      s2Gaps.push('Climate risk assessment')
    }
    
    if (assessmentData.ifrsS2.climateOpportunities?.length > 0) {
      s2Score += 20
    } else {
      s2Gaps.push('Climate opportunity identification')
    }
    
    if (assessmentData.ifrsS2.resilience?.analysis) {
      s2Score += 25
    } else {
      s2Gaps.push('Climate resilience analysis')
    }
    
    if (assessmentData.ifrsS2.metrics?.ghgEmissions) {
      s2Score += 25
    } else {
      s2Gaps.push('GHG emissions measurement and reporting')
    }
    
    readiness.standards.ifrsS2.score = s2Score
    readiness.standards.ifrsS2.gaps = s2Gaps
    readiness.standards.ifrsS2.status = s2Score >= 75 ? 'READY' : s2Score >= 50 ? 'IN_PROGRESS' : 'NOT_STARTED'
  } else {
    readiness.standards.ifrsS2.gaps = ['Complete IFRS S2 implementation required']
    readiness.timeline.immediate.push('Implement climate risk and opportunity assessment')
  }

  // IFRS S3-S7 Readiness (Proposed Standards)
  const proposedStandards = [
    { key: 'ifrsS3', name: 'Nature-related Risks' },
    { key: 'ifrsS4', name: 'Human Rights and Social' },
    { key: 'ifrsS5', name: 'Human Resource Management' },
    { key: 'ifrsS6', name: 'Pollution and Resources' },
    { key: 'ifrsS7', name: 'Circular Economy' }
  ]

  proposedStandards.forEach(standard => {
    if (assessmentData?.[standard.key]) {
      readiness.standards[standard.key as keyof typeof readiness.standards].score = 25
      readiness.standards[standard.key as keyof typeof readiness.standards].status = 'IN_PROGRESS'
      readiness.standards[standard.key as keyof typeof readiness.standards].gaps = [`${standard.name} framework partially implemented`]
      readiness.timeline.longTerm.push(`Complete ${standard.name} implementation`)
    } else {
      readiness.standards[standard.key as keyof typeof readiness.standards].gaps = [`${standard.name} assessment not started`]
      readiness.timeline.longTerm.push(`Prepare for ${standard.name} implementation`)
    }
  })

  // Calculate overall readiness
  const scores = Object.values(readiness.standards).map(s => s.score)
  readiness.overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  // Resource assessment
  const sector = project.organisation.sector?.toLowerCase() || ''
  if (sector.includes('energy') || sector.includes('utilities')) {
    readiness.resources.team = 'PARTIAL'
    readiness.timeline.shortTerm.push('Expand ESG team for climate focus')
  }

  return readiness
}

export const POST = withAuth(POSTHandler)
export const GET = withAuth(GETHandler)
