import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Box, Snowflake } from 'lucide-react';
import { getPipeSizeName } from '@/lib/vrf-refrigerant-calculations';
import type { VRFIndoorUnit, VRFBranchSelector, VRFSystem } from '@/hooks/useVRFSystems';

interface VRFPipingTreeViewProps {
  system: VRFSystem | null;
  units: VRFIndoorUnit[];
  branchSelectors: VRFBranchSelector[];
  selectedUnitId?: string | null;
  onSelectUnit?: (id: string) => void;
}

interface TreeNode {
  id: string;
  type: 'outdoor' | 'branch-selector' | 'indoor';
  label: string;
  capacity?: number;
  liquidSize?: number;
  suctionSize?: number;
  pipingLength?: number;
  elevation?: number;
  oilReturnOk?: boolean | null;
  children: TreeNode[];
}

export function VRFPipingTreeView({
  system,
  units,
  branchSelectors,
  selectedUnitId,
  onSelectUnit,
}: VRFPipingTreeViewProps) {
  
  const treeData = useMemo((): TreeNode | null => {
    if (!system) return null;
    
    // Build tree structure
    const outdoorNode: TreeNode = {
      id: 'outdoor',
      type: 'outdoor',
      label: system.system_tag || system.system_name,
      capacity: system.outdoor_unit_capacity_kw || undefined,
      children: [],
    };
    
    // Group units by branch selector
    const directUnits = units.filter(u => !u.branch_selector_id);
    const unitsByBranch = new Map<string, VRFIndoorUnit[]>();
    
    units.forEach(unit => {
      if (unit.branch_selector_id) {
        const existing = unitsByBranch.get(unit.branch_selector_id) || [];
        unitsByBranch.set(unit.branch_selector_id, [...existing, unit]);
      }
    });
    
    // Add branch selectors with their units
    branchSelectors.forEach(bs => {
      const branchUnits = unitsByBranch.get(bs.id) || [];
      const branchNode: TreeNode = {
        id: bs.id,
        type: 'branch-selector',
        label: bs.selector_tag,
        capacity: bs.total_connected_capacity_kw || undefined,
        liquidSize: bs.liquid_line_size_in || undefined,
        suctionSize: bs.suction_line_size_in || undefined,
        pipingLength: bs.distance_from_outdoor_ft || undefined,
        elevation: bs.elevation_from_outdoor_ft,
        children: branchUnits.map(unit => ({
          id: unit.id,
          type: 'indoor' as const,
          label: unit.unit_tag,
          capacity: unit.cooling_capacity_kw,
          liquidSize: unit.liquid_line_size_in || undefined,
          suctionSize: unit.suction_line_size_in || undefined,
          pipingLength: unit.liquid_line_length_ft,
          elevation: unit.elevation_from_outdoor_ft,
          oilReturnOk: unit.oil_return_ok,
          children: [],
        })),
      };
      outdoorNode.children.push(branchNode);
    });
    
    // Add direct units
    directUnits.forEach(unit => {
      outdoorNode.children.push({
        id: unit.id,
        type: 'indoor',
        label: unit.unit_tag,
        capacity: unit.cooling_capacity_kw,
        liquidSize: unit.liquid_line_size_in || undefined,
        suctionSize: unit.suction_line_size_in || undefined,
        pipingLength: unit.liquid_line_length_ft,
        elevation: unit.elevation_from_outdoor_ft,
        oilReturnOk: unit.oil_return_ok,
        children: [],
      });
    });
    
    return outdoorNode;
  }, [system, units, branchSelectors]);
  
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isSelected = node.id === selectedUnitId;
    
    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer transition-colors',
            isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
            depth > 0 && 'ml-6'
          )}
          style={{ paddingLeft: `${depth * 24 + 8}px` }}
          onClick={() => node.type === 'indoor' && onSelectUnit?.(node.id)}
        >
          {/* Expand/Collapse or connector */}
          {hasChildren ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : depth > 0 ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          ) : null}
          
          {/* Icon */}
          {node.type === 'outdoor' ? (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10">
              <Snowflake className="h-5 w-5 text-blue-500" />
            </div>
          ) : node.type === 'branch-selector' ? (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-500/10">
              <Box className="h-5 w-5 text-purple-500" />
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10">
              <div className="h-3 w-3 rounded-sm bg-green-500" />
            </div>
          )}
          
          {/* Label and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{node.label}</span>
              {node.capacity && (
                <Badge variant="outline" className="text-xs">
                  {node.capacity.toFixed(1)} kW
                </Badge>
              )}
            </div>
            
            {(node.liquidSize || node.suctionSize || node.pipingLength !== undefined) && (
              <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                {node.pipingLength !== undefined && (
                  <span>{node.pipingLength.toFixed(0)} ft</span>
                )}
                {node.liquidSize && (
                  <span className="text-blue-500">L: {getPipeSizeName(node.liquidSize)}</span>
                )}
                {node.suctionSize && (
                  <span className="text-green-500">S: {getPipeSizeName(node.suctionSize)}</span>
                )}
                {node.elevation !== undefined && node.elevation !== 0 && (
                  <span>
                    {node.elevation > 0 ? '↑' : '↓'}{Math.abs(node.elevation).toFixed(0)} ft
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Oil return status */}
          {node.oilReturnOk !== undefined && node.oilReturnOk !== null && (
            node.oilReturnOk ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )
          )}
        </div>
        
        {/* Children */}
        {hasChildren && (
          <div className="border-l border-dashed border-muted-foreground/20 ml-4">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  if (!treeData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Configure system to view piping tree
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Piping Network</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {renderNode(treeData)}
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-blue-500 font-medium">L:</span> Liquid Line
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-500 font-medium">S:</span> Suction Line
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" /> Oil Return OK
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" /> Oil Return Warning
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
