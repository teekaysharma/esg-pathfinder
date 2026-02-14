export type GRIReportingPath = 'IN_ACCORDANCE' | 'WITH_REFERENCE'

export type GRIOmissionReason =
  | 'LEGAL_PROHIBITION'
  | 'CONFIDENTIALITY'
  | 'INFORMATION_UNAVAILABLE'
  | 'NOT_APPLICABLE'

export interface GRIOmission {
  disclosureId: string
  reason: GRIOmissionReason
  explanation?: string
}

export interface GRIValidationInput {
  reportingPath: GRIReportingPath
  disclosures: string[]
  contentIndexUrl?: string
  statementOfUse?: string
  notifyGRI?: boolean
  omissions?: GRIOmission[]
  sectorStandardsApplied?: string[]
  materialTopics?: string[]
  excludedLikelyMaterialTopics?: Array<{ topic: string; rationale: string }>
}

export const GRI_UNIVERSAL_2021_REQUIRED_DISCLOSURES = [
  ...Array.from({ length: 30 }, (_, i) => `2-${i + 1}`),
  '3-1',
  '3-2',
  '3-3'
]

export const GRI_REPORTING_PATH_REQUIREMENTS: Record<GRIReportingPath, string[]> = {
  IN_ACCORDANCE: [
    'Statement of use (GRI 1)',
    'GRI 2 General Disclosures (2-1..2-30)',
    'GRI 3 Material Topics (3-1..3-3)',
    'Topic-specific disclosures for each material topic',
    'GRI Content Index'
  ],
  WITH_REFERENCE: [
    'Statement of use',
    'GRI Content Index',
    'Notification to GRI'
  ]
}

export const GRI_TAXONOMY_METADATA = {
  taxonomyPackageVersion: '2025-06-23',
  entryPoint: 'gri_srs_entry_point_2025-06-23.xsd',
  architecture: {
    mappingGranularity: ['LEVEL_2_ALPHABETICAL', 'LEVEL_3_ROMAN', 'INDEPENDENT_ITEMS'],
    supports: ['SIMPLE_HIERARCHY', 'HYPERCUBE_EXPLICIT_DIMENSIONS', 'HYPERCUBE_TYPED_DIMENSIONS'],
    extensionPolicy: 'NO_CUSTOM_EXTENSION_ELEMENTS'
  },
  outputFormats: ['XBRL', 'IXBRL', 'PDF', 'XLSX', 'WEBFORM']
} as const

export function validateGRISubmission(input: GRIValidationInput): string[] {
  const errors: string[] = []

  if (!input.reportingPath) {
    errors.push('reportingPath is required')
  }

  if (!input.contentIndexUrl) {
    errors.push('contentIndexUrl is required (GRI Content Index)')
  }

  if (!input.statementOfUse) {
    errors.push('statementOfUse is required')
  }

  if (input.reportingPath === 'WITH_REFERENCE' && !input.notifyGRI) {
    errors.push('notifyGRI=true is required for WITH_REFERENCE reporting')
  }

  if (input.reportingPath === 'IN_ACCORDANCE') {
    const missingUniversal = GRI_UNIVERSAL_2021_REQUIRED_DISCLOSURES.filter((d) => !input.disclosures.includes(d))
    if (missingUniversal.length > 0) {
      errors.push(`Missing required disclosures for IN_ACCORDANCE: ${missingUniversal.join(', ')}`)
    }

    if (!input.materialTopics || input.materialTopics.length === 0) {
      errors.push('materialTopics must include at least one topic for IN_ACCORDANCE reporting')
    }
  }

  for (const omission of input.omissions || []) {
    if (!omission.disclosureId) {
      errors.push('Each omission must include disclosureId')
    }
    if (!omission.reason) {
      errors.push(`Omission ${omission.disclosureId || '(unknown)'} requires a reason`)
    }
    if ((omission.reason === 'LEGAL_PROHIBITION' || omission.reason === 'CONFIDENTIALITY') && !omission.explanation) {
      errors.push(`Omission ${omission.disclosureId} with reason ${omission.reason} requires explanation`)
    }
  }

  for (const excluded of input.excludedLikelyMaterialTopics || []) {
    if (!excluded.topic || !excluded.rationale) {
      errors.push('Each excluded likely material topic must include topic and rationale')
    }
  }

  return errors
}

export function buildGRIContentIndex(disclosures: string[], omissions: GRIOmission[] = []) {
  return {
    generatedAt: new Date().toISOString(),
    disclosures: disclosures.map((id) => ({ disclosureId: id, status: 'REPORTED' as const })),
    omissions: omissions.map((item) => ({
      disclosureId: item.disclosureId,
      status: 'OMITTED' as const,
      reason: item.reason,
      explanation: item.explanation || null
    }))
  }
}
