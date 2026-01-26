import { z } from 'zod'
import { UserRole } from '@prisma/client'
import { commonValidations } from './validation'

export const loginSchema = z.object({
  email: commonValidations.email,
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.password,
  name: commonValidations.safeText(2, 100),
  role: commonValidations.userRole.optional()
})

export const createUserSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.password,
  name: commonValidations.safeText(2, 100),
  role: commonValidations.userRole,
  organisationId: commonValidations.cuid.optional()
})

export const updateUserSchema = z.object({
  name: commonValidations.safeText(2, 100).optional(),
  role: commonValidations.userRole.optional(),
  isActive: z.boolean().optional()
})

export const createProjectSchema = z.object({
  name: commonValidations.safeText(1, 255),
  organisationId: commonValidations.cuid,
  description: commonValidations.safeText(0, 1000).optional(),
  scopeRaw: commonValidations.safeText(0, 10000).optional(),
})

export const updateProjectSchema = z.object({
  name: commonValidations.safeText(1, 255).optional(),
  description: commonValidations.safeText(0, 1000).optional(),
  scopeRaw: commonValidations.safeText(0, 10000).optional(),
  status: commonValidations.projectStatus.optional(),
})

export const createOrganisationSchema = z.object({
  name: commonValidations.safeText(1, 255),
  country: commonValidations.safeText(0, 100).optional(),
  sector: commonValidations.safeText(0, 100).optional(),
  metadata: z.any().optional(),
})

export const esgDataPointSchema = z.object({
  category: z.enum(['Environmental', 'Social', 'Governance']),
  subcategory: commonValidations.safeText(1, 100),
  metricName: commonValidations.safeText(1, 200).regex(/^[a-zA-Z0-9\s\-_]+$/),
  metricCode: commonValidations.safeText(1, 50).regex(/^[A-Z0-9_]+$/),
  value: z.number().optional(),
  unit: commonValidations.safeText(0, 50).optional(),
  year: commonValidations.year.optional(),
  period: z.enum(['Annual', 'Quarterly', 'Monthly']).optional(),
  dataSource: commonValidations.safeText(0, 500).optional(),
  confidence: z.number().min(0).max(1).optional(),
  validationStatus: z.enum(['PENDING', 'VALIDATED', 'REJECTED', 'REVIEW']).default('PENDING'),
  metadata: z.any().optional(),
})

export const complianceCheckSchema = z.object({
  framework: commonValidations.safeText(1, 50),
  requirement: commonValidations.safeText(1, 1000),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NOT_APPLICABLE']),
  result: z.enum(['PASS', 'FAIL', 'PARTIAL', 'NOT_APPLICABLE']).optional(),
  evidence: commonValidations.safeText(0, 1000).optional(),
  gapDescription: commonValidations.safeText(0, 2000).optional(),
  remediation: commonValidations.safeText(0, 2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  assigneeId: commonValidations.cuid.optional(),
  dueDate: z.date().optional(),
  metadata: z.any().optional(),
})

export const workflowSchema = z.object({
  name: commonValidations.safeText(1, 255),
  description: commonValidations.safeText(0, 1000).optional(),
  type: z.enum(['COMPLIANCE', 'DATA_COLLECTION', 'REVIEW', 'APPROVAL', 'AUDIT']),
  assigneeId: commonValidations.cuid.optional(),
  dueDate: z.date().optional(),
  metadata: z.any().optional(),
})

export const querySchemas = {
  projects: z.object({
    organisationId: commonValidations.cuid.optional(),
    userId: commonValidations.cuid.optional(),
    status: commonValidations.projectStatus.optional(),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
  }),
  
  users: z.object({
    role: commonValidations.userRole.optional(),
    isActive: z.string().transform(Boolean).optional(),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
  }),

  esgData: z.object({
    projectId: commonValidations.cuid,
    category: z.enum(['Environmental', 'Social', 'Governance']).optional(),
    year: commonValidations.year.optional(),
    validationStatus: z.enum(['PENDING', 'VALIDATED', 'REJECTED', 'REVIEW']).optional(),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
  }),
}

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>
export type ESGDataPointInput = z.infer<typeof esgDataPointSchema>
export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>
export type WorkflowInput = z.infer<typeof workflowSchema>