import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TechnicianMetrics, EnrichedAssignment } from '@/hooks/useTechnicianWorkload';
import { useUpdateAssignment } from '@/hooks/useDeficiencyAssignments';
import { useTechnicianSkills } from '@/hooks/useTechnicianSkills';
import { TechnicianSkillsCard } from './TechnicianSkillsCard';
import { TechnicianSkillsEditor } from './TechnicianSkillsEditor';
import { format, parseISO } from 'date-fns';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  Phone,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TechnicianDetailDrawerProps {
  technician: TechnicianMetrics | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechnicianDetailDrawer({ technician, open, onOpenChange }: TechnicianDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [skillsEditorOpen, setSkillsEditorOpen] = useState(false);
  const updateAssignment = useUpdateAssignment();
  const { data: skills } = useTechnicianSkills(technician?.id);

  if (!technician) return null;

  const initials = technician.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const filteredAssignments = technician.assignments.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return a.status === 'assigned';
    if (activeTab === 'in_progress') return a.status === 'in_progress';
    if (activeTab === 'overdue') return a.isOverdue;
    if (activeTab === 'resolved') return a.status === 'resolved';
    return true;
  });

  const handleMarkResolved = async (assignment: EnrichedAssignment) => {
    try {
      await updateAssignment.mutateAsync({
        id: assignment.id,
        status: 'resolved',
      });
      toast.success('Assignment marked as resolved');
    } catch (error) {
      toast.error('Failed to update assignment');
    }
  };

  const handleStartProgress = async (assignment: EnrichedAssignment) => {
    try {
      await updateAssignment.mutateAsync({
        id: assignment.id,
        status: 'in_progress',
      });
      toast.success('Assignment marked as in progress');
    } catch (error) {
      toast.error('Failed to update assignment');
    }
  };

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-destructive" />,
    stable: <Minus className="w-4 h-4 text-muted-foreground" />,
  };

  const priorityColors: Record<string, string> = {
    urgent: 'bg-destructive text-destructive-foreground',
    high: 'bg-orange-500 text-white',
    medium: 'bg-warning text-warning-foreground',
    low: 'bg-muted text-muted-foreground',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    assigned: <Clock className="w-4 h-4 text-primary" />,
    in_progress: <Play className="w-4 h-4 text-blue-500" />,
    resolved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    overdue: <AlertTriangle className="w-4 h-4 text-destructive" />,
  };

  // Mock chart data - would be real weekly data in production
  const weeklyData = [
    { week: 'Week 1', resolved: 3 },
    { week: 'Week 2', resolved: 5 },
    { week: 'Week 3', resolved: 4 },
    { week: 'Week 4', resolved: technician.resolvedThisWeek },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={technician.avatarUrl || undefined} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                {technician.name}
                {trendIcon[technician.trend]}
              </SheetTitle>
              <SheetDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {technician.email}
                </div>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{technician.activeAssignments + technician.inProgressAssignments}</div>
                  <p className="text-sm text-muted-foreground">Active Assignments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{technician.resolutionRate.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{technician.avgResolutionDays.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">Avg Days to Resolve</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className={cn(
                    "text-2xl font-bold",
                    technician.overdueAssignments > 0 && "text-destructive"
                  )}>
                    {technician.overdueAssignments}
                  </div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </CardContent>
              </Card>
            </div>

            {/* Resolution Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Resolution Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overload Warning */}
            {technician.overdueAssignments > 0 || (technician.activeAssignments + technician.inProgressAssignments) > 8 ? (
              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Workload Alert</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(technician.activeAssignments + technician.inProgressAssignments) > 8 
                          ? 'This technician is over capacity. Consider reassigning some tasks.'
                          : `${technician.overdueAssignments} overdue assignment${technician.overdueAssignments > 1 ? 's' : ''} need attention.`
                        }
                      </p>
                      <p className="text-xs text-orange-600 mt-2">
                        Go to Workload Balancing tab for reassignment suggestions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Skills Section */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Skills & Expertise
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setSkillsEditorOpen(true)}
                  >
                    Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {skills && skills.length > 0 ? (
                  <TechnicianSkillsCard skills={skills} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No skills assigned yet. Click "Manage" to add skills.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Assignments List */}
            <div className="space-y-3">
              <h3 className="font-semibold">Assignments</h3>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                  <TabsTrigger value="overdue" className="flex-1">Overdue</TabsTrigger>
                  <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                {filteredAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No assignments in this category
                  </p>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <Card key={assignment.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {assignment.isOverdue 
                            ? statusIcons.overdue 
                            : statusIcons[assignment.status]}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              Assignment #{assignment.id.slice(0, 8)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={priorityColors[assignment.priority]}>
                                {assignment.priority}
                              </Badge>
                              {assignment.dueDate && (
                                <span className={cn(
                                  "text-xs",
                                  assignment.isOverdue ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  Due: {format(parseISO(assignment.dueDate), 'MMM d')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {assignment.status !== 'resolved' && (
                          <div className="flex gap-1">
                            {assignment.status === 'assigned' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleStartProgress(assignment)}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleMarkResolved(assignment)}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Skills Editor Dialog */}
        <TechnicianSkillsEditor
          open={skillsEditorOpen}
          onOpenChange={setSkillsEditorOpen}
          technicianId={technician.id}
          technicianName={technician.name}
        />
      </SheetContent>
    </Sheet>
  );
}
