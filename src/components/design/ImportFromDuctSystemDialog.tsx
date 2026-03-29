import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GitBranch, Loader2, Wind } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useOrganization';

interface DuctSegmentForImport {
  id: string;
  segment_name: string;
  cfm: number;
  zone_id: string | null;
  duct_system_id: string;
  system_name: string;
}

interface ImportFromDuctSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (segments: DuctSegmentForImport[]) => void;
  isImporting?: boolean;
}

export function ImportFromDuctSystemDialog({
  open,
  onOpenChange,
  projectId,
  onImport,
  isImporting = false,
}: ImportFromDuctSystemDialogProps) {
  const { data: profile } = useProfile();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: ductData, isLoading } = useQuery({
    queryKey: ['duct_systems_for_import', projectId, profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id || !projectId) return { systems: [], segments: [] };

      // Fetch duct systems
      const { data: systems, error: systemsError } = await supabase
        .from('duct_systems')
        .select('id, system_name, total_airflow_cfm')
        .eq('organization_id', profile.organization_id)
        .eq('project_id', projectId);

      if (systemsError) throw systemsError;

      // Fetch terminal segments (end-of-line branches with zone assignments or small CFM)
      const { data: segments, error: segmentsError } = await supabase
        .from('duct_segments')
        .select('id, segment_name, cfm, zone_id, duct_system_id')
        .in('duct_system_id', systems?.map(s => s.id) || [])
        .not('zone_id', 'is', null) // Only segments with zone assignments
        .order('cfm', { ascending: false });

      if (segmentsError) throw segmentsError;

      // Enrich segments with system names
      const enrichedSegments: DuctSegmentForImport[] = (segments || []).map(seg => ({
        ...seg,
        system_name: systems?.find(s => s.id === seg.duct_system_id)?.system_name || 'Unknown System',
      }));

      return { systems: systems || [], segments: enrichedSegments };
    },
    enabled: !!profile?.organization_id && !!projectId && open,
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSystem = (systemId: string) => {
    const systemSegments = ductData?.segments.filter(s => s.duct_system_id === systemId) || [];
    const allSelected = systemSegments.every(s => selectedIds.has(s.id));
    
    const newSelection = new Set(selectedIds);
    systemSegments.forEach(s => {
      if (allSelected) {
        newSelection.delete(s.id);
      } else {
        newSelection.add(s.id);
      }
    });
    setSelectedIds(newSelection);
  };

  const handleImport = () => {
    if (ductData) {
      const selectedSegments = ductData.segments.filter(s => selectedIds.has(s.id));
      onImport(selectedSegments);
    }
  };

  // Group segments by system
  const segmentsBySystem = ductData?.segments.reduce((acc, seg) => {
    if (!acc[seg.duct_system_id]) {
      acc[seg.duct_system_id] = {
        systemName: seg.system_name,
        segments: [],
      };
    }
    acc[seg.duct_system_id].segments.push(seg);
    return acc;
  }, {} as Record<string, { systemName: string; segments: DuctSegmentForImport[] }>) || {};

  const hasSegments = Object.keys(segmentsBySystem).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Import from Duct Systems
          </DialogTitle>
          <DialogDescription>
            Select terminal duct segments to create diffuser records. CFM values will be auto-populated.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasSegments ? (
          <div className="py-8 text-center text-muted-foreground">
            <Wind className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No duct segments with zone assignments found.</p>
            <p className="text-sm mt-1">Create duct systems and assign segments to zones first.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">
                {Object.keys(segmentsBySystem).length} Duct System{Object.keys(segmentsBySystem).length !== 1 ? 's' : ''}
              </span>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} of {ductData?.segments.length} segments selected
              </span>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <Accordion type="multiple" className="w-full">
                {Object.entries(segmentsBySystem).map(([systemId, { systemName, segments }]) => {
                  const systemSelected = segments.every(s => selectedIds.has(s.id));
                  const someSelected = segments.some(s => selectedIds.has(s.id));

                  return (
                    <AccordionItem key={systemId} value={systemId}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={systemSelected}
                            ref={(el) => {
                              if (el) {
                                (el as HTMLButtonElement).dataset.state = 
                                  systemSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked';
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSystem(systemId);
                            }}
                          />
                          <span className="font-medium">{systemName}</span>
                          <Badge variant="secondary" className="ml-2">
                            {segments.length} segment{segments.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-8">
                          {segments.map((seg) => (
                            <div
                              key={seg.id}
                              className="flex items-center gap-3 rounded-lg border p-2 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleSelection(seg.id)}
                            >
                              <Checkbox
                                checked={selectedIds.has(seg.id)}
                                onCheckedChange={() => toggleSelection(seg.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-sm">
                                  {seg.segment_name}
                                </div>
                              </div>
                              <Badge variant="outline" className="font-mono">
                                {seg.cfm.toLocaleString()} CFM
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Diffusers...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Create {selectedIds.size} Diffuser{selectedIds.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
