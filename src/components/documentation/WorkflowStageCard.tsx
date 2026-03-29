import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { WorkflowStage } from "@/lib/design-tool-standards-data";

interface WorkflowStageCardProps {
  stage: WorkflowStage;
  isLast?: boolean;
}

export function WorkflowStageCard({ stage, isLast = false }: WorkflowStageCardProps) {
  return (
    <div className="relative">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {stage.stage}
              </div>
              <CardTitle className="text-lg">{stage.name}</CardTitle>
            </div>
            <div className="flex gap-1.5">
              {stage.standards.slice(0, 3).map((std, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {std}
                </Badge>
              ))}
              {stage.standards.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{stage.standards.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{stage.purpose}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Inputs
              </h4>
              <ul className="space-y-1">
                {stage.inputs.map((input, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground mt-1.5">•</span>
                    {input}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Outputs
              </h4>
              <ul className="space-y-1">
                {stage.outputs.map((output, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    {output}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
              Tools
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {stage.tools.map((tool, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!isLast && (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-5 w-5" />
            <span className="text-xs font-medium">{stage.nextStage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
