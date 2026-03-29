import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSavedVentilationCalcs, VentilationCalculationInput, VentilationZoneResultInput } from '@/hooks/useSavedVentilationCalcs';

interface SaveVentilationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  systemResult: {
    systemOutdoorAir: number;
    effectiveVentilationPercent: number;
    diversityFactor: number;
    Ev: number;
    supplyAirCfm: number;
    totalOccupancy: number;
    totalFloorArea: number;
  };
  zoneResults: Array<{
    zoneId?: string;
    zoneName: string;
    spaceTypeId: string;
    floorArea: number;
    occupancy: number;
    Rp: number;
    Ra: number;
    Voz: number;
    supplyAirCfm: number;
    Ez: number;
    Vpz: number;
    ventilationEfficiencyPercent: number;
  }>;
}

export function SaveVentilationDialog({
  open,
  onOpenChange,
  projectId,
  systemResult,
  zoneResults,
}: SaveVentilationDialogProps) {
  const [calculationName, setCalculationName] = useState('');
  const [notes, setNotes] = useState('');
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  
  const { saveCalculation, isLoading } = useSavedVentilationCalcs(projectId || undefined);

  const handleSave = async () => {
    if (!calculationName.trim()) {
      toast.error('Please enter a calculation name');
      return;
    }

    try {
      const calculation: VentilationCalculationInput = {
        project_id: projectId,
        calculation_name: calculationName.trim(),
        system_outdoor_air_cfm: systemResult.systemOutdoorAir,
        system_efficiency: systemResult.Ev,
        diversity_factor: systemResult.diversityFactor,
        total_occupancy: systemResult.totalOccupancy,
        total_floor_area_sqft: systemResult.totalFloorArea,
        supply_air_cfm: systemResult.supplyAirCfm,
        system_outdoor_air_percent: systemResult.effectiveVentilationPercent,
        notes: notes.trim() || undefined,
        status: isOverrideMode ? 'override' : 'calculated',
      };

      const zoneResultsData: VentilationZoneResultInput[] = zoneResults.map((zone) => ({
        zone_id: zone.zoneId || undefined,
        zone_name: zone.zoneName,
        space_type_id: zone.spaceTypeId,
        floor_area_sqft: zone.floorArea,
        occupancy: zone.occupancy,
        rp_cfm_person: zone.Rp,
        ra_cfm_sqft: zone.Ra,
        voz_cfm: zone.Voz,
        ez: zone.Ez,
        vbz_cfm: zone.Vpz,
      }));

      await saveCalculation.mutateAsync({
        calculation,
        zoneResults: zoneResultsData,
      });

      toast.success('Ventilation calculation saved successfully');
      onOpenChange(false);
      setCalculationName('');
      setNotes('');
      setIsOverrideMode(false);
    } catch (error) {
      console.error('Failed to save calculation:', error);
      toast.error('Failed to save calculation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Ventilation Calculation
          </DialogTitle>
          <DialogDescription>
            Save this ASHRAE 62.1 calculation for future reference and design completeness tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="calc-name">Calculation Name *</Label>
            <Input
              id="calc-name"
              placeholder="e.g., Office Building - Ground Floor"
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this calculation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Override Mode</Label>
              <p className="text-xs text-muted-foreground">
                Mark as manually adjusted values
              </p>
            </div>
            <Switch
              checked={isOverrideMode}
              onCheckedChange={setIsOverrideMode}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zones:</span>
              <span className="font-medium">{zoneResults.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Outdoor Air:</span>
              <span className="font-medium">{Math.round(systemResult.systemOutdoorAir).toLocaleString()} CFM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Efficiency (Ev):</span>
              <span className="font-medium">{(systemResult.Ev * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diversity Factor:</span>
              <span className="font-medium">{(systemResult.diversityFactor * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !calculationName.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Calculation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
