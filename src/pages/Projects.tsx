import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { useBuildings, useCreateBuilding, Building } from '@/hooks/useBuildings';
import { useDesignHealthScores } from '@/hooks/useDesignHealthScores';
import { BuildingDetailDrawer } from '@/components/buildings/BuildingDetailDrawer';
import { SpecializedToolsBadges } from '@/components/projects/SpecializedToolsBadges';
import { useProfile } from '@/hooks/useOrganization';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  FolderKanban,
  MapPin,
  Building2,
  Calendar,
  MoreHorizontal,
  Loader2,
  Eye,
  Activity,
} from 'lucide-react';
import { getSeverity } from '@/lib/design-completeness-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Project } from '@/hooks/useProjects';

const buildingTypes = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'residential', label: 'Residential' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
];

const statusColors: Record<string, string> = {
  planning: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-muted text-muted-foreground border-border',
  on_hold: 'bg-warning/10 text-warning border-warning/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

const projectStatuses = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export default function Projects() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: healthData } = useDesignHealthScores();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const createBuilding = useCreateBuilding();
  const navigate = useNavigate();

  const getProjectHealth = (projectId: string) => {
    return healthData?.projects?.find(p => p.projectId === projectId);
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isBuildingDetailOpen, setIsBuildingDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Fetch buildings for all projects
  const { data: allBuildings } = useBuildings();

  // Form state for create project
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_name: '',
    location: '',
    building_type: '',
  });

  // Form state for edit project
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    client_name: '',
    location: '',
    building_type: '',
    status: '',
  });

  // Form state for add building
  const [buildingFormData, setBuildingFormData] = useState({
    name: '',
    address: '',
    total_floors: '',
    total_area_sqm: '',
    year_built: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!profile?.organization_id) {
      toast.error('Please create an organization first');
      navigate('/dashboard');
      return;
    }

    await createProject.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      client_name: formData.client_name || undefined,
      location: formData.location || undefined,
      building_type: formData.building_type || undefined,
    });
    
    setIsCreateOpen(false);
    setFormData({ name: '', description: '', client_name: '', location: '', building_type: '' });
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!editFormData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    await updateProject.mutateAsync({
      id: selectedProject.id,
      name: editFormData.name,
      description: editFormData.description || null,
      client_name: editFormData.client_name || null,
      location: editFormData.location || null,
      building_type: editFormData.building_type || null,
      status: editFormData.status,
    });
    
    setIsEditOpen(false);
    setSelectedProject(null);
  };

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!buildingFormData.name.trim()) {
      toast.error('Building name is required');
      return;
    }

    await createBuilding.mutateAsync({
      project_id: selectedProject.id,
      name: buildingFormData.name,
      address: buildingFormData.address || undefined,
      total_floors: buildingFormData.total_floors ? parseInt(buildingFormData.total_floors) : undefined,
      total_area_sqm: buildingFormData.total_area_sqm ? parseFloat(buildingFormData.total_area_sqm) : undefined,
      year_built: buildingFormData.year_built ? parseInt(buildingFormData.year_built) : undefined,
    });
    
    setIsAddBuildingOpen(false);
    setSelectedProject(null);
    setBuildingFormData({ name: '', address: '', total_floors: '', total_area_sqm: '', year_built: '' });
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setEditFormData({
      name: project.name,
      description: project.description || '',
      client_name: project.client_name || '',
      location: project.location || '',
      building_type: project.building_type || '',
      status: project.status,
    });
    setIsEditOpen(true);
  };

  const openAddBuildingDialog = (project: Project) => {
    setSelectedProject(project);
    setBuildingFormData({ name: '', address: '', total_floors: '', total_area_sqm: '', year_built: '' });
    setIsAddBuildingOpen(true);
  };

  const openBuildingDetail = (building: Building) => {
    setSelectedBuilding(building);
    setIsBuildingDetailOpen(true);
  };

  const getProjectBuildings = (projectId: string) => {
    return (allBuildings || []).filter(b => b.project_id === projectId);
  };

  const filteredProjects = (projects || []).filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    // Health filter logic
    const projectHealth = getProjectHealth(project.id);
    const matchesHealth = healthFilter === 'all' || 
      (projectHealth && projectHealth.healthStatus === healthFilter);
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">
              Manage your HVAC projects and building assignments
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreateProject}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new HVAC project to your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Downtown Office Tower"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Client Name</Label>
                    <Input
                      id="client"
                      placeholder="e.g., Metro Properties LLC"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, State"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Building Type</Label>
                      <Select
                        value={formData.building_type}
                        onValueChange={(value) => setFormData({ ...formData, building_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildingTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief project description..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProject.isPending}>
                    {createProject.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="critical">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Critical (0-32%)
                </span>
              </SelectItem>
              <SelectItem value="warning">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  Warning (33-65%)
                </span>
              </SelectItem>
              <SelectItem value="good">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Good (66-99%)
                </span>
              </SelectItem>
              <SelectItem value="complete">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success ring-1 ring-success/50" />
                  Complete (100%)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Design Health Summary Card */}
        {healthData?.summary && healthData.summary.totalProjects > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Design Health Overview
                  </CardTitle>
                  <CardDescription>
                    Organization-wide project health status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Total Projects */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-3xl font-bold">{healthData.summary.totalProjects}</p>
                </div>
                
                {/* Average Health Score */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Health</p>
                  {(() => {
                    const severity = getSeverity(healthData.summary.averageCombinedScore);
                    return (
                      <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold">{Math.round(healthData.summary.averageCombinedScore)}%</p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            severity.id === 'critical' && 'bg-destructive/10 text-destructive border-destructive/20',
                            severity.id === 'warning' && 'bg-warning/10 text-warning border-warning/20',
                            severity.id === 'good' && 'bg-success/10 text-success border-success/20',
                            severity.id === 'complete' && 'bg-success/10 text-success border-success/20'
                          )}
                        >
                          {severity.id === 'critical' && 'Critical'}
                          {severity.id === 'warning' && 'Warning'}
                          {severity.id === 'good' && 'Good'}
                          {severity.id === 'complete' && 'Complete'}
                        </Badge>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Status Breakdown */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status Breakdown</p>
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      {healthData.summary.criticalProjects} Critical
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      {healthData.summary.warningProjects} Warning
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      {healthData.summary.goodProjects} Good
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success ring-1 ring-success/50" />
                      {healthData.summary.completeProjects} Complete
                    </span>
                  </div>
                </div>
                
                {/* Distribution Bar */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Distribution</p>
                  <div className="h-4 rounded-full overflow-hidden flex bg-muted">
                    {healthData.summary.criticalProjects > 0 && (
                      <div 
                        className="bg-destructive h-full" 
                        style={{ width: `${(healthData.summary.criticalProjects / healthData.summary.totalProjects) * 100}%` }} 
                      />
                    )}
                    {healthData.summary.warningProjects > 0 && (
                      <div 
                        className="bg-warning h-full" 
                        style={{ width: `${(healthData.summary.warningProjects / healthData.summary.totalProjects) * 100}%` }} 
                      />
                    )}
                    {healthData.summary.goodProjects > 0 && (
                      <div 
                        className="bg-success h-full" 
                        style={{ width: `${(healthData.summary.goodProjects / healthData.summary.totalProjects) * 100}%` }} 
                      />
                    )}
                    {healthData.summary.completeProjects > 0 && (
                      <div 
                        className="bg-success h-full ring-1 ring-inset ring-success/30" 
                        style={{ width: `${(healthData.summary.completeProjects / healthData.summary.totalProjects) * 100}%` }} 
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Critical</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {projectsLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </div>
        )}

        {/* Projects Grid */}
        {!projectsLoading && filteredProjects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        {project.client_name && (
                          <CardDescription className="text-xs">
                            {project.client_name}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(project)}>
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAddBuildingDialog(project)}>
                          Add Building
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {project.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </span>
                    )}
                    {project.building_type && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {buildingTypes.find((t) => t.value === project.building_type)?.label}
                      </span>
                    )}
                    {project.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Buildings List */}
                  {getProjectBuildings(project.id).length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Buildings</p>
                      <div className="flex flex-wrap gap-1">
                        {getProjectBuildings(project.id).map((building) => (
                          <Badge
                            key={building.id}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBuildingDetail(building);
                            }}
                          >
                            <Building2 className="w-3 h-3 mr-1" />
                            {building.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialized Tools Status */}
                  {getProjectHealth(project.id) && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Design Tools</p>
                      <SpecializedToolsBadges
                        hasChilledWaterPlant={getProjectHealth(project.id)!.hasChilledWaterPlant}
                        hasHotWaterPlant={getProjectHealth(project.id)!.hasHotWaterPlant}
                        hasSmokeControl={getProjectHealth(project.id)!.hasSmokeControl}
                        hasThermalComfort={getProjectHealth(project.id)!.hasThermalComfort}
                        hasSBCCompliance={getProjectHealth(project.id)!.hasSBCCompliance}
                        hasASHRAE90_1Compliance={getProjectHealth(project.id)!.hasASHRAE90_1Compliance}
                        hasAHUConfiguration={getProjectHealth(project.id)!.hasAHUConfiguration}
                        hasFanSelections={getProjectHealth(project.id)!.hasFanSelections}
                        hasPumpSelections={getProjectHealth(project.id)!.hasPumpSelections}
                        hasInsulationCalculations={getProjectHealth(project.id)!.hasInsulationCalculations}
                        hasSequenceOfOperations={getProjectHealth(project.id)!.hasSequenceOfOperations}
                        hasCoilSelections={getProjectHealth(project.id)!.hasCoilSelections}
                        hasFilterSelections={getProjectHealth(project.id)!.hasFilterSelections}
                        hasCoolingTowerSelections={getProjectHealth(project.id)!.hasCoolingTowerSelections}
                        hasEconomizerSelections={getProjectHealth(project.id)!.hasEconomizerSelections}
                        hasControlValveSelections={getProjectHealth(project.id)!.hasControlValveSelections}
                        hasExpansionTankSelections={getProjectHealth(project.id)!.hasExpansionTankSelections}
                        hasSilencerSelections={getProjectHealth(project.id)!.hasSilencerSelections}
                        hasVibrationIsolationSelections={getProjectHealth(project.id)!.hasVibrationIsolationSelections}
                        compact
                      />
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn('capitalize text-xs', statusColors[project.status] || statusColors.active)}
                    >
                      {project.status.replace('_', ' ')}
                    </Badge>
                    
                    {/* Design Health Score Badge with Tooltip */}
                    {getProjectHealth(project.id) && (() => {
                      const health = getProjectHealth(project.id)!;
                      const severity = getSeverity(health.combinedHealthScore);
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="text-xs gap-1 cursor-help"
                              style={{
                                backgroundColor: `${severity.bgColor}20`,
                                borderColor: `${severity.bgColor}40`,
                                color: severity.bgColor,
                              }}
                            >
                              <Activity className="w-3 h-3" />
                              {health.combinedHealthScore}% Health
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="w-56">
                            <div className="space-y-2">
                              <p className="font-medium text-sm">Design Health Breakdown</p>
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Zone Completeness (75%)</span>
                                  <span className="font-medium">{health.zoneCompleteness}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Specialized Tools (25%)</span>
                                  <span className="font-medium">{health.specializedToolsScore}%</span>
                                </div>
                              </div>
                              <div className="pt-1.5 border-t flex justify-between text-xs">
                                <span className="text-muted-foreground">Combined Score</span>
                                <span className="font-semibold">{health.combinedHealthScore}%</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!projectsLoading && filteredProjects.length === 0 && (
          <Card className="py-8">
            <EmptyState
              icon={FolderKanban}
              title={searchQuery || statusFilter !== 'all' || healthFilter !== 'all' ? 'No projects found' : 'No projects yet'}
              description={
                searchQuery || statusFilter !== 'all' || healthFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first HVAC project'
              }
              action={
                !searchQuery && statusFilter === 'all' && healthFilter === 'all'
                  ? { label: 'Create Project', onClick: () => setIsCreateOpen(true) }
                  : undefined
              }
              secondaryAction={
                searchQuery || statusFilter !== 'all' || healthFilter !== 'all'
                  ? { label: 'Clear Filters', onClick: () => { setSearchQuery(''); setStatusFilter('all'); setHealthFilter('all'); } }
                  : undefined
              }
            />
          </Card>
        )}

        {/* Edit Project Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleEditProject}>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>
                  Update project details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-client">Client Name</Label>
                  <Input
                    id="edit-client"
                    value={editFormData.client_name}
                    onChange={(e) => setEditFormData({ ...editFormData, client_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Building Type</Label>
                    <Select
                      value={editFormData.building_type || "none"}
                      onValueChange={(value) => setEditFormData({ ...editFormData, building_type: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {buildingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProject.isPending}>
                  {updateProject.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Building Dialog */}
        <Dialog open={isAddBuildingOpen} onOpenChange={setIsAddBuildingOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddBuilding}>
              <DialogHeader>
                <DialogTitle>Add Building</DialogTitle>
                <DialogDescription>
                  Add a new building to {selectedProject?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="building-name">Building Name *</Label>
                  <Input
                    id="building-name"
                    placeholder="e.g., Tower A"
                    value={buildingFormData.name}
                    onChange={(e) => setBuildingFormData({ ...buildingFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building-address">Address</Label>
                  <Input
                    id="building-address"
                    placeholder="Full address"
                    value={buildingFormData.address}
                    onChange={(e) => setBuildingFormData({ ...buildingFormData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="building-floors">Total Floors</Label>
                    <Input
                      id="building-floors"
                      type="number"
                      placeholder="e.g., 10"
                      value={buildingFormData.total_floors}
                      onChange={(e) => setBuildingFormData({ ...buildingFormData, total_floors: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building-area">Area (sqm)</Label>
                    <Input
                      id="building-area"
                      type="number"
                      placeholder="e.g., 5000"
                      value={buildingFormData.total_area_sqm}
                      onChange={(e) => setBuildingFormData({ ...buildingFormData, total_area_sqm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building-year">Year Built</Label>
                    <Input
                      id="building-year"
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
        />
      </div>
    </DashboardLayout>
  );
}
