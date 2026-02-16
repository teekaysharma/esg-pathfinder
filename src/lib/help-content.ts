import {
  BarChart3,
  ClipboardCheck,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  Target,
  Workflow,
} from 'lucide-react'

export type HelpWorkflowStep = {
  title: string
  description: string
  outcome: string
  icon: any
}

export type HelpPlaybookStep = {
  key: string
  title: string
  doItems: string[]
  verify: string
}

export const helpWorkflowSteps: HelpWorkflowStep[] = [
  {
    title: 'Sign in and confirm access',
    description: 'Validate your role and organization visibility before starting project work.',
    outcome: 'Correct permissions and clean workspace context.',
    icon: Shield,
  },
  {
    title: 'Create/select project and define scope',
    description: 'Open a project, set boundaries, entities, and reporting period details.',
    outcome: 'Stable project baseline for all assessments.',
    icon: FolderKanban,
  },
  {
    title: 'Run framework assessments',
    description: 'Complete applicable TCFD, CSRD, ISSB/IFRS, GRI, SASB, RJC, and VSME modules.',
    outcome: 'Gap visibility and prioritized remediation actions.',
    icon: ClipboardCheck,
  },
  {
    title: 'Resolve data points and compliance checks',
    description: 'Fill missing data and address failing/warning checks with evidence.',
    outcome: 'Improved data quality and readiness confidence.',
    icon: Target,
  },
  {
    title: 'Review readiness and generate reports',
    description: 'Track standard-level readiness, close blockers, and generate outputs.',
    outcome: 'Audit-ready report package and traceable process history.',
    icon: FileText,
  },
]

export const helpDetailedPlaybook: HelpPlaybookStep[] = [
  {
    key: 'step-1',
    title: 'Step 1 — Sign in and validate permissions',
    doItems: ['Login and confirm active session.', 'Verify organization context and role.', 'Open dashboard and ensure project list visibility.'],
    verify: 'You can access expected routes without permission errors.',
  },
  {
    key: 'step-2',
    title: 'Step 2 — Project setup and scope baseline',
    doItems: ['Create or select a project.', 'Capture scope inputs (entities, geographies, boundaries).', 'Save scope and refresh workspace context.'],
    verify: 'Project metadata and scope are stable before assessment work begins.',
  },
  {
    key: 'step-3',
    title: 'Step 3 — Framework module completion (incl. VSME where applicable)',
    doItems: ['Complete applicable framework assessments.', 'Record qualitative notes and quantitative datapoints.', 'Review generated gaps and recommendations.'],
    verify: 'Each enabled framework has current assessment outputs.',
  },
  {
    key: 'step-4',
    title: 'Step 4 — Data quality and compliance checks',
    doItems: ['Address missing datapoints.', 'Resolve ERROR checks and document WARNING rationale.', 'Link evidence where available.'],
    verify: 'Validation quality is sufficient for readiness review.',
  },
  {
    key: 'step-5',
    title: 'Step 5 — Readiness, reporting, and handoff',
    doItems: ['Review readiness summary by standard.', 'Close outstanding blockers.', 'Generate and download final report artifacts.'],
    verify: 'Outputs are audit-ready and traceable.',
  },
]

export const helpSectionLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#workflow', label: 'Workflow steps' },
  { href: '#playbook', label: 'Operational playbook' },
  { href: '#quality', label: 'Quality checklist' },
]

export const helpProductLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/project', label: 'Project Workspace', icon: Workflow },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/admin', label: 'Admin', icon: Shield },
]

export const helpBestPractices = [
  'Freeze scope inputs before final reporting windows.',
  'Resolve all ERROR validations and document WARNING rationale.',
  'Assign owners and due dates for each unresolved framework gap.',
  'Regenerate readiness after each major data or assessment update.',
]
