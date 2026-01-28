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
  LogOut,
  TrendingUp,
  Target,
  TreePine,
  Building2
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
  const [systemStats, setSystemStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "VIEWER" as UserRole,
    organisation: ""
  })

  // Fetch system stats on component mount
  React.useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSystemStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="esg-analytics">ESG Analytics</TabsTrigger>
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
                  <div className="text-2xl font-bold">{loading ? '...' : systemStats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">{loading ? '...' : systemStats?.activeUsers || 0} active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : systemStats?.activeProjects || 0}</div>
                  <p className="text-xs text-muted-foreground">of {loading ? '...' : systemStats?.totalProjects || 0} total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ESG Assessments</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : systemStats?.esgAssessments?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">All frameworks</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Points</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : systemStats?.dataPoints?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">ESG metrics collected</p>
                </CardContent>
              </Card>
            </div>

            {/* ESG Framework Overview */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">ESG Framework Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">TCFD</span>
                    </div>
                    <div className="text-2xl font-bold">{loading ? '...' : systemStats?.esgAssessments?.tcfd || 0}</div>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TreePine className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium">CSRD</span>
                    </div>
                    <div className="text-2xl font-bold">{loading ? '...' : systemStats?.esgAssessments?.csrd || 0}</div>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Globe className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium">GRI</span>
                    </div>
                    <div className="text-2xl font-bold">{loading ? '...' : systemStats?.esgAssessments?.gri || 0}</div>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="font-medium">ISSB</span>
                    </div>
                    <div className="text-2xl font-bold">{loading ? '...' : systemStats?.esgAssessments?.issb || 0}</div>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="font-medium">SASB</span>
                    </div>
                    <div className="text-2xl font-bold">{loading ? '...' : systemStats?.esgAssessments?.sasb || 0}</div>
                    <p className="text-xs text-muted-foreground">Assessments</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* System Information */}
            <div className="grid lg:grid-cols-3 gap-6">
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
                    <span className="text-sm text-slate-600">{loading ? '...' : systemStats?.databaseSize || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Last Backup</span>
                    <span className="text-sm text-slate-600">
                      {loading ? '...' : systemStats?.lastBackup ? formatDate(systemStats.lastBackup) : 'Unknown'}
                    </span>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Data Points by Category</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="text-sm text-slate-600">Loading...</div>
                  ) : systemStats?.dataPoints?.byCategory ? (
                    Object.entries(systemStats.dataPoints.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{category.toLowerCase()}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent System Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-sm text-slate-600">Loading activity...</div>
                  ) : systemStats?.recentActivity && systemStats.recentActivity.length > 0 ? (
                    systemStats.recentActivity.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {getActionIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {activity.user}
                          </p>
                          <p className="text-sm text-slate-600 truncate">
                            {activity.action.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600">No recent activity</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ESG Analytics Tab */}
          <TabsContent value="esg-analytics" className="space-y-6">
            {/* ESG Framework Performance */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Framework Adoption</span>
                  </CardTitle>
                  <CardDescription>
                    Usage statistics across ESG frameworks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'TCFD', count: systemStats?.esgAssessments?.tcfd || 0, color: 'bg-blue-500' },
                      { name: 'CSRD', count: systemStats?.esgAssessments?.csrd || 0, color: 'bg-green-500' },
                      { name: 'GRI', count: systemStats?.esgAssessments?.gri || 0, color: 'bg-purple-500' },
                      { name: 'ISSB', count: systemStats?.esgAssessments?.issb || 0, color: 'bg-orange-500' },
                      { name: 'SASB', count: systemStats?.esgAssessments?.sasb || 0, color: 'bg-red-500' }
                    ].map((framework) => (
                      <div key={framework.name} className="flex items-center space-x-3">
                        <div className="w-16 text-sm font-medium">{framework.name}</div>
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`${framework.color} h-2 rounded-full`} 
                            style={{ 
                              width: `${systemStats?.esgAssessments?.total > 0 ? 
                                (framework.count / systemStats.esgAssessments.total) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <div className="w-12 text-sm text-right">{framework.count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Compliance Status</span>
                  </CardTitle>
                  <CardDescription>
                    Overall compliance check status across all projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-sm text-slate-600">Loading compliance data...</div>
                    ) : systemStats?.complianceChecks?.byStatus ? (
                      Object.entries(systemStats.complianceChecks.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{status.toLowerCase()}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  status === 'COMPLETED' ? 'bg-green-500' :
                                  status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                                  status === 'FAILED' ? 'bg-red-500' : 'bg-gray-500'
                                }`}
                                style={{ 
                                  width: `${systemStats.complianceChecks.total > 0 ? 
                                    (count as number / systemStats.complianceChecks.total) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{count as number}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-600">No compliance data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Data Quality Metrics</span>
                </CardTitle>
                <CardDescription>
                  ESG data validation and completeness status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {systemStats?.dataPoints?.total || 0}
                    </div>
                    <div className="text-sm text-slate-600">Total Data Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {systemStats?.dataPoints?.byCategory?.Environmental || 0}
                    </div>
                    <div className="text-sm text-slate-600">Environmental Metrics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {systemStats?.dataPoints?.byCategory?.Social || 0}
                    </div>
                    <div className="text-sm text-slate-600">Social Metrics</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Assessment Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest ESG assessment completions and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">85%</div>
                      <div className="text-sm text-blue-600">Avg TCFD Score</div>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">78%</div>
                      <div className="text-sm text-green-600">Avg CSRD Score</div>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">72%</div>
                      <div className="text-sm text-purple-600">Avg GRI Score</div>
                    </div>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">80%</div>
                      <div className="text-sm text-orange-600">Avg ISSB Score</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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