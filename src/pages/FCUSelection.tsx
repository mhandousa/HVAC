import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { useTerminalUnitSelections, useCreateTerminalUnitSelection } from '@/hooks/useTerminalUnitSelections';
import { useProfile } from '@/hooks/useOrganization';
import { useTerminalUnitScheduleExport, DEFAULT_TERMINAL_UNIT_COLUMNS, GroupedTerminalUnits, TerminalUnitRow } from '@/hooks/useTerminalUnitScheduleExport';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { DataFlowImportHandler, ImportLoadData } from '@/components/design/DataFlowImportHandler';
import { BatchImportZonesDialog } from '@/components/design/BatchImportZonesDialog';
import { LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { useQueryClient } from '@tanstack/react-query';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { Box, ArrowLeft, Search, AlertTriangle, CheckCircle2, Save, Table, BarChart3, Snowflake, Flame, Volume2, Droplets, Download, Loader2, FileText, FileSpreadsheet, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';

// FCU catalog data
const FCU_CATALOG = [
  // 2-pipe ceiling units
  { manufacturer: 'Carrier', model: '42CWC-02', cfm: 200, coolingTons: 0.5, heatingMbh: 0, pipeConfig: '2-pipe', mounting: 'ceiling', motorHp: 0.1, ncRating: 28 },
  { manufacturer: 'Carrier', model: '42CWC-04', cfm: 400, coolingTons: 1.0, heatingMbh: 0, pipeConfig: '2-pipe', mounting: 'ceiling', motorHp: 0.17, ncRating: 32 },
  { manufacturer: 'Carrier', model: '42CWC-06', cfm: 600, coolingTons: 1.5, heatingMbh: 0, pipeConfig: '2-pipe', mounting: 'ceiling', motorHp: 0.25, ncRating: 35 },
  { manufacturer: 'Carrier', model: '42CWC-08', cfm: 800, coolingTons: 2.0, heatingMbh: 0, pipeConfig: '2-pipe', mounting: 'ceiling', motorHp: 0.33, ncRating: 38 },
  // 4-pipe ceiling units
  { manufacturer: 'Trane', model: 'FCC-04', cfm: 400, coolingTons: 1.0, heatingMbh: 20, pipeConfig: '4-pipe', mounting: 'ceiling', motorHp: 0.17, ncRating: 30 },
  { manufacturer: 'Trane', model: 'FCC-06', cfm: 600, coolingTons: 1.5, heatingMbh: 30, pipeConfig: '4-pipe', mounting: 'ceiling', motorHp: 0.25, ncRating: 33 },
  { manufacturer: 'Trane', model: 'FCC-08', cfm: 800, coolingTons: 2.0, heatingMbh: 40, pipeConfig: '4-pipe', mounting: 'ceiling', motorHp: 0.33, ncRating: 36 },
  { manufacturer: 'Trane', model: 'FCC-10', cfm: 1000, coolingTons: 2.5, heatingMbh: 50, pipeConfig: '4-pipe', mounting: 'ceiling', motorHp: 0.5, ncRating: 38 },
  // Floor-mounted units
  { manufacturer: 'Daikin', model: 'FWF-02', cfm: 200, coolingTons: 0.5, heatingMbh: 10, pipeConfig: '4-pipe', mounting: 'floor', motorHp: 0.1, ncRating: 25 },
  { manufacturer: 'Daikin', model: 'FWF-04', cfm: 400, coolingTons: 1.0, heatingMbh: 20, pipeConfig: '4-pipe', mounting: 'floor', motorHp: 0.17, ncRating: 28 },
  { manufacturer: 'Daikin', model: 'FWF-06', cfm: 600, coolingTons: 1.5, heatingMbh: 30, pipeConfig: '4-pipe', mounting: 'floor', motorHp: 0.25, ncRating: 32 },
  // Ducted units
  { manufacturer: 'York', model: 'YHF-08', cfm: 800, coolingTons: 2.0, heatingMbh: 40, pipeConfig: '4-pipe', mounting: 'ducted', motorHp: 0.33, ncRating: 35 },
  { manufacturer: 'York', model: 'YHF-12', cfm: 1200, coolingTons: 3.0, heatingMbh: 60, pipeConfig: '4-pipe', mounting: 'ducted', motorHp: 0.5, ncRating: 38 },
  { manufacturer: 'York', model: 'YHF-16', cfm: 1600, coolingTons: 4.0, heatingMbh: 80, pipeConfig: '4-pipe', mounting: 'ducted', motorHp: 0.75, ncRating: 40 },
];

type PipeConfig = '2-pipe' | '4-pipe';
type MountingType = 'ceiling' | 'floor' | 'ducted';

export default function FCUSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: profile } = useProfile();
  
  const projectId = searchParams.get('project') || '';
  const { data: projects } = useProjects();
  const { data: existingUnits } = useTerminalUnitSelections(projectId);
  const createUnitMutation = useCreateTerminalUnitSelection();
  const { exportToPDF, exportToExcel } = useTerminalUnitScheduleExport();
  const queryClient = useQueryClient();
  
  // Pre-save validation with stage locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(projectId || null, 'fcu-selection', { checkStageLock: true });
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [selectedFcuId, setSelectedFcuId] = useState<string | null>(null);
  const [unitTag, setUnitTag] = useState('');
  
  // Batch import state
  const [showBatchImportDialog, setShowBatchImportDialog] = useState(false);
  const [isImportingZones, setIsImportingZones] = useState(false);
  
  // FCU requirements
  const [coolingLoadBtuh, setCoolingLoadBtuh] = useState(12000);
  const [heatingLoadBtuh, setHeatingLoadBtuh] = useState(0);
  const [targetNc, setTargetNc] = useState(35);
  const [pipeConfig, setPipeConfig] = useState<PipeConfig>('4-pipe');
  const [mounting, setMounting] = useState<MountingType>('ceiling');
  const [chwSupplyF, setChwSupplyF] = useState(44);
  const [chwReturnF, setChwReturnF] = useState(56);

  // Concurrent editing awareness
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'fcu_selection',
    entityId: selectedProjectId || null,
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

  // Design Alternatives
  const [showSaveAlternative, setShowSaveAlternative] = useState(false);
  const [showAlternativesManager, setShowAlternativesManager] = useState(false);
  const [showAlternativeComparison, setShowAlternativeComparison] = useState(false);
  const [alternativesToCompare, setAlternativesToCompare] = useState<DesignAlternative[]>([]);

  const handleLoadAlternative = useCallback((data: Record<string, unknown>) => {
    if (data.coolingLoadBtuh) setCoolingLoadBtuh(data.coolingLoadBtuh as number);
    if (data.heatingLoadBtuh !== undefined) setHeatingLoadBtuh(data.heatingLoadBtuh as number);
    if (data.targetNc) setTargetNc(data.targetNc as number);
    if (data.pipeConfig) setPipeConfig(data.pipeConfig as PipeConfig);
    if (data.mounting) setMounting(data.mounting as MountingType);
    if (data.chwSupplyF) setChwSupplyF(data.chwSupplyF as number);
    if (data.chwReturnF) setChwReturnF(data.chwReturnF as number);
    if (data.unitTag) setUnitTag(data.unitTag as string);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);
  // Calculate required tons
  const requiredTons = useMemo(() => coolingLoadBtuh / 12000, [coolingLoadBtuh]);
  const requiredMbh = useMemo(() => heatingLoadBtuh / 1000, [heatingLoadBtuh]);
  
  // Find best FCU
  const rankedFcus = useMemo(() => {
    return FCU_CATALOG
      .filter(fcu => {
        // Check pipe config
        if (fcu.pipeConfig !== pipeConfig) return false;
        // Check mounting type
        if (fcu.mounting !== mounting) return false;
        // Check cooling capacity (must meet requirement)
        if (fcu.coolingTons < requiredTons) return false;
        // Check heating if needed
        if (heatingLoadBtuh > 0 && fcu.heatingMbh < requiredMbh) return false;
        return true;
      })
      .map(fcu => {
        // Calculate fit score
        const coolingOversize = fcu.coolingTons / requiredTons;
        // Best is 100-120% of required
        const coolScore = coolingOversize >= 1 && coolingOversize <= 1.2 
          ? 100 
          : coolingOversize > 1.2 
            ? Math.max(0, 100 - (coolingOversize - 1.2) * 50)
            : 0;
        
        // NC score
        const ncMargin = targetNc - fcu.ncRating;
        const ncScore = ncMargin >= 0 ? 100 - Math.min(ncMargin * 2, 30) : Math.max(0, 100 + ncMargin * 10);
        
        const fitScore = (coolScore * 0.6 + ncScore * 0.4);
        
        return {
          fcu,
          fitScore,
          coolingOversize: (coolingOversize * 100).toFixed(0),
          ncMargin,
          isValid: fcu.coolingTons >= requiredTons && fcu.ncRating <= targetNc,
        };
      })
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [requiredTons, requiredMbh, heatingLoadBtuh, targetNc, pipeConfig, mounting]);
  
  // Filter for display
  const filteredFcus = useMemo(() => {
    let fcus = rankedFcus;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      fcus = fcus.filter(r =>
        r.fcu.manufacturer.toLowerCase().includes(query) ||
        r.fcu.model.toLowerCase().includes(query)
      );
    }
    
    if (showOnlyMatching) {
      fcus = fcus.filter(r => r.isValid);
    }
    
    return fcus;
  }, [rankedFcus, searchQuery, showOnlyMatching]);
  
  const selectedFcu = useMemo(() => {
    if (!selectedFcuId) return null;
    return filteredFcus.find(r => r.fcu.model === selectedFcuId);
  }, [selectedFcuId, filteredFcus]);
  
  const bestMatch = filteredFcus.length > 0 && filteredFcus[0].isValid ? filteredFcus[0] : null;
  
  // Calculate water flow for selected FCU
  const waterFlow = useMemo(() => {
    const fcu = selectedFcu || bestMatch;
    if (!fcu) return 0;
    // GPM = (Tons × 12000) / (500 × ΔT)
    const deltaT = chwReturnF - chwSupplyF;
    return (fcu.fcu.coolingTons * 12000) / (500 * deltaT);
  }, [selectedFcu, bestMatch, chwSupplyF, chwReturnF]);
  
  // Save selection
  const handleSave = async () => {
    if (!profile?.organization_id || !unitTag.trim()) {
      toast.error('Please provide a unit tag');
      return;
    }
    
    const fcuToSave = selectedFcu || bestMatch;
    if (!fcuToSave) {
      toast.error('Please select an FCU');
      return;
    }
    
    await createUnitMutation.mutateAsync({
      organization_id: profile.organization_id,
      project_id: selectedProjectId || null,
      zone_id: null,
      duct_system_id: null,
      unit_tag: unitTag,
      unit_type: pipeConfig === '2-pipe' ? 'fcu_2pipe' : 'fcu_4pipe',
      manufacturer: fcuToSave.fcu.manufacturer,
      model_number: fcuToSave.fcu.model,
      supply_cfm: fcuToSave.fcu.cfm,
      min_cfm: null,
      max_cfm: fcuToSave.fcu.cfm,
      outdoor_air_cfm: 0,
      selected_size: null,
      inlet_size_in: null,
      coil_rows: null,
      coil_fins_per_inch: null,
      fan_motor_hp: fcuToSave.fcu.motorHp,
      fan_speed_settings: 3,
      entering_air_temp_f: null,
      leaving_air_temp_f: null,
      entering_water_temp_f: chwSupplyF,
      leaving_water_temp_f: chwReturnF,
      water_flow_gpm: waterFlow,
      water_pressure_drop_ft: null,
      chw_coil_capacity_btuh: fcuToSave.fcu.coolingTons * 12000,
      hw_coil_capacity_btuh: fcuToSave.fcu.heatingMbh * 1000,
      cooling_load_btuh: coolingLoadBtuh,
      heating_load_btuh: heatingLoadBtuh,
      reheat_kw: null,
      reheat_stages: null,
      noise_nc: fcuToSave.fcu.ncRating,
      sound_power_db: null,
      has_reheat: pipeConfig === '4-pipe',
      reheat_type: 'none',
      has_damper: false,
      damper_actuator: null,
      has_flow_station: false,
      has_discharge_sensor: false,
      location_description: null,
      ceiling_type: mounting,
      quantity: 1,
      notes: null,
      status: 'draft',
      created_by: null,
    });
    
    setUnitTag('');
    toast.success('FCU selection saved');
  };

  // Import handler for DataFlowImportHandler
  const handleImportLoadData = (data: ImportLoadData) => {
    if (data.zoneCount > 0) {
      const avgCoolingBtuh = Math.round(data.totalCoolingTons * 12000 / data.zoneCount);
      const avgHeatingBtuh = Math.round(data.totalHeatingMbh * 1000 / data.zoneCount);
      setCoolingLoadBtuh(avgCoolingBtuh);
      setHeatingLoadBtuh(avgHeatingBtuh);
      toast.success(`Imported ${(avgCoolingBtuh / 12000).toFixed(1)} tons cooling, ${(avgHeatingBtuh / 1000).toFixed(1)} MBH heating`);
    }
  };

  // Filter existing units to show only FCUs
  const existingFcus = useMemo(() => {
    return existingUnits?.filter(u => u.unit_type?.includes('fcu')) || [];
  }, [existingUnits]);

  // Batch import handler
  const handleBatchImport = useCallback(async (zones: LoadCalculationWithZone[]) => {
    if (!profile?.organization_id || zones.length === 0) return;
    
    setIsImportingZones(true);
    try {
      let successCount = 0;
      for (const zone of zones) {
        const cfm = zone.cfm_required || 0;
        const coolingBtuh = zone.cooling_load_btuh || 0;
        const heatingBtuh = zone.heating_load_btuh || 0;
        const zonePrefix = zone.zone_name?.substring(0, 3).toUpperCase() || 'ZN';
        const tag = `FCU-${zonePrefix}-${String(successCount + 1).padStart(2, '0')}`;
        
        // Auto-select best matching FCU (60-80% capacity utilization)
        const requiredTons = coolingBtuh / 12000;
        const matchingFcus = FCU_CATALOG.filter(f => 
          f.coolingTons >= requiredTons && f.pipeConfig === '4-pipe'
        ).sort((a, b) => {
          const oversizeA = a.coolingTons / requiredTons;
          const oversizeB = b.coolingTons / requiredTons;
          // Prefer units at 100-120% of required capacity
          return Math.abs(oversizeA - 1.1) - Math.abs(oversizeB - 1.1);
        });
        
        const selectedFcu = matchingFcus[0] || FCU_CATALOG[FCU_CATALOG.length - 1];
        const deltaT = 12; // Standard CHW delta T
        const waterFlowGpm = (selectedFcu.coolingTons * 12000) / (500 * deltaT);
        
        await createUnitMutation.mutateAsync({
          organization_id: profile.organization_id,
          project_id: selectedProjectId || null,
          zone_id: zone.zone_id || null,
          duct_system_id: null,
          unit_tag: tag,
          unit_type: 'fcu_4pipe',
          manufacturer: selectedFcu.manufacturer,
          model_number: selectedFcu.model,
          supply_cfm: selectedFcu.cfm,
          min_cfm: null,
          max_cfm: selectedFcu.cfm,
          outdoor_air_cfm: 0,
          selected_size: null,
          inlet_size_in: null,
          coil_rows: null,
          coil_fins_per_inch: null,
          fan_motor_hp: selectedFcu.motorHp,
          fan_speed_settings: 3,
          entering_air_temp_f: null,
          leaving_air_temp_f: null,
          entering_water_temp_f: 44,
          leaving_water_temp_f: 56,
          water_flow_gpm: waterFlowGpm,
          water_pressure_drop_ft: null,
          chw_coil_capacity_btuh: selectedFcu.coolingTons * 12000,
          hw_coil_capacity_btuh: selectedFcu.heatingMbh * 1000,
          cooling_load_btuh: coolingBtuh,
          heating_load_btuh: heatingBtuh,
          reheat_kw: null,
          reheat_stages: null,
          noise_nc: selectedFcu.ncRating,
          sound_power_db: null,
          has_reheat: selectedFcu.heatingMbh > 0,
          reheat_type: 'none',
          has_damper: false,
          damper_actuator: null,
          has_flow_station: false,
          has_discharge_sensor: false,
          location_description: null,
          ceiling_type: selectedFcu.mounting,
          quantity: 1,
          notes: `Auto-imported from: ${zone.calculation_name}`,
          status: 'draft',
          created_by: null,
        });
        successCount++;
      }
      
      toast.success(`Created ${successCount} FCU selection${successCount !== 1 ? 's' : ''}`);
      setShowBatchImportDialog(false);
    } catch (error) {
      console.error('Error importing zones:', error);
      toast.error('Failed to import some zones');
    } finally {
      setIsImportingZones(false);
    }
  }, [profile?.organization_id, selectedProjectId, createUnitMutation]);

  // Export handler
  const handleExport = useCallback((format: 'pdf' | 'excel') => {
    if (!existingFcus || existingFcus.length === 0) {
      toast.error('No FCUs to export');
      return;
    }

    const rows: TerminalUnitRow[] = existingFcus.map(unit => ({
      id: unit.id,
      unit_tag: unit.unit_tag || 'Untagged',
      unit_type: unit.unit_type || 'fcu_4pipe',
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
      has_damper: unit.has_damper || false,
      has_flow_station: unit.has_flow_station || false,
      has_discharge_sensor: unit.has_discharge_sensor || false,
      noise_nc: unit.noise_nc,
      status: unit.status || 'draft',
      notes: unit.notes,
      zone_name: '-',
      floor_name: '-',
      building_name: '-',
    }));

    const groupedData: GroupedTerminalUnits[] = [{
      groupName: 'Fan Coil Units',
      items: rows,
    }];

    const selectedProject = projects?.find(p => p.id === selectedProjectId);
    const header = {
      title: 'FCU SCHEDULE',
      date: new Date().toISOString().split('T')[0],
    };

    const options = {
      format,
      orientation: 'landscape' as const,
      paperSize: 'a4' as const,
      includeHeader: true,
      includeNotes: false,
      includeSummary: true,
    };

    if (format === 'pdf') {
      exportToPDF(groupedData, DEFAULT_TERMINAL_UNIT_COLUMNS, header, selectedProject?.name || 'Project', null, options);
      toast.success('FCU schedule exported to PDF');
    } else {
      exportToExcel(groupedData, DEFAULT_TERMINAL_UNIT_COLUMNS, header, selectedProject?.name || 'Project', null, options);
      toast.success('FCU schedule exported to Excel');
    }
  }, [existingFcus, projects, selectedProjectId, exportToPDF, exportToExcel]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Edit Conflict Warning */}
        {hasConflict && latestRevision && (
          <EditConflictWarning
            entityType="fcu_selection"
            entityId={selectedProjectId || ''}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        {/* Workflow Progress Bar */}
        <DesignWorkflowProgressBar projectId={selectedProjectId} />
        
        {/* Cross-Tool Validation Alert */}
        <CrossToolValidationAlert
          projectId={selectedProjectId}
          currentTool="fcu-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={selectedProjectId}
          currentTool="fcu-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={selectedProjectId}
          currentTool="fcu-selection"
          className="mb-4"
          onImportLoadData={handleImportLoadData}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Breadcrumbs
                items={[
                  { label: 'Design Tools', href: '/design' },
                  { label: 'FCU Selection' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">Fan Coil Unit Selection</h1>
              <p className="text-muted-foreground text-sm">
                Select and size FCUs with water flow calculations and NC validation
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <ActiveEditorsIndicator 
              entityType="fcu_selection"
              entityId={selectedProjectId || null}
              projectId={selectedProjectId || undefined}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!existingFcus?.length}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Schedule
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <Download className="h-4 w-4 mr-2" />
              Batch Import Zones
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Requirements */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  FCU Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Project (Optional)</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Pipe Configuration</Label>
                    <Select value={pipeConfig} onValueChange={(v) => setPipeConfig(v as PipeConfig)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2-pipe">2-Pipe</SelectItem>
                        <SelectItem value="4-pipe">4-Pipe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mounting</Label>
                    <Select value={mounting} onValueChange={(v) => setMounting(v as MountingType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ceiling">Ceiling</SelectItem>
                        <SelectItem value="floor">Floor</SelectItem>
                        <SelectItem value="ducted">Ducted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4" />
                    Cooling Load (BTUH)
                  </Label>
                  <Input
                    type="number"
                    value={coolingLoadBtuh}
                    onChange={e => setCoolingLoadBtuh(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    = {requiredTons.toFixed(2)} tons
                  </p>
                </div>
                
                {pipeConfig === '4-pipe' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      Heating Load (BTUH)
                    </Label>
                    <Input
                      type="number"
                      value={heatingLoadBtuh}
                      onChange={e => setHeatingLoadBtuh(Number(e.target.value))}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Target NC Rating
                  </Label>
                  <Input
                    type="number"
                    value={targetNc}
                    onChange={e => setTargetNc(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Water Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>CHW Supply (°F)</Label>
                    <Input
                      type="number"
                      value={chwSupplyF}
                      onChange={e => setChwSupplyF(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CHW Return (°F)</Label>
                    <Input
                      type="number"
                      value={chwReturnF}
                      onChange={e => setChwReturnF(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search manufacturer, model..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show only matching FCUs</Label>
                  <Switch
                    checked={showOnlyMatching}
                    onCheckedChange={setShowOnlyMatching}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Center Panel - FCU List */}
          <div className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    FCU Catalog
                  </span>
                  <Badge variant="secondary">{filteredFcus.length} units</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {filteredFcus.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No FCUs match your criteria. Try different pipe config or mounting type.
                      </p>
                    ) : (
                      filteredFcus.map((result, idx) => (
                        <div
                          key={result.fcu.model}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedFcuId === result.fcu.model
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedFcuId(result.fcu.model)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {idx === 0 && result.isValid && (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                                    Best Match
                                  </Badge>
                                )}
                                <p className="font-medium text-sm truncate">
                                  {result.fcu.manufacturer} {result.fcu.model}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {result.fcu.cfm} CFM • {result.fcu.coolingTons} tons • {result.fcu.mounting}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {result.isValid ? (
                                <Badge variant="secondary" className="text-emerald-600 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  NC {result.fcu.ncRating}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-amber-600 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  NC {result.fcu.ncRating}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Fit:</span>
                              <span className="ml-1 font-medium">{result.fitScore.toFixed(0)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Size:</span>
                              <span className="ml-1">{result.coolingOversize}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Motor:</span>
                              <span className="ml-1">{result.fcu.motorHp} HP</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Selection Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(selectedFcu || bestMatch) ? (
                  <>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {selectedFcu ? 'Selected' : 'Best Match'}
                        </span>
                        <Badge variant="secondary" className="text-emerald-600">
                          {(selectedFcu || bestMatch)!.fitScore.toFixed(0)}% fit
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {(selectedFcu || bestMatch)!.fcu.manufacturer} {(selectedFcu || bestMatch)!.fcu.model}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span>{(selectedFcu || bestMatch)!.fcu.coolingTons} tons</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CFM:</span>
                        <span>{(selectedFcu || bestMatch)!.fcu.cfm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NC Rating:</span>
                        <span>NC {(selectedFcu || bestMatch)!.fcu.ncRating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Motor:</span>
                        <span>{(selectedFcu || bestMatch)!.fcu.motorHp} HP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Water Flow:</span>
                        <span>{waterFlow.toFixed(1)} GPM</span>
                      </div>
                      {pipeConfig === '4-pipe' && (selectedFcu || bestMatch)!.fcu.heatingMbh > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Heating:</span>
                          <span>{(selectedFcu || bestMatch)!.fcu.heatingMbh} MBH</span>
                        </div>
                      )}
                    </div>
                    
                    {!(selectedFcu || bestMatch)!.isValid && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          NC rating exceeds target. Consider a quieter unit.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suitable FCU found for {requiredTons.toFixed(2)} tons
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Unit Tag</Label>
                  <Input
                    placeholder="e.g., FCU-1-01"
                    value={unitTag}
                    onChange={e => setUnitTag(e.target.value)}
                  />
                </div>
                
                {/* Stage lock info */}
                {isLocked && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    Stage is locked. Unlock to make changes.
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  onClick={handleSave}
                  disabled={!canSave || isLocked || !unitTag.trim() || createUnitMutation.isPending || !(selectedFcu || bestMatch)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createUnitMutation.isPending ? 'Saving...' : 'Save FCU Selection'}
                </Button>
              </CardContent>
            </Card>
            
            {existingFcus.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Saved FCUs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {existingFcus.map(unit => (
                        <div key={unit.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{unit.unit_tag}</p>
                          <p className="text-xs text-muted-foreground">
                            {unit.manufacturer} {unit.model_number} • {unit.supply_cfm} CFM
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep currentPath="/design/fcu-selection" projectId={selectedProjectId} />
      </div>

      {/* Batch Import Dialog */}
      {selectedProjectId && (
        <BatchImportZonesDialog
          open={showBatchImportDialog}
          onOpenChange={setShowBatchImportDialog}
          projectId={selectedProjectId}
          onImport={handleBatchImport}
          isImporting={isImportingZones}
        />
      )}

      {/* Design Alternatives */}
      {selectedProjectId && (
        <>
          <SaveAsAlternativeDialog
            open={showSaveAlternative}
            onOpenChange={setShowSaveAlternative}
            projectId={selectedProjectId}
            entityType="fcu_selection"
            data={{ coolingLoadBtuh, heatingLoadBtuh, targetNc, pipeConfig, mounting, chwSupplyF, chwReturnF, unitTag }}
            suggestedName={`FCU Selection - ${(coolingLoadBtuh / 12000).toFixed(1)} tons`}
          />

          <DesignAlternativesManager
            open={showAlternativesManager}
            onOpenChange={setShowAlternativesManager}
            entityType="fcu_selection"
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
        </>
      )}
    </DashboardLayout>
  );
}
