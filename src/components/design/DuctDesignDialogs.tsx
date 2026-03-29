import { useState } from 'react';
import { useDuctSystems, useDuctSegments, useSaveDuctDesign, useDeleteDuctSystem } from '@/hooks/useDuctSystems';
import { useLinkZonesToDuctSystem } from '@/hooks/useDuctSystemZones';
import { useProjects } from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FolderOpen, Loader2, Trash2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import type { ZoneAssignment } from './ZoneAssignmentPanel';

interface DuctSection {
  id: string;
  name: string;
  cfm: number;
  length: number;
  fittings: number;
  shape: 'round' | 'rectangular';
  width?: number;
  height?: number;
  diameter?: number;
  velocity?: number;
  frictionLoss?: number;
  totalPressureDrop?: number;
}

interface SaveDuctDesignDialogProps {
  sections: DuctSection[];
  method: string;
  targetFriction: number;
  targetVelocity: number;
  ductShape: string;
  totalSystemPressure: number;
  zoneAssignments?: ZoneAssignment[];
  onSave: (systemId: string) => void;
}

export function SaveDuctDesignDialog({
  sections,
  method,
  targetFriction,
  targetVelocity,
  ductShape,
  totalSystemPressure,
  zoneAssignments = [],
  onSave,
}: SaveDuctDesignDialogProps) {
  const [open, setOpen] = useState(false);
  const [systemName, setSystemName] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: projects = [] } = useProjects();
  const saveDuctDesign = useSaveDuctDesign();
  const linkZones = useLinkZonesToDuctSystem();

  const handleSave = async () => {
    if (!systemName.trim()) return;

    setIsLoading(true);
    try {
      const totalAirflow = sections.reduce((sum, s) => sum + s.cfm, 0);
      
      const result = await saveDuctDesign.mutateAsync({
        systemData: {
          system_name: systemName,
          system_type: 'supply',
          design_method: method === 'equal-friction' ? 'equal_friction' : 'velocity_reduction',
          total_airflow_cfm: totalAirflow,
          system_static_pressure_pa: totalSystemPressure * 249.09, // in. w.g. to Pa
          target_friction_rate: targetFriction,
          design_velocity_fpm: targetVelocity,
          duct_material: 'galvanized_steel',
          project_id: projectId || undefined,
        },
        segments: sections.map((s, i) => ({
          segment_name: s.name,
          cfm: s.cfm,
          length_ft: s.length,
          fittings_equivalent_length_ft: s.fittings,
          duct_shape: s.shape,
          diameter_in: s.diameter,
          width_in: s.width,
          height_in: s.height,
          velocity_fpm: s.velocity,
          friction_loss_per_100ft: s.frictionLoss,
          total_pressure_drop: s.totalPressureDrop,
          sort_order: i,
        })),
      });

      // Save zone assignments if any
      if (zoneAssignments.length > 0) {
        await linkZones.mutateAsync({
          systemId: result.id,
          zones: zoneAssignments.map(z => ({
            zone_id: z.zoneId,
            airflow_cfm: z.cfm,
          })),
        });
      }

      onSave(result.id);
      setOpen(false);
      setSystemName('');
      setProjectId('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save className="w-4 h-4" />
          Save Design
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Duct Design</DialogTitle>
          <DialogDescription>
            Save the current duct sizing design to the database
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="system-name">System Name *</Label>
            <Input
              id="system-name"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="e.g., Main Supply Duct System"
            />
          </div>
          <div className="space-y-2">
            <Label>Link to Project (optional)</Label>
            <Select value={projectId || "none"} onValueChange={(value) => setProjectId(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-2">Design Summary</p>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Sections:</span>
              <span className="text-foreground">{sections.length}</span>
              <span>Method:</span>
              <span className="text-foreground capitalize">{method.replace('-', ' ')}</span>
              <span>Total Pressure:</span>
              <span className="text-foreground">{totalSystemPressure.toFixed(2)} in. w.g.</span>
              {zoneAssignments.length > 0 && (
                <>
                  <span>Zones:</span>
                  <span className="text-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {zoneAssignments.length} zone{zoneAssignments.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!systemName.trim() || isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LoadDuctDesignDialogProps {
  onLoad: (system: {
    system_name: string;
    design_method: string;
    target_friction_rate: number | null;
    design_velocity_fpm: number | null;
    segments: Array<{
      segment_name: string;
      cfm: number;
      length_ft: number | null;
      fittings_equivalent_length_ft: number;
      duct_shape: string;
      diameter_in: number | null;
      width_in: number | null;
      height_in: number | null;
    }>;
  }) => void;
}

export function LoadDuctDesignDialog({ onLoad }: LoadDuctDesignDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: systems = [], isLoading: systemsLoading } = useDuctSystems();
  const { data: segments = [] } = useDuctSegments(selectedId || undefined);
  const deleteDuctSystem = useDeleteDuctSystem();

  const handleLoad = () => {
    const system = systems.find(s => s.id === selectedId);
    if (!system) return;

    onLoad({
      system_name: system.system_name,
      design_method: system.design_method,
      target_friction_rate: system.target_friction_rate,
      design_velocity_fpm: system.design_velocity_fpm,
      segments: segments.map(seg => ({
        segment_name: seg.segment_name,
        cfm: seg.cfm,
        length_ft: seg.length_ft,
        fittings_equivalent_length_ft: seg.fittings_equivalent_length_ft,
        duct_shape: seg.duct_shape,
        diameter_in: seg.diameter_in,
        width_in: seg.width_in,
        height_in: seg.height_in,
      })),
    });
    setOpen(false);
    setSelectedId('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this duct design?')) {
      await deleteDuctSystem.mutateAsync(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FolderOpen className="w-4 h-4" />
          Load Design
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Load Saved Design</DialogTitle>
          <DialogDescription>
            Select a previously saved duct design to load
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {systemsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : systems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No saved designs found
            </div>
          ) : (
            <div className="space-y-2">
              {systems.map((system) => (
                <button
                  key={system.id}
                  onClick={() => setSelectedId(system.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedId === system.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{system.system_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {system.design_method.replace('_', ' ')} • {system.total_airflow_cfm?.toLocaleString()} CFM
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {format(new Date(system.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => handleDelete(system.id, e)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleLoad} disabled={!selectedId || segments.length === 0}>
            Load Design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
