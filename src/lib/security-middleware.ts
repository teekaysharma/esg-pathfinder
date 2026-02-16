import { NextRequest, NextResponse } from 'next/server'
import { rateLimits, detectSuspiciousActivity, addSecurityHeaders, blockIP } from './rate-limit'
import { verifyToken, extractTokenFromHeader, extractTokenFromCookie } from './auth-utils'

// Security middleware for API routes
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: {
    rateLimit?: keyof typeof rateLimits
    requireAuth?: boolean
    allowedRoles?: string[]
    skipRateLimitFor?: string[]
  } = {}
) {
  return async function secureHandler(req: NextRequest): Promise<NextResponse> {
    try {
      // 1. Detect suspicious activity first
      if (detectSuspiciousActivity(req)) {
        const ip = req.ip || 
                   req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   'unknown'
        
        // Block the IP for 1 hour
        blockIP(ip, 60 * 60 * 1000, 'Suspicious activity detected')
        
        return NextResponse.json(
          { error: 'Access denied' },
          { 
            status: 403,
            headers: {
              'X-Block-Reason': 'Suspicious activity detected',
              'X-Block-Duration': '3600'
            }
          }
        )
      }

      // 2. Apply rate limiting if configured
      if (options.rateLimit) {
        const rateLimiter = rateLimits[options.rateLimit]
        const rateLimitResponse = rateLimiter(req)
        if (rateLimitResponse) {
          return rateLimitResponse
        }
      }

      // 3. Authentication check if required
      if (options.requireAuth) {
        const token = extractTokenFromHeader(req.headers.get('authorization') || undefined) ||
          extractTokenFromCookie(req.headers.get('cookie'))
        if (!token) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        const user = verifyToken(token)
        if (!user) {
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          )
        }

        // 4. Role-based access control
        if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      // 5. Execute the handler
      const response = await handler(req)

      // 6. Add security headers to the response
      return addSecurityHeaders(response)

    } catch (error) {
      console.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Internal security error' },
        { status: 500 }
      )
    }
  }
}

// Specific security decorators for common use cases
export const withAuthSecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, { requireAuth: true, rateLimit: 'api' })

export const withAdminSecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, { 
    requireAuth: true, 
    allowedRoles: ['ADMIN'], 
    rateLimit: 'admin' 
  })

export const withAuthRateLimit = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, { rateLimit: 'auth' })

export const withRegisterSecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, { rateLimit: 'register' })

export const withAISecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, { requireAuth: true, rateLimit: 'ai' })

export const withUploadSecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, { requireAuth: true, rateLimit: 'upload' })

// Request validation middleware
export function validateRequest(req: NextRequest, rules: {
  maxBodySize?: number
  allowedMethods?: string[]
  allowedOrigins?: string[]
  allowedContentTypes?: string[]
}): NextResponse | null {
  // 1. Method validation
  if (rules.allowedMethods && !rules.allowedMethods.includes(req.method)) {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  // 2. Origin validation (CORS)
  if (rules.allowedOrigins) {
    const origin = req.headers.get('origin')
    if (origin && !rules.allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'CORS policy violation' },
        { status: 403 }
      )
    }
  }

  // 3. Content-Type validation
  if (rules.allowedContentTypes && req.method !== 'GET') {
    const contentType = req.headers.get('content-type')
    if (contentType && !rules.allowedContentTypes.some(type => contentType.includes(type))) {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 415 }
      )
    }
  }

  // 4. Body size validation (approximate check)
  if (rules.maxBodySize && req.method !== 'GET') {
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > rules.maxBodySize) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }
  }

  return null // Request is valid
}

// Enhanced security middleware with request validation
export function withEnhancedSecurity(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  securityOptions: {
    rateLimit?: keyof typeof rateLimits
    requireAuth?: boolean
    allowedRoles?: string[]
    validation?: {
      maxBodySize?: number
      allowedMethods?: string[]
      allowedOrigins?: string[]
      allowedContentTypes?: string[]
    }
  } = {}
) {
  return async function enhancedSecureHandler(req: NextRequest): Promise<NextResponse> {
    // 1. Request validation
    if (securityOptions.validation) {
      const validationError = validateRequest(req, securityOptions.validation)
      if (validationError) {
        return validationError
      }
    }

    // 2. Apply standard security middleware
    return withSecurity(handler, securityOptions)(req)
  }
}

export default {
  withSecurity,
  withAuthSecurity,
  withAdminSecurity,
  withAuthRateLimit,
  withRegisterSecurity,
  withAISecurity,
  withUploadSecurity,
  validateRequest,
  withEnhancedSecurity,
}