import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { userCanAccessProject } from '@/lib/project-auth'
import { buildStandardsReadiness } from '@/lib/standards/readiness'
import { getDemoProject, listDemoReports } from '@/lib/mvp-demo-store'
import { UserRole } from '@prisma/client'

const GETHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const projectId = params.id

    if (!request.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      const project = getDemoProject(projectId)
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const isPrivileged = request.user.role === UserRole.ADMIN || request.user.role === UserRole.AUDITOR
      if (!isPrivileged && project.createdBy !== request.user.userId) {
        return NextResponse.json({ error: 'Insufficient permissions for project' }, { status: 403 })
      }

      const generatedReports = listDemoReports(projectId).length
      const standards = [
        { standard: 'TCFD', coverageScore: project.scopeStructuredJson ? 70 : 20, status: project.scopeStructuredJson ? 'IN_PROGRESS' : 'NOT_STARTED', missingRequirements: ['Governance narrative', 'Scenario analysis'] },
        { standard: 'CSRD', coverageScore: project.scopeStructuredJson ? 65 : 15, status: project.scopeStructuredJson ? 'IN_PROGRESS' : 'NOT_STARTED', missingRequirements: ['Double materiality', 'ESRS datapoints'] },
        { standard: 'ISSB', coverageScore: project.scopeStructuredJson ? 60 : 10, status: project.scopeStructuredJson ? 'IN_PROGRESS' : 'NOT_STARTED', missingRequirements: ['IFRS S1 policy', 'IFRS S2 climate metrics'] },
        { standard: 'GRI', coverageScore: project.scopeStructuredJson ? 75 : 20, status: project.scopeStructuredJson ? 'IN_PROGRESS' : 'NOT_STARTED', missingRequirements: ['GRI 2 disclosures'] },
        { standard: 'SASB', coverageScore: 40, status: 'NOT_STARTED', missingRequirements: ['Industry mapping', 'SASB metric capture'] },
        { standard: 'RJC', coverageScore: 35, status: 'NOT_STARTED', missingRequirements: ['Chain-of-custody controls'] }
      ]

      const overallScore = Math.round(standards.reduce((acc, item) => acc + item.coverageScore, 0) / standards.length)

      return NextResponse.json({
        success: true,
        data: {
          projectId,
          overallScore,
          generatedReports,
          standards,
          nextSteps: standards
            .filter(s => s.status !== 'READY')
            .map(s => ({ standard: s.standard, missing: s.missingRequirements.slice(0, 3) }))
        }
      })
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
