import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Max requests per window
  message?: string  // Custom error message
  skipSuccessfulRequests?: boolean  // Don't count successful requests
  skipFailedRequests?: boolean  // Don't count failed requests
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// Generate a unique key for rate limiting
function getRateLimitKey(req: NextRequest, identifier?: string): string {
  const ip = req.ip || 
             req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown'
  
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const userId = identifier || 'anonymous'
  
  // Create a hash of IP + User Agent + User ID for better uniqueness
  const keyData = `${ip}:${userAgent}:${userId}`
  return createHash('sha256').update(keyData).digest('hex').substring(0, 16)
}

// Clean up expired entries
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Main rate limiting middleware
export function createRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  const limiter = function rateLimit(req: NextRequest, identifier?: string): NextResponse | null {
    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      cleanupExpiredEntries()
    }

    const key = getRateLimitKey(req, identifier)
    const now = Date.now()
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + finalConfig.windowMs
      }
      rateLimitStore.set(key, entry)
    }

    // Increment counter
    entry.count++

    // Check if limit exceeded
    if (entry.count > (finalConfig.maxRequests || 100)) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000)
      
      return NextResponse.json(
        { 
          error: finalConfig.message || 'Rate limit exceeded',
          retryAfter: resetTimeSeconds,
          limit: finalConfig.maxRequests,
          windowMs: finalConfig.windowMs
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': finalConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': resetTimeSeconds.toString(),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      )
    }

    // Add rate limit headers to successful responses
    return null // Let the request proceed
  }

  ;(limiter as any).maxRequests = finalConfig.maxRequests
  return limiter
}

// Rate limit decorators for different endpoints
export const rateLimits = {
  // General API rate limit
  api: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'API rate limit exceeded. Please try again later.'
  }),

  // Authentication endpoints - stricter limits
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // Only 10 auth attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Registration - very strict limits
  register: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // Only 3 registration attempts per hour
    message: 'Too many registration attempts. Please try again later.'
  }),

  // Password reset - very strict limits
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // Only 3 password reset attempts per hour
    message: 'Too many password reset attempts. Please try again later.'
  }),

  // File upload limits
  upload: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 uploads per hour
    message: 'Upload rate limit exceeded. Please try again later.'
  }),

  // AI/ML endpoints - stricter limits due to cost
  ai: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 25, // 25 AI requests per hour
    message: 'AI service rate limit exceeded. Please try again later.'
  }),

  // Admin endpoints - per-user limits
  admin: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // Higher limit for admins
    message: 'Admin rate limit exceeded. Please try again later.'
  }),
}

// Rate limiting middleware wrapper for API routes
export function withRateLimit(rateLimiter: ReturnType<typeof createRateLimit>, getUserIdentifier?: (req: NextRequest) => string | undefined) {
  return function(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
    return async function rateLimitedHandler(req: NextRequest): Promise<NextResponse> {
      // Get user identifier if provided (for per-user rate limiting)
      const userId = getUserIdentifier ? getUserIdentifier(req) : undefined
      
      // Check rate limit
      const rateLimitResponse = rateLimiter(req, userId)
      if (rateLimitResponse) {
        return rateLimitResponse
      }

      // Proceed with the actual handler
      const response = await handler(req)
      
      // Add rate limit headers to successful responses
      const key = getRateLimitKey(req, userId)
      const entry = rateLimitStore.get(key)
      if (entry && response.status < 400) {
        const limit = (rateLimiter as any).maxRequests || 100
        const remaining = Math.max(0, limit - entry.count)
        
        response.headers.set('X-RateLimit-Limit', limit.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
      }

      return response
    }
  }
}

// IP-based blocking for suspicious activity
const blockedIPs = new Map<string, { until: number; reason: string }>()

export function blockIP(ip: string, durationMs: number, reason: string): void {
  blockedIPs.set(ip, {
    until: Date.now() + durationMs,
    reason
  })
}

export function isIPBlocked(ip: string): { blocked: boolean; reason?: string; until?: number } {
  const block = blockedIPs.get(ip)
  if (!block) return { blocked: false }
  
  if (Date.now() > block.until) {
    blockedIPs.delete(ip)
    return { blocked: false }
  }
  
  return { 
    blocked: true, 
    reason: block.reason, 
    until: block.until 
  }
}

// Advanced DDoS detection
export function detectSuspiciousActivity(req: NextRequest): boolean {
  const ip = req.ip || 
             req.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown'
  
  const userAgent = req.headers.get('user-agent') || ''
  const referer = req.headers.get('referer') || ''
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i,
  ]
  
  // Block common bot user agents on API endpoints
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return true
  }
  
  // Check for missing or suspicious referer on sensitive endpoints
  if (req.url.includes('/api/v1/auth/') && !referer && !userAgent.includes('Mozilla')) {
    return true
  }
  
  // Check for IP-based blocking
  const ipBlock = isIPBlocked(ip)
  if (ipBlock.blocked) {
    return true
  }
  
  return false
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Force HTTPS (in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  )
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )
  
  return response
}

export default {
  createRateLimit,
  rateLimits,
  withRateLimit,
  blockIP,
  isIPBlocked,
  detectSuspiciousActivity,
  addSecurityHeaders,
  getRateLimitKey,
  cleanupExpiredEntries,
}