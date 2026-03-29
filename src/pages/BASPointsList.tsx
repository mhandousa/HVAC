import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useZoneContext } from '@/hooks/useZoneContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Network, 
  Server, 
  Settings2, 
  Tag, 
  List,
  Download,
  FileSpreadsheet,
  ChevronLeft,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { useProjects } from '@/hooks/useProjects';
import { EquipmentSelector } from '@/components/bas-points/EquipmentSelector';
import { PointTypeConfigurator } from '@/components/bas-points/PointTypeConfigurator';
import { NamingConventionPanel } from '@/components/bas-points/NamingConventionPanel';
import { PointsPreviewTable } from '@/components/bas-points/PointsPreviewTable';
import { BASExportDialog } from '@/components/bas-points/BASExportDialog';
import { useBASPointsGenerator } from '@/hooks/useBASPointsGenerator';
import { NamingConfig, NamingConvention } from '@/lib/bas-naming-conventions';
import { useTranslation } from 'react-i18next';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';

export default function BASPointsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  
  const { projectId: storedProjectId, setContext } = useZoneContext();
  const projectIdFromUrl = searchParams.get('project') || storedProjectId || null;
  const linkedProject = projects?.find(p => p.id === projectIdFromUrl);

  const { blockers, warnings } = usePreSaveValidation(
    projectIdFromUrl || null,
    'bas-points'
  );
  
  // Sync zone context
  useEffect(() => {
    if (projectIdFromUrl) {
      setContext(projectIdFromUrl, null, { replace: true });
    }
  }, [projectIdFromUrl, setContext]);
  
  const [protocol, setProtocol] = useState<'bacnet' | 'modbus' | 'both'>('both');
  const [namingConfig, setNamingConfig] = useState<NamingConfig>({
    convention: 'saudi_modon',
    cityCode: 'RYD',
    buildingCode: 'B01',
  });
  const [showExportDialog, setShowExportDialog] = useState(false);

  const queryClient = useQueryClient();
  
  const handleConflictReload = () => {
    queryClient.invalidateQueries({ queryKey: ['bas-points', projectIdFromUrl] });
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
    { label: 'BAS Points List' },
  ];

  const {
    selectedEquipment,
    generatedPointsList,
    uniqueEquipmentTypes,
    addEquipment,
    removeEquipment,
    clearEquipment,
    togglePointType,
    enableAllPoints,
    disableAllPoints,
    resetToDefaults,
    isPointEnabled,
  } = useBASPointsGenerator({
    projectName: 'BAS Points List',
    namingConfig,
    protocol,
  });

  const handleConfigChange = (updates: Partial<NamingConfig>) => {
    setNamingConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Network className="h-6 w-6 text-primary" />
                {t('BAS Points List Generator', 'مولد قائمة نقاط BAS')}
              </h1>
              <p className="text-muted-foreground">
                {t('Generate BACnet/Modbus point schedules with Saudi naming conventions', 
                   'إنشاء جداول نقاط BACnet/Modbus مع اتفاقيات التسمية السعودية')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Protocol Selector */}
            <Select value={protocol} onValueChange={(v) => setProtocol(v as typeof protocol)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">{t('BACnet + Modbus', 'BACnet + Modbus')}</SelectItem>
                <SelectItem value="bacnet">{t('BACnet Only', 'BACnet فقط')}</SelectItem>
                <SelectItem value="modbus">{t('Modbus Only', 'Modbus فقط')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button 
              onClick={() => setShowExportDialog(true)}
              disabled={generatedPointsList.totalPoints === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('Export', 'تصدير')}
            </Button>
          </div>
        </div>

        {/* Pre-save validation alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} className="mb-4" />

        <EditConflictWarning
          entityType="bas_points"
          entityId={projectIdFromUrl}
          currentRevisionNumber={0}
          onReload={handleConflictReload}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('Equipment', 'المعدات')}</p>
                  <p className="text-2xl font-bold">{selectedEquipment.length}</p>
                </div>
                <Server className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('Total Points', 'إجمالي النقاط')}</p>
                  <p className="text-2xl font-bold">{generatedPointsList.totalPoints}</p>
                </div>
                <List className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                  AI: {generatedPointsList.summary.aiCount}
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  AO: {generatedPointsList.summary.aoCount}
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                  BI: {generatedPointsList.summary.biCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                  BO: {generatedPointsList.summary.boCount}
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500">
                  AV: {generatedPointsList.summary.avCount}
                </Badge>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                  MSV: {generatedPointsList.summary.msvCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="equipment" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="equipment" className="gap-2">
              <Server className="h-4 w-4" />
              {t('Equipment', 'المعدات')}
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-2">
              <Settings2 className="h-4 w-4" />
              {t('Point Types', 'أنواع النقاط')}
            </TabsTrigger>
            <TabsTrigger value="naming" className="gap-2">
              <Tag className="h-4 w-4" />
              {t('Naming', 'التسمية')}
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <List className="h-4 w-4" />
              {t('Preview', 'معاينة')}
            </TabsTrigger>
          </TabsList>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <EquipmentSelector
              selectedEquipment={selectedEquipment}
              onAddEquipment={addEquipment}
              onRemoveEquipment={removeEquipment}
              onClearAll={clearEquipment}
            />
          </TabsContent>

          {/* Point Types Tab */}
          <TabsContent value="points">
            <PointTypeConfigurator
              uniqueEquipmentTypes={uniqueEquipmentTypes}
              isPointEnabled={isPointEnabled}
              togglePointType={togglePointType}
              enableAllPoints={enableAllPoints}
              disableAllPoints={disableAllPoints}
              resetToDefaults={resetToDefaults}
            />
          </TabsContent>

          {/* Naming Tab */}
          <TabsContent value="naming">
            <NamingConventionPanel
              config={namingConfig}
              onConfigChange={handleConfigChange}
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <PointsPreviewTable
              pointsList={generatedPointsList}
              protocol={protocol}
            />
          </TabsContent>
        </Tabs>

        {/* Export Dialog */}
        <BASExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          pointsList={generatedPointsList}
        />

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/bas-points"
          projectId={projectIdFromUrl || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
