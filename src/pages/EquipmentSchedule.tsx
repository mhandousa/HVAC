import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useZoneContext } from '@/hooks/useZoneContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileDown, Save, Plus, ArrowLeft } from 'lucide-react';
import { ToolPageHeader } from '@/components/design/ToolPageHeader';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { useProjects } from '@/hooks/useProjects';
import { useProjectEquipmentHierarchy } from '@/hooks/useProjectEquipmentHierarchy';
import { 
  useEquipmentScheduleList, 
  useCreateEquipmentSchedule, 
  useUpdateEquipmentSchedule,
  useDeleteEquipmentSchedule,
  DEFAULT_COLUMNS,
  ScheduleColumn,
  ScheduleHeader,
  GroupingMode,
  EquipmentSchedule
} from '@/hooks/useEquipmentSchedule';
import { 
  useEquipmentScheduleExport, 
  GroupedEquipment, 
  EquipmentRow,
  ExportOptions 
} from '@/hooks/useEquipmentScheduleExport';
import { ScheduleColumnConfig } from '@/components/equipment-schedule/ScheduleColumnConfig';
import { ScheduleHeaderEditor } from '@/components/equipment-schedule/ScheduleHeaderEditor';
import { EquipmentFilterPanel } from '@/components/equipment-schedule/EquipmentFilterPanel';
import { SchedulePreview } from '@/components/equipment-schedule/SchedulePreview';
import { ScheduleExportDialog } from '@/components/equipment-schedule/ScheduleExportDialog';
import { SavedSchedulesList } from '@/components/equipment-schedule/SavedSchedulesList';

type ViewMode = 'list' | 'create' | 'edit';

export default function EquipmentSchedulePage() {
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Initialize from URL or stored context
  useEffect(() => {
    const projectFromUrl = searchParams.get('project');
    if (projectFromUrl) {
      setSelectedProjectId(projectFromUrl);
    } else if (storedProjectId && !selectedProjectId) {
      setSelectedProjectId(storedProjectId);
    }
  }, [searchParams, storedProjectId]);

  // Sync context when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setContext(selectedProjectId, null, { replace: true });
    }
  }, [selectedProjectId, setContext]);
  const [scheduleName, setScheduleName] = useState('Mechanical Equipment Schedule');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [columns, setColumns] = useState<ScheduleColumn[]>(DEFAULT_COLUMNS);
  const [header, setHeader] = useState<ScheduleHeader>({ revision: 'A' });
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('by_building');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EquipmentSchedule | null>(null);

  const { data: projects = [] } = useProjects();
  const { data: hierarchy, isLoading: hierarchyLoading } = useProjectEquipmentHierarchy(selectedProjectId);
  const { data: savedSchedules = [], isLoading: schedulesLoading } = useEquipmentScheduleList(selectedProjectId);

  const createSchedule = useCreateEquipmentSchedule();
  const updateSchedule = useUpdateEquipmentSchedule();
  const deleteSchedule = useDeleteEquipmentSchedule();
  const { exportToPDF, exportToExcel, copyToClipboard } = useEquipmentScheduleExport();

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Extract equipment data from hierarchy
  const { allEquipment, equipmentTypes, buildings } = useMemo(() => {
    if (!hierarchy) {
      return { allEquipment: [], equipmentTypes: [], buildings: [] };
    }

    const equipment: EquipmentRow[] = [];
    const types = new Set<string>();
    const buildingsList: { id: string; name: string; floors: { id: string; name: string }[] }[] = [];

    // Process buildings
    hierarchy.buildings.forEach(buildingData => {
      const floorsList: { id: string; name: string }[] = [];
      
      buildingData.floors.forEach(floorData => {
        floorsList.push({ id: floorData.floor.id, name: floorData.floor.name });
        
        floorData.zones.forEach(zoneData => {
          zoneData.equipment.forEach(eq => {
            if (eq.equipment_type) types.add(eq.equipment_type);
            equipment.push({
              id: eq.id,
              tag: eq.tag,
              name: eq.name,
              equipment_type: eq.equipment_type,
              manufacturer: eq.manufacturer,
              model: eq.model,
              capacity_value: eq.capacity_value,
              capacity_unit: eq.capacity_unit,
              serial_number: eq.serial_number,
              install_date: eq.install_date,
              warranty_expiry: eq.warranty_expiry,
              status: eq.status,
              location: `${buildingData.building.name} > ${floorData.floor.name} > ${zoneData.zone.name}`,
              building: buildingData.building.name,
              floor: floorData.floor.name,
              zone: zoneData.zone.name,
            });
          });
        });
      });
      
      buildingsList.push({ id: buildingData.building.id, name: buildingData.building.name, floors: floorsList });
    });

    // Process unassigned equipment
    hierarchy.unassignedEquipment.forEach(eq => {
      if (eq.equipment_type) types.add(eq.equipment_type);
      equipment.push({
        id: eq.id,
        tag: eq.tag,
        name: eq.name,
        equipment_type: eq.equipment_type,
        manufacturer: eq.manufacturer,
        model: eq.model,
        capacity_value: eq.capacity_value,
        capacity_unit: eq.capacity_unit,
        serial_number: eq.serial_number,
        install_date: eq.install_date,
        warranty_expiry: eq.warranty_expiry,
        status: eq.status,
        location: 'Unassigned',
        building: undefined,
        floor: undefined,
        zone: undefined,
      });
    });

    return { 
      allEquipment: equipment, 
      equipmentTypes: Array.from(types).sort(),
      buildings: buildingsList 
    };
  }, [hierarchy]);

  // Initialize filters when equipment loads
  useEffect(() => {
    if (equipmentTypes.length > 0 && selectedTypes.length === 0) {
      setSelectedTypes([...equipmentTypes]);
    }
    if (buildings.length > 0 && selectedBuildingIds.length === 0) {
      setSelectedBuildingIds(buildings.map(b => b.id));
    }
  }, [equipmentTypes, buildings]);

  // Filter and group equipment
  const groupedData = useMemo((): GroupedEquipment[] => {
    let filtered = allEquipment;

    // Filter by type
    if (selectedTypes.length > 0 && selectedTypes.length < equipmentTypes.length) {
      filtered = filtered.filter(eq => eq.equipment_type && selectedTypes.includes(eq.equipment_type));
    }

    // Filter by building
    if (selectedBuildingIds.length > 0 && selectedBuildingIds.length < buildings.length) {
      const buildingNames = buildings
        .filter(b => selectedBuildingIds.includes(b.id))
        .map(b => b.name);
      filtered = filtered.filter(eq => eq.building && buildingNames.includes(eq.building));
    }

    // Group equipment
    switch (groupingMode) {
      case 'by_building': {
        const groups: Record<string, EquipmentRow[]> = {};
        filtered.forEach(eq => {
          const key = eq.building || 'Unassigned';
          if (!groups[key]) groups[key] = [];
          groups[key].push(eq);
        });
        return Object.entries(groups).map(([name, items]) => ({ 
          groupName: name, 
          items: items.sort((a, b) => a.tag.localeCompare(b.tag)) 
        }));
      }
      case 'by_floor': {
        const groups: Record<string, EquipmentRow[]> = {};
        filtered.forEach(eq => {
          const key = eq.floor ? `${eq.building} - ${eq.floor}` : 'Unassigned';
          if (!groups[key]) groups[key] = [];
          groups[key].push(eq);
        });
        return Object.entries(groups).map(([name, items]) => ({ 
          groupName: name, 
          items: items.sort((a, b) => a.tag.localeCompare(b.tag)) 
        }));
      }
      case 'by_type': {
        const groups: Record<string, EquipmentRow[]> = {};
        filtered.forEach(eq => {
          const key = eq.equipment_type || 'Other';
          if (!groups[key]) groups[key] = [];
          groups[key].push(eq);
        });
        return Object.entries(groups).map(([name, items]) => ({ 
          groupName: name, 
          items: items.sort((a, b) => a.tag.localeCompare(b.tag)) 
        }));
      }
      case 'by_zone': {
        const groups: Record<string, EquipmentRow[]> = {};
        filtered.forEach(eq => {
          const key = eq.zone || 'Unassigned';
          if (!groups[key]) groups[key] = [];
          groups[key].push(eq);
        });
        return Object.entries(groups).map(([name, items]) => ({ 
          groupName: name, 
          items: items.sort((a, b) => a.tag.localeCompare(b.tag)) 
        }));
      }
      default:
        return [{ 
          groupName: 'All Equipment', 
          items: filtered.sort((a, b) => a.tag.localeCompare(b.tag)) 
        }];
    }
  }, [allEquipment, selectedTypes, selectedBuildingIds, groupingMode, equipmentTypes.length, buildings]);

  const filteredCount = groupedData.reduce((sum, g) => sum + g.items.length, 0);

  const handleSaveSchedule = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    const equipmentIds = groupedData.flatMap(g => g.items.map(i => i.id));

    try {
      if (editingSchedule) {
        await updateSchedule.mutateAsync({
          id: editingSchedule.id,
          name: scheduleName,
          equipment_ids: equipmentIds,
          grouping_mode: groupingMode,
          columns_config: columns,
          custom_header: header,
          notes: scheduleNotes,
        });
      } else {
        await createSchedule.mutateAsync({
          project_id: selectedProjectId,
          name: scheduleName,
          equipment_ids: equipmentIds,
          grouping_mode: groupingMode,
          columns_config: columns,
          custom_header: header,
          notes: scheduleNotes,
        });
      }
      setViewMode('list');
      resetForm();
    } catch {
      // Error handled in mutation
    }
  };

  const handleExport = (options: ExportOptions) => {
    const projectName = selectedProject?.name || 'Project';
    
    if (options.format === 'pdf') {
      exportToPDF(groupedData, columns, header, projectName, scheduleNotes, options);
    } else {
      exportToExcel(groupedData, columns, header, projectName, scheduleNotes, options);
    }
    toast.success(`Schedule exported as ${options.format.toUpperCase()}`);
  };

  const handleCopy = () => {
    copyToClipboard(groupedData, columns);
    toast.success('Schedule copied to clipboard');
  };

  const handleSelectSchedule = (schedule: EquipmentSchedule) => {
    loadSchedule(schedule);
    setViewMode('edit');
  };

  const handleEditSchedule = (schedule: EquipmentSchedule) => {
    loadSchedule(schedule);
    setViewMode('edit');
  };

  const handleExportSchedule = (schedule: EquipmentSchedule) => {
    loadSchedule(schedule);
    setShowExportDialog(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule.mutateAsync(scheduleId);
    }
  };

  const loadSchedule = (schedule: EquipmentSchedule) => {
    setEditingSchedule(schedule);
    setScheduleName(schedule.name);
    setScheduleNotes(schedule.notes || '');
    setColumns(schedule.columns_config || DEFAULT_COLUMNS);
    setHeader(schedule.custom_header || { revision: 'A' });
    setGroupingMode(schedule.grouping_mode as GroupingMode || 'by_building');
    if (schedule.project_id) {
      setSelectedProjectId(schedule.project_id);
    }
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setScheduleName('Mechanical Equipment Schedule');
    setScheduleNotes('');
    setColumns(DEFAULT_COLUMNS);
    setHeader({ revision: 'A' });
    setGroupingMode('by_building');
  };

  const startNewSchedule = () => {
    resetForm();
    setViewMode('create');
  };

  const breadcrumbItems = [
    { label: 'Design Tools', href: '/design' },
    { label: 'Equipment Schedule' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipment Schedule Generator</h1>
            <p className="text-muted-foreground">
              Create formatted equipment schedules for construction documents
            </p>
          </div>
          
          {viewMode === 'list' ? (
            <Button onClick={startNewSchedule} className="gap-2">
              <Plus className="h-4 w-4" />
              New Schedule
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => { setViewMode('list'); resetForm(); }} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
          )}
        </div>

        <ToolPageHeader
          toolType="equipment-schedule"
          toolName="Equipment Schedule"
          projectId={selectedProjectId}
          showLockButton={false}
          showValidation={true}
        />

        {/* Phase 18: Edit Conflict Warning */}
        <EditConflictWarning
          entityType="equipment_schedule"
          entityId={editingSchedule?.id || null}
          currentRevisionNumber={0}
          onReload={() => window.location.reload()}
        />

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Select Project</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Saved Schedules */}
            <div className="lg:col-span-2">
              <SavedSchedulesList
                schedules={savedSchedules}
                isLoading={schedulesLoading}
                onSelect={handleSelectSchedule}
                onEdit={handleEditSchedule}
                onDelete={handleDeleteSchedule}
                onExport={handleExportSchedule}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Schedule Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Panel - Configuration */}
              <div className="lg:col-span-1 space-y-4">
                {/* Project Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Schedule Name */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Schedule Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Schedule Name</Label>
                      <Input
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                        placeholder="Equipment Schedule"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={scheduleNotes}
                        onChange={(e) => setScheduleNotes(e.target.value)}
                        placeholder="Add notes to include in the schedule..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Filters */}
                <EquipmentFilterPanel
                  equipmentTypes={equipmentTypes}
                  selectedTypes={selectedTypes}
                  onTypesChange={setSelectedTypes}
                  buildings={buildings}
                  selectedBuildingIds={selectedBuildingIds}
                  onBuildingsChange={setSelectedBuildingIds}
                  groupingMode={groupingMode}
                  onGroupingModeChange={setGroupingMode}
                  totalCount={allEquipment.length}
                  filteredCount={filteredCount}
                />
              </div>

              {/* Center Panel - Preview */}
              <div className="lg:col-span-2">
                <SchedulePreview
                  data={groupedData}
                  columns={columns}
                  header={header}
                  projectName={selectedProject?.name || 'Select a project'}
                  notes={scheduleNotes}
                />
              </div>

              {/* Right Panel - Configuration */}
              <div className="lg:col-span-1 space-y-4">
                <Tabs defaultValue="columns">
                  <TabsList className="w-full">
                    <TabsTrigger value="columns" className="flex-1">Columns</TabsTrigger>
                    <TabsTrigger value="header" className="flex-1">Header</TabsTrigger>
                  </TabsList>
                  <TabsContent value="columns" className="mt-4">
                    <ScheduleColumnConfig
                      columns={columns}
                      onColumnsChange={setColumns}
                    />
                  </TabsContent>
                  <TabsContent value="header" className="mt-4">
                    <ScheduleHeaderEditor
                      header={header}
                      onHeaderChange={setHeader}
                      projectName={selectedProject?.name || 'Select a project'}
                    />
                  </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleSaveSchedule} 
                    className="w-full gap-2"
                    disabled={!selectedProjectId || filteredCount === 0}
                  >
                    <Save className="h-4 w-4" />
                    {editingSchedule ? 'Update Schedule' : 'Save Schedule'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowExportDialog(true)}
                    className="w-full gap-2"
                    disabled={filteredCount === 0}
                  >
                    <FileDown className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ScheduleExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        onCopy={handleCopy}
        scheduleName={scheduleName}
      />

      {/* Design Workflow Next Step */}
      <DesignWorkflowNextStep
        currentPath="/design/equipment-schedule"
        projectId={selectedProjectId}
        stageComplete={viewMode === 'edit'}
      />
    </DashboardLayout>
  );
}
