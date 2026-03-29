import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Calculator,
  Settings,
  Wind,
  Droplets,
  Snowflake,
  Factory,
  ClipboardCheck,
  FileText,
  ArrowLeft,
  Workflow,
  BookMarked,
  Search,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StandardsReferenceCard } from "@/components/documentation/StandardsReferenceCard";
import { WorkflowStageCard } from "@/components/documentation/WorkflowStageCard";
import { ToolReferenceTable } from "@/components/documentation/ToolReferenceTable";
import { GlossarySearch } from "@/components/documentation/GlossarySearch";
import { InteractiveWorkflowDiagram } from "@/components/design/workflow/InteractiveWorkflowDiagram";
import {
  standardsData,
  toolsData,
  workflowStages,
  toolCategories,
} from "@/lib/design-tool-standards-data";

const categoryIcons: Record<string, React.ReactNode> = {
  'Core Calculations': <Calculator className="h-5 w-5" />,
  'Equipment Selection': <Settings className="h-5 w-5" />,
  'Air Distribution': <Wind className="h-5 w-5" />,
  'Water Distribution': <Droplets className="h-5 w-5" />,
  'VRF Systems': <Snowflake className="h-5 w-5" />,
  'Plant Design': <Factory className="h-5 w-5" />,
  'Analysis & Compliance': <ClipboardCheck className="h-5 w-5" />,
  'Documentation & Tracking': <FileText className="h-5 w-5" />,
};

export default function DesignDocumentation() {
  const [activeTab, setActiveTab] = useState("standards");

  // Group tools by category
  const toolsByCategory = toolsData.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof toolsData>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/design">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Design Tools
              </Link>
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    HVAC Design Tools Documentation
                  </h1>
                  <p className="text-muted-foreground">
                    Calculation standards, workflow guidance, and tool reference
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex gap-2">
              <Badge variant="outline" className="text-sm">
                {standardsData.length} Standards
              </Badge>
              <Badge variant="outline" className="text-sm">
                {toolsData.length} Tools
              </Badge>
              <Badge variant="outline" className="text-sm">
                {workflowStages.length} Stages
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="standards" className="gap-2">
              <BookMarked className="h-4 w-4" />
              <span className="hidden sm:inline">Standards</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="glossary" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Glossary</span>
            </TabsTrigger>
          </TabsList>

          {/* Standards Reference Tab */}
          <TabsContent value="standards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Standards Reference</CardTitle>
                <CardDescription>
                  Industry standards and codes used in HVAC design calculations. Click each card to expand details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {standardsData.map((standard) => (
                    <StandardsReferenceCard key={standard.id} {...standard} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Reference: Efficiency Requirements</CardTitle>
                <CardDescription>
                  ASHRAE 90.1-2022 minimum efficiency requirements for common equipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Water-Cooled Chillers</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Path A:</span> COP ≥ 6.17 / IPLV ≥ 12.70</p>
                      <p><span className="text-muted-foreground">Path B:</span> COP ≥ 5.77 / IPLV ≥ 13.65</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Air-Cooled Chillers</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Path A:</span> COP ≥ 2.96 / IPLV ≥ 10.00</p>
                      <p><span className="text-muted-foreground">Path B:</span> COP ≥ 2.79 / IPLV ≥ 10.87</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Gas Boilers</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">≤300 MBH:</span> AFUE ≥ 80%</p>
                      <p><span className="text-muted-foreground">&gt;300 MBH:</span> Thermal Eff. ≥ 80%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Design Tools by Category</CardTitle>
                <CardDescription>
                  Complete catalog of HVAC design tools organized by function
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {Object.entries(toolsByCategory).map(([category, tools]) => (
                    <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-primary/10 text-primary">
                            {categoryIcons[category] || <Settings className="h-5 w-5" />}
                          </div>
                          <span className="font-semibold">{category}</span>
                          <Badge variant="secondary" className="ml-2">
                            {tools.length} tools
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <ToolReferenceTable tools={tools} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* All Tools Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Tools Reference</CardTitle>
                <CardDescription>
                  Complete list of all design tools with standards and workflow stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <ToolReferenceTable tools={toolsData} showCategory />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            {/* Interactive Diagram */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Interactive Workflow Diagram</CardTitle>
                  <CardDescription>
                    Click on any stage to navigate. Hover to see dependencies.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/design/workflow-diagram">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Full Screen
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <InteractiveWorkflowDiagram embedded className="h-[500px]" />
              </CardContent>
            </Card>

            {/* Stage Details */}
            <Card>
              <CardHeader>
                <CardTitle>Design Workflow Stages</CardTitle>
                <CardDescription>
                  Detailed guide for each of the 11 design stages with inputs, outputs, and tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workflowStages.map((stage, index) => (
                    <WorkflowStageCard
                      key={stage.stage}
                      stage={stage}
                      isLast={index === workflowStages.length - 1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workflow Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="default">1</Badge>
                      Complete Stages in Order
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Each stage builds on the previous. Load calculations inform ventilation, 
                      which informs equipment sizing, etc. Skipping stages can result in undersized equipment.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="default">2</Badge>
                      Use Data Flow Suggestions
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Tools display suggestions to import data from upstream tools. 
                      This ensures consistency and saves time on data entry.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="default">3</Badge>
                      Verify with Compliance Tools
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Before finalizing, run ASHRAE 90.1 and SBC compliance checks 
                      to identify any deficiencies that need correction.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="default">4</Badge>
                      Track Progress with Dashboard
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Use the Design Completeness dashboard to monitor progress 
                      across all zones and identify incomplete areas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glossary Tab */}
          <TabsContent value="glossary">
            <Card>
              <CardHeader>
                <CardTitle>HVAC Terminology Glossary</CardTitle>
                <CardDescription>
                  Searchable reference for HVAC terms, abbreviations, and definitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GlossarySearch />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
