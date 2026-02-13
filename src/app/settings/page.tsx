"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Bell, UserCog, Loader2, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

type Preferences = {
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

export default function SettingsPage() {
  const { token, logout } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [preferences, setPreferences] = useState<Preferences>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }, [token])

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/v1/settings', {
          credentials: 'include',
          headers: authHeaders
        })

        if (!response.ok) {
          throw new Error('Failed to load settings')
        }

        const data = await response.json()
        const profile = data.data?.profile
        const prefs = data.data?.preferences || {}

        setName(profile?.name || '')
        setEmail(profile?.email || '')
        setRole(profile?.role || '')
        setPreferences(prefs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ name, preferences })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to save settings' }))
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess('Settings saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const toggle = (group: 'notifications' | 'security', key: string, checked: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] || {}),
        [key]: checked
      }
    }))
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="container mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-slate-600 dark:text-slate-400">Configure profile, notifications, and security preferences</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Log out</Button>
              <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
            </div>
          </div>

          {error && <Alert className="border-red-200 bg-red-50"><AlertDescription className="text-red-700">{error}</AlertDescription></Alert>}
          {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Profile</CardTitle>
                  <CardDescription>Manage account and organization profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} disabled />
                  </div>
                  <div className="text-xs text-slate-500">Role: {role}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
                  <CardDescription>Alert and workflow notification controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-sm">Due-date reminders</span><Switch checked={!!preferences.notifications?.dueDates} onCheckedChange={(c) => toggle('notifications', 'dueDates', c)} /></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Compliance alerts</span><Switch checked={!!preferences.notifications?.complianceAlerts} onCheckedChange={(c) => toggle('notifications', 'complianceAlerts', c)} /></div>
                  <div className="flex items-center justify-between"><span className="text-sm">Weekly digest</span><Switch checked={!!preferences.notifications?.weeklyDigest} onCheckedChange={(c) => toggle('notifications', 'weeklyDigest', c)} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle>
                  <CardDescription>Authentication and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-sm">Enable MFA</span><Switch checked={!!preferences.security?.mfaEnabled} onCheckedChange={(c) => toggle('security', 'mfaEnabled', c)} /></div>
                  <div className="text-sm text-slate-600">Session timeout follows backend policy for now.</div>
                </CardContent>
              </Card>
            </div>
          )}

          <div>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Save Settings</Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
