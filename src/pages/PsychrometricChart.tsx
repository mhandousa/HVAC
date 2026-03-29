import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { useProjects } from '@/hooks/useProjects';
import { useBuildings } from '@/hooks/useBuildings';
import { useFloors } from '@/hooks/useFloors';
import { useZones } from '@/hooks/useZones';
import { useLoadCalculationsByZone } from '@/hooks/useLoadCalculations';
import { PsychrometricAnalysis } from '@/hooks/usePsychrometricAnalyses';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { SavePsychrometricDialog } from '@/components/design/SavePsychrometricDialog';
import { PresetsPanel } from '@/components/psychrometric/PresetsPanel';
import { PresetAirState } from '@/hooks/usePsychrometricPresets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Loader2,
  Thermometer,
  Droplets,
  Wind,
  Info,
  Plus,
  Trash2,
  Download,
  Settings2,
  Snowflake,
  Flame,
  Waves,
  Zap,
  ArrowRight,
  Mountain,
  Target,
  FolderKanban,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { ZoneContextBanner } from '@/components/design/ZoneContextBanner';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useQueryClient } from '@tanstack/react-query';
import { useZoneContext } from '@/hooks/useZoneContext';

// ==================== INTERFACES ====================

interface AirState {
  id: string;
  name: string;
  dryBulb: number; // °F
  wetBulb: number; // °F
  relativeHumidity: number; // %
  dewPoint: number; // °F
  humidityRatio: number; // lb/lb
  enthalpy: number; // BTU/lb
  specificVolume: number; // ft³/lb
  color: string;
}

interface ProcessAnalysis {
  fromState: AirState;
  toState: AirState;
  processType: ProcessType;
  sensibleHeat: number;
  latentHeat: number;
  totalHeat: number;
  shr: number;
  adp?: number;
  bypassFactor?: number;
}

type ProcessType = 
  | 'sensible-heating'
  | 'sensible-cooling'
  | 'cooling-dehumidification'
  | 'heating-humidification'
  | 'evaporative-cooling'
  | 'steam-humidification'
  | 'adiabatic-mixing'
  | 'unknown';

interface ChartSettings {
  altitude: number;
  atmosphericPressure: number;
  showWetBulbLines: boolean;
  showEnthalpyLines: boolean;
  showVolumeLines: boolean;
  showComfortZone: boolean;
  showProcessLabels: boolean;
}

interface HVACPreset {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  states: { name: string; dryBulb: number; rh: number }[];
}

// ==================== CONSTANTS ====================

const ALTITUDE_PRESETS = [
  { name: 'Sea Level', altitude: 0, pressure: 14.696 },
  { name: 'Riyadh, SA', altitude: 2034, pressure: 13.68 },
  { name: 'Denver, CO', altitude: 5280, pressure: 12.23 },
  { name: 'Mexico City', altitude: 7350, pressure: 11.52 },
  { name: 'Custom', altitude: -1, pressure: -1 },
];

const STATE_COLORS = [
  'hsl(199, 89%, 48%)', // Primary blue
  'hsl(38, 92%, 50%)',  // Amber
  'hsl(152, 76%, 40%)', // Green
  'hsl(280, 70%, 50%)', // Purple
  'hsl(0, 72%, 51%)',   // Red
  'hsl(180, 70%, 45%)', // Cyan
];

const HVAC_PRESETS: HVACPreset[] = [
  {
    id: 'cooling-coil',
    name: 'Cooling Coil',
    icon: Snowflake,
    description: 'Outdoor air through DX/chilled water coil',
    states: [
      { name: 'Entering Air', dryBulb: 95, rh: 50 },
      { name: 'Leaving Air', dryBulb: 55, rh: 92 },
    ],
  },
  {
    id: 'heating-coil',
    name: 'Heating Coil',
    icon: Flame,
    description: 'Cold air through heating coil',
    states: [
      { name: 'Entering Air', dryBulb: 35, rh: 80 },
      { name: 'Leaving Air', dryBulb: 95, rh: 15 },
    ],
  },
  {
    id: 'mixing-box',
    name: 'Mixing Box',
    icon: Wind,
    description: 'Outdoor + Return air mixing',
    states: [
      { name: 'Outdoor Air', dryBulb: 95, rh: 40 },
      { name: 'Return Air', dryBulb: 75, rh: 50 },
      { name: 'Mixed Air', dryBulb: 83, rh: 46 },
    ],
  },
  {
    id: 'steam-humidifier',
    name: 'Steam Humidifier',
    icon: Waves,
    description: 'Isothermal humidification',
    states: [
      { name: 'Dry Air', dryBulb: 72, rh: 20 },
      { name: 'Humidified', dryBulb: 73, rh: 45 },
    ],
  },
  {
    id: 'evaporative-cooler',
    name: 'Evaporative Cooler',
    icon: Droplets,
    description: 'Adiabatic cooling process',
    states: [
      { name: 'Hot Dry Air', dryBulb: 100, rh: 20 },
      { name: 'Cool Humid Air', dryBulb: 75, rh: 70 },
    ],
  },
  {
    id: 'reheat',
    name: 'Reheat',
    icon: Zap,
    description: 'Overcooled air reheated for comfort',
    states: [
      { name: 'Cold Saturated', dryBulb: 52, rh: 95 },
      { name: 'Supply Air', dryBulb: 62, rh: 65 },
    ],
  },
];

// ==================== PSYCHROMETRIC CALCULATIONS ====================

const calcAtmosphericPressure = (altitudeFt: number): number => {
  return 14.696 * Math.pow(1 - 0.0000068753 * altitudeFt, 5.2559);
};

const calcSaturationPressure = (tempF: number): number => {
  const tempC = (tempF - 32) * 5 / 9;
  const tempK = tempC + 273.15;
  const pSat = Math.exp(23.196 - 3816.44 / (tempK - 46.13)); // Pa
  return pSat / 6894.76; // Convert to psia
};

const calcHumidityRatio = (pv: number, pAtm: number): number => {
  return 0.622 * pv / (pAtm - pv);
};

const calcEnthalpy = (tdb: number, w: number): number => {
  return 0.24 * tdb + w * (1061 + 0.444 * tdb);
};

const calcDewPoint = (w: number, pAtm: number): number => {
  const pv = w * pAtm / (0.622 + w);
  const alpha = Math.log(pv * 6894.76);
  const tempK = 3816.44 / (23.196 - alpha) + 46.13;
  return (tempK - 273.15) * 9 / 5 + 32;
};

const calcWetBulb = (tdb: number, rh: number): number => {
  const twb = tdb * Math.atan(0.151977 * Math.sqrt(rh + 8.313659))
    + Math.atan(tdb + rh) - Math.atan(rh - 1.676331)
    + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
  return twb;
};

const calcRHFromW = (tdb: number, w: number, pAtm: number): number => {
  const pv = w * pAtm / (0.622 + w);
  const pvs = calcSaturationPressure(tdb);
  return Math.min(100, Math.max(0, (pv / pvs) * 100));
};

const calcSpecificVolume = (tdb: number, w: number, pAtm: number): number => {
  const Ra = 53.352;
  const tempR = tdb + 459.67;
  const pv = w * pAtm / (0.622 + w);
  return Ra * tempR / ((pAtm - pv) * 144);
};

const calculateFullState = (
  input: Partial<AirState> & { inputMode?: 'rh' | 'wb' | 'dp'; inputValue?: number },
  pAtm: number,
  colorIndex: number
): AirState => {
  const tdb = input.dryBulb || 75;
  let w: number;
  let rh: number;

  if (input.inputMode === 'wb' && input.inputValue !== undefined) {
    const wSatWb = calcHumidityRatio(calcSaturationPressure(input.inputValue), pAtm);
    w = wSatWb - (tdb - input.inputValue) * 0.0004;
    w = Math.max(0, w);
    rh = calcRHFromW(tdb, w, pAtm);
  } else if (input.inputMode === 'dp' && input.inputValue !== undefined) {
    const pvs = calcSaturationPressure(input.inputValue);
    w = calcHumidityRatio(pvs, pAtm);
    rh = calcRHFromW(tdb, w, pAtm);
  } else {
    rh = input.relativeHumidity ?? input.inputValue ?? 50;
    const pvs = calcSaturationPressure(tdb);
    const pv = (rh / 100) * pvs;
    w = calcHumidityRatio(pv, pAtm);
  }

  const h = calcEnthalpy(tdb, w);
  const dp = calcDewPoint(w, pAtm);
  const wb = calcWetBulb(tdb, rh);
  const v = calcSpecificVolume(tdb, w, pAtm);

  return {
    id: input.id || crypto.randomUUID(),
    name: input.name || 'State Point',
    dryBulb: tdb,
    wetBulb: wb,
    relativeHumidity: rh,
    dewPoint: dp,
    humidityRatio: w,
    enthalpy: h,
    specificVolume: v,
    color: input.color || STATE_COLORS[colorIndex % STATE_COLORS.length],
  };
};

// ==================== PROCESS DETECTION ====================

const detectProcessType = (from: AirState, to: AirState): ProcessType => {
  const dDb = to.dryBulb - from.dryBulb;
  const dW = to.humidityRatio - from.humidityRatio;
  const wTolerance = 0.0002;
  const dbTolerance = 2;

  // Steam humidification: nearly constant DB, increasing W
  if (Math.abs(dDb) < dbTolerance && dW > wTolerance) {
    return 'steam-humidification';
  }

  // Sensible heating: increasing DB, nearly constant W
  if (dDb > dbTolerance && Math.abs(dW) < wTolerance) {
    return 'sensible-heating';
  }

  // Sensible cooling: decreasing DB, nearly constant W
  if (dDb < -dbTolerance && Math.abs(dW) < wTolerance) {
    return 'sensible-cooling';
  }

  // Cooling & dehumidification: decreasing DB and W
  if (dDb < 0 && dW < -wTolerance) {
    return 'cooling-dehumidification';
  }

  // Heating & humidification: increasing DB and W
  if (dDb > 0 && dW > wTolerance) {
    return 'heating-humidification';
  }

  // Evaporative cooling: check if close to constant WB line
  const wbDiff = Math.abs(to.wetBulb - from.wetBulb);
  if (wbDiff < 3 && dDb < 0 && dW > wTolerance) {
    return 'evaporative-cooling';
  }

  return 'unknown';
};

const getProcessLabel = (type: ProcessType): string => {
  const labels: Record<ProcessType, string> = {
    'sensible-heating': 'Sensible Heating',
    'sensible-cooling': 'Sensible Cooling',
    'cooling-dehumidification': 'Cooling & Dehumidification',
    'heating-humidification': 'Heating & Humidification',
    'evaporative-cooling': 'Evaporative Cooling',
    'steam-humidification': 'Steam Humidification',
    'adiabatic-mixing': 'Adiabatic Mixing',
    'unknown': 'Mixed Process',
  };
  return labels[type];
};

const getProcessIcon = (type: ProcessType): React.ComponentType<{ className?: string }> => {
  const icons: Record<ProcessType, React.ComponentType<{ className?: string }>> = {
    'sensible-heating': Flame,
    'sensible-cooling': Snowflake,
    'cooling-dehumidification': Snowflake,
    'heating-humidification': Flame,
    'evaporative-cooling': Droplets,
    'steam-humidification': Waves,
    'adiabatic-mixing': Wind,
    'unknown': ArrowRight,
  };
  return icons[type];
};

const analyzeProcess = (from: AirState, to: AirState): ProcessAnalysis => {
  const processType = detectProcessType(from, to);
  const dH = to.enthalpy - from.enthalpy;
  const sensibleHeat = 0.24 * (to.dryBulb - from.dryBulb);
  const latentHeat = 1061 * (to.humidityRatio - from.humidityRatio);
  const totalHeat = dH;
  const shr = totalHeat !== 0 ? Math.abs(sensibleHeat / totalHeat) : 1;

  let adp: number | undefined;
  let bypassFactor: number | undefined;

  // Calculate ADP for cooling & dehumidification
  if (processType === 'cooling-dehumidification') {
    // ADP is where the process line intersects saturation curve
    const slope = (to.humidityRatio - from.humidityRatio) / (to.dryBulb - from.dryBulb);
    // Iterate to find intersection
    for (let t = 32; t < from.dryBulb; t += 0.5) {
      const pvs = calcSaturationPressure(t);
      const wSat = calcHumidityRatio(pvs, 14.696);
      const wLine = from.humidityRatio + slope * (t - from.dryBulb);
      if (Math.abs(wSat - wLine) < 0.0005) {
        adp = t;
        break;
      }
    }
    
    if (adp !== undefined) {
      bypassFactor = (to.dryBulb - adp) / (from.dryBulb - adp);
    }
  }

  return {
    fromState: from,
    toState: to,
    processType,
    sensibleHeat: sensibleHeat * 4.5, // BTU/hr/CFM
    latentHeat: latentHeat * 4.5,
    totalHeat: totalHeat * 4.5,
    shr: Math.min(1, Math.max(0, shr)),
    adp,
    bypassFactor,
  };
};

// ==================== CHART COMPONENT ====================

export default function PsychrometricChart() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence
  const { 
    projectId: storedProjectId, 
    buildingId: storedBuildingId,
    floorId: storedFloorId,
    zoneId: storedZoneId, 
    setContext 
  } = useZoneContext();
  
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  const zoneIdFromUrl = searchParams.get('zone') || storedZoneId;

  const { data: projects } = useProjects();
  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);
  
  // Phase 17: Stage locking and validation
  const { canSave, isLocked } = useToolValidation(projectIdFromUrl || null, 'psychrometric', { checkStageLock: true });

  // Zone hierarchy state - initialize from stored context
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(storedBuildingId);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(storedFloorId);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zoneIdFromUrl);

  // Zone hierarchy queries
  const { data: buildings } = useBuildings(projectIdFromUrl || undefined);
  const { data: floors } = useFloors(selectedBuildingId || undefined);
  const { data: zones } = useZones(selectedFloorId || undefined);
  const { data: loadCalcs } = useLoadCalculationsByZone(selectedZoneId || undefined);

  // Get selected zone name for display
  const selectedZone = zones?.find(z => z.id === selectedZoneId);
  
  // Sync zone context when selections change
  useEffect(() => {
    if (projectIdFromUrl || selectedZoneId) {
      setContext(projectIdFromUrl, selectedZoneId, { 
        buildingId: selectedBuildingId, 
        floorId: selectedFloorId,
        replace: true 
      });
    }
  }, [projectIdFromUrl, selectedBuildingId, selectedFloorId, selectedZoneId, setContext]);

  // Chart settings
  const [settings, setSettings] = useState<ChartSettings>({
    altitude: 0,
    atmosphericPressure: 14.696,
    showWetBulbLines: true,
    showEnthalpyLines: false,
    showVolumeLines: false,
    showComfortZone: true,
    showProcessLabels: true,
  });

  const [altitudePreset, setAltitudePreset] = useState('Sea Level');
  const [customAltitude, setCustomAltitude] = useState(0);

  // State points
  const [states, setStates] = useState<AirState[]>([]);
  const [inputMode, setInputMode] = useState<'rh' | 'wb' | 'dp'>('rh');
  const [newState, setNewState] = useState({
    name: '',
    dryBulb: 75,
    secondaryValue: 50,
  });

  // Hover state for tooltips
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; state: AirState } | null>(null);

  // Current analysis ID for save/update
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>();

  // Load saved analysis
  const handleLoadAnalysis = useCallback((analysis: PsychrometricAnalysis) => {
    // Update settings
    const newPressure = analysis.atmospheric_pressure_psia || 14.696;
    const newAltitude = analysis.altitude_ft || 0;
    
    setSettings(prev => ({
      ...prev,
      altitude: newAltitude,
      atmosphericPressure: newPressure,
    }));

    // Find matching altitude preset
    const matchingPreset = ALTITUDE_PRESETS.find(
      p => Math.abs(p.altitude - newAltitude) < 100
    );
    if (matchingPreset) {
      setAltitudePreset(matchingPreset.name);
    } else {
      setAltitudePreset('Custom');
      setCustomAltitude(newAltitude);
    }

    // Convert and set states
    const loadedStates = analysis.air_states.map((s, i) => 
      calculateFullState(
        {
          id: s.id,
          name: s.name,
          dryBulb: s.dryBulb,
          relativeHumidity: s.relativeHumidity,
        },
        newPressure,
        i
      )
    );
    setStates(loadedStates);
    toast.success(`Loaded "${analysis.name}"`);
  }, []);

  // Initialize with sample states or load from zone's load calculation
  useEffect(() => {
    // If we have a zone with load calculations, use those conditions
    if (loadCalcs && loadCalcs.length > 0) {
      const calc = loadCalcs[0];
      const outdoorDb = calc.outdoor_temp_summer_f || 95;
      const indoorDb = calc.indoor_temp_summer_f || 75;
      
      const initialStates = [
        calculateFullState({ id: '1', name: 'Outdoor Air', dryBulb: outdoorDb, relativeHumidity: 40 }, settings.atmosphericPressure, 0),
        calculateFullState({ id: '2', name: 'Indoor Air', dryBulb: indoorDb, relativeHumidity: 50 }, settings.atmosphericPressure, 1),
      ];
      setStates(initialStates);
      toast.info(`Loaded conditions from ${calc.calculation_name || 'Load Calculation'}`);
    } else if (states.length === 0) {
      // Only set default states if we don't have any
      const initialStates = [
        calculateFullState({ id: '1', name: 'Outdoor Air', dryBulb: 95, relativeHumidity: 50 }, settings.atmosphericPressure, 0),
        calculateFullState({ id: '2', name: 'Supply Air', dryBulb: 55, relativeHumidity: 90 }, settings.atmosphericPressure, 1),
      ];
      setStates(initialStates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCalcs]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle altitude changes
  const handleAltitudePresetChange = (preset: string) => {
    setAltitudePreset(preset);
    const found = ALTITUDE_PRESETS.find(p => p.name === preset);
    if (found && found.altitude >= 0) {
      setSettings(prev => ({
        ...prev,
        altitude: found.altitude,
        atmosphericPressure: found.pressure,
      }));
      // Recalculate all states
      setStates(prevStates => 
        prevStates.map((s, i) => calculateFullState({ ...s, relativeHumidity: s.relativeHumidity }, found.pressure, i))
      );
    }
  };

  const handleCustomAltitudeChange = (altitude: number) => {
    setCustomAltitude(altitude);
    const pressure = calcAtmosphericPressure(altitude);
    setSettings(prev => ({
      ...prev,
      altitude,
      atmosphericPressure: pressure,
    }));
    setStates(prevStates => 
      prevStates.map((s, i) => calculateFullState({ ...s, relativeHumidity: s.relativeHumidity }, pressure, i))
    );
  };

  // Add state point
  const addState = () => {
    if (!newState.name.trim()) {
      toast.error('Please enter a state name');
      return;
    }

    const calculated = calculateFullState(
      {
        name: newState.name,
        dryBulb: newState.dryBulb,
        inputMode,
        inputValue: newState.secondaryValue,
      },
      settings.atmosphericPressure,
      states.length
    );

    setStates([...states, calculated]);
    setNewState({ name: '', dryBulb: 75, secondaryValue: 50 });
    toast.success('State point added');
  };

  const removeState = (id: string) => {
    setStates(states.filter((s) => s.id !== id));
  };

  // Load HVAC preset from library
  const loadPresetFromLibrary = (airStates: PresetAirState[], presetId?: string) => {
    const newStates = airStates.map((s, i) => {
      // Convert from Celsius to Fahrenheit if needed (library stores in C)
      const dryBulbF = s.dryBulb * 9/5 + 32;
      return calculateFullState(
        { 
          name: s.name, 
          dryBulb: dryBulbF, 
          relativeHumidity: s.humidityType === 'relative' ? s.humidity : undefined,
          inputMode: s.humidityType === 'wetBulb' ? 'wb' : s.humidityType === 'dewPoint' ? 'dp' : 'rh',
          inputValue: s.humidity
        },
        settings.atmosphericPressure,
        i
      );
    });
    setStates(newStates);
    toast.success('Preset loaded');
  };

  // Get current states for saving as preset (convert to Celsius)
  const currentPresetStates: PresetAirState[] = states.map(s => ({
    name: s.name,
    dryBulb: (s.dryBulb - 32) * 5/9, // Convert F to C
    humidity: s.relativeHumidity,
    humidityType: 'relative' as const,
  }));

  // Clear all states
  const clearStates = () => {
    setStates([]);
    toast.success('All state points cleared');
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      ['Name', 'Dry Bulb (°F)', 'Wet Bulb (°F)', 'RH (%)', 'Dew Point (°F)', 'Humidity Ratio (lb/lb)', 'Enthalpy (BTU/lb)', 'Specific Volume (ft³/lb)'].join(','),
      ...states.map(s => 
        [s.name, s.dryBulb.toFixed(1), s.wetBulb.toFixed(1), s.relativeHumidity.toFixed(1), s.dewPoint.toFixed(1), s.humidityRatio.toFixed(5), s.enthalpy.toFixed(2), s.specificVolume.toFixed(3)].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'psychrometric_analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported to CSV');
  };

  // Generate chart data
  const chartData = useMemo(() => {
    const pAtm = settings.atmosphericPressure;
    
    // RH lines
    const rhLines: { rh: number; points: { x: number; y: number }[] }[] = [];
    const rhValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    for (const rh of rhValues) {
      const points: { x: number; y: number }[] = [];
      for (let t = 32; t <= 120; t += 2) {
        const pvs = calcSaturationPressure(t);
        const pv = (rh / 100) * pvs;
        const w = calcHumidityRatio(pv, pAtm);
        if (w >= 0 && w <= 0.03) {
          points.push({ x: t, y: w * 1000 });
        }
      }
      rhLines.push({ rh, points });
    }

    // Wet bulb lines
    const wbLines: { wb: number; points: { x: number; y: number }[] }[] = [];
    const wbValues = [40, 50, 55, 60, 65, 70, 75, 80, 85];
    for (const wb of wbValues) {
      const points: { x: number; y: number }[] = [];
      for (let t = wb; t <= 120; t += 2) {
        const wSatWb = calcHumidityRatio(calcSaturationPressure(wb), pAtm);
        const w = wSatWb - (t - wb) * 0.0004;
        if (w >= 0 && w <= 0.03) {
          points.push({ x: t, y: w * 1000 });
        }
      }
      wbLines.push({ wb, points });
    }

    // Enthalpy lines
    const enthalpyLines: { h: number; points: { x: number; y: number }[] }[] = [];
    const hValues = [20, 25, 30, 35, 40, 45, 50];
    for (const h of hValues) {
      const points: { x: number; y: number }[] = [];
      for (let t = 32; t <= 120; t += 2) {
        const w = (h - 0.24 * t) / (1061 + 0.444 * t);
        if (w >= 0 && w <= 0.03) {
          points.push({ x: t, y: w * 1000 });
        }
      }
      enthalpyLines.push({ h, points });
    }

    // ASHRAE comfort zone (simplified)
    const comfortZone = {
      summer: [
        { x: 74, y: 0.004 * 1000 },
        { x: 80, y: 0.004 * 1000 },
        { x: 80, y: 0.012 * 1000 },
        { x: 74, y: 0.012 * 1000 },
      ],
      winter: [
        { x: 68, y: 0.003 * 1000 },
        { x: 75, y: 0.003 * 1000 },
        { x: 75, y: 0.010 * 1000 },
        { x: 68, y: 0.010 * 1000 },
      ],
    };

    return { rhLines, wbLines, enthalpyLines, comfortZone };
  }, [settings.atmosphericPressure]);

  // Process analysis for all consecutive state pairs
  const processAnalyses = useMemo(() => {
    const analyses: ProcessAnalysis[] = [];
    for (let i = 0; i < states.length - 1; i++) {
      analyses.push(analyzeProcess(states[i], states[i + 1]));
    }
    return analyses;
  }, [states]);

  // Chart coordinate conversion
  const toChartX = (db: number) => ((db - 32) / 88) * 360 + 30;
  const toChartY = (w: number) => 280 - (w / 30) * 260;

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items = [];
    if (linkedProject) {
      items.push({ label: linkedProject.name, href: `/projects/${linkedProject.id}` });
    }
    items.push(
      { label: 'Design Tools', href: '/design' },
      { label: 'Core Calculations' },
      { label: 'Psychrometric Chart' }
    );
    return items;
  }, [linkedProject]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Breadcrumbs items={breadcrumbItems} className="mb-2" />
          <ActiveEditorsIndicator
            entityType="psychrometric"
            entityId={selectedZoneId || null}
            projectId={projectIdFromUrl || undefined}
          />
        </div>
        
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

        {/* Zone Context Banner */}
        {projectIdFromUrl && selectedZoneId && (
          <ZoneContextBanner
            compact
          />
        )}

        {/* Data Flow Suggestions */}
        {projectIdFromUrl && (
          <DataFlowSuggestions
            projectId={projectIdFromUrl}
            currentTool="psychrometric-chart"
            variant="alert"
            className="mb-2"
          />
        )}

        {/* Cross-Tool Validation Alert */}
        {projectIdFromUrl && (
          <CrossToolValidationAlert
            projectId={projectIdFromUrl}
            currentTool="psychrometric"
            variant="alert"
            className="mb-2"
          />
        )}
        
        {/* Phase 17: Unified Tool Header with Stage Locking */}
        <ToolPageHeader
          toolType="psychrometric"
          toolName="Psychrometric Chart"
          projectId={projectIdFromUrl}
          showLockButton={true}
          showValidation={true}
        />

        {/* Phase 18: Edit Conflict Warning */}
        <EditConflictWarning
          entityType="psychrometric"
          entityId={currentAnalysisId || null}
          currentRevisionNumber={0}
          onReload={() => window.location.reload()}
        />
        {linkedProject && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
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
                <Badge variant="outline">{linkedProject.status}</Badge>
              </div>
              
              {/* Zone Linking Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Link to Zone</span>
                  {selectedZone && (
                    <Badge variant="secondary" className="ml-auto">
                      {selectedZone.name}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select 
                    value={selectedBuildingId || ''} 
                    onValueChange={(v) => {
                      setSelectedBuildingId(v || null);
                      setSelectedFloorId(null);
                      setSelectedZoneId(null);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings?.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedFloorId || ''} 
                    onValueChange={(v) => {
                      setSelectedFloorId(v || null);
                      setSelectedZoneId(null);
                    }}
                    disabled={!selectedBuildingId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors?.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedZoneId || ''} 
                    onValueChange={setSelectedZoneId}
                    disabled={!selectedFloorId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones?.map(z => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedZoneId && loadCalcs && loadCalcs.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Using outdoor/indoor conditions from zone load calculation
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {linkedProject ? (
              <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${linkedProject.id}`)}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Psychrometric Chart</h1>
              <p className="text-muted-foreground">
                Interactive HVAC process visualization & analysis
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <SavePsychrometricDialog
              states={states}
              settings={settings}
              projectId={projectIdFromUrl || undefined}
              zoneId={selectedZoneId || undefined}
              currentAnalysisId={currentAnalysisId}
              onLoad={handleLoadAnalysis}
              onAnalysisIdChange={setCurrentAnalysisId}
            />
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Settings Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Altitude Selector */}
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-muted-foreground" />
                <Select value={altitudePreset} onValueChange={handleAltitudePresetChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALTITUDE_PRESETS.map((p) => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {altitudePreset === 'Custom' && (
                  <Input
                    type="number"
                    value={customAltitude}
                    onChange={(e) => handleCustomAltitudeChange(parseFloat(e.target.value) || 0)}
                    className="w-24"
                    placeholder="ft"
                  />
                )}
                <Badge variant="secondary">
                  {settings.atmosphericPressure.toFixed(2)} psia
                </Badge>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Display Options */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="wb-lines"
                    checked={settings.showWetBulbLines}
                    onCheckedChange={(v) => setSettings(prev => ({ ...prev, showWetBulbLines: v }))}
                  />
                  <Label htmlFor="wb-lines" className="text-sm">WB Lines</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="enthalpy-lines"
                    checked={settings.showEnthalpyLines}
                    onCheckedChange={(v) => setSettings(prev => ({ ...prev, showEnthalpyLines: v }))}
                  />
                  <Label htmlFor="enthalpy-lines" className="text-sm">Enthalpy</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="comfort-zone"
                    checked={settings.showComfortZone}
                    onCheckedChange={(v) => setSettings(prev => ({ ...prev, showComfortZone: v }))}
                  />
                  <Label htmlFor="comfort-zone" className="text-sm">Comfort Zone</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Chart Area */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Psychrometric Chart
              </CardTitle>
              <CardDescription>
                Altitude: {settings.altitude.toLocaleString()} ft | Pressure: {settings.atmosphericPressure.toFixed(2)} psia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted/20 to-muted/50 rounded-lg border overflow-hidden">
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  {/* Grid */}
                  <defs>
                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" />
                    </pattern>
                    <linearGradient id="comfortGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(152, 76%, 40%)" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="hsl(152, 76%, 40%)" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <rect width="400" height="300" fill="url(#grid)" />

                  {/* ASHRAE Comfort Zone */}
                  {settings.showComfortZone && (
                    <>
                      <polygon
                        points={chartData.comfortZone.summer.map(p => `${toChartX(p.x)},${toChartY(p.y)}`).join(' ')}
                        fill="url(#comfortGradient)"
                        stroke="hsl(152, 76%, 40%)"
                        strokeWidth="1"
                        strokeDasharray="4,2"
                      />
                      <text
                        x={toChartX(77)}
                        y={toChartY(0.008 * 1000)}
                        className="text-[8px] fill-success font-medium"
                        textAnchor="middle"
                      >
                        Comfort Zone
                      </text>
                    </>
                  )}

                  {/* Enthalpy Lines */}
                  {settings.showEnthalpyLines && chartData.enthalpyLines.map((line) => (
                    <g key={`h-${line.h}`}>
                      <path
                        d={line.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.x)} ${toChartY(p.y)}`).join(' ')}
                        fill="none"
                        stroke="hsl(280, 70%, 50%)"
                        strokeWidth="0.5"
                        strokeDasharray="2,4"
                        opacity={0.4}
                      />
                      {line.points.length > 0 && (
                        <text
                          x={toChartX(line.points[0].x) - 5}
                          y={toChartY(line.points[0].y)}
                          className="text-[7px] fill-purple-500"
                          textAnchor="end"
                        >
                          h={line.h}
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Wet Bulb Lines */}
                  {settings.showWetBulbLines && chartData.wbLines.map((line) => (
                    <g key={`wb-${line.wb}`}>
                      <path
                        d={line.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.x)} ${toChartY(p.y)}`).join(' ')}
                        fill="none"
                        stroke="hsl(199, 89%, 48%)"
                        strokeWidth="0.5"
                        strokeDasharray="3,3"
                        opacity={0.4}
                      />
                      {line.points.length > 0 && (
                        <text
                          x={toChartX(line.points[0].x)}
                          y={toChartY(line.points[0].y) - 3}
                          className="text-[7px] fill-primary"
                          textAnchor="middle"
                        >
                          {line.wb}°
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Saturation curve (100% RH) */}
                  <path
                    d={chartData.rhLines
                      .find((l) => l.rh === 100)
                      ?.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.x)} ${toChartY(p.y)}`)
                      .join(' ')}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                  />

                  {/* RH Lines */}
                  {chartData.rhLines
                    .filter((l) => l.rh !== 100)
                    .map((line) => (
                      <g key={line.rh}>
                        <path
                          d={line.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toChartX(p.x)} ${toChartY(p.y)}`).join(' ')}
                          fill="none"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth="0.5"
                          strokeDasharray={line.rh % 20 === 0 ? 'none' : '2,2'}
                          opacity={0.4}
                        />
                        {line.rh % 20 === 0 && line.points.length > 5 && (
                          <text
                            x={toChartX(line.points[Math.floor(line.points.length / 2)].x)}
                            y={toChartY(line.points[Math.floor(line.points.length / 2)].y) + 3}
                            className="text-[7px] fill-muted-foreground"
                            textAnchor="middle"
                          >
                            {line.rh}%
                          </text>
                        )}
                      </g>
                    ))}

                  {/* Process Lines with Labels */}
                  {states.length >= 2 && processAnalyses.map((analysis, idx) => {
                    const fromX = toChartX(analysis.fromState.dryBulb);
                    const fromY = toChartY(analysis.fromState.humidityRatio * 1000);
                    const toX = toChartX(analysis.toState.dryBulb);
                    const toY = toChartY(analysis.toState.humidityRatio * 1000);
                    const midX = (fromX + toX) / 2;
                    const midY = (fromY + toY) / 2;

                    return (
                      <g key={`process-${idx}`}>
                        {/* Process line */}
                        <line
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                        {/* Arrow */}
                        <polygon
                          points={`${toX},${toY} ${toX - 6},${toY - 3} ${toX - 6},${toY + 3}`}
                          fill="hsl(var(--primary))"
                          transform={`rotate(${Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI}, ${toX}, ${toY})`}
                        />
                        {/* Process label */}
                        {settings.showProcessLabels && (
                          <g>
                            <rect
                              x={midX - 35}
                              y={midY - 8}
                              width="70"
                              height="14"
                              rx="3"
                              fill="hsl(var(--background))"
                              stroke="hsl(var(--border))"
                              strokeWidth="0.5"
                            />
                            <text
                              x={midX}
                              y={midY + 3}
                              className="text-[7px] fill-foreground font-medium"
                              textAnchor="middle"
                            >
                              {getProcessLabel(analysis.processType).substring(0, 15)}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* State Points */}
                  {states.map((state) => {
                    const x = toChartX(state.dryBulb);
                    const y = toChartY(state.humidityRatio * 1000);
                    return (
                      <g key={state.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r="10"
                          fill={state.color}
                          stroke="hsl(var(--background))"
                          strokeWidth="2"
                          className="cursor-pointer transition-all hover:r-12"
                          onMouseEnter={() => setHoveredPoint({ x, y, state })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <text
                          x={x}
                          y={y - 14}
                          textAnchor="middle"
                          className="text-[9px] fill-foreground font-semibold pointer-events-none"
                        >
                          {state.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Tooltip */}
                  {hoveredPoint && (
                    <g>
                      <rect
                        x={hoveredPoint.x + 15}
                        y={hoveredPoint.y - 50}
                        width="95"
                        height="65"
                        rx="4"
                        fill="hsl(var(--card))"
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                      />
                      <text x={hoveredPoint.x + 20} y={hoveredPoint.y - 36} className="text-[8px] fill-foreground font-semibold">
                        {hoveredPoint.state.name}
                      </text>
                      <text x={hoveredPoint.x + 20} y={hoveredPoint.y - 24} className="text-[7px] fill-muted-foreground">
                        DB: {hoveredPoint.state.dryBulb.toFixed(1)}°F
                      </text>
                      <text x={hoveredPoint.x + 20} y={hoveredPoint.y - 12} className="text-[7px] fill-muted-foreground">
                        RH: {hoveredPoint.state.relativeHumidity.toFixed(1)}%
                      </text>
                      <text x={hoveredPoint.x + 20} y={hoveredPoint.y} className="text-[7px] fill-muted-foreground">
                        W: {(hoveredPoint.state.humidityRatio * 7000).toFixed(1)} gr/lb
                      </text>
                      <text x={hoveredPoint.x + 20} y={hoveredPoint.y + 12} className="text-[7px] fill-muted-foreground">
                        h: {hoveredPoint.state.enthalpy.toFixed(1)} BTU/lb
                      </text>
                    </g>
                  )}

                  {/* Axes Labels */}
                  <text x="200" y="295" textAnchor="middle" className="text-[10px] fill-muted-foreground font-medium">
                    Dry Bulb Temperature (°F)
                  </text>
                  <text x="12" y="150" textAnchor="middle" transform="rotate(-90, 12, 150)" className="text-[10px] fill-muted-foreground font-medium">
                    Humidity Ratio (gr/lb)
                  </text>

                  {/* Temperature scale */}
                  {[40, 60, 80, 100, 120].map((t) => (
                    <text key={t} x={toChartX(t)} y={288} textAnchor="middle" className="text-[8px] fill-muted-foreground">
                      {t}
                    </text>
                  ))}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* Quick Presets */}
            <Card>
              <CardContent className="pt-4">
                <PresetsPanel
                  onLoadPreset={loadPresetFromLibrary}
                  currentAirStates={currentPresetStates}
                  altitudeFt={settings.altitude}
                />
              </CardContent>
            </Card>

            {/* Add State Point */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Add State Point</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="e.g., Mixed Air"
                    value={newState.name}
                    onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dry Bulb (°F)</Label>
                  <Input
                    type="number"
                    value={newState.dryBulb}
                    onChange={(e) => setNewState({ ...newState, dryBulb: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-sm"
                  />
                </div>

                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as typeof inputMode)}>
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="rh" className="text-xs">RH %</TabsTrigger>
                    <TabsTrigger value="wb" className="text-xs">WB °F</TabsTrigger>
                    <TabsTrigger value="dp" className="text-xs">DP °F</TabsTrigger>
                  </TabsList>
                  <TabsContent value="rh" className="space-y-1 mt-2">
                    <Label className="text-xs">Relative Humidity (%)</Label>
                    <Input
                      type="number"
                      value={newState.secondaryValue}
                      onChange={(e) => setNewState({ ...newState, secondaryValue: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </TabsContent>
                  <TabsContent value="wb" className="space-y-1 mt-2">
                    <Label className="text-xs">Wet Bulb (°F)</Label>
                    <Input
                      type="number"
                      value={newState.secondaryValue}
                      onChange={(e) => setNewState({ ...newState, secondaryValue: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </TabsContent>
                  <TabsContent value="dp" className="space-y-1 mt-2">
                    <Label className="text-xs">Dew Point (°F)</Label>
                    <Input
                      type="number"
                      value={newState.secondaryValue}
                      onChange={(e) => setNewState({ ...newState, secondaryValue: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2">
                  <Button className="flex-1 h-8 text-xs" onClick={addState}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                  <Button variant="outline" className="h-8 text-xs" onClick={clearStates}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* State Points List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  State Points ({states.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                {states.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No state points. Add one or load a preset.
                  </p>
                ) : (
                  states.map((state) => (
                    <div
                      key={state.id}
                      className="p-2 rounded-lg bg-muted/50 border space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: state.color }}
                          />
                          <span className="font-medium text-xs">{state.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => removeState(state.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 text-[10px] text-muted-foreground">
                        <span>DB: {state.dryBulb.toFixed(1)}°F</span>
                        <span>WB: {state.wetBulb.toFixed(1)}°F</span>
                        <span>RH: {state.relativeHumidity.toFixed(1)}%</span>
                        <span>DP: {state.dewPoint.toFixed(1)}°F</span>
                        <span>W: {(state.humidityRatio * 7000).toFixed(1)} gr/lb</span>
                        <span>h: {state.enthalpy.toFixed(1)} BTU/lb</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Process Analysis */}
        {processAnalyses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="w-5 h-5" />
                Process Analysis
              </CardTitle>
              <CardDescription>
                Thermodynamic analysis of air handling processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processAnalyses.map((analysis, idx) => {
                  const ProcessIcon = getProcessIcon(analysis.processType);
                  return (
                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <ProcessIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">
                            {analysis.fromState.name} → {analysis.toState.name}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {getProcessLabel(analysis.processType)}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="p-3 rounded-md bg-background border">
                          <p className="text-xs text-muted-foreground mb-0.5">Sensible Heat</p>
                          <p className="font-bold text-sm">
                            {analysis.sensibleHeat >= 0 ? '+' : ''}{analysis.sensibleHeat.toFixed(2)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">BTU/hr/CFM</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-md bg-background border">
                          <p className="text-xs text-muted-foreground mb-0.5">Latent Heat</p>
                          <p className="font-bold text-sm">
                            {analysis.latentHeat >= 0 ? '+' : ''}{analysis.latentHeat.toFixed(2)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">BTU/hr/CFM</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-md bg-background border">
                          <p className="text-xs text-muted-foreground mb-0.5">Total Heat</p>
                          <p className="font-bold text-sm">
                            {analysis.totalHeat >= 0 ? '+' : ''}{analysis.totalHeat.toFixed(2)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">BTU/hr/CFM</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-md bg-background border">
                          <p className="text-xs text-muted-foreground mb-0.5">Sensible Heat Ratio</p>
                          <p className="font-bold text-sm">
                            {analysis.shr.toFixed(2)}
                          </p>
                        </div>
                        {analysis.adp !== undefined && (
                          <div className="p-3 rounded-md bg-background border">
                            <p className="text-xs text-muted-foreground mb-0.5">Apparatus DP</p>
                            <p className="font-bold text-sm">
                              {analysis.adp.toFixed(1)}
                              <span className="text-xs font-normal text-muted-foreground ml-1">°F</span>
                            </p>
                          </div>
                        )}
                        {analysis.bypassFactor !== undefined && (
                          <div className="p-3 rounded-md bg-background border">
                            <p className="text-xs text-muted-foreground mb-0.5">Bypass Factor</p>
                            <p className="font-bold text-sm">
                              {analysis.bypassFactor.toFixed(3)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-info/5 border-info/20">
          <CardContent className="flex gap-3 pt-4">
            <Info className="w-5 h-5 text-info shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">About Psychrometric Analysis</p>
              <p>
                This tool calculates air properties based on ASHRAE fundamentals with altitude adjustment.
                Use the HVAC presets to quickly visualize common processes like cooling coils, mixing boxes,
                and humidification. The comfort zone overlay shows ASHRAE Standard 55 acceptable conditions.
                Process analysis includes Sensible Heat Ratio (SHR) and Apparatus Dew Point (ADP) for cooling coils.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Design Workflow Next Step */}
        <DesignWorkflowNextStep
          currentPath="/design/psychrometric-chart"
          projectId={projectIdFromUrl}
          zoneId={selectedZoneId}
          stageComplete={states.length > 1}
        />
      </div>
    </DashboardLayout>
  );
}
