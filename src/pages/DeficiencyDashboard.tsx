import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeficiencyDashboard, DeficiencyItem } from '@/hooks/useDeficiencyDashboard';
import { useDeficiencyAssignments } from '@/hooks/useDeficiencyAssignments';
import { DeficiencySeverity } from '@/lib/deficiency-types';
import { DeficiencyStatsCards } from '@/components/deficiency/DeficiencyStatsCards';
import { DeficiencySeverityChart } from '@/components/deficiency/DeficiencySeverityChart';
import { DeficiencyResolutionGauge } from '@/components/deficiency/DeficiencyResolutionGauge';
import { DeficiencyCategoryChart } from '@/components/deficiency/DeficiencyCategoryChart';
import { DeficiencyFilters } from '@/components/deficiency/DeficiencyFilters';
import { DeficiencyTable } from '@/components/deficiency/DeficiencyTable';
import { DeficiencyDetailDrawer } from '@/components/deficiency/DeficiencyDetailDrawer';
import { DeficiencyHeatMap } from '@/components/deficiency/DeficiencyHeatMap';
import { DeficiencyAssignmentDialog } from '@/components/deficiency/DeficiencyAssignmentDialog';
import { TechnicianAssignmentStats } from '@/components/deficiency/TechnicianAssignmentStats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Download, AlertTriangle } from 'lucide-react';

export default function DeficiencyDashboard() {
  const {
    deficiencies,
    stats,
    filters,
    setFilters,
    projects,
    isLoading,
    refetch,
  } = useDeficiencyDashboard();

  const { getAssignmentForDeficiency, refetch: refetchAssignments } = useDeficiencyAssignments();

  const [selectedDeficiency, setSelectedDeficiency] = useState<DeficiencyItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFilterBySeverity = (severity: DeficiencySeverity | null) => {
    setFilters({
      ...filters,
      severities: severity ? [severity] : [],
    });
  };

  const handleHeatMapClick = (type: 'equipment' | 'location', id: string) => {
    if (type === 'equipment') {
      setFilters({
        ...filters,
        equipmentType: filters.equipmentType === id ? undefined : id,
        projectId: undefined,
      });
    } else {
      setFilters({
        ...filters,
        projectId: filters.projectId === id ? undefined : id,
        equipmentType: undefined,
      });
    }
  };

  const handleViewDeficiency = (deficiency: DeficiencyItem) => {
    setSelectedDeficiency(deficiency);
    setDrawerOpen(true);
  };

  const handleAssign = (deficiency: DeficiencyItem) => {
    setSelectedDeficiency(deficiency);
    setAssignDialogOpen(true);
  };

  const handleMarkResolved = async (deficiency: DeficiencyItem) => {
    try {
      const { error } = await supabase
        .from('commissioning_photo_metadata')
        .update({
          remediation_completed_at: new Date().toISOString(),
          remediation_notes: (deficiency.remediationNotes || '') + '\n[Marked as resolved from dashboard]',
        })
        .eq('id', deficiency.id);

      if (error) throw error;

      toast.success('Deficiency marked as resolved');
      refetch();
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error marking resolved:', error);
      toast.error('Failed to update deficiency');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refetchAssignments()]);
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleExport = () => {
    const headers = ['Project', 'Equipment', 'Tags', 'Severity', 'Status', 'Days Open', 'Captured At'];
    const rows = deficiencies.map((d) => [
      d.projectName,
      d.equipmentTag,
      d.deficiencyTags.join('; '),
      d.severity,
      d.isResolved ? 'Resolved' : 'Open',
      d.daysOpen.toString(),
      d.capturedAt,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deficiencies-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  const unassignedCount = deficiencies.filter(d => !d.isResolved && !getAssignmentForDeficiency(d.id)).length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
              Deficiency Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track and manage deficiencies across all commissioning projects
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <DeficiencyStatsCards
          stats={stats}
          filters={filters}
          onFilterBySeverity={handleFilterBySeverity}
        />

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-4">
          <DeficiencySeverityChart stats={stats} />
          <DeficiencyResolutionGauge stats={stats} />
          <DeficiencyCategoryChart stats={stats} />
        </div>

        {/* Heat Map and Assignment Stats */}
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <DeficiencyHeatMap
              deficiencies={deficiencies}
              onCellClick={handleHeatMapClick}
              selectedEquipmentType={filters.equipmentType}
              selectedProjectId={filters.projectId}
            />
          </div>
          <TechnicianAssignmentStats totalUnassigned={unassignedCount} />
        </div>

        {/* Filters */}
        <DeficiencyFilters
          filters={filters}
          onFiltersChange={setFilters}
          projects={projects}
        />

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deficiency List</CardTitle>
          </CardHeader>
          <CardContent>
            <DeficiencyTable
              deficiencies={deficiencies}
              getAssignmentForDeficiency={getAssignmentForDeficiency}
              onViewDeficiency={handleViewDeficiency}
              onMarkResolved={handleMarkResolved}
              onAssign={handleAssign}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detail Drawer */}
      <DeficiencyDetailDrawer
        deficiency={selectedDeficiency}
        assignment={selectedDeficiency ? getAssignmentForDeficiency(selectedDeficiency.id) : null}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onMarkResolved={handleMarkResolved}
        onAssign={handleAssign}
      />

      {/* Assignment Dialog */}
      <DeficiencyAssignmentDialog
        deficiency={selectedDeficiency}
        existingAssignment={selectedDeficiency ? getAssignmentForDeficiency(selectedDeficiency.id) : null}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={() => refetchAssignments()}
      />
    </DashboardLayout>
  );
}
