import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  RefreshCw, 
  Download, 
  Wind, 
  Thermometer, 
  Droplets, 
  Zap,
  ArrowRight,
  TrendingUp,
  Info,
  Calculator,
  BarChart3,
  GitCompare,
  Award,
  Leaf,
  DollarSign,
  Clock,
  Wrench,
  Cloud,
  Save,
  FolderOpen,
  Building,
  Link2,
  ChevronLeft,
} from 'lucide-react';
import { useERVSizing, ERVType, ERV_TYPES, ERVInput } from '@/hooks/useERVSizing';
import { useSavedERVSizing, ERVCalculationWithSimulations } from '@/hooks/useSavedERVSizing';
import { 
  SAUDI_CLIMATE_PRESETS, 
  INDOOR_DESIGN_CONDITIONS,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
} from '@/lib/psychrometric-utils';
import { SAUDI_WEATHER_BINS, getERVRecommendation, ClimateZone } from '@/lib/saudi-weather-bins';
import { useERVEquipmentMatch } from '@/hooks/useERVEquipmentMatch';
import { ERVHRVComparison } from '@/components/design/ERVHRVComparison';
import { ERVMaintenanceDashboard } from '@/components/erv/ERVMaintenanceDashboard';
import { LiveWeatherCard } from '@/components/monitoring/LiveWeatherCard';
import { useWeatherAPI } from '@/hooks/useWeatherAPI';
import { useProjects } from '@/hooks/useProjects';
import { useZones } from '@/hooks/useZones';
import { SaveERVSizingDialog } from '@/components/design/SaveERVSizingDialog';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ZoneContextBanner } from '@/components/design/ZoneContextBanner';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { format } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceLine,
} from 'recharts';

export default function ERVSizing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { calculateERV, calculateAnnualSimulation, ERV_TYPES: ervTypes } = useERVSizing();
  const { data: projects } = useProjects();
  
  // Zone context persistence
  const { 
    projectId: storedProjectId, 
    zoneId: storedZoneId, 
    setContext 
  } = useZoneContext();
  
  // Project/Zone integration
  const preselectedProjectId = searchParams.get('project') || storedProjectId;
  const preselectedZoneId = searchParams.get('zone') || storedZoneId;
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(preselectedProjectId);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(preselectedZoneId);
  const { data: projectZones } = useZones(selectedProjectId || undefined);
  
  // Sync zone context when selections change
  useEffect(() => {
    if (selectedProjectId || selectedZoneId) {
      setContext(selectedProjectId, selectedZoneId, { replace: true });
    }
  }, [selectedProjectId, selectedZoneId, setContext]);

  // Pre-Save Validation with stage locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId || null,
    'erv-sizing',
    { checkStageLock: true }
  );
  
  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const { calculations: savedCalculations, isLoading: savedLoading } = useSavedERVSizing(selectedProjectId || undefined, selectedZoneId || undefined);
  
  // Main tab state
  const [mainTab, setMainTab] = useState('design');
  
  // Input state
  const [selectedCity, setSelectedCity] = useState('Riyadh');
  const [season, setSeason] = useState<'cooling' | 'heating'>('cooling');
  const [outdoorAirCfm, setOutdoorAirCfm] = useState(1500);
  const [ervType, setErvType] = useState<ERVType>('enthalpy_wheel');
  
  // Get ERV type config
  const ervTypeConfig = ervTypes.find(t => t.id === ervType);
  
  // Efficiency overrides
  const [sensibleEfficiency, setSensibleEfficiency] = useState(ervTypeConfig?.sensibleEfficiency.typical || 75);
  const [latentEfficiency, setLatentEfficiency] = useState(ervTypeConfig?.latentEfficiency.typical || 65);
  
  // Economics
  const [operatingHours, setOperatingHours] = useState(4380); // 12 hrs/day × 365
  const [electricityRate, setElectricityRate] = useState(0.18);
  const [coolingCOP, setCoolingCOP] = useState(3.5);
  const [heatingCOP, setHeatingCOP] = useState(3.0);
  
  // Annual simulation additional inputs
  const [ervPurchaseCost, setErvPurchaseCost] = useState(45000);
  const [installationCost, setInstallationCost] = useState(12000);
  const [maintenanceCostPerYear, setMaintenanceCostPerYear] = useState(2000);
  const [discountRate, setDiscountRate] = useState(5);
  
  // Custom conditions toggle
  const [useCustomConditions, setUseCustomConditions] = useState(false);
  const [customOutdoor, setCustomOutdoor] = useState({ dryBulbC: 46, rhPercent: 10 });
  const [customIndoor, setCustomIndoor] = useState({ dryBulbC: 24, rhPercent: 50 });
  
  // Live weather toggle
  const [useLiveWeather, setUseLiveWeather] = useState(false);
  const { weather, isLoading: weatherLoading, useLiveData } = useWeatherAPI(selectedCity, useLiveWeather);
  
  // Handle preselected project/zone from URL params
  useEffect(() => {
    if (preselectedProjectId) setSelectedProjectId(preselectedProjectId);
    if (preselectedZoneId) setSelectedZoneId(preselectedZoneId);
  }, [preselectedProjectId, preselectedZoneId]);
  
  // Load a saved calculation
  const handleLoadCalculation = (calc: ERVCalculationWithSimulations) => {
    if (calc.city) setSelectedCity(calc.city);
    if (calc.outdoor_air_cfm) setOutdoorAirCfm(calc.outdoor_air_cfm);
    if (calc.erv_type) setErvType(calc.erv_type as ERVType);
    if (calc.sensible_efficiency_percent) setSensibleEfficiency(calc.sensible_efficiency_percent);
    if (calc.latent_efficiency_percent) setLatentEfficiency(calc.latent_efficiency_percent);
    if (calc.operating_hours_per_year) setOperatingHours(calc.operating_hours_per_year);
    if (calc.electricity_rate_sar) setElectricityRate(calc.electricity_rate_sar);
    if (calc.cooling_cop) setCoolingCOP(calc.cooling_cop);
    if (calc.heating_cop) setHeatingCOP(calc.heating_cop);
    
    toast.success(`Loaded: ${calc.calculation_name}`);
  };
  
  // Get climate data
  const climatePreset = SAUDI_CLIMATE_PRESETS.find(c => c.name === selectedCity);
  
  // Determine outdoor conditions: Live weather > Custom > Preset
  const outdoorConditions = useMemo(() => {
    if (useLiveWeather && weather && !weatherLoading) {
      return { dryBulbC: weather.temperatureC, rhPercent: weather.humidity };
    }
    if (useCustomConditions) {
      return customOutdoor;
    }
    return (season === 'cooling' ? climatePreset?.summer : climatePreset?.winter) || { dryBulbC: 46, rhPercent: 10 };
  }, [useLiveWeather, weather, weatherLoading, useCustomConditions, customOutdoor, season, climatePreset]);
  
  const indoorConditions = useCustomConditions
    ? customIndoor
    : INDOOR_DESIGN_CONDITIONS[season];
  
  // Get city profile for annual simulation
  const cityProfile = SAUDI_WEATHER_BINS.find(c => c.name === selectedCity);
  const climateZone: ClimateZone = cityProfile?.climateZone || 'hot_dry';
  
  // Calculate ERV (design point)
  const ervInput: ERVInput = useMemo(() => ({
    outdoorAirCfm,
    outdoorConditions: {
      dryBulbF: celsiusToFahrenheit(outdoorConditions.dryBulbC),
      rhPercent: outdoorConditions.rhPercent,
    },
    indoorConditions: {
      dryBulbF: celsiusToFahrenheit(indoorConditions.dryBulbC),
      rhPercent: indoorConditions.rhPercent,
    },
    ervType,
    sensibleEfficiency,
    latentEfficiency: ervTypeConfig?.hasLatentRecovery ? latentEfficiency : 0,
    altitudeFt: (climatePreset?.altitude || 0) * 3.281,
    operatingHoursPerYear: operatingHours,
    electricityRateSAR: electricityRate,
    coolingCOP,
    heatingCOP,
  }), [
    outdoorAirCfm, outdoorConditions, indoorConditions, ervType,
    sensibleEfficiency, latentEfficiency, ervTypeConfig,
    climatePreset, operatingHours, electricityRate, coolingCOP, heatingCOP
  ]);
  
  const result = useMemo(() => calculateERV(ervInput), [ervInput, calculateERV]);
  
  // Calculate annual simulation
  const annualSimulation = useMemo(() => {
    return calculateAnnualSimulation({
      cityId: cityProfile?.cityId || 'riyadh',
      outdoorAirCfm,
      ervType,
      sensibleEfficiency,
      latentEfficiency: ervTypeConfig?.hasLatentRecovery ? latentEfficiency : 0,
      indoorDesignTempF: celsiusToFahrenheit(indoorConditions.dryBulbC),
      indoorDesignRH: indoorConditions.rhPercent,
      electricityRateSAR: electricityRate,
      coolingCOP,
      heatingCOP,
      ervPurchaseCostSAR: ervPurchaseCost,
      installationCostSAR: installationCost,
      maintenanceCostPerYear,
      discountRate,
    });
  }, [
    cityProfile, outdoorAirCfm, ervType, sensibleEfficiency, latentEfficiency,
    ervTypeConfig, indoorConditions, electricityRate, coolingCOP, heatingCOP,
    ervPurchaseCost, installationCost, maintenanceCostPerYear, discountRate,
    calculateAnnualSimulation
  ]);
  
  // Equipment matching
  const { matches: equipmentMatches, bestValue, bestPerformance } = useERVEquipmentMatch({
    airflowCfm: outdoorAirCfm,
    sensibleEfficiencyMin: sensibleEfficiency - 5,
    latentEfficiencyMin: ervTypeConfig?.hasLatentRecovery ? latentEfficiency - 5 : undefined,
    ervType,
    climateZone,
  });
  
  // Cumulative cash flow data for payback chart
  const cashFlowData = useMemo(() => {
    const data = [];
    const investment = annualSimulation.economics.totalInvestmentSAR;
    const annualSavings = annualSimulation.annualSummary.totalCostSavingsSAR - maintenanceCostPerYear;
    
    for (let year = 0; year <= 10; year++) {
      data.push({
        year,
        cashFlow: year === 0 ? -investment : annualSavings,
        cumulative: year === 0 ? -investment : -investment + annualSavings * year,
      });
    }
    return data;
  }, [annualSimulation, maintenanceCostPerYear]);
  
  // Update efficiencies when ERV type changes
  const handleErvTypeChange = (type: ERVType) => {
    setErvType(type);
    const config = ervTypes.find(t => t.id === type);
    if (config) {
      setSensibleEfficiency(config.sensibleEfficiency.typical);
      setLatentEfficiency(config.latentEfficiency.typical);
    }
  };
  
  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('ERV/HRV Sizing Report', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Location: ${selectedCity}`, 14, 36);
    doc.text(`Season: ${season}`, 14, 42);
    
    // Design conditions
    autoTable(doc, {
      startY: 50,
      head: [['Condition', 'Outdoor', 'Indoor', 'Difference']],
      body: [
        ['Dry Bulb (°F)', result.outdoorAir.dryBulb.toFixed(1), result.returnAir.dryBulb.toFixed(1), Math.abs(result.outdoorAir.dryBulb - result.returnAir.dryBulb).toFixed(1)],
        ['Wet Bulb (°F)', result.outdoorAir.wetBulb.toFixed(1), result.returnAir.wetBulb.toFixed(1), Math.abs(result.outdoorAir.wetBulb - result.returnAir.wetBulb).toFixed(1)],
        ['RH (%)', result.outdoorAir.rh.toFixed(0), result.returnAir.rh.toFixed(0), '—'],
        ['Enthalpy (BTU/lb)', result.outdoorAir.enthalpy.toFixed(2), result.returnAir.enthalpy.toFixed(2), Math.abs(result.outdoorAir.enthalpy - result.returnAir.enthalpy).toFixed(2)],
      ],
    });
    
    // ERV configuration
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['ERV Configuration', 'Value']],
      body: [
        ['ERV Type', ervTypeConfig?.name || ervType],
        ['Outdoor Air CFM', outdoorAirCfm.toLocaleString()],
        ['Sensible Effectiveness', `${sensibleEfficiency}%`],
        ['Latent Effectiveness', `${latentEfficiency}%`],
      ],
    });
    
    // Heat recovery results
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Heat Recovery', 'Without ERV', 'With ERV', 'Savings']],
      body: [
        [
          'Sensible (BTU/h)',
          result.ventilationLoadWithoutERV.sensible.toLocaleString(),
          result.ventilationLoadWithERV.sensible.toLocaleString(),
          `${result.loadReduction.sensible.toLocaleString()} (${result.loadReduction.percentSensible.toFixed(0)}%)`
        ],
        [
          'Latent (BTU/h)',
          result.ventilationLoadWithoutERV.latent.toLocaleString(),
          result.ventilationLoadWithERV.latent.toLocaleString(),
          `${result.loadReduction.latent.toLocaleString()} (${result.loadReduction.percentLatent.toFixed(0)}%)`
        ],
        [
          'Total (BTU/h)',
          result.ventilationLoadWithoutERV.total.toLocaleString(),
          result.ventilationLoadWithERV.total.toLocaleString(),
          `${result.loadReduction.total.toLocaleString()} (${result.loadReduction.percentTotal.toFixed(0)}%)`
        ],
      ],
    });
    
    // Annual savings
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Annual Savings', 'Value']],
      body: [
        ['Energy Savings (kWh)', result.annualEnergySavings.totalKWh.toLocaleString()],
        ['Cost Savings (SAR)', result.annualCostSavings.toLocaleString()],
        ['Operating Hours', `${operatingHours.toLocaleString()} hrs/year`],
      ],
    });
    
    doc.save(`ERV-Sizing-${selectedCity}-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  
  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (selectedProject) {
      items.push({ label: selectedProject.name, href: `/projects/${selectedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'Core Calculations' },
      { label: 'ERV/HRV Sizing' }
    );
    return items;
  }, [selectedProject]);

  const handleBack = () => {
    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}`);
    } else {
      navigate('/design');
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} className="mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <RefreshCw className="h-8 w-8 text-primary" />
                ERV/HRV Sizing Calculator
              </h1>
              <p className="text-muted-foreground mt-1">
                Energy Recovery Ventilator sizing with sensible and latent heat recovery analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator
              entityType="erv_sizing"
              entityId={selectedZoneId || null}
              projectId={selectedProjectId || undefined}
            />
            <Button variant="outline" onClick={() => setSaveDialogOpen(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!savedCalculations?.length}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load ({savedCalculations?.length || 0})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {savedCalculations?.map((calc) => (
                  <DropdownMenuItem key={calc.id} onClick={() => handleLoadCalculation(calc)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{calc.calculation_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {calc.city} · {calc.erv_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Workflow Progress Bar */}
        {selectedProjectId && (
          <DesignWorkflowProgressBar
            projectId={selectedProjectId}
            variant="compact"
            showLabels={false}
            showPercentages={true}
            className="mb-2"
          />
        )}

        {/* Zone Context Banner */}
        {selectedProjectId && selectedZoneId && (
          <ZoneContextBanner
            compact
          />
        )}

        {/* Data Flow Suggestions */}
        {selectedProjectId && (
          <DataFlowSuggestions
            projectId={selectedProjectId}
            currentTool="erv-sizing"
            variant="alert"
            className="mb-2"
          />
        )}

        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={selectedProjectId}
          zoneId={selectedZoneId}
          currentTool="erv-sizing"
          layout="grid"
          onImportVentilationData={(data) => {
            setOutdoorAirCfm(data.totalOutdoorAirCfm);
            toast.success(`Imported ventilation: ${data.totalOutdoorAirCfm} CFM outdoor air`);
          }}
        />

        {/* Cross-Tool Validation Alert */}
        {selectedProjectId && (
          <CrossToolValidationAlert
            projectId={selectedProjectId}
            currentTool="erv"
            variant="alert"
            className="mb-2"
          />
        )}

        {/* Project Integration Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Project Integration
            </CardTitle>
            <CardDescription>
              Link this ERV calculation to a project/zone for design completeness tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project (optional)</Label>
                <Select value={selectedProjectId || ""} onValueChange={(v) => setSelectedProjectId(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zone (optional)</Label>
                <Select 
                  value={selectedZoneId || ""} 
                  onValueChange={(v) => setSelectedZoneId(v || null)}
                  disabled={!selectedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProjectId ? "Select a zone..." : "Select project first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projectZones?.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(selectedProjectId || selectedZoneId) && (
              <p className="text-xs text-muted-foreground mt-3">
                <Building className="inline h-3 w-3 mr-1" />
                Saving will link this calculation to the selected project/zone for design completeness tracking
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="design" className="gap-2">
              <Calculator className="h-4 w-4" />
              Design Point
            </TabsTrigger>
            <TabsTrigger value="simulation" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Annual Simulation
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Compare ERV/HRV
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
          </TabsList>
          
          {/* Design Point Tab */}
          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Panel */}
              <div className="space-y-6">
                {/* Climate & Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5" />
                      Climate & Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Location</Label>
                        <Select value={selectedCity} onValueChange={setSelectedCity} disabled={useCustomConditions}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SAUDI_CLIMATE_PRESETS.map(city => (
                              <SelectItem key={city.name} value={city.name}>
                                {city.name} ({city.nameAr})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Season</Label>
                        <Select value={season} onValueChange={(v) => setSeason(v as 'cooling' | 'heating')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cooling">Cooling (Summer)</SelectItem>
                            <SelectItem value="heating">Heating (Winter)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Live Weather Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-muted-foreground" />
                        <Label>Use Live Weather</Label>
                      </div>
                      <Switch 
                        checked={useLiveWeather} 
                        onCheckedChange={setUseLiveWeather}
                        disabled={useCustomConditions}
                      />
                    </div>
                    
                    {useLiveWeather && (
                      <LiveWeatherCard city={selectedCity} compact showToggle={false} />
                    )}
                    
                    {!useLiveWeather && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Custom Conditions</Label>
                          <Switch 
                            checked={useCustomConditions} 
                            onCheckedChange={setUseCustomConditions}
                          />
                        </div>
                        
                        {useCustomConditions ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Outdoor</Label>
                              <Input
                                type="number"
                                placeholder="Dry Bulb °C"
                                value={customOutdoor.dryBulbC}
                                onChange={(e) => setCustomOutdoor(p => ({ ...p, dryBulbC: Number(e.target.value) }))}
                              />
                              <Input
                                type="number"
                                placeholder="RH %"
                                value={customOutdoor.rhPercent}
                                onChange={(e) => setCustomOutdoor(p => ({ ...p, rhPercent: Number(e.target.value) }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Indoor</Label>
                              <Input
                                type="number"
                                placeholder="Dry Bulb °C"
                                value={customIndoor.dryBulbC}
                                onChange={(e) => setCustomIndoor(p => ({ ...p, dryBulbC: Number(e.target.value) }))}
                              />
                              <Input
                                type="number"
                                placeholder="RH %"
                                value={customIndoor.rhPercent}
                                onChange={(e) => setCustomIndoor(p => ({ ...p, rhPercent: Number(e.target.value) }))}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg text-sm">
                            <div>
                              <p className="font-medium">Outdoor</p>
                              <p>{outdoorConditions.dryBulbC}°C ({celsiusToFahrenheit(outdoorConditions.dryBulbC).toFixed(0)}°F)</p>
                              <p>RH: {outdoorConditions.rhPercent}%</p>
                            </div>
                            <div>
                              <p className="font-medium">Indoor</p>
                              <p>{indoorConditions.dryBulbC}°C ({celsiusToFahrenheit(indoorConditions.dryBulbC).toFixed(0)}°F)</p>
                              <p>RH: {indoorConditions.rhPercent}%</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
                
                {/* ERV Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      ERV Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Outdoor Air (CFM)</Label>
                      <Input
                        type="number"
                        value={outdoorAirCfm}
                        onChange={(e) => setOutdoorAirCfm(Number(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label>ERV Type</Label>
                      <Select value={ervType} onValueChange={(v) => handleErvTypeChange(v as ERVType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ervTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">{ervTypeConfig?.description}</p>
                    </div>
                    
                    <div>
                      <Label>Sensible Effectiveness (%)</Label>
                      <Input
                        type="number"
                        min={ervTypeConfig?.sensibleEfficiency.min || 40}
                        max={ervTypeConfig?.sensibleEfficiency.max || 90}
                        value={sensibleEfficiency}
                        onChange={(e) => setSensibleEfficiency(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Range: {ervTypeConfig?.sensibleEfficiency.min}-{ervTypeConfig?.sensibleEfficiency.max}%
                      </p>
                    </div>
                    
                    {ervTypeConfig?.hasLatentRecovery && (
                      <div>
                        <Label>Latent Effectiveness (%)</Label>
                        <Input
                          type="number"
                          min={ervTypeConfig.latentEfficiency.min}
                          max={ervTypeConfig.latentEfficiency.max}
                          value={latentEfficiency}
                          onChange={(e) => setLatentEfficiency(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Range: {ervTypeConfig.latentEfficiency.min}-{ervTypeConfig.latentEfficiency.max}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Economics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Economics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Operating Hours/Year</Label>
                      <Input
                        type="number"
                        value={operatingHours}
                        onChange={(e) => setOperatingHours(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Electricity Rate (SAR/kWh)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={electricityRate}
                        onChange={(e) => setElectricityRate(Number(e.target.value))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cooling COP</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={coolingCOP}
                          onChange={(e) => setCoolingCOP(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Heating COP</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={heatingCOP}
                          onChange={(e) => setHeatingCOP(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Results Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Air State Flow Diagram */}
                <Card>
                  <CardHeader>
                    <CardTitle>Air State Process</CardTitle>
                    <CardDescription>Psychrometric conditions through the ERV</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 items-center">
                      {/* Outdoor Air */}
                      <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center border border-red-200 dark:border-red-800">
                        <p className="text-xs text-muted-foreground mb-1">Outdoor Air</p>
                        <p className="text-2xl font-bold text-red-600">{result.outdoorAir.dryBulb.toFixed(0)}°F</p>
                        <p className="text-xs">{fahrenheitToCelsius(result.outdoorAir.dryBulb).toFixed(0)}°C</p>
                        <p className="text-xs mt-1">RH: {result.outdoorAir.rh.toFixed(0)}%</p>
                        <p className="text-xs">h: {result.outdoorAir.enthalpy.toFixed(1)} BTU/lb</p>
                      </div>
                      
                      {/* Arrow + ERV */}
                      <div className="flex flex-col items-center">
                        <div className="p-2 bg-primary/10 rounded-full mb-2">
                          <RefreshCw className="h-6 w-6 text-primary" />
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-1">ERV</p>
                      </div>
                      
                      {/* Supply Air */}
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-muted-foreground mb-1">Supply Air</p>
                        <p className="text-2xl font-bold text-yellow-600">{result.supplyAir.dryBulb.toFixed(0)}°F</p>
                        <p className="text-xs">{fahrenheitToCelsius(result.supplyAir.dryBulb).toFixed(0)}°C</p>
                        <p className="text-xs mt-1">Pre-conditioned</p>
                        <p className="text-xs">h: {result.supplyAir.enthalpy.toFixed(1)} BTU/lb</p>
                      </div>
                      
                      {/* Return/Indoor */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-muted-foreground mb-1">Return Air</p>
                        <p className="text-2xl font-bold text-blue-600">{result.returnAir.dryBulb.toFixed(0)}°F</p>
                        <p className="text-xs">{fahrenheitToCelsius(result.returnAir.dryBulb).toFixed(0)}°C</p>
                        <p className="text-xs mt-1">RH: {result.returnAir.rh.toFixed(0)}%</p>
                        <p className="text-xs">h: {result.returnAir.enthalpy.toFixed(1)} BTU/lb</p>
                      </div>
                    </div>
                    
                    {!result.isRecoveryBeneficial && (
                      <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Low temperature/enthalpy difference. ERV may not provide significant benefits under these conditions.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                {/* Heat Recovery Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Heat Recovery Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-right">Without ERV</TableHead>
                          <TableHead className="text-right">With ERV</TableHead>
                          <TableHead className="text-right">Savings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Sensible Load (BTU/h)</TableCell>
                          <TableCell className="text-right font-mono">
                            {Math.round(result.ventilationLoadWithoutERV.sensible).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Math.round(result.ventilationLoadWithERV.sensible).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-medium">
                              {Math.round(result.loadReduction.sensible).toLocaleString()}
                            </span>
                            <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                              {result.loadReduction.percentSensible.toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Latent Load (BTU/h)</TableCell>
                          <TableCell className="text-right font-mono">
                            {Math.round(result.ventilationLoadWithoutERV.latent).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Math.round(result.ventilationLoadWithERV.latent).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-medium">
                              {Math.round(result.loadReduction.latent).toLocaleString()}
                            </span>
                            <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                              {result.loadReduction.percentLatent.toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell>Total Load (BTU/h)</TableCell>
                          <TableCell className="text-right font-mono">
                            {Math.round(result.ventilationLoadWithoutERV.total).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Math.round(result.ventilationLoadWithERV.total).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-bold">
                              {Math.round(result.loadReduction.total).toLocaleString()}
                            </span>
                            <Badge className="ml-2 bg-green-600">
                              {result.loadReduction.percentTotal.toFixed(0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {/* Annual Savings & Sizing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Annual Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span>Energy Saved</span>
                        <span className="text-xl font-bold">
                          {Math.round(result.annualEnergySavings.totalKWh).toLocaleString()} kWh
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="font-medium">Cost Savings</span>
                        <span className="text-2xl font-bold text-green-600">
                          SAR {Math.round(result.annualCostSavings).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Based on {operatingHours.toLocaleString()} operating hours/year @ {electricityRate} SAR/kWh
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wind className="h-5 w-5" />
                        Sizing Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Recommended Size</span>
                        <span className="font-bold">{result.recommendedAirflow.toLocaleString()} CFM</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span>Face Velocity</span>
                        <span className="font-mono">{result.faceVelocity} FPM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Est. Pressure Drop</span>
                        <span className="font-mono">{result.estimatedPressureDrop.toFixed(2)} in. W.G.</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Operating Mode</span>
                        <Badge variant={result.mode === 'cooling' ? 'default' : 'secondary'}>
                          {result.mode}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Equipment Recommendations */}
                {(bestValue || bestPerformance) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Recommended Equipment
                      </CardTitle>
                      <CardDescription>
                        Based on {outdoorAirCfm.toLocaleString()} CFM, {sensibleEfficiency}% sensible efficiency
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bestValue && (
                          <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-600">Best Value</Badge>
                            </div>
                            <h4 className="font-bold">{bestValue.manufacturer} {bestValue.modelNumber}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              ERV Unit • {bestValue.airflowCfm.toLocaleString()} CFM
                            </p>
                            <div className="mt-2 text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Sensible Eff.</span>
                                <span className="font-medium">{bestValue.sensibleEfficiency}%</span>
                              </div>
                              {bestValue.latentEfficiency && bestValue.latentEfficiency > 0 && (
                                <div className="flex justify-between">
                                  <span>Latent Eff.</span>
                                  <span className="font-medium">{bestValue.latentEfficiency}%</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Price</span>
                                <span className="font-medium">SAR {bestValue.priceSAR?.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between text-sm">
                                <span>Est. Payback</span>
                                <span className="font-bold text-green-600">{bestValue.paybackYears.toFixed(1)} years</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {bestPerformance && bestPerformance.modelNumber !== bestValue?.modelNumber && (
                          <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-600">Best Performance</Badge>
                            </div>
                            <h4 className="font-bold">{bestPerformance.manufacturer} {bestPerformance.modelNumber}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              ERV Unit • {bestPerformance.airflowCfm.toLocaleString()} CFM
                            </p>
                            <div className="mt-2 text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Sensible Eff.</span>
                                <span className="font-medium">{bestPerformance.sensibleEfficiency}%</span>
                              </div>
                              {bestPerformance.latentEfficiency && bestPerformance.latentEfficiency > 0 && (
                                <div className="flex justify-between">
                                  <span>Latent Eff.</span>
                                  <span className="font-medium">{bestPerformance.latentEfficiency}%</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Price</span>
                                <span className="font-medium">SAR {bestPerformance.priceSAR?.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between text-sm">
                                <span>Est. Payback</span>
                                <span className="font-bold text-blue-600">{bestPerformance.paybackYears.toFixed(1)} years</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {equipmentMatches.length > 2 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          + {equipmentMatches.length - 2} more matching units available
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* ERV Type Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>ERV Type Comparison</CardTitle>
                    <CardDescription>Compare different energy recovery technologies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">Sensible Eff.</TableHead>
                          <TableHead className="text-center">Latent Eff.</TableHead>
                          <TableHead className="text-center">Pressure Drop</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ERV_TYPES.map(type => (
                          <TableRow 
                            key={type.id} 
                            className={type.id === ervType ? 'bg-primary/5' : ''}
                          >
                            <TableCell className="font-medium">
                              {type.name}
                              {type.id === ervType && (
                                <Badge variant="outline" className="ml-2">Selected</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.sensibleEfficiency.min}-{type.sensibleEfficiency.max}%
                            </TableCell>
                            <TableCell className="text-center">
                              {type.hasLatentRecovery 
                                ? `${type.latentEfficiency.min}-${type.latentEfficiency.max}%`
                                : '—'
                              }
                            </TableCell>
                            <TableCell className="text-center">
                              {type.pressureDrop.min}-{type.pressureDrop.max}" WG
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {type.description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Annual Simulation Tab */}
          <TabsContent value="simulation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Investment Inputs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Investment Inputs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>ERV Purchase Cost (SAR)</Label>
                    <Input
                      type="number"
                      value={ervPurchaseCost}
                      onChange={(e) => setErvPurchaseCost(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Installation Cost (SAR)</Label>
                    <Input
                      type="number"
                      value={installationCost}
                      onChange={(e) => setInstallationCost(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Annual Maintenance (SAR)</Label>
                    <Input
                      type="number"
                      value={maintenanceCostPerYear}
                      onChange={(e) => setMaintenanceCostPerYear(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Discount Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(Number(e.target.value))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium mb-2">Configuration</p>
                    <p>City: {selectedCity}</p>
                    <p>Climate: {climateZone.replace('_', '-')}</p>
                    <p>Airflow: {outdoorAirCfm.toLocaleString()} CFM</p>
                    <p>ERV Type: {ervTypeConfig?.name}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Results Summary */}
              <div className="lg:col-span-3 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Annual Savings</p>
                          <p className="text-2xl font-bold text-green-600">
                            SAR {annualSimulation.annualSummary.totalCostSavingsSAR.toLocaleString()}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600/20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Simple Payback</p>
                          <p className="text-2xl font-bold">
                            {annualSimulation.economics.simplePaybackYears} yrs
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">NPV (10 yr)</p>
                          <p className="text-2xl font-bold text-primary">
                            SAR {annualSimulation.economics.npv10Year.toLocaleString()}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-primary/20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">CO₂ Reduction</p>
                          <p className="text-2xl font-bold text-green-600">
                            {(annualSimulation.annualSummary.carbonReductionKg / 1000).toFixed(1)} t
                          </p>
                        </div>
                        <Leaf className="h-8 w-8 text-green-600/20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Monthly Energy Savings Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Energy Savings</CardTitle>
                    <CardDescription>
                      Cooling and heating energy recovery throughout the year
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={annualSimulation.monthlyBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="month" className="text-muted-foreground" />
                          <YAxis className="text-muted-foreground" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`${value.toLocaleString()} kWh`, '']}
                          />
                          <Legend />
                          <Bar 
                            dataKey="coolingRecoveryKWh" 
                            name="Cooling Recovery" 
                            fill="hsl(var(--primary))" 
                            stackId="a"
                          />
                          <Bar 
                            dataKey="heatingRecoveryKWh" 
                            name="Heating Recovery" 
                            fill="hsl(var(--warning))" 
                            stackId="a"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Payback Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cumulative Cash Flow</CardTitle>
                      <CardDescription>Investment payback over 10 years</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={cashFlowData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="year" className="text-muted-foreground" />
                            <YAxis className="text-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [`SAR ${value.toLocaleString()}`, '']}
                            />
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                            <Area 
                              type="monotone" 
                              dataKey="cumulative" 
                              fill="hsl(var(--primary)/0.2)" 
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Economic Analysis</CardTitle>
                      <CardDescription>Investment returns and sensitivity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Total Investment</TableCell>
                            <TableCell className="text-right">
                              SAR {annualSimulation.economics.totalInvestmentSAR.toLocaleString()}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Simple Payback</TableCell>
                            <TableCell className="text-right font-bold">
                              {annualSimulation.economics.simplePaybackYears} years
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">NPV (10 year)</TableCell>
                            <TableCell className="text-right text-green-600 font-bold">
                              SAR {annualSimulation.economics.npv10Year.toLocaleString()}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">IRR</TableCell>
                            <TableCell className="text-right">
                              {annualSimulation.economics.irr}%
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">10-Year ROI</TableCell>
                            <TableCell className="text-right text-green-600">
                              {annualSimulation.economics.roiPercent}%
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      
                      <Separator className="my-4" />
                      
                      <div className="text-sm">
                        <p className="font-medium mb-2">Sensitivity Analysis</p>
                        <div className="space-y-1 text-muted-foreground">
                          <div className="flex justify-between">
                            <span>At 75% efficiency:</span>
                            <span>{annualSimulation.sensitivityAnalysis.paybackAt75Efficiency} yr payback</span>
                          </div>
                          <div className="flex justify-between">
                            <span>At 85% efficiency:</span>
                            <span>{annualSimulation.sensitivityAnalysis.paybackAt85Efficiency} yr payback</span>
                          </div>
                          <div className="flex justify-between">
                            <span>If rates +20%:</span>
                            <span>{annualSimulation.sensitivityAnalysis.paybackIfRatesIncrease20} yr payback</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Monthly Breakdown Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Avg Temp (°C)</TableHead>
                          <TableHead className="text-right">Cooling (kWh)</TableHead>
                          <TableHead className="text-right">Heating (kWh)</TableHead>
                          <TableHead className="text-right">Total (kWh)</TableHead>
                          <TableHead className="text-right">Savings (SAR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {annualSimulation.monthlyBreakdown.map((month) => (
                          <TableRow key={month.month}>
                            <TableCell className="font-medium">{month.month}</TableCell>
                            <TableCell className="text-right">{month.avgOutdoorTempC.toFixed(1)}</TableCell>
                            <TableCell className="text-right font-mono">
                              {month.coolingRecoveryKWh.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {month.heatingRecoveryKWh.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {month.totalSavingsKWh.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {month.costSavingsSAR.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right font-mono">
                            {annualSimulation.annualSummary.totalCoolingRecoveryKWh.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {annualSimulation.annualSummary.totalHeatingRecoveryKWh.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {annualSimulation.annualSummary.totalEnergySavingsKWh.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            SAR {annualSimulation.annualSummary.totalCostSavingsSAR.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Compare ERV/HRV Tab */}
          <TabsContent value="compare">
            <ERVHRVComparison 
              airflowCfm={outdoorAirCfm}
              onSelect={(type) => {
                if (type === 'erv') {
                  handleErvTypeChange('enthalpy_wheel');
                } else {
                  handleErvTypeChange('plate_sensible');
                }
                setMainTab('design');
              }}
            />
          </TabsContent>
          
          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <ERVMaintenanceDashboard />
          </TabsContent>
        </Tabs>
        
        {/* Next Steps Card */}
        {result.loadReduction.total > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Continue Your Design
              </CardTitle>
              <CardDescription>
                ERV sizing complete! Here are suggested next steps.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedProjectId) params.set('project', selectedProjectId);
                    window.location.href = `/design/duct-designer${params.toString() ? '?' + params.toString() : ''}`;
                  }}
                  className="gap-2"
                >
                  Design Duct System
                  <ArrowRight className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedProjectId) params.set('project', selectedProjectId);
                    window.location.href = `/design/equipment-selection${params.toString() ? '?' + params.toString() : ''}`;
                  }}
                  className="gap-2"
                >
                  Equipment Selection
                  <ArrowRight className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedProjectId) params.set('project', selectedProjectId);
                    window.location.href = `/design/ashrae-compliance${params.toString() ? '?' + params.toString() : ''}`;
                  }}
                  className="gap-2"
                >
                  Check Compliance
                  <ArrowRight className="h-3 w-3" />
                </Button>
                {selectedProjectId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/design/completeness?project=${selectedProjectId}`}
                    className="gap-2"
                  >
                    View Design Completeness
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Dialog */}
        <SaveERVSizingDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          projectId={selectedProjectId}
          zoneId={selectedZoneId}
          zoneName={projectZones?.find(z => z.id === selectedZoneId)?.name}
          ervData={{
            outdoorAirCfm,
            ervType,
            sensibleEfficiency,
            latentEfficiency: ervTypeConfig?.hasLatentRecovery ? latentEfficiency : 0,
            sensibleLoadReduction: result.loadReduction.sensible,
            latentLoadReduction: result.loadReduction.latent,
            totalLoadReduction: result.loadReduction.total,
            annualEnergySavingsKwh: result.annualEnergySavings.totalKWh,
            annualCostSavingsSar: result.annualCostSavings,
            selectedCity,
          }}
        />
      </div>
    </DashboardLayout>
  );
}
