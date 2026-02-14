import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { UserRole } from '@prisma/client'
import { getDemoProject, getDemoReport } from '@/lib/mvp-demo-store'

const mimeByFormat: Record<string, string> = {
  json: 'application/json',
  xbrl: 'application/xml',
  xml: 'application/xml'
}

const extensionByFormat: Record<string, string> = {
  json: 'json',
  xbrl: 'xbrl',
  xml: 'xml'
}

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string; format: string }> }
) {
  try {
    const { id, format } = await params
    const normalizedFormat = format.toLowerCase()


    if (!process.env.DATABASE_URL) {
      const report = getDemoReport(id)
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      if (!['json', 'xbrl', 'xml'].includes(normalizedFormat)) {
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
      }

      if ((normalizedFormat === 'xbrl' || normalizedFormat === 'xml') && !report.xbrlContent) {
        return NextResponse.json({ error: 'XBRL content not available for this report' }, { status: 404 })
      }

      const project = getDemoProject(report.projectId)
      const content = normalizedFormat === 'json'
        ? JSON.stringify(report.contentJson, null, 2)
        : report.xbrlContent!

      const filename = `${(project?.name || 'demo-project').replace(/\s+/g, '-').toLowerCase()}-report-v${report.version}.${extensionByFormat[normalizedFormat]}`

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': `${mimeByFormat[normalizedFormat]}; charset=utf-8`,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    const report = await db.report.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            createdBy: true,
            name: true
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const isPrivileged = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.AUDITOR
    if (!isPrivileged && report.project.createdBy !== req.user!.userId) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (!['json', 'xbrl', 'xml'].includes(normalizedFormat)) {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    if ((normalizedFormat === 'xbrl' || normalizedFormat === 'xml') && !report.xbrlContent) {
      return NextResponse.json({ error: 'XBRL content not available for this report' }, { status: 404 })
    }

    const content = normalizedFormat === 'json'
      ? JSON.stringify(report.contentJson, null, 2)
      : report.xbrlContent!

    const filename = `${report.project.name.replace(/\s+/g, '-').toLowerCase()}-report-v${report.version}.${extensionByFormat[normalizedFormat]}`

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': `${mimeByFormat[normalizedFormat]}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json({ error: 'Failed to download report' }, { status: 500 })
  }
}

export const GET = withAuth(handler)
