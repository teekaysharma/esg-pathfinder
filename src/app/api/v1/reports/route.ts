import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { UserRole } from '@prisma/client'
import { getDemoProject, listDemoReports } from '@/lib/local-mvp-store'

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId') || undefined


    if (!process.env.DATABASE_URL) {
      const demoReports = listDemoReports(projectId)
      const data = demoReports.map((report) => {
        const project = getDemoProject(report.projectId)
        return {
          ...report,
          project: {
            id: project?.id || report.projectId,
            name: project?.name || 'Demo Project',
            status: project?.status || 'DRAFT',
            organisation: {
              id: project?.organisationId || 'demo-org-1',
              name: project?.organisationName || 'ESG Pathfinder Demo Org'
            }
          }
        }
      })

      return NextResponse.json({ success: true, data })
    }

    const whereClause: Record<string, unknown> = {}

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.AUDITOR) {
      whereClause.project = {
        createdBy: req.user!.userId
      }
    }

    const reports = await db.report.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            organisation: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: reports
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
