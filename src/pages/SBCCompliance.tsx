import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, CheckCircle2, XCircle, AlertTriangle, FileText, Building, Save, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useProjects } from '@/hooks/useProjects';
import { useSBCComplianceChecks, useCreateSBCComplianceCheck, useDeleteSBCComplianceCheck } from '@/hooks/useSBCComplianceChecks';
import { SaveDesignDialog } from '@/components/design/SaveDesignDialog';
import { SavedConfigurationsList, type SavedConfiguration } from '@/components/design/SavedConfigurationsList';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ALL_SBC_REQUIREMENTS,
  SBC_EQUIPMENT_EFFICIENCY,
  SBC_VENTILATION_RATES,
  type SBCRequirement,
} from '@/lib/sbc-hvac-data';
import { toast } from 'sonner';

interface CheckResult {
  requirement: SBCRequirement;
  status: 'pass' | 'fail' | 'pending';
  notes?: string;
}

export default function SBCCompliance() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  
  // Zone context persistence
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const [projectId, setProjectId] = useState<string | null>(searchParams.get('project') || storedProjectId);
  
  // Sync context when project changes
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);
  const [checkResults, setCheckResults] = useState<Map<string, 'pass' | 'fail' | 'pending'>>(new Map());
  
  // Save/Load UI state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  
  // Data hooks
  const { data: savedChecks, isLoading: loadingSaved } = useSBCComplianceChecks(projectId || undefined);
  const createCheck = useCreateSBCComplianceCheck();
  const deleteCheck = useDeleteSBCComplianceCheck();

  // Conflict detection
  const queryClient = useQueryClient();
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['sbc-compliance-checks'] });
  };
  
  // Group requirements by category
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, SBCRequirement[]> = {};
    ALL_SBC_REQUIREMENTS.forEach(req => {
      if (!groups[req.category]) {
        groups[req.category] = [];
      }
      groups[req.category].push(req);
    });
    return groups;
  }, []);
  
  // Calculate compliance score
  const complianceStats = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let pending = 0;
    
    ALL_SBC_REQUIREMENTS.forEach(req => {
      const status = checkResults.get(req.id) || 'pending';
      if (status === 'pass') passed++;
      else if (status === 'fail') failed++;
      else pending++;
    });
    
    const total = ALL_SBC_REQUIREMENTS.length;
    const score = total > 0 ? (passed / total) * 100 : 0;
    
    return { passed, failed, pending, total, score };
  }, [checkResults]);
  
  // Transform saved checks to SavedConfiguration format
  const savedConfigurations: SavedConfiguration[] = useMemo(() => {
    if (!savedChecks) return [];
    return savedChecks.map(check => ({
      id: check.id,
      name: check.check_name,
      projectId: check.project_id,
      projectName: projects?.find(p => p.id === check.project_id)?.name,
      status: check.status || undefined,
      createdAt: check.created_at,
      updatedAt: check.updated_at,
    }));
  }, [savedChecks, projects]);
  
  const handleToggleCheck = (reqId: string, currentStatus: 'pass' | 'fail' | 'pending') => {
    const newStatus = currentStatus === 'pending' ? 'pass' : 
                      currentStatus === 'pass' ? 'fail' : 'pending';
    setCheckResults(prev => new Map(prev).set(reqId, newStatus));
  };
  
  const handleSave = async (data: { name: string; projectId: string | null; notes: string }) => {
    // Convert Map to object for JSON storage
    const resultsObject: Record<string, string> = {};
    checkResults.forEach((value, key) => {
      resultsObject[key] = value;
    });
    
    await createCheck.mutateAsync({
      check_name: data.name,
      project_id: data.projectId,
      total_requirements: complianceStats.total,
      passed_count: complianceStats.passed,
      failed_count: complianceStats.failed,
      pending_count: complianceStats.pending,
      compliance_score_percent: complianceStats.score,
      requirement_results: resultsObject,
      notes: data.notes,
    });
  };
  
  const handleLoadConfiguration = (id: string) => {
    const config = savedChecks?.find(c => c.id === id);
    if (!config) return;
    
    // Load results from saved configuration
    if (config.requirement_results && typeof config.requirement_results === 'object') {
      const newResults = new Map<string, 'pass' | 'fail' | 'pending'>();
      Object.entries(config.requirement_results as Record<string, string>).forEach(([key, value]) => {
        if (value === 'pass' || value === 'fail' || value === 'pending') {
          newResults.set(key, value);
        }
      });
      setCheckResults(newResults);
    }
    
    if (config.project_id) setProjectId(config.project_id);
    setShowSavedList(false);
    toast.success('Compliance check loaded');
  };
  
  const handleDeleteConfiguration = (id: string) => {
    deleteCheck.mutate(id);
  };
  
  const handleExport = () => {
    toast.info('Export feature coming soon');
  };
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  const getStatusBadge = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-500">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };
  
  // Format equipment efficiency data for display
  const equipmentEfficiencyItems = [
    { type: 'Split AC', efficiency: `EER ≥ ${SBC_EQUIPMENT_EFFICIENCY.splitAC.minEER}, SEER ≥ ${SBC_EQUIPMENT_EFFICIENCY.splitAC.minSEER}` },
    { type: 'Package AC (≤5 tons)', efficiency: `EER ≥ ${SBC_EQUIPMENT_EFFICIENCY.packageAC.capacityRanges[0].minEER}` },
    { type: 'Air-Cooled Chiller', efficiency: `COP ≥ ${SBC_EQUIPMENT_EFFICIENCY.chillers.airCooled.minCOP}` },
    { type: 'Water-Cooled Chiller', efficiency: `COP ≥ ${SBC_EQUIPMENT_EFFICIENCY.chillers.waterCooled.centrifugal.minCOP}` },
    { type: 'Fan Power Limit', efficiency: `≤ ${SBC_EQUIPMENT_EFFICIENCY.fans.maxBhpPerCfm} BHP/CFM` },
  ];
  
  // Format ventilation rates for display
  const ventilationRateItems = Object.entries(SBC_VENTILATION_RATES)
    .filter(([key]) => key !== 'reference')
    .slice(0, 5)
    .map(([spaceType, rates]) => ({
      spaceType: spaceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      cfmPerPerson: (rates as { cfmPerPerson: number; cfmPerSqft: number }).cfmPerPerson,
      cfmPerSqft: (rates as { cfmPerPerson: number; cfmPerSqft: number }).cfmPerSqft,
    }));
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumbs
              items={[
                { label: 'Design', href: '/design' },
                { label: 'SBC Compliance Checker' },
              ]}
            />
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-emerald-500" />
              <div>
                <h1 className="text-2xl font-bold">SBC Compliance Checker</h1>
                <p className="text-muted-foreground">Saudi Building Code (SBC 601/602) HVAC Requirements</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ActiveEditorsIndicator
              entityType="sbc_compliance"
              entityId={projectId || null}
              projectId={projectId || undefined}
            />
            <EditConflictWarning
              entityType="sbc_compliance"
              entityId={projectId}
              currentRevisionNumber={0}
              onReload={handleConflictReload}
            />
            <Select value={projectId || ''} onValueChange={setProjectId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Sheet open={showSavedList} onOpenChange={setShowSavedList}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Saved Checks</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SavedConfigurationsList
                    title="SBC Compliance Checks"
                    configurations={savedConfigurations}
                    isLoading={loadingSaved}
                    onLoad={handleLoadConfiguration}
                    onDelete={handleDeleteConfiguration}
                    isDeleting={deleteCheck.isPending}
                    emptyMessage="No saved compliance checks"
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            <Button onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            
            <Button variant="outline" onClick={handleExport}>
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
        
        {/* Save Dialog */}
        <SaveDesignDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          title="Save Compliance Check"
          description="Save this compliance check for future reference"
          defaultName={`SBC Compliance - ${new Date().toLocaleDateString()}`}
          defaultProjectId={projectId}
          onSave={handleSave}
          isSaving={createCheck.isPending}
        />
        
        {/* Compliance Score Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${complianceStats.score * 3.52} 352`}
                      className={complianceStats.score >= 80 ? 'text-green-500' : complianceStats.score >= 50 ? 'text-yellow-500' : 'text-red-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{complianceStats.score.toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Compliance Score</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{complianceStats.passed}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{complianceStats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{complianceStats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{complianceStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Checks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Requirements Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Requirements Checklist
            </CardTitle>
            <CardDescription>
              Click on each item to toggle its compliance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(groupedRequirements).map(([category, requirements]) => {
                const categoryPassed = requirements.filter(r => checkResults.get(r.id) === 'pass').length;
                const categoryTotal = requirements.length;
                
                return (
                  <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{category}</span>
                        <Badge variant="outline">
                          {categoryPassed}/{categoryTotal}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {requirements.map(req => {
                          const status = checkResults.get(req.id) || 'pending';
                          return (
                            <div 
                              key={req.id}
                              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleToggleCheck(req.id, status)}
                            >
                              {getStatusIcon(status)}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{req.title}</p>
                                  {getStatusBadge(status)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {req.reference}
                                  </Badge>
                                  <Badge 
                                    variant={req.severity === 'mandatory' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {req.severity}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
        
        {/* Reference Tables */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Equipment Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Minimum Equipment Efficiency (SBC 601)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {equipmentEfficiencyItems.map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>{item.type}</span>
                    <span className="font-mono text-xs">{item.efficiency}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing 5 of {Object.keys(SBC_EQUIPMENT_EFFICIENCY).length} equipment categories
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Ventilation Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ventilation Rates (SBC 602)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {ventilationRateItems.map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>{item.spaceType}</span>
                    <span className="font-mono text-xs">
                      {item.cfmPerPerson} CFM/person + {item.cfmPerSqft} CFM/sf
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing 5 of {Object.keys(SBC_VENTILATION_RATES).filter(k => k !== 'reference').length} space types
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep 
          currentPath="/design/sbc-compliance"
          projectId={projectId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
