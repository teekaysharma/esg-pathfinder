import { NextRequest, NextResponse } from 'next/server'

// Error severity levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK',
}

// Custom error class
export class APIError extends Error {
  public readonly statusCode: number
  public readonly category: ErrorCategory
  public readonly code?: string
  public readonly details?: any
  public readonly timestamp: Date
  public readonly requestId?: string
  public readonly userId?: string

  constructor(
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    code?: string,
    details?: any,
    requestId?: string,
    userId?: string
  ) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.category = category
    this.code = code
    this.details = details
    this.timestamp = new Date()
    this.requestId = requestId
    this.userId = userId

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    }
  }
}

// Structured logger
export class Logger {
  private context: string
  private requestId?: string
  private userId?: string

  constructor(context: string = 'API') {
    this.context = context
  }

  setRequestContext(requestId: string, userId?: string) {
    this.requestId = requestId
    this.userId = userId
  }

  private log(level: LogLevel, message: string, meta?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      requestId: this.requestId,
      userId: this.userId,
      meta,
    }

    // In production, you'd send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service (e.g., Winston, Datadog, etc.)
      console.log(JSON.stringify(logEntry))
    } else {
      // Development logging with colors
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[37m', // White
      }
      const reset = '\x1b[0m'
      
      console.log(
        `${colors[level]}[${level.toUpperCase()}]${reset} ` +
        `${this.context}: ${message}`,
        meta || ''
      )
    }
  }

  error(message: string, meta?: any) {
    this.log(LogLevel.ERROR, message, meta)
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta)
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta)
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta)
  }

  // Structured logging methods
  logError(error: Error, context?: string) {
    this.error(error.message, {
      context,
      stack: error.stack,
      name: error.name,
      ...(error instanceof APIError && error.toJSON()),
    })
  }

  logAPIRequest(req: NextRequest, userId?: string) {
    const requestId = this.generateRequestId()
    this.setRequestContext(requestId, userId)

    this.info('API Request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: this.getClientIP(req),
    })

    return requestId
  }

  logAPIResponse(req: NextRequest, statusCode: number, responseTime: number) {
    this.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode,
      responseTime: `${responseTime}ms`,
    })
  }

  logSecurityEvent(event: string, details: any) {
    this.warn(`Security Event: ${event}`, {
      category: 'SECURITY',
      ...details,
    })
  }

  logBusinessEvent(event: string, details: any) {
    this.info(`Business Event: ${event}`, {
      category: 'BUSINESS',
      ...details,
    })
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIP(req: NextRequest): string {
    return (
      req.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'
    )
  }
}

// Error handler utility
export function handleApiError(
  error: unknown,
  context: string = 'API',
  requestId?: string,
  userId?: string
): NextResponse {
  const logger = new Logger(context)
  
  if (requestId) {
    logger.setRequestContext(requestId, userId)
  }

  if (error instanceof APIError) {
    logger.logError(error, context)
    
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        category: error.category,
        requestId,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.details,
          stack: error.stack 
        }),
      },
      { 
        status: error.statusCode,
        headers: {
          'X-Request-ID': requestId || '',
          'X-Error-Category': error.category,
          'X-Error-Code': error.code || '',
        }
      }
    )
  }

  if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'ZodError') {
      logger.warn('Validation error', { 
        context, 
        errors: (error as any).errors,
        requestId 
      })
      
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: (error as any).errors,
          requestId 
        },
        { 
          status: 400,
          headers: { 'X-Request-ID': requestId || '' }
        }
      )
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      logger.error('Database error', { 
        context, 
        prismaError: error,
        requestId 
      })
      
      return NextResponse.json(
        { 
          error: 'Database operation failed', 
          requestId 
        },
        { 
          status: 500,
          headers: { 'X-Request-ID': requestId || '' }
        }
      )
    }

    // Generic error
    logger.logError(error, context)
    
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
        requestId 
      },
      { 
        status: 500,
        headers: { 'X-Request-ID': requestId || '' }
      }
    )
  }

  // Unknown error type
  logger.error('Unknown error type', { 
    context, 
    error: String(error),
    requestId 
  })
  
  return NextResponse.json(
    { 
      error: 'An unexpected error occurred', 
      requestId 
    },
    { 
      status: 500,
      headers: { 'X-Request-ID': requestId || '' }
    }
  )
}

// Error creation helpers
export const createError = {
  badRequest: (message: string, details?: any) => 
    new APIError(message, 400, ErrorCategory.VALIDATION, 'BAD_REQUEST', details),
  
  unauthorized: (message: string = 'Unauthorized') => 
    new APIError(message, 401, ErrorCategory.AUTHENTICATION, 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Forbidden') => 
    new APIError(message, 403, ErrorCategory.AUTHORIZATION, 'FORBIDDEN'),
  
  notFound: (resource: string, id?: string) => 
    new APIError(
      `${resource}${id ? ` with id ${id}` : ''} not found`, 
      404, 
      ErrorCategory.BUSINESS_LOGIC, 
      'NOT_FOUND'
    ),
  
  conflict: (message: string, details?: any) => 
    new APIError(message, 409, ErrorCategory.BUSINESS_LOGIC, 'CONFLICT', details),
  
  tooManyRequests: (message: string = 'Rate limit exceeded') => 
    new APIError(message, 429, ErrorCategory.SYSTEM, 'RATE_LIMIT_EXCEEDED'),
  
  internal: (message: string, details?: any) => 
    new APIError(message, 500, ErrorCategory.SYSTEM, 'INTERNAL_ERROR', details),
  
  serviceUnavailable: (message: string = 'Service temporarily unavailable') => 
    new APIError(message, 503, ErrorCategory.EXTERNAL_API, 'SERVICE_UNAVAILABLE'),
}

// Request timing middleware
export function withRequestTiming<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  logger: Logger
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now()
    
    try {
      const result = await handler(...args)
      const duration = Date.now() - startTime
      
      logger.debug('Request completed', { duration: `${duration}ms` })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error('Request failed', { 
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error)
      })
      
      throw error
    }
  }
}

export default {
  Logger,
  APIError,
  handleApiError,
  createError,
  withRequestTiming,
  LogLevel,
  ErrorCategory,
}