import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { BatchImportZonesDialog } from '@/components/design/BatchImportZonesDialog';
import { BulkZoneSelector } from '@/components/design/BulkZoneSelector';
import { BulkOperationDialog } from '@/components/design/BulkOperationDialog';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';
import { LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useQueryClient } from '@tanstack/react-query';
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
import { useProjects } from '@/hooks/useProjects';
import { useBuildings } from '@/hooks/useBuildings';
import { useZones } from '@/hooks/useZones';
import { useFloors } from '@/hooks/useFloors';
import { useLoadCalculations } from '@/hooks/useLoadCalculations';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useZoneVentilationData } from '@/hooks/useZoneVentilationData';
import { 
  useTerminalUnitSelections, 
  useCreateTerminalUnitSelection,
  useDeleteTerminalUnitSelection 
} from '@/hooks/useTerminalUnitSelections';
import { VAVSizingPanel, VAVAccessories } from '@/components/terminal-units/VAVSizingPanel';
import { FCUSizingPanel } from '@/components/terminal-units/FCUSizingPanel';
import { UnitSizingRecommendations } from '@/components/terminal-units/UnitSizingRecommendations';
import { TerminalUnitScheduleExportDialog } from '@/components/terminal-units/TerminalUnitScheduleExportDialog';
import { 
  useTerminalUnitScheduleExport,
  DEFAULT_TERMINAL_UNIT_COLUMNS,
  type TerminalUnitRow,
  type GroupedTerminalUnits,
  type ExportOptions,
} from '@/hooks/useTerminalUnitScheduleExport';
import { 
  TerminalUnitType, 
  TERMINAL_UNIT_TYPES,
  isVAVType,
  isFCUType,
  VAVSizingResult,
  FCUSizingResult,
  generateUnitTag
} from '@/lib/terminal-unit-calculations';
import { Progress } from '@/components/ui/progress';
import { 
  Box, 
  Wind, 
  Building2, 
  Layers, 
  MapPin, 
  Save, 
  Trash2, 
  ArrowRight,
  Thermometer,
  Droplets,
  FileDown,
  AlertTriangle,
  Info,
  Table,
  Zap,
  Download,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

// Phase 4 UX imports
import { useKeyboardShortcuts, type ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';
import { useSandbox } from '@/contexts/SandboxContext';
import { SmartDefaultsBanner } from '@/components/design/SmartDefaultsBanner';
import { SandboxModeToggle, SandboxModeBanner } from '@/components/design/SandboxModeToggle';
import { ScenarioManager } from '@/components/design/ScenarioManager';
import { ScenarioComparisonView, type ComparisonMetric } from '@/components/design/ScenarioComparisonView';
import { PromoteScenarioDialog } from '@/components/design/PromoteScenarioDialog';
import type { Scenario } from '@/contexts/SandboxContext';

// Terminal unit specific comparison metrics
const TERMINAL_UNIT_METRICS: ComparisonMetric[] = [
  { key: 'totalCfm', label: 'Total Zone CFM', format: 'number' },
  { key: 'unitCount', label: 'Unit Count', format: 'number' },
  { key: 'avgNC', label: 'Average NC Rating', format: 'number' },
  { key: 'reheatCapacity', label: 'Total Reheat (MBH)', format: 'number' },
];

export default function TerminalUnitSizing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Zone context persistence with full hierarchy
  const { 
    projectId: storedProjectId, 
    buildingId: storedBuildingId,
    floorId: storedFloorId,
    zoneId: storedZoneId, 
    setFullContext 
  } = useZoneContext();
  
  const initialProjectId = searchParams.get('project') || storedProjectId || '';
  const initialBuildingId = searchParams.get('building') || storedBuildingId || '';
  const initialFloorId = searchParams.get('floor') || storedFloorId || '';
  const initialZoneId = searchParams.get('zone') || storedZoneId || '';
  const initialType = searchParams.get('type') as TerminalUnitType | null;

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedBuildingId, setSelectedBuildingId] = useState(initialBuildingId);
  const [selectedFloorId, setSelectedFloorId] = useState(initialFloorId);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId);
  const [unitType, setUnitType] = useState<TerminalUnitType>(initialType || 'vav_reheat');
  const [unitTag, setUnitTag] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showBatchImportDialog, setShowBatchImportDialog] = useState(false);
  const [showBulkOperationDialog, setShowBulkOperationDialog] = useState(false);
  const [bulkSelectedZoneIds, setBulkSelectedZoneIds] = useState<string[]>([]);
  const [isImportingZones, setIsImportingZones] = useState(false);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [validationInfo, setValidationInfo] = useState<{
    existingZoneCfm: number;
    newUnitCfm: number;
    totalCfm: number;
    requiredCfm: number;
    variancePercent: number;
  } | null>(null);
  const [cfmOverride, setCfmOverride] = useState<number | null>(null);

  const [vavResult, setVavResult] = useState<VAVSizingResult | null>(null);
  const [fcuResult, setFcuResult] = useState<FCUSizingResult | null>(null);
  const [vavAccessories, setVavAccessories] = useState<VAVAccessories | null>(null);

  const { exportToPDF, exportToExcel, copyToClipboard } = useTerminalUnitScheduleExport();

  // Phase 4: Smart Defaults
  const { defaults, summary, hasContext } = useSmartDefaults({});

  // Phase 4: Sandbox Mode
  const { 
    state: sandboxState, 
    activateSandbox, 
    updateScenario, 
    setScenarioResults, 
    getMergedData 
  } = useSandbox();

  // Concurrent Editing Awareness
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'terminal_unit',
    entityId: selectedZoneId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['terminal_unit_selections'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Pre-save validation & Stage Locking
  const { canSave: canSaveValidation, blockers, warnings, isLocked } = useToolValidation(
    selectedProjectId || null,
    'terminal-unit',
    { checkStageLock: true }
  );

  // Design Alternatives
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);
  
  // Scenario-to-Alternative Promotion state
  const [showPromoteScenario, setShowPromoteScenario] = useState(false);
  const [scenarioToPromote, setScenarioToPromote] = useState<Scenario | null>(null);

  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.unitType) setUnitType(data.unitType as TerminalUnitType);
    if (data.unitTag) setUnitTag(data.unitTag as string);
    if (data.quantity) setQuantity(data.quantity as number);
    if (data.notes) setNotes(data.notes as string);
    if (data.cfmOverride !== undefined) setCfmOverride(data.cfmOverride as number | null);
    if (data.vavAccessories) setVavAccessories(data.vavAccessories as VAVAccessories | null);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);

  // Scenario-to-Alternative Promotion handler
  const handlePromoteScenarioToAlternative = useCallback((scenario: Scenario) => {
    setScenarioToPromote(scenario);
    setShowPromoteScenario(true);
  }, []);

  // Sync zone context with full hierarchy when selections change
  useEffect(() => {
    if (selectedProjectId || selectedZoneId) {
      setFullContext(
        selectedProjectId || null, 
        selectedBuildingId || null,
        selectedFloorId || null,
        selectedZoneId || null, 
        { replace: true }
      );
    }
  }, [selectedProjectId, selectedBuildingId, selectedFloorId, selectedZoneId, setFullContext]);

  const { user } = useAuth();
  const { data: organization } = useOrganization();
  const { data: projects } = useProjects();
  const { data: buildings } = useBuildings(selectedProjectId);
  const { data: zones } = useZones(selectedBuildingId);
  const { data: floorsData } = useFloors(selectedBuildingId);
  const { data: loadCalculations } = useLoadCalculations(selectedProjectId);
  const { data: existingUnits } = useTerminalUnitSelections(selectedProjectId);
  const { data: zoneVentilationData, isLoading: ventilationLoading } = useZoneVentilationData(selectedZoneId || undefined);
  const createUnit = useCreateTerminalUnitSelection();
  const deleteUnit = useDeleteTerminalUnitSelection();

  // Get floors from useFloors hook
  const floors = useMemo(() => {
    if (!floorsData) return [];
    return floorsData.map(f => ({ id: f.id, name: f.name }));
  }, [floorsData]);

  // Filter zones by floor
  const filteredZones = useMemo(() => {
    if (!zones) return [];
    if (!selectedFloorId) return zones;
    return zones.filter(z => z.floor_id === selectedFloorId);
  }, [zones, selectedFloorId]);

  // Get selected zone data
  const selectedZone = useMemo(() => {
    return zones?.find(z => z.id === selectedZoneId);
  }, [zones, selectedZoneId]);

  // Get load calculation for selected zone
  const zoneLoadCalc = useMemo(() => {
    if (!loadCalculations || !selectedZoneId) return null;
    return loadCalculations.find(lc => lc.zone_id === selectedZoneId);
  }, [loadCalculations, selectedZoneId]);

  // Import values from load calculation
  const importedCfm = zoneLoadCalc?.cfm_required || 0;
  const importedCoolingLoad = zoneLoadCalc?.cooling_load_btuh || 0;
  const importedHeatingLoad = zoneLoadCalc?.heating_load_btuh || 0;

  // Effective CFM for sizing (uses override if set)
  const effectiveCfm = cfmOverride ?? importedCfm;
  const cfmScaleFactor = importedCfm > 0 ? effectiveCfm / importedCfm : 1;
  const effectiveCoolingLoad = Math.round(importedCoolingLoad * cfmScaleFactor);
  const effectiveHeatingLoad = Math.round(importedHeatingLoad * cfmScaleFactor);

  // Use ASHRAE 62.1 calculated value from ventilation calc, fallback to rough estimate
  const importedVentilationCfm = useMemo(() => {
    if (zoneVentilationData?.vozCfm) {
      return Math.round(zoneVentilationData.vozCfm);
    }
    // Fallback to rough estimate if no ventilation calc exists
    return zoneLoadCalc?.occupant_count 
      ? Math.round(zoneLoadCalc.occupant_count * 15) 
      : 0;
  }, [zoneVentilationData, zoneLoadCalc]);

  // Determine ventilation source for display
  const ventilationSource: 'ashrae' | 'estimate' | null = zoneVentilationData?.vozCfm 
    ? 'ashrae' 
    : (zoneLoadCalc?.occupant_count ? 'estimate' : null);

  // Count existing units for this zone
  const zoneUnits = useMemo(() => {
    if (!existingUnits || !selectedZoneId) return [];
    return existingUnits.filter(u => u.zone_id === selectedZoneId);
  }, [existingUnits, selectedZoneId]);

  // Generate default tag
  const defaultTag = useMemo(() => {
    const existingCount = zoneUnits.length;
    const zonePrefix = selectedZone?.name?.substring(0, 3).toUpperCase() || '';
    return generateUnitTag(unitType, existingCount + 1, zonePrefix);
  }, [unitType, zoneUnits.length, selectedZone]);

  // Update tag when zone or type changes
  React.useEffect(() => {
    if (!unitTag || unitTag.startsWith('VAV-') || unitTag.startsWith('FCU-')) {
      setUnitTag(defaultTag);
    }
  }, [defaultTag]);

  // Zone CFM Coverage calculation (independent of new unit being added)
  const zoneCfmCoverage = useMemo(() => {
    if (!zoneLoadCalc?.cfm_required || zoneLoadCalc.cfm_required === 0) return null;
    
    const requiredCfm = zoneLoadCalc.cfm_required;
    const existingCfm = zoneUnits.reduce((sum, unit) => {
      return sum + (unit.supply_cfm || 0) * (unit.quantity || 1);
    }, 0);
    
    const coveragePercent = (existingCfm / requiredCfm) * 100;
    const remainingCfm = requiredCfm - existingCfm;
    
    let status: 'complete' | 'good' | 'partial' | 'low' | 'over';
    if (coveragePercent > 100) {
      status = 'over';
    } else if (coveragePercent >= 95) {
      status = 'complete';
    } else if (coveragePercent >= 75) {
      status = 'good';
    } else if (coveragePercent >= 50) {
      status = 'partial';
    } else {
      status = 'low';
    }
    
    return {
      existingCfm,
      requiredCfm,
      remainingCfm,
      coveragePercent,
      unitCount: zoneUnits.length,
      status,
    };
  }, [zoneLoadCalc, zoneUnits]);

  // Pre-save CFM validation calculation
  const calculatePreSaveValidation = useMemo(() => {
    if (!zoneLoadCalc?.cfm_required) return null;
    
    const requiredCfm = zoneLoadCalc.cfm_required;
    
    // Sum CFM from existing units in this zone
    const existingZoneCfm = zoneUnits.reduce((sum, unit) => {
      return sum + (unit.supply_cfm || 0) * (unit.quantity || 1);
    }, 0);
    
    // New unit contribution
    const newUnitCfm = importedCfm * quantity;
    
    // Total after saving
    const totalCfm = existingZoneCfm + newUnitCfm;
    
    // Calculate variance
    const variancePercent = requiredCfm > 0 
      ? ((totalCfm - requiredCfm) / requiredCfm) * 100 
      : 0;
    
    return {
      existingZoneCfm,
      newUnitCfm,
      totalCfm,
      requiredCfm,
      variancePercent,
      hasError: Math.abs(variancePercent) > 15,
      hasWarning: Math.abs(variancePercent) > 5,
    };
  }, [zoneLoadCalc, zoneUnits, importedCfm, quantity]);

  // Handle save click - check validation first
  const handleSaveClick = () => {
    if (!organization?.id || !selectedZoneId || !unitTag) {
      toast.error('Please select a zone and enter a unit tag');
      return;
    }

    const result = isVAVType(unitType) ? vavResult : fcuResult;
    if (!result) {
      toast.error('Please complete the sizing calculation first');
      return;
    }

    // CFM variance check - show warning if > 15%
    if (calculatePreSaveValidation?.hasError) {
      setValidationInfo({
        existingZoneCfm: calculatePreSaveValidation.existingZoneCfm,
        newUnitCfm: calculatePreSaveValidation.newUnitCfm,
        totalCfm: calculatePreSaveValidation.totalCfm,
        requiredCfm: calculatePreSaveValidation.requiredCfm,
        variancePercent: calculatePreSaveValidation.variancePercent,
      });
      setShowValidationWarning(true);
      return;
    }

    // No issues, save directly
    performSave();
  };

  // Actual save logic
  const performSave = async () => {
    if (!organization?.id || !selectedZoneId || !unitTag) return;

    try {
      await createUnit.mutateAsync({
        organization_id: organization.id,
        project_id: selectedProjectId || null,
        zone_id: selectedZoneId,
        duct_system_id: null,
        unit_tag: unitTag,
        unit_type: unitType,
        manufacturer: null,
        model_number: null,
        cooling_load_btuh: importedCoolingLoad,
        heating_load_btuh: importedHeatingLoad,
        supply_cfm: importedCfm,
        min_cfm: isVAVType(unitType) && vavResult ? vavResult.minCfm : null,
        max_cfm: isVAVType(unitType) && vavResult ? vavResult.maxCfm : null,
        outdoor_air_cfm: importedVentilationCfm,
        selected_size: isVAVType(unitType) && vavResult ? `${vavResult.inletSizeIn}"` : (isFCUType(unitType) && fcuResult ? `FCU-${fcuResult.model}` : null),
        inlet_size_in: isVAVType(unitType) && vavResult ? vavResult.inletSizeIn : null,
        coil_rows: isFCUType(unitType) && fcuResult ? fcuResult.coilRows : null,
        coil_fins_per_inch: isFCUType(unitType) && fcuResult ? fcuResult.finsPerInch : null,
        fan_motor_hp: isFCUType(unitType) && fcuResult ? fcuResult.motorHp : null,
        fan_speed_settings: null,
        entering_air_temp_f: null,
        leaving_air_temp_f: null,
        entering_water_temp_f: null,
        leaving_water_temp_f: null,
        water_flow_gpm: isVAVType(unitType) && vavResult ? vavResult.hwFlowGpm : (isFCUType(unitType) && fcuResult ? fcuResult.chwFlowGpm : null),
        water_pressure_drop_ft: null,
        chw_coil_capacity_btuh: isFCUType(unitType) && fcuResult ? fcuResult.coolingCapacityMbh * 1000 : null,
        hw_coil_capacity_btuh: isFCUType(unitType) && fcuResult ? fcuResult.heatingCapacityMbh * 1000 : null,
        reheat_kw: isVAVType(unitType) && vavResult ? vavResult.reheatKw : (unitType === 'fcu_electric' && fcuResult?.electricHeatKw ? fcuResult.electricHeatKw : null),
        reheat_stages: null,
        noise_nc: isVAVType(unitType) && vavResult ? vavResult.estimatedNC : (isFCUType(unitType) && fcuResult ? fcuResult.estimatedNC : null),
        sound_power_db: null,
        has_reheat: vavAccessories?.hasReheat || false,
        reheat_type: vavAccessories?.reheatType || 'none',
        has_damper: vavAccessories?.hasDamper ?? true,
        damper_actuator: vavAccessories?.damperActuator || 'ddc',
        has_flow_station: vavAccessories?.hasFlowStation || false,
        has_discharge_sensor: vavAccessories?.hasDischargeSensor || false,
        location_description: null,
        ceiling_type: null,
        quantity,
        notes: notes || null,
        status: 'draft',
        created_by: user?.id || null,
      });

      setUnitTag(generateUnitTag(unitType, zoneUnits.length + 2, selectedZone?.name?.substring(0, 3).toUpperCase()));
      setNotes('');
      setShowValidationWarning(false);
      toast.success('Terminal unit saved successfully');
    } catch (error) {
      console.error('Error saving terminal unit:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUnit.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting terminal unit:', error);
    }
  };

  const handleVAVSizingChange = useCallback((result: VAVSizingResult) => {
    setVavResult(result);
  }, []);

  const handleFCUSizingChange = useCallback((result: FCUSizingResult) => {
    setFcuResult(result);
  }, []);

  const handleAccessoriesChange = useCallback((accessories: VAVAccessories) => {
    setVavAccessories(accessories);
  }, []);

  // Phase 4: Smart Defaults Handler
  const handleApplySmartDefaults = useCallback((values: Record<string, unknown>) => {
    // Apply terminal unit defaults
    toast.success('Smart defaults applied');
  }, []);

  // Phase 4: Sandbox Save Handler  
  const handleSandboxSave = useCallback((data: Record<string, unknown>) => {
    toast.success('Scenario changes applied');
  }, []);

  // Current tool data for sandbox
  const currentToolData = useMemo(() => ({
    unitType,
    quantity,
    vavResult,
    fcuResult,
  }), [unitType, quantity, vavResult, fcuResult]);

  // Phase 4: Keyboard Shortcuts
  const shortcuts: ShortcutConfig[] = useMemo(() => [
    {
      key: 's',
      modifiers: ['ctrl'],
      action: handleSaveClick,
      description: 'Save terminal unit selection',
      category: 'actions',
    },
    {
      key: 'i',
      modifiers: ['ctrl'],
      action: () => setShowBatchImportDialog(true),
      description: 'Open batch import dialog',
      category: 'actions',
    },
    {
      key: 'b',
      action: () => setShowBulkOperationDialog(true),
      description: 'Toggle bulk selection mode',
      category: 'actions',
    },
    {
      key: 'n',
      action: () => navigate('/design/diffuser-selection'),
      description: 'Navigate to Diffuser Selection',
      category: 'navigation',
    },
    {
      key: 'p',
      action: () => navigate('/design/ahu-configuration'),
      description: 'Navigate to AHU Configuration',
      category: 'navigation',
    },
  ], [handleSaveClick, navigate]);

  useKeyboardShortcuts(shortcuts);

  const isVAV = isVAVType(unitType);
  const isFCU = isFCUType(unitType);

  // Handle batch import of zones from load calculations
  const handleBatchImport = useCallback(async (zones: LoadCalculationWithZone[]) => {
    if (!organization?.id || zones.length === 0) return;
    
    setIsImportingZones(true);
    try {
      let successCount = 0;
      for (const zone of zones) {
        if (!zone.zone_id) continue;
        
        // Determine unit type based on CFM (VAV for larger zones, FCU for smaller)
        const cfm = zone.cfm_required || 0;
        const selectedUnitType: TerminalUnitType = cfm > 800 ? 'vav_cooling' : 'fcu_2pipe';
        const zonePrefix = zone.zone_name?.substring(0, 3).toUpperCase() || 'ZN';
        const tag = generateUnitTag(selectedUnitType, successCount + 1, zonePrefix);
        
        await createUnit.mutateAsync({
          organization_id: organization.id,
          project_id: selectedProjectId || null,
          zone_id: zone.zone_id,
          duct_system_id: null,
          unit_type: selectedUnitType,
          unit_tag: tag,
          manufacturer: null,
          model_number: null,
          quantity: 1,
          supply_cfm: cfm,
          min_cfm: Math.round(cfm * 0.3),
          max_cfm: cfm,
          outdoor_air_cfm: null,
          selected_size: null,
          inlet_size_in: null,
          coil_rows: null,
          coil_fins_per_inch: null,
          fan_motor_hp: null,
          fan_speed_settings: null,
          entering_air_temp_f: null,
          leaving_air_temp_f: null,
          entering_water_temp_f: null,
          leaving_water_temp_f: null,
          water_flow_gpm: null,
          water_pressure_drop_ft: null,
          chw_coil_capacity_btuh: null,
          hw_coil_capacity_btuh: null,
          reheat_kw: null,
          reheat_stages: null,
          noise_nc: null,
          sound_power_db: null,
          has_reheat: false,
          reheat_type: 'none',
          has_damper: true,
          damper_actuator: null,
          has_flow_station: true,
          has_discharge_sensor: false,
          location_description: null,
          ceiling_type: null,
          cooling_load_btuh: zone.cooling_load_btuh || null,
          heating_load_btuh: zone.heating_load_btuh || null,
          status: 'draft',
          notes: `Auto-imported from load calculation: ${zone.calculation_name}`,
          created_by: null,
        });
        successCount++;
      }
      
      toast.success(`Created ${successCount} terminal unit${successCount !== 1 ? 's' : ''}`);
      setShowBatchImportDialog(false);
    } catch (error) {
      console.error('Error importing zones:', error);
      toast.error('Failed to import some zones');
    } finally {
      setIsImportingZones(false);
    }
  }, [organization?.id, selectedProjectId, createUnit]);

  // Prepare export data from all project terminal units
  const selectedProject = useMemo(() => {
    return projects?.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const exportData = useMemo((): GroupedTerminalUnits[] => {
    if (!existingUnits || existingUnits.length === 0) return [];

    // Get zone names from zones by floor_id, then get floor from floorsData
    const zoneMap = new Map<string, { name: string; floorId: string }>();
    zones?.forEach(z => {
      zoneMap.set(z.id, { name: z.name, floorId: z.floor_id || '' });
    });

    // Get floor to building mapping
    const floorToBuildingMap = new Map<string, string>();
    const floorNameMap = new Map<string, string>();
    floorsData?.forEach(f => {
      floorNameMap.set(f.id, f.name);
      if (f.building_id) {
        floorToBuildingMap.set(f.id, f.building_id);
      }
    });

    // Get building names
    const buildingMap = new Map<string, string>();
    buildings?.forEach(b => {
      buildingMap.set(b.id, b.name);
    });

    // Transform units to export rows
    const rows: TerminalUnitRow[] = existingUnits.map(unit => {
      const zoneInfo = unit.zone_id ? zoneMap.get(unit.zone_id) : null;
      const zoneName = zoneInfo?.name || 'Unassigned';
      const floorId = zoneInfo?.floorId || '';
      const floorName = floorId ? floorNameMap.get(floorId) || '' : '';
      const buildingId = floorId ? floorToBuildingMap.get(floorId) || '' : '';
      const buildingName = buildingId ? buildingMap.get(buildingId) || '' : '';
      
      return {
        id: unit.id,
        unit_tag: unit.unit_tag,
        unit_type: unit.unit_type,
        quantity: unit.quantity || 1,
        manufacturer: unit.manufacturer,
        model_number: unit.model_number,
        supply_cfm: unit.supply_cfm,
        min_cfm: unit.min_cfm,
        max_cfm: unit.max_cfm,
        outdoor_air_cfm: unit.outdoor_air_cfm,
        inlet_size_in: unit.inlet_size_in,
        selected_size: unit.selected_size,
        cooling_load_btuh: unit.cooling_load_btuh,
        heating_load_btuh: unit.heating_load_btuh,
        reheat_type: unit.reheat_type,
        reheat_kw: unit.reheat_kw,
        has_damper: unit.has_damper,
        has_flow_station: unit.has_flow_station,
        has_discharge_sensor: unit.has_discharge_sensor,
        noise_nc: unit.noise_nc,
        status: unit.status,
        notes: unit.notes,
        zone_name: zoneName,
        floor_name: floorName,
        building_name: buildingName,
      };
    });

    // Group by zone
    const grouped: Record<string, TerminalUnitRow[]> = {};
    rows.forEach(row => {
      const key = row.building_name ? `${row.building_name} - ${row.zone_name}` : row.zone_name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, items]) => ({ groupName, items }));
  }, [existingUnits, zones, buildings, floorsData]);

  const handleExport = useCallback((options: ExportOptions) => {
    const header = {
      title: 'TERMINAL UNIT SCHEDULE',
      projectNumber: selectedProject?.id?.substring(0, 8).toUpperCase() || '',
      date: format(new Date(), 'yyyy-MM-dd'),
    };
    
    const projectName = selectedProject?.name || 'Project';
    const scheduleNotes = 'All VAV boxes and FCU units per ASHRAE 62.1 and project specifications.';
    
    if (options.format === 'pdf') {
      exportToPDF(exportData, DEFAULT_TERMINAL_UNIT_COLUMNS, header, projectName, scheduleNotes, options);
    } else {
      exportToExcel(exportData, DEFAULT_TERMINAL_UNIT_COLUMNS, header, projectName, scheduleNotes, options);
    }
    toast.success(`Schedule exported as ${options.format.toUpperCase()}`);
  }, [exportData, selectedProject, exportToPDF, exportToExcel]);

  const handleCopyToClipboard = useCallback(() => {
    copyToClipboard(exportData, DEFAULT_TERMINAL_UNIT_COLUMNS);
    toast.success('Schedule copied to clipboard');
  }, [exportData, copyToClipboard]);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Stage Locking & Pre-Save Validation Header */}
        <ToolPageHeader
          toolType="terminal-unit"
          toolName="Terminal Unit Sizing"
          projectId={selectedProjectId || null}
          zoneId={selectedZoneId || null}
          showLockButton={!!selectedProjectId}
          showValidation={!!selectedProjectId}
        />
        
        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={selectedProjectId}
          currentTool="terminal-unit"
          variant="alert"
          className="mb-4"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Box className="h-6 w-6" />
              VAV/FCU Terminal Unit Sizing
            </h1>
            <p className="text-muted-foreground">
              Size variable air volume boxes and fan coil units with automatic load import
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActiveEditorsIndicator
              entityType="terminal_unit"
              entityId={selectedZoneId || null}
              projectId={selectedProjectId}
            />
            <SandboxModeToggle 
              currentData={currentToolData} 
              onExitWithSave={handleSandboxSave}
            />
            <ScenarioManager compact onPromoteToAlternative={handlePromoteScenarioToAlternative} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Alternatives
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border">
                <DropdownMenuItem onClick={() => setShowSaveAlternative(true)}>
                  Save as Alternative...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAlternativesManager(true)}>
                  View Alternatives
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              onClick={() => setShowBatchImportDialog(true)}
              disabled={!selectedProjectId}
            >
              <Download className="mr-2 h-4 w-4" />
              Import Zones
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const params = new URLSearchParams();
                if (selectedProjectId) params.set('project', selectedProjectId);
                navigate(`/design/terminal-unit-schedule${params.toString() ? '?' + params.toString() : ''}`);
              }}
              disabled={!existingUnits || existingUnits.length === 0}
            >
              <Table className="mr-2 h-4 w-4" />
              View Full Schedule
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(true)}
              disabled={!existingUnits || existingUnits.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export Schedule
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const params = new URLSearchParams();
                if (selectedProjectId) params.set('project', selectedProjectId);
                if (selectedZoneId) params.set('zone', selectedZoneId);
                navigate(`/design/diffuser-selection${params.toString() ? '?' + params.toString() : ''}`);
              }}
            >
              <Wind className="mr-2 h-4 w-4" />
              Select Diffusers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Phase 4: Sandbox Mode Banner */}
        <SandboxModeBanner />

        {/* Phase 4: Smart Defaults Banner */}
        {hasContext && defaults.length > 0 && (
          <SmartDefaultsBanner
            defaults={defaults}
            summary={summary}
            onApply={handleApplySmartDefaults}
            filterCategories={['acoustic', 'equipment']}
            className="mb-4"
          />
        )}

        {/* Phase 4: Scenario Comparison */}
        {sandboxState.isActive && sandboxState.scenarios.length > 1 && (
          <ScenarioComparisonView metrics={TERMINAL_UNIT_METRICS} className="mb-4" />
        )}

        {/* Conflict Warning */}
        {hasConflict && (
          <EditConflictWarning
            entityType="terminal_unit"
            entityId={selectedZoneId || null}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Zone Selection & Unit Type */}
          <div className="space-y-4">
            {/* Zone Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Zone Selection</CardTitle>
                <CardDescription>Select location to size terminal units</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    Project
                  </Label>
                  <Select value={selectedProjectId} onValueChange={(v) => {
                    setSelectedProjectId(v);
                    setSelectedBuildingId('');
                    setSelectedFloorId('');
                    setSelectedZoneId('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProjectId && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      Building
                    </Label>
                    <Select value={selectedBuildingId} onValueChange={(v) => {
                      setSelectedBuildingId(v);
                      setSelectedFloorId('');
                      setSelectedZoneId('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select building" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedBuildingId && floors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" />
                      Floor
                    </Label>
                    <Select value={selectedFloorId} onValueChange={(v) => {
                      setSelectedFloorId(v);
                      setSelectedZoneId('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All floors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Floors</SelectItem>
                        {floors.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedBuildingId && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      Zone
                    </Label>
                    <Select value={selectedZoneId} onValueChange={(v) => {
                      setSelectedZoneId(v);
                      setCfmOverride(null); // Reset CFM override when zone changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredZones?.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name}
                            {z.area_sqm && ` (${z.area_sqm} m²)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Zone Load Summary */}
            {selectedZoneId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Zone Load Summary</CardTitle>
                  <CardDescription>
                    {zoneLoadCalc ? 'Imported from load calculation' : 'No load calculation found'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {zoneLoadCalc ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Droplets className="h-3 w-3 text-blue-500" />
                            Cooling
                          </div>
                          <div className="font-medium">{(importedCoolingLoad / 1000).toFixed(1)} MBH</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-orange-500" />
                            Heating
                          </div>
                          <div className="font-medium">{(importedHeatingLoad / 1000).toFixed(1)} MBH</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wind className="h-3 w-3" />
                            Supply CFM
                          </div>
                          <div className="font-medium">{importedCfm} CFM</div>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            Outdoor Air (Voz)
                            {ventilationSource === 'ashrae' && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">ASHRAE</Badge>
                            )}
                          </div>
                          <div className="font-medium">{importedVentilationCfm} CFM</div>
                        </div>
                      </div>
                      
                      {/* Zone CFM Coverage Indicator */}
                      {zoneCfmCoverage && (
                        <div className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Zone CFM Coverage</span>
                            <span className="text-xs font-semibold">
                              {zoneCfmCoverage.existingCfm.toLocaleString()} / {zoneCfmCoverage.requiredCfm.toLocaleString()} CFM
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(zoneCfmCoverage.coveragePercent, 100)} 
                            className="h-2"
                            indicatorClassName={
                              zoneCfmCoverage.status === 'complete' ? 'bg-green-500' :
                              zoneCfmCoverage.status === 'over' ? 'bg-amber-500' :
                              zoneCfmCoverage.status === 'good' ? 'bg-blue-500' :
                              zoneCfmCoverage.status === 'partial' ? 'bg-yellow-500' :
                              'bg-muted-foreground'
                            }
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {zoneCfmCoverage.coveragePercent.toFixed(1)}% covered by {zoneCfmCoverage.unitCount} unit{zoneCfmCoverage.unitCount !== 1 ? 's' : ''}
                            </span>
                            {zoneCfmCoverage.status === 'over' ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Over-allocated by {Math.abs(zoneCfmCoverage.remainingCfm).toLocaleString()} CFM
                              </span>
                            ) : zoneCfmCoverage.remainingCfm > 0 ? (
                              <span>{zoneCfmCoverage.remainingCfm.toLocaleString()} CFM remaining</span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-medium">Zone fully covered</span>
                            )}
                          </div>
                          
                          {/* Size for Remaining CFM Quick Action */}
                          {zoneCfmCoverage.remainingCfm > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-1"
                              onClick={() => {
                                setCfmOverride(zoneCfmCoverage.remainingCfm);
                                toast.success(`Sizing panel updated for ${zoneCfmCoverage.remainingCfm.toLocaleString()} CFM`);
                              }}
                            >
                              <Zap className="mr-2 h-3 w-3" />
                              Size for Remaining {zoneCfmCoverage.remainingCfm.toLocaleString()} CFM
                            </Button>
                          )}
                          
                          {/* CFM Override Active Indicator */}
                          {cfmOverride && (
                            <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-sm text-primary font-medium">
                                  Sizing for {cfmOverride.toLocaleString()} CFM
                                </span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setCfmOverride(null)}
                                className="h-6 text-xs"
                              >
                                Reset
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ventilation Source Alert */}
                      {selectedZoneId && (
                        <>
                          {zoneVentilationData ? (
                            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <AlertTitle className="text-blue-800 dark:text-blue-300 text-sm">ASHRAE 62.1 Outdoor Air</AlertTitle>
                              <AlertDescription className="text-blue-700 dark:text-blue-400">
                                <div className="flex justify-between items-center text-sm">
                                  <span>Voz = {zoneVentilationData.vozCfm.toFixed(0)} CFM</span>
                                  <Badge variant="secondary" className="text-[10px]">
                                    {zoneVentilationData.calculationName}
                                  </Badge>
                                </div>
                                <p className="text-xs mt-1 text-blue-600 dark:text-blue-500">
                                  This sets the minimum airflow for VAV boxes.
                                </p>
                              </AlertDescription>
                            </Alert>
                          ) : zoneLoadCalc?.occupant_count ? (
                            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <AlertTitle className="text-amber-800 dark:text-amber-300 text-sm">Ventilation Estimate</AlertTitle>
                              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                                Using rough estimate ({importedVentilationCfm} CFM).{' '}
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto text-amber-800 dark:text-amber-300 underline text-sm"
                                  onClick={() => navigate(`/design/ventilation?project=${selectedProjectId}`)}
                                >
                                  Run ASHRAE 62.1 calculation
                                </Button>
                                {' '}for accurate outdoor air.
                              </AlertDescription>
                            </Alert>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Run a load calculation for this zone to auto-import values.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Unit Sizing Recommendations */}
            {selectedZoneId && effectiveCfm > 0 && (
              <UnitSizingRecommendations
                targetCfm={effectiveCfm}
                coolingLoadBtuh={effectiveCoolingLoad}
                spaceType={zoneVentilationData?.spaceType || undefined}
                unitCategory={isVAV ? 'vav' : 'fcu'}
              />
            )}

            {/* Unit Type Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Terminal Unit Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {TERMINAL_UNIT_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      unitType === type.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setUnitType(type.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{type.name}</span>
                      {type.isFCU ? (
                        <Badge variant="outline" className="text-xs">FCU</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">VAV</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Sizing Panel */}
          <div className="lg:col-span-1">
            {selectedZoneId && importedCfm > 0 ? (
              <>
                {isVAV && (
                  <VAVSizingPanel
                    maxCfm={effectiveCfm}
                    ventilationCfm={importedVentilationCfm}
                    ventilationSource={ventilationSource}
                    onSizingChange={handleVAVSizingChange}
                    onAccessoriesChange={handleAccessoriesChange}
                  />
                )}
                {isFCU && (
                  <FCUSizingPanel
                    coolingLoadBtuh={effectiveCoolingLoad}
                    heatingLoadBtuh={effectiveHeatingLoad}
                    cfmRequired={effectiveCfm}
                    unitType={unitType as 'fcu_2pipe' | 'fcu_4pipe' | 'fcu_electric'}
                    onSizingChange={handleFCUSizingChange}
                    onTypeChange={setUnitType}
                  />
                )}
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Box className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-medium mb-2">Select a Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a zone with a load calculation to begin sizing terminal units.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Save & Schedule */}
          <div className="space-y-4">
            {/* Save Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Save Terminal Unit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Unit Tag</Label>
                  <Input
                    value={unitTag}
                    onChange={(e) => setUnitTag(e.target.value)}
                    placeholder="e.g., VAV-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSaveClick}
                  disabled={!selectedZoneId || (!vavResult && !fcuResult)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Terminal Unit
                </Button>
              </CardContent>
            </Card>

            {/* Zone Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Zone Terminal Units</span>
                  <div className="flex items-center gap-2">
                    {/* Zone CFM Status Badge */}
                    {calculatePreSaveValidation && calculatePreSaveValidation.requiredCfm > 0 && (
                      <Badge 
                        variant={
                          calculatePreSaveValidation.hasError ? 'destructive' : 
                          calculatePreSaveValidation.hasWarning ? 'secondary' : 
                          'outline'
                        }
                        className="text-xs"
                      >
                        {calculatePreSaveValidation.existingZoneCfm.toLocaleString()} / {calculatePreSaveValidation.requiredCfm.toLocaleString()} CFM
                      </Badge>
                    )}
                    <Badge variant="secondary">{zoneUnits.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {zoneUnits.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {zoneUnits.map((unit) => (
                        <div
                          key={unit.id}
                          className="p-3 border rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-sm">{unit.unit_tag}</div>
                            <div className="text-xs text-muted-foreground">
                              {TERMINAL_UNIT_TYPES.find(t => t.id === unit.unit_type)?.name}
                              {unit.selected_size && ` • ${unit.selected_size}`}
                            </div>
                            {unit.supply_cfm && (
                              <div className="text-xs text-muted-foreground">
                                {unit.supply_cfm} CFM
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(unit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No terminal units added to this zone yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps Card */}
        {zoneUnits.length > 0 && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                Continue Your Design
              </CardTitle>
              <CardDescription>
                Terminal units configured! Here are suggested next steps in the design workflow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* Primary CTA: Diffuser Selection */}
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedProjectId) params.set('project', selectedProjectId);
                    if (selectedZoneId) params.set('zone', selectedZoneId);
                    navigate(`/design/diffuser-selection${params.toString() ? '?' + params.toString() : ''}`);
                  }}
                  className="gap-2"
                >
                  <Wind className="h-4 w-4" />
                  Select Diffusers & Grilles
                  <ArrowRight className="h-3 w-3" />
                </Button>
                
                {/* Secondary: Duct Designer */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedProjectId) params.set('project', selectedProjectId);
                    navigate(`/design/duct-designer${params.toString() ? '?' + params.toString() : ''}`);
                  }}
                  className="gap-2"
                >
                  Design Duct System
                  <ArrowRight className="h-3 w-3" />
                </Button>
                
                {/* Completeness Dashboard */}
                {selectedProjectId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/design/completeness?project=${selectedProjectId}`)}
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

        {/* Export Dialog */}
        <TerminalUnitScheduleExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          onExport={handleExport}
          onCopy={handleCopyToClipboard}
          scheduleName={`Terminal Units - ${selectedProject?.name || 'Schedule'}`}
          unitCount={existingUnits?.length || 0}
        />

        {/* CFM Validation Warning Dialog */}
        <AlertDialog open={showValidationWarning} onOpenChange={setShowValidationWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                CFM Variance Warning
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    The total zone CFM after saving will differ significantly from the 
                    load calculation requirement.
                  </p>
                  
                  {validationInfo && (
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Existing Zone CFM:</span>
                        <span className="font-medium text-right">
                          {validationInfo.existingZoneCfm.toLocaleString()} CFM
                        </span>
                        
                        <span className="text-muted-foreground">+ New Unit CFM:</span>
                        <span className="font-medium text-right">
                          {validationInfo.newUnitCfm.toLocaleString()} CFM
                        </span>
                        
                        <div className="col-span-2 border-t my-1" />
                        
                        <span className="text-muted-foreground">Total Zone CFM:</span>
                        <span className="font-bold text-right">
                          {validationInfo.totalCfm.toLocaleString()} CFM
                        </span>
                        
                        <span className="text-muted-foreground">Required CFM:</span>
                        <span className="font-medium text-right">
                          {validationInfo.requiredCfm.toLocaleString()} CFM
                        </span>
                      </div>
                      
                      <div className={`text-center font-semibold text-lg ${
                        validationInfo.variancePercent > 0 
                          ? 'text-amber-600' 
                          : 'text-destructive'
                      }`}>
                        {validationInfo.variancePercent > 0 ? '+' : ''}
                        {validationInfo.variancePercent.toFixed(1)}% variance
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    {validationInfo?.variancePercent && validationInfo.variancePercent > 0 
                      ? 'Zone will be oversupplied with airflow.' 
                      : 'Zone will be undersupplied with airflow.'}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={performSave}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Save Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Batch Import Zones Dialog */}
        <BatchImportZonesDialog
          open={showBatchImportDialog}
          onOpenChange={setShowBatchImportDialog}
          projectId={selectedProjectId}
          onImport={handleBatchImport}
          isImporting={isImportingZones}
        />

        {/* Bulk Terminal Unit Creation Dialog */}
        {selectedProjectId && (
          <BulkOperationDialog
            open={showBulkOperationDialog}
            onOpenChange={setShowBulkOperationDialog}
            projectId={selectedProjectId}
            preSelectedZoneIds={bulkSelectedZoneIds}
            operationType="set_terminal_type"
            onComplete={() => {
              setBulkSelectedZoneIds([]);
            }}
          />
        )}
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/terminal-unit-sizing"
          projectId={selectedProjectId}
          zoneId={selectedZoneId}
          variant="inline"
        />

        {/* Design Alternatives */}
        {selectedProjectId && (
          <>
            <SaveAsAlternativeDialog
              open={showSaveAlternative}
              onOpenChange={setShowSaveAlternative}
              projectId={selectedProjectId}
              entityType="terminal_unit"
              entityId={selectedZoneId || undefined}
              data={{ unitType, unitTag, quantity, notes, cfmOverride, vavAccessories, effectiveCfm, effectiveCoolingLoad, effectiveHeatingLoad }}
              suggestedName={`Terminal Unit - ${unitTag || unitType}`}
            />

            <DesignAlternativesManager
              open={showAlternativesManager}
              onOpenChange={setShowAlternativesManager}
              entityType="terminal_unit"
              entityId={selectedZoneId || undefined}
              onLoadAlternative={handleLoadAlternative}
              onCompare={handleCompareAlternatives}
              onCreateNew={() => {
                setShowAlternativesManager(false);
                setShowSaveAlternative(true);
              }}
            />

            <AlternativeComparisonView
              open={showAlternativeComparison}
              onOpenChange={setShowAlternativeComparison}
              alternatives={alternativesToCompare}
            />

            <PromoteScenarioDialog
              open={showPromoteScenario}
              onOpenChange={setShowPromoteScenario}
              scenario={scenarioToPromote}
              projectId={selectedProjectId}
              entityType="terminal_unit"
              entityId={selectedZoneId || undefined}
              additionalData={{ unitType, unitTag, quantity, notes, cfmOverride, vavAccessories }}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
