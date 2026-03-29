import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useLoadCalculationsWithZones } from '@/hooks/useLoadCalculationsWithZones';
import { useDuctSystems } from '@/hooks/useDuctSystems';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useTerminalUnitSelectionsByZone } from '@/hooks/useTerminalUnitSelections';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Wind,
  ChevronLeft,
  FolderKanban,
  MapPin,
  Plus,
  Trash2,
  Volume2,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Info,
  GitBranch,
  Download,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { SAUDI_NC_STANDARDS } from '@/hooks/useAcousticCalculator';
import { ThrowPatternVisualization, type ThrowPattern } from '@/components/diffuser/ThrowPatternVisualization';
import {
  DIFFUSER_TYPES,
  sizeDiffuser,
  calculateMultipleDiffusers,
  getRecommendedDiffuserTypes,
  type DiffuserSizingResult,
  type MultiDiffuserResult,
} from '@/lib/diffuser-calculations';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { ImportFromDuctSystemDialog } from '@/components/design/ImportFromDuctSystemDialog';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import {
  useCreateDiffuserGrille,
  useDiffuserGrillesByZone,
  useDeleteDiffuserGrille,
} from '@/hooks/useDiffuserGrilles';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ZoneSelection {
  zoneId: string;
  zoneName: string;
  floorName: string;
  buildingName: string;
  areaSqm: number;
  requiredCfm: number;
}

export default function DiffuserSelection() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence with full hierarchy
  const { 
    projectId: storedProjectId, 
    zoneId: storedZoneId, 
    setFullContext 
  } = useZoneContext();
  
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  const zoneIdFromUrl = searchParams.get('zone') || storedZoneId;

  const { data: projects } = useProjects();
  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);

  const { data: loadCalcs } = useLoadCalculationsWithZones(projectIdFromUrl || undefined);
  const { data: ductSystems } = useDuctSystems(projectIdFromUrl || undefined);

  // State
  const [selectedZone, setSelectedZone] = useState<ZoneSelection | null>(null);
  const [diffuserTypeId, setDiffuserTypeId] = useState('square-4way');
  const [ceilingHeight, setCeilingHeight] = useState(9);
  const [roomWidth, setRoomWidth] = useState(20);
  const [roomDepth, setRoomDepth] = useState(20);
  const [maxCfmPerDiffuser, setMaxCfmPerDiffuser] = useState(400);
  const [spaceType, setSpaceType] = useState('office');
  const [manualCfm, setManualCfm] = useState<number | null>(null);
  const [showDuctImportDialog, setShowDuctImportDialog] = useState(false);

  const createDiffuser = useCreateDiffuserGrille();
  const deleteDiffuser = useDeleteDiffuserGrille();
  const { data: existingDiffusers } = useDiffuserGrillesByZone(selectedZone?.zoneId);

  // Conflict detection
  const queryClient = useQueryClient();
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['diffuser-grilles', selectedZone?.zoneId] });
  };

  // Pre-Save Validation with stage locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    projectIdFromUrl || null,
    'diffuser-selection',
    { checkStageLock: true }
  );
  
  // Terminal unit data for cross-tool auto-population
  const { data: terminalUnits } = useTerminalUnitSelectionsByZone(selectedZone?.zoneId);
  const terminalUnitsCfm = useMemo(() => {
    if (!terminalUnits) return 0;
    return terminalUnits.reduce((sum, tu) => sum + (tu.supply_cfm || 0) * tu.quantity, 0);
  }, [terminalUnits]);

  // Get target NC from space type
  const targetNC = SAUDI_NC_STANDARDS[spaceType]?.nc || 40;
  
  // Handle importing CFM from terminal units
  const handleImportFromTerminalUnits = () => {
    if (terminalUnitsCfm > 0) {
      setManualCfm(terminalUnitsCfm);
      toast.success(`Imported ${terminalUnitsCfm.toLocaleString()} CFM from ${terminalUnits?.length || 0} terminal unit(s)`);
    }
  };

  // Get required CFM from load calculations or manual input
  const requiredCfm = useMemo(() => {
    if (manualCfm !== null) return manualCfm;
    if (selectedZone) {
      const loadCalc = loadCalcs?.find(lc => lc.zone_id === selectedZone.zoneId);
      if (loadCalc?.cfm_required) return loadCalc.cfm_required;
    }
    return 1000; // Default
  }, [selectedZone, loadCalcs, manualCfm]);

  // Calculate diffuser sizing
  const sizingResult = useMemo((): MultiDiffuserResult | null => {
    if (!requiredCfm) return null;
    
    return calculateMultipleDiffusers(
      requiredCfm,
      diffuserTypeId,
      ceilingHeight,
      roomDepth,
      roomWidth,
      targetNC,
      maxCfmPerDiffuser
    );
  }, [requiredCfm, diffuserTypeId, ceilingHeight, roomWidth, roomDepth, targetNC, maxCfmPerDiffuser]);

  // Get recommended diffuser types for space
  const recommendations = useMemo(() => getRecommendedDiffuserTypes(spaceType), [spaceType]);

  // Build zone options from load calculations
  const zoneOptions = useMemo(() => {
    if (!loadCalcs) return [];
    
    const options: ZoneSelection[] = loadCalcs
      .filter(lc => lc.zone_id)
      .map(lc => ({
        zoneId: lc.zone_id!,
        zoneName: lc.zone_name || lc.calculation_name,
        floorName: lc.floor_name || 'Unknown Floor',
        buildingName: lc.building_name || 'Unknown Building',
        areaSqm: lc.area_sqft ? lc.area_sqft * 0.0929 : 0,
        requiredCfm: lc.cfm_required || 0,
      }));
    return options;
  }, [loadCalcs]);

  // Sync zone context with full hierarchy when selections change
  useEffect(() => {
    if (projectIdFromUrl || selectedZone?.zoneId) {
      setFullContext(
        projectIdFromUrl || null, 
        null, // buildingId not tracked in this page's zone options
        null, // floorId not tracked in this page's zone options
        selectedZone?.zoneId || null, 
        { replace: true }
      );
    }
  }, [projectIdFromUrl, selectedZone?.zoneId, setFullContext]);

  // Set initial zone from URL
  useEffect(() => {
    if (zoneIdFromUrl && zoneOptions.length > 0 && !selectedZone) {
      const zone = zoneOptions.find(z => z.zoneId === zoneIdFromUrl);
      if (zone) setSelectedZone(zone);
    }
  }, [zoneIdFromUrl, zoneOptions, selectedZone]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (linkedProject) {
      items.push({ label: linkedProject.name, href: `/projects/${linkedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'Air Distribution' },
      { label: 'Diffuser/Grille Selection' }
    );
    return items;
  }, [linkedProject]);

  const handleBack = () => {
    if (projectIdFromUrl) {
      navigate(`/projects/${projectIdFromUrl}`);
    } else {
      navigate('/design');
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedZone || !sizingResult) {
      toast.error('Please select a zone and calculate sizing first');
      return;
    }

    // Find a duct system for this project to link to
    const ductSystem = ductSystems?.[0];
    if (!ductSystem) {
      toast.error('No duct system found. Please create a duct system first.');
      return;
    }

    try {
      await createDiffuser.mutateAsync({
        duct_system_id: ductSystem.id,
        zone_id: selectedZone.zoneId,
        terminal_type: diffuserTypeId.includes('return') ? 'return_grille' : 'supply_diffuser',
        style: diffuserTypeId,
        airflow_cfm: sizingResult.cfmEach,
        face_velocity_fpm: sizingResult.diffuserResult.faceVelocityFpm,
        neck_size: sizingResult.diffuserResult.size,
        pressure_drop_pa: sizingResult.diffuserResult.pressureDropInWg * 249, // Convert in.wg to Pa
        throw_distance_ft: sizingResult.diffuserResult.throwDistanceFt,
        noise_nc: sizingResult.diffuserResult.estimatedNC,
        quantity: sizingResult.quantity,
        location_description: `${selectedZone.buildingName} > ${selectedZone.floorName} > ${selectedZone.zoneName}`,
      });
    } catch (error) {
      console.error('Failed to save diffuser selection:', error);
    }
  };

  const handleDeleteDiffuser = async (id: string) => {
    try {
      await deleteDiffuser.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete diffuser:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedDiffuserType = DIFFUSER_TYPES.find(t => t.id === diffuserTypeId);
  const throwPattern: ThrowPattern = selectedDiffuserType?.pattern === 'radial' ? '4-way' : 
    (selectedDiffuserType?.pattern as ThrowPattern) || '4-way';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} className="mb-2" />

        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={projectIdFromUrl}
          currentTool="diffuser"
          variant="alert"
          className="mb-4"
        />

        {/* Project Context Banner */}
        {linkedProject && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <FolderKanban className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Linked to Project</p>
              <Link
                to={`/projects/${linkedProject.id}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {linkedProject.name}
              </Link>
            </div>
            {selectedZone && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {selectedZone.zoneName}
              </Badge>
            )}
            <Badge variant="outline">{linkedProject.status}</Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Diffuser/Grille Selection</h1>
            <p className="text-muted-foreground">
              Size and select supply diffusers and return grilles with throw pattern analysis
            </p>
          </div>
          <ActiveEditorsIndicator
            entityType="diffuser_selection"
            entityId={selectedZone?.zoneId || null}
            projectId={projectIdFromUrl || undefined}
          />
          <EditConflictWarning
            entityType="diffuser_selection"
            entityId={selectedZone?.zoneId || null}
            currentRevisionNumber={0}
            onReload={handleConflictReload}
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowDuctImportDialog(true)}
            disabled={!projectIdFromUrl}
          >
            <GitBranch className="w-4 h-4" />
            Import from Duct System
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/design/acoustic-calculator${projectIdFromUrl ? `?project=${projectIdFromUrl}` : ''}`)}
          >
            <Volume2 className="w-4 h-4" />
            Analyze Acoustics
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Terminal Unit Import Banner */}
        {selectedZone && terminalUnitsCfm > 0 && manualCfm === null && (
          <Alert className="border-chart-4/30 bg-chart-4/5">
            <Lightbulb className="h-4 w-4 text-chart-4" />
            <AlertTitle className="text-sm">Terminal Unit Data Available</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-xs">
                Import {terminalUnitsCfm.toLocaleString()} CFM from {terminalUnits?.length || 0} terminal unit(s) in this zone
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleImportFromTerminalUnits}
                className="ml-4"
              >
                <Download className="h-3 w-3 mr-1" />
                Import CFM
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wind className="w-4 h-4" />
                Selection Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zone Selection */}
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select
                  value={selectedZone?.zoneId || ''}
                  onValueChange={(id) => {
                    const zone = zoneOptions.find(z => z.zoneId === id);
                    setSelectedZone(zone || null);
                    if (zone) {
                      setManualCfm(null); // Reset manual CFM when zone changes
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneOptions.map((zone) => (
                      <SelectItem key={zone.zoneId} value={zone.zoneId}>
                        <span className="flex items-center gap-2">
                          <span>{zone.zoneName}</span>
                          {zone.requiredCfm > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({zone.requiredCfm} CFM)
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedZone && (
                  <p className="text-xs text-muted-foreground">
                    {selectedZone.buildingName} &gt; {selectedZone.floorName}
                  </p>
                )}
              </div>

              <Separator />

              {/* Space Type */}
              <div className="space-y-2">
                <Label>Space Type (for NC Target)</Label>
                <Select value={spaceType} onValueChange={setSpaceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAUDI_NC_STANDARDS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.description} (NC-{value.nc})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Diffuser Type */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Diffuser Type</Label>
                  {recommendations.primary.includes(diffuserTypeId) && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </div>
                <Select value={diffuserTypeId} onValueChange={setDiffuserTypeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFUSER_TYPES.filter(t => t.category === 'supply').map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className="flex items-center gap-2">
                          <span>{type.name}</span>
                          {recommendations.primary.includes(type.id) && (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDiffuserType && (
                  <p className="text-xs text-muted-foreground">
                    {selectedDiffuserType.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Required CFM */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Required Airflow (CFM)</Label>
                  {selectedZone?.requiredCfm ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs gap-1">
                          <Info className="w-3 h-3" />
                          From Load Calc
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Imported from zone load calculation
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                <Input
                  type="number"
                  value={manualCfm ?? requiredCfm}
                  onChange={(e) => setManualCfm(parseFloat(e.target.value) || null)}
                />
              </div>

              {/* Room Dimensions */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Width (ft)</Label>
                  <Input
                    type="number"
                    value={roomWidth}
                    onChange={(e) => setRoomWidth(parseFloat(e.target.value) || 20)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Depth (ft)</Label>
                  <Input
                    type="number"
                    value={roomDepth}
                    onChange={(e) => setRoomDepth(parseFloat(e.target.value) || 20)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ceiling (ft)</Label>
                  <Input
                    type="number"
                    value={ceilingHeight}
                    onChange={(e) => setCeilingHeight(parseFloat(e.target.value) || 9)}
                  />
                </div>
              </div>

              {/* Max CFM per Diffuser */}
              <div className="space-y-2">
                <Label>Max CFM per Diffuser</Label>
                <Input
                  type="number"
                  value={maxCfmPerDiffuser}
                  onChange={(e) => setMaxCfmPerDiffuser(parseFloat(e.target.value) || 400)}
                />
                <p className="text-xs text-muted-foreground">
                  Typical: 300-500 CFM for offices
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Sizing Results</CardTitle>
              <CardDescription>
                Calculated diffuser selection based on inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sizingResult ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="text-2xl font-bold">{sizingResult.quantity}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="text-2xl font-bold">{sizingResult.diffuserResult.size}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">CFM Each</p>
                      <p className="text-2xl font-bold">{sizingResult.cfmEach}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Spacing</p>
                      <p className="text-2xl font-bold">{sizingResult.recommendedSpacing} ft</p>
                    </div>
                  </div>

                  {/* Detailed Results Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Face Velocity</TableCell>
                        <TableCell className="text-right font-mono">
                          {sizingResult.diffuserResult.faceVelocityFpm} FPM
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sizingResult.diffuserResult.velocityStatus === 'good'
                                ? 'default'
                                : sizingResult.diffuserResult.velocityStatus === 'warning'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {sizingResult.diffuserResult.velocityStatus === 'good' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {sizingResult.diffuserResult.velocityStatus === 'warning' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {sizingResult.diffuserResult.velocityStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Throw Distance</TableCell>
                        <TableCell className="text-right font-mono">
                          {sizingResult.diffuserResult.throwDistanceFt} ft
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            to 50 FPM terminal velocity
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Drop Distance</TableCell>
                        <TableCell className="text-right font-mono">
                          {sizingResult.diffuserResult.dropDistanceFt.toFixed(1)} ft
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            below ceiling
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>NC Rating</TableCell>
                        <TableCell className="text-right font-mono">
                          NC-{sizingResult.diffuserResult.estimatedNC}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sizingResult.diffuserResult.meetsNCTarget ? 'default' : 'destructive'}>
                            {sizingResult.diffuserResult.meetsNCTarget ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Meets NC-{targetNC}
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Exceeds NC-{targetNC}
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Pressure Drop</TableCell>
                        <TableCell className="text-right font-mono">
                          {sizingResult.diffuserResult.pressureDropInWg} in. w.g.
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            per diffuser
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Throw Pattern Visualization */}
                  <div className="space-y-2">
                    <Label>Throw Pattern Visualization</Label>
                    <ThrowPatternVisualization
                      pattern={throwPattern}
                      throwDistanceFt={sizingResult.diffuserResult.throwDistanceFt}
                      roomWidthFt={roomWidth}
                      roomDepthFt={roomDepth}
                      ceilingHeightFt={ceilingHeight}
                      showIsotherms
                      showRoomBoundary
                      className="h-64"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={handleSaveSelection}
                      disabled={!selectedZone || createDiffuser.isPending}
                      className="gap-2"
                    >
                      {createDiffuser.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Save Selection to Zone
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Wind className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter parameters to calculate diffuser sizing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Existing Selections for Zone */}
        {selectedZone && existingDiffusers && existingDiffusers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved Selections for {selectedZone.zoneName}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">CFM</TableHead>
                    <TableHead className="text-right">NC</TableHead>
                    <TableHead className="text-right">Throw</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingDiffusers.map((diffuser) => (
                    <TableRow key={diffuser.id}>
                      <TableCell>
                        {DIFFUSER_TYPES.find(t => t.id === diffuser.style)?.name || diffuser.style}
                      </TableCell>
                      <TableCell>{diffuser.neck_size}</TableCell>
                      <TableCell className="text-right">{diffuser.quantity}</TableCell>
                      <TableCell className="text-right">{diffuser.airflow_cfm}</TableCell>
                      <TableCell className="text-right">NC-{diffuser.noise_nc}</TableCell>
                      <TableCell className="text-right">{diffuser.throw_distance_ft} ft</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDiffuser(diffuser.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Design Workflow Next Step */}
        <DesignWorkflowNextStep
          currentPath="/diffuser-selection"
          projectId={projectIdFromUrl}
          zoneId={zoneIdFromUrl}
          stageComplete={existingDiffusers && existingDiffusers.length > 0}
        />

        {/* Import from Duct System Dialog */}
        <ImportFromDuctSystemDialog
          open={showDuctImportDialog}
          onOpenChange={setShowDuctImportDialog}
          projectId={projectIdFromUrl || ''}
          onImport={async (segments) => {
            const ductSystem = ductSystems?.[0];
            if (!ductSystem) {
              toast.error('No duct system found');
              return;
            }
            let successCount = 0;
            for (const seg of segments) {
              try {
                await createDiffuser.mutateAsync({
                  duct_system_id: ductSystem.id,
                  zone_id: seg.zone_id,
                  terminal_type: 'supply_diffuser',
                  style: 'square-4way',
                  airflow_cfm: seg.cfm,
                  quantity: 1,
                  location_description: `From duct segment: ${seg.segment_name}`,
                });
                successCount++;
              } catch (e) {
                console.error('Failed to create diffuser:', e);
              }
            }
            toast.success(`Created ${successCount} diffuser(s)`);
            setShowDuctImportDialog(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
