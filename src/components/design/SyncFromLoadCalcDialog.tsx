import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useLoadCalculationsWithZones, LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import { cn } from '@/lib/utils';

export interface SyncSegment {
  id: string;
  name: string;
  zoneId: string | null;
  currentFlow: number; // CFM for duct, GPM for pipe
}

export interface SyncUpdate {
  segmentId: string;
  newFlow: number;
}

interface SyncFromLoadCalcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'duct' | 'pipe';
  segments: SyncSegment[];
  projectId?: string | null;
  onSync: (updates: SyncUpdate[]) => void;
  deltaT?: number; // Temperature difference for GPM calc (default 10°F)
}

interface ComparisonRow {
  segmentId: string;
  segmentName: string;
  zoneId: string;
  zoneName: string | null;
  floorName: string | null;
  buildingName: string | null;
  currentFlow: number;
  newFlow: number | null;
  difference: number | null;
  percentChange: number | null;
  loadCalcId: string | null;
  hasLoadCalc: boolean;
}

export function SyncFromLoadCalcDialog({
  open,
  onOpenChange,
  mode,
  segments,
  projectId,
  onSync,
  deltaT = 10,
}: SyncFromLoadCalcDialogProps) {
  const { data: loadCalculations, isLoading } = useLoadCalculationsWithZones(projectId || undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customDeltaT, setCustomDeltaT] = useState(deltaT);

  const flowUnit = mode === 'duct' ? 'CFM' : 'GPM';

  // Build comparison data
  const comparisonData = useMemo(() => {
    if (!loadCalculations) return [];

    const rows: ComparisonRow[] = [];

    for (const segment of segments) {
      if (!segment.zoneId) continue;

      // Find load calculation for this zone
      const loadCalc = loadCalculations.find(lc => lc.zone_id === segment.zoneId);

      let newFlow: number | null = null;
      if (loadCalc) {
        if (mode === 'duct') {
          // Direct CFM from load calculation
          newFlow = loadCalc.cfm_required;
        } else {
          // Calculate GPM from BTU/h: GPM = BTU/h / (500 × ΔT)
          if (loadCalc.cooling_load_btuh) {
            newFlow = loadCalc.cooling_load_btuh / (500 * customDeltaT);
          }
        }
      }

      const difference = newFlow !== null ? newFlow - segment.currentFlow : null;
      const percentChange = difference !== null && segment.currentFlow > 0
        ? (difference / segment.currentFlow) * 100
        : null;

      rows.push({
        segmentId: segment.id,
        segmentName: segment.name,
        zoneId: segment.zoneId,
        zoneName: loadCalc?.zone_name || null,
        floorName: loadCalc?.floor_name || null,
        buildingName: loadCalc?.building_name || null,
        currentFlow: segment.currentFlow,
        newFlow,
        difference,
        percentChange,
        loadCalcId: loadCalc?.id || null,
        hasLoadCalc: !!loadCalc,
      });
    }

    return rows;
  }, [segments, loadCalculations, mode, customDeltaT]);

  // Auto-select changed segments on first load
  useEffect(() => {
    if (comparisonData.length > 0 && selectedIds.size === 0) {
      const changedIds = comparisonData
        .filter(row => row.hasLoadCalc && row.difference !== null && Math.abs(row.difference) > 0.1)
        .map(row => row.segmentId);
      setSelectedIds(new Set(changedIds));
    }
  }, [comparisonData]);

  const handleToggle = (segmentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  };

  const handleSelectAllChanged = () => {
    const changedIds = comparisonData
      .filter(row => row.hasLoadCalc && row.difference !== null && Math.abs(row.difference) > 0.1)
      .map(row => row.segmentId);
    setSelectedIds(new Set(changedIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSync = () => {
    const updates: SyncUpdate[] = comparisonData
      .filter(row => selectedIds.has(row.segmentId) && row.newFlow !== null)
      .map(row => ({
        segmentId: row.segmentId,
        newFlow: row.newFlow!,
      }));

    onSync(updates);
    onOpenChange(false);
  };

  // Summary stats
  const summary = useMemo(() => {
    const selectedRows = comparisonData.filter(row => selectedIds.has(row.segmentId));
    const totalDelta = selectedRows.reduce((sum, row) => sum + (row.difference || 0), 0);
    return {
      selectedCount: selectedRows.length,
      totalDelta,
      hasChanges: selectedRows.some(row => row.difference !== null && Math.abs(row.difference) > 0.1),
    };
  }, [comparisonData, selectedIds]);

  const segmentsWithZones = segments.filter(s => s.zoneId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync {flowUnit} from Load Calculations
          </DialogTitle>
          <DialogDescription>
            Compare and update segment flow rates based on current load calculation data.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : segmentsWithZones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="font-medium text-muted-foreground">No segments linked to zones</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create segments from load calculations to enable syncing.
            </p>
          </div>
        ) : (
          <>
            {mode === 'pipe' && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm whitespace-nowrap">ΔT for GPM:</Label>
                <Input
                  type="number"
                  value={customDeltaT}
                  onChange={(e) => setCustomDeltaT(Number(e.target.value) || 10)}
                  className="w-20 h-8"
                  min={1}
                  max={50}
                />
                <span className="text-sm text-muted-foreground">°F</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (GPM = BTU/h ÷ 500 × ΔT)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {comparisonData.length} segments linked to load calculations
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAllChanged}>
                  Select Changed
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 max-h-[400px] border rounded-lg">
              <div className="divide-y">
                {comparisonData.map((row) => (
                  <div
                    key={row.segmentId}
                    className={cn(
                      'p-3 hover:bg-muted/50 transition-colors',
                      selectedIds.has(row.segmentId) && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={row.segmentId}
                        checked={selectedIds.has(row.segmentId)}
                        onCheckedChange={() => handleToggle(row.segmentId)}
                        disabled={!row.hasLoadCalc || row.newFlow === null}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{row.segmentName}</span>
                          {row.zoneName && (
                            <Badge variant="outline" className="text-xs">
                              {row.buildingName && `${row.buildingName} › `}
                              {row.floorName && `${row.floorName} › `}
                              {row.zoneName}
                            </Badge>
                          )}
                        </div>

                        {row.hasLoadCalc && row.newFlow !== null ? (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              Current: <span className="font-mono">{row.currentFlow.toFixed(0)}</span> {flowUnit}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">
                              New: <span className="font-mono">{row.newFlow.toFixed(0)}</span> {flowUnit}
                            </span>

                            {row.difference !== null && Math.abs(row.difference) > 0.1 ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'gap-1',
                                  row.difference > 0
                                    ? 'border-emerald-500/50 text-emerald-600 bg-emerald-50'
                                    : 'border-orange-500/50 text-orange-600 bg-orange-50'
                                )}
                              >
                                {row.difference > 0 ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )}
                                {row.difference > 0 ? '+' : ''}
                                {row.difference.toFixed(0)} ({row.percentChange?.toFixed(1)}%)
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Minus className="h-3 w-3" />
                                No change
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            No load calculation found for this zone
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {summary.selectedCount} segment{summary.selectedCount !== 1 ? 's' : ''} selected
                {summary.selectedCount > 0 && (
                  <span className="ml-2">
                    • Net change: <span className={cn('font-mono', summary.totalDelta > 0 ? 'text-emerald-600' : summary.totalDelta < 0 ? 'text-orange-600' : '')}>
                      {summary.totalDelta > 0 ? '+' : ''}{summary.totalDelta.toFixed(0)} {flowUnit}
                    </span>
                  </span>
                )}
              </span>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSync}
            disabled={summary.selectedCount === 0}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Sync {summary.selectedCount} Segment{summary.selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
