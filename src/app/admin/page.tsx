"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  Users, 
  Settings, 
  Shield, 
  Activity, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Database,
  Globe,
  BarChart3,
  FileText,
  UserPlus,
  Key,
  LogOut
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { AdminRoute } from "@/components/admin-route"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@prisma/client"

// Mock data for demonstration
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@techcorp.com",
    role: "ADMIN",
    status: "ACTIVE",
    lastLogin: "2024-01-22T10:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    organisations: ["TechCorp Inc."]
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@techcorp.com",
    role: "AUDITOR",
    status: "ACTIVE",
    lastLogin: "2024-01-21T15:45:00Z",
    createdAt: "2024-01-05T00:00:00Z",
    organisations: ["TechCorp Inc."]
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@greenenergy.com",
    role: "ANALYST",
    status: "ACTIVE",
    lastLogin: "2024-01-20T09:15:00Z",
    createdAt: "2024-01-10T00:00:00Z",
    organisations: ["GreenEnergy Ltd."]
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice.brown@manufacturing.com",
    role: "VIEWER",
    status: "INACTIVE",
    lastLogin: "2024-01-15T14:20:00Z",
    createdAt: "2024-01-12T00:00:00Z",
    organisations: ["Manufacturing Co."]
  }
]

const mockAuditLogs = [
  {
    id: "1",
    user: "John Doe",
    action: "USER_CREATED",
    detail: "Created new user: jane.smith@techcorp.com",
    timestamp: "2024-01-22T10:30:00Z",
    ipAddress: "192.168.1.100",
    project: null
  },
  {
    id: "2",
    user: "Jane Smith",
    action: "PROJECT_UPDATED",
    detail: "Updated project: TechCorp ESG Assessment 2024",
    timestamp: "2024-01-21T15:45:00Z",
    ipAddress: "192.168.1.101",
    project: "TechCorp ESG Assessment 2024"
  },
  {
    id: "3",
    user: "Bob Johnson",
    action: "REPORT_GENERATED",
    detail: "Generated XBRL report for project: GreenEnergy Sustainability Report",
    timestamp: "2024-01-20T09:15:00Z",
    ipAddress: "192.168.1.102",
    project: "GreenEnergy Sustainability Report"
  },
  {
    id: "4",
    user: "Alice Brown",
    action: "LOGIN_FAILED",
    detail: "Failed login attempt - invalid password",
    timestamp: "2024-01-15T14:20:00Z",
    ipAddress: "192.168.1.103",
    project: null
  }
]

const mockSystemStats = {
  totalUsers: 156,
  activeUsers: 142,
  totalProjects: 89,
  activeProjects: 67,
  totalReports: 234,
  systemUptime: "99.9%",
  databaseSize: "2.4 GB",
  lastBackup: "2024-01-22T02:00:00Z"
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN": return "bg-red-100 text-red-800"
    case "AUDITOR": return "bg-blue-100 text-blue-800"
    case "ANALYST": return "bg-green-100 text-green-800"
    case "VIEWER": return "bg-gray-100 text-gray-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE": return "bg-green-100 text-green-800"
    case "INACTIVE": return "bg-red-100 text-red-800"
    case "PENDING": return "bg-yellow-100 text-yellow-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "USER_CREATED": return <UserPlus className="h-4 w-4" />
    case "PROJECT_UPDATED": return <Edit className="h-4 w-4" />
    case "REPORT_GENERATED": return <FileText className="h-4 w-4" />
    case "LOGIN_FAILED": return <AlertTriangle className="h-4 w-4" />
    default: return <Activity className="h-4 w-4" />
  }
}

export default function AdminDashboard() {
  const { user, token } = useAuth()
  const [users, setUsers] = useState(mockUsers)
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "VIEWER" as UserRole,
    organisation: ""
  })

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUser,
          password: 'TempPassword123!' // In production, this should be generated and emailed
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUsers([...users, data.user])
        setNewUser({ name: "", email: "", role: "VIEWER", organisation: "" })
        setIsCreateUserDialogOpen(false)
      } else {
        const error = await response.json()
        console.error('Error creating user:', error.error)
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Administrator
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">System Administration</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage users, monitor system activity, and configure platform settings</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">{mockSystemStats.activeUsers} active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.activeProjects}</div>
                  <p className="text-xs text-muted-foreground">of {mockSystemStats.totalProjects} total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.totalReports}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockSystemStats.systemUptime}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Database Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Database Size</span>
                    <span className="text-sm text-slate-600">{mockSystemStats.databaseSize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Last Backup</span>
                    <span className="text-sm text-slate-600">{formatDate(mockSystemStats.lastBackup)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Backup Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>System Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">API Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Database Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Storage Status</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Warning
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </div>
                  <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the platform with appropriate permissions.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="role">Role</Label>
                          <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Administrator</SelectItem>
                              <SelectItem value="AUDITOR">Auditor</SelectItem>
                              <SelectItem value="ANALYST">Analyst</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="organisation">Organization</Label>
                          <Select value={newUser.organisation} onValueChange={(value) => setNewUser({...newUser, organisation: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TechCorp Inc.">TechCorp Inc.</SelectItem>
                              <SelectItem value="GreenEnergy Ltd.">GreenEnergy Ltd.</SelectItem>
                              <SelectItem value="Manufacturing Co.">Manufacturing Co.</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateUser}>Create User</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                {/* Users Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Organizations</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.organisations.map((org, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {org}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Monitor system activity and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <Card key={log.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {getActionIcon(log.action)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium">{log.user}</span>
                                <Badge variant="outline" className="text-xs">
                                  {log.action}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">{log.detail}</p>
                              <div className="flex items-center space-x-4 text-xs text-slate-500">
                                <span>{formatDate(log.timestamp)}</span>
                                <span>IP: {log.ipAddress}</span>
                                {log.project && (
                                  <span>Project: {log.project}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Configure system-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-users">Maximum Users</Label>
                    <Input id="max-users" type="number" defaultValue="1000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input id="session-timeout" type="number" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                    <Input id="max-file-size" type="number" defaultValue="50" />
                  </div>
                  <Button>Save Configuration</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password-policy">Password Policy</Label>
                    <Select defaultValue="strong">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                        <SelectItem value="very-strong">Very Strong</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mfa">Multi-Factor Authentication</Label>
                    <Select defaultValue="optional">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                        <SelectItem value="required">Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audit-level">Audit Logging Level</Label>
                    <Select defaultValue="detailed">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="verbose">Verbose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>Save Security Settings</Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Backup & Maintenance</CardTitle>
                <CardDescription>Manage system backups and maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Auto Backup Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Backup Retention</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Maintenance Window</Label>
                    <Select defaultValue="02:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="02:00">02:00 UTC</SelectItem>
                        <SelectItem value="03:00">03:00 UTC</SelectItem>
                        <SelectItem value="04:00">04:00 UTC</SelectItem>
                        <SelectItem value="05:00">05:00 UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button>Run Backup Now</Button>
                  <Button variant="outline">Schedule Maintenance</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </AdminRoute>
  )
}