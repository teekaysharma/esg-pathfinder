'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  const { isAuthenticated, hasRole, isLoading } = useAuth()
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Loading your workspace…</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Checking authentication and permissions.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access this page.</p>
          <Link href={redirectTo}><Button>Go to Login</Button></Link>
        </div>
      </div>
    )
  }

  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Insufficient Permissions</h1>
          <p className="text-muted-foreground">You don't have the required permissions to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
