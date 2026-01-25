"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Download, 
  Eye, 
  Code, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Copy,
  ExternalLink
} from "lucide-react"
import { SyntaxHighlighter } from "react-syntax-highlighter"
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs"

interface XBRLTag {
  concept: string
  contextRef: string
  unitRef?: string
  value: string | number
  decimals?: number
  label?: string
}

interface ReportSection {
  title: string
  content: string
  xbrlTags: XBRLTag[]
  evidenceReferences: string[]
  standardReferences: string[]
}

interface ReportViewerProps {
  report: {
    id: string
    version: number
    content: {
      sections: ReportSection[]
      metadata: {
        generatedAt: string
        projectId: string
        organisation: string
        scope: any
        materiality: any
        standards: string[]
      }
    }
    xbrlContent?: string
    downloadUrls: {
      json?: string
      xbrl?: string
      pdf?: string
      docx?: string
    }
  }
}

export default function ReportViewer({ report }: ReportViewerProps) {
  const [selectedSection, setSelectedSection] = useState(0)
  const [viewMode, setViewMode] = useState<"formatted" | "xbrl">("formatted")

  const currentSection = report.content.sections[selectedSection]

  const getConceptLabel = (concept: string) => {
    const labelMap: Record<string, string> = {
      "ifrs-full:EnergyConsumption": "Energy Consumption",
      "ifrs-full:GreenhouseGasEmissions": "Greenhouse Gas Emissions",
      "ifrs-full:WaterWithdrawal": "Water Withdrawal",
      "ifrs-full:WasteGenerated": "Waste Generated",
      "ifrs-full:Employees": "Number of Employees",
      "ifrs-full:TrainingHours": "Training Hours",
      "ifrs-full:OccupationalInjuries": "Occupational Injuries",
      "ifrs-full:BoardIndependence": "Board Independence %",
      "ifrs-full:FemaleBoardMembers": "Female Board Members",
      "ifrs-full:AntiCorruptionPolicies": "Anti-Corruption Policies",
      "gri:GRI_302_1_Energy": "GRI 302-1: Energy",
      "gri:GRI_305_1_Direct_GHG": "GRI 305-1: Direct GHG Emissions",
      "gri:GRI_403_1_Occupational_injuries": "GRI 403-1: Occupational Injuries"
    }
    return labelMap[concept] || concept
  }

  const getConfidenceColor = (value: any) => {
    if (typeof value === 'number') {
      return "text-green-600"
    }
    return "text-blue-600"
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>ESG Report - {report.content.metadata.organisation}</span>
                <Badge variant="outline">v{report.version}</Badge>
              </CardTitle>
              <CardDescription>
                Generated on {new Date(report.content.metadata.generatedAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                DOCX
              </Button>
              {report.xbrlContent && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  XBRL
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{report.content.sections.length}</div>
              <div className="text-sm text-slate-600">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {report.content.sections.reduce((acc, section) => acc + section.xbrlTags.length, 0)}
              </div>
              <div className="text-sm text-slate-600">XBRL Tags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {report.content.sections.reduce((acc, section) => acc + section.standardReferences.length, 0)}
              </div>
              <div className="text-sm text-slate-600">Standards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {report.content.sections.reduce((acc, section) => acc + section.evidenceReferences.length, 0)}
              </div>
              <div className="text-sm text-slate-600">Evidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sections</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {report.content.sections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSection(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSection === index
                        ? "bg-blue-100 text-blue-900 border-l-4 border-blue-600"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{section.title}</span>
                      <div className="flex items-center space-x-1">
                        {section.xbrlTags.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {section.xbrlTags.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Section Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{currentSection.title}</CardTitle>
                  <CardDescription>
                    {currentSection.xbrlTags.length} XBRL tags • {currentSection.standardReferences.length} standard references
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "formatted" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("formatted")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Formatted
                  </Button>
                  <Button
                    variant={viewMode === "xbrl" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("xbrl")}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    XBRL View
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="xbrl-tags">XBRL Tags ({currentSection.xbrlTags.length})</TabsTrigger>
              <TabsTrigger value="references">References</TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <Card>
                <CardContent className="p-6">
                  {viewMode === "formatted" ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{currentSection.content}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">XBRL-Annotated Content</h4>
                        <div className="text-sm space-y-2">
                          {currentSection.xbrlTags.map((tag, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                {tag.concept}
                              </span>
                              <span className="text-sm">
                                {getConceptLabel(tag.concept)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {tag.value} {tag.unitRef}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>{currentSection.content}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="xbrl-tags">
              <Card>
                <CardContent className="p-6">
                  {currentSection.xbrlTags.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentSection.xbrlTags.map((tag, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">
                                  {getConceptLabel(tag.concept)}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(tag.concept)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">Concept:</span>
                                  <code className="bg-slate-100 px-2 py-1 rounded text-blue-600">
                                    {tag.concept}
                                  </code>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">Value:</span>
                                  <span className={`font-medium ${getConfidenceColor(tag.value)}`}>
                                    {tag.value} {tag.unitRef && `(${tag.unitRef})`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600">Context:</span>
                                  <code className="bg-slate-100 px-2 py-1 rounded">
                                    {tag.contextRef}
                                  </code>
                                </div>
                                {tag.decimals !== undefined && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Decimals:</span>
                                    <span>{tag.decimals}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No XBRL tags found in this section</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="references">
              <Card>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Standard References */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Standard References
                      </h4>
                      {currentSection.standardReferences.length > 0 ? (
                        <div className="space-y-2">
                          {currentSection.standardReferences.map((ref, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <code className="text-sm">{ref}</code>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">No standard references</p>
                      )}
                    </div>

                    {/* Evidence References */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Evidence References
                      </h4>
                      {currentSection.evidenceReferences.length > 0 ? (
                        <div className="space-y-2">
                          {currentSection.evidenceReferences.map((ref, index) => (
                            <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Evidence {index + 1}</span>
                                <Badge variant="outline" className="text-xs">
                                  Verified
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{ref}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">No evidence references</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* XBRL Source Preview */}
      {report.xbrlContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>XBRL Source</span>
              <Badge variant="outline">Complete Instance Document</Badge>
            </CardTitle>
            <CardDescription>
              Full XBRL instance document for auditor analysis and validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full">
              <SyntaxHighlighter
                language="xml"
                style={docco}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem"
                }}
              >
                {report.xbrlContent}
              </SyntaxHighlighter>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}