import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { findDemoUserById, upsertDemoUser } from '@/lib/mvp-demo-store'

interface UserPreferences {
  notifications?: {
    dueDates?: boolean
    complianceAlerts?: boolean
    weeklyDigest?: boolean
  }
  security?: {
    mfaEnabled?: boolean
    sessionTimeoutMinutes?: number
  }
}

function getPreferences(metadata: unknown): UserPreferences {
  if (!metadata || typeof metadata !== 'object') return {}
  const typedMetadata = metadata as Record<string, unknown>
  const preferences = typedMetadata.preferences
  if (!preferences || typeof preferences !== 'object') return {}
  return preferences as UserPreferences
}

async function getHandler(req: AuthenticatedRequest) {
  try {

    if (!process.env.DATABASE_URL) {
      const user = findDemoUserById(req.user!.userId)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          profile: {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          preferences: {}
        }
      })
    }

    const user = await db.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        metadata: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        preferences: getPreferences(user.metadata)
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

async function putHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const preferences = body.preferences && typeof body.preferences === 'object' ? body.preferences : undefined


    if (!process.env.DATABASE_URL) {
      const user = findDemoUserById(req.user!.userId)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const updated = { ...user, name: name ?? user.name, updatedAt: new Date().toISOString() }
      upsertDemoUser(updated)

      return NextResponse.json({
        success: true,
        data: {
          profile: {
            id: updated.id,
            email: updated.email,
            name: updated.name || '',
            role: updated.role,
            updatedAt: updated.updatedAt
          },
          preferences: preferences || {}
        }
      })
    }

    const existingUser = await db.user.findUnique({
      where: { id: req.user!.userId },
      select: { metadata: true }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingMetadata = (existingUser.metadata && typeof existingUser.metadata === 'object')
      ? (existingUser.metadata as Record<string, unknown>)
      : {}

    const existingPreferences = getPreferences(existingUser.metadata)

    const updated = await db.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(preferences !== undefined
          ? {
              metadata: {
                ...existingMetadata,
                preferences: {
                  ...existingPreferences,
                  ...preferences
                }
              }
            }
          : {})
      },
      select: {
        id: true,
        email: true,
        name: true,
        metadata: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: updated.id,
          email: updated.email,
          name: updated.name || '',
          role: updated.role,
          updatedAt: updated.updatedAt
        },
        preferences: getPreferences(updated.metadata)
      }
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

export const GET = withAuth(getHandler)
export const PUT = withAuth(putHandler)
