import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  CircleDot, 
  ArrowRight, 
  RefreshCw, 
  ExternalLink,
  Calculator,
  Settings,
  Box,
  Wind,
  Droplets,
  Fan,
  Volume2,
  Snowflake,
  Flame,
  Factory,
  RefreshCcw,
  Network,
  Thermometer,
  VolumeX,
  Container,
  Gauge,
  Waves,
  Layers,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useDataLineage,
  getStaleConnectionsCount,
  getNodeTypeLabel,
  getNodeTypeColor,
  type LineageNode,
  type LineageEdge,
  type LineageNodeType,
} from '@/hooks/useDataLineage';

interface DataLineageGraphProps {
  projectId: string;
  zoneId?: string | null;
  className?: string;
  compact?: boolean;
}

// Map node types to their tool paths for navigation
const NODE_TYPE_TO_PATH: Record<LineageNode['type'], string> = {
  load_calculation: '/design/load-calculation',
  equipment_selection: '/design/equipment-selection',
  ahu_configuration: '/design/ahu-configuration',
  terminal_unit: '/design/terminal-unit-selection',
  duct_system: '/design/duct-sizing',
  pipe_system: '/design/pipe-sizing',
  acoustic_analysis: '/design/acoustic-analysis',
  cost_estimate: '/design/acoustic-cost-estimator',
  // Plant equipment paths
  chiller_selection: '/design/chiller-selection',
  boiler_selection: '/design/boiler-selection',
  cooling_tower_selection: '/design/cooling-tower-sizing',
  chw_plant: '/design/chw-plant',
  hw_plant: '/design/hw-plant',
  erv_sizing: '/design/erv-sizing',
  vrf_system: '/design/vrf-designer',
  // Phase 18 specialty equipment paths
  economizer_selection: '/design/economizer-sizing',
  silencer_selection: '/design/silencer-sizing',
  expansion_tank_selection: '/design/expansion-tank-sizing',
  control_valve_selection: '/design/control-valve-sizing',
  vibration_isolation_selection: '/design/vibration-isolation',
  // Compliance paths
  smoke_control: '/design/smoke-control',
  insulation_calculation: '/design/insulation-calculator',
  ventilation_calculation: '/design/ventilation-calculator',
  sbc_compliance: '/design/sbc-compliance',
  ashrae_compliance: '/design/ashrae-90-1-compliance',
};

// Get icon component for node type
function getNodeIcon(type: LineageNodeType) {
  const iconMap: Record<LineageNodeType, React.ElementType> = {
    load_calculation: Calculator,
    equipment_selection: Settings,
    terminal_unit: Box,
    duct_system: Wind,
    pipe_system: Droplets,
    ahu_configuration: Fan,
    acoustic_analysis: Volume2,
    cost_estimate: Calculator,
    chiller_selection: Snowflake,
    boiler_selection: Flame,
    cooling_tower_selection: Droplets,
    chw_plant: Factory,
    hw_plant: Factory,
    erv_sizing: RefreshCcw,
    vrf_system: Network,
    // Phase 18 specialty equipment icons
    economizer_selection: Thermometer,
    silencer_selection: VolumeX,
    expansion_tank_selection: Container,
    control_valve_selection: Gauge,
    vibration_isolation_selection: Waves,
    // Compliance icons
    smoke_control: AlertTriangle,
    insulation_calculation: Layers,
    ventilation_calculation: Wind,
    sbc_compliance: Shield,
    ashrae_compliance: BadgeCheck,
  };
  return iconMap[type] || CircleDot;
}

export function DataLineageGraph({
  projectId,
  zoneId,
  className,
  compact = false,
}: DataLineageGraphProps) {
  const navigate = useNavigate();
  const { data: graph, isLoading, refetch } = useDataLineage(projectId, zoneId);

  const staleCount = useMemo(() => getStaleConnectionsCount(graph), [graph]);

  // Group nodes by type for layered display with expanded type order
  const nodesByType = useMemo(() => {
    if (!graph) return new Map();
    const grouped = new Map<LineageNode['type'], LineageNode[]>();
    
    // Ordered by workflow: Core > Air Systems > Water Systems > Plant > Analysis
    const typeOrder: LineageNode['type'][] = [
      'load_calculation',
      'equipment_selection',
      'ahu_configuration',
      'terminal_unit',
      'duct_system',
      'pipe_system',
      // Plant equipment layer
      'chw_plant',
      'chiller_selection',
      'cooling_tower_selection',
      'hw_plant',
      'boiler_selection',
      'erv_sizing',
      'vrf_system',
      // Analysis
      'acoustic_analysis',
      'cost_estimate',
    ];

    typeOrder.forEach((type) => {
      const nodesOfType = graph.nodes.filter((n) => n.type === type);
      if (nodesOfType.length > 0) {
        grouped.set(type, nodesOfType);
      }
    });

    return grouped;
  }, [graph]);

  // Navigate to the tool page for a specific node
  const handleNodeClick = (node: LineageNode) => {
    const path = NODE_TYPE_TO_PATH[node.type];
    if (path) {
      const params = new URLSearchParams();
      params.set('project', projectId);
      if (zoneId) params.set('zone', zoneId);
      navigate(`${path}?${params.toString()}`);
    }
  };

  // Find and navigate to the first stale upstream node
  const handleSyncAll = () => {
    if (!graph || staleCount === 0) return;
    
    const firstStaleEdge = graph.edges.find((e) => e.isStale);
    if (firstStaleEdge) {
      const upstreamNode = graph.nodes.find((n) => n.id === firstStaleEdge.from);
      if (upstreamNode) {
        toast.info(`Navigating to ${upstreamNode.name} to refresh data...`);
        handleNodeClick(upstreamNode);
        return;
      }
    }
    
    // Fallback: just refetch
    refetch();
    toast.success('Data lineage refreshed');
  };

  // Get upstream node for value comparison
  const getUpstreamValues = (node: LineageNode, edges: LineageEdge[]) => {
    if (!graph) return null;
    const staleIncoming = edges.filter((e) => e.to === node.id && e.isStale);
    if (staleIncoming.length === 0) return null;
    
    return staleIncoming.map((edge) => {
      const upstreamNode = graph.nodes.find((n) => n.id === edge.from);
      return upstreamNode ? { node: upstreamNode, edge } : null;
    }).filter(Boolean);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Loading data lineage...</p>
        </CardContent>
      </Card>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            No design data found. Complete calculations to see data flow.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CircleDot className="h-4 w-4" />
            Data Lineage
            <Badge variant="secondary" className="ml-2 text-xs">
              {graph.nodes.length} nodes
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {staleCount > 0 && (
              <>
                <Badge variant="outline" className="text-warning border-warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {staleCount} stale
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSyncAll}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-6 pb-4 min-w-max">
            <TooltipProvider>
              {Array.from(nodesByType.entries()).map(([type, nodes], typeIndex) => {
                const IconComponent = getNodeIcon(type);
                const colorClass = getNodeTypeColor(type);
                
                return (
                  <div key={type} className="flex items-center gap-4">
                    {/* Type column */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground text-center mb-2 flex items-center justify-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        {getNodeTypeLabel(type)}
                      </h4>
                      {nodes.map((node) => {
                        const incomingEdges = graph.edges.filter((e) => e.to === node.id);
                        const hasStaleIncoming = incomingEdges.some((e) => e.isStale);
                        const upstreamComparisons = getUpstreamValues(node, graph.edges);

                        return (
                          <Tooltip key={node.id}>
                            <TooltipTrigger asChild>
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => handleNodeClick(node)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNodeClick(node)}
                                className={cn(
                                  'p-2 rounded-lg border text-center cursor-pointer transition-all',
                                  'hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring',
                                  hasStaleIncoming
                                    ? 'animate-pulse border-warning bg-warning/10'
                                    : colorClass,
                                  compact ? 'min-w-[100px]' : 'min-w-[140px]'
                                )}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <IconComponent className="h-3 w-3 flex-shrink-0" />
                                  <p className="text-xs font-medium truncate">{node.name}</p>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                </div>
                                {!compact && node.values && (
                                  <div className="mt-1 text-[10px] text-muted-foreground">
                                    {Object.entries(node.values)
                                      .slice(0, 2)
                                      .map(([key, val]) => (
                                        <span key={key} className="block truncate">
                                          {formatValueKey(key)}: {typeof val === 'number' ? val.toFixed(1) : String(val)}
                                        </span>
                                      ))}
                                  </div>
                                )}
                                {hasStaleIncoming && (
                                  <div className="mt-1 flex items-center justify-center gap-1 text-warning">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="text-[10px]">Needs sync</span>
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">{node.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Updated: {format(new Date(node.updatedAt), 'MMM d, yyyy h:mm a')}
                                </p>
                                <p className="text-xs text-primary">Click to navigate to tool</p>
                                {node.values && (
                                  <div className="text-xs mt-1 pt-1 border-t">
                                    {Object.entries(node.values).map(([key, val]) => (
                                      <p key={key}>
                                        {formatValueKey(key)}: {typeof val === 'number' ? val.toFixed(2) : String(val)}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {hasStaleIncoming && upstreamComparisons && upstreamComparisons.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-warning/30">
                                    <p className="text-xs font-medium text-warning mb-1">Value Comparison:</p>
                                    {upstreamComparisons.map((comparison) => {
                                      if (!comparison) return null;
                                      const { node: upstreamNode } = comparison;
                                      return upstreamNode.values && (
                                        <div key={upstreamNode.id} className="text-xs space-y-0.5">
                                          <p className="text-muted-foreground">{upstreamNode.name}:</p>
                                          {Object.entries(upstreamNode.values).slice(0, 2).map(([key, val]) => (
                                            <p key={key} className="ml-2">
                                              {formatValueKey(key)}: {typeof val === 'number' ? val.toFixed(1) : String(val)}
                                              {node.values?.[key] !== undefined && (
                                                <span className="text-warning ml-1">
                                                  → {typeof node.values[key] === 'number' 
                                                    ? (node.values[key] as number).toFixed(1) 
                                                    : String(node.values[key])}
                                                </span>
                                              )}
                                            </p>
                                          ))}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {hasStaleIncoming && (
                                  <p className="text-xs text-warning mt-1">
                                    ⚠️ Upstream data has been updated. Click to refresh.
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>

                    {/* Arrow to next column */}
                    {typeIndex < nodesByType.size - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </TooltipProvider>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function formatValueKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
