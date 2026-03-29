import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useAuth } from '@/hooks/useAuth';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useProjects } from '@/hooks/useProjects';
import { useBuildings } from '@/hooks/useBuildings';
import { useFloors } from '@/hooks/useFloors';
import { useZoneAcousticAnalysis } from '@/hooks/useZoneAcousticAnalysis';
import { useCommissioningProjects } from '@/hooks/useCommissioning';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AcousticFloorPlanHeatMap } from '@/components/acoustic/AcousticFloorPlanHeatMap';
import { AcousticFloorSummary } from '@/components/acoustic/AcousticFloorSummary';
import { CreateAcousticChecklistDialog } from '@/components/commissioning/CreateAcousticChecklistDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Volume2, 
  Building2, 
  Layers,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  ClipboardCheck,
} from 'lucide-react';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';

export default function AcousticFloorPlan() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: buildings = [] } = useBuildings(selectedProjectId || undefined);
  const { data: floors = [] } = useFloors(selectedBuildingId || undefined);
  
  const { zones, floorSummary, exceedingZones } = useZoneAcousticAnalysis(
    selectedProjectId || undefined,
    selectedFloorId || undefined
  );

  const { projects: commissioningProjects } = useCommissioningProjects();
  const [showCreateChecklistDialog, setShowCreateChecklistDialog] = useState(false);

  const queryClient = useQueryClient();
  
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['zone-acoustic-analysis', selectedProjectId, selectedFloorId] });
  };

  // Get first commissioning project for the selected project
  const commissioningProject = useMemo(() => {
    if (!selectedProjectId || !commissioningProjects) return null;
    return commissioningProjects.find(cp => cp.project_id === selectedProjectId);
  }, [selectedProjectId, commissioningProjects]);

  // Initialize from URL params or stored context
  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam && projects.some(p => p.id === projectParam)) {
      setSelectedProjectId(projectParam);
    } else if (storedProjectId && projects.some(p => p.id === storedProjectId)) {
      setSelectedProjectId(storedProjectId);
    }
  }, [searchParams, projects, storedProjectId]);

  // Sync context when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setContext(selectedProjectId, null, { replace: true });
    }
  }, [selectedProjectId, setContext]);

  // Auto-select first building when project changes
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      setSelectedBuildingId(buildings[0].id);
    }
  }, [buildings, selectedBuildingId]);

  // Auto-select first floor when building changes
  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  // Reset selections when parent changes
  useEffect(() => {
    setSelectedBuildingId('');
    setSelectedFloorId('');
  }, [selectedProjectId]);

  useEffect(() => {
    setSelectedFloorId('');
  }, [selectedBuildingId]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const selectedFloor = useMemo(() => 
    floors.find(f => f.id === selectedFloorId),
    [floors, selectedFloorId]
  );

  const selectedBuilding = useMemo(() =>
    buildings.find(b => b.id === selectedBuildingId),
    [buildings, selectedBuildingId]
  );

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <EditConflictWarning
          entityType="acoustic_floor"
          entityId={selectedFloorId || null}
          currentRevisionNumber={0}
          onReload={handleConflictReload}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Volume2 className="h-6 w-6" />
                Acoustic Floor Plan
              </h1>
              <p className="text-muted-foreground">
                Visualize NC levels across zones and identify acoustic hotspots
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {commissioningProject && exceedingZones.length > 0 && (
              <Button onClick={() => setShowCreateChecklistDialog(true)}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Create Commissioning Checklists
              </Button>
            )}
            
            {exceedingZones.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {exceedingZones.length} Zone{exceedingZones.length !== 1 ? 's' : ''} Exceeding NC
              </Badge>
            )}
          </div>
        </div>

        {/* Selectors */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Project
                </label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Building Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Building
                </label>
                <Select 
                  value={selectedBuildingId} 
                  onValueChange={setSelectedBuildingId}
                  disabled={!selectedProjectId || buildings.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Floor Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Floor
                </label>
                <Select 
                  value={selectedFloorId} 
                  onValueChange={setSelectedFloorId}
                  disabled={!selectedBuildingId || floors.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* No Selection State */}
        {!selectedFloorId && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Volume2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Select a Floor to View Acoustic Analysis</h3>
                <p className="text-sm max-w-md mx-auto">
                  Choose a project, building, and floor to visualize NC levels across zones.
                  Zones with terminal units will display estimated noise levels based on Saudi NC standards.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {selectedFloorId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heat Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Zone NC Levels</span>
                    {floorSummary.totalZones > 0 && (
                      <Badge variant="outline">
                        {floorSummary.totalZones} Zone{floorSummary.totalZones !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Click on a zone to view detailed acoustic analysis and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AcousticFloorPlanHeatMap 
                    zones={zones} 
                    floorName={selectedFloor?.name}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              <AcousticFloorSummary 
                summary={floorSummary}
                zones={zones}
                floorName={selectedFloor?.name}
                projectId={selectedProjectId}
              />

              {/* Problem Zones List */}
              {exceedingZones.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Zones Requiring Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {exceedingZones.map((zone) => (
                        <div 
                          key={zone.zoneId}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm">{zone.zoneName}</p>
                            <p className="text-xs text-muted-foreground">{zone.spaceType}</p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={zone.status === 'exceeds' ? 'destructive' : 'secondary'}
                              className="mb-1"
                            >
                              NC-{zone.estimatedNC}
                            </Badge>
                            <p className="text-xs text-destructive font-medium">
                              +{zone.ncDelta} dB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Saudi NC Standards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conference Room</span>
                      <span className="font-medium">NC-30</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Private Office</span>
                      <span className="font-medium">NC-35</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open Office</span>
                      <span className="font-medium">NC-40</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lobby / Corridor</span>
                      <span className="font-medium">NC-45</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Create Acoustic Checklists Dialog */}
      {commissioningProject && (
        <CreateAcousticChecklistDialog
          commissioningProjectId={commissioningProject.id}
          zones={zones}
          floorName={selectedFloor?.name}
          open={showCreateChecklistDialog}
          onOpenChange={setShowCreateChecklistDialog}
        />
      )}
    </DashboardLayout>
  );
}
