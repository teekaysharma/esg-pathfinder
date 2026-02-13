import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware'
import { createUserSchema } from '@/lib/validations'
import { hashPassword } from '@/lib/auth-utils'

async function handler(req: AuthenticatedRequest) {
  try {
    if (req.method === 'GET') {
      const users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          organisations: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json({ users })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      
      // Validate input
      const validatedData = createUserSchema.parse(body)
      const { email, password, name, role, organisationId } = validatedData

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          organisations: organisationId ? {
            connect: { id: organisationId }
          } : undefined
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          organisations: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Log the user creation event
      await db.auditLog.create({
        data: {
          actor: req.user!.userId,
          action: 'USER_CREATED',
          detailJson: { 
            targetUserId: user.id, 
            email: user.email, 
            role: user.role 
          }
        }
      })

      return NextResponse.json({ user }, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  } catch (error) {
    console.error('Admin users error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth()(handler)
export const POST = withAdminAuth()(handler)