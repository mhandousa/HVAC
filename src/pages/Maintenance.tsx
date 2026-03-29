import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePMSchedules, useCreatePMSchedule, useCompletePM, useUpdatePMSchedule, useGenerateWorkOrders } from '@/hooks/usePMSchedules';
import { useEquipment } from '@/hooks/useEquipment';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  Calendar,
  Clock,
  Wrench,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Repeat,
  Play,
  Pause,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-info/10 text-info border-info/20' },
  high: { label: 'High', className: 'bg-warning/10 text-warning border-warning/20' },
};

export default function Maintenance() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: pmSchedules = [], isLoading } = usePMSchedules();
  const { data: equipment = [] } = useEquipment();
  const createPMSchedule = useCreatePMSchedule();
  const completePM = useCompletePM();
  const updatePMSchedule = useUpdatePMSchedule();
  const generateWorkOrders = useGenerateWorkOrders();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    equipment_id: '',
    frequency_type: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    frequency_value: 1,
    next_due_at: '',
    estimated_hours: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleCreatePM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      await createPMSchedule.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        equipment_id: formData.equipment_id || undefined,
        frequency_type: formData.frequency_type,
        frequency_value: formData.frequency_value,
        next_due_at: formData.next_due_at || undefined,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
        priority: formData.priority,
      });
      toast.success('PM schedule created');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        equipment_id: '',
        frequency_type: 'monthly',
        frequency_value: 1,
        next_due_at: '',
        estimated_hours: '',
        priority: 'medium',
      });
    } catch (error) {
      toast.error('Failed to create PM schedule');
    }
  };

  const handleComplete = async (pm: typeof pmSchedules[0]) => {
    try {
      await completePM.mutateAsync({
        id: pm.id,
        frequency_type: pm.frequency_type,
        frequency_value: pm.frequency_value,
      });
      toast.success('PM marked as complete');
    } catch (error) {
      toast.error('Failed to complete PM');
    }
  };

  const handleToggleActive = async (pm: typeof pmSchedules[0]) => {
    try {
      await updatePMSchedule.mutateAsync({
        id: pm.id,
        is_active: !pm.is_active,
      });
      toast.success(pm.is_active ? 'PM paused' : 'PM resumed');
    } catch (error) {
      toast.error('Failed to update PM');
    }
  };

  const handleGenerateWorkOrders = async () => {
    try {
      const result = await generateWorkOrders.mutateAsync();
      if (result.created === 0 && result.skipped === 0) {
        toast.info('No overdue PM schedules found');
      } else if (result.created === 0) {
        toast.info(`All ${result.skipped} overdue PMs already have open work orders`);
      } else {
        toast.success(`Created ${result.created} work order${result.created > 1 ? 's' : ''} from overdue PMs`);
      }
    } catch (error) {
      toast.error('Failed to generate work orders');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredSchedules = pmSchedules.filter((pm) => {
    const matchesSearch =
      pm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pm.equipment?.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    if (statusFilter === 'active') return matchesSearch && pm.is_active;
    if (statusFilter === 'paused') return matchesSearch && !pm.is_active;
    if (statusFilter === 'overdue') {
      return matchesSearch && pm.is_active && pm.next_due_at && pm.next_due_at < today;
    }
    if (statusFilter === 'due-soon') {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return matchesSearch && pm.is_active && pm.next_due_at && pm.next_due_at <= sevenDaysFromNow && pm.next_due_at >= today;
    }
    return matchesSearch;
  });

  const stats = {
    total: pmSchedules.filter(pm => pm.is_active).length,
    overdue: pmSchedules.filter(pm => pm.is_active && pm.next_due_at && pm.next_due_at < today).length,
    dueSoon: pmSchedules.filter(pm => {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return pm.is_active && pm.next_due_at && pm.next_due_at <= sevenDaysFromNow && pm.next_due_at >= today;
    }).length,
    completedThisMonth: pmSchedules.filter(pm => {
      if (!pm.last_completed_at) return false;
      const completed = new Date(pm.last_completed_at);
      const now = new Date();
      return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
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
            <h1 className="text-2xl font-bold text-foreground">Preventive Maintenance</h1>
            <p className="text-muted-foreground">
              Schedule and track recurring maintenance tasks
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleGenerateWorkOrders}
              disabled={generateWorkOrders.isPending || stats.overdue === 0}
            >
              {generateWorkOrders.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Generate Work Orders
              {stats.overdue > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {stats.overdue}
                </Badge>
              )}
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New PM Schedule
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <form onSubmit={handleCreatePM}>
                <DialogHeader>
                  <DialogTitle>Create PM Schedule</DialogTitle>
                  <DialogDescription>
                    Set up a recurring preventive maintenance task
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Task Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Quarterly Filter Replacement"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipment">Equipment</Label>
                      <Select
                        value={formData.equipment_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, equipment_id: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {equipment.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.tag} - {eq.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={formData.frequency_type}
                        onValueChange={(value: typeof formData.frequency_type) => setFormData({ ...formData, frequency_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Every</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.frequency_value}
                        onChange={(e) => setFormData({ ...formData, frequency_value: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="next_due">First Due Date</Label>
                      <Input
                        id="next_due"
                        type="date"
                        value={formData.next_due_at}
                        onChange={(e) => setFormData({ ...formData, next_due_at: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hours">Estimated Hours</Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.5"
                        placeholder="e.g., 2.5"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Detailed procedure or notes..."
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
                  <Button type="submit" disabled={createPMSchedule.isPending}>
                    {createPMSchedule.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Schedule'
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
                  <p className="text-sm text-muted-foreground">Active Schedules</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Due This Week</p>
                  <p className="text-2xl font-bold">{stats.dueSoon}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed This Month</p>
                  <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search PM schedules..."
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
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due-soon">Due Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PM Schedules Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              PM Schedules
            </CardTitle>
            <CardDescription>Recurring preventive maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSchedules.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Last Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((pm) => {
                      const isOverdue = pm.is_active && pm.next_due_at && pm.next_due_at < today;
                      const isDueSoon = pm.is_active && pm.next_due_at && !isOverdue && 
                        pm.next_due_at <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      
                      return (
                        <TableRow key={pm.id} className={cn(!pm.is_active && 'opacity-50')}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pm.name}</p>
                              {pm.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{pm.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pm.equipment ? (
                              <span className="font-mono text-sm">{pm.equipment.tag}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              Every {pm.frequency_value > 1 ? `${pm.frequency_value} ` : ''}
                              {frequencyLabels[pm.frequency_type].toLowerCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {pm.next_due_at ? (
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'text-sm',
                                  isOverdue && 'text-destructive font-medium',
                                  isDueSoon && 'text-warning font-medium'
                                )}>
                                  {new Date(pm.next_due_at).toLocaleDateString()}
                                </span>
                                {isOverdue && <AlertTriangle className="w-4 h-4 text-destructive" />}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pm.last_completed_at ? (
                              <span className="text-sm text-muted-foreground">
                                {new Date(pm.last_completed_at).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn('text-[10px]', priorityConfig[pm.priority].className)}
                              >
                                {priorityConfig[pm.priority].label}
                              </Badge>
                              {!pm.is_active && (
                                <Badge variant="outline" className="text-[10px]">Paused</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleComplete(pm)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(pm)}>
                                  {pm.is_active ? (
                                    <>
                                      <Pause className="w-4 h-4 mr-2" />
                                      Pause Schedule
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Resume Schedule
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarClock className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-1">No PM schedules found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first preventive maintenance schedule'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New PM Schedule
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
