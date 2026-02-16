import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthenticatedRequest, withAdminAuth } from '@/lib/middleware'
import { computePayloadChecksum, createIngestionSchema } from '@/lib/standards-registry'

async function getHandler() {
  try {
    const jobs = await db.standardsIngestionJob.findMany({
      include: {
        framework: { select: { id: true, code: true, name: true } },
        version: { select: { id: true, versionTag: true, status: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ success: true, data: jobs })
  } catch (error) {
    console.error('Standards ingestion list error:', error)
    return NextResponse.json({ error: 'Failed to list ingestion jobs' }, { status: 500 })
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const parsed = createIngestionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ingestion payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    const checksum = payload.packageChecksum || computePayloadChecksum(payload)

    const framework = await db.standardFramework.upsert({
      where: { code: payload.frameworkCode },
      update: { updatedAt: new Date() },
      create: {
        code: payload.frameworkCode,
        name: payload.frameworkCode,
        description: `${payload.frameworkCode} standards registry`
      }
    })

    const version = await db.standardVersion.upsert({
      where: {
        frameworkId_versionTag: {
          frameworkId: framework.id,
          versionTag: payload.versionTag
        }
      },
      update: {
        sourceUrl: payload.sourceUrl,
        effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom) : null,
        packageChecksum: checksum,
        notes: payload.notes || null,
        status: 'DRAFT'
      },
      create: {
        frameworkId: framework.id,
        versionTag: payload.versionTag,
        sourceUrl: payload.sourceUrl,
        effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom) : null,
        packageChecksum: checksum,
        notes: payload.notes || null,
        status: 'DRAFT'
      }
    })

    await db.standardDisclosure.deleteMany({ where: { versionId: version.id } })
    await db.standardDatapoint.deleteMany({ where: { versionId: version.id } })
    await db.standardValidationRule.deleteMany({ where: { versionId: version.id } })

    if (payload.disclosures.length > 0) {
      await db.standardDisclosure.createMany({
        data: payload.disclosures.map((d) => ({
          versionId: version.id,
          disclosureId: d.disclosureId,
          title: d.title,
          level: d.level,
          mandatoryFor: d.mandatoryFor,
          sectorSpecific: d.sectorSpecific,
          parentDisclosureId: d.parentDisclosureId || null
        }))
      })
    }

    if (payload.datapoints.length > 0) {
      await db.standardDatapoint.createMany({
        data: payload.datapoints.map((dp) => ({
          versionId: version.id,
          code: dp.code,
          label: dp.label,
          dataType: dp.dataType,
          unit: dp.unit || null,
          allowedValues: dp.allowedValues || [],
          disclosureId: dp.disclosureId || null,
          dimensionType: dp.dimensionType
        }))
      })
    }

    if (payload.validationRules.length > 0) {
      await db.standardValidationRule.createMany({
        data: payload.validationRules.map((rule) => ({
          versionId: version.id,
          ruleCode: rule.ruleCode,
          severity: rule.severity,
          assertionType: rule.assertionType,
          expression: rule.expression,
          disclosureId: rule.disclosureId || null
        }))
      })
    }

    const job = await db.standardsIngestionJob.create({
      data: {
        frameworkId: framework.id,
        versionId: version.id,
        createdBy: req.user!.userId,
        status: 'SUCCEEDED',
        payloadChecksum: checksum,
        summaryJson: {
          disclosures: payload.disclosures.length,
          datapoints: payload.datapoints.length,
          validationRules: payload.validationRules.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        framework,
        version,
        job,
        summary: {
          disclosures: payload.disclosures.length,
          datapoints: payload.datapoints.length,
          validationRules: payload.validationRules.length
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Standards ingestion create error:', error)
    return NextResponse.json({ error: 'Failed to ingest standards payload' }, { status: 500 })
  }
}

export const GET = withAdminAuth()(getHandler)
export const POST = withAdminAuth()(postHandler)
