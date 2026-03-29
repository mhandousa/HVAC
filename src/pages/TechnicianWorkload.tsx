import { useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTechnicianWorkload, TechnicianMetrics } from '@/hooks/useTechnicianWorkload';
import { useWorkloadBalancing } from '@/hooks/useWorkloadBalancing';
import { WorkloadStatsCards } from '@/components/workload/WorkloadStatsCards';
import { TechnicianWorkloadCard } from '@/components/workload/TechnicianWorkloadCard';
import { WorkloadDistributionChart } from '@/components/workload/WorkloadDistributionChart';
import { PerformanceLeaderboard } from '@/components/workload/PerformanceLeaderboard';
import { TechnicianDetailDrawer } from '@/components/workload/TechnicianDetailDrawer';
import { AssignmentTimeline } from '@/components/workload/AssignmentTimeline';
import { TeamAvailabilityOverview } from '@/components/workload/TeamAvailabilityOverview';
import { TechnicianAvailabilityCalendar } from '@/components/workload/TechnicianAvailabilityCalendar';
import { WorkloadBalancingPanel } from '@/components/workload/WorkloadBalancingPanel';
import { BalanceScoreGauge } from '@/components/workload/BalanceScoreGauge';
import { SkillsMatrixGrid } from '@/components/workload/SkillsMatrixGrid';
import { WorkloadReportDialog } from '@/components/workload/WorkloadReportDialog';
import { RefreshCw, Users, ArrowLeft, Calendar, Scale, Grid3X3, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function TechnicianWorkload() {
  const {
    technicianMetrics,
    workloadStats,
    enrichedAssignments,
    isLoading,
    getPerformanceLeaderboard,
  } = useTechnicianWorkload();

  const { balancingResult } = useWorkloadBalancing();

  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianMetrics | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleViewDetails = (technician: TechnicianMetrics) => {
    setSelectedTechnician(technician);
    setDrawerOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In real implementation, would call refetch
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const leaderboard = getPerformanceLeaderboard();
  const teamAverage = technicianMetrics.length > 0
    ? technicianMetrics
        .filter(t => t.totalAssigned > 0)
        .reduce((sum, t) => sum + t.resolutionRate, 0) / 
        technicianMetrics.filter(t => t.totalAssigned > 0).length || 0
    : 0;

  const hasImbalance = balancingResult.suggestions.length > 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-[300px] lg:col-span-2" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" asChild className="gap-1 -ml-2">
                <Link to="/deficiencies">
                  <ArrowLeft className="w-4 h-4" />
                  Deficiencies
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Technician Workload Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor technician performance, assignments, and resolution rates
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Balance Score Badge in Header */}
            <div className="hidden md:block">
              <BalanceScoreGauge
                score={balancingResult.currentImbalance.balanceScore}
                overloadedCount={balancingResult.currentImbalance.overloadedTechnicians.length}
                underutilizedCount={balancingResult.currentImbalance.underutilizedTechnicians.length}
                compact
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setReportDialogOpen(true)}
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs for Overview, Availability, and Balancing */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Users className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-2">
              <Calendar className="w-4 h-4" />
              Availability Calendar
            </TabsTrigger>
            <TabsTrigger value="balancing" className="gap-2 relative">
              <Scale className="w-4 h-4" />
              Workload Balancing
              {hasImbalance && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {balancingResult.suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="skills-matrix" className="gap-2">
              <Grid3X3 className="w-4 h-4" />
              Skills Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Stats Cards */}
            <WorkloadStatsCards stats={workloadStats} balanceScore={balancingResult.currentImbalance.balanceScore} />

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-3">
              <WorkloadDistributionChart />
              <div className="space-y-4">
                <PerformanceLeaderboard 
                  technicians={leaderboard} 
                  teamAverage={teamAverage}
                />
                <TeamAvailabilityOverview />
              </div>
            </div>

            {/* Assignment Timeline */}
            <AssignmentTimeline assignments={enrichedAssignments} />

            {/* Technician Cards Grid */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Team Members</h2>
              {technicianMetrics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No technicians found. Add team members to get started.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {technicianMetrics.map((technician) => (
                    <TechnicianWorkloadCard
                      key={technician.id}
                      technician={technician}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="availability" className="mt-0">
            <TechnicianAvailabilityCalendar />
          </TabsContent>

          <TabsContent value="balancing" className="mt-0">
            <WorkloadBalancingPanel />
          </TabsContent>

          <TabsContent value="skills-matrix" className="mt-0">
            <SkillsMatrixGrid />
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <TechnicianDetailDrawer
        technician={selectedTechnician}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Report Dialog */}
      <WorkloadReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        technicians={technicianMetrics}
      />
    </DashboardLayout>
  );
}