import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Droplets, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { RevisionHistoryPanel } from '@/components/design/RevisionHistoryPanel';
import { DesignTemplateSelector } from '@/components/design/DesignTemplateSelector';
import { SaveAsTemplateDialog } from '@/components/design/SaveAsTemplateDialog';
import { ActiveEditorsIndicator } from '@/components/design/ActiveEditorsIndicator';
import { EditConflictWarning } from '@/components/design/EditConflictWarning';
import { useConflictDetection } from '@/hooks/useConflictDetection';
import { useQueryClient } from '@tanstack/react-query';
import { useZoneContext } from '@/hooks/useZoneContext';
import { ToolPageHeader, useToolValidation } from '@/components/design/ToolPageHeader';
import { sizeExpansionTank, type ExpansionTankSizing as ExpansionTankResult } from '@/lib/hot-water-plant-calculations';

type SystemType = 'chw' | 'hhw' | 'cw';
type TankType = 'diaphragm' | 'bladder' | 'plain_steel';

interface ExtendedResults extends ExpansionTankResult {
  warnings: string[];
  recommendations: string[];
}

// Temperature ranges by system type
const SYSTEM_DEFAULTS: Record<SystemType, { coldFill: number; maxOp: number; label: string }> = {
  chw: { coldFill: 45, maxOp: 55, label: 'Chilled Water' },
  hhw: { coldFill: 60, maxOp: 180, label: 'Heating Hot Water' },
  cw: { coldFill: 75, maxOp: 95, label: 'Condenser Water' },
};

// Standard tank sizes (gallons)
const STANDARD_TANK_SIZES = [2, 4.4, 6, 8, 10, 14, 20, 26, 32, 44, 60, 79, 100, 119, 158, 211, 264, 317, 422, 528];

export default function ExpansionTankSizing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { projectId, zoneId } = useZoneContext();

  // Current sizing ID for revisions
  const [currentSizingId, setCurrentSizingId] = useState<string | undefined>(undefined);

  // Phase 5.3: Concurrent Editing
  const queryClient = useQueryClient();
  const { hasConflict, latestRevision, clearConflict } = useConflictDetection({
    entityType: 'expansion_tank',
    entityId: currentSizingId || null,
    currentRevisionNumber: 0,
  });

  const handleReloadLatest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['expansion-tank-sizings'] });
    clearConflict();
    toast.info('Reloaded latest version');
  }, [queryClient, clearConflict]);

  const handleForceSave = useCallback(() => {
    clearConflict();
  }, [clearConflict]);

  // Input state
  const [systemType, setSystemType] = useState<SystemType>('chw');
  const [tankType, setTankType] = useState<TankType>('diaphragm');
  const [systemVolume, setSystemVolume] = useState<number>(500);
  const [coldFillTemp, setColdFillTemp] = useState<number>(45);
  const [maxOpTemp, setMaxOpTemp] = useState<number>(55);
  const [staticHead, setStaticHead] = useState<number>(50);
  const [fillPressure, setFillPressure] = useState<number>(12);
  const [reliefPressure, setReliefPressure] = useState<number>(30);
  const [safetyFactor, setSafetyFactor] = useState<number>(1.0);

  // Results
  const [results, setResults] = useState<ExtendedResults | null>(null);

  // Phase 17: Stage locking and validation
  const { canSave, isLocked } = useToolValidation(projectId, 'expansion-tank-sizing', { checkStageLock: true });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Update temperatures when system type changes
  useEffect(() => {
    const defaults = SYSTEM_DEFAULTS[systemType];
    setColdFillTemp(defaults.coldFill);
    setMaxOpTemp(defaults.maxOp);
  }, [systemType]);

  // Auto-calculate on input change
  useEffect(() => {
    if (systemVolume > 0 && staticHead > 0) {
      calculateTank();
    }
  }, [systemVolume, coldFillTemp, maxOpTemp, staticHead, fillPressure, reliefPressure, safetyFactor, tankType]);

  const calculateTank = () => {
    try {
      const baseResult = sizeExpansionTank(systemVolume, coldFillTemp, maxOpTemp, staticHead);
      
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Apply safety factor
      const adjustedTankVolume = baseResult.tankVolume_gal * safetyFactor;
      
      // Find next standard size
      const standardSize = STANDARD_TANK_SIZES.find(s => s >= adjustedTankVolume) || 
        STANDARD_TANK_SIZES[STANDARD_TANK_SIZES.length - 1];

      // Pressure validation
      if (fillPressure < staticHead * 0.433) {
        warnings.push(`Fill pressure (${fillPressure} psi) is less than static head (${(staticHead * 0.433).toFixed(1)} psi)`);
      }

      if (reliefPressure <= fillPressure + 5) {
        warnings.push('Relief pressure should be at least 5 psi above fill pressure');
      }

      // Tank type recommendations
      if (tankType === 'plain_steel' && maxOpTemp < 200) {
        recommendations.push('Diaphragm or bladder tanks are preferred for temperatures below 200°F');
      }

      if (standardSize >= 100) {
        recommendations.push('Consider multiple smaller tanks for easier handling and redundancy');
      }

      if (systemType === 'chw') {
        recommendations.push('Locate tank at pump suction to maintain positive pressure throughout system');
      }

      if (systemType === 'hhw' && maxOpTemp >= 180) {
        recommendations.push('Use ASME-rated tank for temperatures above 180°F');
        recommendations.push('Consider high-temperature bladder rated for 240°F+');
      }

      const extendedResult: ExtendedResults = {
        ...baseResult,
        tankVolume_gal: standardSize,
        warnings,
        recommendations,
      };

      setResults(extendedResult);
    } catch (error) {
      toast.error('Calculation error');
      console.error(error);
    }
  };

  const handleApplyTemplate = (templateData: Record<string, unknown>) => {
    if (templateData.systemType) setSystemType(templateData.systemType as SystemType);
    if (templateData.tankType) setTankType(templateData.tankType as TankType);
    if (templateData.systemVolume) setSystemVolume(templateData.systemVolume as number);
    if (templateData.safetyFactor) setSafetyFactor(templateData.safetyFactor as number);
    toast.success('Template applied');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expansion Tank Sizing Calculator</h1>
            <p className="text-muted-foreground">
              Size expansion tanks for CHW, HHW, and condenser water systems
            </p>
          </div>
          <div className="flex gap-2">
            <DesignTemplateSelector
              templateType="expansion_tank_sizing"
              onApply={handleApplyTemplate}
              trigger={
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              }
            />
            <SaveAsTemplateDialog
              templateType="expansion_tank_sizing"
              templateData={{
                systemType,
                tankType,
                systemVolume,
                coldFillTemp,
                maxOpTemp,
                staticHead,
                fillPressure,
                reliefPressure,
                safetyFactor,
              }}
              trigger={
                <Button variant="outline" size="sm">
                  Save as Template
                </Button>
              }
            />
            <ActiveEditorsIndicator 
              entityType="expansion_tank"
              entityId={currentSizingId || null}
              projectId={projectId || undefined}
            />
          </div>
        </div>

        {/* Workflow Progress */}
        {projectId && (
          <Card className="p-4">
            <DesignWorkflowProgressBar projectId={projectId} variant="compact" />
          </Card>
        )}

        {/* Phase 5.3: Edit Conflict Warning */}
        {hasConflict && latestRevision && currentSizingId && (
          <EditConflictWarning
            entityType="expansion_tank"
            entityId={currentSizingId}
            currentRevisionNumber={0}
            onReload={handleReloadLatest}
            onForceSave={handleForceSave}
          />
        )}

        {/* Phase 17: Unified Tool Header with Stage Locking */}
        <ToolPageHeader
          toolType="expansion-tank-sizing"
          toolName="Expansion Tank Sizing"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        {/* Phase 7: DataFlow Import Handler */}
        <DataFlowImportHandler
          projectId={projectId}
          zoneId={zoneId}
          currentTool="expansion-tank-sizing"
        />

        {/* Data Flow Suggestions */}
        <DataFlowSuggestions
          projectId={projectId}
          zoneId={zoneId}
          currentTool="expansion-tank-sizing"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>System Parameters</CardTitle>
              <CardDescription>Enter hydronic system data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Type</Label>
                <Select value={systemType} onValueChange={(v) => setSystemType(v as SystemType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chw">Chilled Water</SelectItem>
                    <SelectItem value="hhw">Heating Hot Water</SelectItem>
                    <SelectItem value="cw">Condenser Water</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tank Type</Label>
                <Select value={tankType} onValueChange={(v) => setTankType(v as TankType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaphragm">Diaphragm</SelectItem>
                    <SelectItem value="bladder">Bladder</SelectItem>
                    <SelectItem value="plain_steel">Plain Steel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>System Volume (gallons)</Label>
                <Input
                  type="number"
                  value={systemVolume}
                  onChange={(e) => setSystemVolume(Number(e.target.value))}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">
                  Include piping, coils, and equipment
                </p>
              </div>

              <div className="space-y-2">
                <Label>Cold Fill Temperature (°F)</Label>
                <Input
                  type="number"
                  value={coldFillTemp}
                  onChange={(e) => setColdFillTemp(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Operating Temperature (°F)</Label>
                <Input
                  type="number"
                  value={maxOpTemp}
                  onChange={(e) => setMaxOpTemp(Number(e.target.value))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Static Head (ft)</Label>
                <Input
                  type="number"
                  value={staticHead}
                  onChange={(e) => setStaticHead(Number(e.target.value))}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">
                  Height from tank to highest point
                </p>
              </div>

              <div className="space-y-2">
                <Label>Fill Pressure (psi)</Label>
                <Input
                  type="number"
                  value={fillPressure}
                  onChange={(e) => setFillPressure(Number(e.target.value))}
                  placeholder="12"
                />
              </div>

              <div className="space-y-2">
                <Label>Relief Pressure (psi)</Label>
                <Input
                  type="number"
                  value={reliefPressure}
                  onChange={(e) => setReliefPressure(Number(e.target.value))}
                  placeholder="30"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Safety Factor</Label>
                <Select value={safetyFactor.toString()} onValueChange={(v) => setSafetyFactor(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.0">1.0× (Minimum)</SelectItem>
                    <SelectItem value="1.1">1.1× (Standard)</SelectItem>
                    <SelectItem value="1.25">1.25× (Conservative)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Expansion tank sizing and selection</CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-6">
                  {/* Main Results */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Selected Tank Size</p>
                      <p className="text-3xl font-bold text-primary">{results.tankVolume_gal} gal</p>
                      <Badge variant="outline" className="mt-1">Standard Size</Badge>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Expansion Volume</p>
                      <p className="text-2xl font-bold">{results.expansionVolume_gal.toFixed(1)} gal</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Acceptance Factor</p>
                      <p className="text-2xl font-bold">{(results.acceptanceFactor * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Pressure Settings */}
                  <div>
                    <h3 className="font-semibold mb-3">Pressure Settings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Fill Pressure</p>
                        <p className="text-xl font-bold">{results.fillPressure_psi.toFixed(1)} psi</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Fill Pressure</p>
                        <p className="text-xl font-bold">{fillPressure} psi</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Relief Pressure</p>
                        <p className="text-xl font-bold">{reliefPressure} psi</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Temperature Range */}
                  <div>
                    <h3 className="font-semibold mb-3">Operating Range</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500"
                          style={{ 
                            left: `${(coldFillTemp / 250) * 100}%`,
                            width: `${((maxOpTemp - coldFillTemp) / 250) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{coldFillTemp}°F (Cold Fill)</span>
                      <span>{maxOpTemp}°F (Max Op)</span>
                    </div>
                  </div>

                  {/* Warnings */}
                  {results.warnings.length > 0 && (
                    <div className="space-y-2">
                      {results.warnings.map((warning, i) => (
                        <Alert key={i} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{warning}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {results.recommendations.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {results.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter system parameters to calculate tank size</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revision History Panel */}
        {currentSizingId && (
          <RevisionHistoryPanel
            entityType="expansion_tank_sizing"
            entityId={currentSizingId}
            projectId={projectId || ''}
          />
        )}

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/expansion-tank-sizing"
          projectId={projectId}
        />
      </div>
    </DashboardLayout>
  );
}
