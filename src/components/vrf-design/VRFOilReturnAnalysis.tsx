import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Info, Droplets } from 'lucide-react';
import { REFRIGERANT_PROPERTIES, type RefrigerantType } from '@/lib/vrf-refrigerant-calculations';
import type { VRFIndoorUnit } from '@/hooks/useVRFSystems';

interface VRFOilReturnAnalysisProps {
  units: VRFIndoorUnit[];
  refrigerant: RefrigerantType;
}

interface RiserAnalysis {
  unitId: string;
  unitTag: string;
  elevationFt: number;
  isAbove: boolean;
  suctionVelocity: number | null;
  requiredVelocity: number;
  percentOfRequired: number;
  status: 'ok' | 'warning' | 'critical';
  recommendation?: string;
}

export function VRFOilReturnAnalysis({ units, refrigerant }: VRFOilReturnAnalysisProps) {
  const props = REFRIGERANT_PROPERTIES[refrigerant];
  const minRiserVelocity = props.minOilReturnVelocity_fpm.riser;
  const minHorizontalVelocity = props.minOilReturnVelocity_fpm.horizontal;
  
  const riserAnalysis = useMemo((): RiserAnalysis[] => {
    return units
      .filter(u => Math.abs(u.elevation_from_outdoor_ft) > 3) // Only analyze significant risers
      .map(unit => {
        const velocity = unit.suction_velocity_fps ? unit.suction_velocity_fps * 60 : null;
        const requiredVelocity = minRiserVelocity;
        const percentOfRequired = velocity ? (velocity / requiredVelocity) * 100 : 0;
        
        let status: 'ok' | 'warning' | 'critical' = 'ok';
        let recommendation: string | undefined;
        
        if (velocity === null) {
          status = 'warning';
          recommendation = 'Calculate pipe sizes to verify oil return';
        } else if (percentOfRequired < 75) {
          status = 'critical';
          recommendation = 'Consider double riser configuration or smaller pipe size';
        } else if (percentOfRequired < 100) {
          status = 'warning';
          recommendation = 'Marginal oil return - verify at part load conditions';
        }
        
        return {
          unitId: unit.id,
          unitTag: unit.unit_tag,
          elevationFt: Math.abs(unit.elevation_from_outdoor_ft),
          isAbove: unit.is_above_outdoor,
          suctionVelocity: velocity,
          requiredVelocity,
          percentOfRequired,
          status,
          recommendation,
        };
      })
      .sort((a, b) => b.elevationFt - a.elevationFt);
  }, [units, minRiserVelocity]);
  
  const summary = useMemo(() => {
    const criticalCount = riserAnalysis.filter(r => r.status === 'critical').length;
    const warningCount = riserAnalysis.filter(r => r.status === 'warning').length;
    const okCount = riserAnalysis.filter(r => r.status === 'ok').length;
    const totalRisers = riserAnalysis.length;
    
    return { criticalCount, warningCount, okCount, totalRisers };
  }, [riserAnalysis]);
  
  const getStatusColor = (status: 'ok' | 'warning' | 'critical') => {
    switch (status) {
      case 'ok': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
    }
  };
  
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Droplets className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Oil Return Verification
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Proper oil return requires minimum refrigerant velocities in suction lines, 
                especially in vertical risers. For {refrigerant}, the minimum riser velocity 
                is <strong>{minRiserVelocity} fpm</strong> and horizontal velocity 
                is <strong>{minHorizontalVelocity} fpm</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{summary.totalRisers}</div>
            <div className="text-sm text-muted-foreground">Risers Analyzed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{summary.okCount}</div>
            <div className="text-sm text-muted-foreground">Verified OK</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{summary.warningCount}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{summary.criticalCount}</div>
            <div className="text-sm text-muted-foreground">Critical Issues</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Critical Alerts */}
      {summary.criticalCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Oil Return Issues Detected</AlertTitle>
          <AlertDescription>
            {summary.criticalCount} unit(s) have insufficient suction velocity for reliable oil return.
            This can lead to compressor failure due to oil starvation.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Riser Analysis */}
      {riserAnalysis.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
            <p>No significant vertical risers detected</p>
            <p className="text-sm mt-1">All indoor units are within 3 ft elevation of the outdoor unit</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Riser Oil Return Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riserAnalysis.map((riser) => (
              <div
                key={riser.unitId}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{riser.unitTag}</span>
                    <Badge variant="outline">
                      {riser.isAbove ? '↑' : '↓'} {riser.elevationFt.toFixed(0)} ft
                    </Badge>
                  </div>
                  <div className={getStatusColor(riser.status)}>
                    {riser.status === 'ok' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : riser.status === 'warning' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Suction Velocity</span>
                    <span>
                      {riser.suctionVelocity !== null 
                        ? `${riser.suctionVelocity.toFixed(0)} fpm`
                        : 'Not calculated'
                      }
                      <span className="text-muted-foreground ml-1">
                        / {riser.requiredVelocity} fpm required
                      </span>
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(riser.percentOfRequired, 100)} 
                    className={`h-2 ${getProgressColor(riser.percentOfRequired)}`}
                  />
                </div>
                
                {riser.recommendation && (
                  <p className={`text-sm ${getStatusColor(riser.status)}`}>
                    {riser.recommendation}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Best Practices */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Oil Return Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Install P-traps at the base of risers every 30 ft for risers above 30 ft</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Use double risers with check valves for capacity modulation &gt;50%</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Ensure horizontal runs have slight slope (1/2" per 10 ft) toward compressor</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Consider oil separator for very long piping runs or multiple risers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
