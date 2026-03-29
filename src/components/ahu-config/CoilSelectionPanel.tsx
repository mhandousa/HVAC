import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Snowflake, Flame, ThermometerSnowflake, Calculator, AlertTriangle } from 'lucide-react';
import { sizeCoolingCoil, sizeHeatingCoil, type CoolingCoilConfig, type HeatingCoilConfig, type PreheatCoilConfig } from '@/lib/ahu-calculations';

interface CoilSelectionPanelProps {
  designCfm: number;
  coolingCoil: CoolingCoilConfig | null;
  heatingCoil: HeatingCoilConfig | null;
  preheatCoil: PreheatCoilConfig | null;
  onCoolingCoilChange: (config: CoolingCoilConfig | null) => void;
  onHeatingCoilChange: (config: HeatingCoilConfig | null) => void;
  onPreheatCoilChange: (config: PreheatCoilConfig | null) => void;
}

export function CoilSelectionPanel({
  designCfm,
  coolingCoil,
  heatingCoil,
  preheatCoil,
  onCoolingCoilChange,
  onHeatingCoilChange,
  onPreheatCoilChange,
}: CoilSelectionPanelProps) {
  const [hasCoolingCoil, setHasCoolingCoil] = useState(!!coolingCoil);
  const [hasHeatingCoil, setHasHeatingCoil] = useState(!!heatingCoil);
  const [hasPreheatCoil, setHasPreheatCoil] = useState(!!preheatCoil?.enabled);

  // Initialize cooling coil with defaults if enabled
  useEffect(() => {
    if (hasCoolingCoil && !coolingCoil) {
      onCoolingCoilChange({
        coilType: 'chilled_water',
        rows: 6,
        finsPerInch: 12,
        faceVelocityFpm: 500,
        enteringAirDb: 80,
        enteringAirWb: 67,
        leavingAirDb: 55,
        leavingAirWb: 54,
        chwSupplyTemp: 44,
        chwReturnTemp: 54,
      });
    } else if (!hasCoolingCoil) {
      onCoolingCoilChange(null);
    }
  }, [hasCoolingCoil]);

  // Initialize heating coil with defaults if enabled
  useEffect(() => {
    if (hasHeatingCoil && !heatingCoil) {
      onHeatingCoilChange({
        coilType: 'hot_water',
        rows: 1,
        enteringAirTemp: 55,
        leavingAirTemp: 95,
        hwSupplyTemp: 180,
        hwReturnTemp: 160,
      });
    } else if (!hasHeatingCoil) {
      onHeatingCoilChange(null);
    }
  }, [hasHeatingCoil]);

  // Calculate cooling coil sizing
  const coolingCalc = coolingCoil && designCfm > 0 ? sizeCoolingCoil({
    airflowCfm: designCfm,
    enteringAirDb: coolingCoil.enteringAirDb,
    enteringAirWb: coolingCoil.enteringAirWb,
    leavingAirDb: coolingCoil.leavingAirDb,
    leavingAirWb: coolingCoil.leavingAirWb,
    chwSupplyTemp: coolingCoil.chwSupplyTemp || 44,
    chwReturnTemp: coolingCoil.chwReturnTemp || 54,
    rows: coolingCoil.rows,
    finsPerInch: coolingCoil.finsPerInch,
    targetFaceVelocity: coolingCoil.faceVelocityFpm,
  }) : null;

  // Calculate heating coil sizing
  const heatingCalc = heatingCoil && designCfm > 0 ? sizeHeatingCoil({
    airflowCfm: designCfm,
    enteringAirTemp: heatingCoil.enteringAirTemp,
    leavingAirTemp: heatingCoil.leavingAirTemp,
    coilType: heatingCoil.coilType,
    hwSupplyTemp: heatingCoil.hwSupplyTemp,
    hwReturnTemp: heatingCoil.hwReturnTemp,
    rows: heatingCoil.rows,
  }) : null;

  const updateCoolingCoil = (updates: Partial<CoolingCoilConfig>) => {
    if (coolingCoil) {
      onCoolingCoilChange({ ...coolingCoil, ...updates });
    }
  };

  const updateHeatingCoil = (updates: Partial<HeatingCoilConfig>) => {
    if (heatingCoil) {
      onHeatingCoilChange({ ...heatingCoil, ...updates });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cooling Coil */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Cooling Coil</CardTitle>
            </div>
            <Switch
              checked={hasCoolingCoil}
              onCheckedChange={setHasCoolingCoil}
            />
          </div>
          <CardDescription>
            Chilled water or DX cooling coil configuration
          </CardDescription>
        </CardHeader>
        
        {hasCoolingCoil && coolingCoil && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Coil Type</Label>
                <Select
                  value={coolingCoil.coilType}
                  onValueChange={(v) => updateCoolingCoil({ coilType: v as 'chilled_water' | 'dx' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chilled_water">Chilled Water</SelectItem>
                    <SelectItem value="dx">DX (Direct Expansion)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rows</Label>
                <Select
                  value={String(coolingCoil.rows)}
                  onValueChange={(v) => updateCoolingCoil({ rows: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Rows</SelectItem>
                    <SelectItem value="6">6 Rows</SelectItem>
                    <SelectItem value="8">8 Rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fins per Inch</Label>
                <Select
                  value={String(coolingCoil.finsPerInch)}
                  onValueChange={(v) => updateCoolingCoil({ finsPerInch: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 FPI</SelectItem>
                    <SelectItem value="10">10 FPI</SelectItem>
                    <SelectItem value="12">12 FPI</SelectItem>
                    <SelectItem value="14">14 FPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Face Velocity (FPM)</Label>
                <Input
                  type="number"
                  value={coolingCoil.faceVelocityFpm || ''}
                  onChange={(e) => updateCoolingCoil({ faceVelocityFpm: Number(e.target.value) })}
                  placeholder="500"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Entering Air DB (°F)</Label>
                <Input
                  type="number"
                  value={coolingCoil.enteringAirDb || ''}
                  onChange={(e) => updateCoolingCoil({ enteringAirDb: Number(e.target.value) })}
                  placeholder="80"
                />
              </div>

              <div className="space-y-2">
                <Label>Entering Air WB (°F)</Label>
                <Input
                  type="number"
                  value={coolingCoil.enteringAirWb || ''}
                  onChange={(e) => updateCoolingCoil({ enteringAirWb: Number(e.target.value) })}
                  placeholder="67"
                />
              </div>

              <div className="space-y-2">
                <Label>Leaving Air DB (°F)</Label>
                <Input
                  type="number"
                  value={coolingCoil.leavingAirDb || ''}
                  onChange={(e) => updateCoolingCoil({ leavingAirDb: Number(e.target.value) })}
                  placeholder="55"
                />
              </div>

              <div className="space-y-2">
                <Label>Leaving Air WB (°F)</Label>
                <Input
                  type="number"
                  value={coolingCoil.leavingAirWb || ''}
                  onChange={(e) => updateCoolingCoil({ leavingAirWb: Number(e.target.value) })}
                  placeholder="54"
                />
              </div>
            </div>

            {coolingCoil.coilType === 'chilled_water' && (
              <>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>CHW Supply Temp (°F)</Label>
                    <Input
                      type="number"
                      value={coolingCoil.chwSupplyTemp || ''}
                      onChange={(e) => updateCoolingCoil({ chwSupplyTemp: Number(e.target.value) })}
                      placeholder="44"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CHW Return Temp (°F)</Label>
                    <Input
                      type="number"
                      value={coolingCoil.chwReturnTemp || ''}
                      onChange={(e) => updateCoolingCoil({ chwReturnTemp: Number(e.target.value) })}
                      placeholder="54"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Calculated Results */}
            {coolingCalc && (
              <>
                <Separator />
                <div className="p-4 bg-blue-500/5 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Calculated Performance</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Capacity</p>
                      <p className="font-semibold">{coolingCalc.totalCapacityTons} Tons</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sensible</p>
                      <p className="font-semibold">{coolingCalc.sensibleCapacityMbh} MBH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Latent</p>
                      <p className="font-semibold">{coolingCalc.latentCapacityMbh} MBH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Water Flow</p>
                      <p className="font-semibold">{coolingCalc.waterFlowGpm} GPM</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Face Area</p>
                      <p className="font-semibold">{coolingCalc.faceAreaSqFt} sq ft</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Air ΔP</p>
                      <p className="font-semibold">{coolingCalc.airPressureDropIn}" w.g.</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Water ΔP</p>
                      <p className="font-semibold">{coolingCalc.waterPressureDropFt} ft</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Face Velocity</p>
                      <p className="font-semibold">{coolingCalc.faceVelocityFpm} FPM</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Heating Coil */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Heating Coil</CardTitle>
            </div>
            <Switch
              checked={hasHeatingCoil}
              onCheckedChange={setHasHeatingCoil}
            />
          </div>
          <CardDescription>
            Hot water, electric, or gas heating coil
          </CardDescription>
        </CardHeader>
        
        {hasHeatingCoil && heatingCoil && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Coil Type</Label>
                <Select
                  value={heatingCoil.coilType}
                  onValueChange={(v) => updateHeatingCoil({ coilType: v as 'hot_water' | 'electric' | 'gas' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot_water">Hot Water</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {heatingCoil.coilType === 'hot_water' && (
                <div className="space-y-2">
                  <Label>Rows</Label>
                  <Select
                    value={String(heatingCoil.rows || 1)}
                    onValueChange={(v) => updateHeatingCoil({ rows: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Row</SelectItem>
                      <SelectItem value="2">2 Rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Entering Air Temp (°F)</Label>
                <Input
                  type="number"
                  value={heatingCoil.enteringAirTemp || ''}
                  onChange={(e) => updateHeatingCoil({ enteringAirTemp: Number(e.target.value) })}
                  placeholder="55"
                />
              </div>

              <div className="space-y-2">
                <Label>Leaving Air Temp (°F)</Label>
                <Input
                  type="number"
                  value={heatingCoil.leavingAirTemp || ''}
                  onChange={(e) => updateHeatingCoil({ leavingAirTemp: Number(e.target.value) })}
                  placeholder="95"
                />
              </div>
            </div>

            {heatingCoil.coilType === 'hot_water' && (
              <>
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>HW Supply Temp (°F)</Label>
                    <Input
                      type="number"
                      value={heatingCoil.hwSupplyTemp || ''}
                      onChange={(e) => updateHeatingCoil({ hwSupplyTemp: Number(e.target.value) })}
                      placeholder="180"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>HW Return Temp (°F)</Label>
                    <Input
                      type="number"
                      value={heatingCoil.hwReturnTemp || ''}
                      onChange={(e) => updateHeatingCoil({ hwReturnTemp: Number(e.target.value) })}
                      placeholder="160"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Calculated Results */}
            {heatingCalc && (
              <>
                <Separator />
                <div className="p-4 bg-orange-500/5 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Calculated Performance</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Capacity</p>
                      <p className="font-semibold">{heatingCalc.capacityMbh} MBH</p>
                    </div>
                    {heatingCalc.waterFlowGpm && (
                      <div>
                        <p className="text-muted-foreground">Water Flow</p>
                        <p className="font-semibold">{heatingCalc.waterFlowGpm} GPM</p>
                      </div>
                    )}
                    {heatingCalc.electricKw && (
                      <div>
                        <p className="text-muted-foreground">Electric Load</p>
                        <p className="font-semibold">{heatingCalc.electricKw} kW</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Air ΔP</p>
                      <p className="font-semibold">{heatingCalc.airPressureDropIn}" w.g.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {/* Preheat Coil */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThermometerSnowflake className="h-5 w-5 text-cyan-500" />
              <CardTitle className="text-lg">Preheat Coil</CardTitle>
              <Badge variant="outline">Optional</Badge>
            </div>
            <Switch
              checked={hasPreheatCoil}
              onCheckedChange={(checked) => {
                setHasPreheatCoil(checked);
                onPreheatCoilChange(checked ? {
                  enabled: true,
                  freezeProtectionSetpoint: 40,
                  glycolPercent: 30,
                } : { enabled: false, freezeProtectionSetpoint: 40, glycolPercent: 0 });
              }}
            />
          </div>
          <CardDescription>
            Freeze protection for cold climates (glycol system)
          </CardDescription>
        </CardHeader>
        
        {hasPreheatCoil && preheatCoil && (
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-200 rounded-lg mb-4">
              <AlertTriangle className="h-4 w-4 text-cyan-600" />
              <span className="text-sm text-cyan-800">
                Preheat coils are typically not required in Saudi Arabia's climate.
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Freeze Protection Setpoint (°F)</Label>
                <Input
                  type="number"
                  value={preheatCoil.freezeProtectionSetpoint || ''}
                  onChange={(e) => onPreheatCoilChange({
                    ...preheatCoil,
                    freezeProtectionSetpoint: Number(e.target.value),
                  })}
                  placeholder="40"
                />
              </div>

              <div className="space-y-2">
                <Label>Glycol Percentage</Label>
                <Select
                  value={String(preheatCoil.glycolPercent)}
                  onValueChange={(v) => onPreheatCoilChange({
                    ...preheatCoil,
                    glycolPercent: Number(v),
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
