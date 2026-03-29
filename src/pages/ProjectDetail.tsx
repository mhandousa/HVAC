import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useUpdateProject } from '@/hooks/useProjects';
import { useBuildings, useCreateBuilding, Building } from '@/hooks/useBuildings';
import { useEquipment } from '@/hooks/useEquipment';
import { useEquipmentCountsByBuilding } from '@/hooks/useEquipmentCountsByBuilding';
import { useCustomers } from '@/hooks/useCustomers';
import { useProjectCustomers, useAddProjectCustomer, useRemoveProjectCustomer } from '@/hooks/useProjectCustomers';
import { useDesignHealthScores } from '@/hooks/useDesignHealthScores';
import { BuildingDetailDrawer } from '@/components/buildings/BuildingDetailDrawer';
import { ProjectEquipmentSection } from '@/components/projects/ProjectEquipmentSection';
import { ProjectContractsSection } from '@/components/projects/ProjectContractsSection';
import { ProjectDesignSummary } from '@/components/projects/ProjectDesignSummary';
import { SpecializedToolsBadges } from '@/components/projects/SpecializedToolsBadges';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  Plus,
  Building2,
  MapPin,
  Calendar,
  Loader2,
  FolderKanban,
  Wrench,
  Layers,
  Users,
  FileText,
  X,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  planning: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-muted text-muted-foreground border-border',
  on_hold: 'bg-warning/10 text-warning border-warning/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: allBuildings, isLoading: buildingsLoading } = useBuildings();
  const { data: allEquipment } = useEquipment();
  const { getCount: getBuildingEquipmentCount } = useEquipmentCountsByBuilding(id);
  const { data: allCustomers } = useCustomers();
  const createBuilding = useCreateBuilding();
  
  // Project customers
  const { data: projectCustomers } = useProjectCustomers(id);
  const addProjectCustomer = useAddProjectCustomer();
  const removeProjectCustomer = useRemoveProjectCustomer();
  
  // Design health
  const { data: healthData } = useDesignHealthScores();
  const projectHealth = healthData?.projects?.find(p => p.projectId === id);
  
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isBuildingDetailOpen, setIsBuildingDetailOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  const [buildingFormData, setBuildingFormData] = useState({
    name: '',
    address: '',
    total_floors: '',
    total_area_sqm: '',
    year_built: '',
  });

  // Filter out already linked customers
  const linkedCustomerIds = new Set(projectCustomers?.map(pc => pc.customer_id) || []);
  const availableCustomers = (allCustomers || []).filter(c => !linkedCustomerIds.has(c.id));

  const handleLinkCustomer = async () => {
    if (!id || !selectedCustomerId) return;
    await addProjectCustomer.mutateAsync({ projectId: id, customerId: selectedCustomerId });
    setSelectedCustomerId('');
  };

  const handleUnlinkCustomer = async (customerId: string) => {
    if (!id) return;
    await removeProjectCustomer.mutateAsync({ projectId: id, customerId });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const project = projects?.find(p => p.id === id);
  const projectBuildings = (allBuildings || []).filter(b => b.project_id === id);
  const projectEquipment = (allEquipment || []).filter(eq => eq.project_id === id);

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !buildingFormData.name.trim()) return;

    await createBuilding.mutateAsync({
      project_id: id,
      name: buildingFormData.name,
      address: buildingFormData.address || undefined,
      total_floors: buildingFormData.total_floors ? parseInt(buildingFormData.total_floors) : undefined,
      total_area_sqm: buildingFormData.total_area_sqm ? parseFloat(buildingFormData.total_area_sqm) : undefined,
      year_built: buildingFormData.year_built ? parseInt(buildingFormData.year_built) : undefined,
    });
    
    setIsAddBuildingOpen(false);
    setBuildingFormData({ name: '', address: '', total_floors: '', total_area_sqm: '', year_built: '' });
  };

  const openBuildingDetail = (building: Building) => {
    setSelectedBuilding(building);
    setIsBuildingDetailOpen(true);
  };

  if (authLoading || projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Projects
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Project not found</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <Breadcrumbs
          items={[
            { label: 'Projects', href: '/projects' },
            { label: project.name },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderKanban className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                <Badge variant="outline" className={cn('capitalize', statusColors[project.status])}>
                  {project.status.replace('_', ' ')}
                </Badge>
                {projectHealth && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'flex items-center gap-1 cursor-help',
                            projectHealth.healthStatus === 'critical' && 'bg-destructive/10 text-destructive border-destructive/20',
                            projectHealth.healthStatus === 'warning' && 'bg-warning/10 text-warning border-warning/20',
                            projectHealth.healthStatus === 'good' && 'bg-success/10 text-success border-success/20',
                            projectHealth.healthStatus === 'complete' && 'bg-success/10 text-success border-success/20 ring-1 ring-success/50'
                          )}
                        >
                          <Activity className="w-3 h-3" />
                          {Math.round(projectHealth.combinedHealthScore)}%
                          <span className="capitalize">{projectHealth.healthStatus}</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p>Zone Completeness: {Math.round(projectHealth.zoneCompleteness)}% (75% weight)</p>
                          <p>Specialized Tools: {Math.round(projectHealth.specializedToolsScore)}% (25% weight)</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {project.client_name && (
                <p className="text-muted-foreground">{project.client_name}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {project.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </span>
                )}
                {project.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Started {new Date(project.start_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              {projectHealth && (
                <div className="mt-3">
                  <SpecializedToolsBadges
                    hasChilledWaterPlant={projectHealth.hasChilledWaterPlant}
                    hasHotWaterPlant={projectHealth.hasHotWaterPlant}
                    hasSmokeControl={projectHealth.hasSmokeControl}
                    hasThermalComfort={projectHealth.hasThermalComfort}
                    hasSBCCompliance={projectHealth.hasSBCCompliance}
                    hasASHRAE90_1Compliance={projectHealth.hasASHRAE90_1Compliance}
                    hasAHUConfiguration={projectHealth.hasAHUConfiguration}
                    hasFanSelections={projectHealth.hasFanSelections}
                    hasPumpSelections={projectHealth.hasPumpSelections}
                    hasInsulationCalculations={projectHealth.hasInsulationCalculations}
                    hasSequenceOfOperations={projectHealth.hasSequenceOfOperations}
                    hasCoilSelections={projectHealth.hasCoilSelections}
                    hasFilterSelections={projectHealth.hasFilterSelections}
                    hasCoolingTowerSelections={projectHealth.hasCoolingTowerSelections}
                    hasEconomizerSelections={projectHealth.hasEconomizerSelections}
                    hasControlValveSelections={projectHealth.hasControlValveSelections}
                    hasExpansionTankSelections={projectHealth.hasExpansionTankSelections}
                    hasSilencerSelections={projectHealth.hasSilencerSelections}
                    hasVibrationIsolationSelections={projectHealth.hasVibrationIsolationSelections}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-muted-foreground max-w-2xl">{project.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projectBuildings.length}</p>
                <p className="text-xs text-muted-foreground">Buildings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projectEquipment.length}</p>
                <p className="text-xs text-muted-foreground">Equipment</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projectBuildings.reduce((sum, b) => sum + (b.total_floors || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Floors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projectBuildings.reduce((sum, b) => sum + (b.total_area_sqm || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total m²</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Customers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customers
              {projectCustomers && projectCustomers.length > 0 && (
                <Badge variant="secondary">{projectCustomers.length}</Badge>
              )}
            </h2>
          </div>

          {/* Add Customer */}
          <div className="flex gap-2">
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="flex-1 max-w-sm">
                <SelectValue placeholder="Select a customer to link..." />
              </SelectTrigger>
              <SelectContent>
                {availableCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.company_name || customer.contact_name} ({customer.customer_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleLinkCustomer}
              disabled={!selectedCustomerId || addProjectCustomer.isPending}
            >
              <Plus className="w-4 h-4 mr-1" />
              Link Customer
            </Button>
          </div>

          {/* Customers List */}
          {projectCustomers && projectCustomers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projectCustomers.map((pc) => (
                <Card key={pc.id} className="group">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {pc.customer?.company_name || pc.customer?.contact_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{pc.customer?.customer_number}</span>
                          <Badge variant="outline" className="text-xs">
                            {pc.customer?.customer_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleUnlinkCustomer(pc.customer_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No customers linked</p>
                <p className="text-xs text-muted-foreground/70">Link customers using the dropdown above</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Design Summary Dashboard */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Design Summary</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/timeline`)}>
              <Calendar className="w-4 h-4 mr-1" />
              View Timeline
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/design/audit?project=${id}`)}>
              <Activity className="w-4 h-4 mr-1" />
              Audit Design Data
            </Button>
          </div>
        </div>
        <ProjectDesignSummary projectId={id!} />

        <Separator />

        {/* Equipment Section */}
        <ProjectEquipmentSection projectId={id!} />

        <Separator />

        {/* Service Contracts Section */}
        <ProjectContractsSection projectId={id!} />

        <Separator />

        {/* Buildings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Buildings</h2>
            <Button size="sm" onClick={() => setIsAddBuildingOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Building
            </Button>
          </div>

          {buildingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : projectBuildings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectBuildings.map((building) => (
                <Card
                  key={building.id}
                  className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
                  onClick={() => openBuildingDetail(building)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{building.name}</CardTitle>
                        {building.address && (
                          <CardDescription className="text-xs">{building.address}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {building.total_floors && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {building.total_floors} floors
                        </span>
                      )}
                      {building.total_area_sqm && (
                        <span>{building.total_area_sqm.toLocaleString()} m²</span>
                      )}
                      {building.year_built && (
                        <span>Built {building.year_built}</span>
                      )}
                      {getBuildingEquipmentCount(building.id) > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {getBuildingEquipmentCount(building.id)} equipment
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No buildings yet</p>
                <p className="text-sm text-muted-foreground/70">Add your first building to get started</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddBuildingOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Building
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Building Dialog */}
      <Dialog open={isAddBuildingOpen} onOpenChange={setIsAddBuildingOpen}>
        <DialogContent>
          <form onSubmit={handleAddBuilding}>
            <DialogHeader>
              <DialogTitle>Add Building</DialogTitle>
              <DialogDescription>
                Add a new building to {project.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="buildingName">Building Name *</Label>
                <Input
                  id="buildingName"
                  placeholder="e.g., Tower A"
                  value={buildingFormData.name}
                  onChange={(e) => setBuildingFormData({ ...buildingFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buildingAddress">Address</Label>
                <Input
                  id="buildingAddress"
                  placeholder="Street address"
                  value={buildingFormData.address}
                  onChange={(e) => setBuildingFormData({ ...buildingFormData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalFloors">Floors</Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    placeholder="e.g., 10"
                    value={buildingFormData.total_floors}
                    onChange={(e) => setBuildingFormData({ ...buildingFormData, total_floors: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalArea">Area (m²)</Label>
                  <Input
                    id="totalArea"
                    type="number"
                    placeholder="e.g., 5000"
                    value={buildingFormData.total_area_sqm}
                    onChange={(e) => setBuildingFormData({ ...buildingFormData, total_area_sqm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    placeholder="e.g., 2020"
                    value={buildingFormData.year_built}
                    onChange={(e) => setBuildingFormData({ ...buildingFormData, year_built: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddBuildingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBuilding.isPending}>
                {createBuilding.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Building'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Building Detail Drawer */}
      <BuildingDetailDrawer
        building={selectedBuilding}
        open={isBuildingDetailOpen}
        onOpenChange={setIsBuildingDetailOpen}
        onBuildingDeleted={() => setSelectedBuilding(null)}
      />
    </DashboardLayout>
  );
}
