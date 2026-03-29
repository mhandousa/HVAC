import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  sizeVAVBox, 
  VAVSizingResult, 
  VAV_STANDARD_SIZES,
  SAUDI_NC_STANDARDS
} from '@/lib/terminal-unit-calculations';
import { Thermometer, Wind, Volume2, Droplets, AlertTriangle, Check } from 'lucide-react';

interface VAVSizingPanelProps {
  maxCfm: number;
  ventilationCfm?: number;
  ventilationSource?: 'ashrae' | 'estimate' | null;
  onSizingChange: (result: VAVSizingResult) => void;
  onAccessoriesChange?: (accessories: VAVAccessories) => void;
}

export interface VAVAccessories {
  hasReheat: boolean;
  reheatType: 'hot_water' | 'electric' | 'none';
  hasDamper: boolean;
  damperActuator: string;
  hasFlowStation: boolean;
  hasDischargeSensor: boolean;
}

export function VAVSizingPanel({
  maxCfm,
  ventilationCfm = 0,
  ventilationSource,
  onSizingChange,
  onAccessoriesChange,
}: VAVSizingPanelProps) {
  const [minCfmRatio, setMinCfmRatio] = useState(0.3);
  const [supplyTempF, setSupplyTempF] = useState(55);
  const [roomTempF, setRoomTempF] = useState(72);
  const [hasReheat, setHasReheat] = useState(false);
  const [reheatType, setReheatType] = useState<'hot_water' | 'electric' | 'none'>('hot_water');
  const [hwEnteringTempF, setHwEnteringTempF] = useState(140);
  const [hwLeavingTempF, setHwLeavingTempF] = useState(120);
  const [hasDamper, setHasDamper] = useState(true);
  const [damperActuator, setDamperActuator] = useState('ddc');
  const [hasFlowStation, setHasFlowStation] = useState(false);
  const [hasDischargeSensor, setHasDischargeSensor] = useState(false);
  const [spaceType, setSpaceType] = useState('Office');

  const [result, setResult] = useState<VAVSizingResult | null>(null);

  useEffect(() => {
    if (maxCfm > 0) {
      const sizingResult = sizeVAVBox({
        maxCfm,
        minCfmRatio,
        ventilationCfm,
        supplyTempF,
        roomTempF,
        hasReheat,
        reheatType,
        hwEnteringTempF,
        hwLeavingTempF,
      });
      setResult(sizingResult);
      onSizingChange(sizingResult);
    }
  }, [maxCfm, minCfmRatio, ventilationCfm, supplyTempF, roomTempF, hasReheat, reheatType, hwEnteringTempF, hwLeavingTempF, onSizingChange]);

  useEffect(() => {
    onAccessoriesChange?.({
      hasReheat,
      reheatType: hasReheat ? reheatType : 'none',
      hasDamper,
      damperActuator,
      hasFlowStation,
      hasDischargeSensor,
    });
  }, [hasReheat, reheatType, hasDamper, damperActuator, hasFlowStation, hasDischargeSensor, onAccessoriesChange]);

  const ncStandard = SAUDI_NC_STANDARDS.find(s => s.spaceType === spaceType);
  const ncCompliant = result && ncStandard ? result.estimatedNC <= ncStandard.targetNC : true;

  return (
    <div className="space-y-4">
      {/* Input Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">VAV Box Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum CFM Ratio</Label>
              <Select value={String(minCfmRatio)} onValueChange={(v) => setMinCfmRatio(parseFloat(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.2">20%</SelectItem>
                  <SelectItem value="0.3">30%</SelectItem>
                  <SelectItem value="0.4">40%</SelectItem>
                  <SelectItem value="0.5">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supply Air Temp (°F)</Label>
              <Input
                type="number"
                value={supplyTempF}
                onChange={(e) => setSupplyTempF(parseFloat(e.target.value) || 55)}
              />
            </div>
            <div className="space-y-2">
              <Label>Room Temp (°F)</Label>
              <Input
                type="number"
                value={roomTempF}
                onChange={(e) => setRoomTempF(parseFloat(e.target.value) || 72)}
              />
            </div>
          </div>

          {/* Reheat Configuration */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-medium">Reheat Coil</Label>
              <Switch checked={hasReheat} onCheckedChange={setHasReheat} />
            </div>

            {hasReheat && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label>Reheat Type</Label>
                  <Select value={reheatType} onValueChange={(v) => setReheatType(v as 'hot_water' | 'electric')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot_water">Hot Water</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reheatType === 'hot_water' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>HW EWT (°F)</Label>
                      <Input
                        type="number"
                        value={hwEnteringTempF}
                        onChange={(e) => setHwEnteringTempF(parseFloat(e.target.value) || 140)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HW LWT (°F)</Label>
                      <Input
                        type="number"
                        value={hwLeavingTempF}
                        onChange={(e) => setHwLeavingTempF(parseFloat(e.target.value) || 120)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Control Accessories */}
          <div className="border-t pt-4 space-y-3">
            <Label className="font-medium">Control Accessories</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="damper" 
                  checked={hasDamper} 
                  onCheckedChange={(checked) => setHasDamper(!!checked)} 
                />
                <Label htmlFor="damper" className="text-sm">Damper</Label>
              </div>
              
              {hasDamper && (
                <Select value={damperActuator} onValueChange={setDamperActuator}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Actuator type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ddc">DDC Electric</SelectItem>
                    <SelectItem value="pneumatic">Pneumatic</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="flowStation" 
                checked={hasFlowStation} 
                onCheckedChange={(checked) => setHasFlowStation(!!checked)} 
              />
              <Label htmlFor="flowStation" className="text-sm">Flow Measurement Station</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dischargeSensor" 
                checked={hasDischargeSensor} 
                onCheckedChange={(checked) => setHasDischargeSensor(!!checked)} 
              />
              <Label htmlFor="dischargeSensor" className="text-sm">Discharge Air Temp Sensor</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sizing Results */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Recommended VAV Box</span>
              {result.isWithinCapacity ? (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  <Check className="h-3 w-3 mr-1" /> Within Capacity
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Oversized
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Inlet Size */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Wind className="h-3.5 w-3.5" />
                  Inlet Size
                </div>
                <div className="text-2xl font-bold">{result.inletSizeIn}"</div>
              </div>

              {/* CFM Range */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">CFM Range</div>
                <div className="text-lg font-semibold">
                  {result.minCfm} - {result.maxCfm}
                </div>
                {ventilationCfm > 0 && result.minCfm >= ventilationCfm && ventilationSource === 'ashrae' && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                    <Wind className="h-3 w-3" />
                    Min set by outdoor air (Voz)
                  </div>
                )}
              </div>

              {/* Inlet Velocity */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Inlet Velocity</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{result.inletVelocityFpm} FPM</span>
                  {result.velocityStatus === 'good' && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs">OK</Badge>
                  )}
                  {result.velocityStatus === 'warning' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">High</Badge>
                  )}
                  {result.velocityStatus === 'high' && (
                    <Badge variant="destructive" className="text-xs">Too High</Badge>
                  )}
                </div>
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

            {/* Reheat Results */}
            {hasReheat && result.reheatCapacityBtuh > 0 && (
              <div className="mt-4 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  Reheat Coil ({reheatType === 'hot_water' ? 'Hot Water' : 'Electric'})
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="ml-2 font-medium">
                      {(result.reheatCapacityBtuh / 1000).toFixed(1)} MBH
                    </span>
                  </div>
                  {reheatType === 'hot_water' ? (
                    <>
                      <div>
                        <span className="text-muted-foreground">HW Flow:</span>
                        <span className="ml-2 font-medium">{result.hwFlowGpm} GPM</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">EWT/LWT:</span>
                        <span className="ml-2 font-medium">{hwEnteringTempF}°F / {hwLeavingTempF}°F</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-muted-foreground">Electric:</span>
                      <span className="ml-2 font-medium">{result.reheatKw} kW</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Alternative Sizes */}
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2">Alternative Sizes</div>
              <div className="flex gap-2 flex-wrap">
                {VAV_STANDARD_SIZES.filter(s => 
                  s.maxCfm >= result.maxCfm * 0.8 && s.maxCfm <= result.maxCfm * 1.5
                ).map((size) => (
                  <Badge 
                    key={size.inlet} 
                    variant={size.inlet === result.inletSizeIn ? "default" : "outline"}
                    className="text-xs"
                  >
                    {size.inlet}" ({size.maxCfm} CFM)
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
