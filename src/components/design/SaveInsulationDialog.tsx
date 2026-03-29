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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import {
  useCreateInsulationCalculation,
  useUpdateInsulationCalculation,
} from '@/hooks/useInsulationCalculations';

interface SaveInsulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculationType: 'pipe' | 'duct';
  // Common
  locationId: string;
  ambientTempC: number;
  relativeHumidity: number;
  dewPointC: number;
  // Pipe-specific
  serviceType?: string;
  fluidTempC?: number;
  pipeSizeInches?: number;
  pipeLengthM?: number;
  // Duct-specific
  airTempC?: number;
  ductWidthMm?: number;
  ductHeightMm?: number;
  airVelocityMps?: number;
  // Insulation
  insulationMaterial?: string;
  insulationThicknessMm?: number;
  results?: Record<string, unknown>;
  meetsCondensation?: boolean;
  meetsSBCCode?: boolean;
  // Existing
  existingId?: string;
  existingName?: string;
  existingDescription?: string;
  existingProjectId?: string;
  existingStatus?: 'draft' | 'final';
  onSaved?: (id: string) => void;
}

export function SaveInsulationDialog({
  open,
  onOpenChange,
  calculationType,
  locationId,
  ambientTempC,
  relativeHumidity,
  dewPointC,
  serviceType,
  fluidTempC,
  pipeSizeInches,
  pipeLengthM,
  airTempC,
  ductWidthMm,
  ductHeightMm,
  airVelocityMps,
  insulationMaterial,
  insulationThicknessMm,
  results,
  meetsCondensation,
  meetsSBCCode,
  existingId,
  existingName,
  existingDescription,
  existingProjectId,
  existingStatus,
  onSaved,
}: SaveInsulationDialogProps) {
  const [name, setName] = useState(existingName || '');
  const [description, setDescription] = useState(existingDescription || '');
  const [projectId, setProjectId] = useState(existingProjectId || '');
  const [isFinal, setIsFinal] = useState(existingStatus === 'final');

  const { data: projects = [] } = useProjects();
  const createMutation = useCreateInsulationCalculation();
  const updateMutation = useUpdateInsulationCalculation();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      project_id: projectId || undefined,
      calculation_type: calculationType,
      status: isFinal ? 'final' as const : 'draft' as const,
      location_id: locationId,
      ambient_temp_c: ambientTempC,
      relative_humidity: relativeHumidity,
      dew_point_c: dewPointC,
      service_type: serviceType,
      fluid_temp_c: fluidTempC,
      pipe_size_inches: pipeSizeInches,
      pipe_length_m: pipeLengthM,
      air_temp_c: airTempC,
      duct_width_mm: ductWidthMm,
      duct_height_mm: ductHeightMm,
      air_velocity_mps: airVelocityMps,
      insulation_material: insulationMaterial,
      insulation_thickness_mm: insulationThicknessMm,
      results,
      meets_condensation_requirement: meetsCondensation,
      meets_sbc_code: meetsSBCCode,
    };

    try {
      if (existingId) {
        await updateMutation.mutateAsync({ id: existingId, ...data });
        onSaved?.(existingId);
      } else {
        const result = await createMutation.mutateAsync(data);
        onSaved?.(result.id);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingId ? 'Update Calculation' : 'Save Calculation'}
          </DialogTitle>
          <DialogDescription>
            Save this {calculationType} insulation calculation for future reference.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={calculationType === 'pipe' ? 'e.g., CHW Supply Pipe - Building A' : 'e.g., Supply Duct - Floor 1'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project (Optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="final">Mark as Final</Label>
              <p className="text-xs text-muted-foreground">
                Final calculations are considered complete
              </p>
            </div>
            <Switch
              id="final"
              checked={isFinal}
              onCheckedChange={setIsFinal}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{calculationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ambient</span>
              <span className="font-medium">{ambientTempC}°C / {relativeHumidity}% RH</span>
            </div>
            {calculationType === 'pipe' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fluid Temp</span>
                  <span className="font-medium">{fluidTempC}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pipe Size</span>
                  <span className="font-medium">{pipeSizeInches}"</span>
                </div>
              </>
            )}
            {calculationType === 'duct' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Air Temp</span>
                  <span className="font-medium">{airTempC}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duct Size</span>
                  <span className="font-medium">{ductWidthMm} x {ductHeightMm} mm</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Compliance</span>
              <div className="flex gap-1">
                {meetsCondensation !== undefined && (
                  <Badge variant={meetsCondensation ? 'default' : 'destructive'} className="text-xs">
                    {meetsCondensation ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Condensation</>
                    ) : (
                      <><AlertTriangle className="w-3 h-3 mr-1" /> Condensation Risk</>
                    )}
                  </Badge>
                )}
                {meetsSBCCode !== undefined && (
                  <Badge variant={meetsSBCCode ? 'default' : 'destructive'} className="text-xs">
                    {meetsSBCCode ? 'SBC OK' : 'SBC Fail'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {existingId ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
