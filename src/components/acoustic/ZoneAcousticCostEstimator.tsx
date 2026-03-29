import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Volume2,
  Layers,
  Activity,
  Clock,
  TrendingDown,
  FileDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import {
  generateDetailedZoneEstimate,
  formatCurrencySAR,
  DetailedZoneEstimate,
  TreatmentCategory,
} from '@/lib/acoustic-cost-calculations';

interface ZoneAcousticCostEstimatorProps {
  zones: ZoneAcousticData[];
  selectedZoneId?: string;
  onZoneChange?: (zoneId: string) => void;
  onExport?: (estimate: DetailedZoneEstimate) => void;
  defaultDuctSize?: number;
}

const CATEGORY_ICONS: Record<TreatmentCategory, React.ElementType> = {
  silencer: Volume2,
  lining: Layers,
  isolator: Activity,
  panel: Layers,
};

const CATEGORY_COLORS: Record<TreatmentCategory, string> = {
  silencer: 'text-blue-600 bg-blue-500/10 border-blue-500/30',
  lining: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
  isolator: 'text-purple-600 bg-purple-500/10 border-purple-500/30',
  panel: 'text-green-600 bg-green-500/10 border-green-500/30',
};

export function ZoneAcousticCostEstimator({
  zones,
  selectedZoneId,
  onZoneChange,
  onExport,
  defaultDuctSize = 12,
}: ZoneAcousticCostEstimatorProps) {
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId || '');
  const [ductSize, setDuctSize] = useState<number>(defaultDuctSize);
  const [includeVibration, setIncludeVibration] = useState(false);
  const [contingencyPercent, setContingencyPercent] = useState(15);

  // Filter zones that need treatment
  const treatableZones = useMemo(() => {
    return zones.filter(z => z.status === 'exceeds' || z.status === 'marginal');
  }, [zones]);

  const selectedZone = useMemo(() => {
    return zones.find(z => z.zoneId === activeZoneId);
  }, [zones, activeZoneId]);

  // Generate detailed estimate for selected zone
  const estimate = useMemo<DetailedZoneEstimate | null>(() => {
    if (!selectedZone || selectedZone.ncDelta <= 0) return null;

    return generateDetailedZoneEstimate(
      selectedZone.zoneId,
      selectedZone.zoneName,
      selectedZone.spaceType,
      selectedZone.targetNC,
      selectedZone.estimatedNC || selectedZone.targetNC,
      selectedZone.ncDelta,
      ductSize,
      includeVibration
    );
  }, [selectedZone, ductSize, includeVibration]);

  const handleZoneChange = (zoneId: string) => {
    setActiveZoneId(zoneId);
    onZoneChange?.(zoneId);
  };

  const handleExport = () => {
    if (estimate && onExport) {
      onExport(estimate);
    }
  };

  // Calculate adjusted total with custom contingency
  const adjustedTotal = useMemo(() => {
    if (!estimate) return 0;
    const subtotal = estimate.costBreakdown.subtotalMaterial + estimate.costBreakdown.subtotalLabor;
    return subtotal * (1 + contingencyPercent / 100);
  }, [estimate, contingencyPercent]);

  const totalLaborHours = useMemo(() => {
    if (!estimate) return 0;
    return estimate.treatments.reduce((sum, t) => sum + t.laborHours, 0);
  }, [estimate]);

  return (
    <div className="space-y-4">
      {/* Zone Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Zone Treatment Cost Estimate
          </CardTitle>
          <CardDescription>
            Detailed material and labor costs for acoustic remediation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Zone</Label>
              <Select value={activeZoneId} onValueChange={handleZoneChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a zone..." />
                </SelectTrigger>
                <SelectContent>
                  {treatableZones.length === 0 ? (
                    <SelectItem value="" disabled>No zones need treatment</SelectItem>
                  ) : (
                    treatableZones.map(zone => (
                      <SelectItem key={zone.zoneId} value={zone.zoneId}>
                        {zone.zoneName} (+{zone.ncDelta} dB)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Main Duct Size (inches)</Label>
              <Input
                type="number"
                min={6}
                max={48}
                value={ductSize}
                onChange={(e) => setDuctSize(parseInt(e.target.value) || 12)}
              />
            </div>
          </div>

          {selectedZone && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">{selectedZone.zoneName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedZone.spaceType} • Target: NC-{selectedZone.targetNC}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={selectedZone.status === 'exceeds' ? 'destructive' : 'secondary'}>
                  +{selectedZone.ncDelta} dB
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Est. NC-{selectedZone.estimatedNC || '?'}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="vibration"
              checked={includeVibration}
              onCheckedChange={(checked) => setIncludeVibration(checked === true)}
            />
            <Label htmlFor="vibration" className="text-sm">
              Include vibration isolation for nearby equipment
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Breakdown */}
      {estimate && estimate.treatments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recommended Treatments</CardTitle>
            <CardDescription>
              Expected NC reduction: {estimate.expectedNCReduction} dB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {estimate.treatments.map((treatment, idx) => {
              const Icon = CATEGORY_ICONS[treatment.category];
              const colorClass = CATEGORY_COLORS[treatment.category];

              return (
                <div
                  key={idx}
                  className={cn('p-4 rounded-lg border', colorClass)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{treatment.item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {treatment.quantity} {treatment.item.unit}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatCurrencySAR(treatment.totalCost)}
                    </p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {treatment.rationale}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Material: {formatCurrencySAR(treatment.materialCost)}</span>
                    <span>Labor: {formatCurrencySAR(treatment.laborCost)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {treatment.laborHours.toFixed(1)} hrs
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Expected Outcome */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Expected Result</p>
                  <p className="text-xs text-muted-foreground">
                    After treatment installation
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-700">NC-{estimate.estimatedFinalNC}</p>
                <p className="text-xs text-muted-foreground">
                  from NC-{estimate.estimatedNC}
                </p>
              </div>
            </div>

            {/* Compliance Status */}
            {estimate.estimatedFinalNC <= estimate.targetNC ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Estimated to meet NC-{estimate.targetNC} target after treatment</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>May require additional treatments to meet NC-{estimate.targetNC} target</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cost Summary */}
      {estimate && estimate.treatments.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Cost Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Material Costs</p>
                <p className="text-lg font-semibold">
                  {formatCurrencySAR(estimate.costBreakdown.subtotalMaterial)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Labor Costs</p>
                <p className="text-lg font-semibold">
                  {formatCurrencySAR(estimate.costBreakdown.subtotalLabor)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Labor Hours</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {totalLaborHours.toFixed(1)} hrs
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="contingency" className="text-sm">Contingency:</Label>
                <Input
                  id="contingency"
                  type="number"
                  min={0}
                  max={50}
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="font-medium">
                {formatCurrencySAR(adjustedTotal - (estimate.costBreakdown.subtotalMaterial + estimate.costBreakdown.subtotalLabor))}
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">Grand Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrencySAR(adjustedTotal)}
              </p>
            </div>

            <Button onClick={handleExport} className="w-full" disabled={!onExport}>
              <FileDown className="h-4 w-4 mr-2" />
              Export Estimate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!selectedZone || (estimate && estimate.treatments.length === 0)) && activeZoneId && (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-600 mb-3" />
            <p className="font-medium">No treatments required</p>
            <p className="text-sm text-muted-foreground">
              This zone meets or is close to its NC target
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
