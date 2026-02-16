import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-at-least-32-characters-long'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
export const SALT_ROUNDS = 12

const isProductionRuntime =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build'

if (isProductionRuntime || process.env.NODE_ENV === 'test') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong value (minimum 32 characters)')
  }
}

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export function extractTokenFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null

  const tokenCookie = cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('auth_token='))

  if (!tokenCookie) return null
  return decodeURIComponent(tokenCookie.split('=')[1] || '')
}
