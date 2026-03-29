import { useEquipmentSelections, useDeleteEquipmentSelection } from '@/hooks/useEquipmentSelections';
import { useLoadCalculation } from '@/hooks/useLoadCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FileBox, Trash2, ExternalLink, CheckCircle, Clock, FileCheck, AlertTriangle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { SyncStatusBadge, determineSyncStatus } from './SyncStatusBadge';

// Helper component to show sync status for a selection
function SelectionSyncStatus({ loadCalculationId, selectionCreatedAt }: { 
  loadCalculationId: string | null; 
  selectionCreatedAt: string;
}) {
  const { data: loadCalc } = useLoadCalculation(loadCalculationId || undefined);
  
  if (!loadCalculationId || !loadCalc) return null;
  
  const syncStatus = determineSyncStatus(loadCalc.updated_at, selectionCreatedAt);
  
  // Only show if stale or sync required
  if (syncStatus === 'synced' || syncStatus === 'unknown') return null;
  
  return (
    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs gap-1">
      <AlertTriangle className="h-3 w-3" />
      {syncStatus === 'stale' ? 'May be stale' : 'Load updated'}
    </Badge>
  );
}

interface SavedEquipmentSelectionsProps {
  onLoad?: (selectionId: string) => void;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  draft: { label: 'Draft', icon: Clock, color: 'bg-yellow-500/20 text-yellow-700' },
  recommended: { label: 'Recommended', icon: FileCheck, color: 'bg-blue-500/20 text-blue-700' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-green-500/20 text-green-700' },
  ordered: { label: 'Ordered', icon: FileBox, color: 'bg-purple-500/20 text-purple-700' },
};

export function SavedEquipmentSelections({ onLoad }: SavedEquipmentSelectionsProps) {
  const { data: selections = [], isLoading } = useEquipmentSelections();
  const deleteSelection = useDeleteEquipmentSelection();

  const handleDelete = (id: string) => {
    deleteSelection.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Loading saved selections...</p>
        </CardContent>
      </Card>
    );
  }

  if (selections.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileBox className="h-5 w-5" />
          Saved Equipment Selections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {selections.map((selection) => {
              const status = statusConfig[selection.status || 'draft'];
              const StatusIcon = status.icon;
              const equipmentCount = Array.isArray(selection.selected_equipment) 
                ? selection.selected_equipment.length 
                : 0;

              return (
                <div 
                  key={selection.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium truncate">{selection.selection_name}</h4>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <SelectionSyncStatus 
                          loadCalculationId={selection.load_calculation_id} 
                          selectionCreatedAt={selection.created_at}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {selection.equipment_category && (
                          <span>{selection.equipment_category}</span>
                        )}
                        {selection.required_capacity_tons && (
                          <span>{selection.required_capacity_tons} tons</span>
                        )}
                        <span>{equipmentCount} unit(s)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(selection.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {onLoad && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onLoad(selection.id)}
                          title="Load selection"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Selection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{selection.selection_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(selection.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
