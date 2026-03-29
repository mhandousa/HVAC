import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowLeft,
  Wind,
  Droplets,
  Calculator,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { CrossToolValidationAlert } from '@/components/design/CrossToolValidationAlert';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { ZoneContextBanner } from '@/components/design/ZoneContextBanner';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useQueryClient } from '@tanstack/react-query';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useProjects } from '@/hooks/useProjects';
import { useDuctSystems, useDuctSegments } from '@/hooks/useDuctSystems';
import { usePipeSystems, usePipeSegments } from '@/hooks/usePipeSystems';
import {
  useAcousticAnalysis,
  analyzeDuctAcoustics,
  analyzePipeAcoustics,
  SAUDI_NC_STANDARDS,
  getNCStatusColor,
  getNCStatusBg,
  formatNCRating,
} from '@/hooks/useAcousticCalculator';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AcousticQuickCalculator } from '@/components/acoustic/AcousticQuickCalculator';
import { SaudiNCStandardsPanel } from '@/components/acoustic/SaudiNCStandardsPanel';
import { OctaveBandSpectrumAnalyzer } from '@/components/acoustic/OctaveBandSpectrumAnalyzer';
import { SourceContributionChart } from '@/components/acoustic/SourceContributionChart';
import { OctaveBandSource, estimateOctaveBandFromNC } from '@/lib/octave-band-analysis';

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export default function AcousticCalculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Zone context persistence
  const { 
    projectId: storedProjectId, 
    setContext 
  } = useZoneContext();
  
  const projectIdFromUrl = searchParams.get('project') || storedProjectId;
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl);
  const { data: projects } = useProjects();
  const linkedProject = projects?.find(p => p.id === selectedProjectId);
  
  // Pre-save validation with stage locking
  const { canSave, blockers, warnings, isLocked } = useToolValidation(selectedProjectId, 'acoustic-analysis', { checkStageLock: true });
  
  // Main tab selection
  const [mainTab, setMainTab] = useState<'system' | 'spectrum' | 'quick' | 'reference' | 'silencer'>('system');
  
  // System selection
  const [selectedDuctSystemId, setSelectedDuctSystemId] = useState<string>('');
  const [selectedPipeSystemId, setSelectedPipeSystemId] = useState<string>('');
  const [spaceType, setSpaceType] = useState<string>('open-office');
  
  // Fetch systems
  const { data: ductSystems = [] } = useDuctSystems();
  const { data: pipeSystems = [] } = usePipeSystems();
  const { data: ductSegments = [] } = useDuctSegments(selectedDuctSystemId || undefined);
  const { data: pipeSegments = [] } = usePipeSegments(selectedPipeSystemId || undefined);
  
  // Run acoustic analysis
  const analysis = useAcousticAnalysis(ductSegments, pipeSegments, spaceType);
  
  // Detailed segment analysis
  const ductAcoustics = useMemo(
    () => analyzeDuctAcoustics(ductSegments, SAUDI_NC_STANDARDS[spaceType]?.nc || 40),
    [ductSegments, spaceType]
  );
  const pipeAcoustics = useMemo(
    () => analyzePipeAcoustics(pipeSegments, SAUDI_NC_STANDARDS[spaceType]?.nc || 40),
    [pipeSegments, spaceType]
  );
  
  // Chart data
  const statusDistribution = useMemo(() => {
    const all = [...ductAcoustics, ...pipeAcoustics];
    const good = all.filter(s => s.status === 'good').length;
    const warning = all.filter(s => s.status === 'warning').length;
    const critical = all.filter(s => s.status === 'critical').length;
    
    return [
      { name: 'Acceptable', value: good, color: '#10b981' },
      { name: 'Marginal', value: warning, color: '#f59e0b' },
      { name: 'Exceeds NC', value: critical, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [ductAcoustics, pipeAcoustics]);
  
  const noiseSourcesChart = useMemo(() => {
    return analysis.sources
      .sort((a, b) => b.noiseLevel - a.noiseLevel)
      .slice(0, 10)
      .map(s => ({
        name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
        noise: s.noiseLevel,
        nc: s.noiseLevel - 7, // Approximate NC
      }));
  }, [analysis.sources]);
  
  const hasData = ductSegments.length > 0 || pipeSegments.length > 0;
  
  // Octave band sources for spectrum analyzer
  const octaveBandSources: OctaveBandSource[] = useMemo(() => {
    const sources: OctaveBandSource[] = [];
    
    // Add duct velocity noise sources
    ductAcoustics.forEach((segment, index) => {
      if (segment.velocityNoise > 0) {
        sources.push({
          id: `duct-vel-${segment.segmentId}`,
          name: `${segment.segmentName} - Velocity`,
          type: 'duct',
          levels: estimateOctaveBandFromNC(segment.ncEquivalent),
        });
      }
      if (segment.fittingNoise > 0) {
        sources.push({
          id: `duct-fit-${segment.segmentId}`,
          name: `${segment.segmentName} - Fittings`,
          type: 'fitting',
          levels: estimateOctaveBandFromNC(Math.max(15, segment.ncEquivalent - 3)),
        });
      }
    });
    
    // Add pipe noise sources
    pipeAcoustics.forEach((segment) => {
      if (segment.totalNoise > 0) {
        sources.push({
          id: `pipe-${segment.segmentId}`,
          name: `${segment.segmentName} - Flow`,
          type: 'equipment',
          levels: estimateOctaveBandFromNC(segment.ncEquivalent),
        });
      }
    });
    
    return sources;
  }, [ductAcoustics, pipeAcoustics]);
  
  // Source contributions for pie chart
  const sourceContributions = useMemo(() => {
    return octaveBandSources.map((source, index) => ({
      source: source.name,
      percentage: Math.round((source.levels['1kHz'] / Math.max(1, octaveBandSources.reduce((sum, s) => sum + s.levels['1kHz'], 0))) * 100),
      color: CHART_COLORS[index % CHART_COLORS.length],
      type: source.type,
    }));
  }, [octaveBandSources]);
  
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/design')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Acoustic Noise Calculator</h1>
            <p className="text-muted-foreground">
              Analyze noise levels and NC ratings for duct and pipe systems per Saudi standards
            </p>
          </div>
          <ActiveEditorsIndicator
            entityType="acoustic_calculation"
            entityId={selectedDuctSystemId || selectedPipeSystemId || null}
            projectId={selectedProjectId || undefined}
          />
        </div>

        {/* Workflow Progress Bar */}
        {selectedProjectId && (
          <DesignWorkflowProgressBar
            projectId={selectedProjectId}
            variant="compact"
            showLabels={false}
            showPercentages={true}
            className="mb-2"
          />
        )}

        {/* Data Flow Suggestions */}
        {selectedProjectId && (
          <DataFlowSuggestions
            projectId={selectedProjectId}
            currentTool="acoustic-calculator"
            variant="alert"
            className="mb-2"
          />
        )}

        {/* Cross-Tool Validation Alert */}
        {selectedProjectId && (
          <CrossToolValidationAlert
            projectId={selectedProjectId}
            currentTool="acoustic"
            variant="alert"
            className="mb-2"
          />
        )}
        
        {/* Tool Page Header with stage locking */}
        <ToolPageHeader
          toolType="acoustic-analysis"
          toolName="Acoustic Noise Calculator"
          projectId={selectedProjectId || undefined}
          showLockButton={true}
          showValidation={true}
        />

        {/* Phase 18: Edit Conflict Warning */}
        <EditConflictWarning
          entityType="acoustic"
          entityId={selectedDuctSystemId || selectedPipeSystemId || null}
          currentRevisionNumber={0}
          onReload={() => window.location.reload()}
        />
        
        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)}>
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="spectrum" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Spectrum
            </TabsTrigger>
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Quick Calc
            </TabsTrigger>
            <TabsTrigger value="reference" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Reference
            </TabsTrigger>
            <TabsTrigger value="silencer" className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              Silencer
            </TabsTrigger>
          </TabsList>
          
          {/* Quick Calculator Tab */}
          <TabsContent value="quick" className="mt-6">
            <AcousticQuickCalculator />
          </TabsContent>
          
          {/* NC Reference Tab */}
          <TabsContent value="reference" className="mt-6">
            <SaudiNCStandardsPanel currentSpaceType={spaceType} />
          </TabsContent>
          
          {/* Spectrum Analysis Tab */}
          <TabsContent value="spectrum" className="mt-6 space-y-6">
            {hasData && octaveBandSources.length > 0 ? (
              <>
                <OctaveBandSpectrumAnalyzer
                  sources={octaveBandSources}
                  targetNC={analysis.targetNC}
                  zoneName={SAUDI_NC_STANDARDS[spaceType]?.description || 'Selected Space'}
                  height={350}
                  showSourceBreakdown={true}
                />
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <SourceContributionChart
                    contributions={sourceContributions}
                    title="Noise Source Breakdown"
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Frequency Analysis Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Sources</span>
                        <span className="font-medium">{octaveBandSources.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Target NC</span>
                        <span className="font-medium">NC-{analysis.targetNC}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Calculated NC</span>
                        <Badge variant={analysis.passesCriteria ? 'default' : 'destructive'}>
                          NC-{analysis.ncRating}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Compliance Margin</span>
                        <span className={`font-medium ${analysis.passesCriteria ? 'text-green-600' : 'text-red-600'}`}>
                          {analysis.passesCriteria ? '+' : ''}{analysis.targetNC - analysis.ncRating} dB
                        </span>
                      </div>
                      <Separator />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/design/noise-path-analysis')}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Open Full Path Analysis
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Data for Spectrum Analysis</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Select a duct or pipe system in the System tab to view octave band spectrum breakdown and NC compliance analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Silencer Selection Tab */}
          <TabsContent value="silencer" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <VolumeX className="h-5 w-5" />
                  Silencer Selection Tool
                </CardTitle>
                <CardDescription>
                  Find silencers matching your frequency-specific attenuation requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.attenuationRequired > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Current Requirement</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {analysis.attenuationRequired} dB attenuation needed
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                      To achieve NC-{analysis.targetNC} from current NC-{analysis.ncRating}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    The Silencer Selection Tool helps you find the perfect silencer based on:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Frequency-specific attenuation at each octave band (63Hz - 8kHz)</li>
                    <li>• Physical constraints (duct size, length, pressure drop)</li>
                    <li>• Manufacturer preferences and budget</li>
                    <li>• Real product data from leading manufacturers</li>
                  </ul>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (analysis.attenuationRequired > 0) {
                      params.set('attenuation', analysis.attenuationRequired.toString());
                      params.set('currentNC', analysis.ncRating.toString());
                      params.set('targetNC', analysis.targetNC.toString());
                    }
                    navigate(`/design/silencer-selection?${params.toString()}`);
                  }}
                >
                  <VolumeX className="h-4 w-4 mr-2" />
                  Open Silencer Selection Tool
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* System Analysis Tab */}
          <TabsContent value="system" className="mt-6 space-y-6">
        
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Analysis Configuration
            </CardTitle>
            <CardDescription>
              Select systems to analyze and specify the target space type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Duct System */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Duct System
                </Label>
                <Select value={selectedDuctSystemId} onValueChange={setSelectedDuctSystemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duct system (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {ductSystems.map(system => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.system_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDuctSystemId && (
                  <p className="text-xs text-muted-foreground">
                    {ductSegments.length} segments loaded
                  </p>
                )}
              </div>
              
              {/* Pipe System */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Pipe System
                </Label>
                <Select value={selectedPipeSystemId} onValueChange={setSelectedPipeSystemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pipe system (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {pipeSystems.map(system => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.system_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPipeSystemId && (
                  <p className="text-xs text-muted-foreground">
                    {pipeSegments.length} segments loaded
                  </p>
                )}
              </div>
              
              {/* Space Type */}
              <div className="space-y-2">
                <Label>Target Space Type (Saudi NC Standard)</Label>
                <Select value={spaceType} onValueChange={setSpaceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAUDI_NC_STANDARDS).map(([key, { nc, description }]) => (
                      <SelectItem key={key} value={key}>
                        NC-{nc}: {description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Results */}
        {hasData ? (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {/* Total Noise Level */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Combined Noise Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {analysis.totalNoiseLevel}
                    </span>
                    <span className="text-muted-foreground">dB(A)</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* NC Rating */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Estimated NC Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-bold ${
                      analysis.passesCriteria ? 'text-green-600' : 'text-red-600'
                    }`}>
                      NC-{analysis.ncRating}
                    </span>
                    {analysis.passesCriteria ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Target NC */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Target NC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    NC-{analysis.targetNC}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {SAUDI_NC_STANDARDS[spaceType]?.description}
                  </p>
                </CardContent>
              </Card>
              
              {/* Attenuation Required */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Attenuation Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${
                    analysis.attenuationRequired > 0 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {analysis.attenuationRequired > 0 ? `${analysis.attenuationRequired} dB` : 'None'}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts and Details */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Segment Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No segment data
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Top Noise Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Noise Sources</CardTitle>
                  <CardDescription>Loudest segments requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {noiseSourcesChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={noiseSourcesChart} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 'auto']} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="noise" fill="#6366f1" name="Noise (dB)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No noise sources to display
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {rec.startsWith('•') ? (
                        <span className="text-muted-foreground">{rec}</span>
                      ) : (
                        <span className="font-medium">{rec}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Detailed Tables */}
            <Tabs defaultValue="duct" className="space-y-4">
              <TabsList>
                <TabsTrigger value="duct" disabled={ductAcoustics.length === 0}>
                  Duct Segments ({ductAcoustics.length})
                </TabsTrigger>
                <TabsTrigger value="pipe" disabled={pipeAcoustics.length === 0}>
                  Pipe Segments ({pipeAcoustics.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="duct">
                <Card>
                  <CardHeader>
                    <CardTitle>Duct Segment Acoustic Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Segment</TableHead>
                          <TableHead className="text-right">Velocity (FPM)</TableHead>
                          <TableHead className="text-right">Velocity Noise (dB)</TableHead>
                          <TableHead className="text-right">Fitting Noise (dB)</TableHead>
                          <TableHead className="text-right">Total (dB)</TableHead>
                          <TableHead className="text-right">NC Equiv.</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ductAcoustics.map(segment => (
                          <TableRow key={segment.segmentId}>
                            <TableCell className="font-medium">{segment.segmentName}</TableCell>
                            <TableCell className="text-right">{segment.velocity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{segment.velocityNoise}</TableCell>
                            <TableCell className="text-right">{segment.fittingNoise}</TableCell>
                            <TableCell className="text-right font-medium">{segment.totalNoise}</TableCell>
                            <TableCell className="text-right">{formatNCRating(segment.ncEquivalent)}</TableCell>
                            <TableCell>
                              <Badge className={getNCStatusBg(segment.status)}>
                                <span className={getNCStatusColor(segment.status)}>
                                  {segment.status === 'good' ? 'OK' : 
                                   segment.status === 'warning' ? 'Marginal' : 'Exceeds'}
                                </span>
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pipe">
                <Card>
                  <CardHeader>
                    <CardTitle>Pipe Segment Acoustic Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Segment</TableHead>
                          <TableHead className="text-right">Velocity (FPS)</TableHead>
                          <TableHead className="text-right">Flow Noise (dB)</TableHead>
                          <TableHead className="text-right">Fitting Noise (dB)</TableHead>
                          <TableHead className="text-right">Total (dB)</TableHead>
                          <TableHead className="text-right">NC Equiv.</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pipeAcoustics.map(segment => (
                          <TableRow key={segment.segmentId}>
                            <TableCell className="font-medium">{segment.segmentName}</TableCell>
                            <TableCell className="text-right">{segment.velocity.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{segment.velocityNoise}</TableCell>
                            <TableCell className="text-right">{segment.fittingNoise}</TableCell>
                            <TableCell className="text-right font-medium">{segment.totalNoise}</TableCell>
                            <TableCell className="text-right">{formatNCRating(segment.ncEquivalent)}</TableCell>
                            <TableCell>
                              <Badge className={getNCStatusBg(segment.status)}>
                                <span className={getNCStatusColor(segment.status)}>
                                  {segment.status === 'good' ? 'OK' : 
                                   segment.status === 'warning' ? 'Marginal' : 'Exceeds'}
                                </span>
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* NC Standards Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Saudi NC Standards Reference</CardTitle>
                <CardDescription>
                  Recommended NC levels for various space types per SASO and ASHRAE guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-3">
                  {Object.entries(SAUDI_NC_STANDARDS).map(([key, { nc, description }]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border ${
                        key === spaceType ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">NC-{nc}</span>
                        {key === spaceType && (
                          <Badge variant="default" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <VolumeX className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No System Selected</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Select a duct system or pipe system above to analyze acoustic noise levels
                and compare against Saudi NC standards.
              </p>
            </CardContent>
          </Card>
        )}
          </TabsContent>
        </Tabs>
        
        {/* Workflow Navigation */}
        <DesignWorkflowNextStep 
          currentPath="/design/acoustic-calculator"
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
