import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Pipette,
  LayoutDashboard,
  TrendingUp,
  Zap,
  Droplets,
  ExternalLink,
} from 'lucide-react';
import { useProjectDesignSummary, DesignItem } from '@/hooks/useProjectDesignData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProjectDesignSummaryProps {
  projectId: string;
}

const typeIcons: Record<string, React.ElementType> = {
  load_calculation: Calculator,
  duct_system: Wind,
  pipe_system: Pipette,
  equipment_selection: Package,
  psychrometric: Thermometer,
  pipe_sizing: Pipette,
  pressure_drop: TrendingUp,
};

const typeLabels: Record<string, string> = {
  load_calculation: 'Load Calculation',
  duct_system: 'Duct System',
  pipe_system: 'Pipe System',
  equipment_selection: 'Equipment Selection',
  psychrometric: 'Psychrometric',
  pipe_sizing: 'Pipe Sizing',
  pressure_drop: 'Pressure Drop',
};

const typeColors: Record<string, string> = {
  load_calculation: 'text-primary bg-primary/10',
  duct_system: 'text-blue-500 bg-blue-500/10',
  pipe_system: 'text-cyan-500 bg-cyan-500/10',
  equipment_selection: 'text-amber-500 bg-amber-500/10',
  psychrometric: 'text-emerald-500 bg-emerald-500/10',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-amber-500/10 text-amber-600',
  pending: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  approved: 'bg-emerald-500/10 text-emerald-600',
  finalized: 'bg-emerald-500/10 text-emerald-600',
};

function WorkflowProgress({ stages }: { stages: { id: string; name: string; status: string; count: number }[] }) {
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

function DesignItemCard({ item, onClick }: { item: DesignItem; onClick: () => void }) {
  const Icon = typeIcons[item.type] || Calculator;
  const colorClass = typeColors[item.type] || 'text-primary bg-primary/10';
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{typeLabels[item.type]}</p>
              {(item.zone_name || item.building_name) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.building_name && <span>{item.building_name}</span>}
                  {item.building_name && item.zone_name && ' → '}
                  {item.zone_name && <span>{item.zone_name}</span>}
                </p>
              )}
              {item.capacity && (
                <p className="text-xs text-primary font-medium mt-1">{item.capacity}</p>
              )}
              {item.total_airflow && (
                <p className="text-xs text-blue-500 font-medium mt-1">{item.total_airflow.toLocaleString()} CFM</p>
              )}
              {item.total_flow && (
                <p className="text-xs text-cyan-500 font-medium mt-1">{item.total_flow.toLocaleString()} GPM</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant="secondary" className={cn("text-xs", statusColors[item.status])}>
              {item.status}
            </Badge>
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DesignTypeSection({ 
  title, 
  items, 
  icon: Icon, 
  colorClass,
  onItemClick,
  onNewClick,
}: { 
  title: string; 
  items: DesignItem[];
  icon: React.ElementType;
  colorClass: string;
  onItemClick: (item: DesignItem) => void;
  onNewClick: () => void;
}) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Icon className={cn("w-10 h-10 mx-auto mb-3", colorClass.split(' ')[0])} />
          <p className="text-sm text-muted-foreground mb-3">No {title.toLowerCase()} yet</p>
          <Button variant="outline" size="sm" onClick={onNewClick}>
            <Plus className="w-4 h-4 mr-1" />
            Create {title}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onNewClick}>
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(item => (
          <DesignItemCard key={item.id} item={item} onClick={() => onItemClick(item)} />
        ))}
      </div>
    </div>
  );
}

export function ProjectDesignSummary({ projectId }: ProjectDesignSummaryProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useProjectDesignSummary(projectId);
  const [activeTab, setActiveTab] = useState('overview');

  const handleNewDesign = (type: string) => {
    const routes: Record<string, string> = {
      load_calculation: `/design/load-calculation?project=${projectId}`,
      duct_system: `/design/duct-sizing?project=${projectId}`,
      pipe_system: `/design/pipe-sizing?project=${projectId}`,
      equipment_selection: `/design/equipment-selection?project=${projectId}`,
      psychrometric: `/design/psychrometric?project=${projectId}`,
    };
    navigate(routes[type] || '/design');
  };

  const handleItemClick = (item: DesignItem) => {
    const routes: Record<string, string> = {
      load_calculation: `/design/load-calculation?project=${projectId}&id=${item.id}`,
      duct_system: `/design/duct-sizing?project=${projectId}&load=${item.id}`,
      pipe_system: `/design/pipe-sizing?project=${projectId}&load=${item.id}`,
      equipment_selection: `/design/equipment-selection?project=${projectId}`,
      psychrometric: `/design/psychrometric?project=${projectId}`,
    };
    navigate(routes[item.type] || '/design');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, workflowStages, recentItems, allItems } = data || {
    summary: { loadCalculations: 0, ductSystems: 0, pipeSystems: 0, equipmentSelections: 0, psychrometricAnalyses: 0, otherDesignData: 0, completed: 0, inProgress: 0, total: 0 },
    workflowStages: [],
    recentItems: [],
    allItems: { loadCalculations: [], ductSystems: [], pipeSystems: [], equipmentSelections: [], psychrometricAnalyses: [] },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Design Summary</h3>
          {summary.total > 0 && (
            <Badge variant="secondary">{summary.total} items</Badge>
          )}
        </div>
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
            <DropdownMenuItem onClick={() => handleNewDesign('psychrometric')}>
              <Thermometer className="w-4 h-4 mr-2" />
              Psychrometric Analysis
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNewDesign('equipment_selection')}>
              <Package className="w-4 h-4 mr-2" />
              Equipment Selection
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNewDesign('duct_system')}>
              <Wind className="w-4 h-4 mr-2" />
              Duct Sizing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNewDesign('pipe_system')}>
              <Pipette className="w-4 h-4 mr-2" />
              Pipe Sizing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors" 
          onClick={() => setActiveTab('load_calculations')}
        >
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
        
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors" 
          onClick={() => setActiveTab('duct_systems')}
        >
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

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors" 
          onClick={() => setActiveTab('pipe_systems')}
        >
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
        
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors" 
          onClick={() => setActiveTab('equipment')}
        >
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
        
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors" 
          onClick={() => setActiveTab('psychrometric')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Thermometer className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.psychrometricAnalyses}</p>
              <p className="text-xs text-muted-foreground">Psychrometric</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      {workflowStages.length > 0 && summary.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Design Workflow Progress</CardTitle>
            <CardDescription className="text-xs">
              {summary.completed} completed · {summary.inProgress} in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowProgress stages={workflowStages} />
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="load_calculations">Load Calcs</TabsTrigger>
          <TabsTrigger value="duct_systems">Duct</TabsTrigger>
          <TabsTrigger value="pipe_systems">Pipe</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="psychrometric">Psychro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {recentItems.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Design Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y">
                    {recentItems.map((item) => {
                      const Icon = typeIcons[item.type] || Calculator;
                      return (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", typeColors[item.type] || 'bg-primary/10 text-primary')}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{typeLabels[item.type]}</span>
                                {item.zone_name && (
                                  <>
                                    <span>•</span>
                                    <span>{item.zone_name}</span>
                                  </>
                                )}
                              </div>
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
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <LayoutDashboard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
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
        </TabsContent>

        <TabsContent value="load_calculations" className="mt-4">
          <DesignTypeSection
            title="Load Calculation"
            items={allItems.loadCalculations}
            icon={Calculator}
            colorClass="text-primary bg-primary/10"
            onItemClick={handleItemClick}
            onNewClick={() => handleNewDesign('load_calculation')}
          />
        </TabsContent>

        <TabsContent value="duct_systems" className="mt-4">
          <DesignTypeSection
            title="Duct System"
            items={allItems.ductSystems}
            icon={Wind}
            colorClass="text-blue-500 bg-blue-500/10"
            onItemClick={handleItemClick}
            onNewClick={() => handleNewDesign('duct_system')}
          />
        </TabsContent>

        <TabsContent value="pipe_systems" className="mt-4">
          <DesignTypeSection
            title="Pipe System"
            items={allItems.pipeSystems}
            icon={Pipette}
            colorClass="text-cyan-500 bg-cyan-500/10"
            onItemClick={handleItemClick}
            onNewClick={() => handleNewDesign('pipe_system')}
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <DesignTypeSection
            title="Equipment Selection"
            items={allItems.equipmentSelections}
            icon={Package}
            colorClass="text-amber-500 bg-amber-500/10"
            onItemClick={handleItemClick}
            onNewClick={() => handleNewDesign('equipment_selection')}
          />
        </TabsContent>

        <TabsContent value="psychrometric" className="mt-4">
          <DesignTypeSection
            title="Psychrometric Analysis"
            items={allItems.psychrometricAnalyses}
            icon={Thermometer}
            colorClass="text-emerald-500 bg-emerald-500/10"
            onItemClick={handleItemClick}
            onNewClick={() => handleNewDesign('psychrometric')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}