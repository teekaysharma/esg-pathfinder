"use client"

import { useState } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  FileText, 
  Target, 
  BarChart3, 
  Settings, 
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Download,
  Shield,
  Plus,
  Globe,
  TreePine,
  Users,
  Building2,
  TrendingUp,
  Clock
} from "lucide-react"
import Link from "next/link"

// Mock data for scope parsing suggestions
const mockScopeSuggestions = {
  entities: [
    {
      name: "TechCorp Inc.",
      type: "company",
      confidence: 0.95,
      suggestions: ["TechCorp Inc.", "TechCorp Incorporated", "TechCorp"]
    },
    {
      name: "Manufacturing Division",
      type: "division",
      confidence: 0.87,
      suggestions: ["Manufacturing Division", "Production Unit", "Manufacturing Unit"]
    }
  ],
  activities: [
    {
      name: "Software Development",
      type: "primary",
      confidence: 0.92,
      suggestions: ["Software Development", "IT Services", "Technology Development"]
    },
    {
      name: "Cloud Infrastructure",
      type: "supporting",
      confidence: 0.78,
      suggestions: ["Cloud Infrastructure", "Data Centers", "IT Infrastructure"]
    }
  ],
  geographies: [
    {
      name: "United States",
      type: "country",
      confidence: 0.98,
      suggestions: ["United States", "USA", "US"]
    },
    {
      name: "European Union",
      type: "region",
      confidence: 0.85,
      suggestions: ["European Union", "EU", "Europe"]
    }
  ],
  standards: [
    {
      name: "GRI Standards",
      type: "framework",
      confidence: 0.94,
      clause: "GRI 1-3",
      suggestions: ["GRI Standards", "Global Reporting Initiative", "GRI"]
    },
    {
      name: "SASB Technology & Services",
      type: "sector-specific",
      confidence: 0.89,
      clause: "SASB TC-AC-130a",
      suggestions: ["SASB Technology & Services", "SASB Tech", "SASB Software"]
    }
  ]
}

export default function ProjectWorkspace() {
  const [rawScope, setRawScope] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<any>({})
  const [structuredScope, setStructuredScope] = useState<any>(null)

  const handleAnalyzeScope = async () => {
    if (!rawScope.trim()) return
    
    setIsAnalyzing(true)
    
    // Simulate API call
    setTimeout(() => {
      setSuggestions(mockScopeSuggestions)
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleAcceptSuggestion = (category: string, index: number) => {
    const suggestion = suggestions[category][index]
    setAcceptedSuggestions(prev => ({
      ...prev,
      [category]: prev[category] ? [...prev[category], suggestion] : [suggestion]
    }))
  }

  const handleRejectSuggestion = (category: string, index: number) => {
    // Mark as rejected
    setSuggestions(prev => ({
      ...prev,
      [category]: prev[category].map((item: any, i: number) => 
        i === index ? {...item, rejected: true} : item
      )
    }))
  }

  const handleSaveScope = () => {
    // Create structured scope from accepted suggestions
    const scope = {
      entities: acceptedSuggestions.entities || [],
      activities: acceptedSuggestions.activities || [],
      geographies: acceptedSuggestions.geographies || [],
      standards: acceptedSuggestions.standards || [],
      rawScope: rawScope,
      createdAt: new Date().toISOString()
    }
    setStructuredScope(scope)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600"
    if (confidence >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="h-4 w-4" />
    if (confidence >= 0.7) return <AlertTriangle className="h-4 w-4" />
    return <XCircle className="h-4 w-4" />
  }

  return (
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
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">EP</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">ESG Pathfinder</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">TechCorp ESG Assessment 2024</h1>
              <p className="text-slate-600 dark:text-slate-400">Define project scope and analyze regulatory requirements</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">DRAFT</Badge>
              <Button onClick={handleSaveScope} disabled={!suggestions}>
                <Save className="h-4 w-4 mr-2" />
                Save Scope
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="scope" className="space-y-6">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="scope">Scope Definition</TabsTrigger>
            <TabsTrigger value="mapping">Standards Mapping</TabsTrigger>
            <TabsTrigger value="materiality">Materiality Analysis</TabsTrigger>
            <TabsTrigger value="tcfd">TCFD</TabsTrigger>
            <TabsTrigger value="csrd">CSRD</TabsTrigger>
            <TabsTrigger value="gri">GRI</TabsTrigger>
            <TabsTrigger value="ifrs">IFRS</TabsTrigger>
            <TabsTrigger value="data">Data Collection</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="scope" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Raw Scope Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Raw Scope Input</span>
                  </CardTitle>
                  <CardDescription>
                    Enter your company's scope, activities, and regulatory context in natural language
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="raw-scope">Scope Description</Label>
                    <Textarea
                      id="raw-scope"
                      placeholder="Enter your company scope, including activities, geographies, facilities, metrics, and timelines..."
                      value={rawScope}
                      onChange={(e) => setRawScope(e.target.value)}
                      rows={8}
                    />
                  </div>
                  
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Tip:</strong> Include information about your company's main activities, operating regions, size, and any specific ESG frameworks you're considering.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleAnalyzeScope} 
                    disabled={!rawScope.trim() || isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Scope...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Analyze Scope
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Auto-Parse Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>AI Suggestions</span>
                  </CardTitle>
                  <CardDescription>
                    Review and accept AI-generated scope mappings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions ? (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-6">
                        {/* Entities */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <span className="h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
                            Entities
                          </h4>
                          <div className="space-y-2">
                            {suggestions.entities.map((entity: any, index: number) => (
                              !entity.rejected && (
                                <Card key={index} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium">{entity.name}</span>
                                        <Badge variant="outline" className="text-xs">{entity.type}</Badge>
                                      </div>
                                      <div className="flex items-center space-x-2 text-sm">
                                        {getConfidenceIcon(entity.confidence)}
                                        <span className={getConfidenceColor(entity.confidence)}>
                                          {(entity.confidence * 100).toFixed(0)}% confidence
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleAcceptSuggestion("entities", index)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleRejectSuggestion("entities", index)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              )
                            ))}
                          </div>
                        </div>

                        {/* Activities */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                            Activities
                          </h4>
                          <div className="space-y-2">
                            {suggestions.activities.map((activity: any, index: number) => (
                              !activity.rejected && (
                                <Card key={index} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium">{activity.name}</span>
                                        <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                                      </div>
                                      <div className="flex items-center space-x-2 text-sm">
                                        {getConfidenceIcon(activity.confidence)}
                                        <span className={getConfidenceColor(activity.confidence)}>
                                          {(activity.confidence * 100).toFixed(0)}% confidence
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleAcceptSuggestion("activities", index)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleRejectSuggestion("activities", index)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              )
                            ))}
                          </div>
                        </div>

                        {/* Geographies */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <span className="h-2 w-2 bg-purple-500 rounded-full mr-2"></span>
                            Geographies
                          </h4>
                          <div className="space-y-2">
                            {suggestions.geographies.map((geography: any, index: number) => (
                              !geography.rejected && (
                                <Card key={index} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium">{geography.name}</span>
                                        <Badge variant="outline" className="text-xs">{geography.type}</Badge>
                                      </div>
                                      <div className="flex items-center space-x-2 text-sm">
                                        {getConfidenceIcon(geography.confidence)}
                                        <span className={getConfidenceColor(geography.confidence)}>
                                          {(geography.confidence * 100).toFixed(0)}% confidence
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleAcceptSuggestion("geographies", index)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleRejectSuggestion("geographies", index)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              )
                            ))}
                          </div>
                        </div>

                        {/* Standards */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <span className="h-2 w-2 bg-orange-500 rounded-full mr-2"></span>
                            Applicable Standards
                          </h4>
                          <div className="space-y-2">
                            {suggestions.standards.map((standard: any, index: number) => (
                              !standard.rejected && (
                                <Card key={index} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium">{standard.name}</span>
                                        <Badge variant="outline" className="text-xs">{standard.type}</Badge>
                                      </div>
                                      <div className="text-sm text-slate-600 mb-1">
                                        Clause: {standard.clause}
                                      </div>
                                      <div className="flex items-center space-x-2 text-sm">
                                        {getConfidenceIcon(standard.confidence)}
                                        <span className={getConfidenceColor(standard.confidence)}>
                                          {(standard.confidence * 100).toFixed(0)}% confidence
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleAcceptSuggestion("standards", index)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleRejectSuggestion("standards", index)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Enter scope description and click "Analyze Scope" to get AI suggestions</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Accepted Suggestions Summary */}
            {Object.keys(acceptedSuggestions).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Accepted Scope Elements</CardTitle>
                  <CardDescription>Summary of accepted AI suggestions for your project scope</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-600 mb-2">Entities</h4>
                      <div className="space-y-1">
                        {acceptedSuggestions.entities?.map((entity: any, index: number) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {entity.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-600 mb-2">Activities</h4>
                      <div className="space-y-1">
                        {acceptedSuggestions.activities?.map((activity: any, index: number) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {activity.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-600 mb-2">Geographies</h4>
                      <div className="space-y-1">
                        {acceptedSuggestions.geographies?.map((geography: any, index: number) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {geography.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-600 mb-2">Standards</h4>
                      <div className="space-y-1">
                        {acceptedSuggestions.standards?.map((standard: any, index: number) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {standard.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mapping">
            <Card>
              <CardHeader>
                <CardTitle>Standards Mapping</CardTitle>
                <CardDescription>Map your scope to specific ESG standards and regulatory requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* GRI Standards */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">GRI Standards</CardTitle>
                        <CardDescription>Global Reporting Initiative</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">GRI 302: Energy</div>
                              <div className="text-sm text-slate-600">Energy consumption and efficiency</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">GRI 305: Emissions</div>
                              <div className="text-sm text-slate-600">GHG emissions and removals</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div>
                              <div className="font-medium">GRI 403: Occupational Health</div>
                              <div className="text-sm text-slate-600">Worker health and safety</div>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SASB Standards */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">SASB Standards</CardTitle>
                        <CardDescription>Sustainability Accounting Standards Board</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">TC-AC-130a</div>
                              <div className="text-sm text-slate-600">Energy management</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">TC-AC-140a</div>
                              <div className="text-sm text-slate-600">Data center energy efficiency</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <div className="font-medium">TC-AC-150a</div>
                              <div className="text-sm text-slate-600">Water management</div>
                            </div>
                            <div className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Jurisdictional Requirements */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Regulatory</CardTitle>
                        <CardDescription>Jurisdictional requirements</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">CSRD</div>
                              <div className="text-sm text-slate-600">Corporate Sustainability Reporting</div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div>
                              <div className="font-medium">SEC Climate Rule</div>
                              <div className="text-sm text-slate-600">Climate-related disclosures</div>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <div className="font-medium">TCFD</div>
                              <div className="text-sm text-slate-600">Climate-related financial disclosures</div>
                            </div>
                            <div className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mapping Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Mapping Summary</CardTitle>
                      <CardDescription>Overview of mapped standards and requirements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">12</div>
                          <div className="text-sm text-slate-600">Mapped Standards</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-600">3</div>
                          <div className="text-sm text-slate-600">Pending Review</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">95%</div>
                          <div className="text-sm text-slate-600">Coverage</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materiality">
            <Card>
              <CardHeader>
                <CardTitle>Materiality Analysis</CardTitle>
                <CardDescription>Interactive materiality matrix with scoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Materiality Matrix */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Materiality Matrix</CardTitle>
                      <CardDescription>Impact on stakeholders vs financial impact</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        {/* Matrix Grid */}
                        <div className="grid grid-cols-11 gap-1 max-w-2xl mx-auto">
                          {/* Y-axis labels */}
                          <div></div>
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className="text-xs text-center text-slate-600">
                              {10 - i}
                            </div>
                          ))}
                          
                          {/* Matrix rows */}
                          {[...Array(10)].map((_, row) => (
                            <React.Fragment key={row}>
                              <div className="text-xs text-right pr-2 text-slate-600">
                                {row + 1}
                              </div>
                              {[...Array(10)].map((_, col) => {
                                const x = col + 1
                                const y = 10 - row
                                
                                // Sample data points
                                const dataPoints = [
                                  { x: 8, y: 9, label: "Climate Change", size: "large" },
                                  { x: 7, y: 8, label: "Data Privacy", size: "medium" },
                                  { x: 9, y: 6, label: "Energy Use", size: "medium" },
                                  { x: 6, y: 7, label: "Diversity", size: "small" },
                                  { x: 5, y: 5, label: "Supply Chain", size: "small" }
                                ]
                                
                                const point = dataPoints.find(p => p.x === x && p.y === y)
                                
                                return (
                                  <div
                                    key={col}
                                    className={`h-8 border border-slate-200 rounded flex items-center justify-center cursor-pointer hover:bg-slate-50 ${
                                      x > 6 && y > 6 ? 'bg-red-50' : 
                                      x > 4 && y > 4 ? 'bg-yellow-50' : 'bg-green-50'
                                    }`}
                                  >
                                    {point && (
                                      <div
                                        className={`rounded-full bg-blue-600 text-white text-xs flex items-center justify-center ${
                                          point.size === 'large' ? 'w-6 h-6' :
                                          point.size === 'medium' ? 'w-5 h-5' : 'w-4 h-4'
                                        }`}
                                        title={point.label}
                                      >
                                        {point.label.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                        
                        {/* Axis labels */}
                        <div className="flex justify-between mt-4 px-8">
                          <span className="text-sm text-slate-600">Low Financial Impact</span>
                          <span className="text-sm text-slate-600">High Financial Impact</span>
                        </div>
                        <div className="flex flex-col items-center justify-center ml-[-60px] mt-[-200px] h-40">
                          <span className="text-sm text-slate-600 transform -rotate-90 whitespace-nowrap">
                            High Stakeholder Impact
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center ml-[-60px] mt-[200px] h-40">
                          <span className="text-sm text-slate-600 transform -rotate-90 whitespace-nowrap">
                            Low Stakeholder Impact
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Material Topics List */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">High Materiality Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">Climate Change</h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">Financial: 8</Badge>
                                <Badge variant="outline">Stakeholder: 9</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600">GHG emissions, climate risks, transition planning</p>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">Data Privacy & Security</h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">Financial: 7</Badge>
                                <Badge variant="outline">Stakeholder: 8</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600">Data protection, cybersecurity, privacy compliance</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Medium Materiality Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">Energy Management</h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">Financial: 9</Badge>
                                <Badge variant="outline">Stakeholder: 6</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600">Energy consumption, renewable energy, efficiency</p>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">Diversity & Inclusion</h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">Financial: 6</Badge>
                                <Badge variant="outline">Stakeholder: 7</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600">Workforce diversity, inclusion programs, pay equity</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Management</CardTitle>
                <CardDescription>Upload and manage supporting evidence for your ESG disclosures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Upload Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upload Evidence</CardTitle>
                      <CardDescription>Supporting documents for ESG disclosures</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                        <h3 className="text-lg font-semibold mb-2">Upload Evidence Files</h3>
                        <p className="text-slate-600 mb-4">
                          Drag and drop files here or click to browse. Supported formats: PDF, DOC, XLS, images.
                        </p>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          Select Files
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Evidence List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Uploaded Evidence</h3>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Carbon Footprint Report 2024.pdf</h4>
                              <p className="text-sm text-slate-600">2.4 MB • Uploaded 2 days ago</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">GRI 305</Badge>
                            <Badge variant="secondary">TCFD</Badge>
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Energy Consumption Data.xlsx</h4>
                              <p className="text-sm text-slate-600">856 KB • Uploaded 1 week ago</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">GRI 302</Badge>
                            <Badge variant="secondary">SASB TC-AC-130a</Badge>
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Diversity & Inclusion Report.pdf</h4>
                              <p className="text-sm text-slate-600">1.8 MB • Uploaded 2 weeks ago</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">GRI 405</Badge>
                            <Badge variant="secondary">SASB TC-AC-410a</Badge>
                            <Button variant="outline" size="sm">View</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Report Generation</CardTitle>
                    <CardDescription>Generate audit-ready ESG reports with XBRL tagging</CardDescription>
                  </div>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate New Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Report Generation Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Report Options</CardTitle>
                      <CardDescription>Configure your ESG report generation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Include XBRL</h4>
                          <p className="text-sm text-slate-600">Add XBRL tags for auditor analysis</p>
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                            <span className="text-sm text-green-600">Enabled</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Evidence Integration</h4>
                          <p className="text-sm text-slate-600">Link evidence to disclosures</p>
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                            <span className="text-sm text-green-600">3 files linked</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Standards Coverage</h4>
                          <p className="text-sm text-slate-600">GRI, SASB, TCFD</p>
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            <span className="text-sm text-blue-600">95% complete</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Validation</h4>
                          <p className="text-sm text-slate-600">Data quality checks</p>
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                            <span className="text-sm text-yellow-600">2 warnings</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated Reports */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Generated Reports</h3>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">ESG Report v2.0</h4>
                            <p className="text-sm text-slate-600">Generated on March 15, 2024 • XBRL Enabled</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Latest</Badge>
                            <Badge variant="secondary">XBRL</Badge>
                            <Badge variant="outline">12 Sections</Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">45</div>
                            <div className="text-sm text-slate-600">XBRL Tags</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">12</div>
                            <div className="text-sm text-slate-600">Standards</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">3</div>
                            <div className="text-sm text-slate-600">Evidence Files</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">100%</div>
                            <div className="text-sm text-slate-600">Complete</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Report
                            </Button>
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download XBRL
                            </Button>
                          </div>
                          <Button variant="outline" size="sm">
                            Share with Auditors
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">ESG Report v1.0</h4>
                            <p className="text-sm text-slate-600">Generated on March 10, 2024 • Standard Format</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Archived</Badge>
                            <Badge variant="outline">8 Sections</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Report
                            </Button>
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                          <span className="text-sm text-slate-500">Superseded by v2.0</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* XBRL Validation Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                        XBRL Validation Status
                      </CardTitle>
                      <CardDescription>XBRL taxonomy validation and compliance status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium">Taxonomy Validation</div>
                              <div className="text-sm text-slate-600">All XBRL tags validated against IFRS and GRI taxonomies</div>
                            </div>
                          </div>
                          <Badge variant="outline">Passed</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium">Context References</div>
                              <div className="text-sm text-slate-600">All context references properly defined and linked</div>
                            </div>
                          </div>
                          <Badge variant="outline">Passed</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <div>
                              <div className="font-medium">Unit Consistency</div>
                              <div className="text-sm text-slate-600">2 warnings about unit consistency across metrics</div>
                            </div>
                          </div>
                          <Badge variant="outline">Warnings</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TCFD Assessment Tab */}
          <TabsContent value="tcfd" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>TCFD Assessment</span>
                  </CardTitle>
                  <CardDescription>
                    Task Force on Climate-related Financial Disclosures compliance assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">75%</div>
                      <div className="text-sm text-slate-600">Overall Score</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">3/4</div>
                      <div className="text-sm text-slate-600">Pillars Complete</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Governance</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Strategy</span>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Management</span>
                      <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Metrics & Targets</span>
                      <Badge className="bg-red-100 text-red-800">Not Started</Badge>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Target className="h-4 w-4 mr-2" />
                    Run TCFD Assessment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>TCFD Recommendations</span>
                  </CardTitle>
                  <CardDescription>
                    AI-generated recommendations for TCFD compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="font-medium text-sm">Enhance Climate Governance</div>
                      <div className="text-xs text-slate-600">Establish board-level climate oversight committee</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                      <div className="font-medium text-sm">Develop Climate Strategy</div>
                      <div className="text-xs text-slate-600">Create comprehensive climate transition plan</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div className="font-medium text-sm">Set Climate Targets</div>
                      <div className="text-xs text-slate-600">Establish science-based emission reduction targets</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CSRD Assessment Tab */}
          <TabsContent value="csrd" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>CSRD Compliance</span>
                  </CardTitle>
                  <CardDescription>
                    Corporate Sustainability Reporting Directive compliance status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">45%</div>
                      <div className="text-sm text-slate-600">Compliance Score</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">5</div>
                      <div className="text-sm text-slate-600">Critical Gaps</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Double Materiality</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ESRS Standards</span>
                      <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sector Requirements</span>
                      <Badge className="bg-red-100 text-red-800">Not Started</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Due Diligence</span>
                      <Badge className="bg-red-100 text-red-800">Not Started</Badge>
                    </div>
                  </div>

                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Run CSRD Assessment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Implementation Timeline</span>
                  </CardTitle>
                  <CardDescription>
                    CSRD implementation roadmap and critical milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Month 1-2: Double Materiality</div>
                        <div className="text-xs text-slate-600">Critical - Immediate action required</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Month 2-4: ESRS Standards</div>
                        <div className="text-xs text-slate-600">High priority - Plan implementation</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Month 3-5: Sector Requirements</div>
                        <div className="text-xs text-slate-600">Medium priority - Industry-specific</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Month 4-6: Due Diligence</div>
                        <div className="text-xs text-slate-600">Medium priority - Process setup</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* IFRS Standards Tab */}
          <TabsContent value="ifrs" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>IFRS Sustainability Standards</span>
                  </CardTitle>
                  <CardDescription>
                    International Financial Reporting Standards sustainability disclosure requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* IFRS Standards Overview */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        IFRS Standards Coverage
                      </h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">IFRS S1</span>
                            <Badge className="bg-green-100 text-green-800 text-xs">Ready</Badge>
                          </div>
                          <div className="text-xs text-slate-600 mb-2">General Requirements</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">IFRS S2</span>
                            <Badge className="bg-green-100 text-green-800 text-xs">Ready</Badge>
                          </div>
                          <div className="text-xs text-slate-600 mb-2">Climate Disclosures</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '80%'}}></div>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">IFRS S3-S7</span>
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Proposed</Badge>
                          </div>
                          <div className="text-xs text-slate-600 mb-2">Emerging Standards</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '30%'}}></div>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Readiness</span>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">72%</Badge>
                          </div>
                          <div className="text-xs text-slate-600 mb-2">Implementation Ready</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: '72%'}}></div>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* IFRS Standards Details */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Standards Implementation Status
                      </h4>
                      <div className="space-y-3">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">IFRS S1: General Requirements</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">85% Complete</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">Governance, strategy, risk management, and metrics for sustainability disclosures</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>✓ Governance oversight</div>
                            <div>✓ Risk management</div>
                            <div>✓ Strategy integration</div>
                            <div>⚠ Metrics framework</div>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">IFRS S2: Climate-related Disclosures</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">80% Complete</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">Climate risks, opportunities, governance, and GHG emissions reporting</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>✓ Climate risk assessment</div>
                            <div>✓ Scope 1 & 2 emissions</div>
                            <div>✓ Climate governance</div>
                            <div>⚠ Scope 3 emissions</div>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                              <span className="font-medium">IFRS S3-S7: Proposed Standards</span>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">30% Ready</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">Nature, human rights, resources, and circular economy disclosures</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>⚠ IFRS S3: Nature-related</div>
                            <div>⚠ IFRS S4: Human Rights</div>
                            <div>⚠ IFRS S5: Human Resources</div>
                            <div>⚠ IFRS S6: Resources</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Target className="h-4 w-4 mr-2" />
                        Run IFRS Assessment
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export IFRS Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* IFRS Sidebar */}
              <div className="space-y-6">
                {/* Overall IFRS Readiness */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">IFRS Readiness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">72%</div>
                      <div className="text-sm text-slate-600 mb-4">Implementation Ready</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>IFRS S1:</span>
                          <span className="font-medium">85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IFRS S2:</span>
                          <span className="font-medium">80%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IFRS S3-S7:</span>
                          <span className="font-medium">30%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* IFRS Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Implementation Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-sm text-green-800 mb-1">Immediate</div>
                        <div className="text-xs text-green-700">Complete IFRS S1 governance</div>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-sm text-yellow-800 mb-1">Short-term</div>
                        <div className="text-xs text-yellow-700">Enhance climate disclosures</div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-sm text-blue-800 mb-1">Long-term</div>
                        <div className="text-xs text-blue-700">Prepare for IFRS S3-S7</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key IFRS Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Key Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Sustainability governance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Climate risk assessment</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">GHG emissions reporting</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Stakeholder engagement</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Data Collection Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>ESG Data Collection</span>
                  </CardTitle>
                  <CardDescription>
                    Standardized ESG metrics and data collection framework
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-green-600">24</div>
                        <div className="text-xs text-slate-600">Environmental</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-blue-600">18</div>
                        <div className="text-xs text-slate-600">Social</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-purple-600">12</div>
                        <div className="text-xs text-slate-600">Governance</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-sm">GHG Emissions (Scope 1)</div>
                            <div className="text-xs text-slate-600">GRI_305_1 • 1,250 tCO2e</div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Validated</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-sm">Energy Consumption</div>
                            <div className="text-xs text-slate-600">GRI_302_1 • Pending validation</div>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Review</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-sm">Employee Turnover</div>
                            <div className="text-xs text-slate-600">GRI_401_1 • Missing data</div>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Missing</Badge>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Upload className="h-4 w-4 mr-2" />
                        Add Data Point
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Generate from Standards
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Data Quality</span>
                  </CardTitle>
                  <CardDescription>
                    Overall data quality metrics and validation status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">78%</div>
                      <div className="text-sm text-slate-600">Data Quality Score</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Completeness</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Accuracy</span>
                        <span className="font-medium">72%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "72%" }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Timeliness</span>
                        <span className="font-medium">90%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "90%" }}></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Validation Issues</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        3 data points require validation<br/>
                        2 data points have format issues
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Compliance Workflows</span>
                  </CardTitle>
                  <CardDescription>
                    Manage compliance workflows and track progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Workflow
                      </Button>
                      <Button variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Generate from Framework
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">TCFD Compliance Assessment</div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-3">Comprehensive TCFD framework compliance workflow</div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>3/5 tasks complete</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Due: Dec 31, 2024</span>
                          <span className="text-green-600 font-medium">On Track</span>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">CSRD Implementation</div>
                          <Badge className="bg-yellow-100 text-yellow-800">In Review</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-3">CSRD compliance implementation workflow</div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>2/6 tasks complete</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "33%" }}></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Due: Mar 31, 2025</span>
                          <span className="text-yellow-600 font-medium">At Risk</span>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Data Collection Q4</div>
                          <Badge className="bg-blue-100 text-blue-800">Draft</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-3">Quarterly data collection workflow</div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>0/4 tasks complete</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-gray-400 h-2 rounded-full" style={{ width: "0%" }}></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Due: Dec 15, 2024</span>
                          <span className="text-blue-600 font-medium">Not Started</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Workflow Summary</span>
                  </CardTitle>
                  <CardDescription>
                    Overview of all compliance workflows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">3</div>
                      <div className="text-sm text-slate-600">Active Workflows</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Completed</span>
                        </div>
                        <span className="font-medium">1</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>In Progress</span>
                        </div>
                        <span className="font-medium">5</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span>Pending</span>
                        </div>
                        <span className="font-medium">7</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Overdue Tasks</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        2 tasks require immediate attention<br/>
                        1 workflow at risk of delay
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Upcoming Deadlines</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        3 deadlines this week<br/>
                        5 deadlines this month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* GRI Tab */}
          <TabsContent value="gri" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>GRI Standards Assessment</span>
                  </CardTitle>
                  <CardDescription>
                    Global Reporting Initiative Standards compliance and readiness assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Universal Standards */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        Universal Standards (GRI 1, 2, 3)
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">GRI 1: Foundation</span>
                            <Badge className="bg-yellow-100 text-yellow-800">65%</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">Statement of use and organizational profile</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '65%'}}></div>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">GRI 2: General Disclosures</span>
                            <Badge className="bg-yellow-100 text-yellow-800">70%</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">Organizational information and governance</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '70%'}}></div>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">GRI 3: Material Topics</span>
                            <Badge className="bg-red-100 text-red-800">55%</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">Material topics and their management</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{width: '55%'}}></div>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Topic Standards */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center">
                        <TreePine className="h-4 w-4 mr-2" />
                        Topic Standards Coverage
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Economic</span>
                            <Badge className="bg-yellow-100 text-yellow-800">60%</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">GRI 201-207 (4/7 covered)</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '60%'}}></div>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Environmental</span>
                            <Badge className="bg-green-100 text-green-800">65%</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">GRI 301-308 (5/8 covered)</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '65%'}}></div>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Social</span>
                            <Badge className="bg-yellow-100 text-yellow-800">55%</Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">GRI 401-420 (11/20 covered)</div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '55%'}}></div>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Target className="h-4 w-4 mr-2" />
                        Run GRI Assessment
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GRI Sidebar */}
              <div className="space-y-6">
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overall GRI Readiness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-600 mb-2">62%</div>
                      <div className="text-sm text-slate-600 mb-4">Moderate Readiness</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Universal Standards:</span>
                          <span className="font-medium">63%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Topic Standards:</span>
                          <span className="font-medium">60%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sector Standards:</span>
                          <span className="font-medium">N/A</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reporting Principles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Reporting Principles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Stakeholder Inclusiveness</span>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">65%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Materiality</span>
                        <Badge className="bg-red-100 text-red-800 text-xs">55%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Completeness</span>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">60%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accuracy</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">70%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Key Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-sm text-red-800 mb-1">Critical</div>
                        <div className="text-xs text-red-700">Establish formal materiality assessment process</div>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-sm text-yellow-800 mb-1">Major</div>
                        <div className="text-xs text-yellow-700">Enhance stakeholder engagement framework</div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-sm text-blue-800 mb-1">Minor</div>
                        <div className="text-xs text-blue-700">Improve documentation practices</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Compliance Checks</span>
                  </CardTitle>
                  <CardDescription>
                    Track compliance status across all ESG frameworks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Check
                      </Button>
                      <Button variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Generate Checks
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">TCFD: Board Oversight</div>
                          <Badge className="bg-green-100 text-green-800">PASS</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-2">Board oversight of climate-related risks and opportunities</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Priority: High</span>
                          <span className="text-green-600">Completed</span>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">CSRD: Double Materiality</div>
                          <Badge className="bg-red-100 text-red-800">FAIL</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-2">Double materiality assessment conducted</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Priority: Critical</span>
                          <span className="text-red-600">Action Required</span>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">GRI: Material Topics</div>
                          <Badge className="bg-yellow-100 text-yellow-800">PARTIAL</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-2">Material topics identification process</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Priority: Medium</span>
                          <span className="text-yellow-600">In Progress</span>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">SASB: Industry Metrics</div>
                          <Badge className="bg-gray-100 text-gray-800">PENDING</Badge>
                        </div>
                        <div className="text-sm text-slate-600 mb-2">Industry-specific metrics calculated</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Priority: Medium</span>
                          <span className="text-gray-600">Not Started</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Compliance Status</span>
                  </CardTitle>
                  <CardDescription>
                    Overall compliance metrics and status overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">62%</div>
                      <div className="text-sm text-slate-600">Overall Compliance</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>TCFD</span>
                        <span className="font-medium">75%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>CSRD</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>GRI</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "68%" }}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>SASB</span>
                        <span className="font-medium">55%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: "55%" }}></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Critical Issues</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        3 critical compliance failures<br/>
                        5 high-priority gaps identified
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Recent Progress</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        8 checks completed this week<br/>
                        12 gaps remediated this month
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}