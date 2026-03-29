import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useZoneContext } from '@/hooks/useZoneContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TerminalUnitSchedulePreview } from '@/components/terminal-units/TerminalUnitSchedulePreview';
import { TerminalUnitColumnConfig } from '@/components/terminal-units/TerminalUnitColumnConfig';
import { TerminalUnitGroupingSelector, type GroupingMode } from '@/components/terminal-units/TerminalUnitGroupingSelector';
import { TerminalUnitScheduleExportDialog } from '@/components/terminal-units/TerminalUnitScheduleExportDialog';
import TerminalUnitValidationSummary from '@/components/terminal-units/TerminalUnitValidationSummary';
import { 
  useTerminalUnitScheduleExport,
  DEFAULT_TERMINAL_UNIT_COLUMNS,
  type TerminalUnitRow,
  type GroupedTerminalUnits,
  type ScheduleColumn,
  type ScheduleHeader,
  type ExportOptions,
} from '@/hooks/useTerminalUnitScheduleExport';
import { useTerminalUnitValidation, type TerminalUnitForValidation } from '@/hooks/useTerminalUnitValidation';
import { useLoadCalculationsWithZones } from '@/hooks/useLoadCalculationsWithZones';
import { useProjects } from '@/hooks/useProjects';
import { useBuildings } from '@/hooks/useBuildings';
import { useZones } from '@/hooks/useZones';
import { useFloors } from '@/hooks/useFloors';
import { useTerminalUnitSelections } from '@/hooks/useTerminalUnitSelections';
import { 
  Table, 
  FileDown, 
  ArrowLeft, 
  Settings2, 
  Building2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';

const formatUnitType = (type: string): string => {
  const typeMap: Record<string, string> = {
    vav_reheat: 'VAV Reheat',
    vav_cooling: 'VAV Cooling Only',
    vav_fan_powered: 'VAV Fan Powered',
    fcu_2pipe: 'FCU 2-Pipe',
    fcu_4pipe: 'FCU 4-Pipe',
    fcu_electric: 'FCU Electric',
  };
  return typeMap[type] || type;
};

export default function TerminalUnitSchedule() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const initialProjectId = searchParams.get('project') || storedProjectId || '';

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);

  useEffect(() => {
    if (selectedProjectId) {
      setContext(selectedProjectId, null, { replace: true });
    }
  }, [selectedProjectId, setContext]);
  const [columns, setColumns] = useState<ScheduleColumn[]>(
    JSON.parse(JSON.stringify(DEFAULT_TERMINAL_UNIT_COLUMNS))
  );
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('by_zone');
  const [header, setHeader] = useState<ScheduleHeader>({
    title: 'TERMINAL UNIT SCHEDULE',
    projectNumber: '',
    revision: 'A',
    date: format(new Date(), 'yyyy-MM-dd'),
    preparedBy: '',
    checkedBy: '',
  });
  const [notes, setNotes] = useState('All VAV boxes and FCU units per ASHRAE 62.1 and project specifications.');
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Validation state
  const [showValidation, setShowValidation] = useState(true);
  const [validationFilterMode, setValidationFilterMode] = useState<'all' | 'issues' | 'errors'>('all');

  const { exportToPDF, exportToExcel, copyToClipboard } = useTerminalUnitScheduleExport();

  const { data: projects } = useProjects();
  const { data: buildings } = useBuildings(selectedProjectId);
  const { data: zones } = useZones(buildings?.[0]?.id || '');
  const { data: floorsData } = useFloors(buildings?.[0]?.id || '');
  const { data: existingUnits } = useTerminalUnitSelections(selectedProjectId);
  const { data: loadCalculations } = useLoadCalculationsWithZones(selectedProjectId);

  const selectedProject = useMemo(() => {
    return projects?.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Collect all zones across all buildings for the project
  const allProjectZones = useMemo(() => {
    if (!buildings) return new Map<string, { name: string; floorId: string; buildingId: string }>();
    const zoneMap = new Map<string, { name: string; floorId: string; buildingId: string }>();
    // We need to fetch zones for all buildings - for now use first building's zones
    zones?.forEach(z => {
      zoneMap.set(z.id, { name: z.name, floorId: z.floor_id || '', buildingId: buildings[0]?.id || '' });
    });
    return zoneMap;
  }, [buildings, zones]);

  // Build lookup maps
  const floorNameMap = useMemo(() => {
    const map = new Map<string, { name: string; buildingId: string }>();
    floorsData?.forEach(f => {
      map.set(f.id, { name: f.name, buildingId: f.building_id || '' });
    });
    return map;
  }, [floorsData]);

  const buildingNameMap = useMemo(() => {
    const map = new Map<string, string>();
    buildings?.forEach(b => {
      map.set(b.id, b.name);
    });
    return map;
  }, [buildings]);

  // Prepare units for validation
  const unitsForValidation = useMemo((): TerminalUnitForValidation[] => {
    if (!existingUnits) return [];
    
    return existingUnits.map(unit => {
      const zoneInfo = unit.zone_id ? allProjectZones.get(unit.zone_id) : null;
      const zoneName = zoneInfo?.name || 'Unassigned';
      const floorId = zoneInfo?.floorId || '';
      const floorInfo = floorId ? floorNameMap.get(floorId) : null;
      const floorName = floorInfo?.name || '';
      const buildingId = floorInfo?.buildingId || zoneInfo?.buildingId || '';
      const buildingName = buildingId ? buildingNameMap.get(buildingId) || '' : '';
      
      return {
        id: unit.id,
        unit_tag: unit.unit_tag,
        zone_id: unit.zone_id,
        zone_name: zoneName,
        building_name: buildingName,
        floor_name: floorName,
        supply_cfm: unit.supply_cfm,
        quantity: unit.quantity || 1,
        cooling_load_btuh: unit.cooling_load_btuh,
        heating_load_btuh: unit.heating_load_btuh,
      };
    });
  }, [existingUnits, allProjectZones, floorNameMap, buildingNameMap]);

  // Run validation
  const { summary, validationByUnitId, validationResults } = useTerminalUnitValidation(
    unitsForValidation,
    loadCalculations || []
  );

  // Transform units to export rows with proper grouping
  const transformedData = useMemo((): GroupedTerminalUnits[] => {
    if (!existingUnits || existingUnits.length === 0) return [];

    // Filter based on validation mode
    let filteredUnits = existingUnits;
    if (validationFilterMode === 'issues') {
      const issueIds = new Set(
        validationResults
          .filter(v => v.status === 'warning' || v.status === 'error')
          .map(v => v.unitId)
      );
      filteredUnits = existingUnits.filter(u => issueIds.has(u.id));
    } else if (validationFilterMode === 'errors') {
      const errorIds = new Set(
        validationResults
          .filter(v => v.status === 'error')
          .map(v => v.unitId)
      );
      filteredUnits = existingUnits.filter(u => errorIds.has(u.id));
    }

    const rows: TerminalUnitRow[] = filteredUnits.map(unit => {
      const zoneInfo = unit.zone_id ? allProjectZones.get(unit.zone_id) : null;
      const zoneName = zoneInfo?.name || 'Unassigned';
      const floorId = zoneInfo?.floorId || '';
      const floorInfo = floorId ? floorNameMap.get(floorId) : null;
      const floorName = floorInfo?.name || '';
      const buildingId = floorInfo?.buildingId || zoneInfo?.buildingId || '';
      const buildingName = buildingId ? buildingNameMap.get(buildingId) || '' : '';
      
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

    // Apply grouping based on mode
    const grouped: Record<string, TerminalUnitRow[]> = {};
    
    rows.forEach(row => {
      let key: string;
      switch (groupingMode) {
        case 'by_building':
          key = row.building_name || 'Unassigned';
          break;
        case 'by_floor':
          key = row.building_name 
            ? `${row.building_name} - ${row.floor_name || 'Unassigned Floor'}`
            : row.floor_name || 'Unassigned';
          break;
        case 'by_type':
          key = formatUnitType(row.unit_type);
          break;
        case 'none':
          key = 'All Terminal Units';
          break;
        case 'by_zone':
        default:
          key = row.building_name 
            ? `${row.building_name} - ${row.zone_name}` 
            : row.zone_name;
          break;
      }
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    // Sort groups and items
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupName, items]) => ({
        groupName,
        items: items.sort((a, b) => a.unit_tag.localeCompare(b.unit_tag)),
      }));
  }, [existingUnits, allProjectZones, floorNameMap, buildingNameMap, groupingMode, validationFilterMode, validationResults]);

  const totalUnits = transformedData.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0), 0);

  const handleExport = useCallback((options: ExportOptions) => {
    const projectName = selectedProject?.name || 'Project';
    
    if (options.format === 'pdf') {
      exportToPDF(transformedData, columns, header, projectName, notes, options);
    } else {
      exportToExcel(transformedData, columns, header, projectName, notes, options);
    }
    toast.success(`Schedule exported as ${options.format.toUpperCase()}`);
  }, [transformedData, columns, header, selectedProject, notes, exportToPDF, exportToExcel]);

  const handleCopyToClipboard = useCallback(() => {
    copyToClipboard(transformedData, columns);
    toast.success('Schedule copied to clipboard');
  }, [transformedData, columns, copyToClipboard]);

  // Update project number in header when project changes
  React.useEffect(() => {
    if (selectedProject) {
      setHeader(prev => ({
        ...prev,
        projectNumber: selectedProject.id.substring(0, 8).toUpperCase(),
      }));
    }
  }, [selectedProject]);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/design/terminal-unit-sizing${selectedProjectId ? `?project=${selectedProjectId}` : ''}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Table className="h-6 w-6" />
                Terminal Unit Schedule
              </h1>
              <p className="text-muted-foreground">
                Preview and configure your terminal unit schedule before export
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard} disabled={totalUnits === 0}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button onClick={() => setShowExportDialog(true)} disabled={totalUnits === 0}>
              <FileDown className="mr-2 h-4 w-4" />
              Export Schedule
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Configuration */}
          <div className="space-y-4">
            {/* Project Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* CFM Validation Summary */}
            {existingUnits && existingUnits.length > 0 && (
              <TerminalUnitValidationSummary
                summary={summary}
                showValidation={showValidation}
                onShowValidationChange={setShowValidation}
                filterMode={validationFilterMode}
                onFilterModeChange={setValidationFilterMode}
              />
            )}

            {/* Grouping Selector */}
            <TerminalUnitGroupingSelector 
              value={groupingMode} 
              onChange={setGroupingMode} 
            />

            {/* Header Editor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Schedule Header
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input 
                    value={header.title} 
                    onChange={(e) => setHeader({...header, title: e.target.value})}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Revision</Label>
                    <Input 
                      value={header.revision || ''} 
                      onChange={(e) => setHeader({...header, revision: e.target.value})}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date</Label>
                    <Input 
                      type="date"
                      value={header.date || ''} 
                      onChange={(e) => setHeader({...header, date: e.target.value})}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Prepared By</Label>
                  <Input 
                    value={header.preparedBy || ''} 
                    onChange={(e) => setHeader({...header, preparedBy: e.target.value})}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-sm min-h-[60px]"
                    placeholder="Schedule notes..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Preview */}
          <div className="lg:col-span-2">
            <TerminalUnitSchedulePreview
              data={transformedData}
              columns={columns}
              header={header}
              projectName={selectedProject?.name || 'Select a project'}
              notes={notes}
              validationByUnitId={validationByUnitId}
              showValidation={showValidation}
            />
          </div>

          {/* Right Sidebar - Column Config */}
          <div>
            <TerminalUnitColumnConfig
              columns={columns}
              onColumnsChange={setColumns}
            />
          </div>
        </div>

        {/* Export Dialog */}
        <TerminalUnitScheduleExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          onExport={handleExport}
          onCopy={handleCopyToClipboard}
          scheduleName={header.title}
          unitCount={totalUnits}
        />

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/terminal-unit-schedule"
          projectId={selectedProjectId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
