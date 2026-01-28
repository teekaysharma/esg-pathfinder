import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import ZAI from "z-ai-web-dev-sdk"

interface ReportGenerationRequest {
  projectId: string
  format?: "json" | "xbrl" | "pdf" | "docx"
  includeXBRL?: boolean
  customSections?: string[]
  evidenceIds?: string[]
}

interface XBRLTag {
  concept: string
  contextRef: string
  unitRef?: string
  value: string | number
  decimals?: number
}

interface ReportSection {
  title: string
  content: string
  xbrlTags: XBRLTag[]
  evidenceReferences: string[]
  standardReferences: string[]
}

interface ReportResponse {
  reportId: string
  version: number
  content: {
    sections: ReportSection[]
    metadata: {
      generatedAt: string
      projectId: string
      organisation: string
      scope: any
      materiality: any
      standards: string[]
    }
  }
  xbrlContent?: string
  downloadUrls: {
    json?: string
    xbrl?: string
    pdf?: string
    docx?: string
  }
}

// XBRL Taxonomy mappings for ESG reporting
const XBRL_TAXONOMY = {
  // Environmental Concepts
  "ifrs-full:EnergyConsumption": {
    concept: "ifrs-full:EnergyConsumption",
    label: "Energy Consumption",
    dataType: "xbrli:decimalItemType",
    unitRef: "kWh"
  },
  "ifrs-full:GreenhouseGasEmissions": {
    concept: "ifrs-full:GreenhouseGasEmissions",
    label: "Greenhouse Gas Emissions",
    dataType: "xbrli:decimalItemType",
    unitRef: "MetricTonsCO2"
  },
  "ifrs-full:WaterWithdrawal": {
    concept: "ifrs-full:WaterWithdrawal",
    label: "Water Withdrawal",
    dataType: "xbrli:decimalItemType",
    unitRef: "CubicMeters"
  },
  "ifrs-full:WasteGenerated": {
    concept: "ifrs-full:WasteGenerated",
    label: "Waste Generated",
    dataType: "xbrli:decimalItemType",
    unitRef: "MetricTons"
  },
  
  // Social Concepts
  "ifrs-full:Employees": {
    concept: "ifrs-full:Employees",
    label: "Number of Employees",
    dataType: "xbrli:integerItemType"
  },
  "ifrs-full:TrainingHours": {
    concept: "ifrs-full:TrainingHours",
    label: "Training Hours",
    dataType: "xbrli:decimalItemType",
    unitRef: "Hours"
  },
  "ifrs-full:OccupationalInjuries": {
    concept: "ifrs-full:OccupationalInjuries",
    label: "Occupational Injuries",
    dataType: "xbrli:integerItemType"
  },
  
  // Governance Concepts
  "ifrs-full:BoardIndependence": {
    concept: "ifrs-full:BoardIndependence",
    label: "Board Independence Percentage",
    dataType: "xbrli:pureItemType"
  },
  "ifrs-full:FemaleBoardMembers": {
    concept: "ifrs-full:FemaleBoardMembers",
    label: "Female Board Members",
    dataType: "xbrli:integerItemType"
  },
  "ifrs-full:AntiCorruptionPolicies": {
    concept: "ifrs-full:AntiCorruptionPolicies",
    label: "Anti-Corruption Policies",
    dataType: "xbrli:booleanItemType"
  },
  
  // GRI Specific Concepts
  "gri:GRI_302_1_Energy": {
    concept: "gri:GRI_302_1_Energy",
    label: "Energy consumption within the organization",
    dataType: "xbrli:decimalItemType",
    unitRef: "GJ"
  },
  "gri:GRI_305_1_Direct_GHG": {
    concept: "gri:GRI_305_1_Direct_GHG",
    label: "Direct (Scope 1) GHG emissions",
    dataType: "xbrli:decimalItemType",
    unitRef: "MetricTonsCO2e"
  },
  "gri:GRI_403_1_Occupational_injuries": {
    concept: "gri:GRI_403_1_Occupational_injuries",
    label: "Occupational injuries",
    dataType: "xbrli:integerItemType"
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json() as ReportGenerationRequest

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organisation: true,
        materialityMaps: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        evidences: body.evidenceIds ? {
          where: {
            id: {
              in: body.evidenceIds
            }
          }
        } : true,
        reports: {
          orderBy: { version: "desc" },
          take: 1
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Get the latest report version
    const latestReport = project.reports[0]
    const newVersion = latestReport ? latestReport.version + 1 : 1

    // Generate report content using AI
    const reportContent = await generateReportContent(zai, project, body)

    // Generate XBRL content if requested
    let xbrlContent: string | undefined
    if (body.includeXBRL || body.format === "xbrl") {
      xbrlContent = await generateXBRLContent(reportContent, project)
    }

    // Save report to database
    const report = await db.report.create({
      data: {
        projectId: projectId,
        version: newVersion,
        contentJson: reportContent,
        xbrlContent: xbrlContent,
        generatorMeta: {
          format: body.format || "json",
          includeXBRL: body.includeXBRL || false,
          evidenceCount: project.evidences.length,
          sections: reportContent.sections.length,
          generatedBy: "ai"
        }
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        actor: "system", // This should be the actual user ID
        action: "GENERATE_REPORT",
        detailJson: {
          projectId,
          reportId: report.id,
          version: newVersion,
          format: body.format,
          includeXBRL: body.includeXBRL,
          sectionsCount: reportContent.sections.length,
          evidenceCount: project.evidences.length
        },
        projectId
      }
    })

    // Prepare response
    const response: ReportResponse = {
      reportId: report.id,
      version: newVersion,
      content: reportContent,
      xbrlContent: xbrlContent,
      downloadUrls: {
        json: `/api/v1/reports/${report.id}/download/json`,
        xbrl: xbrlContent ? `/api/v1/reports/${report.id}/download/xbrl` : undefined,
        pdf: `/api/v1/reports/${report.id}/download/pdf`,
        docx: `/api/v1/reports/${report.id}/download/docx`
      }
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "Report generated successfully with XBRL tagging"
    })

  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

async function generateReportContent(zai: any, project: any, request: ReportGenerationRequest) {
  const materialityData = project.materialityMaps[0]
  const scopeData = project.scopeStructuredJson || {}
  const evidenceData = project.evidences || []

  const systemPrompt = `You are an ESG reporting expert specializing in creating audit-ready reports with proper XBRL tagging. Your task is to generate a comprehensive ESG report that includes:

1. Executive Summary
2. Scope and Boundaries
3. Materiality Assessment Results
4. Environmental Performance
5. Social Performance  
6. Governance Performance
7. Standards Compliance
8. Evidence and Data Sources
9. Recommendations and Next Steps

For each section, provide:
- Detailed content with proper citations
- XBRL tag suggestions for key metrics and disclosures
- Evidence references
- Standard clause references
- Confidence levels for data points

Output format must be JSON with the following structure:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed section content...",
      "xbrlTags": [
        {
          "concept": "ifrs-full:ConceptName",
          "contextRef": "Current",
          "unitRef": "Unit",
          "value": "numeric_value",
          "decimals": 0
        }
      ],
      "evidenceReferences": ["evidence_id_1", "evidence_id_2"],
      "standardReferences": ["GRI_302_1", "SASB_TC_AC_130a"]
    }
  ],
  "metadata": {
    "generatedAt": "timestamp",
    "projectId": "project_id",
    "organisation": "organisation_name",
    "scope": {...},
    "materiality": {...},
    "standards": ["GRI", "SASB", "TCFD"]
  }
}`

  const userPrompt = `Generate a comprehensive ESG report for the following project:

Project: ${project.name}
Organization: ${project.organisation.name}
Sector: ${project.organisation.sector || "Not specified"}
Country: ${project.organisation.country || "Not specified"}
Report Version: ${request.format || "comprehensive"}

Scope Data:
${JSON.stringify(scopeData, null, 2)}

Materiality Assessment:
${materialityData ? JSON.stringify({
  topics: materialityData.topics,
  scores: materialityData.scores,
  justification: materialityData.justification
}, null, 2) : "No materiality assessment available"}

Available Evidence (${evidenceData.length} items):
${evidenceData.map((e: any) => `- ${e.fileUrl} (Clauses: ${JSON.parse(e.clauseRefs || "[]").join(", ")})`).join("\n")}

Please generate a professional, audit-ready ESG report with appropriate XBRL tagging for all material metrics and disclosures.`

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

  let reportContent: any
  try {
    reportContent = JSON.parse(aiResponse)
  } catch (parseError) {
    console.error("Failed to parse AI response as JSON:", parseError)
    reportContent = createFallbackReportContent(project, materialityData)
  }

  // Enhance XBRL tags with proper taxonomy mappings
  reportContent.sections = reportContent.sections?.map((section: any) => ({
    ...section,
    xbrlTags: section.xbrlTags?.map((tag: any) => enhanceXBRLTag(tag)) || []
  })) || []

  return reportContent
}

function enhanceXBRLTag(tag: XBRLTag): XBRLTag {
  const taxonomyMapping = XBRL_TAXONOMY[tag.concept as keyof typeof XBRL_TAXONOMY]
  
  if (taxonomyMapping) {
    return {
      ...tag,
      concept: taxonomyMapping.concept,
      unitRef: tag.unitRef || taxonomyMapping.unitRef
    }
  }
  
  return tag
}

async function generateXBRLContent(reportContent: any, project: any): Promise<string> {
  // Generate XBRL instance document
  const xbrlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<xbrl xmlns="http://www.xbrl.org/2003/instance"
      xmlns:ifrs-full="http://xbrl.ifrs.org/taxonomy/2023-03-31/ifrs-full"
      xmlns:gri="http://www.globalreporting.org/taxonomy/2023"
      xmlns:xbrli="http://www.xbrl.org/2003/instance"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.xbrl.org/2003/instance http://www.xbrl.org/2003/xbrl-instance-2003-12-31.xsd">

  <!-- Context Definitions -->
  <context id="Current">
    <entity>
      <identifier scheme="http://www.esg-pathfinder.com">${project.organisation.name}</identifier>
    </entity>
    <period>
      <instant>${new Date().toISOString().split('T')[0]}</instant>
    </period>
  </context>

  <!-- Unit Definitions -->
  <unit id="kWh">
    <measure>xbrli:kilowattHour</measure>
  </unit>
  <unit id="MetricTonsCO2">
    <measure>xbrli:kilogram</measure>
    <divide>
      <unit numerator="xbrli:kilogram" />
      <unit denominator="xbrli:kilogram" />
    </divide>
  </unit>
  <unit id="CubicMeters">
    <measure>xbrli:cubicMetre</measure>
  </unit>
  <unit id="Hours">
    <measure>xbrli:hour</measure>
  </unit>
  <unit id="Pure">
    <measure>xbrli:pure</measure>
  </unit>

`

  let xbrlFacts = ""

  // Generate XBRL facts from report sections
  reportContent.sections?.forEach((section: any) => {
    section.xbrlTags?.forEach((tag: XBRLTag) => {
      const taxonomyMapping = XBRL_TAXONOMY[tag.concept as keyof typeof XBRL_TAXONOMY]
      if (taxonomyMapping) {
        xbrlFacts += `  <!-- ${section.title} - ${taxonomyMapping.label} -->
  <${taxonomyMapping.concept} contextRef="${tag.contextRef || "Current"}" unitRef="${tag.unitRef || "Pure"}" decimals="${tag.decimals || "0"}">${tag.value}</${taxonomyMapping.concept}>

`
      }
    })
  })

  const xbrlFooter = `</xbrl>`

  return xbrlHeader + xbrlFacts + xbrlFooter
}

function createFallbackReportContent(project: any, materialityData: any) {
  return {
    sections: [
      {
        title: "Executive Summary",
        content: `This ESG report for ${project.organisation.name} provides a comprehensive overview of environmental, social, and governance performance. The assessment covers key material topics relevant to the ${project.organisation.sector || "business"} sector.`,
        xbrlTags: [],
        evidenceReferences: [],
        standardReferences: ["GRI_102_1", "GRI_102_3"]
      },
      {
        title: "Scope and Boundaries",
        content: "The scope of this report includes all operations of the organization within the defined geographical boundaries and business activities.",
        xbrlTags: [],
        evidenceReferences: [],
        standardReferences: ["GRI_102_2", "GRI_102_5"]
      },
      {
        title: "Materiality Assessment",
        content: "Based on the assessment, key material topics have been identified and prioritized based on their impact on stakeholders and the business.",
        xbrlTags: [],
        evidenceReferences: [],
        standardReferences: ["GRI_102_4", "GRI_102_5"]
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      projectId: project.id,
      organisation: project.organisation.name,
      scope: project.scopeStructuredJson || {},
      materiality: materialityData || {},
      standards: ["GRI", "SASB"]
    }
  }
}