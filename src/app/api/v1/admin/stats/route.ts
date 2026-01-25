import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware'

async function handler(req: AuthenticatedRequest) {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalReports,
      totalOrganisations
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          isActive: true
        }
      }),
      db.project.count(),
      db.project.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      db.report.count(),
      db.organisation.count()
    ])

    const stats = {
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalReports,
      totalOrganisations,
      systemUptime: "99.9%", // This would be calculated from actual monitoring data
      databaseSize: "2.4 GB", // This would be fetched from database metrics
      lastBackup: new Date().toISOString() // This would be fetched from backup system
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system stats' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handler)