import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Volume2, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useCommissioningChecklists } from '@/hooks/useCommissioning';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateAcousticChecklistDialogProps {
  commissioningProjectId: string;
  zones: ZoneAcousticData[];
  floorName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAcousticChecklistDialog({
  commissioningProjectId,
  zones,
  floorName,
  open,
  onOpenChange,
  onSuccess,
}: CreateAcousticChecklistDialogProps) {
  const { createChecklist } = useCommissioningChecklists(commissioningProjectId);

  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  // Sort zones - exceeding first, then marginal, then acceptable
  const sortedZones = useMemo(() => {
    const statusOrder = { 'exceeds': 0, 'marginal': 1, 'acceptable': 2, 'no-data': 3 };
    return [...zones].sort((a, b) => {
      const aOrder = statusOrder[a.status] ?? 3;
      const bOrder = statusOrder[b.status] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.ncDelta - a.ncDelta;
    });
  }, [zones]);

  const exceedingZones = zones.filter(z => z.status === 'exceeds' || z.status === 'marginal');

  const toggleZone = (zoneId: string) => {
    const newSet = new Set(selectedZoneIds);
    if (newSet.has(zoneId)) {
      newSet.delete(zoneId);
    } else {
      newSet.add(zoneId);
    }
    setSelectedZoneIds(newSet);
  };

  const selectAllExceeding = () => {
    const newSet = new Set(exceedingZones.map(z => z.zoneId));
    setSelectedZoneIds(newSet);
  };

  const selectAll = () => {
    const newSet = new Set(zones.map(z => z.zoneId));
    setSelectedZoneIds(newSet);
  };

  const clearSelection = () => {
    setSelectedZoneIds(new Set());
  };

  const getStatusIcon = (status: ZoneAcousticData['status']) => {
    switch (status) {
      case 'exceeds':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'marginal':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'acceptable':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Volume2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ZoneAcousticData['status']) => {
    switch (status) {
      case 'exceeds':
        return <Badge variant="destructive" className="text-xs">Exceeds NC</Badge>;
      case 'marginal':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Marginal</Badge>;
      case 'acceptable':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Acceptable</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">No Data</Badge>;
    }
  };

  const handleCreate = async () => {
    if (selectedZoneIds.size === 0) {
      toast.error('Please select at least one zone');
      return;
    }

    try {
      setIsCreating(true);

      const selectedZones = zones.filter(z => selectedZoneIds.has(z.zoneId));

      // Create a checklist for each selected zone
      for (const zone of selectedZones) {
        const designData = {
          zone_id: zone.zoneId,
          zone_name: zone.zoneName,
          floor_name: floorName,
          space_type: zone.spaceType,
          target_nc: zone.targetNC,
          estimated_nc: zone.estimatedNC,
          terminal_units: zone.terminalUnits.map(tu => ({
            unit_tag: tu.unitTag,
            unit_type: tu.unitType,
            design_nc: tu.noiseNC,
          })),
          recommendations: zone.recommendations,
        };

        await createChecklist.mutateAsync({
          commissioning_project_id: commissioningProjectId,
          equipment_tag: zone.zoneName,
          checklist_type: 'ahu' as const, // Use 'ahu' as closest match since 'acoustic' isn't in DB enum
          design_data: designData as any,
          overall_status: 'pending',
          notes: `Acoustic verification for ${zone.spaceType} - Target NC-${zone.targetNC}`,
        });
      }

      toast.success(`Created ${selectedZones.length} acoustic verification checklist${selectedZones.length > 1 ? 's' : ''}`);
      
      setSelectedZoneIds(new Set());
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create checklists:', error);
      toast.error('Failed to create acoustic checklists');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Create Acoustic Commissioning Checklists
          </DialogTitle>
          <DialogDescription>
            Select zones to create pre-occupancy noise verification checklists
            {floorName && ` for ${floorName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllExceeding}
              disabled={exceedingZones.length === 0}
            >
              <AlertTriangle className="h-4 w-4 mr-1 text-destructive" />
              Select Exceeding ({exceedingZones.length})
            </Button>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All ({zones.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selectedZoneIds.size === 0}
            >
              Clear
            </Button>
            <Badge variant="secondary" className="ml-auto">
              {selectedZoneIds.size} selected
            </Badge>
          </div>

          {/* Zone List */}
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-2 space-y-2">
              {sortedZones.map((zone) => (
                <Card
                  key={zone.zoneId}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-accent',
                    selectedZoneIds.has(zone.zoneId) && 'ring-2 ring-primary bg-accent'
                  )}
                  onClick={() => toggleZone(zone.zoneId)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedZoneIds.has(zone.zoneId)}
                        onCheckedChange={() => toggleZone(zone.zoneId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(zone.status)}
                          <span className="font-medium truncate">{zone.zoneName}</span>
                          {getStatusBadge(zone.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {zone.spaceType} • Target NC-{zone.targetNC}
                          {zone.terminalUnits.length > 0 && (
                            <span> • {zone.terminalUnits.length} terminal unit{zone.terminalUnits.length !== 1 ? 's' : ''}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {zone.estimatedNC !== null ? (
                          <>
                            <div className="text-lg font-bold">NC-{zone.estimatedNC}</div>
                            {zone.ncDelta !== 0 && (
                              <div className={cn(
                                'text-sm font-medium',
                                zone.ncDelta > 0 ? 'text-destructive' : 'text-green-600'
                              )}>
                                {zone.ncDelta > 0 ? '+' : ''}{zone.ncDelta} dB
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">No estimate</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Summary */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p>
              Each checklist will include pre-occupancy NC measurements at room center, 
              near diffusers, and typical workstations with comparison against design targets.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || selectedZoneIds.size === 0}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create {selectedZoneIds.size} Checklist{selectedZoneIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
