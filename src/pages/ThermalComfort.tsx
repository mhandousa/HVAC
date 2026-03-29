import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, FolderOpen, ThermometerSun, User, Wind, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { useProjects } from '@/hooks/useProjects';
import { useThermalComfortAnalyses, useCreateThermalComfortAnalysis, useDeleteThermalComfortAnalysis } from '@/hooks/useThermalComfortAnalyses';
import { SaveDesignDialog } from '@/components/design/SaveDesignDialog';
import { SavedConfigurationsList, type SavedConfiguration } from '@/components/design/SavedConfigurationsList';
import { useQueryClient } from '@tanstack/react-query';
import { 
  calculatePMV, 
  calculateAdaptiveComfort,
  calculateOperativeTemp,
  METABOLIC_RATES,
  CLOTHING_ENSEMBLES,
  type ThermalComfortInputs,
  type PMVResult,
  type AdaptiveComfortResult,
} from '@/lib/thermal-comfort-calculations';
import { toast } from 'sonner';

export default function ThermalComfort() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const [activeTab, setActiveTab] = useState('pmv');
  const [projectId, setProjectId] = useState<string | null>(searchParams.get('project') || storedProjectId);
  
  // Sync context when project changes
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);
  
  // Save/Load UI state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  
  // Data hooks
  const { data: savedAnalyses, isLoading: loadingSaved } = useThermalComfortAnalyses(projectId || undefined);
  const createAnalysis = useCreateThermalComfortAnalysis();
  const deleteAnalysis = useDeleteThermalComfortAnalysis();

  // Conflict detection
  const queryClient = useQueryClient();
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['thermal-comfort-analyses'] });
  };
  
  // Pre-save validation
  const { canSave, blockers, warnings } = usePreSaveValidation(projectId, 'thermal-comfort');
  
  // PMV Parameters
  const [airTempC, setAirTempC] = useState(24);
  const [meanRadiantTempC, setMeanRadiantTempC] = useState(24);
  const [relativeHumidity, setRelativeHumidity] = useState(50);
  const [airVelocity, setAirVelocity] = useState(0.1);
  const [metabolicRate, setMetabolicRate] = useState(1.2);
  const [clothingInsulation, setClothingInsulation] = useState(0.5);
  
  // Adaptive Parameters
  const [meanOutdoorTemp, setMeanOutdoorTemp] = useState(25);
  const [indoorOperativeTemp, setIndoorOperativeTemp] = useState(24);
  
  // PMV Calculation
  const pmvResult: PMVResult | null = useMemo(() => {
    return calculatePMV({
      airTemp_C: airTempC,
      meanRadiantTemp_C: meanRadiantTempC,
      relativeHumidity_percent: relativeHumidity,
      airVelocity_m_s: airVelocity,
      metabolicRate_met: metabolicRate,
      clothingInsulation_clo: clothingInsulation,
    });
  }, [airTempC, meanRadiantTempC, relativeHumidity, airVelocity, metabolicRate, clothingInsulation]);
  
  // Calculate operative temperature for adaptive comfort
  const operativeTemp = useMemo(() => {
    return calculateOperativeTemp(airTempC, meanRadiantTempC, airVelocity);
  }, [airTempC, meanRadiantTempC, airVelocity]);
  
  // Adaptive Comfort Calculation - uses 2 arguments (operative temp and outdoor temp)
  const adaptiveResult: AdaptiveComfortResult | null = useMemo(() => {
    return calculateAdaptiveComfort(indoorOperativeTemp, meanOutdoorTemp, '80%');
  }, [meanOutdoorTemp, indoorOperativeTemp]);
  
  // Transform saved analyses to SavedConfiguration format
  const savedConfigurations: SavedConfiguration[] = useMemo(() => {
    if (!savedAnalyses) return [];
    return savedAnalyses.map(analysis => ({
      id: analysis.id,
      name: analysis.analysis_name,
      projectId: analysis.project_id,
      projectName: projects?.find(p => p.id === analysis.project_id)?.name,
      status: analysis.status || undefined,
      createdAt: analysis.created_at,
      updatedAt: analysis.updated_at,
    }));
  }, [savedAnalyses, projects]);
  
  const handleSave = async (data: { name: string; projectId: string | null; notes: string }) => {
    await createAnalysis.mutateAsync({
      analysis_name: data.name,
      project_id: data.projectId,
      analysis_type: 'both',
      air_temp_c: airTempC,
      mean_radiant_temp_c: meanRadiantTempC,
      relative_humidity_percent: relativeHumidity,
      air_velocity_m_s: airVelocity,
      metabolic_rate_met: metabolicRate,
      clothing_insulation_clo: clothingInsulation,
      mean_outdoor_temp_c: meanOutdoorTemp,
      indoor_operative_temp_c: indoorOperativeTemp,
      pmv_result: pmvResult as any,
      adaptive_result: adaptiveResult as any,
      notes: data.notes,
    });
  };
  
  const handleLoadConfiguration = (id: string) => {
    const config = savedAnalyses?.find(a => a.id === id);
    if (!config) return;
    
    if (config.air_temp_c) setAirTempC(config.air_temp_c);
    if (config.mean_radiant_temp_c) setMeanRadiantTempC(config.mean_radiant_temp_c);
    if (config.relative_humidity_percent) setRelativeHumidity(config.relative_humidity_percent);
    if (config.air_velocity_m_s) setAirVelocity(config.air_velocity_m_s);
    if (config.metabolic_rate_met) setMetabolicRate(config.metabolic_rate_met);
    if (config.clothing_insulation_clo) setClothingInsulation(config.clothing_insulation_clo);
    if (config.mean_outdoor_temp_c) setMeanOutdoorTemp(config.mean_outdoor_temp_c);
    if (config.indoor_operative_temp_c) setIndoorOperativeTemp(config.indoor_operative_temp_c);
    if (config.project_id) setProjectId(config.project_id);
    
    setShowSavedList(false);
    toast.success('Analysis loaded');
  };
  
  const handleDeleteConfiguration = (id: string) => {
    deleteAnalysis.mutate(id);
  };
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  // Color based on PMV
  const getPMVColor = (pmv: number) => {
    const abs = Math.abs(pmv);
    if (abs <= 0.5) return 'text-green-500';
    if (abs <= 1) return 'text-yellow-500';
    if (abs <= 2) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getPPDColor = (ppd: number) => {
    if (ppd <= 10) return 'text-green-500';
    if (ppd <= 20) return 'text-yellow-500';
    if (ppd <= 40) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Get comfort category from PMV
  const getComfortCategory = (pmv: number): string => {
    const abs = Math.abs(pmv);
    if (abs <= 0.2) return 'A';
    if (abs <= 0.5) return 'B';
    if (abs <= 0.7) return 'C';
    return 'D';
  };
  
  const comfortCategory = pmvResult ? getComfortCategory(pmvResult.pmv) : null;
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumbs
              items={[
                { label: 'Design', href: '/design' },
                { label: 'Thermal Comfort Analysis' },
              ]}
            />
            <div className="flex items-center gap-3">
              <ThermometerSun className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold">Thermal Comfort Analysis</h1>
                <p className="text-muted-foreground">ASHRAE 55 PMV/PPD and Adaptive Comfort Model</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={projectId || ''} onValueChange={setProjectId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Link to project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Sheet open={showSavedList} onOpenChange={setShowSavedList}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Saved Analyses</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SavedConfigurationsList
                    title="Thermal Comfort Analyses"
                    configurations={savedConfigurations}
                    isLoading={loadingSaved}
                    onLoad={handleLoadConfiguration}
                    onDelete={handleDeleteConfiguration}
                    isDeleting={deleteAnalysis.isPending}
                    emptyMessage="No saved thermal comfort analyses"
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            <ActiveEditorsIndicator
              entityType="thermal_comfort"
              entityId={projectId || null}
              projectId={projectId || undefined}
            />
            <EditConflictWarning
              entityType="thermal_comfort"
              entityId={projectId}
              currentRevisionNumber={0}
              onReload={handleConflictReload}
            />
            
            <Button onClick={() => setShowSaveDialog(true)} disabled={!canSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        
        {/* Pre-Save Validation Alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-4" />
        
        {/* Save Dialog */}
        <SaveDesignDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          title="Save Thermal Comfort Analysis"
          description="Save this analysis for future reference"
          defaultName="Thermal Comfort Analysis"
          defaultProjectId={projectId}
          onSave={handleSave}
          isSaving={createAnalysis.isPending}
        />
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pmv" className="gap-2">
              <ThermometerSun className="h-4 w-4" />
              PMV/PPD Calculator
            </TabsTrigger>
            <TabsTrigger value="adaptive" className="gap-2">
              <Wind className="h-4 w-4" />
              Adaptive Comfort
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pmv" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Environment Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThermometerSun className="h-5 w-5" />
                    Environment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Air Temperature</Label>
                      <span className="text-sm font-medium">{airTempC}°C ({(airTempC * 9/5 + 32).toFixed(1)}°F)</span>
                    </div>
                    <Slider 
                      value={[airTempC]} 
                      onValueChange={([v]) => setAirTempC(v)}
                      min={15}
                      max={35}
                      step={0.5}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Mean Radiant Temp</Label>
                      <span className="text-sm font-medium">{meanRadiantTempC}°C</span>
                    </div>
                    <Slider 
                      value={[meanRadiantTempC]} 
                      onValueChange={([v]) => setMeanRadiantTempC(v)}
                      min={15}
                      max={40}
                      step={0.5}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Relative Humidity</Label>
                      <span className="text-sm font-medium">{relativeHumidity}%</span>
                    </div>
                    <Slider 
                      value={[relativeHumidity]} 
                      onValueChange={([v]) => setRelativeHumidity(v)}
                      min={20}
                      max={80}
                      step={5}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Air Velocity</Label>
                      <span className="text-sm font-medium">{airVelocity.toFixed(2)} m/s</span>
                    </div>
                    <Slider 
                      value={[airVelocity]} 
                      onValueChange={([v]) => setAirVelocity(v)}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Personal Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <Select 
                      value={metabolicRate.toString()} 
                      onValueChange={(v) => setMetabolicRate(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METABOLIC_RATES.map(m => (
                          <SelectItem key={m.id} value={m.met.toString()}>
                            {m.name} ({m.met} met)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Metabolic rate: {metabolicRate} met ({(metabolicRate * 58.2).toFixed(0)} W/m²)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Clothing</Label>
                    <Select 
                      value={clothingInsulation.toString()} 
                      onValueChange={(v) => setClothingInsulation(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLOTHING_ENSEMBLES.map(c => (
                          <SelectItem key={c.id} value={c.clo.toString()}>
                            {c.name} ({c.clo} clo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Clothing insulation: {clothingInsulation} clo ({(clothingInsulation * 0.155).toFixed(3)} m²K/W)
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Results */}
              <Card className={pmvResult && Math.abs(pmvResult.pmv) <= 0.5 ? 'border-green-500/30' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Comfort Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pmvResult && (
                    <>
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Predicted Mean Vote</p>
                        <p className={`text-5xl font-bold ${getPMVColor(pmvResult.pmv)}`}>
                          {pmvResult.pmv >= 0 ? '+' : ''}{pmvResult.pmv.toFixed(2)}
                        </p>
                        <Badge variant={comfortCategory === 'A' ? 'default' : 'secondary'}>
                          Category {comfortCategory}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>PMV Scale</span>
                          <span>Cold → Hot</span>
                        </div>
                        <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-500 to-red-500">
                          <div 
                            className="absolute top-0 w-2 h-full bg-foreground rounded"
                            style={{ left: `${((pmvResult.pmv + 3) / 6) * 100}%`, transform: 'translateX(-50%)' }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-3</span>
                          <span>0</span>
                          <span>+3</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">PPD (% Dissatisfied)</span>
                          <span className={`font-medium ${getPPDColor(pmvResult.ppd)}`}>
                            {pmvResult.ppd.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={pmvResult.ppd} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {pmvResult.ppd <= 10 ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Meets ASHRAE 55 comfort criteria (≤10%)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-3 w-3" />
                              Exceeds comfort threshold
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operative Temp</span>
                          <span>{operativeTemp.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Thermal Sensation</span>
                          <span>{pmvResult.thermalSensation}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Comfort Zone Info */}
            <Card>
              <CardHeader>
                <CardTitle>ASHRAE 55 Comfort Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                    <p className="font-semibold text-green-700 dark:text-green-300">Category A</p>
                    <p className="text-sm text-muted-foreground">PMV: -0.2 to +0.2</p>
                    <p className="text-sm text-muted-foreground">PPD &lt; 6%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-center">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-300">Category B</p>
                    <p className="text-sm text-muted-foreground">PMV: -0.5 to +0.5</p>
                    <p className="text-sm text-muted-foreground">PPD &lt; 10%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-center">
                    <p className="font-semibold text-orange-700 dark:text-orange-300">Category C</p>
                    <p className="text-sm text-muted-foreground">PMV: -0.7 to +0.7</p>
                    <p className="text-sm text-muted-foreground">PPD &lt; 15%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="adaptive" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Adaptive Comfort Model</CardTitle>
                  <CardDescription>
                    For naturally ventilated buildings where occupants can adapt clothing and open windows
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Prevailing Mean Outdoor Temp</Label>
                      <span className="text-sm font-medium">{meanOutdoorTemp}°C</span>
                    </div>
                    <Slider 
                      value={[meanOutdoorTemp]} 
                      onValueChange={([v]) => setMeanOutdoorTemp(v)}
                      min={10}
                      max={35}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Based on running mean of outdoor temps over past 7-30 days
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Indoor Operative Temp</Label>
                      <span className="text-sm font-medium">{indoorOperativeTemp}°C</span>
                    </div>
                    <Slider 
                      value={[indoorOperativeTemp]} 
                      onValueChange={([v]) => setIndoorOperativeTemp(v)}
                      min={18}
                      max={32}
                      step={0.5}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className={adaptiveResult?.withinComfortZone ? 'border-green-500/30' : ''}>
                <CardHeader>
                  <CardTitle>Adaptive Comfort Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adaptiveResult && (
                    <>
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Comfort Status</p>
                        <div className="flex items-center justify-center gap-2">
                          {adaptiveResult.withinComfortZone ? (
                            <>
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                              <span className="text-2xl font-bold text-green-500">Acceptable</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-8 w-8 text-red-500" />
                              <span className="text-2xl font-bold text-red-500">Outside Range</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Neutral Temp</span>
                          <span>{adaptiveResult.neutralTemp_C.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Comfort Range</span>
                          <span>{adaptiveResult.comfortRangeLower_C.toFixed(1)}°C - {adaptiveResult.comfortRangeUpper_C.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Indoor Temp</span>
                          <span className="font-medium">{indoorOperativeTemp}°C</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="text-muted-foreground">
                          Based on ASHRAE 55 adaptive model for naturally ventilated spaces.
                          Applicable when outdoor temp is 10-33.5°C.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep 
          currentPath="/design/thermal-comfort"
          projectId={projectId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
