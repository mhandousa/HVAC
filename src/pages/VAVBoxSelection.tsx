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
import { DataFlowImportHandler, ImportLoadData, ImportVentilationData } from '@/components/design/DataFlowImportHandler';
import { BatchImportZonesDialog } from '@/components/design/BatchImportZonesDialog';
import { LoadCalculationWithZone } from '@/hooks/useLoadCalculationsWithZones';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { useQueryClient } from '@tanstack/react-query';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { Box, ArrowLeft, Search, AlertTriangle, CheckCircle2, Save, Table, BarChart3, Flame, Volume2, Download, Loader2, FileText, FileSpreadsheet, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { SaveAsAlternativeDialog } from '@/components/design/SaveAsAlternativeDialog';
import { DesignAlternativesManager } from '@/components/design/DesignAlternativesManager';
import { AlternativeComparisonView } from '@/components/design/AlternativeComparisonView';
import { DesignAlternative } from '@/hooks/useDesignAlternatives';

// VAV Box catalog data
const VAV_CATALOG = [
  { manufacturer: 'Trane', model: 'VAV-6', inletSize: 6, minCfm: 50, maxCfm: 300, ncRating: 20, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Trane', model: 'VAV-8', inletSize: 8, minCfm: 100, maxCfm: 600, ncRating: 22, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Trane', model: 'VAV-10', inletSize: 10, minCfm: 200, maxCfm: 1000, ncRating: 25, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Trane', model: 'VAV-12', inletSize: 12, minCfm: 300, maxCfm: 1600, ncRating: 27, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Trane', model: 'VAV-14', inletSize: 14, minCfm: 400, maxCfm: 2200, ncRating: 30, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Carrier', model: '39M-6', inletSize: 6, minCfm: 40, maxCfm: 280, ncRating: 19, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Carrier', model: '39M-8', inletSize: 8, minCfm: 80, maxCfm: 550, ncRating: 21, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Carrier', model: '39M-10', inletSize: 10, minCfm: 150, maxCfm: 950, ncRating: 24, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Carrier', model: '39M-12', inletSize: 12, minCfm: 250, maxCfm: 1500, ncRating: 26, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Krueger', model: 'LMHS-6', inletSize: 6, minCfm: 45, maxCfm: 290, ncRating: 18, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Krueger', model: 'LMHS-8', inletSize: 8, minCfm: 90, maxCfm: 580, ncRating: 20, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Krueger', model: 'LMHS-10', inletSize: 10, minCfm: 180, maxCfm: 980, ncRating: 23, reheatOptions: ['none', 'hot_water', 'electric'] },
  { manufacturer: 'Krueger', model: 'LMHS-12', inletSize: 12, minCfm: 280, maxCfm: 1550, ncRating: 25, reheatOptions: ['none', 'hot_water', 'electric'] },
];

type ReheatType = 'none' | 'hot_water' | 'electric';

export default function VAVBoxSelection() {
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
  const { canSave, blockers, warnings, isLocked } = useToolValidation(projectId || null, 'vav-selection', { checkStageLock: true });
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMatching, setShowOnlyMatching] = useState(false);
  const [selectedVavId, setSelectedVavId] = useState<string | null>(null);
  const [unitTag, setUnitTag] = useState('');
  
  // Batch import state
  const [showBatchImportDialog, setShowBatchImportDialog] = useState(false);
  const [isImportingZones, setIsImportingZones] = useState(false);
  
  // VAV requirements
  const [supplyCfm, setSupplyCfm] = useState(500);
  const [minCfmPercent, setMinCfmPercent] = useState(30);
  const [targetNc, setTargetNc] = useState(35);
  const [reheatType, setReheatType] = useState<ReheatType>('none');
  const [heatingLoadBtuh, setHeatingLoadBtuh] = useState(0);

  // Concurrent editing awareness
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'vav_selection',
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
    if (data.supplyCfm) setSupplyCfm(data.supplyCfm as number);
    if (data.minCfmPercent) setMinCfmPercent(data.minCfmPercent as number);
    if (data.targetNc) setTargetNc(data.targetNc as number);
    if (data.reheatType) setReheatType(data.reheatType as ReheatType);
    if (data.heatingLoadBtuh !== undefined) setHeatingLoadBtuh(data.heatingLoadBtuh as number);
    if (data.unitTag) setUnitTag(data.unitTag as string);
    setShowAlternativesManager(false);
    toast.success('Alternative loaded');
  }, []);

  const handleCompareAlternatives = useCallback((alternatives: DesignAlternative[]) => {
    setAlternativesToCompare(alternatives);
    setShowAlternativeComparison(true);
    setShowAlternativesManager(false);
  }, []);
  // Calculate min CFM
  const minCfm = useMemo(() => Math.round(supplyCfm * (minCfmPercent / 100)), [supplyCfm, minCfmPercent]);
  
  // Find best VAV box
  const rankedVavs = useMemo(() => {
    return VAV_CATALOG
      .filter(vav => {
        // Check CFM range
        if (supplyCfm < vav.minCfm || supplyCfm > vav.maxCfm) return false;
        // Check reheat option
        if (reheatType !== 'none' && !vav.reheatOptions.includes(reheatType)) return false;
        return true;
      })
      .map(vav => {
        // Calculate fit score
        const cfmRange = vav.maxCfm - vav.minCfm;
        const cfmPosition = (supplyCfm - vav.minCfm) / cfmRange;
        // Best fit is around 60-80% of capacity
        const cfmScore = 100 - Math.abs(cfmPosition - 0.7) * 50;
        
        // NC score
        const ncMargin = targetNc - vav.ncRating;
        const ncScore = ncMargin >= 0 ? 100 - Math.min(ncMargin * 2, 30) : Math.max(0, 100 + ncMargin * 10);
        
        const fitScore = (cfmScore * 0.6 + ncScore * 0.4);
        
        return {
          vav,
          fitScore,
          cfmUtilization: cfmPosition * 100,
          ncMargin,
          isValid: supplyCfm >= vav.minCfm && supplyCfm <= vav.maxCfm && vav.ncRating <= targetNc,
        };
      })
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [supplyCfm, targetNc, reheatType]);
  
  // Filter for display
  const filteredVavs = useMemo(() => {
    let vavs = rankedVavs;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      vavs = vavs.filter(r =>
        r.vav.manufacturer.toLowerCase().includes(query) ||
        r.vav.model.toLowerCase().includes(query)
      );
    }
    
    if (showOnlyMatching) {
      vavs = vavs.filter(r => r.isValid);
    }
    
    return vavs;
  }, [rankedVavs, searchQuery, showOnlyMatching]);
  
  const selectedVav = useMemo(() => {
    if (!selectedVavId) return null;
    return filteredVavs.find(r => r.vav.model === selectedVavId);
  }, [selectedVavId, filteredVavs]);
  
  const bestMatch = filteredVavs.length > 0 && filteredVavs[0].isValid ? filteredVavs[0] : null;
  
  // Save selection
  const handleSave = async () => {
    if (!profile?.organization_id || !unitTag.trim()) {
      toast.error('Please provide a unit tag');
      return;
    }
    
    const vavToSave = selectedVav || bestMatch;
    if (!vavToSave) {
      toast.error('Please select a VAV box');
      return;
    }
    
    await createUnitMutation.mutateAsync({
      organization_id: profile.organization_id,
      project_id: selectedProjectId || null,
      zone_id: null,
      duct_system_id: null,
      unit_tag: unitTag,
      unit_type: reheatType === 'none' ? 'vav_cooling' : 'vav_reheat',
      manufacturer: vavToSave.vav.manufacturer,
      model_number: vavToSave.vav.model,
      supply_cfm: supplyCfm,
      min_cfm: minCfm,
      max_cfm: vavToSave.vav.maxCfm,
      outdoor_air_cfm: 0,
      selected_size: `${vavToSave.vav.inletSize}"`,
      inlet_size_in: vavToSave.vav.inletSize,
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
      cooling_load_btuh: null,
      heating_load_btuh: reheatType !== 'none' ? heatingLoadBtuh : null,
      reheat_kw: reheatType === 'electric' ? heatingLoadBtuh / 3412 : null,
      reheat_stages: null,
      noise_nc: vavToSave.vav.ncRating,
      sound_power_db: null,
      has_reheat: reheatType !== 'none',
      reheat_type: reheatType === 'none' ? 'none' : reheatType,
      has_damper: true,
      damper_actuator: null,
      has_flow_station: true,
      has_discharge_sensor: false,
      location_description: null,
      ceiling_type: null,
      quantity: 1,
      notes: null,
      status: 'draft',
      created_by: null,
    });
    
    setUnitTag('');
    toast.success('VAV box selection saved');
  };

  // Import handlers for DataFlowImportHandler
  const handleImportLoadData = (data: ImportLoadData) => {
    if (data.zoneCount > 0) {
      const avgCfm = Math.round(data.totalCfm / data.zoneCount);
      setSupplyCfm(avgCfm);
      toast.success(`Imported ${avgCfm.toLocaleString()} CFM (avg from ${data.zoneCount} zones)`);
    }
  };

  const handleImportVentilationData = (data: ImportVentilationData) => {
    if (data.totalSupplyAirCfm > 0 && data.calculationCount > 0) {
      const avgCfm = Math.round(data.totalSupplyAirCfm / data.calculationCount);
      setSupplyCfm(avgCfm);
      toast.success(`Imported ${avgCfm.toLocaleString()} CFM from ventilation`);
    }
  };

  // Filter existing units to show only VAVs
  const existingVavs = useMemo(() => {
    return existingUnits?.filter(u => u.unit_type === 'vav_cooling' || u.unit_type === 'vav_reheat') || [];
  }, [existingUnits]);

  // Batch import handler
  const handleBatchImport = useCallback(async (zones: LoadCalculationWithZone[]) => {
    if (!profile?.organization_id || zones.length === 0) return;
    
    setIsImportingZones(true);
    try {
      let successCount = 0;
      for (const zone of zones) {
        const cfm = zone.cfm_required || 0;
        const zonePrefix = zone.zone_name?.substring(0, 3).toUpperCase() || 'ZN';
        const tag = `VAV-${zonePrefix}-${String(successCount + 1).padStart(2, '0')}`;
        
        // Auto-select best matching VAV box (60-80% capacity utilization)
        const matchingVavs = VAV_CATALOG.filter(v => 
          cfm >= v.minCfm && cfm <= v.maxCfm
        ).sort((a, b) => {
          const utilA = (cfm - a.minCfm) / (a.maxCfm - a.minCfm);
          const utilB = (cfm - b.minCfm) / (b.maxCfm - b.minCfm);
          return Math.abs(utilA - 0.7) - Math.abs(utilB - 0.7);
        });
        
        const selectedVav = matchingVavs[0] || VAV_CATALOG[VAV_CATALOG.length - 1];
        
        await createUnitMutation.mutateAsync({
          organization_id: profile.organization_id,
          project_id: selectedProjectId || null,
          zone_id: zone.zone_id || null,
          duct_system_id: null,
          unit_tag: tag,
          unit_type: 'vav_cooling',
          manufacturer: selectedVav.manufacturer,
          model_number: selectedVav.model,
          supply_cfm: cfm,
          min_cfm: Math.round(cfm * 0.3),
          max_cfm: selectedVav.maxCfm,
          outdoor_air_cfm: 0,
          selected_size: `${selectedVav.inletSize}"`,
          inlet_size_in: selectedVav.inletSize,
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
          cooling_load_btuh: zone.cooling_load_btuh || null,
          heating_load_btuh: zone.heating_load_btuh || null,
          reheat_kw: null,
          reheat_stages: null,
          noise_nc: selectedVav.ncRating,
          sound_power_db: null,
          has_reheat: false,
          reheat_type: 'none',
          has_damper: true,
          damper_actuator: null,
          has_flow_station: true,
          has_discharge_sensor: false,
          location_description: null,
          ceiling_type: null,
          quantity: 1,
          notes: `Auto-imported from: ${zone.calculation_name}`,
          status: 'draft',
          created_by: null,
        });
        successCount++;
      }
      
      toast.success(`Created ${successCount} VAV box selection${successCount !== 1 ? 's' : ''}`);
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
    if (!existingVavs || existingVavs.length === 0) {
      toast.error('No VAV boxes to export');
      return;
    }

    const rows: TerminalUnitRow[] = existingVavs.map(unit => ({
      id: unit.id,
      unit_tag: unit.unit_tag || 'Untagged',
      unit_type: unit.unit_type || 'vav_cooling',
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
      groupName: 'VAV Boxes',
      items: rows,
    }];

    const selectedProject = projects?.find(p => p.id === selectedProjectId);
    const header = {
      title: 'VAV BOX SCHEDULE',
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
      toast.success('VAV schedule exported to PDF');
    } else {
      exportToExcel(groupedData, DEFAULT_TERMINAL_UNIT_COLUMNS, header, selectedProject?.name || 'Project', null, options);
      toast.success('VAV schedule exported to Excel');
    }
  }, [existingVavs, projects, selectedProjectId, exportToPDF, exportToExcel]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Edit Conflict Warning */}
        {hasConflict && latestRevision && (
          <EditConflictWarning
            entityType="vav_selection"
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
          currentTool="vav-box-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={selectedProjectId}
          currentTool="vav-box-selection"
          variant="alert"
          className="mb-4"
        />
        
        {/* Data Flow Import Handler */}
        <DataFlowImportHandler
          projectId={selectedProjectId}
          currentTool="vav-box-selection"
          className="mb-4"
          onImportLoadData={handleImportLoadData}
          onImportVentilationData={handleImportVentilationData}
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
                  { label: 'VAV Box Selection' },
                ]}
              />
              <h1 className="text-2xl font-bold text-foreground mt-1">VAV Box Selection</h1>
              <p className="text-muted-foreground text-sm">
                Select and size Variable Air Volume boxes with NC rating validation
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <ActiveEditorsIndicator 
              entityType="vav_selection"
              entityId={selectedProjectId || null}
              projectId={selectedProjectId || undefined}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!existingVavs?.length}>
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
                  VAV Requirements
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
                
                <div className="space-y-2">
                  <Label>Supply CFM (Max)</Label>
                  <Input
                    type="number"
                    value={supplyCfm}
                    onChange={e => setSupplyCfm(Number(e.target.value))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Min CFM %</Label>
                    <Input
                      type="number"
                      value={minCfmPercent}
                      onChange={e => setMinCfmPercent(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min CFM</Label>
                    <Input
                      type="number"
                      value={minCfm}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                
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
                  <p className="text-xs text-muted-foreground">
                    VAV must be at or below this NC rating
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Reheat Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Reheat Type</Label>
                  <Select value={reheatType} onValueChange={(v) => setReheatType(v as ReheatType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Reheat</SelectItem>
                      <SelectItem value="hot_water">Hot Water Coil</SelectItem>
                      <SelectItem value="electric">Electric Heater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {reheatType !== 'none' && (
                  <div className="space-y-2">
                    <Label>Heating Load (BTUH)</Label>
                    <Input
                      type="number"
                      value={heatingLoadBtuh}
                      onChange={e => setHeatingLoadBtuh(Number(e.target.value))}
                    />
                  </div>
                )}
                
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
                  <Label className="text-sm">Show only matching boxes</Label>
                  <Switch
                    checked={showOnlyMatching}
                    onCheckedChange={setShowOnlyMatching}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Center Panel - VAV List */}
          <div className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    VAV Box Catalog
                  </span>
                  <Badge variant="secondary">{filteredVavs.length} boxes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-2">
                    {filteredVavs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No VAV boxes match your criteria
                      </p>
                    ) : (
                      filteredVavs.map((result, idx) => (
                        <div
                          key={result.vav.model}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedVavId === result.vav.model
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedVavId(result.vav.model)}
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
                                  {result.vav.manufacturer} {result.vav.model}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {result.vav.inletSize}" inlet • {result.vav.minCfm}-{result.vav.maxCfm} CFM
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {result.isValid ? (
                                <Badge variant="secondary" className="text-emerald-600 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  NC {result.vav.ncRating}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-amber-600 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  NC {result.vav.ncRating}
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
                              <span className="text-muted-foreground">Load:</span>
                              <span className="ml-1">{result.cfmUtilization.toFixed(0)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">NC Margin:</span>
                              <span className={`ml-1 ${result.ncMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {result.ncMargin >= 0 ? '+' : ''}{result.ncMargin}
                              </span>
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
                {(selectedVav || bestMatch) ? (
                  <>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {selectedVav ? 'Selected' : 'Best Match'}
                        </span>
                        <Badge variant="secondary" className="text-emerald-600">
                          {(selectedVav || bestMatch)!.fitScore.toFixed(0)}% fit
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {(selectedVav || bestMatch)!.vav.manufacturer} {(selectedVav || bestMatch)!.vav.model}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inlet Size:</span>
                        <span>{(selectedVav || bestMatch)!.vav.inletSize}"</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CFM Range:</span>
                        <span>{(selectedVav || bestMatch)!.vav.minCfm} - {(selectedVav || bestMatch)!.vav.maxCfm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NC Rating:</span>
                        <span>NC {(selectedVav || bestMatch)!.vav.ncRating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Operating CFM:</span>
                        <span>{supplyCfm} ({(selectedVav || bestMatch)!.cfmUtilization.toFixed(0)}%)</span>
                      </div>
                      {reheatType !== 'none' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reheat:</span>
                          <span className="capitalize">{reheatType.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                    
                    {!(selectedVav || bestMatch)!.isValid && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          NC rating exceeds target. Consider a larger or quieter unit.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suitable VAV box found for {supplyCfm} CFM
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
                    placeholder="e.g., VAV-1-01"
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
                  disabled={!canSave || isLocked || !unitTag.trim() || createUnitMutation.isPending || !(selectedVav || bestMatch)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createUnitMutation.isPending ? 'Saving...' : 'Save VAV Selection'}
                </Button>
              </CardContent>
            </Card>
            
            {existingVavs.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Saved VAV Boxes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {existingVavs.map(unit => (
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
        <DesignWorkflowNextStep currentPath="/design/vav-box-selection" projectId={selectedProjectId} />
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
            entityType="vav_selection"
            data={{ supplyCfm, minCfmPercent, targetNc, reheatType, heatingLoadBtuh, unitTag }}
            suggestedName={`VAV Selection - ${supplyCfm} CFM`}
          />

          <DesignAlternativesManager
            open={showAlternativesManager}
            onOpenChange={setShowAlternativesManager}
            entityType="vav_selection"
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
