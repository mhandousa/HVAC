import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  sizeFCU, 
  FCUSizingResult, 
  FCU_STANDARD_SIZES,
  SAUDI_NC_STANDARDS,
  TerminalUnitType
} from '@/lib/terminal-unit-calculations';
import { Thermometer, Wind, Volume2, Droplets, Zap, Check, AlertTriangle } from 'lucide-react';

interface FCUSizingPanelProps {
  coolingLoadBtuh: number;
  heatingLoadBtuh?: number;
  cfmRequired: number;
  unitType: 'fcu_2pipe' | 'fcu_4pipe' | 'fcu_electric';
  onSizingChange: (result: FCUSizingResult) => void;
  onTypeChange?: (type: TerminalUnitType) => void;
}

export function FCUSizingPanel({
  coolingLoadBtuh,
  heatingLoadBtuh = 0,
  cfmRequired,
  unitType,
  onSizingChange,
  onTypeChange,
}: FCUSizingPanelProps) {
  const [chwEnteringTempF, setChwEnteringTempF] = useState(44);
  const [chwLeavingTempF, setChwLeavingTempF] = useState(54);
  const [hwEnteringTempF, setHwEnteringTempF] = useState(140);
  const [hwLeavingTempF, setHwLeavingTempF] = useState(120);
  const [spaceType, setSpaceType] = useState('Office');
  const [fanSpeed, setFanSpeed] = useState(3);

  const [result, setResult] = useState<FCUSizingResult | null>(null);

  useEffect(() => {
    if (coolingLoadBtuh > 0 && cfmRequired > 0) {
      const sizingResult = sizeFCU({
        coolingLoadBtuh,
        heatingLoadBtuh,
        cfmRequired,
        unitType,
        chwEnteringTempF,
        chwLeavingTempF,
        hwEnteringTempF,
        hwLeavingTempF,
      });
      setResult(sizingResult);
      onSizingChange(sizingResult);
    }
  }, [coolingLoadBtuh, heatingLoadBtuh, cfmRequired, unitType, chwEnteringTempF, chwLeavingTempF, hwEnteringTempF, hwLeavingTempF, onSizingChange]);

  const ncStandard = SAUDI_NC_STANDARDS.find(s => s.spaceType === spaceType);
  const ncCompliant = result && ncStandard ? result.estimatedNC <= ncStandard.targetNC : true;

  const showHeating = unitType === 'fcu_4pipe' || unitType === 'fcu_electric';

  return (
    <div className="space-y-4">
      {/* FCU Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">FCU Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>FCU Type</Label>
            <Select value={unitType} onValueChange={(v) => onTypeChange?.(v as TerminalUnitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fcu_2pipe">2-Pipe (Cooling Only)</SelectItem>
                <SelectItem value="fcu_4pipe">4-Pipe (Cooling + Hot Water Heating)</SelectItem>
                <SelectItem value="fcu_electric">Cooling + Electric Heat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Space Type (NC Standard)</Label>
              <Select value={spaceType} onValueChange={setSpaceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAUDI_NC_STANDARDS.map((std) => (
                    <SelectItem key={std.spaceType} value={std.spaceType}>
                      {std.spaceType} (NC-{std.targetNC})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fan Speed Settings</Label>
              <Select value={String(fanSpeed)} onValueChange={(v) => setFanSpeed(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3-Speed</SelectItem>
                  <SelectItem value="0">EC Motor (Variable)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CHW Temperatures */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="h-4 w-4 text-blue-500" />
              <Label className="font-medium">Chilled Water</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">CHW EWT (°F)</Label>
                <Input
                  type="number"
                  value={chwEnteringTempF}
                  onChange={(e) => setChwEnteringTempF(parseFloat(e.target.value) || 44)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">CHW LWT (°F)</Label>
                <Input
                  type="number"
                  value={chwLeavingTempF}
                  onChange={(e) => setChwLeavingTempF(parseFloat(e.target.value) || 54)}
                />
              </div>
            </div>
          </div>

          {/* HW Temperatures (4-pipe only) */}
          {unitType === 'fcu_4pipe' && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <Label className="font-medium">Hot Water</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">HW EWT (°F)</Label>
                  <Input
                    type="number"
                    value={hwEnteringTempF}
                    onChange={(e) => setHwEnteringTempF(parseFloat(e.target.value) || 140)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">HW LWT (°F)</Label>
                  <Input
                    type="number"
                    value={hwLeavingTempF}
                    onChange={(e) => setHwLeavingTempF(parseFloat(e.target.value) || 120)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sizing Results */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Recommended FCU</span>
              {result.isWithinCapacity ? (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  <Check className="h-3 w-3 mr-1" /> Within Capacity
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Check Sizing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Model */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Model Size</div>
                <div className="text-2xl font-bold">FCU-{result.model}</div>
              </div>

              {/* Nominal CFM */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Wind className="h-3.5 w-3.5" />
                  Nominal CFM
                </div>
                <div className="text-lg font-semibold">{result.nominalCfm} CFM</div>
              </div>

              {/* Cooling Capacity */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                  Cooling Capacity
                </div>
                <div className="text-lg font-semibold">{result.coolingCapacityMbh} MBH</div>
              </div>

              {/* NC Rating */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Volume2 className="h-3.5 w-3.5" />
                  NC Rating
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">NC-{result.estimatedNC}</span>
                  {ncCompliant ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">
                      ≤ NC-{ncStandard?.targetNC}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      &gt; NC-{ncStandard?.targetNC}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Coil Details */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {/* Cooling Coil */}
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Cooling Coil
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rows:</span>
                    <span className="font-medium">{result.coilRows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fins/Inch:</span>
                    <span className="font-medium">{result.finsPerInch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CHW Flow:</span>
                    <span className="font-medium">{result.chwFlowGpm} GPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EWT/LWT:</span>
                    <span className="font-medium">{chwEnteringTempF}°F / {chwLeavingTempF}°F</span>
                  </div>
                </div>
              </div>

              {/* Heating Section */}
              {showHeating && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium mb-3">
                    {unitType === 'fcu_electric' ? (
                      <>
                        <Zap className="h-4 w-4 text-amber-500" />
                        Electric Heater
                      </>
                    ) : (
                      <>
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        Heating Coil
                      </>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {unitType === 'fcu_electric' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium">{result.electricHeatKw} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stages:</span>
                          <span className="font-medium">{Math.ceil((result.electricHeatKw || 0) / 5)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium">{result.heatingCapacityMbh} MBH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">HW Flow:</span>
                          <span className="font-medium">{result.hwFlowGpm} GPM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EWT/LWT:</span>
                          <span className="font-medium">{hwEnteringTempF}°F / {hwLeavingTempF}°F</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Motor Info */}
              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-3">Fan Motor</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Motor HP:</span>
                    <span className="font-medium">{result.motorHp} HP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{fanSpeed === 0 ? 'EC Variable' : `${fanSpeed}-Speed`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Sizes */}
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2">Alternative Sizes</div>
              <div className="flex gap-2 flex-wrap">
                {FCU_STANDARD_SIZES.filter(s => 
                  s.coolingMbh * 1000 >= coolingLoadBtuh * 0.7 && 
                  s.coolingMbh * 1000 <= coolingLoadBtuh * 1.5
                ).map((size) => (
                  <Badge 
                    key={size.model} 
                    variant={size.model === result.model ? "default" : "outline"}
                    className="text-xs"
                  >
                    FCU-{size.model} ({size.coolingMbh} MBH)
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
