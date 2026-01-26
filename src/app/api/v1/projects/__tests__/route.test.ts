import request from 'supertest'
import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
import { db } from '@/lib/db'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    organisation: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

// Mock authentication
jest.mock('@/lib/middleware', () => ({
  withAuth: (handler: any) => handler,
  AuthenticatedRequest: NextRequest,
}))

describe('/api/v1/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/v1/projects', () => {
    it('should create a project successfully', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        organisationId: 'org-1',
        createdBy: 'user-1',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        organisation: { id: 'org-1', name: 'Test Org' },
        creator: { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'VIEWER' },
      }

      ;(db.organisation.findUnique as jest.Mock).mockResolvedValue({ id: 'org-1' })
      ;(db.project.create as jest.Mock).mockResolvedValue(mockProject)
      ;(db.auditLog.create as jest.Mock).mockResolvedValue({})

      const requestBody = {
        name: 'Test Project',
        organisationId: 'org-1',
        description: 'Test Description',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
      })

      // Mock user on request
      ;(request as any).user = { userId: 'user-1', email: 'test@example.com', role: 'VIEWER' }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Test Project')
      expect(db.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Project',
          organisationId: 'org-1',
          scopeRaw: undefined,
          createdBy: 'user-1',
          status: 'DRAFT',
        },
        include: expect.any(Object),
      })
    })

    it('should return 404 when organization not found', async () => {
      ;(db.organisation.findUnique as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        name: 'Test Project',
        organisationId: 'org-1',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      ;(request as any).user = { userId: 'user-1', email: 'test@example.com', role: 'VIEWER' }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Organization not found')
    })

    it('should validate input and return 400 for invalid data', async () => {
      const requestBody = {
        name: '', // Invalid: empty name
        organisationId: 'org-1',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      ;(request as any).user = { userId: 'user-1', email: 'test@example.com', role: 'VIEWER' }

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation error')
    })
  })

  describe('GET /api/v1/projects', () => {
    it('should return projects for authenticated user', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project 1',
          organisation: { id: 'org-1', name: 'Test Org' },
          creator: { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'VIEWER' },
          _count: { reports: 0, evidences: 0, materialityMaps: 0 },
        },
      ]

      ;(db.project.findMany as jest.Mock).mockResolvedValue(mockProjects)
      ;(db.project.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/projects?page=1&limit=20', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      })

      ;(request as any).user = { userId: 'user-1', email: 'test@example.com', role: 'VIEWER' }

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      })
    })

    it('should validate query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/projects?page=invalid', {
        method: 'GET',
      })

      ;(request as any).user = { userId: 'user-1', email: 'test@example.com', role: 'VIEWER' }

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid query parameters')
    })
  })
})