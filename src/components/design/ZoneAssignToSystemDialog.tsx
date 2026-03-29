import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { Wind, Droplets, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoneAssignToSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: ZoneCompleteness | null;
  projectId: string;
}

type SystemType = 'duct' | 'pipe' | 'vrf';

interface SystemOption {
  id: string;
  name: string;
  zoneCount: number;
}

export function ZoneAssignToSystemDialog({
  open,
  onOpenChange,
  zone,
  projectId,
}: ZoneAssignToSystemDialogProps) {
  const queryClient = useQueryClient();
  const [systemType, setSystemType] = useState<SystemType>('duct');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);

  // Fetch available systems based on type
  const { data: systems, isLoading: systemsLoading } = useQuery({
    queryKey: ['available-systems', projectId, systemType],
    queryFn: async (): Promise<SystemOption[]> => {
      if (systemType === 'duct') {
        const { data: ductSystems } = await supabase
          .from('duct_systems')
          .select('id, system_name')
          .eq('project_id', projectId);

        if (!ductSystems) return [];

        // Get zone counts for each system
        const systemIds = ductSystems.map(s => s.id);
        const { data: zoneCounts } = await supabase
          .from('duct_system_zones')
          .select('duct_system_id')
          .in('duct_system_id', systemIds);

        const countMap: Record<string, number> = {};
        zoneCounts?.forEach(z => {
          countMap[z.duct_system_id] = (countMap[z.duct_system_id] || 0) + 1;
        });

        return ductSystems.map(s => ({
          id: s.id,
          name: s.system_name,
          zoneCount: countMap[s.id] || 0,
        }));
      } else if (systemType === 'pipe') {
        const { data: pipeSystems } = await supabase
          .from('pipe_systems')
          .select('id, system_name')
          .eq('project_id', projectId);

        if (!pipeSystems) return [];

        const systemIds = pipeSystems.map(s => s.id);
        const { data: zoneCounts } = await supabase
          .from('pipe_system_zones')
          .select('pipe_system_id')
          .in('pipe_system_id', systemIds);

        const countMap: Record<string, number> = {};
        zoneCounts?.forEach(z => {
          countMap[z.pipe_system_id] = (countMap[z.pipe_system_id] || 0) + 1;
        });

        return pipeSystems.map(s => ({
          id: s.id,
          name: s.system_name,
          zoneCount: countMap[s.id] || 0,
        }));
      } else {
        const { data: vrfSystems } = await supabase
          .from('vrf_systems')
          .select('id, system_name')
          .eq('project_id', projectId);

        if (!vrfSystems) return [];

        const systemIds = vrfSystems.map(s => s.id);
        const { data: zoneCounts } = await supabase
          .from('vrf_indoor_units')
          .select('vrf_system_id')
          .in('vrf_system_id', systemIds);

        const countMap: Record<string, number> = {};
        zoneCounts?.forEach(z => {
          countMap[z.vrf_system_id] = (countMap[z.vrf_system_id] || 0) + 1;
        });

        return vrfSystems.map(s => ({
          id: s.id,
          name: s.system_name,
          zoneCount: countMap[s.id] || 0,
        }));
      }
    },
    enabled: open && !!projectId,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!zone || !selectedSystemId) throw new Error('Missing zone or system');

      if (systemType === 'duct') {
        const { error } = await supabase
          .from('duct_system_zones')
          .insert({
            duct_system_id: selectedSystemId,
            zone_id: zone.zoneId,
          });
        if (error) throw error;
      } else if (systemType === 'pipe') {
        const { error } = await supabase
          .from('pipe_system_zones')
          .insert({
            pipe_system_id: selectedSystemId,
            zone_id: zone.zoneId,
          });
        if (error) throw error;
      } else {
        // For VRF, we need to create an indoor unit
        const { error } = await supabase
          .from('vrf_indoor_units')
          .insert({
            vrf_system_id: selectedSystemId,
            zone_id: zone.zoneId,
            unit_tag: `IDU-${zone.zoneName.substring(0, 10).toUpperCase().replace(/\s+/g, '-')}`,
            unit_type: 'wall_mount',
            cooling_capacity_kw: 0,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-completeness'] });
      queryClient.invalidateQueries({ queryKey: ['available-systems'] });
      toast.success(`Zone assigned to ${systemType} system`);
      onOpenChange(false);
      setSelectedSystemId(null);
    },
    onError: (error) => {
      toast.error('Failed to assign zone: ' + error.message);
    },
  });

  const handleAssign = () => {
    if (!selectedSystemId) {
      toast.error('Please select a system');
      return;
    }
    assignMutation.mutate();
  };

  const systemTypeOptions = [
    { value: 'duct' as SystemType, label: 'Duct System', icon: Wind },
    { value: 'pipe' as SystemType, label: 'Pipe System', icon: Droplets },
    { value: 'vrf' as SystemType, label: 'VRF System', icon: Zap },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Zone to Distribution System</DialogTitle>
          <DialogDescription>
            {zone && (
              <>
                Zone: <strong>{zone.zoneName}</strong> ({zone.buildingName}, {zone.floorName})
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>System Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {systemTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = systemType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSystemType(option.value);
                      setSelectedSystemId(null);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors",
                      isSelected 
                        ? "border-primary bg-primary/5 text-primary" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Available Systems</Label>
            {systemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : systems && systems.length > 0 ? (
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <RadioGroup
                  value={selectedSystemId || ''}
                  onValueChange={setSelectedSystemId}
                  className="space-y-2"
                >
                  {systems.map((system) => (
                    <div
                      key={system.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedSystemId === system.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted"
                      )}
                      onClick={() => setSelectedSystemId(system.id)}
                    >
                      <RadioGroupItem value={system.id} id={system.id} />
                      <Label htmlFor={system.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{system.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {system.zoneCount} zone{system.zoneCount !== 1 ? 's' : ''} assigned
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No {systemType} systems found for this project.
                <br />
                <span className="text-sm">Create one first in the {systemType === 'duct' ? 'Duct Designer' : systemType === 'pipe' ? 'Pipe Designer' : 'VRF Designer'}.</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedSystemId || assignMutation.isPending}
          >
            {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign to System
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
