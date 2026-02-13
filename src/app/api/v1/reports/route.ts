import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { UserRole } from '@prisma/client'

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId') || undefined

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
