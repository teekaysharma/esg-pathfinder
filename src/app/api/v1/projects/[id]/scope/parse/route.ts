import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import ZAI from "z-ai-web-dev-sdk"
import { getDemoProject, updateDemoProject } from "@/lib/mvp-demo-store"

interface ScopeParseRequest {
  rawScope: string
  projectId: string
}

interface ParsedEntity {
  name: string
  type: string
  confidence: number
  suggestions: string[]
}

interface ParsedActivity {
  name: string
  type: string
  confidence: number
  suggestions: string[]
}

interface ParsedGeography {
  name: string
  type: string
  confidence: number
  suggestions: string[]
}

interface ParsedStandard {
  name: string
  type: string
  confidence: number
  clause: string
  suggestions: string[]
}

interface ScopeParseResponse {
  entities: ParsedEntity[]
  activities: ParsedActivity[]
  geographies: ParsedGeography[]
  standards: ParsedStandard[]
  confidence: number
  suggestedBoundaries: {
    geography: string[]
    activities: string[]
    entities: string[]
  }
}

const POSTHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id
    const body = await request.json() as ScopeParseRequest

    if (!body.rawScope) {
      return NextResponse.json(
        { error: "Raw scope is required" },
        { status: 400 }
      )
    }


    if (!process.env.DATABASE_URL) {
      const demoProject = getDemoProject(projectId)
      if (!demoProject) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        )
      }

      const fallback = createFallbackResponse(body.rawScope)
      updateDemoProject(projectId, {
        scopeRaw: body.rawScope,
        scopeStructuredJson: fallback as any
      })

      return NextResponse.json({
        success: true,
        data: fallback,
        message: "Scope parsed successfully (demo mode)"
      })
    }

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

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create the system prompt for scope parsing
    const systemPrompt = `You are the ESG Pathfinder mapping agent. Input: free-text company scope, location, sector, and optional attachments. Task: extract structured scope JSON {entities[], activities[], geographies[], timeframes[]} and map each extracted item to canonical ESG taxonomy entries (GRI topic IDs, SASB topics, or jurisdictional clause IDs). For each mapping include: mapping_id, mapping_label, confidence_score (0-1), match_evidence (text span or clause id), transform_rules_applied. If confidence < 0.75, include suggested user-editable alternatives (max 3). Provide a human-readable rationale sentence per mapping. Output strictly as JSON. Use the latest regulatory library and cite clause IDs where applicable. Do not hallucinate. If an item cannot be mapped, mark as unmapped and propose a best-effort standard term with low confidence.`

    // Create the user prompt with the raw scope
    const userPrompt = `Please analyze the following company scope and extract structured ESG information:

${body.rawScope}

Please provide a detailed analysis including:
1. Entities (companies, divisions, subsidiaries)
2. Activities (primary and supporting business activities)
3. Geographies (countries, regions where operations occur)
4. Applicable ESG standards and regulations
5. Suggested boundaries for the assessment

For each item, provide confidence scores and alternative suggestions.`

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
      max_tokens: 2000
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error("No response from AI")
    }

    // Parse the AI response (expecting JSON)
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      console.error("Failed to parse AI response as JSON:", parseError)
      parsedResponse = createFallbackResponse(body.rawScope)
    }

    // Format the response according to our interface
    const response: ScopeParseResponse = {
      entities: parsedResponse.entities?.map((entity: any) => ({
        name: entity.name || entity.mapping_label || "Unknown Entity",
        type: entity.type || "company",
        confidence: entity.confidence_score || 0.5,
        suggestions: entity.alternatives || [entity.name || "Unknown Entity"].slice(0, 3)
      })) || [],
      activities: parsedResponse.activities?.map((activity: any) => ({
        name: activity.name || activity.mapping_label || "Unknown Activity",
        type: activity.type || "primary",
        confidence: activity.confidence_score || 0.5,
        suggestions: activity.alternatives || [activity.name || "Unknown Activity"].slice(0, 3)
      })) || [],
      geographies: parsedResponse.geographies?.map((geo: any) => ({
        name: geo.name || geo.mapping_label || "Unknown Geography",
        type: geo.type || "country",
        confidence: geo.confidence_score || 0.5,
        suggestions: geo.alternatives || [geo.name || "Unknown Geography"].slice(0, 3)
      })) || [],
      standards: parsedResponse.standards?.map((standard: any) => ({
        name: standard.name || standard.mapping_label || "Unknown Standard",
        type: standard.type || "framework",
        confidence: standard.confidence_score || 0.5,
        clause: standard.clause_id || standard.match_evidence || "N/A",
        suggestions: standard.alternatives || [standard.name || "Unknown Standard"].slice(0, 3)
      })) || [],
      confidence: parsedResponse.overall_confidence || 0.7,
      suggestedBoundaries: {
        geography: parsedResponse.suggested_boundaries?.geography || [],
        activities: parsedResponse.suggested_boundaries?.activities || [],
        entities: parsedResponse.suggested_boundaries?.entities || []
      }
    }

    // Update project with raw scope
    await db.project.update({
      where: { id: projectId },
      data: {
        scopeRaw: body.rawScope,
        scopeStructuredJson: parsedResponse,
        boundariesJson: response.suggestedBoundaries
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        actor: "system", // This should be the actual user ID
        action: "PARSE_SCOPE",
        detailJson: {
          projectId,
          scopeLength: body.rawScope.length,
          entitiesCount: response.entities.length,
          activitiesCount: response.activities.length,
          geographiesCount: response.geographies.length,
          standardsCount: response.standards.length,
          overallConfidence: response.confidence
        },
        projectId
      }
    })

    return NextResponse.json({
      success: true,
      data: response,
      message: "Scope parsed successfully"
    })

  } catch (error) {
    console.error("Error parsing scope:", error)
    
    // Return a fallback response in case of AI errors
    const fallbackResponse = createFallbackResponse("")
    
    return NextResponse.json({
      success: true,
      data: fallbackResponse,
      message: "Scope parsed with fallback analysis (AI service unavailable)"
    })
  }
}

function createFallbackResponse(rawScope: string): ScopeParseResponse {
  // Basic keyword-based extraction as fallback
  const entities: ParsedEntity[] = []
  const activities: ParsedActivity[] = []
  const geographies: ParsedGeography[] = []
  const standards: ParsedStandard[] = []

  // Simple keyword matching for demonstration
  const keywords = {
    entities: ["corporation", "company", "inc", "ltd", "llc", "division"],
    activities: ["manufacturing", "software", "services", "retail", "technology"],
    geographies: ["united states", "europe", "asia", "global", "international"],
    standards: ["gri", "sasb", "tcfd", "csrd", "brsr"]
  }

  const text = rawScope.toLowerCase()

  // Extract entities
  keywords.entities.forEach(keyword => {
    if (text.includes(keyword)) {
      entities.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        type: "company",
        confidence: 0.6,
        suggestions: [keyword]
      })
    }
  })

  // Extract activities
  keywords.activities.forEach(keyword => {
    if (text.includes(keyword)) {
      activities.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        type: "primary",
        confidence: 0.6,
        suggestions: [keyword]
      })
    }
  })

  // Extract geographies
  keywords.geographies.forEach(keyword => {
    if (text.includes(keyword)) {
      geographies.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        type: "region",
        confidence: 0.6,
        suggestions: [keyword]
      })
    }
  })

  // Extract standards
  keywords.standards.forEach(keyword => {
    if (text.includes(keyword)) {
      standards.push({
        name: keyword.toUpperCase(),
        type: "framework",
        confidence: 0.6,
        clause: "General",
        suggestions: [keyword.toUpperCase()]
      })
    }
  })

  return {
    entities,
    activities,
    geographies,
    standards,
    confidence: 0.6,
    suggestedBoundaries: {
      geography: geographies.map(g => g.name),
      activities: activities.map(a => a.name),
      entities: entities.map(e => e.name)
    }
  }
}

export const POST = withAuth(POSTHandler)
