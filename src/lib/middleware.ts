import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader, extractTokenFromCookie } from './auth-utils'
import { UserRole } from '@prisma/client'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: UserRole
  }
}

export function withAuth<TArgs extends unknown[]>(
  handler: (req: AuthenticatedRequest, ...args: TArgs) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, ...args: TArgs): Promise<NextResponse> => {
    try {
      const token = extractTokenFromHeader(req.headers.get('authorization') || undefined) ||
        extractTokenFromCookie(req.headers.get('cookie'))
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        )
      }

      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      // Add user info to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = payload

      return handler(authenticatedReq, ...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function withRole(roles: UserRole[]) {
  return function <TArgs extends unknown[]>(
    handler: (req: AuthenticatedRequest, ...args: TArgs) => Promise<NextResponse> | NextResponse
  ) {
    return withAuth(async (req: AuthenticatedRequest, ...args: TArgs): Promise<NextResponse> => {
      if (!req.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }

      if (!roles.includes(req.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(req, ...args)
    })
  }
}

export function withAdminAuth() {
  return withRole([UserRole.ADMIN])
}
