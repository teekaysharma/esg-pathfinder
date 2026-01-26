import { z } from 'zod'

// XSS protection utility
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// SQL injection protection for common patterns
export function sanitizeSqlInput(input: string): string {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '')
}

// Comprehensive sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input
  
  return sanitizeSqlInput(sanitizeHtml(input.trim()))
}

// Common validation patterns
export const commonValidations = {
  // Safe text with length limits
  safeText: (min: number = 1, max: number = 255) => 
    z.string()
      .min(min, `Text must be at least ${min} character${min > 1 ? 's' : ''}`)
      .max(max, `Text must not exceed ${max} characters`)
      .transform(sanitizeInput),

  // Email validation
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long')
    .transform(sanitizeInput),

  // CUID validation for Prisma IDs
  cuid: z.string()
    .cuid('Invalid ID format')
    .transform(sanitizeInput),

  // URL validation
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .transform(sanitizeInput),

  // Numeric validation
  positiveNumber: z.number()
    .positive('Number must be positive')
    .max(999999999, 'Number too large'),

  // Year validation
  year: z.number()
    .int('Year must be an integer')
    .min(1900, 'Year must be after 1900')
    .max(2100, 'Year must be before 2100'),

  // Select from enum values
  enum: <T extends string>(values: readonly T[]) => 
    z.enum(values, {
      errorMap: () => ({ message: `Must be one of: ${values.join(', ')}` })
    }),

  // Array validation with item validation
  safeArray: <T>(itemSchema: z.ZodType<T>, maxItems: number = 100) =>
    z.array(itemSchema)
      .min(0, 'Array cannot be empty')
      .max(maxItems, `Array cannot exceed ${maxItems} items`),

  // JSON object validation
  safeJson: z.string()
    .transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str)
        return parsed
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON format'
        })
        return z.NEVER
      }
    }),

  // Phone number validation (basic)
  phone: z.string()
    .regex(/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long')
    .transform(sanitizeInput),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  // Role validation
  userRole: z.enum(['ADMIN', 'AUDITOR', 'ANALYST', 'VIEWER'], {
    errorMap: () => ({ message: 'Must be one of: ADMIN, AUDITOR, ANALYST, VIEWER' })
  }),

  // Project status validation
  projectStatus: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Must be one of: DRAFT, ACTIVE, REVIEW, COMPLETED, ARCHIVED' })
  }),

  // Priority validation
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Must be one of: LOW, MEDIUM, HIGH, CRITICAL' })
  }),

  // Date validation
  futureDate: z.date()
    .min(new Date(), 'Date must be in the future'),

  pastDate: z.date()
    .max(new Date(), 'Date must be in the past'),
}

// Specific validation schemas for ESG data
export const esgValidations = {
  // ESG category validation
  category: z.enum(['Environmental', 'Social', 'Governance'], {
    errorMap: () => ({ message: 'Must be one of: Environmental, Social, Governance' })
  }),

  // ESG subcategory validation
  subcategory: z.string()
    .min(1, 'Subcategory is required')
    .max(100, 'Subcategory too long')
    .transform(sanitizeInput),

  // Metric validation
  metricName: z.string()
    .min(1, 'Metric name is required')
    .max(200, 'Metric name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Metric name contains invalid characters')
    .transform(sanitizeInput),

  // Metric code validation (like GRI_302_1)
  metricCode: z.string()
    .min(1, 'Metric code is required')
    .max(50, 'Metric code too long')
    .regex(/^[A-Z0-9_]+$/, 'Metric code must contain only uppercase letters, numbers, and underscores')
    .transform(sanitizeInput),

  // Unit validation
  unit: z.string()
    .min(1, 'Unit is required')
    .max(50, 'Unit too long')
    .transform(sanitizeInput),

  // Period validation
  period: z.enum(['Annual', 'Quarterly', 'Monthly'], {
    errorMap: () => ({ message: 'Must be one of: Annual, Quarterly, Monthly' })
  }),

  // Validation status
  validationStatus: z.enum(['PENDING', 'VALIDATED', 'REJECTED', 'REVIEW'], {
    errorMap: () => ({ message: 'Must be one of: PENDING, VALIDATED, REJECTED, REVIEW' })
  }),

  // Confidence score validation
  confidenceScore: z.number()
    .min(0, 'Confidence score must be between 0 and 1')
    .max(1, 'Confidence score must be between 0 and 1'),

  // ESG data point validation
  dataPoint: z.object({
    category: esgValidations.category,
    subcategory: esgValidations.subcategory,
    metricName: esgValidations.metricName,
    metricCode: esgValidations.metricCode,
    value: z.number().optional(),
    unit: esgValidations.unit.optional(),
    year: commonValidations.year.optional(),
    period: esgValidations.period.optional(),
    dataSource: commonValidations.safeText(1, 500).optional(),
    confidence: esgValidations.confidenceScore.optional(),
    validationStatus: esgValidations.validationStatus.default('PENDING'),
    metadata: z.any().optional(),
  }),
}

// Request validation middleware
export function validateRequest<T>(schema: z.ZodType<T>) {
  return async (request: Request): Promise<{ data: T; error?: string }> => {
    try {
      const body = await request.json()
      const data = schema.parse(body)
      return { data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('; ')
        return { data: null as any, error: errorMessage }
      }
      return { data: null as any, error: 'Invalid request format' }
    }
  }
}

// Query parameter validation
export function validateQuery<T>(schema: z.ZodType<T>) {
  return (searchParams: URLSearchParams): { data: T; error?: string } => {
    try {
      const params: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        params[key] = value
      })
      const data = schema.parse(params)
      return { data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('; ')
        return { data: null as any, error: errorMessage }
      }
      return { data: null as any, error: 'Invalid query parameters' }
    }
  }
}

export default {
  sanitizeInput,
  sanitizeHtml,
  sanitizeSqlInput,
  commonValidations,
  esgValidations,
  validateRequest,
  validateQuery,
}