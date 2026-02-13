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
      totalOrganisations,
      tcfdAssessments,
      csrdAssessments,
      griAssessments,
      issbAssessments,
      sasbAssessments,
      dataPoints,
      complianceChecks
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
      db.organisation.count(),
      db.tCFDAssessment.count(),
      db.cSRDAassessment.count(),
      db.gRIAssessment.count(),
      db.iSSBAssessment.count(),
      db.sASBAssessment.count(),
      db.eSGDataPoint.count(),
      db.complianceCheck.count()
    ])

    // Calculate ESG-specific metrics
    const esgDataPointsByCategory = await db.eSGDataPoint.groupBy({
      by: ['category'],
      _count: true
    })

    const complianceChecksByStatus = await db.complianceCheck.groupBy({
      by: ['status'],
      _count: true
    })

    const recentActivity = await db.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    const stats = {
      // System metrics
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalReports,
      totalOrganisations,
      systemUptime: "99.9%", // This would be calculated from actual monitoring data
      databaseSize: "2.4 GB", // This would be fetched from database metrics
      lastBackup: new Date().toISOString(), // This would be fetched from backup system
      
      // ESG Framework Assessments
      esgAssessments: {
        tcfd: tcfdAssessments,
        csrd: csrdAssessments,
        gri: griAssessments,
        issb: issbAssessments,
        sasb: sasbAssessments,
        total: tcfdAssessments + csrdAssessments + griAssessments + issbAssessments + sasbAssessments
      },
      
      // Data Points
      dataPoints: {
        total: dataPoints,
        byCategory: esgDataPointsByCategory.reduce((acc, item) => {
          acc[item.category] = item._count
          return acc
        }, {} as Record<string, number>)
      },
      
      // Compliance
      complianceChecks: {
        total: complianceChecks,
        byStatus: complianceChecksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>)
      },
      
      // Recent Activity
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        user: log.user.name,
        action: log.action,
        detail: log.detailJson,
        timestamp: log.timestamp
      }))
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

export const GET = withAdminAuth()(handler)