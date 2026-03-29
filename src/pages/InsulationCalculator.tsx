import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useZoneContext } from '@/hooks/useZoneContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Snowflake,
  Loader2,
  Download,
  RotateCcw,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Info,
  MapPin,
  Save,
  FolderOpen,
} from 'lucide-react';
import { SaveInsulationDialog } from '@/components/design/SaveInsulationDialog';
import { LoadInsulationDialog } from '@/components/design/LoadInsulationDialog';
import { InsulationCalculation } from '@/hooks/useInsulationCalculations';
import { toast } from 'sonner';
import {
  INSULATION_MATERIALS,
  SAUDI_CLIMATE_DATA,
  SERVICE_TYPES,
  PIPE_SIZES,
  pipeOD,
  calculateDewPoint,
  getInsulationRecommendations,
  calculateDuctInsulation,
  getSBCMinRValue,
  InsulationRecommendation,
} from '@/lib/thermal-calculations';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useProjects } from '@/hooks/useProjects';

export default function InsulationCalculator() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  const { data: projects } = useProjects();
  const [activeTab, setActiveTab] = useState<'pipe' | 'duct'>('pipe');
  
  // Phase 17: Stage locking and validation
  const { canSave, isLocked } = useToolValidation(projectIdFromUrl || null, 'insulation', { checkStageLock: true });

  // Save/Load dialogs
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [loadedId, setLoadedId] = useState<string | undefined>();
  const [loadedName, setLoadedName] = useState<string | undefined>();
  const [loadedDescription, setLoadedDescription] = useState<string | undefined>();
  const [loadedProjectId, setLoadedProjectId] = useState<string | undefined>();
  const [loadedStatus, setLoadedStatus] = useState<'draft' | 'final' | undefined>();

  // Pipe inputs
  const [serviceType, setServiceType] = useState('chilled_water_supply');
  const [fluidTemp, setFluidTemp] = useState(6);
  const [pipeSize, setPipeSize] = useState(4);
  const [pipeLength, setPipeLength] = useState(100);

  // Duct inputs
  const [airTemp, setAirTemp] = useState(13);
  const [ductWidth, setDuctWidth] = useState(600);
  const [ductHeight, setDuctHeight] = useState(400);
  const [airVelocity, setAirVelocity] = useState(8);
  const [ductInsulationThickness, setDuctInsulationThickness] = useState(25);
  const [ductMaterial, setDuctMaterial] = useState('elastomeric_foam');

  // Common inputs
  const [location, setLocation] = useState('jeddah');
  const [customAmbientTemp, setCustomAmbientTemp] = useState<number | null>(null);
  const [customRH, setCustomRH] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Get climate data
  const climateData = useMemo(() => {
    return SAUDI_CLIMATE_DATA.find(c => c.id === location) || SAUDI_CLIMATE_DATA[1];
  }, [location]);

  const ambientTemp = customAmbientTemp ?? climateData.summerDB;
  const relativeHumidity = customRH ?? climateData.summerRH;
  const dewPoint = useMemo(() => calculateDewPoint(ambientTemp, relativeHumidity), [ambientTemp, relativeHumidity]);

  // Pipe insulation recommendations
  const pipeRecommendations = useMemo(() => {
    return getInsulationRecommendations({
      serviceTypeId: serviceType,
      fluidTempC: fluidTemp,
      ambientTempC: ambientTemp,
      relativeHumidity,
      pipeSizeInches: pipeSize,
      pipeLengthM: pipeLength,
    });
  }, [serviceType, fluidTemp, ambientTemp, relativeHumidity, pipeSize, pipeLength]);

  // Best recommendation (lowest energy cost that meets requirements)
  const bestRecommendation = useMemo(() => {
    const valid = pipeRecommendations.filter(r => r.meetsCondensation && r.meetsSBCCode);
    return valid.sort((a, b) => a.annualEnergyCostPerM - b.annualEnergyCostPerM)[0] || pipeRecommendations[0];
  }, [pipeRecommendations]);

  // Duct insulation results
  const ductResult = useMemo(() => {
    const material = INSULATION_MATERIALS.find(m => m.id === ductMaterial);
    if (!material) return null;
    return calculateDuctInsulation({
      airTempC: airTemp,
      ambientTempC: ambientTemp,
      relativeHumidity,
      ductWidthMm: ductWidth,
      ductHeightMm: ductHeight,
      airVelocityMps: airVelocity,
      kValueInsulation: material.kValue,
      insulationThicknessMm: ductInsulationThickness,
    });
  }, [airTemp, ambientTemp, relativeHumidity, ductWidth, ductHeight, airVelocity, ductMaterial, ductInsulationThickness]);

  const resetPipe = () => {
    setServiceType('chilled_water_supply');
    setFluidTemp(6);
    setPipeSize(4);
    setPipeLength(100);
    clearLoadedState();
    toast.success('Pipe calculator reset');
  };

  const resetDuct = () => {
    setAirTemp(13);
    setDuctWidth(600);
    setDuctHeight(400);
    setAirVelocity(8);
    setDuctInsulationThickness(25);
    setDuctMaterial('elastomeric_foam');
    clearLoadedState();
    toast.success('Duct calculator reset');
  };

  const clearLoadedState = () => {
    setLoadedId(undefined);
    setLoadedName(undefined);
    setLoadedDescription(undefined);
    setLoadedProjectId(undefined);
    setLoadedStatus(undefined);
  };

  const handleLoadCalculation = (calc: InsulationCalculation) => {
    setActiveTab(calc.calculation_type);
    setLocation(calc.location_id || 'jeddah');
    setCustomAmbientTemp(calc.ambient_temp_c);
    setCustomRH(calc.relative_humidity);

    if (calc.calculation_type === 'pipe') {
      setServiceType(calc.service_type || 'chilled_water_supply');
      setFluidTemp(calc.fluid_temp_c || 6);
      setPipeSize(calc.pipe_size_inches || 4);
      setPipeLength(calc.pipe_length_m || 100);
    } else {
      setAirTemp(calc.air_temp_c || 13);
      setDuctWidth(calc.duct_width_mm || 600);
      setDuctHeight(calc.duct_height_mm || 400);
      setAirVelocity(calc.air_velocity_mps || 8);
      setDuctInsulationThickness(calc.insulation_thickness_mm || 25);
      setDuctMaterial(calc.insulation_material || 'elastomeric_foam');
    }

    setLoadedId(calc.id);
    setLoadedName(calc.name);
    setLoadedDescription(calc.description || undefined);
    setLoadedProjectId(calc.project_id || undefined);
    setLoadedStatus(calc.status);

    toast.success(`Loaded: ${calc.name}`);
  };

  const exportResults = () => {
    const lines: string[] = [];
    lines.push('INSULATION CALCULATOR RESULTS');
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Location: ${climateData.name}`);
    lines.push('');
    lines.push('AMBIENT CONDITIONS');
    lines.push(`Dry-Bulb Temperature: ${ambientTemp}°C`);
    lines.push(`Relative Humidity: ${relativeHumidity}%`);
    lines.push(`Dew Point: ${dewPoint.toFixed(1)}°C`);
    lines.push('');

    if (activeTab === 'pipe') {
      const service = SERVICE_TYPES.find(s => s.id === serviceType);
      lines.push('PIPE INSULATION');
      lines.push(`Service: ${service?.name || serviceType}`);
      lines.push(`Fluid Temperature: ${fluidTemp}°C`);
      lines.push(`Pipe Size: ${pipeSize}" (OD: ${pipeOD(pipeSize).toFixed(1)}mm)`);
      lines.push(`Pipe Length: ${pipeLength}m`);
      lines.push(`SBC Min R-Value: ${getSBCMinRValue(serviceType)} m²·K/W`);
      lines.push('');
      lines.push('RECOMMENDATIONS');
      lines.push('Material,Thickness (mm),R-Value,Surface Temp (°C),Heat Gain (W/m),Annual Cost (SAR/m),Condensation,SBC Code');
      pipeRecommendations.forEach(r => {
        lines.push([
          r.materialName,
          r.standardThicknessMm,
          r.rValue.toFixed(2),
          r.surfaceTempC.toFixed(1),
          r.heatTransferWPerM.toFixed(2),
          r.annualEnergyCostPerM.toFixed(2),
          r.meetsCondensation ? 'OK' : 'RISK',
          r.meetsSBCCode ? 'OK' : 'FAIL',
        ].join(','));
      });
    } else {
      lines.push('DUCT INSULATION');
      lines.push(`Air Temperature: ${airTemp}°C`);
      lines.push(`Duct Size: ${ductWidth}mm x ${ductHeight}mm`);
      lines.push(`Air Velocity: ${airVelocity} m/s`);
      if (ductResult) {
        lines.push(`Insulation: ${ductInsulationThickness}mm`);
        lines.push(`R-Value: ${ductResult.rValue.toFixed(2)} m²·K/W`);
        lines.push(`Surface Temperature: ${ductResult.surfaceTempC.toFixed(1)}°C`);
        lines.push(`Heat Gain: ${ductResult.heatGainWPerM2.toFixed(2)} W/m²`);
        lines.push(`Temperature Rise: ${(ductResult.tempRisePerM * 10).toFixed(2)}°C per 10m`);
        lines.push(`Condensation Risk: ${ductResult.condensationRisk.toUpperCase()}`);
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insulation-${activeTab}-${location}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isColdService = fluidTemp < ambientTemp;
  const service = SERVICE_TYPES.find(s => s.id === serviceType);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Workflow Progress Bar */}
        {projectIdFromUrl && (
          <DesignWorkflowProgressBar
            projectId={projectIdFromUrl}
            variant="compact"
            showLabels={false}
            showPercentages={true}
            className="mb-2"
          />
        )}

        {/* Cross-Tool Validation Alert */}
        {projectIdFromUrl && (
          <CrossToolValidationAlert
            projectId={projectIdFromUrl}
            currentTool="insulation"
            variant="alert"
          className="mb-2"
        />
        )}
        
        {/* Phase 17: Unified Tool Header with Stage Locking */}
        <ToolPageHeader
          toolType="insulation"
          toolName="Insulation Calculator"
          projectId={projectIdFromUrl}
          showLockButton={true}
          showValidation={true}
        />

        {/* Phase 18: Edit Conflict Warning */}
        <EditConflictWarning
          entityType="insulation"
          entityId={loadedId || null}
          currentRevisionNumber={0}
          onReload={() => window.location.reload()}
        />

        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={projectIdFromUrl}
          currentTool="insulation-calculator"
          layout="grid"
          onImportDuctData={(data) => {
            toast.success(`Found ${data.systemCount} duct systems for insulation analysis`);
          }}
          onImportPipeData={(data) => {
            toast.success(`Found ${data.systemCount} pipe systems for insulation analysis`);
          }}
        />

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Snowflake className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Insulation Calculator</h1>
              <p className="text-muted-foreground">
                Calculate pipe and duct insulation for Saudi Arabia climate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator
              entityType="insulation_calculation"
              entityId={loadedId || null}
              projectId={projectIdFromUrl || undefined}
            />
            <Button variant="outline" onClick={() => setShowLoadDialog(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
              <Save className="w-4 h-4 mr-2" />
              {loadedId ? 'Update' : 'Save'}
            </Button>
            <Button variant="outline" onClick={activeTab === 'pipe' ? resetPipe : resetDuct}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={exportResults}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pipe' | 'duct')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pipe" className="gap-2">
              <Droplets className="w-4 h-4" />
              Pipe Insulation
            </TabsTrigger>
            <TabsTrigger value="duct" className="gap-2">
              <Wind className="w-4 h-4" />
              Duct Insulation
            </TabsTrigger>
          </TabsList>

          {/* Common Ambient Conditions Card */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ambient Conditions
              </CardTitle>
              <CardDescription>Select location or enter custom conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Location Preset</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAUDI_CLIMATE_DATA.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name} ({city.nameAr})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ambient Temp (°C)</Label>
                  <Input
                    type="number"
                    value={customAmbientTemp ?? climateData.summerDB}
                    onChange={(e) => setCustomAmbientTemp(e.target.value ? Number(e.target.value) : null)}
                    placeholder={climateData.summerDB.toString()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relative Humidity (%)</Label>
                  <Input
                    type="number"
                    value={customRH ?? climateData.summerRH}
                    onChange={(e) => setCustomRH(e.target.value ? Number(e.target.value) : null)}
                    placeholder={climateData.summerRH.toString()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dew Point (calculated)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                    <span className="font-medium">{dewPoint.toFixed(1)}°C</span>
                  </div>
                </div>
              </div>
              {climateData.climateZone === 'hot_humid' && (
                <Alert className="mt-4" variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>High Humidity Location</AlertTitle>
                  <AlertDescription>
                    {climateData.name} has high summer humidity ({climateData.summerRH}%). 
                    Vapor barrier is critical for cold services.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Pipe Insulation Tab */}
          <TabsContent value="pipe" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Operating Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operating Conditions</CardTitle>
                  <CardDescription>Enter pipe and fluid details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select value={serviceType} onValueChange={(v) => {
                      setServiceType(v);
                      const svc = SERVICE_TYPES.find(s => s.id === v);
                      if (svc) setFluidTemp(svc.typicalTemp);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map(svc => (
                          <SelectItem key={svc.id} value={svc.id}>
                            {svc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fluid Temperature (°C)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[fluidTemp]}
                        onValueChange={([v]) => setFluidTemp(v)}
                        min={service?.tempRange.min ?? -20}
                        max={service?.tempRange.max ?? 200}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={fluidTemp}
                        onChange={(e) => setFluidTemp(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pipe Size (inches)</Label>
                    <Select value={pipeSize.toString()} onValueChange={(v) => setPipeSize(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPE_SIZES.map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}" (OD: {pipeOD(size).toFixed(1)}mm)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pipe Length (m)</Label>
                    <Input
                      type="number"
                      value={pipeLength}
                      onChange={(e) => setPipeLength(Number(e.target.value))}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temperature Difference</span>
                      <span className="font-medium">{Math.abs(ambientTemp - fluidTemp).toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Category</span>
                      <Badge variant={isColdService ? 'default' : 'secondary'}>
                        {isColdService ? 'Cold' : 'Hot'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SBC Min R-Value</span>
                      <span className="font-medium">{getSBCMinRValue(serviceType)} m²·K/W</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Insulation */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Recommended Insulation</CardTitle>
                  <CardDescription>Optimal solution for condensation prevention and energy efficiency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bestRecommendation && (
                    <>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Recommended Material</p>
                            <p className="text-lg font-semibold">{bestRecommendation.materialName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Thickness</p>
                            <p className="text-3xl font-bold text-primary">{bestRecommendation.standardThicknessMm}mm</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary/20">
                          <div>
                            <p className="text-xs text-muted-foreground">R-Value</p>
                            <p className="font-medium">{bestRecommendation.rValue.toFixed(2)} m²·K/W</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Surface Temp</p>
                            <p className="font-medium">{bestRecommendation.surfaceTempC.toFixed(1)}°C</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Heat Gain</p>
                            <p className="font-medium">{Math.abs(bestRecommendation.heatTransferWPerM).toFixed(1)} W/m</p>
                          </div>
                        </div>
                      </div>

                      {/* Condensation Analysis */}
                      {isColdService && (
                        <div className="p-4 rounded-lg border">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Thermometer className="w-4 h-4" />
                            Condensation Analysis
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Ambient Temperature</span>
                              <span className="font-medium">{ambientTemp}°C</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Relative Humidity</span>
                              <span className="font-medium">{relativeHumidity}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Dew Point</span>
                              <span className="font-medium">{dewPoint.toFixed(1)}°C</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm">
                              <span>Min Surface Temp (incl. 2°C margin)</span>
                              <span className="font-medium">{(dewPoint + 2).toFixed(1)}°C</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Actual Surface Temp</span>
                              <span className={`font-medium ${bestRecommendation.meetsCondensation ? 'text-green-600' : 'text-red-600'}`}>
                                {bestRecommendation.surfaceTempC.toFixed(1)}°C
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {bestRecommendation.meetsCondensation ? (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  No Condensation Risk
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Condensation Risk
                                </Badge>
                              )}
                              {bestRecommendation.vaporBarrierRequired && (
                                <Badge variant="outline">Vapor Barrier Required</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Material Comparison Table */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Material Comparison</CardTitle>
                <CardDescription>Compare all insulation materials side-by-side</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-center">Thickness</TableHead>
                      <TableHead className="text-center">R-Value</TableHead>
                      <TableHead className="text-center">Surface Temp</TableHead>
                      <TableHead className="text-center">Heat Transfer</TableHead>
                      <TableHead className="text-center">Annual Cost</TableHead>
                      <TableHead className="text-center">Condensation</TableHead>
                      <TableHead className="text-center">SBC Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipeRecommendations.map((rec) => (
                      <TableRow key={rec.materialId} className={rec.materialId === bestRecommendation?.materialId ? 'bg-primary/5' : ''}>
                        <TableCell className="font-medium">{rec.materialName}</TableCell>
                        <TableCell className="text-center">{rec.standardThicknessMm}mm</TableCell>
                        <TableCell className="text-center">{rec.rValue.toFixed(2)}</TableCell>
                        <TableCell className="text-center">{rec.surfaceTempC.toFixed(1)}°C</TableCell>
                        <TableCell className="text-center">{Math.abs(rec.heatTransferWPerM).toFixed(1)} W/m</TableCell>
                        <TableCell className="text-center">{rec.annualEnergyCostPerM.toFixed(2)} SAR/m</TableCell>
                        <TableCell className="text-center">
                          {rec.meetsCondensation ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {rec.meetsSBCCode ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* SBC Compliance */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Saudi Building Code Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">SBC 601 R-Value</p>
                      <p className="text-muted-foreground">Min R-{getSBCMinRValue(serviceType)} for {service?.name}</p>
                    </div>
                  </div>
                  {isColdService && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Vapor Barrier</p>
                        <p className="text-muted-foreground">Required for all cold services below 15°C</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">SASO Certification</p>
                      <p className="text-muted-foreground">Verify material has SASO approval</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Duct Insulation Tab */}
          <TabsContent value="duct" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Duct Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Duct Conditions</CardTitle>
                  <CardDescription>Enter duct size and air conditions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Supply Air Temperature (°C)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[airTemp]}
                        onValueChange={([v]) => setAirTemp(v)}
                        min={10}
                        max={30}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={airTemp}
                        onChange={(e) => setAirTemp(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Width (mm)</Label>
                      <Input
                        type="number"
                        value={ductWidth}
                        onChange={(e) => setDuctWidth(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (mm)</Label>
                      <Input
                        type="number"
                        value={ductHeight}
                        onChange={(e) => setDuctHeight(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Air Velocity (m/s)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[airVelocity]}
                        onValueChange={([v]) => setAirVelocity(v)}
                        min={2}
                        max={15}
                        step={0.5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={airVelocity}
                        onChange={(e) => setAirVelocity(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Insulation Material</Label>
                    <Select value={ductMaterial} onValueChange={setDuctMaterial}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INSULATION_MATERIALS.filter(m => m.commonFor.includes('duct') || m.commonFor.includes('chilled_water')).map(mat => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Insulation Thickness (mm)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[ductInsulationThickness]}
                        onValueChange={([v]) => setDuctInsulationThickness(v)}
                        min={13}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={ductInsulationThickness}
                        onChange={(e) => setDuctInsulationThickness(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Duct Results */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Duct Insulation Analysis</CardTitle>
                  <CardDescription>Performance at selected insulation thickness</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ductResult && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm text-muted-foreground">R-Value</p>
                          <p className="text-2xl font-bold">{ductResult.rValue.toFixed(2)} m²·K/W</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm text-muted-foreground">Surface Temperature</p>
                          <p className="text-2xl font-bold">{ductResult.surfaceTempC.toFixed(1)}°C</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm text-muted-foreground">Heat Gain</p>
                          <p className="text-2xl font-bold">{ductResult.heatGainWPerM2.toFixed(1)} W/m²</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm text-muted-foreground">Temperature Rise</p>
                          <p className="text-2xl font-bold">{(ductResult.tempRisePerM * 10).toFixed(2)}°C <span className="text-sm font-normal">per 10m</span></p>
                        </div>
                      </div>

                      {/* Condensation Risk */}
                      <Alert variant={ductResult.condensationRisk === 'high' ? 'destructive' : ductResult.condensationRisk === 'medium' ? 'default' : 'default'}>
                        {ductResult.condensationRisk === 'high' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : ductResult.condensationRisk === 'medium' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          Condensation Risk: {ductResult.condensationRisk.charAt(0).toUpperCase() + ductResult.condensationRisk.slice(1)}
                        </AlertTitle>
                        <AlertDescription>
                          {ductResult.condensationRisk === 'high' && 'Surface temperature is below dew point. Increase insulation thickness or install vapor barrier.'}
                          {ductResult.condensationRisk === 'medium' && 'Surface temperature is close to dew point. Consider increasing insulation thickness.'}
                          {ductResult.condensationRisk === 'low' && 'Surface temperature is safely above dew point. No condensation expected.'}
                        </AlertDescription>
                      </Alert>

                      {/* Temperature Profile */}
                      <div className="p-4 rounded-lg border">
                        <h4 className="font-medium mb-3">Temperature Profile</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Supply Air → Dew Point → Ambient</span>
                            </div>
                            <div className="relative h-8 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500">
                              {/* Air temp marker */}
                              <div 
                                className="absolute top-0 h-full w-1 bg-blue-900 rounded"
                                style={{ left: `${((airTemp - 0) / (ambientTemp + 10)) * 100}%` }}
                              />
                              {/* Surface temp marker */}
                              <div 
                                className="absolute top-0 h-full w-1 bg-green-900 rounded"
                                style={{ left: `${((ductResult.surfaceTempC - 0) / (ambientTemp + 10)) * 100}%` }}
                              />
                              {/* Dew point marker */}
                              <div 
                                className="absolute top-0 h-full w-1 bg-yellow-400 rounded border border-yellow-600"
                                style={{ left: `${((dewPoint - 0) / (ambientTemp + 10)) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Air: {airTemp}°C</span>
                              <span>Dew: {dewPoint.toFixed(1)}°C</span>
                              <span>Surface: {ductResult.surfaceTempC.toFixed(1)}°C</span>
                              <span>Ambient: {ambientTemp}°C</span>
                            </div>
                          </div>
                        </div>
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
          currentPath="/design/insulation-calculator"
          projectId={searchParams.get('project') || undefined}
        />
      </div>

      {/* Save/Load Dialogs */}
      <SaveInsulationDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        calculationType={activeTab}
        locationId={location}
        ambientTempC={ambientTemp}
        relativeHumidity={relativeHumidity}
        dewPointC={dewPoint}
        serviceType={activeTab === 'pipe' ? serviceType : undefined}
        fluidTempC={activeTab === 'pipe' ? fluidTemp : undefined}
        pipeSizeInches={activeTab === 'pipe' ? pipeSize : undefined}
        pipeLengthM={activeTab === 'pipe' ? pipeLength : undefined}
        airTempC={activeTab === 'duct' ? airTemp : undefined}
        ductWidthMm={activeTab === 'duct' ? ductWidth : undefined}
        ductHeightMm={activeTab === 'duct' ? ductHeight : undefined}
        airVelocityMps={activeTab === 'duct' ? airVelocity : undefined}
        insulationMaterial={activeTab === 'duct' ? ductMaterial : bestRecommendation?.materialId}
        insulationThicknessMm={activeTab === 'duct' ? ductInsulationThickness : bestRecommendation?.standardThicknessMm}
        meetsCondensation={activeTab === 'pipe' ? bestRecommendation?.meetsCondensation : ductResult?.condensationRisk === 'low'}
        meetsSBCCode={activeTab === 'pipe' ? bestRecommendation?.meetsSBCCode : undefined}
        existingId={loadedId}
        existingName={loadedName}
        existingDescription={loadedDescription}
        existingProjectId={loadedProjectId}
        existingStatus={loadedStatus}
        onSaved={(id) => setLoadedId(id)}
      />

      <LoadInsulationDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadCalculation}
      />
    </DashboardLayout>
  );
}
