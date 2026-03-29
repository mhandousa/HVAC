import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, CheckCircle, AlertTriangle, Info, FileDown, Loader2 } from 'lucide-react';
import { NoisePathCalculator } from '@/components/acoustic/NoisePathCalculator';
import { NoisePathDiagram } from '@/components/acoustic/NoisePathDiagram';
import { OctaveBandSpectrumAnalyzer } from '@/components/acoustic/OctaveBandSpectrumAnalyzer';
import { useState } from 'react';
import { NoisePath, getPathRecommendations } from '@/lib/noise-path-calculations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNoisePathExport } from '@/hooks/useNoisePathExport';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { useZoneContextReadOnly } from '@/hooks/useZoneContext';
import { ToolPageHeader } from '@/components/design/ToolPageHeader';

export default function NoisePathAnalysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, zoneId: storedZoneId } = useZoneContextReadOnly();
  const projectId = searchParams.get('project') || storedProjectId;
  const zoneId = searchParams.get('zone') || storedZoneId;
  
  const [calculatedPath, setCalculatedPath] = useState<NoisePath | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const { exportToPDF, isExporting } = useNoisePathExport();

  const breadcrumbItems = [
    { label: 'Design Tools', href: '/design' },
    { label: 'Analysis & Compliance', href: '/design' },
    { label: 'Noise Path Analysis' },
  ];

  const handlePathCalculated = (path: NoisePath) => {
    setCalculatedPath(path);
    setRecommendations(getPathRecommendations(path));
  };

  const handleExportPDF = async () => {
    if (calculatedPath) {
      await exportToPDF(calculatedPath, { recommendations });
    }
  };

  // Convert final levels to spectrum sources for visualization
  const getSpectrumSources = () => {
    if (!calculatedPath || calculatedPath.elements.length === 0) return [];
    
    const lastElement = calculatedPath.elements[calculatedPath.elements.length - 1];
    return [{
      id: 'final-level',
      name: 'Sound at Receiver',
      type: 'terminal' as const,
      levels: lastElement.outputLevel,
    }];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(projectId ? `/design?project=${projectId}` : '/design')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <Breadcrumbs items={breadcrumbItems} />
              <h1 className="text-2xl font-bold text-foreground mt-1">Noise Path Analysis</h1>
              <p className="text-muted-foreground">
                Trace sound from equipment through ductwork to occupied spaces
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={!calculatedPath || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>

        <ToolPageHeader
          toolType="noise-path"
          toolName="Noise Path Analysis"
          projectId={projectId}
          showLockButton={true}
          showValidation={true}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Path Calculator */}
          <div className="xl:col-span-2">
            <NoisePathCalculator 
              onPathCalculated={handlePathCalculated}
            />
          </div>

          {/* Right: Quick Info & Recommendations */}
          <div className="space-y-6">
            {/* Compliance Status */}
            {calculatedPath && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    {calculatedPath.isCompliant ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-center p-4 rounded-lg ${
                    calculatedPath.isCompliant 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-destructive/10 border border-destructive/20'
                  }`}>
                    <div className={`text-3xl font-bold ${
                      calculatedPath.isCompliant ? 'text-primary' : 'text-destructive'
                    }`}>
                      NC-{Math.round(calculatedPath.finalNC)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Target: NC-{calculatedPath.targetNC}
                    </div>
                    <div className={`text-sm font-medium mt-2 ${
                      calculatedPath.isCompliant ? 'text-primary' : 'text-destructive'
                    }`}>
                      {calculatedPath.isCompliant 
                        ? `${calculatedPath.complianceMargin.toFixed(1)} dB margin`
                        : `${Math.abs(calculatedPath.complianceMargin).toFixed(1)} dB over target`
                      }
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-xl font-bold">NC-{Math.round(calculatedPath.sourceNC)}</div>
                      <div className="text-xs text-muted-foreground">Source</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-xl font-bold">{calculatedPath.totalAttenuation} dB</div>
                      <div className="text-xs text-muted-foreground">Total Attenuation</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Help */}
            <Alert>
              <Volume2 className="h-4 w-4" />
              <AlertTitle>How to use</AlertTitle>
              <AlertDescription className="text-sm">
                1. Enter source equipment sound levels<br />
                2. Add path segments (ducts, elbows, silencers)<br />
                3. Set destination zone and target NC<br />
                4. Click Calculate to analyze the path
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Path Diagram */}
        {calculatedPath && (
          <Card>
            <CardHeader>
              <CardTitle>Noise Path Visualization</CardTitle>
              <CardDescription>
                Sound level at each point along the transmission path
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NoisePathDiagram 
                path={calculatedPath}
                targetNC={calculatedPath.targetNC}
              />
            </CardContent>
          </Card>
        )}

        {/* Spectrum at Receiver */}
        {calculatedPath && calculatedPath.elements.length > 0 && (
          <OctaveBandSpectrumAnalyzer
            sources={getSpectrumSources()}
            targetNC={calculatedPath.targetNC}
            zoneName={calculatedPath.destinationZone}
            height={300}
          />
        )}

        <DesignWorkflowNextStep
          currentPath="/design/noise-path-analysis"
          projectId={projectId}
          zoneId={zoneId}
          variant="inline"
        />
      </div>
    </DashboardLayout>
  );
}
