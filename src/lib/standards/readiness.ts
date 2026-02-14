import { Project, TCFDAssessment, CSRDAassessment, ISSBAssessment, GRIAssessment, SASBAssessment } from '@prisma/client'

export type StandardName = 'TCFD' | 'CSRD' | 'ISSB' | 'IFRS' | 'GRI' | 'SASB' | 'RJC'

export interface StandardReadiness {
  standard: StandardName
  supported: boolean
  coverageScore: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY'
  missingRequirements: string[]
  availableInputs: string[]
}

interface BuildInput {
  project: Project
  tcfd: TCFDAssessment | null
  csrd: CSRDAassessment | null
  issb: ISSBAssessment | null
  gri: GRIAssessment | null
  sasb: SASBAssessment | null
  dataPointCodes: string[]
  complianceFrameworks: string[]
  evidenceCount: number
  reportCount: number
  workflowCount: number
}

function calcStatus(score: number): StandardReadiness['status'] {
  if (score >= 80) return 'READY'
  if (score >= 35) return 'IN_PROGRESS'
  return 'NOT_STARTED'
}

function getMissing(required: Array<{ key: string; ok: boolean }>): string[] {
  return required.filter(item => !item.ok).map(item => item.key)
}

export function buildStandardsReadiness(input: BuildInput): StandardReadiness[] {
  const tcfdReq = [
    { key: 'Governance disclosures', ok: !!input.tcfd?.governance },
    { key: 'Strategy disclosures', ok: !!input.tcfd?.strategy },
    { key: 'Risk management disclosures', ok: !!input.tcfd?.riskManagement },
    { key: 'Metrics and targets', ok: !!input.tcfd?.metricsTargets },
    { key: 'Supporting evidence', ok: input.evidenceCount > 0 }
  ]

  const csrdReq = [
    { key: 'Double materiality assessment', ok: !!input.csrd?.doubleMateriality },
    { key: 'ESRS reporting data', ok: !!input.csrd?.esrsReporting },
    { key: 'Due diligence records', ok: !!input.csrd?.dueDiligence },
    { key: 'Sector-specific requirements', ok: !!input.csrd?.sectorSpecific },
    { key: 'CSRD datapoints', ok: !!input.csrd?.datapoints }
  ]

  const issbReq = [
    { key: 'IFRS S1 disclosures', ok: !!input.issb?.ifrsS1 },
    { key: 'IFRS S2 disclosures', ok: !!input.issb?.ifrsS2 },
    { key: 'Sustainability narrative', ok: !!input.issb?.sustainability },
    { key: 'Climate disclosures', ok: !!input.issb?.climate },
    { key: 'Readiness assessment', ok: !!input.issb?.readiness }
  ]

  const griReq = [
    { key: 'Universal standards', ok: !!input.gri?.universalStandards },
    { key: 'Topic standards', ok: !!input.gri?.topicStandards },
    { key: 'Materiality disclosures', ok: !!input.gri?.materiality },
    { key: 'Disclosure index', ok: !!input.gri?.disclosures },
    { key: 'GRI tagged datapoints', ok: input.dataPointCodes.some(c => c.startsWith('GRI_')) }
  ]

  const sasbReq = [
    { key: 'Industry classification', ok: !!input.sasb?.industry },
    { key: 'Industry standard mapping', ok: !!input.sasb?.standards },
    { key: 'Metrics and calculations', ok: !!input.sasb?.metrics },
    { key: 'Disclosure records', ok: !!input.sasb?.disclosures },
    { key: 'SASB tagged datapoints', ok: input.dataPointCodes.some(c => c.startsWith('SASB_')) }
  ]


  const rjcReq = [
    { key: 'RJC governance & ethics policy', ok: input.complianceFrameworks.includes('RJC') },
    { key: 'Chain of custody controls', ok: input.dataPointCodes.some(c => c.startsWith('RJC_COC_')) },
    { key: 'Human rights and labor controls', ok: input.dataPointCodes.some(c => c.startsWith('RJC_HR_')) },
    { key: 'Environmental management controls', ok: input.dataPointCodes.some(c => c.startsWith('RJC_ENV_')) },
    { key: 'Corrective action workflow/evidence', ok: input.workflowCount > 0 && input.evidenceCount > 0 }
  ]

  const ifrsReq = [
    { key: 'IFRS S1/S2 readiness', ok: !!input.issb?.ifrsS1 && !!input.issb?.ifrsS2 },
    { key: 'IFRS metric datapoints', ok: input.dataPointCodes.some(c => c.startsWith('IFRS_')) },
    { key: 'Climate metrics (Scope 1/2)', ok: input.dataPointCodes.includes('IFRS_S2_5') && input.dataPointCodes.includes('IFRS_S2_6') },
    { key: 'Financial impact inputs', ok: input.dataPointCodes.includes('IFRS_S2_8') || input.dataPointCodes.includes('IFRS_S2_10') },
    { key: 'Compliance workflow', ok: input.complianceFrameworks.includes('ISSB') || input.complianceFrameworks.includes('IFRS') }
  ]

  const standards: Array<{ standard: StandardName; req: Array<{ key: string; ok: boolean }>; inputs: string[]; supported: boolean }> = [
    { standard: 'TCFD', req: tcfdReq, inputs: ['tcfd_assessment', 'esg_data_points', 'evidence'], supported: true },
    { standard: 'CSRD', req: csrdReq, inputs: ['csrd_assessment', 'esg_data_points', 'materiality'], supported: true },
    { standard: 'ISSB', req: issbReq, inputs: ['issb_assessment', 'ifrs_metrics', 'climate_data'], supported: true },
    { standard: 'IFRS', req: ifrsReq, inputs: ['issb_assessment', 'ifrs_metrics', 'compliance_checks'], supported: true },
    { standard: 'GRI', req: griReq, inputs: ['gri_assessment', 'gri_metrics', 'disclosures'], supported: true },
    { standard: 'SASB', req: sasbReq, inputs: ['sasb_assessment', 'sasb_metrics', 'disclosures'], supported: true },
    { standard: 'RJC', req: rjcReq, inputs: ['rjc_assessment', 'compliance_checks', 'esg_data_points', 'workflows', 'evidence'], supported: true }
  ]

  return standards.map(({ standard, req, inputs, supported }) => {
    const passed = req.filter(r => r.ok).length
    const coverageScore = Math.round((passed / req.length) * 100)

    return {
      standard,
      supported,
      coverageScore,
      status: calcStatus(coverageScore),
      missingRequirements: getMissing(req),
      availableInputs: inputs
    }
  })
}
