import React from 'react';
import { Droplets, Ruler, Gauge, Thermometer, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PIPE_DATA, PipeMaterial, formatNominalSize, getVelocityStatus } from '@/lib/pipe-calculations';
import { COMMON_PIPE_FITTINGS } from '@/hooks/usePipeFittingsLibrary';
import { PipeNodeType, PIPE_NODE_TYPE_LABELS, PIPE_NODE_CATEGORIES, getPipeNodeIcon } from './PipeEquipmentIcons';

export interface SegmentFitting {
  id: string;
  fittingCode: string;
  fittingName: string;
  kFactor: number;
  quantity: number;
}

export interface PipeSegmentData {
  id: string;
  name: string;
  flowGPM: number;
  lengthFt: number;
  nominalSize: number | null;
  material: PipeMaterial;
  scheduleClass: string;
  fluidType: string;
  fluidTempF: number;
  elevationChangeFt: number;
  fromNode: string;
  toNode: string;
  fittings: SegmentFitting[];
  parentId: string | null;
  nodeType: PipeNodeType;
  zoneId?: string | null;
  // Calculated values
  velocity: number | null;
  frictionPer100ft: number | null;
  totalHeadLoss: number | null;
  reynoldsNumber: number | null;
  isCriticalPath: boolean;
}

interface PipeSegmentPropertiesPanelProps {
  segment: PipeSegmentData | null;
  allSegments: PipeSegmentData[];
  onUpdate: (updates: Partial<PipeSegmentData>) => void;
  onAddFitting: () => void;
  onRemoveFitting: (fittingId: string) => void;
  onRecalculate: () => void;
}

export function PipeSegmentPropertiesPanel({
  segment,
  allSegments,
  onUpdate,
  onAddFitting,
  onRemoveFitting,
  onRecalculate,
}: PipeSegmentPropertiesPanelProps) {
  // Early return if no segment selected
  if (!segment) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a segment</p>
          <p className="text-xs">to view properties</p>
        </div>
      </div>
    );
  }

  // Get available parent segments (exclude self and descendants)
  const getAvailableParents = () => {
    // Get all descendants of current segment
    const getDescendantIds = (segId: string): Set<string> => {
      const ids = new Set<string>();
      const children = allSegments.filter(s => s.parentId === segId);
      children.forEach(child => {
        ids.add(child.id);
        getDescendantIds(child.id).forEach(id => ids.add(id));
      });
      return ids;
    };
    
    const descendantIds = getDescendantIds(segment.id);
    
    return allSegments.filter(s => 
      s.id !== segment.id && !descendantIds.has(s.id)
    );
  };

  const availableParents = getAvailableParents();

  const velocityStatus = segment.velocity ? getVelocityStatus(segment.velocity) : null;
  const availableSizes = PIPE_DATA[segment.material]?.sizes.map(s => s.nominal) || [];
  const totalKFactor = segment.fittings.reduce((sum, f) => sum + f.kFactor * f.quantity, 0);

  return (
    <div className="space-y-4 p-4 overflow-y-auto max-h-full">
      {/* Segment Name */}
      <div className="space-y-2">
        <Label>Segment Name</Label>
        <Input
          value={segment.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>

      {/* Parent Segment */}
      <div className="space-y-2">
        <Label>Parent Segment</Label>
        <Select
          value={segment.parentId || 'none'}
          onValueChange={(value) => onUpdate({ parentId: value === 'none' ? null : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="None (Root)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Root)</SelectItem>
            {availableParents.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select parent to create branching hierarchy
        </p>
      </div>

      {/* Node Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Node Type
          {(() => {
            const IconComponent = getPipeNodeIcon(segment.nodeType);
            return <IconComponent size={16} className="text-primary" />;
          })()}
        </Label>
        <Select
          value={segment.nodeType}
          onValueChange={(value) => onUpdate({ nodeType: value as PipeNodeType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pipe">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getPipeNodeIcon('pipe');
                  return <Icon size={14} />;
                })()}
                <span>Pipe</span>
              </div>
            </SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Equipment</div>
            {PIPE_NODE_CATEGORIES.equipment.map((type) => {
              const Icon = getPipeNodeIcon(type);
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{PIPE_NODE_TYPE_LABELS[type]}</span>
                  </div>
                </SelectItem>
              );
            })}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Valves</div>
            {PIPE_NODE_CATEGORIES.valves.map((type) => {
              const Icon = getPipeNodeIcon(type);
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{PIPE_NODE_TYPE_LABELS[type]}</span>
                  </div>
                </SelectItem>
              );
            })}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Accessories</div>
            {PIPE_NODE_CATEGORIES.accessories.map((type) => {
              const Icon = getPipeNodeIcon(type);
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{PIPE_NODE_TYPE_LABELS[type]}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Connection Nodes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">From Node</Label>
          <Input
            value={segment.fromNode}
            onChange={(e) => onUpdate({ fromNode: e.target.value })}
            placeholder="e.g., Pump-1"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To Node</Label>
          <Input
            value={segment.toNode}
            onChange={(e) => onUpdate({ toNode: e.target.value })}
            placeholder="e.g., AHU-1"
          />
        </div>
      </div>

      <Separator />

      {/* Flow & Length */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            Flow (GPM)
          </Label>
          <Input
            type="number"
            value={segment.flowGPM}
            onChange={(e) => onUpdate({ flowGPM: parseFloat(e.target.value) || 0 })}
            onBlur={onRecalculate}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            Length (ft)
          </Label>
          <Input
            type="number"
            value={segment.lengthFt}
            onChange={(e) => onUpdate({ lengthFt: parseFloat(e.target.value) || 0 })}
            onBlur={onRecalculate}
          />
        </div>
      </div>

      {/* Material & Size */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Material</Label>
          <Select
            value={segment.material}
            onValueChange={(value) => {
              onUpdate({ material: value as PipeMaterial, nominalSize: null });
              onRecalculate();
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PIPE_DATA).map(([key, data]) => (
                <SelectItem key={key} value={key}>
                  {data.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nominal Size</Label>
          <Select
            value={segment.nominalSize?.toString() || ''}
            onValueChange={(value) => {
              onUpdate({ nominalSize: parseFloat(value) });
              onRecalculate();
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              {availableSizes.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {formatNominalSize(size)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fluid Properties */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Fluid Type</Label>
          <Select
            value={segment.fluidType}
            onValueChange={(value) => {
              onUpdate({ fluidType: value });
              onRecalculate();
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chilled_water">Chilled Water</SelectItem>
              <SelectItem value="hot_water">Hot Water</SelectItem>
              <SelectItem value="condenser_water">Condenser Water</SelectItem>
              <SelectItem value="glycol_mix">Glycol Mixture</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            Temp (°F)
          </Label>
          <Input
            type="number"
            value={segment.fluidTempF}
            onChange={(e) => onUpdate({ fluidTempF: parseFloat(e.target.value) || 45 })}
            onBlur={onRecalculate}
          />
        </div>
      </div>

      {/* Elevation */}
      <div className="space-y-1">
        <Label className="text-xs">Elevation Change (ft)</Label>
        <Input
          type="number"
          value={segment.elevationChangeFt}
          onChange={(e) => onUpdate({ elevationChangeFt: parseFloat(e.target.value) || 0 })}
          onBlur={onRecalculate}
        />
      </div>

      <Separator />

      {/* Calculated Results */}
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Calculated Results
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Velocity:</span>
              <span className={velocityStatus?.color}>
                {segment.velocity?.toFixed(2) ?? '-'} fps
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Friction:</span>
              <span>{segment.frictionPer100ft?.toFixed(3) ?? '-'} ft/100ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Head Loss:</span>
              <span>{segment.totalHeadLoss?.toFixed(2) ?? '-'} ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reynolds:</span>
              <span>{segment.reynoldsNumber?.toFixed(0) ?? '-'}</span>
            </div>
          </div>
          {segment.isCriticalPath && (
            <Badge variant="outline" className="mt-2">
              Critical Path
            </Badge>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Fittings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Fittings</Label>
          <Button variant="outline" size="sm" onClick={onAddFitting}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        {segment.fittings.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No fittings added. Click "Add" to include elbows, valves, etc.
          </p>
        ) : (
          <div className="space-y-1">
            {segment.fittings.map((fitting) => (
              <div
                key={fitting.id}
                className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded text-sm"
              >
                <div>
                  <span>{fitting.fittingName}</span>
                  <span className="text-muted-foreground ml-2">
                    K={fitting.kFactor} × {fitting.quantity}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemoveFitting(fitting.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="text-xs text-muted-foreground pt-1">
              Total K-factor: {totalKFactor.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
