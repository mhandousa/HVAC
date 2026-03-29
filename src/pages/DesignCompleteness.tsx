import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileDown, ArrowLeft, Table2, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useDesignCompleteness } from '@/hooks/useDesignCompleteness';
import { DesignCompletenessCards } from '@/components/design/DesignCompletenessCards';
import { DesignCompletenessTable } from '@/components/design/DesignCompletenessTable';
import { FloorPlanHeatMap } from '@/components/design/FloorPlanHeatMap';
import { BuildingFloorNavigator } from '@/components/design/BuildingFloorNavigator';
import { DesignHeatMapLegend } from '@/components/design/DesignHeatMapLegend';
import { BuildingOverviewPanel } from '@/components/design/BuildingOverviewPanel';
import { BuildingComparisonChart } from '@/components/design/BuildingComparisonChart';
import { FloorComparisonChart } from '@/components/design/FloorComparisonChart';
import { ZoneComparisonChart } from '@/components/design/ZoneComparisonChart';
import { ProgressTimelineChart } from '@/components/design/ProgressTimelineChart';
import { SpecializedToolsPanel } from '@/components/design/SpecializedToolsPanel';
import * as XLSX from 'xlsx';

export default function DesignCompleteness() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [timelineRange, setTimelineRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: completenessData, isLoading: completenessLoading } = useDesignCompleteness(selectedProjectId);

  // Sync URL with project selection
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId });
    } else {
      setSearchParams({});
    }
  }, [selectedProjectId, setSearchParams]);

  // Auto-select first project if none selected and not from URL
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0 && !projectIdFromUrl) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, projectIdFromUrl]);

  // Auto-select first building and floor when data loads
  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    // Auto-select first floor of the building
    const buildingZones = completenessData?.zones.filter(z => z.buildingId === buildingId) || [];
    const floors = [...new Set(buildingZones.map(z => z.floorId))];
    if (floors.length > 0) {
      setSelectedFloorId(floors[0]);
    } else {
      setSelectedFloorId(null);
    }
  };

  const handleExport = () => {
    if (!completenessData) return;

    const exportData = completenessData.zones.map(zone => ({
      'Building': zone.buildingName,
      'Floor': zone.floorName,
      'Zone': zone.zoneName,
      'Area (m²)': zone.areaSqm,
      'Load Calculation': zone.hasLoadCalculation ? 'Complete' : 'Missing',
      'Load (Tons)': zone.coolingLoadTons?.toFixed(2) || '-',
      'Equipment Selection': zone.hasEquipmentSelection ? 'Complete' : 'Missing',
      'Distribution System': zone.hasDistributionSystem 
        ? zone.distributionSystemType?.toUpperCase() 
        : 'Missing',
      'Ventilation Calc': zone.hasVentilationCalc ? 'Complete' : 'Missing',
      'ERV/HRV Sizing': zone.hasERVSizing ? 'Complete' : 'Missing',
      'Acoustic Analysis': zone.hasAcousticAnalysis ? 'Complete' : 'Missing',
      'Acoustic Status': zone.acousticMeetsTarget === true 
        ? 'Passing' 
        : zone.acousticMeetsTarget === false 
          ? 'Needs Attention' 
          : '-',
      'Acoustic Calcs': zone.acousticCalculationCount || 0,
      'Completeness Score': `${zone.completenessScore}%`,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Design Completeness');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Project', 'Value': completenessData.projectName },
      { 'Metric': 'Total Zones', 'Value': completenessData.totalZones },
      { 'Metric': 'Zones with Load Calc', 'Value': completenessData.zonesWithLoadCalc },
      { 'Metric': 'Zones with Equipment', 'Value': completenessData.zonesWithEquipment },
      { 'Metric': 'Zones with Distribution', 'Value': completenessData.zonesWithDistribution },
      { 'Metric': 'Zones with Ventilation', 'Value': completenessData.zonesWithVentilation },
      { 'Metric': 'Zones with ERV/HRV', 'Value': completenessData.zonesWithERV },
      { 'Metric': 'Zones with Acoustic Analysis', 'Value': completenessData.zonesWithAcousticAnalysis },
      { 'Metric': 'Zones Passing NC Target', 'Value': completenessData.zonesPassingAcousticTarget },
      { 'Metric': 'Total Acoustic Calculations', 'Value': completenessData.totalAcousticCalculations },
      { 'Metric': 'Fully Complete Zones', 'Value': completenessData.fullyCompleteZones },
      { 'Metric': 'Overall Completeness', 'Value': `${completenessData.overallCompleteness}%` },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Specialized Tools', 'Value': '' },
      { 'Metric': 'Chilled Water Plant', 'Value': completenessData.hasChilledWaterPlant ? `Complete (${completenessData.chilledWaterPlantCount})` : 'Pending' },
      { 'Metric': 'Hot Water Plant', 'Value': completenessData.hasHotWaterPlant ? `Complete (${completenessData.hotWaterPlantCount})` : 'Pending' },
      { 'Metric': 'Smoke Control', 'Value': completenessData.hasSmokeControl ? `Complete (${completenessData.smokeControlCount})` : 'Pending' },
      { 'Metric': 'Thermal Comfort', 'Value': completenessData.hasThermalComfort ? `Complete (${completenessData.thermalComfortCount})` : 'Pending' },
      { 'Metric': 'SBC Compliance', 'Value': completenessData.hasSBCCompliance ? `Complete (${completenessData.sbcComplianceCount})` : 'Pending' },
      { 'Metric': 'Specialized Tools Score', 'Value': `${completenessData.specializedToolsScore}%` },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    XLSX.writeFile(wb, `Design_Completeness_${completenessData.projectName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Design Health', href: `/design/health${selectedProjectId ? `?project=${selectedProjectId}` : ''}` },
            { label: 'Zone Completeness' },
          ]}
        />
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Design Completeness Dashboard</h1>
              <p className="text-muted-foreground">
                Track which zones need load calculations, equipment selections, or distribution systems
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedProjectId || ''}
              onValueChange={(value) => {
                setSelectedProjectId(value || null);
                setActiveFilter(null);
              }}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem value="" disabled>Loading projects...</SelectItem>
                ) : projects?.length === 0 ? (
                  <SelectItem value="" disabled>No projects found</SelectItem>
                ) : (
                  projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={!completenessData}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Content */}
        {!selectedProjectId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project from the dropdown above to view design completeness
                </p>
              </div>
            </CardContent>
          </Card>
        ) : completenessLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[120px]" />
              ))}
            </div>
            <Skeleton className="h-[400px]" />
          </div>
        ) : completenessData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <DesignCompletenessCards 
              data={completenessData} 
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {/* Specialized Tools Progress Panel */}
            <SpecializedToolsPanel
              projectId={completenessData.projectId}
              hasChilledWaterPlant={completenessData.hasChilledWaterPlant}
              chilledWaterPlantCount={completenessData.chilledWaterPlantCount}
              hasHotWaterPlant={completenessData.hasHotWaterPlant}
              hotWaterPlantCount={completenessData.hotWaterPlantCount}
              hasSmokeControl={completenessData.hasSmokeControl}
              smokeControlCount={completenessData.smokeControlCount}
              hasThermalComfort={completenessData.hasThermalComfort}
              thermalComfortCount={completenessData.thermalComfortCount}
              hasSBCCompliance={completenessData.hasSBCCompliance}
              sbcComplianceCount={completenessData.sbcComplianceCount}
              hasASHRAE90_1Compliance={completenessData.hasASHRAE90_1Compliance}
              ashrae90_1ComplianceCount={completenessData.ashrae90_1ComplianceCount}
              specializedToolsScore={completenessData.specializedToolsScore}
            />

            {/* Building Overview Panel */}
            <BuildingOverviewPanel
              zones={completenessData.zones}
              selectedBuildingId={selectedBuildingId}
              onBuildingSelect={handleBuildingChange}
            />

            {/* Building Comparison Chart */}
            <BuildingComparisonChart
              zones={completenessData.zones}
              selectedBuildingId={selectedBuildingId}
              onBuildingSelect={handleBuildingChange}
            />

            {/* Floor Comparison Chart */}
            <FloorComparisonChart
              zones={completenessData.zones}
              selectedBuildingId={selectedBuildingId}
              selectedFloorId={selectedFloorId}
              onFloorSelect={setSelectedFloorId}
            />

            {/* Zone Comparison Chart */}
            <ZoneComparisonChart
              zones={completenessData.zones}
              selectedBuildingId={selectedBuildingId}
              selectedFloorId={selectedFloorId}
              selectedZoneId={selectedZoneId}
              onZoneSelect={setSelectedZoneId}
            />

            {/* Progress Timeline Chart */}
            <ProgressTimelineChart
              projectId={completenessData.projectId}
              dateRange={timelineRange}
              onDateRangeChange={setTimelineRange}
            />

            {/* View Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'heatmap')}>
              <TabsList>
                <TabsTrigger value="table" className="gap-2">
                  <Table2 className="h-4 w-4" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="gap-2">
                  <Map className="h-4 w-4" />
                  Heat Map View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Zone Design Status</CardTitle>
                    <CardDescription>
                      {activeFilter === 'load_calc' && 'Showing zones missing load calculations'}
                      {activeFilter === 'equipment' && 'Showing zones missing equipment selections'}
                      {activeFilter === 'distribution' && 'Showing zones missing distribution systems'}
                      {activeFilter === 'ventilation' && 'Showing zones missing ventilation calculations'}
                      {activeFilter === 'erv' && 'Showing zones missing ERV/HRV sizing'}
                      {activeFilter === 'acoustic' && 'Showing zones missing acoustic analysis'}
                      {activeFilter === 'complete' && 'Showing fully complete zones'}
                      {!activeFilter && 'Click on a card above to filter zones by status'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DesignCompletenessTable 
                      zones={completenessData.zones}
                      projectId={completenessData.projectId}
                      activeFilter={activeFilter}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="heatmap" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Floor Plan Heat Map</CardTitle>
                    <CardDescription>
                      Visual representation of design completeness by zone. Click on zones for details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Building/Floor Navigator */}
                    <BuildingFloorNavigator
                      zones={completenessData.zones}
                      selectedBuildingId={selectedBuildingId}
                      selectedFloorId={selectedFloorId}
                      onBuildingChange={handleBuildingChange}
                      onFloorChange={setSelectedFloorId}
                    />

                    {/* Heat Map */}
                    {selectedBuildingId && selectedFloorId ? (
                      <FloorPlanHeatMap
                        zones={completenessData.zones}
                        projectId={completenessData.projectId}
                        floorId={selectedFloorId}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[300px] bg-muted/30 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">
                          Select a building and floor above to view the heat map
                        </p>
                      </div>
                    )}

                    {/* Legend */}
                    <DesignHeatMapLegend />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  This project has no zones defined. Add buildings, floors, and zones first.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
