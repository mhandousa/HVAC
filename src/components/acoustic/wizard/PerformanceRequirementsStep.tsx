import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Activity, Building2 } from 'lucide-react';
import { PerformanceRequirements } from '@/lib/treatment-package-optimizer';

interface PerformanceRequirementsStepProps {
  requirements: PerformanceRequirements;
  onRequirementsChange: (requirements: PerformanceRequirements) => void;
  selectionSummary: {
    zonesSelected: number;
    avgNCReduction: number;
  };
}

export function PerformanceRequirementsStep({
  requirements,
  onRequirementsChange,
  selectionSummary,
}: PerformanceRequirementsStepProps) {
  const handleTargetNCDeltaChange = (value: number[]) => {
    onRequirementsChange({ ...requirements, targetNCDelta: value[0] });
  };

  const handleMinimumComplianceChange = (value: number[]) => {
    onRequirementsChange({ ...requirements, minimumCompliance: value[0] });
  };

  const handleSensitivePriorityChange = (checked: boolean) => {
    onRequirementsChange({ ...requirements, sensitiveSpacesPriority: checked });
  };

  const handleVibrationChange = (checked: boolean) => {
    onRequirementsChange({ ...requirements, includeVibrationTreatment: checked });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Performance Requirements</h3>
        <p className="text-sm text-muted-foreground">
          Define your target performance levels and priorities for the treatment package.
        </p>
      </div>

      {/* Target NC Reduction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Minimum NC Delta to Address
          </CardTitle>
          <CardDescription>
            Only include zones that exceed the target by at least this amount
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{requirements.targetNCDelta}</span>
              <span className="text-muted-foreground">dB over target</span>
            </div>
            <Slider
              value={[requirements.targetNCDelta]}
              min={0}
              max={15}
              step={1}
              onValueChange={handleTargetNCDeltaChange}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 dB (All zones)</span>
              <span>5 dB (Moderate)</span>
              <span>10+ dB (Severe only)</span>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              Your selected zones have an average NC delta of <strong>{selectionSummary.avgNCReduction} dB</strong>.
              {requirements.targetNCDelta > selectionSummary.avgNCReduction && (
                <span className="text-amber-600"> Some zones may be excluded.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Minimum Compliance Target */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Minimum Compliance Target
          </CardTitle>
          <CardDescription>
            Percentage of zones that should meet NC requirements after treatment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{requirements.minimumCompliance}%</span>
              <span className="text-muted-foreground">zones compliant</span>
            </div>
            <Slider
              value={[requirements.minimumCompliance]}
              min={50}
              max={100}
              step={5}
              onValueChange={handleMinimumComplianceChange}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% (Partial)</span>
              <span>80% (Good)</span>
              <span>100% (Full)</span>
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              With {selectionSummary.zonesSelected} selected zones, this means at least{' '}
              <strong>{Math.ceil(selectionSummary.zonesSelected * requirements.minimumCompliance / 100)}</strong>{' '}
              zones should be fully compliant after treatment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Priority Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Space Type Priority
          </CardTitle>
          <CardDescription>
            Prioritize treatment for noise-sensitive spaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="sensitive" className="font-medium">Sensitive Spaces First</Label>
              <p className="text-xs text-muted-foreground">
                Prioritize offices, conference rooms, and other noise-critical spaces
              </p>
            </div>
            <Switch
              id="sensitive"
              checked={requirements.sensitiveSpacesPriority}
              onCheckedChange={handleSensitivePriorityChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vibration Treatment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Vibration Treatment
          </CardTitle>
          <CardDescription>
            Include vibration isolation for equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="vibration" className="font-medium">Include Vibration Isolation</Label>
              <p className="text-xs text-muted-foreground">
                Add spring isolators for FCUs and other equipment
              </p>
            </div>
            <Switch
              id="vibration"
              checked={requirements.includeVibrationTreatment}
              onCheckedChange={handleVibrationChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
