import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  organisationId: z.string().min(1, "Organization ID is required"),
  description: z.string().optional(),
  scopeRaw: z.string().optional(),
  createdBy: z.string().min(1, "Creator ID is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Check if organization exists
    const organisation = await db.organisation.findUnique({
      where: { id: validatedData.organisationId }
    })

    if (!organisation) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.createdBy }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Create project
    const project = await db.project.create({
      data: {
        name: validatedData.name,
        organisationId: validatedData.organisationId,
        scopeRaw: validatedData.scopeRaw,
        createdBy: validatedData.createdBy,
        status: "DRAFT",
      },
      include: {
        organisation: true,
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          }
        }
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        actor: validatedData.createdBy,
        action: "CREATE_PROJECT",
        detailJson: {
          projectId: project.id,
          projectName: project.name,
          organisationId: validatedData.organisationId
        },
        projectId: project.id
      }
    })

    return NextResponse.json({
      success: true,
      data: project,
      message: "Project created successfully"
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organisationId = searchParams.get("organisationId")
    const userId = searchParams.get("userId")

    let whereClause = {}

    if (organisationId) {
      whereClause = { organisationId }
    } else if (userId) {
      whereClause = { createdBy: userId }
    }

    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        organisation: true,
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          }
        },
        _count: {
          select: {
            reports: true,
            evidences: true,
            materialityMaps: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      success: true,
      data: projects
    })

  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}