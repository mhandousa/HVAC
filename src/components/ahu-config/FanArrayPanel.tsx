import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Fan, Calculator, CheckCircle, XCircle } from 'lucide-react';
import { calculateFanPower, checkASHRAE901FanPower, type FanConfig } from '@/lib/ahu-calculations';

interface FanArrayPanelProps {
  designCfm: number;
  designStaticPressureIn: number;
  supplyFan: FanConfig | null;
  returnFan: FanConfig | null;
  reliefFan: FanConfig | null;
  onSupplyFanChange: (config: FanConfig | null) => void;
  onReturnFanChange: (config: FanConfig | null) => void;
  onReliefFanChange: (config: FanConfig | null) => void;
}

function FanConfigCard({
  title,
  description,
  icon: Icon,
  iconColor,
  fan,
  designCfm,
  designStaticIn,
  enabled,
  onEnabledChange,
  onChange,
  showStaticInput = false,
}: {
  title: string;
  description: string;
  icon: typeof Fan;
  iconColor: string;
  fan: FanConfig | null;
  designCfm: number;
  designStaticIn: number;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (config: FanConfig | null) => void;
  showStaticInput?: boolean;
}) {
  const effectiveStatic = fan?.designStaticIn || designStaticIn;
  const effectiveCfm = fan?.designCfm || designCfm;

  // Calculate fan power
  const fanCalc = fan && effectiveCfm > 0 ? calculateFanPower({
    cfm: effectiveCfm,
    staticPressureIn: effectiveStatic,
    fanEfficiency: fan.fanType === 'airfoil' ? 0.75 : fan.fanType === 'plenum' ? 0.65 : 0.60,
    motorEfficiency: fan.motorType === 'premium_efficiency' ? 0.94 : 0.90,
    driveType: 'direct',
  }) : null;

  // Check ASHRAE 90.1 compliance
  const compliance = fanCalc ? checkASHRAE901FanPower({
    bhp: fanCalc.bhp,
    cfm: effectiveCfm,
    staticPressureIn: effectiveStatic,
  }) : null;

  const updateFan = (updates: Partial<FanConfig>) => {
    if (fan) {
      onChange({ ...fan, ...updates });
    }
  };

  // Initialize defaults when enabled
  useEffect(() => {
    if (enabled && !fan) {
      onChange({
        fanType: 'plenum',
        arrangement: 'single',
        redundancy: 'n',
        motorType: 'premium_efficiency',
        hasVfd: true,
        designCfm: designCfm,
        designStaticIn: designStaticIn,
      });
    } else if (!enabled) {
      onChange(null);
    }
  }, [enabled]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {enabled && fan && (
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fan Type</Label>
              <Select
                value={fan.fanType}
                onValueChange={(v) => updateFan({ fanType: v as FanConfig['fanType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plenum">Plenum (Plug)</SelectItem>
                  <SelectItem value="airfoil">Airfoil Centrifugal</SelectItem>
                  <SelectItem value="fc_centrifugal">FC Centrifugal</SelectItem>
                  <SelectItem value="vaneaxial">Vaneaxial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arrangement</Label>
              <Select
                value={fan.arrangement}
                onValueChange={(v) => updateFan({ arrangement: v as FanConfig['arrangement'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Fan</SelectItem>
                  <SelectItem value="parallel_2">2× Parallel Array</SelectItem>
                  <SelectItem value="parallel_3">3× Parallel Array</SelectItem>
                  <SelectItem value="parallel_4">4× Parallel Array</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Redundancy</Label>
              <Select
                value={fan.redundancy}
                onValueChange={(v) => updateFan({ redundancy: v as FanConfig['redundancy'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="n">N (No Redundancy)</SelectItem>
                  <SelectItem value="n_plus_1">N+1 Standby</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motor Type</Label>
              <Select
                value={fan.motorType}
                onValueChange={(v) => updateFan({ motorType: v as FanConfig['motorType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium_efficiency">Premium Efficiency</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id={`${title}-vfd`}
                checked={fan.hasVfd}
                onCheckedChange={(checked) => updateFan({ hasVfd: checked })}
              />
              <Label htmlFor={`${title}-vfd`}>Variable Frequency Drive (VFD)</Label>
            </div>

            {fan.hasVfd && (
              <div className="space-y-2">
                <Label>VFD Brand (Optional)</Label>
                <Input
                  value={fan.vfdBrand || ''}
                  onChange={(e) => updateFan({ vfdBrand: e.target.value })}
                  placeholder="ABB, Danfoss, etc."
                />
              </div>
            )}

            {showStaticInput && (
              <div className="space-y-2">
                <Label>Design Static (in. w.g.)</Label>
                <Input
                  type="number"
                  step={0.1}
                  value={fan.designStaticIn || ''}
                  onChange={(e) => updateFan({ designStaticIn: Number(e.target.value) })}
                  placeholder={String(designStaticIn)}
                />
              </div>
            )}
          </div>

          {/* Calculated Results */}
          {fanCalc && (
            <>
              <Separator />
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="font-medium">Calculated Performance</span>
                  </div>
                  {compliance && (
                    <Badge 
                      variant={compliance.compliant ? 'outline' : 'destructive'}
                      className={compliance.compliant ? 'bg-green-500/10 text-green-700 border-green-200' : ''}
                    >
                      {compliance.compliant ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> ASHRAE 90.1 Compliant</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Exceeds 90.1 Limit</>
                      )}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">BHP</p>
                    <p className="font-semibold">{fanCalc.bhp}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Motor HP</p>
                    <p className="font-semibold">{fanCalc.motorHp}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fan Efficiency</p>
                    <p className="font-semibold">{(fanCalc.fanEfficiency * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Est. RPM</p>
                    <p className="font-semibold">{fanCalc.estimatedRpm}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annual Energy</p>
                    <p className="font-semibold">{fanCalc.annualEnergyKwh.toLocaleString()} kWh</p>
                  </div>
                </div>
                {compliance && !compliance.compliant && (
                  <p className="text-xs text-destructive mt-2">
                    Actual: {compliance.actualWPerCfm} W/CFM | Limit: {compliance.limitWPerCfm} W/CFM
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function FanArrayPanel({
  designCfm,
  designStaticPressureIn,
  supplyFan,
  returnFan,
  reliefFan,
  onSupplyFanChange,
  onReturnFanChange,
  onReliefFanChange,
}: FanArrayPanelProps) {
  const [hasSupplyFan, setHasSupplyFan] = useState(true);
  const [hasReturnFan, setHasReturnFan] = useState(!!returnFan);
  const [hasReliefFan, setHasReliefFan] = useState(!!reliefFan);

  // Supply fan is always enabled by default
  useEffect(() => {
    if (!supplyFan) {
      onSupplyFanChange({
        fanType: 'plenum',
        arrangement: 'single',
        redundancy: 'n',
        motorType: 'premium_efficiency',
        hasVfd: true,
        designCfm: designCfm,
        designStaticIn: designStaticPressureIn,
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Design CFM</p>
              <p className="text-2xl font-bold">{designCfm.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Design Static</p>
              <p className="text-2xl font-bold">{designStaticPressureIn}" w.g.</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Fans</p>
              <p className="text-2xl font-bold">
                {(hasSupplyFan ? 1 : 0) + (hasReturnFan ? 1 : 0) + (hasReliefFan ? 1 : 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Total BHP</p>
              <p className="text-2xl font-bold">
                {(
                  (supplyFan ? calculateFanPower({ cfm: designCfm, staticPressureIn: designStaticPressureIn }).bhp : 0) +
                  (returnFan ? calculateFanPower({ cfm: designCfm * 0.9, staticPressureIn: designStaticPressureIn * 0.6 }).bhp : 0) +
                  (reliefFan ? calculateFanPower({ cfm: designCfm * 0.15, staticPressureIn: 0.5 }).bhp : 0)
                ).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supply Fan */}
      <FanConfigCard
        title="Supply Fan"
        description="Main supply air fan delivering conditioned air to zones"
        icon={Fan}
        iconColor="text-blue-500"
        fan={supplyFan}
        designCfm={designCfm}
        designStaticIn={designStaticPressureIn}
        enabled={hasSupplyFan}
        onEnabledChange={setHasSupplyFan}
        onChange={onSupplyFanChange}
      />

      {/* Return Fan */}
      <FanConfigCard
        title="Return Fan"
        description="Return air fan for systems with significant return duct pressure"
        icon={Fan}
        iconColor="text-green-500"
        fan={returnFan}
        designCfm={Math.round(designCfm * 0.9)}
        designStaticIn={designStaticPressureIn * 0.6}
        enabled={hasReturnFan}
        onEnabledChange={setHasReturnFan}
        onChange={onReturnFanChange}
        showStaticInput
      />

      {/* Relief/Exhaust Fan */}
      <FanConfigCard
        title="Relief/Exhaust Fan"
        description="Relief or exhaust fan for building pressure control"
        icon={Fan}
        iconColor="text-orange-500"
        fan={reliefFan}
        designCfm={Math.round(designCfm * 0.15)}
        designStaticIn={0.5}
        enabled={hasReliefFan}
        onEnabledChange={setHasReliefFan}
        onChange={onReliefFanChange}
        showStaticInput
      />
    </div>
  );
}
