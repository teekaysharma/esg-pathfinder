import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import ZAI from "z-ai-web-dev-sdk"

interface MaterialityRequest {
  projectId: string
  scopeData?: any
  customTopics?: string[]
}

interface MaterialityTopic {
  topic: string
  category: string
  financialImpact: number
  stakeholderImpact: number
  overallScore: number
  justification: string
  evidence: string[]
}

interface MaterialityResponse {
  matrix: MaterialityTopic[]
  categories: string[]
  methodology: string
  confidence: number
  recommendations: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json() as MaterialityRequest

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organisation: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Get project scope data
    const scopeData = body.scopeData || project.scopeStructuredJson || {}
    const rawScope = project.scopeRaw || ""

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create the system prompt for materiality analysis
    const systemPrompt = `You are an ESG materiality assessment expert. Your task is to analyze company scope and identify material ESG topics based on:
1. Financial impact to the business
2. Impact on stakeholders (environment, social, governance)
3. Regulatory requirements
4. Industry-specific risks and opportunities

For each topic, provide:
- Topic name and category (Environmental, Social, Governance)
- Financial impact score (0-10)
- Stakeholder impact score (0-10)
- Overall materiality score (0-10)
- Justification based on company activities and context
- Suggested evidence requirements

Output format must be JSON with the following structure:
{
  "topics": [
    {
      "topic": "Topic name",
      "category": "Environmental|Social|Governance",
      "financialImpact": number,
      "stakeholderImpact": number,
      "overallScore": number,
      "justification": "Detailed justification",
      "evidence": ["evidence1", "evidence2"]
    }
  ],
  "methodology": "Description of assessment methodology",
  "confidence": number,
  "recommendations": ["recommendation1", "recommendation2"]
}`

    // Create the user prompt with project information
    const userPrompt = `Please conduct a materiality assessment for the following project:

Project: ${project.name}
Organization: ${project.organisation.name}
Sector: ${project.organisation.sector || "Not specified"}
Country: ${project.organisation.country || "Not specified"}

Raw Scope:
${rawScope}

Structured Scope Data:
${JSON.stringify(scopeData, null, 2)}

Please analyze and identify the most material ESG topics for this organization, considering their specific activities, geographies, and industry context.`

    // Get AI completion
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

    // Parse the AI response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError)
      parsedResponse = createFallbackMaterialityResponse(project.organisation.sector)
    }

    // Format the response according to our interface
    const response: MaterialityResponse = {
      matrix: parsedResponse.topics?.map((topic: any) => ({
        topic: topic.topic || "Unknown Topic",
        category: topic.category || "Environmental",
        financialImpact: Math.max(0, Math.min(10, topic.financialImpact || 5)),
        stakeholderImpact: Math.max(0, Math.min(10, topic.stakeholderImpact || 5)),
        overallScore: Math.max(0, Math.min(10, topic.overallScore || 5)),
        justification: topic.justification || "No justification provided",
        evidence: topic.evidence || []
      })) || [],
      categories: ["Environmental", "Social", "Governance"],
      methodology: parsedResponse.methodology || "AI-powered materiality assessment based on company scope and industry context",
      confidence: parsedResponse.confidence || 0.7,
      recommendations: parsedResponse.recommendations || []
    }

    // Save materiality map to database
    const materialityMap = await db.materialityMap.create({
      data: {
        projectId: projectId,
        topics: response.matrix.map(t => t.topic),
        scores: response.matrix.map(t => t.overallScore),
        justification: response.matrix.map(t => t.justification)
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        actor: "system", // This should be the actual user ID
        action: "RUN_MATERIALITY",
        detailJson: {
          projectId,
          materialityMapId: materialityMap.id,
          topicsCount: response.matrix.length,
          methodology: response.methodology,
          confidence: response.confidence
        },
        projectId
      }
    })

    return NextResponse.json({
      success: true,
      data: response,
      message: "Materiality analysis completed successfully"
    })

  } catch (error) {
    console.error("Error running materiality analysis:", error)
    
    // Return a fallback response
    const fallbackResponse = createFallbackMaterialityResponse("")
    
    return NextResponse.json({
      success: true,
      data: fallbackResponse,
      message: "Materiality analysis completed with fallback assessment"
    })
  }
}

function createFallbackMaterialityResponse(sector: string): MaterialityResponse {
  // Industry-specific materiality topics as fallback
  const sectorTopics: Record<string, MaterialityTopic[]> = {
    technology: [
      {
        topic: "Data Privacy and Security",
        category: "Governance",
        financialImpact: 8,
        stakeholderImpact: 9,
        overallScore: 8.5,
        justification: "Critical for tech companies handling user data",
        evidence: ["Privacy policies", "Security audits", "Data breach reports"]
      },
      {
        topic: "Energy Consumption",
        category: "Environmental",
        financialImpact: 6,
        stakeholderImpact: 7,
        overallScore: 6.5,
        justification: "Data centers and operations consume significant energy",
        evidence: ["Energy usage reports", "Renewable energy procurement", "Carbon footprint"]
      }
    ],
    manufacturing: [
      {
        topic: "Occupational Health and Safety",
        category: "Social",
        financialImpact: 7,
        stakeholderImpact: 9,
        overallScore: 8,
        justification: "Critical for manufacturing operations",
        evidence: ["Safety incidents", "Training records", "Compliance audits"]
      },
      {
        topic: "Waste Management",
        category: "Environmental",
        financialImpact: 6,
        stakeholderImpact: 8,
        overallScore: 7,
        justification: "Manufacturing processes generate waste streams",
        evidence: ["Waste audits", "Recycling programs", "Hazardous waste disposal"]
      }
    ],
    default: [
      {
        topic: "Climate Change",
        category: "Environmental",
        financialImpact: 7,
        stakeholderImpact: 8,
        overallScore: 7.5,
        justification: "Universal material topic for all businesses",
        evidence: ["Carbon inventory", "Climate risk assessment", "Reduction targets"]
      },
      {
        topic: "Diversity and Inclusion",
        category: "Social",
        financialImpact: 6,
        stakeholderImpact: 8,
        overallScore: 7,
        justification: "Important for workforce and reputation",
        evidence: ["Workforce demographics", "D&I programs", "Pay equity analysis"]
      }
    ]
  }

  const topics = sectorTopics[sector.toLowerCase()] || sectorTopics.default

  return {
    matrix: topics,
    categories: ["Environmental", "Social", "Governance"],
    methodology: "Standard materiality assessment based on industry benchmarks",
    confidence: 0.6,
    recommendations: [
      "Focus on high-scoring topics for immediate action",
      "Develop data collection processes for evidence gathering",
      "Engage stakeholders to validate materiality assessment"
    ]
  }
}