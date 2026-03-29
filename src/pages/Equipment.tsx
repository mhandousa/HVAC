import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEquipment, useCreateEquipment, getWarrantyStatus, getEquipmentAge, Equipment as EquipmentType } from '@/hooks/useEquipment';
import { useProfile } from '@/hooks/useOrganization';
import { useProjects } from '@/hooks/useProjects';
import { useEquipmentLocationPaths } from '@/hooks/useLocationHierarchy';
import { EquipmentDetailDrawer } from '@/components/equipment/EquipmentDetailDrawer';
import { EquipmentLocationBadge } from '@/components/equipment/EquipmentLocationBadge';
import { LocationSelector } from '@/components/equipment/LocationSelector';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Box,
  MoreHorizontal,
  Loader2,
  Wind,
  Snowflake,
  Flame,
  Droplets,
  Fan,
  Cpu,
  Thermometer,
  Grid3X3,
  List,
  Calendar,
  Shield,
  FolderKanban,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const equipmentTypes = [
  { value: 'ahu', label: 'Air Handling Unit', icon: Wind },
  { value: 'chiller', label: 'Chiller', icon: Snowflake },
  { value: 'boiler', label: 'Boiler', icon: Flame },
  { value: 'pump', label: 'Pump', icon: Droplets },
  { value: 'fan', label: 'Fan', icon: Fan },
  { value: 'vav', label: 'VAV Box', icon: Box },
  { value: 'fcu', label: 'Fan Coil Unit', icon: Wind },
  { value: 'vrf', label: 'VRF System', icon: Snowflake },
  { value: 'cooling_tower', label: 'Cooling Tower', icon: Droplets },
  { value: 'thermostat', label: 'Thermostat', icon: Thermometer },
  { value: 'sensor', label: 'Sensor', icon: Cpu },
  { value: 'controller', label: 'Controller', icon: Cpu },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  operational: { label: 'Operational', className: 'bg-success/10 text-success border-success/20' },
  maintenance: { label: 'Maintenance', className: 'bg-warning/10 text-warning border-warning/20' },
  fault: { label: 'Fault', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  offline: { label: 'Offline', className: 'bg-muted text-muted-foreground border-border' },
  decommissioned: { label: 'Decommissioned', className: 'bg-muted text-muted-foreground border-border' },
};

export default function Equipment() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: equipment, isLoading: equipmentLoading } = useEquipment();
  const { data: projects } = useProjects();
  const createEquipment = useCreateEquipment();
  const navigate = useNavigate();
  
  // Location paths for equipment
  const equipmentForPaths = (equipment || []).map(eq => ({
    id: eq.id,
    zone_id: eq.zone_id,
    project_id: eq.project_id,
  }));
  const { data: locationPaths } = useEquipmentLocationPaths(equipmentForPaths);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formData, setFormData] = useState({
    tag: '',
    name: '',
    manufacturer: '',
    model: '',
    equipment_type: '',
    install_date: '',
    warranty_expiry: '',
    project_id: undefined as string | undefined,
    zone_id: undefined as string | undefined,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const getEquipmentIcon = (type: string | null) => {
    const found = equipmentTypes.find((t) => t.value === type);
    return found?.icon || Box;
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tag.trim() || !formData.name.trim()) {
      toast.error('Tag and name are required');
      return;
    }

    if (!profile?.organization_id) {
      toast.error('Please create an organization first');
      navigate('/dashboard');
      return;
    }

    await createEquipment.mutateAsync({
      tag: formData.tag,
      name: formData.name,
      manufacturer: formData.manufacturer || undefined,
      model: formData.model || undefined,
      equipment_type: formData.equipment_type || undefined,
      install_date: formData.install_date || undefined,
      warranty_expiry: formData.warranty_expiry || undefined,
      project_id: formData.project_id,
      zone_id: formData.zone_id,
    });
    
    setIsCreateOpen(false);
    setFormData({ tag: '', name: '', manufacturer: '', model: '', equipment_type: '', install_date: '', warranty_expiry: '', project_id: undefined, zone_id: undefined });
  };

  const filteredEquipment = (equipment || []).filter((item) => {
    const matchesSearch =
      item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.equipment_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    // Project filter - match direct project_id or via zone's project
    const matchesProject = projectFilter === 'all' || (() => {
      if (item.project_id === projectFilter) return true;
      const path = locationPaths?.get(item.id);
      return path?.projectId === projectFilter;
    })();
    
    return matchesSearch && matchesType && matchesStatus && matchesProject;
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
            <h1 className="text-2xl font-bold text-foreground">Equipment</h1>
            <p className="text-muted-foreground">
              Manage your HVAC equipment inventory and assets
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreateEquipment}>
                <DialogHeader>
                  <DialogTitle>Add Equipment</DialogTitle>
                  <DialogDescription>
                    Add a new piece of equipment to your inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tag">Equipment Tag *</Label>
                      <Input
                        id="tag"
                        placeholder="e.g., AHU-01"
                        value={formData.tag}
                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.equipment_type}
                        onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Rooftop Air Handler #1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        placeholder="e.g., Carrier"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        placeholder="e.g., 23XRV"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="install_date">Install Date</Label>
                      <Input
                        id="install_date"
                        type="date"
                        value={formData.install_date}
                        onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                      <Input
                        id="warranty_expiry"
                        type="date"
                        value={formData.warranty_expiry}
                        onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {/* Location Assignment */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-medium">Location (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Assign this equipment to a project and specific zone
                    </p>
                    <LocationSelector
                      projectId={formData.project_id}
                      zoneId={formData.zone_id}
                      onProjectChange={(projectId) => setFormData({ ...formData, project_id: projectId, zone_id: undefined })}
                      onZoneChange={(zoneId) => setFormData({ ...formData, zone_id: zoneId })}
                      compact
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEquipment.isPending}>
                    {createEquipment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Equipment'
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
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {equipmentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="fault">Fault</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" />
                    {project.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {equipmentLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Equipment Grid/List */}
        {!equipmentLoading && filteredEquipment.length > 0 && viewMode === 'grid' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEquipment.map((item) => {
              const Icon = getEquipmentIcon(item.equipment_type);
              const status = statusConfig[item.status] || statusConfig.operational;
              const warranty = getWarrantyStatus(item.warranty_expiry);
              const age = getEquipmentAge(item.install_date);
              const locationPath = locationPaths?.get(item.id);
              return (
                <Card
                  key={item.id}
                  className="group hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedEquipment(item);
                    setIsDetailOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-mono">{item.tag}</CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {item.name}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedEquipment(item);
                            setIsDetailOpen(true);
                          }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View History</DropdownMenuItem>
                          <DropdownMenuItem>Create Work Order</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      {item.manufacturer && (
                        <p className="text-muted-foreground">
                          {item.manufacturer} {item.model && `• ${item.model}`}
                        </p>
                      )}
                      {age.years !== null && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {age.label}
                        </p>
                      )}
                    </div>
                    {/* Location Badge */}
                    <EquipmentLocationBadge locationPath={locationPath} compact />
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={cn('text-xs', status.className)}>
                        {status.label}
                      </Badge>
                      {item.warranty_expiry && (
                        <Badge variant="outline" className={cn('text-xs gap-1', warranty.className)}>
                          <Shield className="w-3 h-3" />
                          {warranty.label}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!equipmentLoading && filteredEquipment.length > 0 && viewMode === 'list' && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => {
                  const status = statusConfig[item.status] || statusConfig.operational;
                  const typeLabel = equipmentTypes.find((t) => t.value === item.equipment_type)?.label || '—';
                  const warranty = getWarrantyStatus(item.warranty_expiry);
                  const locationPath = locationPaths?.get(item.id);
                  return (
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedEquipment(item);
                        setIsDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-mono font-medium">{item.tag}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <EquipmentLocationBadge locationPath={locationPath} compact />
                      </TableCell>
                      <TableCell>{typeLabel}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', status.className)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.warranty_expiry ? (
                          <Badge variant="outline" className={cn('text-xs gap-1', warranty.className)}>
                            <Shield className="w-3 h-3" />
                            {warranty.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedEquipment(item);
                              setIsDetailOpen(true);
                            }}>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Create Work Order</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Empty State */}
        {!equipmentLoading && filteredEquipment.length === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Box className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-1">No equipment found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding equipment to your inventory'}
              </p>
              {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Equipment
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Equipment Detail Drawer */}
        <EquipmentDetailDrawer
          equipment={selectedEquipment}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      </div>
    </DashboardLayout>
  );
}
