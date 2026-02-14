import { UserRole } from '@prisma/client'

export interface DemoUser {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  organisations: Array<{ id: string; name: string }>
}

export interface DemoProject {
  id: string
  name: string
  organisationId: string
  organisationName: string
  status: 'DRAFT' | 'ACTIVE' | 'REVIEW' | 'COMPLETED'
  createdAt: string
  updatedAt: string
  createdBy: string
  scopeRaw?: string
  scopeStructuredJson?: unknown
}

export interface DemoReport {
  id: string
  projectId: string
  version: number
  generatedAt: string
  contentJson: unknown
  xbrlContent?: string
}

type DemoStore = {
  users: DemoUser[]
  projects: DemoProject[]
  reports: DemoReport[]
}

const g = globalThis as typeof globalThis & { __esgDemoStore?: DemoStore }

function bootstrapStore(): DemoStore {
  const now = new Date().toISOString()
  return {
    users: [
      {
        id: 'demo-admin-1',
        email: 'admin@esgpathfinder.com',
        name: 'System Administrator',
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        organisations: [{ id: 'demo-org-1', name: 'ESG Pathfinder Demo Org' }]
      }
    ],
    projects: [
      {
        id: 'demo-project-1',
        name: 'TechCorp ESG Assessment 2024',
        organisationId: 'demo-org-1',
        organisationName: 'ESG Pathfinder Demo Org',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        createdBy: 'demo-admin-1',
        scopeRaw: 'Demo scope for local MVP testing'
      }
    ],
    reports: []
  }
}

function getDemoStore(): DemoStore {
  if (!g.__esgDemoStore) g.__esgDemoStore = bootstrapStore()
  return g.__esgDemoStore
}

export function findDemoUserByEmail(email: string) {
  return getDemoStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findDemoUserById(id: string) {
  return getDemoStore().users.find((u) => u.id === id)
}

export function upsertDemoUser(user: DemoUser) {
  const store = getDemoStore()
  const existingIdx = store.users.findIndex((u) => u.id === user.id)
  if (existingIdx >= 0) store.users[existingIdx] = user
  else store.users.push(user)
}

export function listDemoProjects(userId: string, role: UserRole) {
  const store = getDemoStore()
  if (role === UserRole.ADMIN || role === UserRole.AUDITOR) return store.projects
  return store.projects.filter((p) => p.createdBy === userId)
}

export function createDemoProject(input: { name: string; organisationId: string; createdBy: string; scopeRaw?: string }) {
  const now = new Date().toISOString()
  const store = getDemoStore()
  const project: DemoProject = {
    id: `demo-project-${store.projects.length + 1}`,
    name: input.name,
    organisationId: input.organisationId,
    organisationName: 'ESG Pathfinder Demo Org',
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
    scopeRaw: input.scopeRaw
  }
  store.projects.unshift(project)
  return project
}

export function getDemoProject(projectId: string) {
  return getDemoStore().projects.find((p) => p.id === projectId)
}

export function updateDemoProject(projectId: string, data: Partial<DemoProject>) {
  const store = getDemoStore()
  const idx = store.projects.findIndex((p) => p.id === projectId)
  if (idx < 0) return null
  store.projects[idx] = { ...store.projects[idx], ...data, updatedAt: new Date().toISOString() }
  return store.projects[idx]
}

export function listDemoReports(projectId?: string) {
  const reports = getDemoStore().reports
  return (projectId ? reports.filter((r) => r.projectId === projectId) : reports).sort((a, b) => b.version - a.version)
}

export function createDemoReport(input: { projectId: string; contentJson: unknown; xbrlContent?: string }) {
  const store = getDemoStore()
  const reportsForProject = store.reports.filter((r) => r.projectId === input.projectId)
  const version = reportsForProject.length ? Math.max(...reportsForProject.map((r) => r.version)) + 1 : 1
  const report: DemoReport = {
    id: `demo-report-${store.reports.length + 1}`,
    projectId: input.projectId,
    version,
    generatedAt: new Date().toISOString(),
    contentJson: input.contentJson,
    xbrlContent: input.xbrlContent
  }
  store.reports.unshift(report)
  return report
}

export function getDemoReport(reportId: string) {
  return getDemoStore().reports.find((r) => r.id === reportId)
}
