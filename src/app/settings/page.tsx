"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Bell, UserCog } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">Configure profile, notifications, and security preferences</p>
          </div>
          <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Profile</CardTitle>
              <CardDescription>Manage account and organization profile</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">Update user details and default preferences.</p></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
              <CardDescription>Alert and workflow notification controls</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">Set reminders for due dates and compliance checks.</p></CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle>
              <CardDescription>Authentication and access controls</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">Review role access and session security options.</p></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
