import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip: offset,
        take: limit
      }),
      db.auditLog.count()
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth()(handler)