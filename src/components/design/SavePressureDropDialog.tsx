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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import {
  PressureComponent,
  useCreatePressureDropCalculation,
  useUpdatePressureDropCalculation,
} from '@/hooks/usePressureDropCalculations';

interface SavePressureDropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculationType: 'air' | 'water';
  flowRate: number;
  sizeInches: number;
  velocity?: number;
  velocityPressure?: number;
  components: PressureComponent[];
  totalPressureDrop: number;
  unit: string;
  existingId?: string;
  existingName?: string;
  existingDescription?: string;
  existingProjectId?: string;
  existingStatus?: 'draft' | 'final';
  onSaved?: (id: string) => void;
}

export function SavePressureDropDialog({
  open,
  onOpenChange,
  calculationType,
  flowRate,
  sizeInches,
  velocity,
  velocityPressure,
  components,
  totalPressureDrop,
  unit,
  existingId,
  existingName,
  existingDescription,
  existingProjectId,
  existingStatus,
  onSaved,
}: SavePressureDropDialogProps) {
  const [name, setName] = useState(existingName || '');
  const [description, setDescription] = useState(existingDescription || '');
  const [projectId, setProjectId] = useState(existingProjectId || '');
  const [isFinal, setIsFinal] = useState(existingStatus === 'final');

  const { data: projects = [] } = useProjects();
  const createMutation = useCreatePressureDropCalculation();
  const updateMutation = useUpdatePressureDropCalculation();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      project_id: projectId || undefined,
      calculation_type: calculationType,
      status: isFinal ? 'final' as const : 'draft' as const,
      flow_rate: flowRate,
      size_inches: sizeInches,
      velocity,
      velocity_pressure: velocityPressure,
      components,
      total_pressure_drop: totalPressureDrop,
      unit,
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
            Save this {calculationType === 'air' ? 'air system' : 'water system'} pressure drop calculation for future reference.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AHU-1 Supply Duct"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this calculation..."
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

          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{calculationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flow Rate</span>
              <span className="font-medium">
                {flowRate} {calculationType === 'air' ? 'CFM' : 'GPM'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Components</span>
              <span className="font-medium">{components.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Drop</span>
              <span className="font-medium">
                {totalPressureDrop.toFixed(3)} {unit}
              </span>
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
