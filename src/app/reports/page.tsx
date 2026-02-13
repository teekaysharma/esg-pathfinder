"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-slate-600 dark:text-slate-400">Generate and manage ESG and sustainability reports</p>
          </div>
          <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Draft Reports</CardTitle>
              <CardDescription>Continue working on in-progress reports</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">Create framework-aligned disclosures and narratives.</p></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Compliance Reports</CardTitle>
              <CardDescription>View compliance gap and readiness results</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">Includes TCFD, CSRD, ISSB/IFRS, GRI, SASB, and RJC.</p></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Exports</CardTitle>
              <CardDescription>Export report packages</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">JSON/XBRL outputs for auditor-ready sharing.</p></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
