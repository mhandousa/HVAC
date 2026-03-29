import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useOrganization, useInitializeProfile, useCreateOrganization } from '@/hooks/useOrganization';
import { useEquipmentWithExpiringWarranties, getWarrantyStatus } from '@/hooks/useEquipment';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { DesignHealthScoreCard } from '@/components/dashboard/DesignHealthScoreCard';
import { AcousticComplianceSummaryCard } from '@/components/dashboard/AcousticComplianceSummaryCard';
import { SkeletonStatCard, SkeletonCard } from '@/components/ui/skeleton-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Activity,
  AlertTriangle,
  Box,
  FolderKanban,
  Plus,
  TrendingUp,
  Wrench,
  Loader2,
  ArrowUpRight,
  ThermometerSun,
  Droplets,
  Wind,
  Sparkles,
  Building2,
  Shield,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHVACAI } from '@/hooks/useHVACAI';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: organization } = useOrganization();
  const initializeProfile = useInitializeProfile();
  const createOrganization = useCreateOrganization();
  const { detectFaults, isLoading: aiLoading } = useHVACAI();
  const expiringWarranties = useEquipmentWithExpiringWarranties(90);

  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Initialize profile for new users
  useEffect(() => {
    if (user && !profileLoading && !profile) {
      initializeProfile.mutate();
    }
  }, [user, profileLoading, profile]);

  // Show org creation dialog if user has no organization
  useEffect(() => {
    if (profile && !profile.organization_id) {
      setShowOrgDialog(true);
    }
  }, [profile]);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      toast.error('Organization name is required');
      return;
    }
    const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await createOrganization.mutateAsync({ name: orgName, slug });
    setShowOrgDialog(false);
  };

  const handleAIAnalysis = async () => {
    const demoData = {
      sensors: [
        { name: 'Supply Air Temp', equipment: 'AHU-01', value: 55.2, setpoint: 55 },
        { name: 'Return Air Temp', equipment: 'AHU-01', value: 72.4, setpoint: 72 },
        { name: 'Static Pressure', equipment: 'AHU-01', value: 1.8, setpoint: 1.2, alarm: true },
        { name: 'CHW Supply Temp', equipment: 'CH-01', value: 44.0, setpoint: 44 },
        { name: 'VAV Damper', equipment: 'VAV-102', value: 0, status: 'fault' },
      ],
    };

    const result = await detectFaults(demoData, 'Building is a 30-story office tower with 2 chillers and 4 AHUs');
    if (result?.result) {
      const analysis = result.result as { summary?: string; faults?: Array<{ equipment: string; fault: string; severity: string }> };
      setAiInsights(analysis.summary || 'Analysis complete. Check the detailed results.');
      if (analysis.faults && analysis.faults.length > 0) {
        toast.info(`Found ${analysis.faults.length} potential issue(s)`);
      }
    }
  };

  if (loading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Header skeleton */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 bg-muted rounded animate-pulse" />
              <div className="h-10 w-28 bg-muted rounded animate-pulse" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <SkeletonCard className="lg:col-span-2" lines={4} />
            <SkeletonCard lines={5} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      title: 'Active Projects',
      value: '0',
      change: 'Create your first project',
      changeType: 'neutral',
      icon: FolderKanban,
    },
    {
      title: 'Equipment Assets',
      value: '0',
      change: 'Add equipment to start',
      changeType: 'neutral',
      icon: Box,
    },
    {
      title: 'Active Alerts',
      value: '0',
      change: 'No alerts',
      changeType: 'positive',
      icon: AlertTriangle,
    },
    {
      title: 'Open Work Orders',
      value: '0',
      change: 'All clear',
      changeType: 'positive',
      icon: Wrench,
    },
  ];

  const liveMetrics = [
    { label: 'Avg. Supply Temp', value: '—', icon: ThermometerSun, trend: 'stable' },
    { label: 'Chilled Water Flow', value: '—', icon: Droplets, trend: 'stable' },
    { label: 'Total Airflow', value: '—', icon: Wind, trend: 'stable' },
  ];

  return (
    <DashboardLayout>
      {/* Organization Creation Dialog */}
      <Dialog open={showOrgDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>Create Your Organization</DialogTitle>
            <DialogDescription>
              Set up your organization to start managing HVAC projects and equipment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              placeholder="e.g., Acme HVAC Services"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateOrg} disabled={createOrganization.isPending}>
              {createOrganization.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              {organization ? `Welcome to ${organization.name}` : 'Welcome to HVACPro AI'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleAIAnalysis} disabled={aiLoading}>
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI Analysis
            </Button>
            <Button className="gap-2" onClick={() => navigate('/projects')}>
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* AI Insights Banner */}
        {aiInsights && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-4 py-4">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">AI Analysis Results</p>
                <p className="text-sm text-muted-foreground">{aiInsights}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAiInsights(null)}>
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={cn(
                    'text-xs mt-1',
                    stat.changeType === 'positive' && 'text-success',
                    stat.changeType === 'warning' && 'text-warning',
                    stat.changeType === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live Metrics */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live System Metrics</CardTitle>
                  <CardDescription>Connect IoT devices to see real-time data</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  No Devices
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {liveMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{metric.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-muted-foreground">{metric.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 h-48 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Connect IoT devices to see real-time trends
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/monitoring')}>
                    Setup Monitoring
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to set up your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center text-success-foreground text-xs">
                  ✓
                </div>
                <span className="text-sm">Create account</span>
              </div>
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                organization ? "bg-success/10 border border-success/20" : "bg-muted/50 border border-border"
              )}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                  organization ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {organization ? '✓' : '2'}
                </div>
                <span className="text-sm">Set up organization</span>
              </div>
              <button 
                onClick={() => navigate('/projects')}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  3
                </div>
                <span className="text-sm">Create first project</span>
                <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate('/equipment')}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  4
                </div>
                <span className="text-sm">Add equipment</span>
                <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate('/monitoring')}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  5
                </div>
                <span className="text-sm">Connect IoT devices</span>
                <ArrowUpRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Design Health, Acoustic Compliance, Warranty Alerts & Deficiencies */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Design Health Score */}
          <DesignHealthScoreCard />
          {/* Acoustic Compliance */}
          <AcousticComplianceSummaryCard />
          {/* Warranty Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Warranty Alerts
                  </CardTitle>
                  <CardDescription>Equipment with warranties expiring soon</CardDescription>
                </div>
                {expiringWarranties.length > 0 && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    {expiringWarranties.length} expiring
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {expiringWarranties.length > 0 ? (
                <div className="space-y-3">
                  {expiringWarranties.slice(0, 5).map((eq) => {
                    const warranty = getWarrantyStatus(eq.warranty_expiry);
                    return (
                      <div 
                        key={eq.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => navigate('/equipment')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium">{eq.tag}</p>
                            <p className="text-xs text-muted-foreground">{eq.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={cn('text-xs', warranty.className)}>
                            {warranty.daysRemaining} days
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {eq.warranty_expiry && new Date(eq.warranty_expiry).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {expiringWarranties.length > 5 && (
                    <Button variant="ghost" className="w-full text-sm" onClick={() => navigate('/equipment')}>
                      View all {expiringWarranties.length} items
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Shield className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No warranties expiring in the next 90 days</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/equipment')}>
                    View Equipment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deficiencies Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Deficiencies
                  </CardTitle>
                  <CardDescription>Commissioning issues to resolve</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertTriangle className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Track deficiencies across projects</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/deficiencies')}>
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/projects')}>
                  <FolderKanban className="w-5 h-5" />
                  <span className="text-sm">New Project</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/equipment')}>
                  <Box className="w-5 h-5" />
                  <span className="text-sm">Add Equipment</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/service')}>
                  <Wrench className="w-5 h-5" />
                  <span className="text-sm">Create Work Order</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/design')}>
                  <Activity className="w-5 h-5" />
                  <span className="text-sm">Run Load Calc</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Schedule</h2>
          <CalendarView />
        </div>
      </div>
    </DashboardLayout>
  );
}
