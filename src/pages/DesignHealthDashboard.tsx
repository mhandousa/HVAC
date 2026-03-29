import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useDesignCompleteness } from '@/hooks/useDesignCompleteness';
import { useProjectCrossToolAudit } from '@/hooks/useProjectCrossToolAudit';
import { useDesignValidationRules } from '@/hooks/useDesignValidationRules';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  RefreshCw, 
  Download,
  ArrowLeft,
  LayoutDashboard,
  Thermometer,
  Wind,
  Box,
  Droplets
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { DesignHealthExecutiveSummary } from '@/components/design/health/DesignHealthExecutiveSummary';
import { CompletenessQuadrant } from '@/components/design/health/CompletenessQuadrant';
import { AuditQuadrant } from '@/components/design/health/AuditQuadrant';
import { SpecializedToolsQuadrant } from '@/components/design/health/SpecializedToolsQuadrant';
import { ValidationQuadrant } from '@/components/design/health/ValidationQuadrant';
import { HealthTrendChart } from '@/components/design/health/HealthTrendChart';
import { AtRiskZonesPanel } from '@/components/design/health/AtRiskZonesPanel';

export default function DesignHealthDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  
  const projectIdFromUrl = searchParams.get('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl);
  const [authLoading, setAuthLoading] = useState(true);

  // Set initial project
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Auth loading check
  useEffect(() => {
    setAuthLoading(false);
  }, [user]);

  // Update URL when project changes
  useEffect(() => {
    if (selectedProjectId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('project', selectedProjectId);
      navigate(`?${newParams.toString()}`, { replace: true });
    }
  }, [selectedProjectId, navigate, searchParams]);

  // Fetch data for selected project
  const { 
    data: completenessData, 
    isLoading: completenessLoading,
    refetch: refetchCompleteness
  } = useDesignCompleteness(selectedProjectId);
  
  const auditResult = useProjectCrossToolAudit(selectedProjectId);
  const auditLoading = auditResult?.isLoading || false;
  
  const {
    score: validationScore,
    ruleResults,
    allChecks,
    isLoading: validationLoading,
    refetch: refetchValidation
  } = useDesignValidationRules(selectedProjectId);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || projectsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const isLoading = completenessLoading || auditLoading || validationLoading;

  // Calculate metrics
  const zoneCompleteness = completenessData?.overallCompleteness || 0;
  const specializedToolsScore = completenessData?.specializedToolsScore || 0;
  
  // Sync score from audit
  const syncedCount = auditResult?.syncedDependencies?.length || 0;
  const totalDeps = auditResult?.allDependencies?.length || 1;
  const syncScore = (syncedCount / totalDeps) * 100;
  
  // Validation metrics
  const validationPassRate = validationScore.score;
  const criticalIssues = validationScore.criticalFailures?.length || 0;
  const warningIssues = validationScore.warningCount || 0;

  // Calculate percentages from zone counts
  const totalZones = completenessData?.totalZones || 1;
  const completenessMetrics = [
    { label: 'Load Calc', value: Math.round((completenessData?.zonesWithLoadCalc || 0) / totalZones * 100), color: 'hsl(var(--primary))' },
    { label: 'Equipment', value: Math.round((completenessData?.zonesWithEquipment || 0) / totalZones * 100), color: 'hsl(221 83% 53%)' },
    { label: 'Distribution', value: Math.round((completenessData?.zonesWithDistribution || 0) / totalZones * 100), color: 'hsl(142 76% 36%)' },
    { label: 'Ventilation', value: Math.round((completenessData?.zonesWithVentilation || 0) / totalZones * 100), color: 'hsl(45 93% 47%)' },
    { label: 'ERV', value: Math.round((completenessData?.zonesWithERV || 0) / totalZones * 100), color: 'hsl(280 84% 60%)' },
  ];

  // Calculate zones needing attention from zones array
  const zonesNeedingAttention = completenessData?.zones?.filter(
    z => z.completenessScore < 100
  ).length || 0;

  // Audit dependencies for quadrant
  const topDependencies = (auditResult?.allDependencies || []).slice(0, 5).map(dep => ({
    name: `${dep.upstream.toolName} → ${dep.downstream.toolName}`,
    status: dep.severity === 'critical' ? 'critical' as const : 
            dep.severity === 'warning' ? 'warning' as const : 'synced' as const
  }));

  // Specialized tools for quadrant (19 tools @ ~5.26% each)
  const specializedTools = [
    { id: 'chilledWaterPlant', name: 'CHW Plant', completed: completenessData?.hasChilledWaterPlant || false },
    { id: 'hotWaterPlant', name: 'HW Plant', completed: completenessData?.hasHotWaterPlant || false },
    { id: 'smokeControl', name: 'Smoke Control', completed: completenessData?.hasSmokeControl || false },
    { id: 'thermalComfort', name: 'Thermal Comfort', completed: completenessData?.hasThermalComfort || false },
    { id: 'sbcCompliance', name: 'SBC Compliance', completed: completenessData?.hasSBCCompliance || false },
    { id: 'ashrae901Compliance', name: 'ASHRAE 90.1', completed: completenessData?.hasASHRAE90_1Compliance || false },
    { id: 'ahuConfiguration', name: 'AHU Config', completed: completenessData?.hasAHUConfiguration || false },
    { id: 'fanSelections', name: 'Fan Selections', completed: completenessData?.hasFanSelections || false },
    { id: 'pumpSelections', name: 'Pump Selections', completed: completenessData?.hasPumpSelections || false },
    { id: 'insulationCalculations', name: 'Insulation', completed: completenessData?.hasInsulationCalculations || false },
    { id: 'sequenceOfOperations', name: 'Sequences', completed: completenessData?.hasSequenceOfOperations || false },
    // 3 equipment selection tools
    { id: 'coilSelections', name: 'Coil Selections', completed: completenessData?.hasCoilSelections || false },
    { id: 'filterSelections', name: 'Filter Selections', completed: completenessData?.hasFilterSelections || false },
    { id: 'coolingTowerSelections', name: 'Cooling Towers', completed: completenessData?.hasCoolingTowerSelections || false },
    // Phase 18: 5 new specialized tools
    { id: 'economizerSelections', name: 'Economizer', completed: completenessData?.hasEconomizerSelections || false },
    { id: 'controlValveSelections', name: 'Control Valves', completed: completenessData?.hasControlValveSelections || false },
    { id: 'expansionTankSelections', name: 'Expansion Tanks', completed: completenessData?.hasExpansionTankSelections || false },
    { id: 'silencerSelections', name: 'Silencers', completed: completenessData?.hasSilencerSelections || false },
    { id: 'vibrationIsolationSelections', name: 'Vibration Isolation', completed: completenessData?.hasVibrationIsolationSelections || false },
  ];
  const completedToolsCount = specializedTools.filter(t => t.completed).length;

  // Equipment selection aggregate metrics
  const coilMetrics = completenessData?.coilMetrics || { count: 0, totalCoolingTons: 0, totalHeatingMbh: 0, totalAirflowCfm: 0 };
  const filterMetrics = completenessData?.filterMetrics || { count: 0, averageMervRating: 0, preFilterCount: 0, finalFilterCount: 0 };
  const terminalMetrics = completenessData?.terminalMetrics || { count: 0, vavCount: 0, fcuCount: 0, totalAirflowCfm: 0, totalCoolingBtuh: 0 };
  const coolingTowerMetrics = completenessData?.coolingTowerMetrics || { count: 0, totalCapacityTons: 0, totalFlowGpm: 0, totalMakeupGpm: 0 };
  const hasEquipmentSelections = coilMetrics.count > 0 || filterMetrics.count > 0 || terminalMetrics.count > 0 || coolingTowerMetrics.count > 0;

  // Top failing rules
  const failingRules = allChecks
    .filter(c => c.status === 'fail')
    .reduce((acc, check) => {
      const existing = acc.find(r => r.name === check.name);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: check.name, count: 1 });
      }
      return acc;
    }, [] as { name: string; count: number }[])
    .sort((a, b) => b.count - a.count);

  const handleRefreshAll = () => {
    refetchCompleteness();
    refetchValidation();
    // Audit data refreshes automatically when completeness refetches
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Design Health Dashboard' },
          ]}
        />
        
        {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Design Health Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Unified view of project design completeness, synchronization, and validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefreshAll} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Project</h3>
            <p className="text-muted-foreground text-sm">
              Choose a project from the dropdown to view its design health metrics
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      ) : (
        <>
          {/* Executive Summary */}
          <DesignHealthExecutiveSummary
            zoneCompleteness={zoneCompleteness}
            syncScore={syncScore}
            specializedToolsScore={specializedToolsScore}
            validationPassRate={validationPassRate}
            criticalIssues={criticalIssues}
            warningIssues={warningIssues}
            trend="stable"
            trendValue={0}
          />

          {/* Trend Chart & At Risk Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HealthTrendChart projectId={selectedProjectId} days={30} />
            <AtRiskZonesPanel
              projectId={selectedProjectId}
              zones={(completenessData?.zones || []).map(z => ({
                zoneId: z.zoneId,
                zoneName: z.zoneName,
                buildingName: z.buildingName,
                floorName: z.floorName,
                completenessScore: z.completenessScore,
                hasLoadCalc: z.hasLoadCalculation,
                hasEquipment: z.hasEquipmentSelection,
                hasDistribution: z.hasDistributionSystem,
                hasVentilation: z.hasVentilationCalc,
                hasERV: z.hasERVSizing,
              }))}
              threshold={50}
            />
          </div>

          {/* Four Quadrant View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CompletenessQuadrant
              overallPercent={zoneCompleteness}
              metrics={completenessMetrics}
              zonesNeedingAttention={zonesNeedingAttention}
              projectId={selectedProjectId}
            />

            <AuditQuadrant
              criticalCount={auditResult?.criticalAlerts?.length || 0}
              warningCount={auditResult?.warningAlerts?.length || 0}
              syncedCount={syncedCount}
              topDependencies={topDependencies}
              projectId={selectedProjectId}
            />

            <SpecializedToolsQuadrant
              score={specializedToolsScore}
              completedCount={completedToolsCount}
              totalCount={19}
              tools={specializedTools.map(t => ({ ...t, icon: null }))}
              projectId={selectedProjectId}
            />

            <ValidationQuadrant
              passRate={validationPassRate}
              passCount={validationScore.passCount}
              warningCount={validationScore.warningCount}
              failCount={validationScore.failCount}
              topFailingRules={failingRules}
              projectId={selectedProjectId}
            />
          </div>

          {/* Equipment Selection Summary */}
          {hasEquipmentSelections && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Equipment Selection Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Coil Capacity */}
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                    <Thermometer className="h-5 w-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {coilMetrics.totalCoolingTons.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Cooling (Tons)</div>
                    <div className="text-xs text-blue-500 mt-1">{coilMetrics.count} coils</div>
                  </div>
                  
                  {/* Filter Rating */}
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900">
                    <Wind className="h-5 w-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      MERV {filterMetrics.averageMervRating.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Filter Rating</div>
                    <div className="text-xs text-amber-500 mt-1">{filterMetrics.count} filters</div>
                  </div>
                  
                  {/* Terminal Units */}
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
                    <Box className="h-5 w-5 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {terminalMetrics.vavCount} / {terminalMetrics.fcuCount}
                    </div>
                    <div className="text-xs text-muted-foreground">VAV / FCU</div>
                    <div className="text-xs text-purple-500 mt-1">{terminalMetrics.count} units</div>
                  </div>
                  
                  {/* Cooling Towers */}
                  <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-100 dark:border-cyan-900">
                    <Droplets className="h-5 w-5 mx-auto mb-1 text-cyan-600 dark:text-cyan-400" />
                    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {coolingTowerMetrics.totalCapacityTons.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Tower Capacity (Tons)</div>
                    <div className="text-xs text-cyan-500 mt-1">{coolingTowerMetrics.totalMakeupGpm.toFixed(1)} GPM makeup</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/design/completeness?project=${selectedProjectId}`}>
                    Zone Completeness Details
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/design/audit?project=${selectedProjectId}`}>
                    Cross-Tool Audit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/design/validation?project=${selectedProjectId}`}>
                    Validation Checks
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/design/specialized-tools-comparison">
                    Specialized Tools Comparison
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </DashboardLayout>
  );
}
