import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Calculator, 
  Wind, 
  Package, 
  Thermometer, 
  Plus,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  BarChart3,
  Pipette,
  RefreshCw,
  Snowflake,
  Flame,
  Factory,
  Shield,
  ThermometerSun,
  Layers,
  FileCheck,
  Zap,
  FileText,
} from 'lucide-react';
import { useProjectDesignSummary, WorkflowStage } from '@/hooks/useProjectDesignData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnifiedDesignReportDialog } from '@/components/design/UnifiedDesignReportDialog';

interface ProjectDesignSectionProps {
  projectId: string;
}

const typeIcons: Record<string, React.ElementType> = {
  load_calculation: Calculator,
  duct_system: Wind,
  pipe_system: Pipette,
  vrf_system: Snowflake,
  equipment_selection: Package,
  psychrometric: Thermometer,
  pipe_sizing: Pipette,
  pressure_drop: BarChart3,
};

const typeLabels: Record<string, string> = {
  load_calculation: 'Load Calculation',
  duct_system: 'Duct System',
  pipe_system: 'Pipe System',
  vrf_system: 'VRF System',
  equipment_selection: 'Equipment Selection',
  psychrometric: 'Psychrometric',
  pipe_sizing: 'Pipe Sizing',
  pressure_drop: 'Pressure Drop',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-amber-500/10 text-amber-600',
  in_review: 'bg-amber-500/10 text-amber-600',
  pending: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  approved: 'bg-emerald-500/10 text-emerald-600',
  issued: 'bg-emerald-500/10 text-emerald-600',
  finalized: 'bg-emerald-500/10 text-emerald-600',
};

function WorkflowProgress({ stages }: { stages: WorkflowStage[] }) {
  return (
    <div className="flex items-center justify-between gap-2 py-4">
      {stages.map((stage, index) => (
        <div key={stage.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
              stage.status === 'completed' && "bg-emerald-500 border-emerald-500 text-white",
              stage.status === 'in_progress' && "bg-amber-500 border-amber-500 text-white",
              stage.status === 'not_started' && "bg-background border-muted-foreground/30 text-muted-foreground"
            )}>
              {stage.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : stage.status === 'in_progress' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <span className="text-xs mt-2 text-center font-medium">{stage.name}</span>
            {stage.count > 0 && (
              <span className="text-xs text-muted-foreground">{stage.count} item{stage.count !== 1 ? 's' : ''}</span>
            )}
          </div>
          {index < stages.length - 1 && (
            <div className={cn(
              "h-0.5 flex-1 mx-2",
              stages[index + 1].status !== 'not_started' ? "bg-emerald-500" : "bg-muted-foreground/30"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ProjectDesignSection({ projectId }: ProjectDesignSectionProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useProjectDesignSummary(projectId);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleNewDesign = (type: string) => {
    const routes: Record<string, string> = {
      load_calculation: `/design/load-calculation?project=${projectId}`,
      duct_system: `/design/duct-sizing?project=${projectId}`,
      equipment_selection: `/design/equipment-selection?project=${projectId}`,
      psychrometric: `/design/psychrometric?project=${projectId}`,
      pipe_sizing: `/design/pipe-sizing?project=${projectId}`,
      pressure_drop: `/design/pressure-drop?project=${projectId}`,
      ventilation_calculator: `/design/ventilation-calculator?project=${projectId}`,
      erv_sizing: `/design/erv-sizing?project=${projectId}`,
      vrf_designer: `/design/vrf-designer?project=${projectId}`,
      chw_plant: `/design/chw-plant?project=${projectId}`,
      hw_plant: `/design/hw-plant?project=${projectId}`,
    };
    navigate(routes[type] || '/design');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, workflowStages, recentItems, specializedTools } = data || {
    summary: { loadCalculations: 0, ductSystems: 0, equipmentSelections: 0, otherDesignData: 0, completed: 0, inProgress: 0, total: 0 },
    workflowStages: [],
    recentItems: [],
    specializedTools: { hasCHWPlant: false, hasHWPlant: false, hasSmokeControl: false, hasThermalComfort: false, hasSBCCompliance: false, hasASHRAECompliance: false },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Design Data</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowReportDialog(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Design
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleNewDesign('load_calculation')}>
              <Calculator className="w-4 h-4 mr-2" />
              Load Calculation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDesign('ventilation_calculator')}>
              <Wind className="w-4 h-4 mr-2" />
              Ventilation Calculator
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDesign('psychrometric')}>
              <Thermometer className="w-4 h-4 mr-2" />
              Psychrometric Analysis
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNewDesign('equipment_selection')}>
              <Package className="w-4 h-4 mr-2" />
              Equipment Selection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDesign('erv_sizing')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              ERV/HRV Sizing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNewDesign('duct_system')}>
              <Wind className="w-4 h-4 mr-2" />
              Duct Sizing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDesign('pipe_sizing')}>
              <Pipette className="w-4 h-4 mr-2" />
              Pipe Sizing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDesign('vrf_designer')}>
              <Snowflake className="w-4 h-4 mr-2" />
              VRF Designer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNewDesign('chw_plant')}>
              <Factory className="w-4 h-4 mr-2" />
              Chilled Water Plant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDesign('hw_plant')}>
              <Flame className="w-4 h-4 mr-2" />
              Hot Water Plant
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleNewDesign('load_calculation')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.loadCalculations}</p>
              <p className="text-xs text-muted-foreground">Load Calcs</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleNewDesign('duct_system')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wind className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.ductSystems}</p>
              <p className="text-xs text-muted-foreground">Duct Systems</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleNewDesign('pipe_sizing')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Pipette className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.pipeSystems}</p>
              <p className="text-xs text-muted-foreground">Pipe Systems</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleNewDesign('equipment_selection')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Package className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.equipmentSelections}</p>
              <p className="text-xs text-muted-foreground">Equipment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      {workflowStages.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Design Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowProgress stages={workflowStages} />
          </CardContent>
        </Card>
      )}

      {/* Specialized Tools Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Specialized Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={specializedTools?.hasCHWPlant ? "default" : "outline"} 
                    className={cn(
                      "cursor-pointer",
                      specializedTools?.hasCHWPlant && "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20"
                    )}
                    onClick={() => handleNewDesign('chw_plant')}
                  >
                    <Factory className="w-3 h-3 mr-1" />
                    CHW Plant
                    {specializedTools?.hasCHWPlant && <CheckCircle2 className="w-3 h-3 ml-1" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Chilled Water Plant Sizing</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={specializedTools?.hasHWPlant ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      specializedTools?.hasHWPlant && "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
                    )}
                    onClick={() => handleNewDesign('hw_plant')}
                  >
                    <Flame className="w-3 h-3 mr-1" />
                    HW Plant
                    {specializedTools?.hasHWPlant && <CheckCircle2 className="w-3 h-3 ml-1" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Hot Water Plant Sizing</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={specializedTools?.hasSmokeControl ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      specializedTools?.hasSmokeControl && "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                    )}
                    onClick={() => navigate(`/design/smoke-control?project=${projectId}`)}
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    Smoke Control
                    {specializedTools?.hasSmokeControl && <CheckCircle2 className="w-3 h-3 ml-1" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Smoke Control Calculator (NFPA 92)</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={specializedTools?.hasThermalComfort ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      specializedTools?.hasThermalComfort && "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                    )}
                    onClick={() => navigate(`/design/thermal-comfort?project=${projectId}`)}
                  >
                    <ThermometerSun className="w-3 h-3 mr-1" />
                    Thermal Comfort
                    {specializedTools?.hasThermalComfort && <CheckCircle2 className="w-3 h-3 ml-1" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Thermal Comfort Analysis (ASHRAE 55)</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={specializedTools?.hasSBCCompliance ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      specializedTools?.hasSBCCompliance && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    )}
                    onClick={() => navigate(`/design/sbc-compliance?project=${projectId}`)}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    SBC
                    {specializedTools?.hasSBCCompliance && <CheckCircle2 className="w-3 h-3 ml-1" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Saudi Building Code Compliance</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={specializedTools?.hasASHRAECompliance ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      specializedTools?.hasASHRAECompliance && "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                    )}
                    onClick={() => navigate(`/design/ashrae-90-1?project=${projectId}`)}
                  >
                    <FileCheck className="w-3 h-3 mr-1" />
                    ASHRAE 90.1
                    {specializedTools?.hasASHRAECompliance && <CheckCircle2 className="w-3 h-3 ml-1" />}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>ASHRAE 90.1 Compliance Check</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Pipe Systems Detail */}
      {data?.allItems?.pipeSystems && data.allItems.pipeSystems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pipette className="w-4 h-4" />
                Pipe Systems
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/design/pipe-designer?project=${projectId}`)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.allItems.pipeSystems.map((system) => (
                <div 
                  key={system.id} 
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/design/pipe-designer?project=${projectId}&system=${system.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Pipette className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{system.name}</p>
                      {system.total_flow && (
                        <p className="text-xs text-muted-foreground">
                          {system.total_flow.toFixed(1)} GPM
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn("text-xs", statusColors[system.status])}>
                      {system.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duct Systems Detail */}
      {data?.allItems?.ductSystems && data.allItems.ductSystems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wind className="w-4 h-4" />
                Duct Systems
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/design/duct-designer?project=${projectId}`)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.allItems.ductSystems.map((system) => (
                <div 
                  key={system.id} 
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/design/duct-designer?project=${projectId}&system=${system.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Wind className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{system.name}</p>
                      {system.total_airflow && (
                        <p className="text-xs text-muted-foreground">
                          {system.total_airflow.toLocaleString()} CFM
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn("text-xs", statusColors[system.status])}>
                      {system.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VRF Systems Detail */}
      {data?.allItems?.vrfSystems && data.allItems.vrfSystems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Snowflake className="w-4 h-4" />
                VRF Systems
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/design/vrf-designer?project=${projectId}`)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.allItems.vrfSystems.map((system) => (
                <div 
                  key={system.id} 
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/design/vrf-designer?id=${system.id}&project=${projectId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <Snowflake className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{system.name}</p>
                      {system.capacity && (
                        <p className="text-xs text-muted-foreground">
                          {system.capacity}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn("text-xs", statusColors[system.status])}>
                      {system.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Design Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentItems.map((item) => {
                const Icon = typeIcons[item.type] || Calculator;
                const getRoute = () => {
                  if (item.type === 'pipe_system') return `/design/pipe-designer?project=${projectId}&system=${item.id}`;
                  if (item.type === 'duct_system') return `/design/duct-designer?project=${projectId}&system=${item.id}`;
                  return undefined;
                };
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      const route = getRoute();
                      if (route) navigate(route);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{typeLabels[item.type]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("text-xs", statusColors[item.status])}>
                        {item.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {summary.total === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No design data yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Start by creating a load calculation for this project
            </p>
            <Button onClick={() => handleNewDesign('load_calculation')}>
              <Plus className="w-4 h-4 mr-2" />
              New Load Calculation
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Report Dialog */}
      <UnifiedDesignReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        projectId={projectId}
      />
    </div>
  );
}
