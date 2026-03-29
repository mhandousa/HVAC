import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Volume2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  FileEdit,
} from 'lucide-react';
import { CommissioningChecklist, CommissioningTest } from '@/hooks/useCommissioning';
import { NCMeasurementDialog } from './NCMeasurementDialog';
import { cn } from '@/lib/utils';

interface AcousticChecklistCardProps {
  checklist: CommissioningChecklist;
  tests: CommissioningTest[];
  onUpdateChecklist: (data: { id: string; overall_status: string }) => void;
  onAddTest: (data: any) => void;
}

interface AcousticDesignData {
  zone_id?: string;
  zone_name?: string;
  floor_name?: string;
  space_type?: string;
  target_nc?: number;
  estimated_nc?: number | null;
  terminal_units?: {
    unit_tag: string;
    unit_type: string;
    design_nc: number | null;
  }[];
  recommendations?: string[];
}

interface AcousticInstalledData {
  measured_nc?: number;
  measurement_date?: string;
  measurement_positions?: {
    position: string;
    nc_reading: number;
  }[];
  ambient_conditions?: {
    hvac_mode?: string;
    occupancy?: string;
    background_nc?: number;
  };
  technician_notes?: string;
}

export function AcousticChecklistCard({
  checklist,
  tests,
  onUpdateChecklist,
  onAddTest,
}: AcousticChecklistCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMeasurementDialog, setShowMeasurementDialog] = useState(false);

  const designData = checklist.design_data as AcousticDesignData | null;
  const installedData = checklist.installed_data as AcousticInstalledData | null;

  const targetNC = designData?.target_nc ?? 40;
  const estimatedNC = designData?.estimated_nc;
  const measuredNC = installedData?.measured_nc;
  const terminalUnits = designData?.terminal_units ?? [];
  const spaceType = designData?.space_type ?? 'Office';

  // Calculate NC delta for measured value
  const ncDelta = measuredNC !== undefined ? measuredNC - targetNC : null;

  // Determine verification status
  const getVerificationStatus = (): 'pass' | 'marginal' | 'fail' | 'pending' => {
    if (measuredNC === undefined) return 'pending';
    if (ncDelta === null) return 'pending';
    if (ncDelta <= 0) return 'pass';
    if (ncDelta <= 5) return 'marginal';
    return 'fail';
  };

  const verificationStatus = getVerificationStatus();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pass':
      case 'passed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle2,
          label: 'Verified',
        };
      case 'fail':
      case 'failed':
        return {
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: AlertTriangle,
          label: 'Exceeds Target',
        };
      case 'marginal':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          label: 'Marginal',
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground border-muted',
          icon: Clock,
          label: 'Pending',
        };
    }
  };

  const statusConfig = getStatusConfig(verificationStatus);
  const StatusIcon = statusConfig.icon;

  // Test completion
  const completedTests = tests.filter(t => t.result !== 'pending').length;
  const totalTests = tests.length;
  const completionPercent = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

  const handleMeasurementSave = (data: AcousticInstalledData) => {
    // Create a test entry for the measurement
    onAddTest({
      test_name: 'NC Measurement - Room Center',
      test_category: 'performance',
      expected_value: targetNC.toString(),
      actual_value: data.measured_nc?.toString(),
      tolerance_percent: 5,
      result: data.measured_nc !== undefined && (data.measured_nc - targetNC) <= 5 ? 'pass' : 'fail',
      notes: data.technician_notes,
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {checklist.equipment_tag}
                    <Badge variant="outline" className="text-xs">
                      {spaceType}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {designData?.floor_name && `${designData.floor_name} • `}
                    Target NC-{targetNC}
                  </p>
                </div>
              </div>
              <Badge className={cn('border', statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            {/* NC Comparison */}
            <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Design Target</p>
                <p className="text-2xl font-bold">NC-{targetNC}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Estimated</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {estimatedNC !== null && estimatedNC !== undefined ? `NC-${estimatedNC}` : '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Measured</p>
                <p className={cn(
                  'text-2xl font-bold',
                  ncDelta !== null && ncDelta > 5 && 'text-destructive',
                  ncDelta !== null && ncDelta > 0 && ncDelta <= 5 && 'text-yellow-600',
                  ncDelta !== null && ncDelta <= 0 && 'text-green-600'
                )}>
                  {measuredNC !== undefined ? `NC-${measuredNC}` : '—'}
                </p>
                {ncDelta !== null && (
                  <p className={cn(
                    'text-xs font-medium',
                    ncDelta > 0 ? 'text-destructive' : 'text-green-600'
                  )}>
                    {ncDelta > 0 ? '+' : ''}{ncDelta} dB
                  </p>
                )}
              </div>
            </div>

            {/* Test Progress */}
            {totalTests > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Tests Completed</span>
                  <span className="font-medium">{completedTests}/{totalTests}</span>
                </div>
                <Progress value={completionPercent} className="h-2" />
              </div>
            )}

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full mt-2">
                {isOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Separator />

              {/* Terminal Units */}
              {terminalUnits.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Terminal Units</h4>
                  <div className="space-y-2">
                    {terminalUnits.map((unit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {unit.unit_type?.toUpperCase()}
                          </Badge>
                          <span>{unit.unit_tag}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {unit.design_nc !== null ? `NC-${unit.design_nc}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Measurement Positions */}
              {installedData?.measurement_positions && installedData.measurement_positions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Measurement Positions</h4>
                  <div className="space-y-2">
                    {installedData.measurement_positions.map((pos, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm"
                      >
                        <span>{pos.position}</span>
                        <span className="font-medium">NC-{pos.nc_reading}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {designData?.recommendations && designData.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">Design Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {designData.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowMeasurementDialog(true)}
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  Enter NC Measurements
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddTest({
                    test_name: 'New Acoustic Test',
                    test_category: 'performance',
                    expected_value: targetNC.toString(),
                    result: 'pending',
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <NCMeasurementDialog
        open={showMeasurementDialog}
        onOpenChange={setShowMeasurementDialog}
        targetNC={targetNC}
        zoneName={checklist.equipment_tag || 'Zone'}
        onSave={handleMeasurementSave}
      />
    </>
  );
}
