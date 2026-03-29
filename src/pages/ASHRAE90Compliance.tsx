import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useZoneContext } from '@/hooks/useZoneContext';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ShieldCheck, Building2, Zap, Droplets, ClipboardCheck, FileText } from 'lucide-react';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { ClimateZoneSelector } from '@/components/compliance/ClimateZoneSelector';
import { ComplianceScoreGauge } from '@/components/compliance/ComplianceScoreGauge';
import { ComplianceCheckCard } from '@/components/compliance/ComplianceCheckCard';
import { EconomizerCompliancePanel } from '@/components/compliance/EconomizerCompliancePanel';
import { FanPowerLimitPanel } from '@/components/compliance/FanPowerLimitPanel';
import { PumpPowerLimitPanel } from '@/components/compliance/PumpPowerLimitPanel';
import { MandatoryRequirementsPanel } from '@/components/compliance/MandatoryRequirementsPanel';
import { ComplianceReportExport } from '@/components/compliance/ComplianceReportExport';
import { 
  useASHRAE90Compliance,
  type EquipmentForCompliance,
  type SystemForCompliance,
  type PumpForCompliance,
} from '@/hooks/useASHRAE90Compliance';

export default function ASHRAE90Compliance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { data: projects } = useProjects();
  
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId || null;
  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);

  // Sync zone context
  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);

  const [projectName, setProjectName] = useState(linkedProject?.name || 'New Project');
  const [selectedCityId, setSelectedCityId] = useState('riyadh');
  const [mandatoryChecks, setMandatoryChecks] = useState<Record<string, boolean>>({});

  // Conflict detection
  const queryClient = useQueryClient();
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['ashrae-compliance', projectIdFromUrl] });
  };

  const handleBack = () => {
    if (projectIdFromUrl) {
      navigate(`/projects/${projectIdFromUrl}`);
    } else {
      navigate('/design');
    }
  };

  const breadcrumbItems = [
    ...(linkedProject ? [{ label: linkedProject.name, href: `/projects/${linkedProject.id}` }] : []),
    { label: 'Design Tools', href: '/design' },
    { label: 'ASHRAE 90.1 Compliance' },
  ];
  const [equipment] = useState<EquipmentForCompliance[]>([
    {
      id: '1',
      name: 'Chiller 1',
      tag: 'CH-01',
      category: 'chiller',
      capacityTons: 200,
      cop: 6.2,
      iplv: 20.8,
      manufacturer: 'Trane',
      model: 'CVGF-200',
    },
    {
      id: '2',
      name: 'Rooftop Unit 1',
      tag: 'RTU-01',
      category: 'package_unit',
      capacityKbtuh: 120,
      eer: 11.5,
      ieer: 13.2,
      manufacturer: 'Carrier',
      model: '50XC-120',
    },
    {
      id: '3',
      name: 'Split System Office',
      tag: 'AC-01',
      category: 'split_system',
      capacityKbtuh: 48,
      seer: 16.0,
      manufacturer: 'Daikin',
      model: 'FTX50',
    },
    {
      id: '4',
      name: 'VRF System',
      tag: 'VRF-01',
      category: 'vrf',
      capacityKbtuh: 180,
      eer: 10.2,
      ieer: 13.5,
      manufacturer: 'Mitsubishi',
      model: 'PUHY-EP',
    },
  ]);

  const [systems] = useState<SystemForCompliance[]>([
    {
      id: '1',
      name: 'AHU-01 Main Supply',
      systemType: 'vav',
      totalCfm: 15000,
      fanBhp: 18,
      hasEconomizer: true,
      outdoorAirCfm: 3000,
      hasEnergyRecovery: true,
      hasVariableSpeed: true,
    },
    {
      id: '2',
      name: 'DOAS-01',
      systemType: 'doas',
      totalCfm: 5000,
      fanBhp: 5,
      hasEconomizer: false,
      outdoorAirCfm: 5000,
      hasEnergyRecovery: true,
      hasVariableSpeed: true,
    },
    {
      id: '3',
      name: 'RTU-01',
      systemType: 'cav',
      totalCfm: 4000,
      fanBhp: 3.5,
      hasEconomizer: false,
      outdoorAirCfm: 800,
      hasEnergyRecovery: false,
      hasVariableSpeed: false,
    },
  ]);

  const [pumps] = useState<PumpForCompliance[]>([
    {
      id: '1',
      name: 'CHWP-01 Primary',
      systemType: 'chw',
      flowGpm: 400,
      powerKw: 7.5,
      isVariableFlow: true,
    },
    {
      id: '2',
      name: 'CHWP-02 Secondary',
      systemType: 'chw',
      flowGpm: 350,
      powerKw: 5.5,
      isVariableFlow: true,
    },
    {
      id: '3',
      name: 'CWP-01 Condenser',
      systemType: 'cw',
      flowGpm: 600,
      powerKw: 11,
      isVariableFlow: false,
    },
  ]);

  const {
    climateZone,
    city,
    equipmentChecks,
    systemChecks,
    pumpChecks,
    report,
  } = useASHRAE90Compliance({
    projectName,
    cityId: selectedCityId,
    equipment,
    systems,
    pumps,
    mandatoryFeatures: mandatoryChecks,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">ASHRAE 90.1 Compliance Checker</h1>
            </div>
            <p className="text-muted-foreground">
              Verify HVAC system designs meet energy code requirements for Saudi Arabia
            </p>
          </div>
          <ActiveEditorsIndicator
            entityType="ashrae_compliance"
            entityId={projectIdFromUrl || null}
            projectId={projectIdFromUrl || undefined}
          />
          <EditConflictWarning
            entityType="ashrae_compliance"
            entityId={projectIdFromUrl}
            currentRevisionNumber={0}
            onReload={handleConflictReload}
          />
        </div>

        {/* Project Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="md:col-span-2">
                <ClimateZoneSelector
                  selectedCityId={selectedCityId}
                  onCityChange={setSelectedCityId}
                  climateZone={climateZone}
                  city={city}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <ComplianceScoreGauge report={report} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="equipment" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="equipment" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Equipment</span>
            </TabsTrigger>
            <TabsTrigger value="systems" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Systems</span>
            </TabsTrigger>
            <TabsTrigger value="pumps" className="gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Pumps</span>
            </TabsTrigger>
            <TabsTrigger value="mandatory" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mandatory</span>
            </TabsTrigger>
            <TabsTrigger value="calculators" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Calculators</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Efficiency Compliance</CardTitle>
                <CardDescription>
                  ASHRAE 90.1-2022 Table 6.8.1 - Minimum Efficiency Requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {equipmentChecks.length > 0 ? (
                  <div className="grid gap-4">
                    {equipmentChecks.map((check) => (
                      <ComplianceCheckCard key={check.id} check={check} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No equipment data available. Add equipment to check compliance.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="systems" className="space-y-4">
            <div className="grid gap-4">
              <EconomizerCompliancePanel climateZone={climateZone} />
              
              <Card>
                <CardHeader>
                  <CardTitle>System Compliance Checks</CardTitle>
                  <CardDescription>
                    Economizer, fan power, and energy recovery requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {systemChecks.length > 0 ? (
                    <div className="grid gap-4">
                      {systemChecks.map((check) => (
                        <ComplianceCheckCard key={check.id} check={check} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No system data available. Add HVAC systems to check compliance.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pumps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pump Power Compliance</CardTitle>
                <CardDescription>
                  ASHRAE 90.1-2022 Section 6.5.4.2 - Hydronic System Pump Power
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pumpChecks.length > 0 ? (
                  <div className="grid gap-4">
                    {pumpChecks.map((check) => (
                      <ComplianceCheckCard key={check.id} check={check} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No pump data available. Add pumps to check compliance.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mandatory" className="space-y-4">
            <MandatoryRequirementsPanel
              checkedItems={mandatoryChecks}
              onItemChange={(id, checked) => 
                setMandatoryChecks(prev => ({ ...prev, [id]: checked }))
              }
            />
          </TabsContent>

          <TabsContent value="calculators" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <FanPowerLimitPanel />
              <PumpPowerLimitPanel />
            </div>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <ComplianceReportExport report={report} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    Actions to improve compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report && report.recommendations.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <ul className="space-y-2">
                        {report.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm p-2 bg-muted rounded">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      {report 
                        ? 'No recommendations - all checks passed!'
                        : 'Complete compliance checks to see recommendations'
                      }
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep 
          currentPath="/design/ashrae-compliance"
          projectId={projectIdFromUrl || undefined}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
