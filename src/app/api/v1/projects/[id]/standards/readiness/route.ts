import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { userCanAccessProject } from '@/lib/project-auth'
import { buildStandardsReadiness } from '@/lib/standards/readiness'

const GETHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id

    if (!request.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await userCanAccessProject(request.user, projectId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions for project' }, { status: 403 })
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const [tcfd, csrd, issb, gri, sasb, dataPoints, complianceChecks, evidences, reports, workflows] = await Promise.all([
      db.tCFDAssessment.findUnique({ where: { projectId } }),
      db.cSRDAassessment.findUnique({ where: { projectId } }),
      db.iSSBAssessment.findUnique({ where: { projectId } }),
      db.gRIAssessment.findUnique({ where: { projectId } }),
      db.sASBAssessment.findUnique({ where: { projectId } }),
      db.eSGDataPoint.findMany({ where: { projectId }, select: { metricCode: true } }),
      db.complianceCheck.findMany({ where: { projectId }, select: { framework: true } }),
      db.evidence.count({ where: { projectId } }),
      db.report.count({ where: { projectId } }),
      db.workflow.count({ where: { projectId } })
    ])

    const readiness = buildStandardsReadiness({
      project,
      tcfd,
      csrd,
      issb,
      gri,
      sasb,
      dataPointCodes: dataPoints.map(d => d.metricCode),
      complianceFrameworks: complianceChecks.map(c => c.framework.toUpperCase()),
      evidenceCount: evidences,
      reportCount: reports,
      workflowCount: workflows
    })

    const overallScore = Math.round(
      readiness.reduce((acc, item) => acc + item.coverageScore, 0) / readiness.length
    )

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        overallScore,
        generatedReports: reports,
        standards: readiness,
        nextSteps: readiness
          .filter(s => s.status !== 'READY')
          .map(s => ({
            standard: s.standard,
            missing: s.missingRequirements.slice(0, 5)
          }))
      }
    })
  } catch (error) {
    console.error('Standards readiness error:', error)
    return NextResponse.json({ error: 'Failed to compute standards readiness' }, { status: 500 })
  }
}

export const GET = withAuth(GETHandler)
