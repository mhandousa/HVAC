import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, Circle } from 'lucide-react';
import type { CrossToolDependency } from '@/hooks/useCrossToolValidation';
import type { ToolDataStatus } from '@/hooks/useProjectCrossToolAudit';
import { useNavigate } from 'react-router-dom';

interface DesignAuditDependencyFlowProps {
  dependencies: CrossToolDependency[];
  toolsWithData: ToolDataStatus[];
}

interface FlowNode {
  id: string;
  name: string;
  shortName: string;
  hasData: boolean;
  path: string;
}

interface FlowEdge {
  from: string;
  to: string;
  status: 'synced' | 'stale' | 'warning' | 'critical' | 'none';
  dependency?: CrossToolDependency;
}

export function DesignAuditDependencyFlow({ dependencies, toolsWithData }: DesignAuditDependencyFlowProps) {
  const navigate = useNavigate();

  // Define the flow layout - expanded to include 5 new tools
  const nodes: FlowNode[] = [
    { id: 'load-calculation', name: 'Load Calculations', shortName: 'Load', hasData: false, path: '' },
    { id: 'ventilation', name: 'Ventilation', shortName: 'Vent', hasData: false, path: '' },
    { id: 'equipment-selection', name: 'Equipment Selection', shortName: 'Equip', hasData: false, path: '' },
    { id: 'ahu-configuration', name: 'AHU Configuration', shortName: 'AHU', hasData: false, path: '' },
    { id: 'terminal-unit', name: 'Terminal Units', shortName: 'Terminal', hasData: false, path: '' },
    { id: 'duct-system', name: 'Duct Designer', shortName: 'Duct', hasData: false, path: '' },
    { id: 'diffuser', name: 'Diffusers', shortName: 'Diffuser', hasData: false, path: '' },
    { id: 'pipe-system', name: 'Pipe Designer', shortName: 'Pipe', hasData: false, path: '' },
    // New nodes for 5 additional design tools
    { id: 'coil-selection', name: 'Coil Selection', shortName: 'Coil', hasData: false, path: '' },
    { id: 'filter-selection', name: 'Filter Selection', shortName: 'Filter', hasData: false, path: '' },
    { id: 'cooling-tower', name: 'Cooling Tower', shortName: 'Tower', hasData: false, path: '' },
  ];

  // Populate hasData from toolsWithData
  nodes.forEach(node => {
    const tool = toolsWithData.find(t => t.toolType === node.id);
    if (tool) {
      node.hasData = tool.hasData;
      node.path = tool.path;
    }
  });

  // Define edges based on dependencies - expanded with new tool relationships
  const edges: FlowEdge[] = [
    { from: 'load-calculation', to: 'ventilation', status: 'none' },
    { from: 'load-calculation', to: 'equipment-selection', status: 'none' },
    { from: 'load-calculation', to: 'ahu-configuration', status: 'none' },
    { from: 'load-calculation', to: 'terminal-unit', status: 'none' }, // Load → VAV/FCU
    { from: 'equipment-selection', to: 'terminal-unit', status: 'none' },
    { from: 'equipment-selection', to: 'cooling-tower', status: 'none' }, // Equipment → Cooling Tower
    { from: 'terminal-unit', to: 'diffuser', status: 'none' },
    { from: 'ahu-configuration', to: 'duct-system', status: 'none' },
    { from: 'ahu-configuration', to: 'coil-selection', status: 'none' }, // AHU → Coil
    { from: 'ventilation', to: 'filter-selection', status: 'none' }, // Ventilation → Filter
    { from: 'duct-system', to: 'pipe-system', status: 'none' },
  ];

  // Update edge statuses based on dependencies
  dependencies.forEach(dep => {
    const edge = edges.find(e => 
      e.from === dep.upstream.toolType && 
      (e.to === dep.downstream.toolType || dep.downstream.toolType.includes(e.to))
    );
    if (edge) {
      edge.dependency = dep;
      if (dep.status === 'synced') {
        edge.status = 'synced';
      } else if (dep.severity === 'critical') {
        edge.status = 'critical';
      } else if (dep.severity === 'warning') {
        edge.status = 'warning';
      } else {
        edge.status = 'stale';
      }
    }
  });

  const getEdgeColor = (status: FlowEdge['status']) => {
    switch (status) {
      case 'synced': return 'text-success';
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-warning';
      case 'stale': return 'text-warning';
      default: return 'text-muted-foreground/30';
    }
  };

  const getNodeBorder = (hasData: boolean) => {
    return hasData ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30';
  };

  const renderEdgeIcon = (edge: FlowEdge) => {
    switch (edge.status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'stale':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Circle className="w-3 h-3 text-muted-foreground/30" />;
    }
  };

  // Render rows of the flow - reorganized for 5 additional tools
  const Row1 = ['load-calculation'];
  const Row2 = ['ventilation', 'equipment-selection', 'ahu-configuration'];
  const Row3 = ['filter-selection', 'terminal-unit', 'coil-selection', 'duct-system'];
  const Row4 = ['diffuser', 'cooling-tower', 'pipe-system'];

  const renderNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    return (
      <TooltipProvider key={node.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => node.path && navigate(node.path)}
              className={cn(
                'px-4 py-2 rounded-lg border-2 transition-all hover:shadow-md min-w-[100px]',
                getNodeBorder(node.hasData),
                node.hasData && 'cursor-pointer hover:border-primary'
              )}
            >
              <p className="text-sm font-medium">{node.shortName}</p>
              {node.hasData && (
                <CheckCircle2 className="w-3 h-3 text-success mx-auto mt-1" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{node.name}</p>
            <p className="text-xs text-muted-foreground">
              {node.hasData ? 'Has data - Click to open' : 'No data yet'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderEdge = (fromId: string, toId: string) => {
    const edge = edges.find(e => e.from === fromId && e.to === toId);
    if (!edge) return <ArrowRight className="w-4 h-4 text-muted-foreground/30" />;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <ArrowRight className={cn('w-4 h-4', getEdgeColor(edge.status))} />
              {renderEdgeIcon(edge)}
            </div>
          </TooltipTrigger>
          {edge.dependency && (
            <TooltipContent className="max-w-xs">
              <p className="font-medium">{edge.dependency.upstream.toolName} → {edge.dependency.downstream.toolName}</p>
              <p className="text-xs">{edge.dependency.description}</p>
              {edge.dependency.status === 'stale' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Stale since: {edge.dependency.staleDurationText}
                </p>
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Data Flow Dependencies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Row 1: Load Calculation */}
          <div className="flex justify-center">
            {renderNode('load-calculation')}
          </div>

          {/* Arrows from Load to Row 2 */}
          <div className="flex items-center gap-8">
            {renderEdge('load-calculation', 'ventilation')}
            {renderEdge('load-calculation', 'equipment-selection')}
            {renderEdge('load-calculation', 'ahu-configuration')}
          </div>

          {/* Row 2 */}
          <div className="flex justify-center gap-6">
            {Row2.map(id => renderNode(id))}
          </div>

          {/* Arrows from Row 2 to Row 3 */}
          <div className="flex items-center gap-8">
            {renderEdge('ventilation', 'filter-selection')}
            {renderEdge('equipment-selection', 'terminal-unit')}
            {renderEdge('ahu-configuration', 'coil-selection')}
            {renderEdge('ahu-configuration', 'duct-system')}
          </div>

          {/* Row 3 */}
          <div className="flex justify-center gap-6">
            {Row3.map(id => renderNode(id))}
          </div>

          {/* Arrows from Row 3 to Row 4 */}
          <div className="flex items-center gap-12">
            {renderEdge('terminal-unit', 'diffuser')}
            {renderEdge('equipment-selection', 'cooling-tower')}
            {renderEdge('duct-system', 'pipe-system')}
          </div>

          {/* Row 4 */}
          <div className="flex justify-center gap-8">
            {Row4.map(id => renderNode(id))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span>Synced</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-destructive" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="w-3 h-3 text-muted-foreground/30" />
            <span>No Data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
