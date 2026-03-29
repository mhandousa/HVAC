import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Wrench, 
  ArrowRight,
  CheckCircle2,
  Circle,
  Droplets,
  Flame,
  Wind,
  Thermometer,
  Building2,
  FileCheck,
  Fan,
  Gauge,
  Layers,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ToolStatus {
  id: string;
  name: string;
  completed: boolean;
  icon: React.ReactNode;
}

interface SpecializedToolsQuadrantProps {
  score: number;
  completedCount: number;
  totalCount: number;
  tools: ToolStatus[];
  projectId: string;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  chilledWaterPlant: <Droplets className="h-4 w-4" />,
  hotWaterPlant: <Flame className="h-4 w-4" />,
  smokeControl: <Wind className="h-4 w-4" />,
  thermalComfort: <Thermometer className="h-4 w-4" />,
  sbcCompliance: <Building2 className="h-4 w-4" />,
  ashrae901Compliance: <FileCheck className="h-4 w-4" />,
  ahuConfiguration: <Fan className="h-4 w-4" />,
  fanSelections: <Gauge className="h-4 w-4" />,
  pumpSelections: <Gauge className="h-4 w-4" />,
  insulationCalculations: <Layers className="h-4 w-4" />,
  sequenceOfOperations: <FileText className="h-4 w-4" />,
  // 3 equipment selection tools
  coilSelections: <Thermometer className="h-4 w-4" />,
  filterSelections: <Layers className="h-4 w-4" />,
  coolingTowerSelections: <Droplets className="h-4 w-4" />,
  // Phase 18: 5 new specialized tools
  economizerSelections: <Wind className="h-4 w-4" />,
  controlValveSelections: <Gauge className="h-4 w-4" />,
  expansionTankSelections: <Droplets className="h-4 w-4" />,
  silencerSelections: <Wind className="h-4 w-4" />,
  vibrationIsolationSelections: <Layers className="h-4 w-4" />,
};

export function SpecializedToolsQuadrant({
  score,
  completedCount,
  totalCount,
  tools,
  projectId
}: SpecializedToolsQuadrantProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4 text-purple-500" />
            Specialized Tools
          </CardTitle>
          <span className="text-2xl font-bold">{score.toFixed(0)}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tool icons grid - 19 tools in 5x4 grid (last row partial) */}
        <div className="grid grid-cols-5 gap-1.5">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-md border transition-colors",
                tool.completed 
                  ? "bg-green-50 border-green-200 text-green-600 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
                  : "bg-muted/50 border-muted text-muted-foreground"
              )}
              title={tool.name}
            >
              {TOOL_ICONS[tool.id] || <Wrench className="h-4 w-4" />}
            </div>
          ))}
        </div>

        {/* Completion count */}
        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <span className="text-muted-foreground">Completed</span>
          <span className="font-medium">{completedCount} / {totalCount}</span>
        </div>

        {/* Configure tools link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2 group" asChild>
              <Link to={`/design/specialized-tools-comparison?project=${projectId}`}>
                View Details <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Compare specialized tool completion across projects</p>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
