'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AdminRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AdminRoute({ children, redirectTo = '/' }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/')
        return
      }

      if (!isAdmin) {
        router.push('/dashboard')
        return
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Loading admin workspace…</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Verifying administrator access.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <Link href={redirectTo}><Button>Back to Home</Button></Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
