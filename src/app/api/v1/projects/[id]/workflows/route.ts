import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { z } from "zod"

const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  type: z.enum(["COMPLIANCE", "DATA_COLLECTION", "REVIEW", "APPROVAL", "AUDIT"]).default("COMPLIANCE"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    type: z.enum(["MANUAL", "AUTOMATED", "REVIEW", "APPROVAL"]).default("MANUAL"),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional()
  })).optional(),
  approvals: z.array(z.object({
    level: z.number().min(1),
    title: z.string().min(1, "Approval title is required"),
    description: z.string().optional(),
    assigneeId: z.string().optional()
  })).optional()
})

interface WorkflowRequest {
  projectId: string
  workflowData: z.infer<typeof workflowSchema>
  generateFromCompliance?: boolean
  framework?: string
}

interface WorkflowResponse {
  id: string
  projectId: string
  name: string
  description?: string
  type: string
  status: string
  assigneeId?: string
  dueDate?: string
  completedAt?: string
  tasks: any[]
  approvals: any[]
  createdAt: string
  updatedAt: string
}

const POSTHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id
    const body = await request.json() as WorkflowRequest

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

    let workflowData = body.workflowData

    // Generate workflow from compliance requirements if requested
    if (body.generateFromCompliance && body.framework) {
      workflowData = await generateWorkflowFromCompliance(project, body.framework)
    }

    // Validate workflow data
    const validatedData = workflowSchema.parse(workflowData)

    // Create workflow
    const workflow = await db.workflow.create({
      data: {
        projectId,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        assigneeId: validatedData.assigneeId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        status: "ACTIVE"
      }
    })

    // Create tasks if provided
    const createdTasks: any[] = []
    if (validatedData.tasks && validatedData.tasks.length > 0) {
      for (const taskData of validatedData.tasks) {
        const task = await db.workflowTask.create({
          data: {
            workflowId: workflow.id,
            title: taskData.title,
            description: taskData.description,
            type: taskData.type,
            assigneeId: taskData.assigneeId,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null
          }
        })
        createdTasks.push(task)
      }
    }

    // Create approvals if provided
    const createdApprovals: any[] = []
    if (validatedData.approvals && validatedData.approvals.length > 0) {
      for (const approvalData of validatedData.approvals) {
        const approval = await db.workflowApproval.create({
          data: {
            workflowId: workflow.id,
            level: approvalData.level,
            title: approvalData.title,
            description: approvalData.description,
            assigneeId: approvalData.assigneeId
          }
        })
        createdApprovals.push(approval)
      }
    }

    // Log the workflow creation
    await db.auditLog.create({
      data: {
        actor: "system", // This should be the actual user ID
        action: "WORKFLOW_CREATED",
        detailJson: {
          projectId,
          workflowId: workflow.id,
          workflowName: workflow.name,
          workflowType: workflow.type,
          tasksCount: createdTasks.length,
          approvalsCount: createdApprovals.length,
          generatedFromCompliance: body.generateFromCompliance,
          framework: body.framework
        },
        projectId
      }
    })

    const response: WorkflowResponse = {
      id: workflow.id,
      projectId: workflow.projectId,
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      status: workflow.status,
      assigneeId: workflow.assigneeId,
      dueDate: workflow.dueDate?.toISOString(),
      completedAt: workflow.completedAt?.toISOString(),
      tasks: createdTasks,
      approvals: createdApprovals,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "Workflow created successfully"
    })

  } catch (error) {
    console.error("Error creating workflow:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create workflow" },
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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")

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
    
    if (type) {
      whereClause.type = type
    }
    
    if (status) {
      whereClause.status = status
    }

    // Get workflows
    const workflows = await db.workflow.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        tasks: {
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
          orderBy: { createdAt: "asc" }
        },
        approvals: {
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
          orderBy: { level: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const response: WorkflowResponse[] = workflows.map(workflow => ({
      id: workflow.id,
      projectId: workflow.projectId,
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      status: workflow.status,
      assigneeId: workflow.assigneeId,
      dueDate: workflow.dueDate?.toISOString(),
      completedAt: workflow.completedAt?.toISOString(),
      tasks: workflow.tasks,
      approvals: workflow.approvals,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: response,
      count: response.length
    })

  } catch (error) {
    console.error("Error fetching workflows:", error)
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    )
  }
}

async function generateWorkflowFromCompliance(project: any, framework: string): Promise<any> {
  const workflows: Record<string, any> = {
    TCFD: {
      name: "TCFD Compliance Assessment",
      description: "Comprehensive TCFD framework compliance assessment workflow",
      type: "COMPLIANCE",
      tasks: [
        {
          title: "Governance Structure Assessment",
          description: "Assess board oversight and management responsibility for climate-related issues",
          type: "REVIEW"
        },
        {
          title: "Climate Risk and Opportunity Analysis",
          description: "Identify and assess climate-related risks and opportunities",
          type: "MANUAL"
        },
        {
          title: "Risk Management Process Review",
          description: "Review climate risk identification and management processes",
          type: "REVIEW"
        },
        {
          title: "Metrics and Targets Establishment",
          description: "Establish climate-related metrics and targets",
          type: "MANUAL"
        },
        {
          title: "TCFD Report Generation",
          description: "Generate comprehensive TCFD report",
          type: "AUTOMATED"
        }
      ],
      approvals: [
        {
          level: 1,
          title: "Sustainability Manager Review",
          description: "Review by sustainability manager"
        },
        {
          level: 2,
          title: "Board Committee Approval",
          description: "Approval by board sustainability committee"
        }
      ]
    },
    CSRD: {
      name: "CSRD Compliance Implementation",
      description: "CSRD (Corporate Sustainability Reporting Directive) compliance workflow",
      type: "COMPLIANCE",
      tasks: [
        {
          title: "Double Materiality Assessment",
          description: "Conduct double materiality assessment",
          type: "MANUAL"
        },
        {
          title: "ESRS Standards Gap Analysis",
          description: "Analyze gaps in ESRS reporting standards compliance",
          type: "REVIEW"
        },
        {
          title: "Sector-Specific Requirements Assessment",
          description: "Assess industry-specific CSRD requirements",
          type: "MANUAL"
        },
        {
          title: "Due Diligence Procedures Implementation",
          description: "Implement due diligence procedures",
          type: "MANUAL"
        },
        {
          title: "Data Collection System Setup",
          description: "Setup comprehensive data collection system",
          type: "MANUAL"
        },
        {
          title: "CSRD Report Preparation",
          description: "Prepare CSRD-compliant sustainability report",
          type: "AUTOMATED"
        }
      ],
      approvals: [
        {
          level: 1,
          title: "Compliance Officer Review",
          description: "Review by compliance officer"
        },
        {
          level: 2,
          title: "Executive Management Approval",
          description: "Approval by executive management"
        },
        {
          level: 3,
          title: "Board of Directors Approval",
          description: "Final approval by board of directors"
        }
      ]
    },
    SASB: {
      name: "SASB Standards Implementation",
      description: "SASB (Sustainability Accounting Standards Board) industry-specific standards workflow",
      type: "COMPLIANCE",
      tasks: [
        {
          title: "Industry Classification",
          description: "Determine correct SASB industry classification",
          type: "MANUAL"
        },
        {
          title: "Materiality Mapping",
          description: "Map SASB industry-specific material topics",
          type: "REVIEW"
        },
        {
          title: "Metric Calculation Setup",
          description: "Setup calculation methodologies for SASB metrics",
          type: "MANUAL"
        },
        {
          title: "Data Collection for SASB Metrics",
          description: "Collect data for SASB industry-specific metrics",
          type: "MANUAL"
        },
        {
          title: "SASB Report Generation",
          description: "Generate SASB-compliant report",
          type: "AUTOMATED"
        }
      ],
      approvals: [
        {
          level: 1,
          title: "Industry Analyst Review",
          description: "Review by industry analyst"
        },
        {
          level: 2,
          title: "Finance Department Approval",
          description: "Approval by finance department"
        }
      ]
    },
    GRI: {
      name: "GRI Standards Compliance",
      description: "GRI (Global Reporting Initiative) standards compliance workflow",
      type: "COMPLIANCE",
      tasks: [
        {
          title: "Material Topic Identification",
          description: "Identify material topics for GRI reporting",
          type: "MANUAL"
        },
        {
          title: "Stakeholder Engagement",
          description: "Conduct stakeholder engagement process",
          type: "MANUAL"
        },
        {
          title: "GRI Standards Mapping",
          description: "Map identified topics to GRI standards",
          type: "REVIEW"
        },
        {
          title: "Disclosures Preparation",
          description: "Prepare GRI standard disclosures",
          type: "MANUAL"
        },
        {
          title: "GRI Report Generation",
          description: "Generate GRI-compliant sustainability report",
          type: "AUTOMATED"
        }
      ],
      approvals: [
        {
          level: 1,
          title: "Sustainability Coordinator Review",
          description: "Review by sustainability coordinator"
        },
        {
          level: 2,
          title: "Senior Management Approval",
          description: "Approval by senior management"
        }
      ]
    }
  }

  const workflowTemplate = workflows[framework]
  
  if (!workflowTemplate) {
    throw new Error(`Unsupported framework: ${framework}`)
  }

  // Set due dates (30, 60, 90 days from now)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 90)

  return {
    ...workflowTemplate,
    dueDate: dueDate.toISOString(),
    // Add assignee IDs based on project context (in real implementation, this would be determined by user roles)
    tasks: workflowTemplate.tasks.map((task: any, index: number) => ({
      ...task,
      dueDate: new Date(dueDate.getTime() - (90 - (index * 15)) * 24 * 60 * 60 * 1000).toISOString()
    }))
  }
}

export const POST = withAuth(POSTHandler)
export const GET = withAuth(GETHandler)
