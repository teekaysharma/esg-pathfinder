import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const steps = [
  { title: '1. Sign in', detail: 'Authenticate and verify your role permissions.' },
  { title: '2. Select/Create project', detail: 'Open a project from Dashboard or create a new one.' },
  { title: '3. Define scope', detail: 'Use scope parsing to define entities, geographies, and boundaries.' },
  { title: '4. Run framework assessments', detail: 'Complete TCFD, CSRD, ISSB/IFRS, GRI, SASB, and RJC as applicable.' },
  { title: '5. Fill datapoints & checks', detail: 'Resolve missing datapoints and compliance check warnings/errors.' },
  { title: '6. Review readiness', detail: 'Track coverage by framework and execute recommended next actions.' },
  { title: '7. Generate reports', detail: 'Produce outputs and download reporting artifacts for review/submission.' },
  { title: '8. Admin operations', detail: 'Manage users, audits, and framework ingestion updates.' },
]

export default function ProjectInterfaceHelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Project Interface Help</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Step-by-step guide to complete ESG workflows from project setup through final reporting.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
            <Link href="/project"><Button>Open Workspace</Button></Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Guided workflow</CardTitle>
            <CardDescription>Use this sequence to keep data quality high and reduce rework.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-md border bg-white dark:bg-slate-800 p-4">
                <div className="font-semibold text-slate-900 dark:text-white">{step.title}</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{step.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
