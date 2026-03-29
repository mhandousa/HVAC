import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { useLocationHierarchyFilter } from '@/hooks/useLocationHierarchyFilter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LocationFilter } from '@/components/filters/LocationFilter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Wrench,
  Calendar,
  Clock,
  User,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Timer,
  CalendarClock,
  LayoutGrid,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-info/10 text-info border-info/20' },
  high: { label: 'High', className: 'bg-warning/10 text-warning border-warning/20' },
  urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const statusConfig = {
  open: { label: 'Open', icon: AlertCircle, className: 'text-info' },
  in_progress: { label: 'In Progress', icon: Timer, className: 'text-warning' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'text-success' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, className: 'text-muted-foreground' },
};

export default function Service() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: workOrders = [], isLoading } = useWorkOrders();
  const { data: locationData } = useLocationHierarchyFilter();
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    equipment_tag: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await createWorkOrder.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        equipment_tag: formData.equipment_tag || undefined,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
      });
      toast.success('Work order created');
      setIsCreateOpen(false);
      setFormData({ title: '', description: '', equipment_tag: '', priority: 'medium', due_date: '' });
    } catch (error) {
      toast.error('Failed to create work order');
    }
  };

  const handleStatusChange = async (id: string, status: 'open' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateWorkOrder.mutateAsync({ id, status });
      toast.success(`Status updated to ${statusConfig[status].label}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Get zone IDs that match the location filters
  const getMatchingZoneIds = () => {
    if (!locationData) return null;
    
    if (zoneFilter !== 'all') {
      return new Set([zoneFilter]);
    }
    if (floorFilter !== 'all') {
      return new Set(locationData.zones.filter(z => z.floor_id === floorFilter).map(z => z.id));
    }
    if (buildingFilter !== 'all') {
      const floorIds = new Set(locationData.floors.filter(f => f.building_id === buildingFilter).map(f => f.id));
      return new Set(locationData.zones.filter(z => floorIds.has(z.floor_id)).map(z => z.id));
    }
    return null; // No location filter active
  };

  const matchingZoneIds = getMatchingZoneIds();

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.equipment_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || wo.priority === priorityFilter;
    const matchesLocation = matchingZoneIds === null || (wo.zone_id && matchingZoneIds.has(wo.zone_id));
    return matchesSearch && matchesStatus && matchesPriority && matchesLocation;
  });

  const stats = {
    open: workOrders.filter((wo) => wo.status === 'open').length,
    inProgress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    fromPM: workOrders.filter((wo) => wo.pm_schedule_id !== null).length,
    overdue: workOrders.filter((wo) => {
      const today = new Date().toISOString().split('T')[0];
      return wo.due_date && wo.due_date < today && wo.status !== 'completed';
    }).length,
  };

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
            <h1 className="text-2xl font-bold text-foreground">Field Service</h1>
            <p className="text-muted-foreground">
              Manage work orders and service requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/service/dispatch">
                <LayoutGrid className="w-4 h-4" />
                Dispatch Board
              </Link>
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Work Order
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreateWorkOrder}>
                <DialogHeader>
                  <DialogTitle>Create Work Order</DialogTitle>
                  <DialogDescription>
                    Create a new maintenance or service request
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of the work"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipment">Equipment Tag</Label>
                      <Input
                        id="equipment"
                        placeholder="e.g., AHU-01"
                        value={formData.equipment_tag}
                        onChange={(e) => setFormData({ ...formData, equipment_tag: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed description of the issue or work required..."
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
                  <Button type="submit" disabled={createWorkOrder.isPending}>
                    {createWorkOrder.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Work Order'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{stats.open}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">From PM</p>
                  <p className="text-2xl font-bold">{stats.fromPM}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <LocationFilter
            buildingId={buildingFilter}
            floorId={floorFilter}
            zoneId={zoneFilter}
            onBuildingChange={setBuildingFilter}
            onFloorChange={setFloorFilter}
            onZoneChange={setZoneFilter}
          />
        </div>

        {/* Work Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredWorkOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredWorkOrders.map((wo) => {
              const priority = priorityConfig[wo.priority];
              const status = statusConfig[wo.status];
              const StatusIcon = status.icon;
              return (
                <Card key={wo.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className={cn('mt-0.5', status.className)}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{wo.title}</h3>
                          {wo.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {wo.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(wo.id, 'open')}>
                              Mark as Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(wo.id, 'in_progress')}>
                              Mark as In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(wo.id, 'completed')}>
                              Mark as Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(wo.id, 'cancelled')}>
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {wo.pm_schedule && (
                          <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                            <CalendarClock className="w-3 h-3" />
                            PM: {wo.pm_schedule.name}
                          </Badge>
                        )}
                        {wo.equipment_tag && (
                          <span className="flex items-center gap-1 font-mono">
                            <Wrench className="w-3 h-3" />
                            {wo.equipment_tag}
                          </span>
                        )}
                        {wo.assigned_profile?.full_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {wo.assigned_profile.full_name}
                          </span>
                        )}
                        {wo.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(wo.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <Badge variant="outline" className={cn('text-[10px]', priority.className)}>
                          {priority.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Wrench className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-1">No work orders found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first work order to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Work Order
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
