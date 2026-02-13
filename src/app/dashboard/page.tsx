"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, FileText, Users, Settings, LogOut, Shield, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

type Project = {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  organisation?: { id: string; name: string }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE": return "bg-green-100 text-green-800"
    case "REVIEW": return "bg-yellow-100 text-yellow-800"
    case "DRAFT": return "bg-gray-100 text-gray-800"
    case "COMPLETED": return "bg-blue-100 text-blue-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const statusProgress: Record<string, number> = {
  DRAFT: 10,
  ACTIVE: 60,
  REVIEW: 85,
  COMPLETED: 100
}

export default function Dashboard() {
  const { isAdmin, user, token, logout } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    organisationId: ""
  })

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
    setProjects(data.data || [])
  }

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await loadProjects()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load projects')
      } finally {
        setIsLoading(false)
      }
    }
    bootstrap()
  }, [token])

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.organisation?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.organisationId) {
      setError('Project name and organization are required')
      return
    }

    try {
      setIsCreating(true)
      setError(null)
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          name: newProject.name,
          scopeRaw: newProject.description,
          organisationId: newProject.organisationId
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to create project' }))
        throw new Error(data.error || 'Failed to create project')
      }

      await loadProjects()
      setNewProject({ name: "", description: "", organisationId: "" })
      setIsCreateDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() || user?.email.slice(0, 2).toUpperCase() || 'EP'

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="border-b bg-white dark:bg-slate-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">EP</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">ESG Pathfinder</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <Link href="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium">Dashboard</Link>
                <Link href="/project" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Projects</Link>
                <Link href="/reports" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Reports</Link>
                <Link href="/settings" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Settings</Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Link href="/settings"><Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" />Settings</Button></Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{initials}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem><Users className="mr-2 h-4 w-4" /><span>Profile</span></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Organization Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your ESG projects and track compliance progress</p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Projects</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{projects.length}</div><p className="text-xs text-muted-foreground">All tracked ESG projects</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Projects</CardTitle><div className="h-2 w-2 rounded-full bg-green-600"></div></CardHeader><CardContent><div className="text-2xl font-bold">{projects.filter(p => p.status === 'ACTIVE').length}</div><p className="text-xs text-muted-foreground">Currently in progress</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Review</CardTitle><div className="h-2 w-2 rounded-full bg-yellow-500"></div></CardHeader><CardContent><div className="text-2xl font-bold">{projects.filter(p => p.status === 'REVIEW').length}</div><p className="text-xs text-muted-foreground">Pending review</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><div className="h-2 w-2 rounded-full bg-blue-500"></div></CardHeader><CardContent><div className="text-2xl font-bold">{projects.filter(p => p.status === 'COMPLETED').length}</div><p className="text-xs text-muted-foreground">Finished assessments</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Manage your ESG compliance projects and assessments</CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Project</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>Create a new ESG compliance project for your organization.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input id="name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder="Enter project name" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="organisation">Organization</Label>
                        <Select value={newProject.organisationId} onValueChange={(value) => setNewProject({ ...newProject, organisationId: value })}>
                          <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                          <SelectContent>
                            {(user?.organisations || []).map((org) => (
                              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} placeholder="Enter project description" />
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateProject} disabled={isCreating}>{isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Create Project</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const progress = statusProgress[project.status] || 0
                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.organisation?.name || '—'}</TableCell>
                          <TableCell><Badge className={getStatusColor(project.status)}>{project.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-slate-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
                              <span className="text-sm text-slate-600">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(project.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {!filteredProjects.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">No projects found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
