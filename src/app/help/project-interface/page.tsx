import Link from 'next/link'
import { ArrowRight, CheckCircle2, Gauge } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import {
  helpBestPractices,
  helpDetailedPlaybook,
  helpProductLinks,
  helpSectionLinks,
  helpWorkflowSteps,
} from '@/lib/help-content'

export default function ProjectInterfaceHelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
        <Card id="overview" className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge className="mb-3" variant="secondary">Professional Workflow Guide</Badge>
                <CardTitle className="text-3xl">Project Interface Help</CardTitle>
                <CardDescription className="mt-2 max-w-3xl">
                  Follow this guided operational flow to move from project setup to a high-quality, audit-ready ESG output.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
                <Link href="/project"><Button>Open Workspace</Button></Link>
              </div>
            </div>
          </CardHeader>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card id="workflow">
              <CardHeader>
                <CardTitle>Step-by-step execution</CardTitle>
                <CardDescription>Recommended sequence to reduce rework and improve delivery consistency.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {helpWorkflowSteps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.title} className="rounded-lg border bg-white dark:bg-slate-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-slate-100 dark:bg-slate-700 p-2">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{index + 1}. {step.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{step.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              <span className="font-medium">Expected outcome:</span> {step.outcome}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card id="playbook">
              <CardHeader>
                <CardTitle>Operational playbook (expanded)</CardTitle>
                <CardDescription>Detailed checklist for each step in the interface workflow.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {helpDetailedPlaybook.map((step) => (
                    <AccordionItem value={step.key} key={step.key}>
                      <AccordionTrigger>{step.title}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 rounded-md border bg-slate-50 dark:bg-slate-800 p-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Do</p>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                              {step.doItems.map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Validation gate</p>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{step.verify}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Page sections</CardTitle>
                <CardDescription>Jump to the part you need immediately.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {helpSectionLinks.map((link) => (
                  <a key={link.href} href={link.href} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </a>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product navigation</CardTitle>
                <CardDescription>Jump directly to key product surfaces.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {helpProductLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" />{link.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  )
                })}
              </CardContent>
            </Card>

            <Card id="quality">
              <CardHeader>
                <CardTitle className="text-base">Quality checklist</CardTitle>
                <CardDescription>Use before generating final reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {helpBestPractices.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Gauge className="h-4 w-4" />
                  Track readiness after each significant data update.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
