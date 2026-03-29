import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import {
  usePsychrometricAnalyses,
  usePsychrometricAnalysis,
  useCreatePsychrometricAnalysis,
  useUpdatePsychrometricAnalysis,
  useDeletePsychrometricAnalysis,
  AirState,
  Process,
  PsychrometricAnalysis,
} from '@/hooks/usePsychrometricAnalyses';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Save, FolderOpen, Loader2, Trash2, FileText, Calendar, Thermometer } from 'lucide-react';
import { format } from 'date-fns';

interface LocalAirState {
  id: string;
  name: string;
  dryBulb: number;
  wetBulb: number;
  relativeHumidity: number;
  dewPoint: number;
  humidityRatio: number;
  enthalpy: number;
  specificVolume: number;
  color: string;
}

interface SavePsychrometricDialogProps {
  states: LocalAirState[];
  settings: {
    altitude: number;
    atmosphericPressure: number;
  };
  projectId?: string;
  zoneId?: string;
  currentAnalysisId?: string;
  onLoad: (analysis: PsychrometricAnalysis) => void;
  onAnalysisIdChange?: (id: string | undefined) => void;
}

export function SavePsychrometricDialog({
  states,
  settings,
  projectId,
  zoneId,
  currentAnalysisId,
  onLoad,
  onAnalysisIdChange,
}: SavePsychrometricDialogProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);

  const { data: projects } = useProjects();
  const { data: analyses, isLoading: loadingAnalyses } = usePsychrometricAnalyses(selectedProjectId);
  const createAnalysis = useCreatePsychrometricAnalysis();
  const updateAnalysis = useUpdatePsychrometricAnalysis();
  const deleteAnalysis = useDeletePsychrometricAnalysis();

  const handleSave = async () => {
    if (!name.trim()) return;

    const airStates: AirState[] = states.map(s => ({
      id: s.id,
      name: s.name,
      dryBulb: s.dryBulb,
      wetBulb: s.wetBulb,
      relativeHumidity: s.relativeHumidity,
      dewPoint: s.dewPoint,
      humidityRatio: s.humidityRatio,
      enthalpy: s.enthalpy,
      specificVolume: s.specificVolume,
      color: s.color,
    }));

    // Calculate processes from consecutive states
    const processes: Process[] = [];
    for (let i = 0; i < states.length - 1; i++) {
      processes.push({
        fromStateId: states[i].id,
        toStateId: states[i + 1].id,
        processType: 'unknown', // Will be calculated on load
      });
    }

    if (currentAnalysisId) {
      await updateAnalysis.mutateAsync({
        id: currentAnalysisId,
        name,
        description,
        air_states: airStates,
        processes,
        altitude_ft: settings.altitude,
        atmospheric_pressure_psia: settings.atmosphericPressure,
        zone_id: zoneId,
      });
    } else {
      const result = await createAnalysis.mutateAsync({
        name,
        description,
        project_id: selectedProjectId,
        zone_id: zoneId,
        air_states: airStates,
        processes,
        altitude_ft: settings.altitude,
        atmospheric_pressure_psia: settings.atmosphericPressure,
        status: 'draft',
      });
      onAnalysisIdChange?.(result.id);
    }

    setSaveOpen(false);
    setName('');
    setDescription('');
  };

  const handleLoad = (analysis: PsychrometricAnalysis) => {
    onLoad(analysis);
    onAnalysisIdChange?.(analysis.id);
    setLoadOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setAnalysisToDelete(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!analysisToDelete) return;
    await deleteAnalysis.mutateAsync(analysisToDelete);
    if (currentAnalysisId === analysisToDelete) {
      onAnalysisIdChange?.(undefined);
    }
    setDeleteOpen(false);
    setAnalysisToDelete(null);
  };

  const openSaveDialog = () => {
    // Pre-fill name if editing existing
    if (currentAnalysisId && analyses) {
      const current = analyses.find(a => a.id === currentAnalysisId);
      if (current) {
        setName(current.name);
        setDescription(current.description || '');
      }
    }
    setSaveOpen(true);
  };

  return (
    <>
      {/* Save Button */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={openSaveDialog}>
            <Save className="w-4 h-4 mr-2" />
            {currentAnalysisId ? 'Save' : 'Save As'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Psychrometric Analysis</DialogTitle>
            <DialogDescription>
              Save your current analysis to the database for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AHU-01 Summer Design"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about this analysis..."
                rows={3}
              />
            </div>
            {!projectId && (
              <div className="space-y-2">
                <Label>Link to Project (Optional)</Label>
                <Select value={selectedProjectId || ''} onValueChange={(v) => setSelectedProjectId(v || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-2">Analysis Summary</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span>State Points: {states.length}</span>
                <span>Altitude: {settings.altitude.toLocaleString()} ft</span>
                <span>Pressure: {settings.atmosphericPressure.toFixed(2)} psia</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!name.trim() || createAnalysis.isPending || updateAnalysis.isPending}
            >
              {(createAnalysis.isPending || updateAnalysis.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {currentAnalysisId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Button */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            Load
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Analysis</DialogTitle>
            <DialogDescription>
              Select a previously saved psychrometric analysis to load.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!projectId && (
              <div className="mb-4">
                <Label>Filter by Project</Label>
                <Select value={selectedProjectId || ''} onValueChange={(v) => setSelectedProjectId(v || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Projects</SelectItem>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <ScrollArea className="h-[300px]">
              {loadingAnalyses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !analyses?.length ? (
                <EmptyState
                  icon={FileText}
                  title="No Saved Analyses"
                  description="Save your first psychrometric analysis to see it here."
                />
              ) : (
                <div className="space-y-2">
                  {analyses.map((analysis) => (
                    <Card 
                      key={analysis.id}
                      className={`cursor-pointer transition-colors hover:border-primary ${
                        currentAnalysisId === analysis.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleLoad(analysis)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Thermometer className="w-4 h-4 text-primary" />
                              <span className="font-medium">{analysis.name}</span>
                              {currentAnalysisId === analysis.id && (
                                <Badge variant="secondary" className="text-xs">Current</Badge>
                              )}
                            </div>
                            {analysis.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {analysis.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                              </span>
                              <span>{analysis.air_states.length} states</span>
                              <span>{analysis.altitude_ft.toLocaleString()} ft</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(analysis.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The analysis will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAnalysis.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
