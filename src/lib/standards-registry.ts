import { createHash } from 'crypto'
import { z } from 'zod'

export const frameworkCodeSchema = z.enum(['GRI', 'ISSB', 'ESRS', 'SASB', 'TCFD', 'RJC'])

export const createIngestionSchema = z.object({
  frameworkCode: frameworkCodeSchema,
  versionTag: z.string().min(1),
  sourceUrl: z.string().url(),
  effectiveFrom: z.string().datetime().optional(),
  packageChecksum: z.string().optional(),
  notes: z.string().optional(),
  disclosures: z.array(z.object({
    disclosureId: z.string().min(1),
    title: z.string().min(1),
    level: z.number().int().min(1).max(3).default(2),
    mandatoryFor: z.array(z.enum(['IN_ACCORDANCE', 'WITH_REFERENCE'])).default([]),
    sectorSpecific: z.boolean().default(false),
    parentDisclosureId: z.string().optional()
  })).default([]),
  datapoints: z.array(z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    dataType: z.string().min(1),
    unit: z.string().optional(),
    allowedValues: z.array(z.string()).optional(),
    disclosureId: z.string().optional(),
    dimensionType: z.enum(['NONE', 'EXPLICIT', 'TYPED']).default('NONE')
  })).default([]),
  validationRules: z.array(z.object({
    ruleCode: z.string().min(1),
    severity: z.enum(['ERROR', 'WARNING']),
    assertionType: z.enum(['existenceAssertion', 'valueAssertion']),
    expression: z.string().min(1),
    disclosureId: z.string().optional()
  })).default([])
})

export type CreateIngestionPayload = z.infer<typeof createIngestionSchema>

export function computePayloadChecksum(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}
