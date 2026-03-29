import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useDesignValidation, ValidationStatus, ValidationCheck, ZoneValidation, SystemValidation } from '@/hooks/useDesignValidation';
import { useDesignValidationExport } from '@/hooks/useDesignValidationExport';
import { useDesignValidationRules } from '@/hooks/useDesignValidationRules';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ValidationRulesPanel } from '@/components/design/ValidationRulesPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Download,
  RefreshCw,
  ArrowRight,
  Wind,
  Droplets,
  Zap,
  Link,
  Gauge,
  Fan,
  Thermometer,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ValidationFlowDiagram } from '@/components/design/ValidationFlowDiagram';

const statusConfig: Record<ValidationStatus, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  pass: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  fail: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10' },
};

const categoryIcons: Record<string, typeof Wind> = {
  airflow: Wind,
  capacity: Zap,
  hydronic: Droplets,
  sizing: Gauge,
  equipment: Zap,
  linkage: Link,
  acoustic: Volume2,
};

function StatusBadge({ status }: { status: ValidationStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1', config.bg, config.color)}>
      <Icon className="w-3 h-3" />
      {status.toUpperCase()}
    </Badge>
  );
}

function ValidationCheckRow({ check }: { check: ValidationCheck }) {
  const config = statusConfig[check.status];
  const Icon = config.icon;
  const CategoryIcon = categoryIcons[check.category] || Info;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{check.name}</p>
            <p className="text-xs text-muted-foreground">{check.description}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {check.expected} {check.unit}
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {check.actual} {check.unit}
      </TableCell>
      <TableCell className="text-right">
        {check.deviation !== undefined ? (
          <span className={cn(
            'font-mono text-sm',
            check.deviation > 0 ? 'text-warning' : check.deviation < -5 ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {check.deviation > 0 ? '+' : ''}{check.deviation.toFixed(1)}%
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Icon className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-xs font-medium', config.color)}>{check.status.toUpperCase()}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ZoneCard({ zone }: { zone: ZoneValidation }) {
  const config = statusConfig[zone.overallStatus];
  const Icon = config.icon;

  return (
    <AccordionItem value={zone.zoneId} className="border rounded-lg px-4 mb-2">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <Icon className={cn('w-5 h-5', config.color)} />
            <div className="text-left">
              <p className="font-medium">{zone.zoneName}</p>
              {(zone.buildingName || zone.floorName) && (
                <p className="text-xs text-muted-foreground">
                  {[zone.buildingName, zone.floorName].filter(Boolean).join(' > ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-success">{zone.passCount} pass</span>
              <span className="text-warning">{zone.warningCount} warn</span>
              <span className="text-destructive">{zone.failCount} fail</span>
            </div>
            <StatusBadge status={zone.overallStatus} />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Deviation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zone.checks.map((check) => (
                <ValidationCheckRow key={check.id} check={check} />
              ))}
            </TableBody>
          </Table>
          {zone.checks.some(c => c.recommendation) && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Recommendations:</p>
              {zone.checks
                .filter(c => c.recommendation)
                .map((check) => (
                  <div key={check.id} className={cn('p-3 rounded-lg text-sm', statusConfig[check.status].bg)}>
                    {check.recommendation}
                  </div>
                ))}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function SystemCard({ system }: { system: SystemValidation }) {
  const config = statusConfig[system.overallStatus];
  const Icon = config.icon;
  
  const getTypeIcon = () => {
    switch (system.systemType) {
      case 'duct': return Wind;
      case 'pipe': return Droplets;
      case 'ahu': return Fan;
      case 'vrf': return Thermometer;
      default: return Zap;
    }
  };
  const TypeIcon = getTypeIcon();

  return (
    <AccordionItem value={system.systemId} className="border rounded-lg px-4 mb-2">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
              <TypeIcon className={cn('w-4 h-4', config.color)} />
            </div>
            <div className="text-left">
              <p className="font-medium">{system.systemName}</p>
              <p className="text-xs text-muted-foreground capitalize">{system.systemType} System</p>
            </div>
          </div>
          <StatusBadge status={system.overallStatus} />
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-2 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Deviation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {system.checks.map((check) => (
                <ValidationCheckRow key={check.id} check={check} />
              ))}
            </TableBody>
          </Table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function DesignValidation() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdParam = searchParams.get('project') || storedProjectId;
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdParam || '');
  const { report, isLoading: validationLoading } = useDesignValidation(selectedProjectId || undefined);
  const { exportToPdf } = useDesignValidationExport();
  
  // Rule-based validation engine
  const {
    ruleResults,
    score: rulesScore,
    isLoading: rulesLoading,
    refetch: refetchRules
  } = useDesignValidationRules(selectedProjectId || undefined);

  useEffect(() => {
    if (selectedProjectId) {
      setContext(selectedProjectId, null, { replace: true });
    }
  }, [selectedProjectId, setContext]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (projectIdParam && !selectedProjectId) {
      setSelectedProjectId(projectIdParam);
    }
  }, [projectIdParam]);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    setSearchParams({ project: value });
  };

  const handleExport = () => {
    if (report) {
      exportToPdf(report);
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs
          items={[
            { label: 'Design Tools', href: '/design' },
            { label: 'Design Health', href: `/design/health${selectedProjectId ? `?project=${selectedProjectId}` : ''}` },
            { label: 'Validation Report' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Design Validation Report</h1>
              <p className="text-muted-foreground">
                Cross-check loads, equipment, and systems for design consistency
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} disabled={validationLoading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', validationLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={!report}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Project Selection */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Project:</label>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Choose a project to validate..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {validationLoading && selectedProjectId && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Analyzing design...</span>
          </div>
        )}

        {/* No Project Selected */}
        {!selectedProjectId && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Select a project to generate validation report</p>
            </CardContent>
          </Card>
        )}

        {/* Validation Report */}
        {report && !validationLoading && (
          <>
            {/* Validation Rules Panel */}
            <ValidationRulesPanel
              ruleResults={ruleResults}
              executedCount={rulesScore.passCount + rulesScore.warningCount + rulesScore.failCount}
              totalCount={22}
              onRefresh={refetchRules}
            />
            
            {/* Overall Status */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className={cn('border-2', statusConfig[report.overallStatus].bg)}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = statusConfig[report.overallStatus].icon;
                      return <Icon className={cn('w-10 h-10', statusConfig[report.overallStatus].color)} />;
                    })()}
                    <div>
                      <p className="text-2xl font-bold">{report.overallStatus.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">Overall Status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                    <div>
                      <p className="text-2xl font-bold text-success">{report.summary.passCount}</p>
                      <p className="text-xs text-muted-foreground">Passed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-warning" />
                    <div>
                      <p className="text-2xl font-bold text-warning">{report.summary.warningCount}</p>
                      <p className="text-xs text-muted-foreground">Warnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-destructive" />
                    <div>
                      <p className="text-2xl font-bold text-destructive">{report.summary.failCount}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Completion Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Design Completion Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={report.summary.completionScore} className="flex-1" />
                  <span className="text-2xl font-bold">{report.summary.completionScore}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Status */}
            <Card>
              <CardHeader>
                <CardTitle>Design Workflow Status</CardTitle>
                <CardDescription>Progress through the design stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={cn(
                    'p-4 rounded-lg border-2',
                    report.stageStatus.loadCalculations.hasData ? 'border-success bg-success/5' : 'border-muted'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="font-medium">Load Calcs</span>
                    </div>
                    <p className="text-2xl font-bold">{report.stageStatus.loadCalculations.count}</p>
                  </div>

                  <div className={cn(
                    'p-4 rounded-lg border-2',
                    report.stageStatus.equipmentSelections.hasData ? 'border-success bg-success/5' : 'border-muted'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="font-medium">Equipment</span>
                    </div>
                    <p className="text-2xl font-bold">{report.stageStatus.equipmentSelections.count}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.stageStatus.equipmentSelections.linkedToLoads} linked
                    </p>
                  </div>

                  <div className={cn(
                    'p-4 rounded-lg border-2',
                    report.stageStatus.terminalUnits.hasData ? 'border-success bg-success/5' : 'border-muted'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Fan className="w-5 h-5 text-primary" />
                      <span className="font-medium">Terminal Units</span>
                    </div>
                    <p className="text-2xl font-bold">{report.stageStatus.terminalUnits.count}</p>
                  </div>

                  <div className={cn(
                    'p-4 rounded-lg border-2',
                    (report.stageStatus.ahuConfigurations.hasData || report.stageStatus.vrfSystems.hasData) 
                      ? 'border-success bg-success/5' : 'border-muted'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-5 h-5 text-primary" />
                      <span className="font-medium">AHU/VRF</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {report.stageStatus.ahuConfigurations.count + report.stageStatus.vrfSystems.count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cross-Tool Validation Flow Diagram */}
            <ValidationFlowDiagram 
              stageStatus={report.stageStatus}
              crossToolValidation={report.crossToolValidation}
            />

            {/* Tabbed Content */}
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="zones">By Zone ({report.zoneValidations.length})</TabsTrigger>
                <TabsTrigger value="systems">By System ({report.systemValidations.length})</TabsTrigger>
                <TabsTrigger value="recommendations">
                  Recommendations
                  {report.recommendations.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {report.recommendations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary">
                <Card>
                  <CardHeader>
                    <CardTitle>All Validation Checks</CardTitle>
                    <CardDescription>
                      Complete list of all validation checks performed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.summary.totalChecks === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No validation checks available.</p>
                        <p className="text-sm">Complete load calculations and link systems to enable validation.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Check</TableHead>
                            <TableHead className="text-right">Expected</TableHead>
                            <TableHead className="text-right">Actual</TableHead>
                            <TableHead className="text-right">Deviation</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...report.zoneValidations.flatMap(z => z.checks), ...report.systemValidations.flatMap(s => s.checks)]
                            .sort((a, b) => {
                              const statusOrder = { fail: 0, warning: 1, info: 2, pass: 3 };
                              return statusOrder[a.status] - statusOrder[b.status];
                            })
                            .map((check) => (
                              <ValidationCheckRow key={check.id} check={check} />
                            ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Zones Tab */}
              <TabsContent value="zones">
                <Card>
                  <CardHeader>
                    <CardTitle>Zone Validations</CardTitle>
                    <CardDescription>
                      Validation results organized by zone
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.zoneValidations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No zone validations available.</p>
                        <p className="text-sm">Complete load calculations for zones to enable validation.</p>
                      </div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {report.zoneValidations.map((zone) => (
                          <ZoneCard key={zone.zoneId} zone={zone} />
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Systems Tab */}
              <TabsContent value="systems">
                <Card>
                  <CardHeader>
                    <CardTitle>System Validations</CardTitle>
                    <CardDescription>
                      Validation results for duct and pipe systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.systemValidations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No system validations available.</p>
                        <p className="text-sm">Create and link duct/pipe systems to enable validation.</p>
                      </div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {report.systemValidations.map((system) => (
                          <SystemCard key={system.systemId} system={system} />
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations">
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>
                      Prioritized action items to improve design consistency
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.recommendations.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
                        <p className="font-medium text-success">All checks passed!</p>
                        <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {report.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className={cn(
                              'p-4 rounded-lg border-l-4',
                              rec.priority === 'high' && 'bg-destructive/5 border-destructive',
                              rec.priority === 'medium' && 'bg-warning/5 border-warning',
                              rec.priority === 'low' && 'bg-info/5 border-info'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  rec.priority === 'high' && 'bg-destructive/10 text-destructive',
                                  rec.priority === 'medium' && 'bg-warning/10 text-warning',
                                  rec.priority === 'low' && 'bg-info/10 text-info'
                                )}
                              >
                                {rec.priority.toUpperCase()} PRIORITY
                              </Badge>
                              <Badge variant="secondary">{rec.category}</Badge>
                            </div>
                            <p className="text-sm">{rec.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Affected: {rec.affectedItems.join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        <DesignWorkflowNextStep
          currentPath="/design/validation"
          projectId={selectedProjectId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
