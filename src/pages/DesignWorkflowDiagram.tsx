import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InteractiveWorkflowDiagram } from '@/components/design/workflow/InteractiveWorkflowDiagram';

export default function DesignWorkflowDiagram() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/design">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Design Tools
                </Link>
              </Button>
              <div className="h-4 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">Interactive Workflow Diagram</h1>
                <p className="text-sm text-muted-foreground">
                  Click on any stage to navigate to that design tool
                </p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" asChild>
              <Link to="/design/documentation">
                <BookOpen className="h-4 w-4 mr-2" />
                View Documentation
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">HVAC Design Workflow</CardTitle>
            <CardDescription>
              Navigate through the 11-stage HVAC design process. Hover over nodes to see dependencies,
              click once to view details, click again to navigate.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InteractiveWorkflowDiagram 
              projectId={projectId}
              className="min-h-[700px]"
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• <strong>Hover</strong> on a node to highlight dependencies</li>
                <li>• <strong>Click once</strong> to view node details and tools</li>
                <li>• <strong>Click again</strong> or press "Open Tool" to navigate</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">View Modes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• <strong>Stages</strong>: High-level view of 11 design stages</li>
                <li>• <strong>Tools</strong>: Detailed view showing individual tools</li>
                <li>• Use zoom controls to adjust diagram size</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>• <span className="text-success">Green</span>: Stage complete</li>
                <li>• <span className="text-primary">Blue</span>: In progress</li>
                <li>• <span className="text-muted-foreground">Gray</span>: Pending</li>
                <li>• <span className="text-muted-foreground/50">Muted</span>: Locked (prerequisites needed)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
