import { UserRole } from '@prisma/client'
import { db } from './db'
import type { JWTPayload } from './auth-utils'

export async function userCanAccessProject(user: JWTPayload, projectId: string): Promise<boolean> {
  if (user.role === UserRole.ADMIN || user.role === UserRole.AUDITOR) {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true } })
    return !!project
  }

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { createdBy: user.userId },
        { organisation: { users: { some: { id: user.userId } } } }
      ]
    },
    select: { id: true }
  })

  return !!project
}

export async function userCanCreateForOrganisation(user: JWTPayload, organisationId: string): Promise<boolean> {
  if (user.role === UserRole.ADMIN || user.role === UserRole.AUDITOR) {
    return true
  }

  const organisation = await db.organisation.findFirst({
    where: {
      id: organisationId,
      users: {
        some: { id: user.userId }
      }
    },
    select: { id: true }
  })

  return !!organisation
}
