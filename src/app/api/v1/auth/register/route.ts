import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth-utils'
import { registerSchema } from '@/lib/validations'
import { withRegisterSecurity } from '@/lib/security-middleware'

const registerHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)
    const { email, password, name } = validatedData

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user - self-registration is always viewer
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'VIEWER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Log the registration event
    await db.auditLog.create({
      data: {
        actor: user.id,
        action: 'USER_REGISTERED',
        detailJson: { method: 'self_registration', role: user.role }
      }
    })

    const response = NextResponse.json({
      user,
      token,
      message: 'Registration successful'
    }, { status: 201 })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withRegisterSecurity(registerHandler)
