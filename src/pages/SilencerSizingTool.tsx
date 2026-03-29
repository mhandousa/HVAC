import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Volume2, ArrowLeft } from 'lucide-react';
import { SilencerSizingCalculator } from '@/components/acoustic/SilencerSizingCalculator';
import { SilencerSizingResult } from '@/lib/silencer-sizing-calculations';
import { FREQUENCY_BANDS } from '@/lib/nc-reference-curves';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DesignWorkflowNextStep } from '@/components/design/DesignWorkflowNextStep';
import { DesignWorkflowProgressBar } from '@/components/design/DesignWorkflowProgressBar';
import { DataFlowSuggestions } from '@/components/design/DataFlowSuggestions';
import { DataFlowImportHandler } from '@/components/design/DataFlowImportHandler';
import { useZoneContext } from '@/hooks/useZoneContext';
import { usePreSaveValidation } from '@/hooks/usePreSaveValidation';
import { PreSaveValidationAlert } from '@/components/design/PreSaveValidationAlert';

export default function SilencerSizingTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projectId: storedProjectId, setContext } = useZoneContext();
  
  const projectId = searchParams.get('project') || storedProjectId;
  
  useEffect(() => {
    if (projectId) {
      setContext(projectId, null, { replace: true });
    }
  }, [projectId, setContext]);
  
  const [sizingResult, setSizingResult] = useState<SilencerSizingResult | null>(null);

  const breadcrumbItems = [
    { label: 'Design Tools', href: '/design' },
    { label: 'Air Distribution', href: '/design' },
    { label: 'Silencer Sizing' },
  ];

  const handleSizingComplete = (result: SilencerSizingResult) => {
    setSizingResult(result);
  };

  // Prepare chart data for insertion loss
  const getInsertionLossChartData = () => {
    if (!sizingResult) return [];
    const lengthFt = sizingResult.recommended.lengthIn / 12;
    const insertionLossPerFt: Record<string, number> = {
      '63': 1.0, '125': 2.5, '250': 5.0, '500': 7.0,
      '1000': 6.5, '2000': 5.0, '4000': 3.5, '8000': 2.0,
    };
    return FREQUENCY_BANDS.map(freq => ({
      frequency: freq,
      insertionLoss: (insertionLossPerFt[freq] || 0) * lengthFt,
    }));
  };

  // Phase 6: Pre-Save Validation
  const { canSave, blockers, warnings } = usePreSaveValidation(projectId, 'silencer-sizing');

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
              <h1 className="text-2xl font-bold text-foreground mt-1">Silencer Sizing Calculator</h1>
              <p className="text-muted-foreground">
                Calculate optimal silencer dimensions based on airflow, pressure, and attenuation requirements
              </p>
            </div>
          </div>
        </div>

        {/* Phase 6: Pre-Save Validation Alert */}
        <PreSaveValidationAlert blockers={blockers} warnings={warnings} />

        {/* Phase 7: DataFlow Import Handler */}
        <DataFlowImportHandler
          projectId={projectId}
          currentTool="silencer-sizing"
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Calculator */}
          <SilencerSizingCalculator 
            onSizingComplete={handleSizingComplete}
          />

          {/* Right: Results Visualization */}
          <div className="space-y-6">
            {/* Dimensions Diagram */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Silencer Dimensions
                </CardTitle>
                <CardDescription>
                  Recommended silencer size based on your inputs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sizingResult ? (
                  <div className="space-y-4">
                    {/* SVG Diagram */}
                    <div className="flex justify-center">
                      <svg viewBox="0 0 300 150" className="w-full max-w-md h-auto">
                        <rect 
                          x="50" y="30" 
                          width="200" height="90" 
                          fill="hsl(var(--muted))" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth="2"
                          rx="4"
                        />
                        {[80, 120, 160, 200].map((x, i) => (
                          <rect
                            key={i}
                            x={x}
                            y="40"
                            width="8"
                            height="70"
                            fill="hsl(var(--primary)/0.3)"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1"
                          />
                        ))}
                        <rect x="20" y="50" width="30" height="50" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
                        <text x="35" y="80" textAnchor="middle" className="text-[10px] fill-muted-foreground">IN</text>
                        <rect x="250" y="50" width="30" height="50" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
                        <text x="265" y="80" textAnchor="middle" className="text-[10px] fill-muted-foreground">OUT</text>
                        <text x="150" y="20" textAnchor="middle" className="text-xs font-medium fill-foreground">
                          L: {sizingResult.recommended.lengthIn}" ({(sizingResult.recommended.lengthIn / 12).toFixed(1)} ft)
                        </text>
                        <text x="150" y="140" textAnchor="middle" className="text-xs font-medium fill-foreground">
                          {sizingResult.recommended.type === 'rectangular' 
                            ? `W: ${sizingResult.recommended.widthIn}" × H: ${sizingResult.recommended.heightIn}"`
                            : `Ø: ${sizingResult.recommended.diameterIn}"`}
                        </text>
                      </svg>
                    </div>

                    {/* Dimension Summary */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">{sizingResult.recommended.lengthIn}"</div>
                        <div className="text-xs text-muted-foreground">Length</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">
                          {sizingResult.recommended.type === 'rectangular' 
                            ? `${sizingResult.recommended.widthIn}"` 
                            : `${sizingResult.recommended.diameterIn}"`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sizingResult.recommended.type === 'rectangular' ? 'Width' : 'Diameter'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">
                          {sizingResult.recommended.type === 'rectangular' 
                            ? `${sizingResult.recommended.heightIn}"` 
                            : `${sizingResult.recommended.freeAreaSqFt.toFixed(1)} ft²`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sizingResult.recommended.type === 'rectangular' ? 'Height' : 'Free Area'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Enter sizing parameters to see recommended dimensions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            {sizingResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-2xl font-bold text-primary">
                        {sizingResult.performance.expectedAttenuationDb.toFixed(0)} dB
                      </div>
                      <div className="text-xs text-muted-foreground">Attenuation</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-2xl font-bold text-primary">
                        {sizingResult.performance.expectedPressureDropIn.toFixed(2)}"
                      </div>
                      <div className="text-xs text-muted-foreground">Pressure Drop (w.g.)</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-2xl font-bold text-primary">
                        NC-{sizingResult.performance.selfNoiseNC}
                      </div>
                      <div className="text-xs text-muted-foreground">Self Noise</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Insertion Loss Chart */}
        {sizingResult && (
          <Card>
            <CardHeader>
              <CardTitle>Octave Band Insertion Loss</CardTitle>
              <CardDescription>
                Attenuation performance across frequency bands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getInsertionLossChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="frequency" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      label={{ value: 'dB', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <ReferenceLine y={sizingResult.performance.expectedAttenuationDb} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
                    <Bar 
                      dataKey="insertionLoss" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Insertion Loss (dB)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA to Silencer Selection */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Find Matching Products</h3>
                <p className="text-sm text-muted-foreground">
                  Browse silencers from manufacturers that match your calculated requirements
                </p>
              </div>
              <Button 
                onClick={() => {
                  const params = new URLSearchParams();
                  if (projectId) params.set('project', projectId);
                  if (sizingResult) {
                    params.set('attenuation', sizingResult.performance.expectedAttenuationDb.toString());
                    params.set('length', sizingResult.recommended.lengthIn.toString());
                  }
                  navigate(`/design/silencer-selection?${params.toString()}`);
                }}
                className="gap-2"
              >
                Browse Silencers
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Navigation */}
        <DesignWorkflowNextStep
          currentPath="/design/silencer-sizing"
          projectId={projectId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
