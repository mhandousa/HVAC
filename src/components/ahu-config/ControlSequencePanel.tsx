import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings2, Thermometer, Wind, AlertTriangle, Gauge, FileText } from 'lucide-react';
import type { ControlSequenceConfig } from '@/lib/ahu-calculations';

interface ControlSequencePanelProps {
  config: ControlSequenceConfig;
  onChange: (config: ControlSequenceConfig) => void;
}

export function ControlSequencePanel({ config, onChange }: ControlSequencePanelProps) {
  const updateConfig = (updates: Partial<ControlSequenceConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Control Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5" />
            Control Strategy
          </CardTitle>
          <CardDescription>Primary control methodology for the AHU</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Control Strategy</Label>
              <Select
                value={config.controlStrategy}
                onValueChange={(v) => updateConfig({ controlStrategy: v as ControlSequenceConfig['controlStrategy'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vav">VAV - Variable Air Volume</SelectItem>
                  <SelectItem value="cav">CAV - Constant Air Volume</SelectItem>
                  <SelectItem value="doas">DOAS - Dedicated Outdoor Air System</SelectItem>
                  <SelectItem value="dual_duct">Dual Duct</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {config.controlStrategy === 'vav' && 'Varies airflow to match load, most energy efficient for variable loads'}
                {config.controlStrategy === 'cav' && 'Constant airflow with variable temperature, simpler controls'}
                {config.controlStrategy === 'doas' && '100% outdoor air, typically paired with zone terminal units'}
                {config.controlStrategy === 'dual_duct' && 'Separate hot and cold ducts, good for simultaneous heating/cooling'}
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Strategy Characteristics</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {config.controlStrategy === 'vav' && (
                  <>
                    <li>• VFD modulates supply fan speed</li>
                    <li>• Duct static pressure control</li>
                    <li>• VAV boxes at zones</li>
                    <li>• Excellent part-load efficiency</li>
                  </>
                )}
                {config.controlStrategy === 'cav' && (
                  <>
                    <li>• Fixed airflow rate</li>
                    <li>• Temperature modulation at AHU</li>
                    <li>• Simple controls</li>
                    <li>• Best for constant loads</li>
                  </>
                )}
                {config.controlStrategy === 'doas' && (
                  <>
                    <li>• Handles ventilation load only</li>
                    <li>• Decoupled from sensible cooling</li>
                    <li>• Often paired with VRF or chilled beams</li>
                    <li>• Excellent humidity control</li>
                  </>
                )}
                {config.controlStrategy === 'dual_duct' && (
                  <>
                    <li>• Hot and cold ducts to each zone</li>
                    <li>• Mixing boxes at zones</li>
                    <li>• Good for diverse zone loads</li>
                    <li>• Higher energy use</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economizer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wind className="h-5 w-5" />
            Economizer Settings
          </CardTitle>
          <CardDescription>Free cooling using outdoor air when conditions allow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Economizer Type</Label>
              <Select
                value={config.economizerType}
                onValueChange={(v) => updateConfig({ economizerType: v as ControlSequenceConfig['economizerType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="dry_bulb">Dry Bulb Temperature</SelectItem>
                  <SelectItem value="enthalpy">Enthalpy (Single)</SelectItem>
                  <SelectItem value="differential_enthalpy">Differential Enthalpy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.economizerType !== 'none' && (
              <div className="space-y-2">
                <Label>High Limit Lockout (°F)</Label>
                <Input
                  type="number"
                  value={config.economizerLockoutTempF || ''}
                  onChange={(e) => updateConfig({ economizerLockoutTempF: Number(e.target.value) })}
                  placeholder="75"
                />
                <p className="text-xs text-muted-foreground">
                  Economizer disabled above this OA temp
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Minimum OA Damper Position (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.minOaDamperPosition || ''}
                onChange={(e) => updateConfig({ minOaDamperPosition: Number(e.target.value) })}
                placeholder="15"
              />
            </div>
          </div>

          {config.economizerType === 'none' && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                ASHRAE 90.1 requires economizers for systems ≥54,000 Btuh in most Saudi climate zones.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Temperature Setpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5" />
            Temperature Setpoints
          </CardTitle>
          <CardDescription>Supply air and safety temperature limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Supply Air Temp Setpoint (°F)</Label>
              <Input
                type="number"
                value={config.supplyAirTempSetpointF || ''}
                onChange={(e) => updateConfig({ supplyAirTempSetpointF: Number(e.target.value) })}
                placeholder="55"
              />
            </div>

            <div className="space-y-2">
              <Label>Mixed Air Low Limit (°F)</Label>
              <Input
                type="number"
                value={config.mixedAirLowLimitF || ''}
                onChange={(e) => updateConfig({ mixedAirLowLimitF: Number(e.target.value) })}
                placeholder="40"
              />
              <p className="text-xs text-muted-foreground">Freeze protection</p>
            </div>

            {config.controlStrategy === 'vav' && (
              <div className="space-y-2">
                <Label>Duct Static Setpoint (in. w.g.)</Label>
                <Input
                  type="number"
                  step={0.1}
                  value={config.ductStaticSetpointIn || ''}
                  onChange={(e) => updateConfig({ ductStaticSetpointIn: Number(e.target.value) })}
                  placeholder="1.5"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Reset Strategies */}
          <div className="space-y-4">
            <h4 className="font-medium">Reset Strategies</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium mb-2">Supply Air Temperature Reset</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Raises SAT during low cooling demand to save reheat and fan energy
                </p>
                <div className="text-sm">
                  <p><span className="font-medium">Typical Range:</span> 55°F to 65°F</p>
                  <p><span className="font-medium">Reset Based On:</span> Warmest zone demand or OA temp</p>
                </div>
              </div>

              {config.controlStrategy === 'vav' && (
                <div className="p-4 border rounded-lg">
                  <h5 className="font-medium mb-2">Duct Static Pressure Reset</h5>
                  <p className="text-sm text-muted-foreground mb-3">
                    Reduces static pressure when VAV boxes are mostly open
                  </p>
                  <div className="text-sm">
                    <p><span className="font-medium">Method:</span> Trim & Respond per ASHRAE G36</p>
                    <p><span className="font-medium">Target:</span> ≥1 box at 90% open</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demand Controlled Ventilation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" />
            Demand Controlled Ventilation
          </CardTitle>
          <CardDescription>CO₂-based ventilation modulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="dcv"
                checked={config.hasDcv}
                onCheckedChange={(checked) => updateConfig({ hasDcv: checked })}
              />
              <Label htmlFor="dcv">Enable DCV</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="co2"
                checked={config.hasCo2Sensors}
                onCheckedChange={(checked) => updateConfig({ hasCo2Sensors: checked, hasDcv: checked })}
              />
              <Label htmlFor="co2">Zone CO₂ Sensors</Label>
            </div>
          </div>

          {config.hasDcv && (
            <div className="p-4 bg-green-500/5 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Energy Savings:</strong> DCV can reduce ventilation energy by 20-30% in spaces with variable occupancy.
                Required by ASHRAE 90.1 for high-occupancy spaces (&gt;25 people/1000 sq ft).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Sequence Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Sequence of Operations Preview
          </CardTitle>
          <CardDescription>Auto-generated control sequence based on configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm space-y-4">
            <div>
              <Badge className="mb-2">Startup Sequence</Badge>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Verify all safety interlocks satisfied</li>
                <li>Open outside air damper to minimum position ({config.minOaDamperPosition}%)</li>
                <li>Start supply fan, ramp to design speed</li>
                {config.controlStrategy === 'vav' && <li>Establish duct static pressure control at {config.ductStaticSetpointIn}" w.g.</li>}
                <li>Enable cooling/heating coil valves as required</li>
              </ol>
            </div>

            <Separator />

            <div>
              <Badge className="mb-2">Normal Operation - Cooling Mode</Badge>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Maintain supply air temperature at {config.supplyAirTempSetpointF}°F setpoint</li>
                <li>Modulate cooling coil valve to control SAT</li>
                {config.economizerType !== 'none' && (
                  <li>Enable economizer when OA temp &lt; {config.economizerLockoutTempF}°F</li>
                )}
                {config.hasDcv && <li>Modulate OA damper based on zone CO₂ levels</li>}
                {config.controlStrategy === 'vav' && <li>Modulate supply fan speed to maintain duct static</li>}
              </ol>
            </div>

            <Separator />

            <div>
              <Badge variant="destructive" className="mb-2">Safety Interlocks</Badge>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>High static pressure limit: Shutdown if &gt;6" w.g.</li>
                <li>Freeze protection: Close OA damper if MAT &lt; {config.mixedAirLowLimitF}°F</li>
                <li>Fire/smoke alarm: Shutdown per NFPA requirements</li>
                <li>Filter DP alarm: Alert if ΔP &gt; 2× clean</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Full sequence available in Sequence of Operations tool for PDF export
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
