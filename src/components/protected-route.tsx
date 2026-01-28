'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requiredRoles?: import('@prisma/client').UserRole[]
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/', 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }
      
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => hasRole(role))
        if (!hasRequiredRole) {
          router.push('/dashboard')
          return
        }
      }
    }
  }, [isAuthenticated, hasRole, isLoading, router, requiredRoles, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Insufficient Permissions</h1>
          <p className="text-muted-foreground">You don't have the required permissions to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}