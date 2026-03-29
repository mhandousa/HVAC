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
import { Loader2, Save, FolderOpen, Trash2 } from 'lucide-react';
import { usePipeSystems, useSavePipeDesign, useDeletePipeSystem, PipeSystem } from '@/hooks/usePipeSystems';
import { format } from 'date-fns';

interface PipeSection {
  id: string;
  name: string;
  flowGpm: number;
  length: number;
  fittings: number;
  fluid: string;
  material: string;
  nominalSize?: number;
  velocity?: number;
  frictionLoss?: number;
  totalPressureDrop?: number;
}

interface SavePipeDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  systemType: string;
  fluidType: string;
  pipeMaterial: string;
  maxVelocity: number;
  maxFriction: number;
  totalHead: number;
  sections: PipeSection[];
  onSaved?: (systemId: string) => void;
}

export function SavePipeDesignDialog({
  open,
  onOpenChange,
  projectId,
  systemType,
  fluidType,
  pipeMaterial,
  maxVelocity,
  maxFriction,
  totalHead,
  sections,
  onSaved,
}: SavePipeDesignDialogProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('draft');

  const savePipeDesign = useSavePipeDesign();

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      const result = await savePipeDesign.mutateAsync({
        system: {
          project_id: projectId,
          system_name: name,
          system_type: systemType,
          fluid_type: fluidType,
          pipe_material: pipeMaterial,
          max_velocity_fps: maxVelocity,
          max_friction_ft_per_100ft: maxFriction,
          system_head_ft: totalHead,
          total_flow_gpm: sections.reduce((sum, s) => sum + s.flowGpm, 0),
          status,
          notes,
        },
        segments: sections.map((s, i) => ({
          segment_name: s.name,
          flow_gpm: s.flowGpm,
          nominal_size_in: s.nominalSize,
          length_ft: s.length,
          fittings_equivalent_length_ft: s.fittings,
          velocity_fps: s.velocity,
          friction_loss_per_100ft: s.frictionLoss,
          total_pressure_drop_ft: s.totalPressureDrop,
          segment_type: 'main',
          sort_order: i,
        })),
      });

      onSaved?.(result.system.id);
      onOpenChange(false);
      setName('');
      setNotes('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Pipe Design</DialogTitle>
          <DialogDescription>
            Save this pipe sizing calculation for future reference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Design Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chilled Water Main Loop"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this design..."
              rows={3}
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
            <p><strong>Sections:</strong> {sections.length}</p>
            <p><strong>System Head:</strong> {totalHead.toFixed(1)} ft</p>
            <p><strong>Material:</strong> {pipeMaterial}</p>
            <p><strong>Fluid:</strong> {fluidType.replace('-', ' ')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || savePipeDesign.isPending}
          >
            {savePipeDesign.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LoadPipeDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onLoad: (system: PipeSystem) => void;
}

export function LoadPipeDesignDialog({
  open,
  onOpenChange,
  projectId,
  onLoad,
}: LoadPipeDesignDialogProps) {
  const { data: systems, isLoading } = usePipeSystems(projectId);
  const deleteSystem = useDeletePipeSystem();

  const handleLoad = (system: PipeSystem) => {
    onLoad(system);
    onOpenChange(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this pipe design?')) {
      await deleteSystem.mutateAsync(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Load Pipe Design
          </DialogTitle>
          <DialogDescription>
            Select a saved pipe design to load
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : systems && systems.length > 0 ? (
            <div className="space-y-2">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleLoad(system)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{system.system_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{system.system_type?.replace('-', ' ')}</span>
                      <span>•</span>
                      <span>{system.total_flow_gpm?.toFixed(0) || 0} GPM</span>
                      <span>•</span>
                      <span>{system.system_head_ft?.toFixed(1) || 0} ft head</span>
                      <span>•</span>
                      <span>{format(new Date(system.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      system.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                      system.status === 'review' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {system.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleDelete(e, system.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No saved pipe designs found</p>
              {projectId && (
                <p className="text-sm mt-1">Try removing the project filter to see all designs</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
