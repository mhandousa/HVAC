import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Loader2 } from 'lucide-react';
import { useLoadCalculationsWithZones, LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';

interface BatchImportZonesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (zones: LoadCalculationWithZone[]) => void;
  isImporting?: boolean;
}

export function BatchImportZonesDialog({
  open,
  onOpenChange,
  projectId,
  onImport,
  isImporting = false,
}: BatchImportZonesDialogProps) {
  const { data: loadCalcs, isLoading } = useLoadCalculationsWithZones(projectId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    if (loadCalcs && selectedIds.size === loadCalcs.length) {
      setSelectedIds(new Set());
    } else if (loadCalcs) {
      setSelectedIds(new Set(loadCalcs.map(lc => lc.id)));
    }
  };

  const handleImport = () => {
    if (loadCalcs) {
      const selectedZones = loadCalcs.filter(lc => selectedIds.has(lc.id));
      onImport(selectedZones);
    }
  };

  const zonesWithData = loadCalcs?.filter(lc => lc.cfm_required || lc.cooling_load_btuh) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Zones from Load Calculations</DialogTitle>
          <DialogDescription>
            Select zones to create terminal unit selections. CFM and load values will be auto-populated.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : zonesWithData.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No load calculations found for this project. Complete load calculations first.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedIds.size === zonesWithData.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} of {zonesWithData.length} selected
              </span>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {zonesWithData.map((lc) => (
                  <div
                    key={lc.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleSelection(lc.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(lc.id)}
                      onCheckedChange={() => toggleSelection(lc.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {lc.zone_name || lc.calculation_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lc.building_name && `${lc.building_name} • `}
                        {lc.floor_name && `${lc.floor_name}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {lc.cfm_required && (
                        <Badge variant="secondary" className="font-mono">
                          {lc.cfm_required.toLocaleString()} CFM
                        </Badge>
                      )}
                      {lc.cooling_load_btuh && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {(lc.cooling_load_btuh / 1000).toFixed(1)}k BTU/h
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import {selectedIds.size} Zone{selectedIds.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
