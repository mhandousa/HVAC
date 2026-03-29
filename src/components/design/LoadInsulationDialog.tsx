import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FolderOpen, Search, Trash2, Wind, Droplets, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import {
  InsulationCalculation,
  useInsulationCalculations,
  useDeleteInsulationCalculation,
} from '@/hooks/useInsulationCalculations';

interface LoadInsulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculationType?: 'pipe' | 'duct';
  onLoad: (calc: InsulationCalculation) => void;
}

export function LoadInsulationDialog({
  open,
  onOpenChange,
  calculationType,
  onLoad,
}: LoadInsulationDialogProps) {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pipe' | 'duct'>(calculationType || 'all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects = [] } = useProjects();
  const { data: calculations = [], isLoading } = useInsulationCalculations(
    projectFilter !== 'all' ? projectFilter : undefined
  );
  const deleteMutation = useDeleteInsulationCalculation();

  const filtered = useMemo(() => {
    return calculations.filter((calc) => {
      if (typeFilter !== 'all' && calc.calculation_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!calc.name.toLowerCase().includes(q) && 
            !calc.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [calculations, typeFilter, search]);

  const handleLoad = (calc: InsulationCalculation) => {
    onLoad(calc);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Load Saved Calculation
            </DialogTitle>
            <DialogDescription>
              Select a previously saved insulation calculation to load.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!calculationType && (
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="pipe">Pipe</SelectItem>
                  <SelectItem value="duct">Duct</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FolderOpen className="h-8 w-8 mb-2" />
                <p className="text-sm">No saved calculations found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((calc) => (
                  <div
                    key={calc.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => handleLoad(calc)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">
                        {calc.calculation_type === 'duct' ? (
                          <Wind className="h-5 w-5 text-primary" />
                        ) : (
                          <Droplets className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{calc.name}</span>
                          <Badge variant={calc.status === 'final' ? 'default' : 'secondary'} className="text-xs">
                            {calc.status}
                          </Badge>
                          {calc.meets_condensation_requirement !== null && (
                            calc.meets_condensation_requirement ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {calc.calculation_type === 'pipe' 
                            ? `${calc.fluid_temp_c}°C • ${calc.pipe_size_inches}" pipe`
                            : `${calc.air_temp_c}°C • ${calc.duct_width_mm}x${calc.duct_height_mm}mm`
                          }
                          {calc.insulation_thickness_mm && ` • ${calc.insulation_thickness_mm}mm insulation`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(calc.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(calc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this saved calculation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
