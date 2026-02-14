import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { userCanAccessProject } from '@/lib/project-auth'

const sasbAssessmentSchema = z.object({
  industry: z.string().min(1),
  standards: z.record(z.any()),
  metrics: z.record(z.any()),
  disclosures: z.record(z.any()),
  benchmarkData: z.record(z.any()).optional(),
  gapAnalysis: z.record(z.any()).optional()
})

const POSTHandler = async (
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

    const body = await request.json()
    const validated = sasbAssessmentSchema.parse(body)

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const metricsCount = Object.keys(validated.metrics || {}).length
    const disclosuresCount = Object.keys(validated.disclosures || {}).length
    const overallScore = Math.min(100, Math.round((metricsCount + disclosuresCount) * 2.5))

    const assessment = await db.sASBAssessment.upsert({
      where: { projectId },
      update: {
        industry: validated.industry,
        standards: validated.standards,
        metrics: validated.metrics,
        disclosures: validated.disclosures,
        benchmarkData: validated.benchmarkData || {},
        gapAnalysis: validated.gapAnalysis || {},
        overallScore
      },
      create: {
        projectId,
        industry: validated.industry,
        standards: validated.standards,
        metrics: validated.metrics,
        disclosures: validated.disclosures,
        benchmarkData: validated.benchmarkData || {},
        gapAnalysis: validated.gapAnalysis || {},
        overallScore
      }
    })

    await db.auditLog.create({
      data: {
        actor: request.user.userId,
        action: 'SASB_ASSESSMENT_UPDATED',
        detailJson: {
          projectId,
          assessmentId: assessment.id,
          industry: assessment.industry,
          overallScore
        },
        projectId
      }
    })

    return NextResponse.json({ success: true, data: assessment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('SASB assessment error:', error)
    return NextResponse.json({ error: 'Failed to process SASB assessment' }, { status: 500 })
  }
}

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

    const assessment = await db.sASBAssessment.findUnique({ where: { projectId } })
    if (!assessment) {
      return NextResponse.json({ error: 'SASB assessment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: assessment })
  } catch (error) {
    console.error('SASB assessment fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch SASB assessment' }, { status: 500 })
  }
}

export const POST = withAuth(POSTHandler)
export const GET = withAuth(GETHandler)
