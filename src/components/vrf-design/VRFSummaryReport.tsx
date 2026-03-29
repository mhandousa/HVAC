import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileDown, 
  Snowflake,
  Thermometer,
  Ruler,
  Activity
} from 'lucide-react';
import { useVRFPipingSizing } from '@/hooks/useVRFPipingSizing';
import { validateVRFSystem, DEFAULT_VRF_LIMITS, type RefrigerantType } from '@/lib/vrf-refrigerant-calculations';
import type { VRFSystem, VRFIndoorUnit, VRFBranchSelector } from '@/hooks/useVRFSystems';

interface VRFSummaryReportProps {
  system: VRFSystem | null;
  units: VRFIndoorUnit[];
  branchSelectors: VRFBranchSelector[];
  onExport?: () => void;
}

export function VRFSummaryReport({
  system,
  units,
  branchSelectors,
  onExport,
}: VRFSummaryReportProps) {
  const { calculateSystemSummary } = useVRFPipingSizing(
    (system?.refrigerant_type as RefrigerantType) || 'R410A'
  );
  
  const summary = useMemo(() => {
    return calculateSystemSummary(system, units);
  }, [system, units, calculateSystemSummary]);
  
  const validationMessages = useMemo(() => {
    if (!system) return [];
    
    return validateVRFSystem({
      outdoorCapacity: system.outdoor_unit_capacity_kw || 0,
      totalIndoorCapacity: summary.totalIndoorCapacity,
      totalPipingLength: summary.totalPipingLength,
      maxElevation: summary.maxElevation,
      indoorUnitCount: units.length,
      firstBranchLength: units.length > 0 
        ? Math.min(...units.map(u => u.liquid_line_length_ft)) 
        : 0,
    });
  }, [system, summary, units]);
  
  const errorCount = validationMessages.filter(m => m.level === 'error').length;
  const warningCount = validationMessages.filter(m => m.level === 'warning').length;
  const isValid = errorCount === 0;
  
  const capacityRatioPercent = summary.capacityRatio * 100;
  const pipingUsagePercent = system 
    ? (summary.totalPipingLength / (system.max_piping_length_ft || 540)) * 100 
    : 0;
  const elevationUsagePercent = system 
    ? (summary.maxElevation / (system.max_elevation_diff_ft || 160)) * 100 
    : 0;
  
  if (!system) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Configure system to view summary
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={isValid ? 'border-green-500/30' : 'border-red-500/30'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {isValid ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">
                {isValid ? 'System Design Valid' : 'Design Issues Found'}
              </h3>
              <p className="text-muted-foreground">
                {errorCount} errors, {warningCount} warnings
              </p>
            </div>
            {onExport && (
              <Button className="ml-auto" variant="outline" onClick={onExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Messages */}
      {validationMessages.length > 0 && (
        <div className="space-y-2">
          {validationMessages.map((msg, i) => (
            <Alert 
              key={i} 
              variant={msg.level === 'error' ? 'destructive' : 'default'}
            >
              {msg.level === 'error' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{msg.level === 'error' ? 'Error' : 'Warning'}</AlertTitle>
              <AlertDescription>{msg.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Snowflake className="h-5 w-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Name</span>
              <span className="font-medium">{system.system_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Tag</span>
              <span>{system.system_tag || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refrigerant</span>
              <Badge variant="outline">{system.refrigerant_type}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Type</span>
              <Badge variant={system.system_type === 'heat_recovery' ? 'secondary' : 'outline'}>
                {system.system_type === 'heat_recovery' ? 'Heat Recovery' : 'Heat Pump'}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outdoor Unit</span>
              <span>{system.outdoor_unit_model || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ODU Capacity</span>
              <span>
                {system.outdoor_unit_capacity_kw?.toFixed(1) || '-'} kW
                ({system.outdoor_unit_capacity_tons?.toFixed(1) || '-'} Tons)
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Thermometer className="h-5 w-5" />
              Capacity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indoor Units</span>
              <span className="font-medium">{units.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch Selectors</span>
              <span>{branchSelectors.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Indoor Capacity</span>
              <span className="font-medium">
                {summary.totalIndoorCapacity.toFixed(1)} kW
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Capacity Ratio</span>
                <span className={
                  capacityRatioPercent > 130 ? 'text-red-500' :
                  capacityRatioPercent < 50 ? 'text-yellow-500' : 'text-green-500'
                }>
                  {capacityRatioPercent.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={Math.min(capacityRatioPercent, 130)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 50% - 130%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Piping Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ruler className="h-5 w-5" />
            Piping Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Piping Length</span>
                  <span>
                    {summary.totalPipingLength.toFixed(0)} / {system.max_piping_length_ft || 540} ft
                  </span>
                </div>
                <Progress 
                  value={Math.min(pipingUsagePercent, 100)} 
                  className={`h-2 ${pipingUsagePercent > 90 ? 'bg-yellow-500' : ''}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Elevation</span>
                  <span>
                    {summary.maxElevation.toFixed(0)} / {system.max_elevation_diff_ft || 160} ft
                  </span>
                </div>
                <Progress 
                  value={Math.min(elevationUsagePercent, 100)} 
                  className={`h-2 ${elevationUsagePercent > 90 ? 'bg-yellow-500' : ''}`}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oil Return Status</span>
                {summary.allUnitsOilReturnOk ? (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Needs Review
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={system.status === 'approved' ? 'default' : 'secondary'}>
                  {system.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revision</span>
                <span>{system.revision}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Indoor Units Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Indoor Units by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(
              units.reduce((acc, u) => {
                acc[u.unit_type] = (acc[u.unit_type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-lg border p-3">
                <span className="capitalize">{type.replace('_', ' ')}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
