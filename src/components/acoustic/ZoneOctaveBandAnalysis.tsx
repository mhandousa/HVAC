import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Volume2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileText,
  Wrench,
} from 'lucide-react';
import { OctaveBandChart } from './OctaveBandChart';
import {
  OctaveBandData,
  OCTAVE_BAND_FREQUENCIES,
  calculateNCFromOctaveBands,
  getExceedingFrequencies,
  getFrequencyComplianceStatus,
  calculateRequiredAttenuation,
  interpolateNCCurve,
} from '@/lib/nc-reference-curves';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';

interface ZoneOctaveBandAnalysisProps {
  zone: ZoneAcousticData;
  octaveBandData?: OctaveBandData | null;
  onOpenRemediation?: () => void;
  onGenerateReport?: () => void;
}

export function ZoneOctaveBandAnalysis({
  zone,
  octaveBandData,
  onOpenRemediation,
  onGenerateReport,
}: ZoneOctaveBandAnalysisProps) {
  const [activeTab, setActiveTab] = useState('chart');

  // Generate simulated octave band data if not provided
  // In production, this would come from actual measurements
  const measured: OctaveBandData | null = octaveBandData || 
    (zone.estimatedNC !== null ? generateEstimatedOctaveBands(zone.estimatedNC) : null);

  const targetCurve = interpolateNCCurve(zone.targetNC);
  const measuredNC = measured ? calculateNCFromOctaveBands(measured) : zone.estimatedNC;
  const exceedingFrequencies = measured
    ? getExceedingFrequencies(measured, zone.targetNC)
    : [];
  const complianceStatus = measured
    ? getFrequencyComplianceStatus(measured, zone.targetNC)
    : null;
  const requiredAttenuation = measured
    ? calculateRequiredAttenuation(measured, zone.targetNC)
    : null;

  const isCompliant = measuredNC !== null && measuredNC <= zone.targetNC;
  const worstExceedance = exceedingFrequencies.length > 0
    ? Math.max(...exceedingFrequencies.map((f) => f.delta))
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              {zone.zoneName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{zone.spaceType}</Badge>
              <Badge variant={isCompliant ? 'default' : 'destructive'}>
                {isCompliant ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {measuredNC !== null ? `NC-${measuredNC}` : 'No Data'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">Target NC</div>
              <div className="text-2xl font-bold">NC-{zone.targetNC}</div>
            </div>
            <div
              className={`text-center p-3 rounded-lg ${
                isCompliant ? 'bg-green-500/10' : 'bg-destructive/10'
              }`}
            >
              <div className="text-sm text-muted-foreground">Measured NC</div>
              <div
                className={`text-2xl font-bold ${
                  isCompliant ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {measuredNC !== null ? `NC-${measuredNC}` : '—'}
              </div>
            </div>
            <div
              className={`text-center p-3 rounded-lg ${
                zone.ncDelta <= 0
                  ? 'bg-green-500/10'
                  : zone.ncDelta <= 3
                  ? 'bg-amber-500/10'
                  : 'bg-destructive/10'
              }`}
            >
              <div className="text-sm text-muted-foreground">Delta</div>
              <div
                className={`text-2xl font-bold ${
                  zone.ncDelta <= 0
                    ? 'text-green-600'
                    : zone.ncDelta <= 3
                    ? 'text-amber-500'
                    : 'text-destructive'
                }`}
              >
                {zone.ncDelta > 0 ? '+' : ''}{zone.ncDelta} dB
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <div className="text-sm text-muted-foreground">Frequencies Exceeding</div>
              <div className="text-2xl font-bold">
                {exceedingFrequencies.length} / 8
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">Octave Band Chart</TabsTrigger>
          <TabsTrigger value="data">Frequency Data</TabsTrigger>
          <TabsTrigger value="attenuation">Required Attenuation</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-4">
          <OctaveBandChart
            measured={measured}
            targetNC={zone.targetNC}
            zoneName={zone.zoneName}
            height={400}
          />
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frequency Band Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Frequency</th>
                      <th className="text-right py-2 px-3">Target (dB)</th>
                      <th className="text-right py-2 px-3">Measured (dB)</th>
                      <th className="text-right py-2 px-3">Delta</th>
                      <th className="text-center py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OCTAVE_BAND_FREQUENCIES.map((freq) => {
                      const targetVal = targetCurve[freq];
                      const measuredVal = measured?.[freq];
                      const delta = measuredVal !== undefined ? measuredVal - targetVal : null;
                      const status = complianceStatus?.[freq];

                      return (
                        <tr key={freq} className="border-b hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium">{freq}</td>
                          <td className="text-right py-2 px-3">{targetVal.toFixed(1)}</td>
                          <td className="text-right py-2 px-3">
                            {measuredVal !== undefined ? measuredVal.toFixed(1) : '—'}
                          </td>
                          <td
                            className={`text-right py-2 px-3 font-medium ${
                              delta === null
                                ? ''
                                : delta > 3
                                ? 'text-destructive'
                                : delta > 0
                                ? 'text-amber-500'
                                : 'text-green-600'
                            }`}
                          >
                            {delta !== null
                              ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
                              : '—'}
                          </td>
                          <td className="text-center py-2 px-3">
                            {status === 'compliant' && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                Pass
                              </Badge>
                            )}
                            {status === 'marginal' && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                Marginal
                              </Badge>
                            )}
                            {status === 'exceeds' && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                                Fail
                              </Badge>
                            )}
                            {!status && (
                              <Badge variant="outline">N/A</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attenuation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Attenuation by Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              {requiredAttenuation ? (
                <>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {OCTAVE_BAND_FREQUENCIES.map((freq) => {
                      const attn = requiredAttenuation[freq];
                      const needsAttenuation = attn > 0;

                      return (
                        <div
                          key={freq}
                          className={`p-3 rounded-lg text-center ${
                            needsAttenuation ? 'bg-amber-500/10' : 'bg-green-500/10'
                          }`}
                        >
                          <div className="text-sm text-muted-foreground">{freq}</div>
                          <div
                            className={`text-xl font-bold ${
                              needsAttenuation ? 'text-amber-600' : 'text-green-600'
                            }`}
                          >
                            {needsAttenuation ? `${attn.toFixed(0)} dB` : '✓'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Maximum attenuation needed
                      </div>
                      <div className="text-lg font-semibold">
                        {Math.max(...Object.values(requiredAttenuation)).toFixed(0)} dB
                      </div>
                    </div>
                    {onOpenRemediation && (
                      <Button onClick={onOpenRemediation}>
                        <Wrench className="h-4 w-4 mr-2" />
                        View Remediation Options
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No measurement data available to calculate required attenuation.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onGenerateReport && (
          <Button variant="outline" onClick={onGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper function to generate estimated octave band data from NC value
function generateEstimatedOctaveBands(ncValue: number): OctaveBandData {
  // Add some realistic variation to simulate actual measurements
  const baseCurve = interpolateNCCurve(ncValue);
  const variation = [-2, -1, 0, 1, 2, 1, 0, -1];

  return {
    '63Hz': baseCurve['63Hz'] + variation[0] + Math.random() * 2,
    '125Hz': baseCurve['125Hz'] + variation[1] + Math.random() * 2,
    '250Hz': baseCurve['250Hz'] + variation[2] + Math.random() * 2,
    '500Hz': baseCurve['500Hz'] + variation[3] + Math.random() * 2,
    '1kHz': baseCurve['1kHz'] + variation[4] + Math.random() * 2,
    '2kHz': baseCurve['2kHz'] + variation[5] + Math.random() * 2,
    '4kHz': baseCurve['4kHz'] + variation[6] + Math.random() * 2,
    '8kHz': baseCurve['8kHz'] + variation[7] + Math.random() * 2,
  };
}
