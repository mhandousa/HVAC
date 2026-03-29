import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wind, Gauge, Ruler, AlertTriangle, CheckCircle2, Wrench, Plus, Trash2 } from 'lucide-react';
import { DUCT_MATERIALS } from '@/lib/duct-calculations';
import { DuctFitting, FITTING_CATEGORY_LABELS } from '@/hooks/useFittingsLibrary';
import { DuctNodeType, DUCT_NODE_TYPE_LABELS, DUCT_NODE_CATEGORIES, getDuctNodeIcon } from './DuctEquipmentIcons';

export interface SegmentData {
  id: string;
  name: string;
  cfm: number;
  lengthFt: number;
  shape: 'round' | 'rectangular';
  diameterIn?: number;
  widthIn?: number;
  heightIn?: number;
  material: string;
  gaugeThickness?: number;
  hasDamper: boolean;
  fromNode?: string;
  toNode?: string;
  fittings: SegmentFitting[];
  // Hierarchy
  parentId?: string | null;
  nodeType?: DuctNodeType;
  // Zone tracking
  zoneId?: string;
  // Calculated values
  velocityFpm?: number;
  frictionLossPer100ft?: number;
  totalPressureDropPa?: number;
  isCriticalPath?: boolean;
}

export interface SegmentFitting {
  id: string;
  fittingCode: string;
  fittingName: string;
  lossCoefficient: number;
  quantity: number;
  pressureLossPa?: number;
}

// Support both old props (segment + onUpdate) and new props (segment + onUpdate as partial)
interface SegmentPropertiesPanelProps {
  segment: SegmentData | null;
  onUpdate: ((segment: SegmentData) => void) | ((updates: Partial<SegmentData>) => void);
  onAddFitting?: () => void;
  onRemoveFitting?: (fittingId: string) => void;
  onDelete?: () => void;
  availableFittings?: DuctFitting[];
}

export function SegmentPropertiesPanel({
  segment,
  onUpdate,
  onAddFitting,
  onRemoveFitting,
  onDelete,
}: SegmentPropertiesPanelProps) {
  const [localSegment, setLocalSegment] = useState<SegmentData | null>(segment);

  useEffect(() => {
    setLocalSegment(segment);
  }, [segment]);

  if (!localSegment) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
        <Wind className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No segment selected</p>
        <p className="text-xs">Select a segment from the tree to edit</p>
      </div>
    );
  }

  const handleChange = <K extends keyof SegmentData>(key: K, value: SegmentData[K]) => {
    const updated = { ...localSegment, [key]: value };
    setLocalSegment(updated);
    // Support both old interface (full segment) and new interface (partial updates)
    (onUpdate as (segment: SegmentData) => void)(updated);
  };

  const handleRemoveFitting = (fittingId: string) => {
    if (onRemoveFitting) {
      onRemoveFitting(fittingId);
    } else {
      // Handle internally if no handler provided
      const updated = {
        ...localSegment,
        fittings: localSegment.fittings.filter((f) => f.id !== fittingId),
      };
      setLocalSegment(updated);
      (onUpdate as (segment: SegmentData) => void)(updated);
    }
  };

  const velocityStatus = localSegment.velocityFpm
    ? localSegment.velocityFpm > 2000
      ? 'warning'
      : localSegment.velocityFpm > 1500
      ? 'caution'
      : 'good'
    : null;

  return (
    <div className="space-y-4 p-4">
      {/* Segment Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Input
            value={localSegment.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="font-semibold text-foreground border-none bg-transparent px-0 focus-visible:ring-1"
          />
          <p className="text-xs text-muted-foreground">
            {localSegment.fromNode ? `${localSegment.fromNode} → ` : ''}
            {localSegment.toNode || 'Terminal'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {localSegment.isCriticalPath && (
            <Badge variant="outline" className="border-warning text-warning">
              Critical Path
            </Badge>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Node Type Selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Node Type
          {localSegment.nodeType && (() => {
            const IconComponent = getDuctNodeIcon(localSegment.nodeType);
            return <IconComponent size={16} className="text-primary" />;
          })()}
        </Label>
        <Select
          value={localSegment.nodeType || 'duct'}
          onValueChange={(v) => handleChange('nodeType', v as DuctNodeType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="duct">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getDuctNodeIcon('duct');
                  return <Icon size={14} />;
                })()}
                <span>Duct Segment</span>
              </div>
            </SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Equipment</div>
            {DUCT_NODE_CATEGORIES.equipment.map((type) => {
              const Icon = getDuctNodeIcon(type);
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{DUCT_NODE_TYPE_LABELS[type]}</span>
                  </div>
                </SelectItem>
              );
            })}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Terminals</div>
            {DUCT_NODE_CATEGORIES.terminals.map((type) => {
              const Icon = getDuctNodeIcon(type);
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{DUCT_NODE_TYPE_LABELS[type]}</span>
                  </div>
                </SelectItem>
              );
            })}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Dampers</div>
            {DUCT_NODE_CATEGORIES.dampers.map((type) => {
              const Icon = getDuctNodeIcon(type);
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span>{DUCT_NODE_TYPE_LABELS[type]}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Separator />
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Wind className="w-4 h-4" />
          Airflow (CFM)
        </Label>
        <Input
          type="number"
          value={localSegment.cfm}
          onChange={(e) => handleChange('cfm', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Length */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          Length (ft)
        </Label>
        <Input
          type="number"
          value={localSegment.lengthFt}
          onChange={(e) => handleChange('lengthFt', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Shape & Size */}
      <div className="space-y-2">
        <Label>Duct Shape</Label>
        <Select
          value={localSegment.shape}
          onValueChange={(v) => handleChange('shape', v as 'round' | 'rectangular')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="round">Round</SelectItem>
            <SelectItem value="rectangular">Rectangular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {localSegment.shape === 'round' ? (
        <div className="space-y-2">
          <Label>Diameter (in)</Label>
          <Input
            type="number"
            value={localSegment.diameterIn || ''}
            onChange={(e) => handleChange('diameterIn', parseFloat(e.target.value) || undefined)}
            placeholder="Auto-calculated"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Width (in)</Label>
            <Input
              type="number"
              value={localSegment.widthIn || ''}
              onChange={(e) => handleChange('widthIn', parseFloat(e.target.value) || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Height (in)</Label>
            <Input
              type="number"
              value={localSegment.heightIn || ''}
              onChange={(e) => handleChange('heightIn', parseFloat(e.target.value) || undefined)}
            />
          </div>
        </div>
      )}

      {/* Material */}
      <div className="space-y-2">
        <Label>Material</Label>
        <Select value={localSegment.material} onValueChange={(v) => handleChange('material', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DUCT_MATERIALS).map(([key, mat]) => (
              <SelectItem key={key} value={key}>
                {mat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Damper */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Has Volume Damper
        </Label>
        <Switch
          checked={localSegment.hasDamper}
          onCheckedChange={(v) => handleChange('hasDamper', v)}
        />
      </div>

      <Separator />

      {/* Performance Metrics */}
      <Card className="bg-muted/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Velocity</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-mono">
                {localSegment.velocityFpm?.toLocaleString() || '—'} fpm
              </span>
              {velocityStatus === 'warning' && (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              )}
              {velocityStatus === 'caution' && (
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              )}
              {velocityStatus === 'good' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Friction Loss</span>
            <span className="text-sm font-mono">
              {localSegment.frictionLossPer100ft?.toFixed(3) || '—'} in.wg/100ft
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Total Δp</span>
            <span className="text-sm font-mono font-semibold">
              {localSegment.totalPressureDropPa?.toFixed(1) || '—'} Pa
            </span>
          </div>
          {localSegment.gaugeThickness && (
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Gauge</span>
              <span className="text-sm font-mono">{localSegment.gaugeThickness} ga</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Fittings List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Fittings</Label>
          {onAddFitting && (
            <Button variant="outline" size="sm" className="h-7 gap-1" onClick={onAddFitting}>
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          )}
        </div>

        {localSegment.fittings.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No fittings added</p>
        ) : (
          <div className="space-y-1">
            {localSegment.fittings.map((fitting) => (
              <div
                key={fitting.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{fitting.fittingName}</span>
                  <Badge variant="outline" className="text-xs">
                    ×{fitting.quantity}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    K={fitting.lossCoefficient}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveFitting(fitting.id)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SegmentPropertiesPanel;
