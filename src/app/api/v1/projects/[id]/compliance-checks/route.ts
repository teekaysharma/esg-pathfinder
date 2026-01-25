import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const complianceCheckSchema = z.object({
  framework: z.string().min(1, "Framework is required"),
  requirement: z.string().min(1, "Requirement is required"),
  result: z.enum(["PASS", "FAIL", "PARTIAL", "NOT_APPLICABLE"]).optional(),
  evidence: z.string().optional(),
  gapDescription: z.string().optional(),
  remediation: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional()
})

const bulkComplianceChecksSchema = z.object({
  checks: z.array(complianceCheckSchema)
})

interface ComplianceCheckRequest {
  projectId: string
  checkData?: z.infer<typeof complianceCheckSchema>
  bulkChecks?: z.infer<typeof bulkComplianceChecksSchema>
  generateFromFramework?: boolean
  framework?: string
}

interface ComplianceCheckResponse {
  id: string
  projectId: string
  framework: string
  requirement: string
  status: string
  result?: string
  evidence?: string
  gapDescription?: string
  remediation?: string
  priority: string
  assigneeId?: string
  dueDate?: string
  completedAt?: string
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
    const body = await request.json() as ComplianceCheckRequest

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

    let createdChecks: ComplianceCheckResponse[] = []

    // Handle bulk compliance checks creation
    if (body.bulkChecks) {
      const validatedData = bulkComplianceChecksSchema.parse(body.bulkChecks)
      
      for (const checkData of validatedData.checks) {
        const created = await createSingleComplianceCheck(projectId, checkData)
        createdChecks.push(created)
      }

      // Log the bulk action
      await db.auditLog.create({
        data: {
          actor: "system", // This should be the actual user ID
          action: "BULK_COMPLIANCE_CHECKS_CREATED",
          detailJson: {
            projectId,
            count: createdChecks.length,
            frameworks: [...new Set(createdChecks.map(check => check.framework))]
          },
          projectId
        }
      })

      return NextResponse.json({
        success: true,
        data: createdChecks,
        message: `Successfully created ${createdChecks.length} compliance checks`
      })
    }

    // Handle single compliance check creation
    if (body.checkData) {
      const validatedData = complianceCheckSchema.parse(body.checkData)
      const created = await createSingleComplianceCheck(projectId, validatedData)
      createdChecks.push(created)

      // Log the action
      await db.auditLog.create({
        data: {
          actor: "system", // This should be the actual user ID
          action: "COMPLIANCE_CHECK_CREATED",
          detailJson: {
            projectId,
            checkId: created.id,
            framework: created.framework,
            requirement: created.requirement
          },
          projectId
        }
      })

      return NextResponse.json({
        success: true,
        data: created,
        message: "Compliance check created successfully"
      })
    }

    // Generate compliance checks from framework if requested
    if (body.generateFromFramework && body.framework) {
      const generatedChecks = await generateComplianceChecksFromFramework(project, body.framework)
      
      for (const checkData of generatedChecks) {
        const created = await createSingleComplianceCheck(projectId, checkData)
        createdChecks.push(created)
      }

      // Log the action
      await db.auditLog.create({
        data: {
          actor: "system", // This should be the actual user ID
          action: "COMPLIANCE_CHECKS_GENERATED",
          detailJson: {
            projectId,
            count: createdChecks.length,
            framework: body.framework
          },
          projectId
        }
      })

      return NextResponse.json({
        success: true,
        data: createdChecks,
        message: `Generated ${createdChecks.length} compliance checks for ${body.framework}`
      })
    }

    return NextResponse.json(
      { error: "No valid data provided" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error creating compliance checks:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create compliance checks" },
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
    const framework = searchParams.get("framework")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

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
    
    if (framework) {
      whereClause.framework = framework
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (priority) {
      whereClause.priority = priority
    }

    // Get compliance checks
    const complianceChecks = await db.complianceCheck.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" }
      ]
    })

    const response: ComplianceCheckResponse[] = complianceChecks.map(check => ({
      id: check.id,
      projectId: check.projectId,
      framework: check.framework,
      requirement: check.requirement,
      status: check.status,
      result: check.result,
      evidence: check.evidence,
      gapDescription: check.gapDescription,
      remediation: check.remediation,
      priority: check.priority,
      assigneeId: check.assigneeId,
      dueDate: check.dueDate?.toISOString(),
      completedAt: check.completedAt?.toISOString(),
      metadata: check.metadata,
      createdAt: check.createdAt.toISOString(),
      updatedAt: check.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: response,
      count: response.length
    })

  } catch (error) {
    console.error("Error fetching compliance checks:", error)
    return NextResponse.json(
      { error: "Failed to fetch compliance checks" },
      { status: 500 }
    )
  }
}

async function createSingleComplianceCheck(projectId: string, checkData: any): Promise<ComplianceCheckResponse> {
  const created = await db.complianceCheck.create({
    data: {
      projectId,
      framework: checkData.framework,
      requirement: checkData.requirement,
      result: checkData.result,
      evidence: checkData.evidence,
      gapDescription: checkData.gapDescription,
      remediation: checkData.remediation,
      priority: checkData.priority,
      assigneeId: checkData.assigneeId,
      dueDate: checkData.dueDate ? new Date(checkData.dueDate) : null,
      status: checkData.result ? "COMPLETED" : "PENDING",
      completedAt: checkData.result ? new Date() : null,
      metadata: {
        ...checkData.metadata,
        createdAt: new Date().toISOString()
      }
    }
  })

  return {
    id: created.id,
    projectId: created.projectId,
    framework: created.framework,
    requirement: created.requirement,
    status: created.status,
    result: created.result,
    evidence: created.evidence,
    gapDescription: created.gapDescription,
    remediation: created.remediation,
    priority: created.priority,
    assigneeId: created.assigneeId,
    dueDate: created.dueDate?.toISOString(),
    completedAt: created.completedAt?.toISOString(),
    metadata: created.metadata,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString()
  }
}

async function generateComplianceChecksFromFramework(project: any, framework: string): Promise<any[]> {
  const complianceChecks: any[] = []
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 60) // 60 days from now

  const frameworkRequirements: Record<string, any[]> = {
    TCFD: [
      {
        requirement: "Board oversight of climate-related risks and opportunities",
        priority: "HIGH",
        category: "Governance"
      },
      {
        requirement: "Management's role in assessment and management of climate-related risks",
        priority: "HIGH",
        category: "Governance"
      },
      {
        requirement: "Identification and assessment of climate-related risks",
        priority: "HIGH",
        category: "Risk Management"
      },
      {
        requirement: "Identification and assessment of climate-related opportunities",
        priority: "MEDIUM",
        category: "Strategy"
      },
      {
        requirement: "Processes for managing climate-related risks",
        priority: "HIGH",
        category: "Risk Management"
      },
      {
        requirement: "Metrics used to assess climate-related risks",
        priority: "MEDIUM",
        category: "Metrics & Targets"
      },
      {
        requirement: "Scope 1 and Scope 2 GHG emissions",
        priority: "HIGH",
        category: "Metrics & Targets"
      },
      {
        requirement: "Targets used to manage climate-related risks",
        priority: "MEDIUM",
        category: "Metrics & Targets"
      }
    ],
    CSRD: [
      {
        requirement: "Double materiality assessment conducted",
        priority: "CRITICAL",
        category: "General"
      },
      {
        requirement: "ESRS 1 General requirements disclosure",
        priority: "HIGH",
        category: "General"
      },
      {
        requirement: "ESRS 2 Climate change disclosures",
        priority: "HIGH",
        category: "Environmental"
      },
      {
        requirement: "ESRS 2 Pollution disclosures",
        priority: "MEDIUM",
        category: "Environmental"
      },
      {
        requirement: "ESRS 2 Water and marine resources disclosures",
        priority: "MEDIUM",
        category: "Environmental"
      },
      {
        requirement: "ESRS 2 Biodiversity and ecosystems disclosures",
        priority: "MEDIUM",
        category: "Environmental"
      },
      {
        requirement: "ESRS 2 Circular economy disclosures",
        priority: "MEDIUM",
        category: "Environmental"
      },
      {
        requirement: "ESRS 3 Own workforce disclosures",
        priority: "HIGH",
        category: "Social"
      },
      {
        requirement: "ESRS 3 Workers in value chain disclosures",
        priority: "MEDIUM",
        category: "Social"
      },
      {
        requirement: "ESRS 3 Affected communities disclosures",
        priority: "MEDIUM",
        category: "Social"
      },
      {
        requirement: "ESRS 3 Consumers disclosures",
        priority: "MEDIUM",
        category: "Social"
      },
      {
        requirement: "ESRS 5 Business conduct disclosures",
        priority: "MEDIUM",
        category: "Governance"
      },
      {
        requirement: "Due diligence processes implemented",
        priority: "HIGH",
        category: "Due Diligence"
      },
      {
        requirement: "Sector-specific requirements addressed",
        priority: "HIGH",
        category: "Sector-Specific"
      }
    ],
    SASB: [
      {
        requirement: "Material topics identified for industry",
        priority: "HIGH",
        category: "Materiality"
      },
      {
        requirement: "Industry-specific metrics calculated",
        priority: "HIGH",
        category: "Metrics"
      },
      {
        requirement: "Financial impact of sustainability issues disclosed",
        priority: "MEDIUM",
        category: "Disclosure"
      },
      {
        requirement: "SASB standards mapping completed",
        priority: "MEDIUM",
        category: "Mapping"
      },
      {
        requirement: "Industry benchmark data included",
        priority: "LOW",
        category: "Benchmarking"
      }
    ],
    GRI: [
      {
        requirement: "Material topics identification process",
        priority: "HIGH",
        category: "Materiality"
      },
      {
        requirement: "Stakeholder engagement process",
        priority: "MEDIUM",
        category: "Stakeholders"
      },
      {
        requirement: "GRI 101 Foundation disclosures",
        priority: "HIGH",
        category: "General"
      },
      {
        requirement: "GRI 102 General disclosures",
        priority: "HIGH",
        category: "General"
      },
      {
        requirement: "GRI 103 Management approach",
        priority: "MEDIUM",
        category: "Management"
      },
      {
        requirement: "GRI 200 Environmental disclosures",
        priority: "HIGH",
        category: "Environmental"
      },
      {
        requirement: "GRI 300 Social disclosures",
        priority: "HIGH",
        category: "Social"
      },
      {
        requirement: "GRI 400 Economic disclosures",
        priority: "MEDIUM",
        category: "Economic"
      }
    ]
  }

  const requirements = frameworkRequirements[framework]
  
  if (!requirements) {
    throw new Error(`Unsupported framework: ${framework}`)
  }

  // Generate compliance checks for each requirement
  for (const req of requirements) {
    complianceChecks.push({
      framework,
      requirement: req.requirement,
      priority: req.priority,
      dueDate: dueDate.toISOString(),
      metadata: {
        category: req.category,
        generated: true,
        framework,
        generatedAt: new Date().toISOString()
      }
    })
  }

  // Add industry-specific requirements based on project sector
  const sector = project.organisation.sector?.toLowerCase() || ""
  
  if (sector.includes("energy") || sector.includes("utilities")) {
    complianceChecks.push({
      framework,
      requirement: "Energy-specific climate risk assessment completed",
      priority: "HIGH",
      dueDate: dueDate.toISOString(),
      metadata: {
        category: "Industry-Specific",
        generated: true,
        sectorSpecific: true,
        generatedAt: new Date().toISOString()
      }
    })
  }

  if (sector.includes("financial") || sector.includes("banking")) {
    complianceChecks.push({
      framework,
      requirement: "Financial sector climate risk disclosures",
      priority: "HIGH",
      dueDate: dueDate.toISOString(),
      metadata: {
        category: "Industry-Specific",
        generated: true,
        sectorSpecific: true,
        generatedAt: new Date().toISOString()
      }
    })
  }

  if (sector.includes("manufacturing")) {
    complianceChecks.push({
      framework,
      requirement: "Manufacturing supply chain climate disclosures",
      priority: "MEDIUM",
      dueDate: dueDate.toISOString(),
      metadata: {
        category: "Industry-Specific",
        generated: true,
        sectorSpecific: true,
        generatedAt: new Date().toISOString()
      }
    })
  }

  return complianceChecks
}