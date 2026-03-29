import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Calculator, 
  Wind, 
  Thermometer, 
  Box, 
  GitBranch, 
  RefreshCw, 
  CheckCircle2, 
  Zap,
  Droplets,
  Building2,
  FileCheck,
  Snowflake,
  Flame,
  Gauge,
  FileSpreadsheet,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useZoneContext } from '@/hooks/useZoneContext';

// Define the 10-stage design workflow (expanded from 7)
export const DESIGN_WORKFLOW_STAGES = [
  { 
    id: 'load', 
    name: 'Load Calculation', 
    icon: Calculator, 
    path: '/load-calculation',
    description: 'Calculate heating and cooling loads',
    weight: 20,
    level: 'zone' as const,
  },
  { 
    id: 'ventilation', 
    name: 'Ventilation', 
    icon: Wind, 
    path: '/ventilation-calculator',
    description: 'Size outdoor air per ASHRAE 62.1',
    weight: 10,
    level: 'zone' as const,
  },
  { 
    id: 'psychrometric', 
    name: 'Psychrometric', 
    icon: Thermometer, 
    path: '/psychrometric-chart',
    description: 'Analyze air processes and coil sizing',
    weight: 0, // Optional stage
    optional: true,
    level: 'zone' as const,
  },
  { 
    id: 'ahu', 
    name: 'AHU Configuration', 
    icon: Building2, 
    path: '/ahu-configuration',
    description: 'Configure air handling units',
    weight: 10,
    level: 'project' as const,
  },
  { 
    id: 'terminal', 
    name: 'Terminal Units', 
    icon: Box, 
    path: '/terminal-unit-sizing',
    description: 'Size VAV boxes, FCUs, and zone terminals',
    weight: 10,
    level: 'zone' as const,
  },
  { 
    id: 'equipment', 
    name: 'Equipment', 
    icon: Snowflake, 
    path: '/equipment-selection',
    description: 'Select cooling/heating equipment',
    weight: 10,
    level: 'zone' as const,
  },
  { 
    id: 'distribution', 
    name: 'Distribution', 
    icon: GitBranch, 
    path: '/duct-designer',
    description: 'Design duct and pipe systems',
    weight: 15,
    level: 'project' as const,
  },
  { 
    id: 'diffuser', 
    name: 'Terminal Devices', 
    icon: Wind, 
    path: '/diffuser-selection',
    description: 'Select diffusers, grilles, and registers',
    weight: 5,
    level: 'zone' as const,
  },
  { 
    id: 'erv', 
    name: 'ERV/HRV', 
    icon: RefreshCw, 
    path: '/erv-sizing',
    description: 'Size energy recovery systems',
    weight: 0, // Optional stage
    optional: true,
    level: 'zone' as const,
  },
  { 
    id: 'plant', 
    name: 'Plant Equipment', 
    icon: Flame, 
    path: '/chw-plant',
    description: 'Size chillers, boilers, cooling towers',
    weight: 5,
    optional: true,
    level: 'project' as const,
  },
  { 
    id: 'compliance', 
    name: 'Compliance', 
    icon: FileCheck, 
    path: '/design-validation',
    description: 'Validate against codes and standards',
    weight: 15,
    level: 'project' as const,
  },
] as const;

export type WorkflowStageId = typeof DESIGN_WORKFLOW_STAGES[number]['id'];

// Map tool paths to their workflow stage (supports both /path and /design/path formats)
const TOOL_TO_STAGE_MAP: Record<string, WorkflowStageId> = {
  // Load Calculation Stage
  '/load-calculation': 'load',
  '/design/load-calculation': 'load',
  '/load-calc': 'load',
  '/design/load-calc': 'load',
  '/block-load': 'load',
  '/design/block-load': 'load',
  
  // Ventilation Stage
  '/ventilation': 'ventilation',
  '/design/ventilation': 'ventilation',
  '/ventilation-calculator': 'ventilation',
  '/design/ventilation-calculator': 'ventilation',
  '/dcv-analysis': 'ventilation',
  '/design/dcv-analysis': 'ventilation',
  '/iaq-calculator': 'ventilation',
  '/design/iaq-calculator': 'ventilation',
  
  // Psychrometric Stage
  '/psychrometric': 'psychrometric',
  '/design/psychrometric': 'psychrometric',
  '/psychrometric-chart': 'psychrometric',
  '/design/psychrometric-chart': 'psychrometric',
  
  // AHU Configuration Stage (NEW)
  '/ahu-configuration': 'ahu',
  '/design/ahu-configuration': 'ahu',
  '/coil-selection': 'ahu',
  '/design/coil-selection': 'ahu',
  '/filter-selection': 'ahu',
  '/design/filter-selection': 'ahu',
  
  // Terminal Units Stage (NEW)
  '/terminal-unit-sizing': 'terminal',
  '/design/terminal-unit-sizing': 'terminal',
  '/vav-box-selection': 'terminal',
  '/design/vav-box-selection': 'terminal',
  '/fcu-selection': 'terminal',
  '/design/fcu-selection': 'terminal',
  
  // Equipment Stage
  '/equipment-selection': 'equipment',
  '/design/equipment-selection': 'equipment',
  '/vrf-designer': 'equipment',
  '/design/vrf-designer': 'equipment',
  '/equipment-catalog': 'equipment',
  '/design/equipment-catalog': 'equipment',
  '/split-system-selection': 'equipment',
  '/design/split-system-selection': 'equipment',
  '/chiller-selection': 'equipment',
  '/design/chiller-selection': 'equipment',
  
  // Distribution Stage
  '/duct-designer': 'distribution',
  '/design/duct-designer': 'distribution',
  '/pipe-designer': 'distribution',
  '/design/pipe-designer': 'distribution',
  '/duct-sizing': 'distribution',
  '/design/duct-sizing': 'distribution',
  '/pipe-sizing': 'distribution',
  '/design/pipe-sizing': 'distribution',
  '/duct-comparison': 'distribution',
  '/design/duct-comparison': 'distribution',
  '/pipe-comparison': 'distribution',
  '/design/pipe-comparison': 'distribution',
  '/duct-lining': 'distribution',
  '/design/duct-lining': 'distribution',
  '/fan-selection': 'distribution',
  '/design/fan-selection': 'distribution',
  '/pump-selection': 'distribution',
  '/design/pump-selection': 'distribution',
  '/silencer-sizing': 'distribution',
  '/design/silencer-sizing': 'distribution',
  '/silencer-selection': 'distribution',
  '/design/silencer-selection': 'distribution',
  '/duct-lining-optimizer': 'distribution',
  '/design/duct-lining-optimizer': 'distribution',
  '/pressure-drop': 'distribution',
  '/design/pressure-drop': 'distribution',
  '/insulation-calculator': 'distribution',
  '/design/insulation-calculator': 'distribution',
  
  // Terminal Devices Stage (NEW - Diffusers/Grilles)
  '/diffuser-selection': 'diffuser',
  '/design/diffuser-selection': 'diffuser',
  '/grille-selection': 'diffuser',
  '/design/grille-selection': 'diffuser',
  '/register-selection': 'diffuser',
  '/design/register-selection': 'diffuser',
  '/terminal-unit-schedule': 'diffuser',
  '/design/terminal-unit-schedule': 'diffuser',
  
  // ERV Stage
  '/erv-sizing': 'erv',
  '/design/erv-sizing': 'erv',
  '/erv-hrv-sizing': 'erv',
  '/design/erv-hrv-sizing': 'erv',
  
  // Plant Equipment Stage (NEW)
  '/chw-plant': 'plant',
  '/design/chw-plant': 'plant',
  '/chilled-water-plant': 'plant',
  '/design/chilled-water-plant': 'plant',
  '/hw-plant': 'plant',
  '/design/hw-plant': 'plant',
  '/hot-water-plant': 'plant',
  '/design/hot-water-plant': 'plant',
  '/cooling-tower': 'plant',
  '/design/cooling-tower': 'plant',
  '/cooling-tower-sizing': 'plant',
  '/design/cooling-tower-sizing': 'plant',
  '/boiler-selection': 'plant',
  '/design/boiler-selection': 'plant',
  
  // Compliance Stage
  '/design-validation': 'compliance',
  '/design/design-validation': 'compliance',
  '/validation': 'compliance',
  '/design/validation': 'compliance',
  '/ashrae-compliance': 'compliance',
  '/design/ashrae-compliance': 'compliance',
  '/ashrae-90-compliance': 'compliance',
  '/design/ashrae-90-compliance': 'compliance',
  '/sbc-compliance': 'compliance',
  '/design/sbc-compliance': 'compliance',
  '/thermal-comfort': 'compliance',
  '/design/thermal-comfort': 'compliance',
  '/smoke-control': 'compliance',
  '/design/smoke-control': 'compliance',
  '/acoustic-dashboard': 'compliance',
  '/design/acoustic-dashboard': 'compliance',
  '/acoustic-calculator': 'compliance',
  '/design/acoustic-calculator': 'compliance',
  '/acoustic-cost-estimator': 'compliance',
  '/design/acoustic-cost-estimator': 'compliance',
  '/acoustic-roi': 'compliance',
  '/design/acoustic-roi': 'compliance',
  '/lifecycle-cost-analyzer': 'compliance',
  '/design/lifecycle-cost-analyzer': 'compliance',
  '/treatment-comparison': 'compliance',
  '/design/treatment-comparison': 'compliance',
  '/vibration-isolation': 'compliance',
  '/design/vibration-isolation': 'compliance',
  '/room-acoustics': 'compliance',
  '/design/room-acoustics': 'compliance',
  '/sequence-of-operations': 'compliance',
  '/design/sequence-of-operations': 'compliance',
  '/treatment-wizard': 'compliance',
  '/design/treatment-wizard': 'compliance',
  '/noise-path-analysis': 'compliance',
  '/design/noise-path-analysis': 'compliance',
  '/acoustic-floor-plan': 'compliance',
  '/design/acoustic-floor-plan': 'compliance',
  '/zone-acoustic-settings': 'compliance',
  '/design/zone-acoustic-settings': 'compliance',
  '/acoustic-measurement': 'compliance',
  '/design/acoustic-measurement': 'compliance',
  '/acoustic-comparison': 'compliance',
  '/design/acoustic-comparison': 'compliance',
  '/design-completeness': 'compliance',
  '/design/design-completeness': 'compliance',
  
  // Documentation tools - map to compliance (final stage)
  '/equipment-schedule': 'compliance',
  '/design/equipment-schedule': 'compliance',
  '/material-takeoff': 'compliance',
  '/design/material-takeoff': 'compliance',
  '/bas-points': 'compliance',
  '/design/bas-points': 'compliance',
  '/air-balance-report': 'compliance',
  '/design/air-balance-report': 'compliance',
  '/water-balance-report': 'compliance',
  '/design/water-balance-report': 'compliance',
  '/unified-design-report': 'compliance',
  '/design/unified-design-report': 'compliance',
};

// Related tools within each stage (updated for 10 stages)
const STAGE_RELATED_TOOLS: Record<WorkflowStageId, Array<{ name: string; path: string; icon: LucideIcon }>> = {
  load: [
    { name: 'Block Load', path: '/block-load', icon: Calculator },
  ],
  ventilation: [
    { name: 'DCV Analysis', path: '/dcv-analysis', icon: Wind },
    { name: 'IAQ Calculator', path: '/iaq-calculator', icon: Wind },
  ],
  psychrometric: [],
  ahu: [
    { name: 'Coil Selection', path: '/coil-selection', icon: Snowflake },
    { name: 'Filter Selection', path: '/filter-selection', icon: Wind },
  ],
  terminal: [
    { name: 'VAV Box Selection', path: '/vav-box-selection', icon: Box },
    { name: 'FCU Selection', path: '/fcu-selection', icon: Box },
  ],
  equipment: [
    { name: 'VRF Designer', path: '/vrf-designer', icon: Zap },
    { name: 'Equipment Catalog', path: '/equipment-catalog', icon: FileCheck },
    { name: 'Equipment Schedule', path: '/equipment-schedule', icon: FileSpreadsheet },
  ],
  distribution: [
    { name: 'Duct Sizing', path: '/duct-sizing', icon: GitBranch },
    { name: 'Pipe Sizing', path: '/pipe-sizing', icon: Droplets },
    { name: 'Fan Selection', path: '/design/fan-selection', icon: Wind },
    { name: 'Pump Selection', path: '/design/pump-selection', icon: Gauge },
  ],
  diffuser: [
    { name: 'Terminal Schedule', path: '/terminal-unit-schedule', icon: FileSpreadsheet },
  ],
  erv: [],
  plant: [
    { name: 'CHW Plant', path: '/chw-plant', icon: Snowflake },
    { name: 'HW Plant', path: '/hw-plant', icon: Flame },
    { name: 'Cooling Tower', path: '/cooling-tower', icon: Wind },
  ],
  compliance: [
    { name: 'ASHRAE 90.1', path: '/ashrae-compliance', icon: FileCheck },
    { name: 'SBC Compliance', path: '/sbc-compliance', icon: Building2 },
    { name: 'Smoke Control', path: '/smoke-control', icon: Wind },
    { name: 'Thermal Comfort', path: '/thermal-comfort', icon: Thermometer },
    { name: 'Acoustic Analysis', path: '/acoustic-calculator', icon: Wind },
    { name: 'Air Balance', path: '/design/air-balance-report', icon: FileSpreadsheet },
    { name: 'Water Balance', path: '/design/water-balance-report', icon: FileSpreadsheet },
  ],
};

interface DesignWorkflowNextStepProps {
  currentPath: string;
  projectId?: string | null;
  zoneId?: string | null;
  stageComplete?: boolean;
  className?: string;
  variant?: 'card' | 'inline' | 'compact';
  showRelatedTools?: boolean;
}

export function DesignWorkflowNextStep({
  currentPath,
  projectId,
  zoneId,
  stageComplete = false,
  className,
  variant = 'card',
  showRelatedTools = true,
}: DesignWorkflowNextStepProps) {
  const navigate = useNavigate();
  const { buildUrl: buildContextUrl, setContext } = useZoneContext();
  
  // Update zone context when props change (persist current tool's selection)
  // This ensures the selected zone is carried to the next tool
  const effectiveProjectId = projectId || null;
  const effectiveZoneId = zoneId || null;
  
  // Build URL using the zone context hook (which handles persistence)
  const buildUrl = (path: string) => {
    return buildContextUrl(path, { 
      projectId: effectiveProjectId, 
      zoneId: effectiveZoneId 
    });
  };
  
  // Determine current stage
  const currentStageId = TOOL_TO_STAGE_MAP[currentPath];
  const currentStageIndex = DESIGN_WORKFLOW_STAGES.findIndex(s => s.id === currentStageId);
  
  // Get next stage
  const nextStage = currentStageIndex >= 0 && currentStageIndex < DESIGN_WORKFLOW_STAGES.length - 1
    ? DESIGN_WORKFLOW_STAGES[currentStageIndex + 1]
    : null;
  
  // Get related tools for current stage
  const relatedTools = currentStageId ? STAGE_RELATED_TOOLS[currentStageId] : [];
  
  if (!nextStage && relatedTools.length === 0) {
    return null;
  }
  
  // Compact variant - just a button
  if (variant === 'compact') {
    return nextStage ? (
      <Button 
        onClick={() => navigate(buildUrl(nextStage.path))}
        className={cn("gap-2", className)}
      >
        Continue to {nextStage.name}
        <ArrowRight className="h-4 w-4" />
      </Button>
    ) : null;
  }
  
  // Inline variant - horizontal layout
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-4 p-4 bg-muted/50 rounded-lg", className)}>
        {stageComplete && (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Stage Complete
          </Badge>
        )}
        
        {nextStage && (
          <Button 
            onClick={() => navigate(buildUrl(nextStage.path))}
            className="gap-2"
          >
            <nextStage.icon className="h-4 w-4" />
            Continue to {nextStage.name}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        
        {showRelatedTools && relatedTools.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Related:</span>
            {relatedTools.slice(0, 3).map((tool) => (
              <Button 
                key={tool.path}
                variant="ghost" 
                size="sm"
                onClick={() => navigate(buildUrl(tool.path))}
                className="gap-1"
              >
                <tool.icon className="h-3 w-3" />
                {tool.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Card variant - full card layout (default)
  const NextIcon = nextStage?.icon || ArrowRight;
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Design Workflow
          </CardTitle>
          {stageComplete && (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Stage Complete
            </Badge>
          )}
        </div>
        <CardDescription>
          {currentStageIndex >= 0 && (
            <span>Stage {currentStageIndex + 1} of {DESIGN_WORKFLOW_STAGES.length}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-1">
          {DESIGN_WORKFLOW_STAGES.map((stage, index) => (
            <div 
              key={stage.id}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                index < currentStageIndex ? "bg-green-500" :
                index === currentStageIndex ? "bg-primary" :
                "bg-muted"
              )}
            />
          ))}
        </div>
        
        {/* Next step CTA */}
        {nextStage && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium flex items-center gap-2">
                  <NextIcon className="h-4 w-4 text-primary" />
                  Next: {nextStage.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {nextStage.description}
                </p>
              </div>
              <Button 
                onClick={() => navigate(buildUrl(nextStage.path))}
                className="gap-2 shrink-0"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Related tools */}
        {showRelatedTools && relatedTools.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Related Tools</p>
            <div className="grid grid-cols-2 gap-2">
              {relatedTools.map((tool) => (
                <Button 
                  key={tool.path}
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(buildUrl(tool.path))}
                  className="justify-start gap-2"
                >
                  <tool.icon className="h-4 w-4" />
                  {tool.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Final stage message */}
        {!nextStage && currentStageId === 'compliance' && (
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  Design Workflow Complete
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Review the Design Completeness Dashboard for a summary of your project.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 gap-2"
              onClick={() => navigate(buildUrl('/design-completeness'))}
            >
              View Completeness Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
