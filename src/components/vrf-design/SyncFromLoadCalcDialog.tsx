import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Equal, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { useLoadCalculationsWithZones, type LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import type { VRFIndoorUnit } from '@/hooks/useVRFSystems';

interface SyncFromLoadCalcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId: string;
  units: VRFIndoorUnit[];
  projectId?: string | null;
  onSync: (updates: { id: string; cooling_capacity_kw: number; heating_capacity_kw: number }[]) => void;
}

interface UnitComparison {
  unit: VRFIndoorUnit;
  loadCalc: LoadCalculationWithZone | null;
  currentCoolingKw: number;
  newCoolingKw: number;
  currentHeatingKw: number;
  newHeatingKw: number;
  coolingVariancePercent: number;
  heatingVariancePercent: number;
  hasChanges: boolean;
}

const calculateVariance = (current: number, updated: number): number => {
  if (current === 0) return updated > 0 ? 100 : 0;
  return ((updated - current) / current) * 100;
};

export function SyncFromLoadCalcDialog({
  open,
  onOpenChange,
  systemId,
  units,
  projectId,
  onSync,
}: SyncFromLoadCalcDialogProps) {
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  
  const { data: loadCalcs = [], isLoading } = useLoadCalculationsWithZones(projectId || undefined);
  
  // Build comparison data
  const comparisons = useMemo<UnitComparison[]>(() => {
    // Only include units that have a zone_id (linked to load calc)
    const linkedUnits = units.filter(u => u.zone_id);
    
    return linkedUnits.map(unit => {
      // Find matching load calculation by zone_id
      const loadCalc = loadCalcs.find(lc => lc.zone_id === unit.zone_id) || null;
      
      const currentCoolingKw = unit.cooling_capacity_kw;
      const currentHeatingKw = unit.heating_capacity_kw || currentCoolingKw * 1.1;
      
      // Calculate new values from load calc
      const newCoolingKw = loadCalc?.cooling_load_tons 
        ? loadCalc.cooling_load_tons * 3.517 
        : currentCoolingKw;
      const newHeatingKw = newCoolingKw * 1.1;
      
      const coolingVariancePercent = calculateVariance(currentCoolingKw, newCoolingKw);
      const heatingVariancePercent = calculateVariance(currentHeatingKw, newHeatingKw);
      
      // Consider "changed" if variance exceeds 1%
      const hasChanges = Math.abs(coolingVariancePercent) > 1 || Math.abs(heatingVariancePercent) > 1;
      
      return {
        unit,
        loadCalc,
        currentCoolingKw,
        newCoolingKw,
        currentHeatingKw,
        newHeatingKw,
        coolingVariancePercent,
        heatingVariancePercent,
        hasChanges,
      };
    });
  }, [units, loadCalcs]);
  
  const changedUnitsCount = comparisons.filter(c => c.hasChanges).length;
  
  // Auto-select changed units when dialog opens
  useEffect(() => {
    if (open && comparisons.length > 0) {
      const changedIds = new Set(
        comparisons.filter(c => c.hasChanges).map(c => c.unit.id)
      );
      setSelectedUnitIds(changedIds);
    }
  }, [open, comparisons]);
  
  const handleToggle = (unitId: string) => {
    setSelectedUnitIds(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };
  
  const handleSelectChanged = () => {
    const changedIds = new Set(
      comparisons.filter(c => c.hasChanges).map(c => c.unit.id)
    );
    setSelectedUnitIds(changedIds);
  };
  
  const handleDeselectAll = () => {
    setSelectedUnitIds(new Set());
  };
  
  const handleSync = () => {
    const updates = comparisons
      .filter(c => selectedUnitIds.has(c.unit.id))
      .map(c => ({
        id: c.unit.id,
        cooling_capacity_kw: c.newCoolingKw,
        heating_capacity_kw: c.newHeatingKw,
      }));
    
    onSync(updates);
    onOpenChange(false);
  };
  
  // Calculate summary
  const selectedComparisons = comparisons.filter(c => selectedUnitIds.has(c.unit.id));
  const totalCurrentCapacity = selectedComparisons.reduce((sum, c) => sum + c.currentCoolingKw, 0);
  const totalNewCapacity = selectedComparisons.reduce((sum, c) => sum + c.newCoolingKw, 0);
  const netChange = totalNewCapacity - totalCurrentCapacity;
  const netChangePercent = totalCurrentCapacity > 0 
    ? ((netChange / totalCurrentCapacity) * 100)
    : 0;
  
  const getVarianceIcon = (variance: number) => {
    if (Math.abs(variance) <= 1) {
      return <Equal className="h-4 w-4 text-muted-foreground" />;
    }
    if (variance > 0) {
      return <ArrowUp className="h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="h-4 w-4 text-destructive" />;
  };
  
  const getVarianceBadge = (variance: number) => {
    if (Math.abs(variance) <= 1) {
      return <Badge variant="secondary">±0%</Badge>;
    }
    if (variance > 0) {
      return <Badge variant="outline" className="border-primary text-primary">+{variance.toFixed(1)}%</Badge>;
    }
    return <Badge variant="destructive">{variance.toFixed(1)}%</Badge>;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Indoor Units from Load Calculations
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comparisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No indoor units are linked to load calculations.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Import units from load calculations first to enable syncing.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Banner */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {changedUnitsCount} of {comparisons.length} units have capacity changes
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectChanged}>
                  Select Changed
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
            
            {/* Comparison List */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 py-2">
                {comparisons.map((comparison) => (
                  <Card 
                    key={comparison.unit.id}
                    className={`transition-colors ${
                      selectedUnitIds.has(comparison.unit.id) 
                        ? 'border-primary/50 bg-primary/5' 
                        : ''
                    } ${!comparison.hasChanges ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedUnitIds.has(comparison.unit.id)}
                          onCheckedChange={() => handleToggle(comparison.unit.id)}
                          disabled={!comparison.hasChanges}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{comparison.unit.unit_tag}</span>
                              <span className="text-muted-foreground mx-2">•</span>
                              <span className="text-muted-foreground">{comparison.unit.zone_name || 'Unknown Zone'}</span>
                            </div>
                            {!comparison.hasChanges && (
                              <Badge variant="secondary">No changes</Badge>
                            )}
                          </div>
                          
                          {/* Comparison Table */}
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div className="text-muted-foreground">Parameter</div>
                            <div className="text-muted-foreground text-right">Current</div>
                            <div className="text-muted-foreground text-right">Updated</div>
                            <div className="text-muted-foreground text-right">Change</div>
                            
                            {/* Cooling Capacity Row */}
                            <div>Cooling Capacity</div>
                            <div className="text-right font-mono">
                              {comparison.currentCoolingKw.toFixed(1)} kW
                            </div>
                            <div className="text-right font-mono">
                              {comparison.newCoolingKw.toFixed(1)} kW
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              {getVarianceBadge(comparison.coolingVariancePercent)}
                              {getVarianceIcon(comparison.coolingVariancePercent)}
                            </div>
                            
                            {/* Heating Capacity Row */}
                            <div>Heating Capacity</div>
                            <div className="text-right font-mono">
                              {comparison.currentHeatingKw.toFixed(1)} kW
                            </div>
                            <div className="text-right font-mono">
                              {comparison.newHeatingKw.toFixed(1)} kW
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              {getVarianceBadge(comparison.heatingVariancePercent)}
                              {getVarianceIcon(comparison.heatingVariancePercent)}
                            </div>
                            
                            {/* Zone Info */}
                            {comparison.loadCalc && (
                              <>
                                <div>Zone Area</div>
                                <div className="text-right font-mono col-span-3 text-muted-foreground">
                                  {comparison.loadCalc.area_sqft.toLocaleString()} sqft
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            
            {/* Summary Footer */}
            {selectedUnitIds.size > 0 && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <span className="font-medium">Summary: </span>
                Update {selectedUnitIds.size} unit{selectedUnitIds.size !== 1 ? 's' : ''}
                <span className="mx-2">•</span>
                Net change: {netChange >= 0 ? '+' : ''}{netChange.toFixed(1)} kW 
                ({netChangePercent >= 0 ? '+' : ''}{netChangePercent.toFixed(1)}%)
              </div>
            )}
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={selectedUnitIds.size === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Update {selectedUnitIds.size} Unit{selectedUnitIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
