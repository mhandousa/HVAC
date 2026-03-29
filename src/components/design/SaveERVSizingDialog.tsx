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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useSavedERVSizing, ERVCalculationInput } from '@/hooks/useSavedERVSizing';

interface SaveERVSizingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  zoneId?: string | null;
  zoneName?: string;
  ervData: {
    outdoorAirCfm: number;
    ervType: string;
    sensibleEfficiency: number;
    latentEfficiency: number;
    sensibleLoadReduction: number;
    latentLoadReduction: number;
    totalLoadReduction: number;
    annualEnergySavingsKwh: number;
    annualCostSavingsSar: number;
    selectedCity: string;
  };
}

export function SaveERVSizingDialog({
  open,
  onOpenChange,
  projectId,
  zoneId,
  zoneName,
  ervData,
}: SaveERVSizingDialogProps) {
  const [calculationName, setCalculationName] = useState(zoneName ? `${zoneName} ERV` : '');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'final'>('draft');
  
  const { saveCalculation, isLoading } = useSavedERVSizing(projectId || undefined, zoneId || undefined);

  const handleSave = async () => {
    if (!calculationName.trim()) {
      toast.error('Please enter a calculation name');
      return;
    }

    try {
      const calculation: ERVCalculationInput = {
        project_id: projectId,
        zone_id: zoneId || undefined,
        calculation_name: calculationName.trim(),
        outdoor_air_cfm: ervData.outdoorAirCfm,
        erv_type: ervData.ervType,
        sensible_efficiency_percent: ervData.sensibleEfficiency,
        latent_efficiency_percent: ervData.latentEfficiency,
        sensible_recovery_btuh: ervData.sensibleLoadReduction,
        latent_recovery_btuh: ervData.latentLoadReduction,
        total_recovery_btuh: ervData.totalLoadReduction,
        annual_energy_savings_kwh: ervData.annualEnergySavingsKwh,
        annual_cost_savings_sar: ervData.annualCostSavingsSar,
        city: ervData.selectedCity,
        status,
        notes: notes.trim() || undefined,
      };

      await saveCalculation.mutateAsync(calculation);

      toast.success('ERV sizing calculation saved successfully');
      onOpenChange(false);
      setCalculationName('');
      setNotes('');
      setStatus('draft');
    } catch (error) {
      console.error('Failed to save ERV calculation:', error);
      toast.error('Failed to save calculation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Save ERV Sizing Calculation
          </DialogTitle>
          <DialogDescription>
            Save this ERV/HRV sizing calculation for future reference and design completeness tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="erv-calc-name">Calculation Name *</Label>
            <Input
              id="erv-calc-name"
              placeholder="e.g., Conference Room ERV"
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="erv-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'final')}>
              <SelectTrigger id="erv-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="erv-notes">Notes (optional)</Label>
            <Textarea
              id="erv-notes"
              placeholder="Add any notes about this ERV sizing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{ervData.selectedCity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ERV Type:</span>
              <span className="font-medium capitalize">{ervData.ervType.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outdoor Air:</span>
              <span className="font-medium">{ervData.outdoorAirCfm.toLocaleString()} CFM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sensible Efficiency:</span>
              <span className="font-medium">{ervData.sensibleEfficiency}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Load Reduction:</span>
              <span className="font-medium">{Math.round(ervData.totalLoadReduction).toLocaleString()} BTU/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual Savings:</span>
              <span className="font-medium text-primary">{Math.round(ervData.annualCostSavingsSar).toLocaleString()} SAR</span>
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
