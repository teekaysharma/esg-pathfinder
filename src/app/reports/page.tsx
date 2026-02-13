"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, BarChart3, Loader2, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

type Project = { id: string; name: string }
type Report = {
  id: string
  version: number
  generatedAt: string
  xbrlContent?: string | null
  project: { id: string; name: string; organisation: { name: string } }
}

export default function ReportsPage() {
  const { token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }, [token])

  const loadProjects = async () => {
    const response = await fetch('/api/v1/projects?limit=100', {
      credentials: 'include',
      headers: authHeaders
    })

    if (!response.ok) {
      throw new Error('Failed to load projects')
    }

    const data = await response.json()
    const mappedProjects = (data.data || []).map((project: any) => ({
      id: project.id,
      name: project.name
    }))
    setProjects(mappedProjects)
  }

  const loadReports = async (projectId?: string) => {
    const query = projectId && projectId !== 'all' ? `?projectId=${projectId}` : ''
    const response = await fetch(`/api/v1/reports${query}`, {
      credentials: 'include',
      headers: authHeaders
    })

    if (!response.ok) {
      throw new Error('Failed to load reports')
    }

    const data = await response.json()
    setReports(data.data || [])
  }

  const bootstrap = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await Promise.all([loadProjects(), loadReports()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    bootstrap()
  }, [token])

  const handleProjectFilterChange = async (value: string) => {
    setSelectedProjectId(value)
    try {
      await loadReports(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to filter reports')
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedProjectId || selectedProjectId === 'all') {
      setError('Select a project before generating a report')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch(`/api/v1/projects/${selectedProjectId}/report/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          format: 'json',
          includeXBRL: true,
          sections: ['executive_summary', 'environmental', 'social', 'governance']
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to generate report' }))
        throw new Error(data.error || 'Failed to generate report')
      }

      await loadReports(selectedProjectId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="container mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-slate-600 dark:text-slate-400">Generate and manage ESG and sustainability reports</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateReport} disabled={isGenerating || selectedProjectId === 'all'}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}Generate
              </Button>
              <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Report Controls</CardTitle>
              <CardDescription>Filter reports by project and generate new drafts.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 md:items-center">
              <Select value={selectedProjectId} onValueChange={handleProjectFilterChange}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500">{reports.length} report(s) found</p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> {report.project.name}</CardTitle>
                    <CardDescription>{report.project.organisation.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Version</span>
                      <Badge variant="secondary">v{report.version}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">Generated {new Date(report.generatedAt).toLocaleString()}</p>
                    <div className="flex gap-2">
                      <a href={`/api/v1/reports/${report.id}/download/json`}><Button size="sm" variant="outline"><Download className="h-4 w-4 mr-2" />JSON</Button></a>
                      {report.xbrlContent && (
                        <a href={`/api/v1/reports/${report.id}/download/xbrl`}><Button size="sm" variant="outline"><Download className="h-4 w-4 mr-2" />XBRL</Button></a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!reports.length && (
                <Card className="md:col-span-2 xl:col-span-3">
                  <CardContent className="py-10 text-center text-slate-500">
                    No reports yet. Select a project and click Generate.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
