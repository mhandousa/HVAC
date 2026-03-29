import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectCrossToolAudit } from '@/hooks/useProjectCrossToolAudit';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { DesignAuditSummaryCards } from '@/components/design/audit/DesignAuditSummaryCards';
import { DesignAuditDependencyFlow } from '@/components/design/audit/DesignAuditDependencyFlow';
import { DesignAuditTable } from '@/components/design/audit/DesignAuditTable';
import { DesignAuditToolInventory } from '@/components/design/audit/DesignAuditToolInventory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, RefreshCw, AlertCircle } from 'lucide-react';

export default function DesignAuditDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const projectIdParam = searchParams.get('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdParam);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'synced'>('all');

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const auditResult = useProjectCrossToolAudit(selectedProjectId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Update URL when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId });
    } else {
      setSearchParams({});
    }
  }, [selectedProjectId, setSearchParams]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0 && !projectIdParam) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId, projectIdParam]);

  const handleExportCSV = () => {
    if (!auditResult.allDependencies.length) return;

    const headers = ['Status', 'Upstream Tool', 'Upstream Items', 'Downstream Tool', 'Downstream Items', 'Stale Duration', 'Severity', 'Description'];
    const rows = auditResult.allDependencies.map(dep => [
      dep.status,
      dep.upstream.toolName,
      dep.upstream.itemCount.toString(),
      dep.downstream.toolName,
      dep.downstream.itemCount.toString(),
      dep.status === 'synced' ? 'In sync' : dep.staleDurationText,
      dep.severity,
      dep.description,
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-audit-${selectedProjectId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Design Health', href: `/design/health${selectedProjectId ? `?project=${selectedProjectId}` : ''}` },
            { label: 'Cross-Tool Audit' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Design Audit Dashboard</h1>
            <p className="text-muted-foreground">
              Cross-tool validation and data synchronization status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!auditResult.allDependencies.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* No Project Selected */}
        {!selectedProjectId && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No Project Selected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a project from the dropdown above to view its design audit status.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {selectedProjectId && auditResult.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Audit Results */}
        {selectedProjectId && !auditResult.isLoading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <DesignAuditSummaryCards
              summary={auditResult.summary}
              toolsWithData={auditResult.toolsWithData}
              onFilterChange={setActiveFilter}
              activeFilter={activeFilter}
            />

            {/* Dependency Flow + Table Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Dependency Flow Diagram */}
              <DesignAuditDependencyFlow
                dependencies={auditResult.allDependencies}
                toolsWithData={auditResult.toolsWithData}
              />

              {/* Quick Stats */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Project Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Project:</span>
                      <span className="font-medium">{selectedProject?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Dependencies:</span>
                      <span className="font-medium">{auditResult.summary.totalDependencies}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tools with Data:</span>
                      <span className="font-medium">
                        {auditResult.toolsWithData.filter(t => t.hasData).length} / {auditResult.toolsWithData.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Data Freshness:</span>
                      <span className={
                        auditResult.summary.overallHealth === 'healthy' ? 'text-success font-medium' :
                        auditResult.summary.overallHealth === 'warning' ? 'text-warning font-medium' :
                        'text-destructive font-medium'
                      }>
                        {auditResult.summary.overallHealth === 'healthy' ? 'All Synced' :
                         auditResult.summary.overallHealth === 'warning' ? 'Some Stale' :
                         'Needs Attention'}
                      </span>
                    </div>
                  </div>

                  {auditResult.summary.criticalCount > 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Action Required</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {auditResult.summary.criticalCount} critical {auditResult.summary.criticalCount === 1 ? 'dependency is' : 'dependencies are'} out of sync. 
                        Review the alerts below and refresh the affected downstream tools.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alert Table */}
            <DesignAuditTable
              allDependencies={auditResult.allDependencies}
              criticalAlerts={auditResult.criticalAlerts}
              warningAlerts={auditResult.warningAlerts}
              syncedDependencies={auditResult.syncedDependencies}
              filter={activeFilter}
            />

            {/* Tool Inventory */}
            <DesignAuditToolInventory toolsWithData={auditResult.toolsWithData} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
