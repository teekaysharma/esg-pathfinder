import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { UserRole } from "@prisma/client"
import { createProjectSchema, querySchemas } from "@/lib/validations"
import { Logger, handleApiError, createError, withRequestTiming } from "@/lib/logger"
import { userCanCreateForOrganisation } from "@/lib/project-auth"
import { createDemoProject, listDemoProjects } from '@/lib/mvp-demo-store'

const logger = new Logger('PROJECTS_API')

const createProjectHandler = withRequestTiming(async (req: AuthenticatedRequest) => {
  const requestId = logger.logAPIRequest(req, req.user?.userId)
  const startTime = Date.now()

  try {
    const body = await req.json()
    const validatedData = createProjectSchema.parse(body)


    if (!process.env.DATABASE_URL) {
      const project = createDemoProject({
        name: validatedData.name,
        organisationId: validatedData.organisationId,
        createdBy: req.user!.userId,
        scopeRaw: validatedData.scopeRaw
      })

      return NextResponse.json({
        success: true,
        data: {
          ...project,
          organisation: { id: project.organisationId, name: project.organisationName },
          creator: {
            id: req.user!.userId,
            email: req.user!.email,
            name: req.user!.email.split('@')[0],
            role: req.user!.role
          }
        },
        message: 'Project created successfully (demo mode)'
      })
    }

    logger.info('Creating project', { 
      projectName: validatedData.name, 
      organisationId: validatedData.organisationId 
    })

    // Check if organization exists
    const organisation = await db.organisation.findUnique({
      where: { id: validatedData.organisationId }
    })

    if (!organisation) {
      throw createError.notFound('Organization', validatedData.organisationId)
    }

    const canCreate = await userCanCreateForOrganisation(req.user!, validatedData.organisationId)
    if (!canCreate) {
      return NextResponse.json(
        { error: "Insufficient permissions for organization" },
        { status: 403 }
      )
    }

    // Create project with authenticated user as creator
    const project = await db.project.create({
      data: {
        name: validatedData.name,
        organisationId: validatedData.organisationId,
        scopeRaw: validatedData.scopeRaw,
        createdBy: req.user!.userId,
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
        actor: req.user!.userId,
        action: "CREATE_PROJECT",
        detailJson: {
          projectId: project.id,
          projectName: project.name,
          organisationId: validatedData.organisationId
        },
        projectId: project.id
      }
    })

    logger.logBusinessEvent('PROJECT_CREATED', {
      projectId: project.id,
      projectName: project.name,
      userId: req.user!.userId
    })

    const response = NextResponse.json({
      success: true,
      data: project,
      message: "Project created successfully"
    })

    logger.logAPIResponse(req, 201, Date.now() - startTime)
    return response

  } catch (error) {
    return handleApiError(error, 'CREATE_PROJECT', requestId, req.user?.userId)
  }
}, logger)

export const POST = withAuth(createProjectHandler)

const getProjectsHandler = async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    
    // Validate query parameters
    const queryValidation = querySchemas.projects.safeParse(Object.fromEntries(searchParams))
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryValidation.error.errors },
        { status: 400 }
      )
    }
    
    const { organisationId, userId, page, limit } = queryValidation.data


    if (!process.env.DATABASE_URL) {
      const projects = listDemoProjects(req.user!.userId, req.user!.role)
      return NextResponse.json({
        success: true,
        data: projects.map((p) => ({
          ...p,
          organisation: { id: p.organisationId, name: p.organisationName },
          creator: {
            id: p.createdBy,
            email: req.user!.email,
            name: req.user!.email.split('@')[0],
            role: req.user!.role
          },
          _count: { reports: 0, evidences: 0, materialityMaps: 0 }
        })),
        pagination: {
          page,
          limit,
          total: projects.length,
          pages: 1
        }
      })
    }


    let whereClause = {}

    // Users can only see their own projects unless they're admins or auditors
    if (req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.AUDITOR) {
      if (organisationId) {
        whereClause = { organisationId }
      } else if (userId) {
        whereClause = { createdBy: userId }
      }
    } else {
      // Regular users can only see their own projects
      whereClause = { createdBy: req.user!.userId }
    }

    const [projects, totalCount] = await Promise.all([
      db.project.findMany({
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
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.project.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getProjectsHandler)