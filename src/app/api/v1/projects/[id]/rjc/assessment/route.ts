import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { userCanAccessProject } from '@/lib/project-auth'

const rjcAssessmentSchema = z.object({
  governanceEthics: z.record(z.any()),
  chainOfCustody: z.record(z.any()),
  humanRightsAndLabor: z.record(z.any()),
  environmentalPerformance: z.record(z.any()),
  dueDiligence: z.record(z.any()),
  grievanceMechanism: z.record(z.any()).optional(),
  correctiveActions: z.array(z.object({
    action: z.string(),
    owner: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).default('OPEN')
  })).optional()
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

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = rjcAssessmentSchema.parse(body)

    const scoreDimensions = [
      validated.governanceEthics,
      validated.chainOfCustody,
      validated.humanRightsAndLabor,
      validated.environmentalPerformance,
      validated.dueDiligence,
    ]

    const completionScore = Math.min(
      100,
      Math.round((scoreDimensions.filter(Boolean).length / 5) * 100)
    )

    const record = await db.complianceCheck.create({
      data: {
        projectId,
        framework: 'RJC',
        requirement: 'RJC Code of Practices & Chain-of-Custody Assessment',
        status: completionScore >= 80 ? 'COMPLETED' : 'IN_PROGRESS',
        result: completionScore >= 80 ? 'PASS' : 'PARTIAL',
        evidence: 'See metadata payload and linked evidence artifacts',
        gapDescription: completionScore >= 80 ? undefined : 'Some RJC mandatory sections remain incomplete',
        remediation: completionScore >= 80 ? undefined : 'Complete missing sections and attach supporting evidence',
        priority: completionScore >= 80 ? 'LOW' : 'HIGH',
        metadata: {
          standard: 'RJC',
          completionScore,
          payload: validated,
          recordedBy: request.user.userId,
          recordedAt: new Date().toISOString()
        }
      }
    })

    await db.auditLog.create({
      data: {
        actor: request.user.userId,
        action: 'RJC_ASSESSMENT_RECORDED',
        detailJson: {
          projectId,
          complianceCheckId: record.id,
          completionScore,
        },
        projectId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        projectId,
        completionScore,
        status: record.status,
        result: record.result,
        assessment: validated,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('RJC assessment error:', error)
    return NextResponse.json({ error: 'Failed to process RJC assessment' }, { status: 500 })
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

    const latest = await db.complianceCheck.findFirst({
      where: {
        projectId,
        framework: 'RJC',
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!latest) {
      return NextResponse.json({ error: 'RJC assessment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: latest.id,
        projectId,
        status: latest.status,
        result: latest.result,
        completionScore: (latest.metadata as any)?.completionScore ?? 0,
        assessment: (latest.metadata as any)?.payload ?? null,
        createdAt: latest.createdAt,
        updatedAt: latest.updatedAt,
      }
    })
  } catch (error) {
    console.error('RJC assessment fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch RJC assessment' }, { status: 500 })
  }
}

export const POST = withAuth(POSTHandler)
export const GET = withAuth(GETHandler)
