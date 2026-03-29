import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, Wind, Clock, Shield, Gauge, Settings2 } from 'lucide-react';
import { SystemType, ControlParameters } from '@/lib/soo-templates';

interface SOOControlInputsProps {
  systemType: SystemType;
  params: ControlParameters;
  onChange: (params: ControlParameters) => void;
}

export function SOOControlInputs({ systemType, params, onChange }: SOOControlInputsProps) {
  const updateParam = <K extends keyof ControlParameters>(key: K, value: ControlParameters[K]) => {
    onChange({ ...params, [key]: value });
  };

  const renderTemperatureSection = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-primary" />
          Temperature Setpoints
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {(systemType === 'ahu' || systemType === 'vrf' || systemType === 'fcu' || systemType === 'split_package') && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coolingSetpoint">Cooling Setpoint (°F)</Label>
                <Input
                  id="coolingSetpoint"
                  type="number"
                  value={params.coolingSetpoint || ''}
                  onChange={(e) => updateParam('coolingSetpoint', Number(e.target.value))}
                  placeholder="75"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heatingSetpoint">Heating Setpoint (°F)</Label>
                <Input
                  id="heatingSetpoint"
                  type="number"
                  value={params.heatingSetpoint || ''}
                  onChange={(e) => updateParam('heatingSetpoint', Number(e.target.value))}
                  placeholder="70"
                />
              </div>
            </div>
          </>
        )}

        {(systemType === 'ahu' || systemType === 'split_package') && (
          <div className="space-y-2">
            <Label htmlFor="supplyAirTemp">Supply Air Temperature (°F)</Label>
            <Input
              id="supplyAirTemp"
              type="number"
              value={params.supplyAirTemp || ''}
              onChange={(e) => updateParam('supplyAirTemp', Number(e.target.value))}
              placeholder="55"
            />
          </div>
        )}

        {systemType === 'chiller_plant' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chilledWaterSupplyTemp">CHW Supply Temp (°F)</Label>
              <Input
                id="chilledWaterSupplyTemp"
                type="number"
                value={params.chilledWaterSupplyTemp || ''}
                onChange={(e) => updateParam('chilledWaterSupplyTemp', Number(e.target.value))}
                placeholder="44"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condenserWaterTemp">CW Supply Temp (°F)</Label>
              <Input
                id="condenserWaterTemp"
                type="number"
                value={params.condenserWaterTemp || ''}
                onChange={(e) => updateParam('condenserWaterTemp', Number(e.target.value))}
                placeholder="85"
              />
            </div>
          </div>
        )}

        {systemType === 'cooling_tower' && (
          <div className="space-y-2">
            <Label htmlFor="condenserWaterTemp">CW Supply Temperature (°F)</Label>
            <Input
              id="condenserWaterTemp"
              type="number"
              value={params.condenserWaterTemp || ''}
              onChange={(e) => updateParam('condenserWaterTemp', Number(e.target.value))}
              placeholder="85"
            />
          </div>
        )}

        {systemType === 'boiler' && (
          <div className="space-y-2">
            <Label htmlFor="hotWaterSupplyTemp">HW Supply Temperature (°F)</Label>
            <Input
              id="hotWaterSupplyTemp"
              type="number"
              value={params.hotWaterSupplyTemp || ''}
              onChange={(e) => updateParam('hotWaterSupplyTemp', Number(e.target.value))}
              placeholder="180"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAirflowSection = () => {
    if (!['ahu', 'split_package'].includes(systemType)) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wind className="h-4 w-4 text-primary" />
            Airflow & Pressure
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designCfm">Design Airflow (CFM)</Label>
              <Input
                id="designCfm"
                type="number"
                value={params.designCfm || ''}
                onChange={(e) => updateParam('designCfm', Number(e.target.value))}
                placeholder="10000"
              />
            </div>
            {systemType === 'ahu' && (
              <div className="space-y-2">
                <Label htmlFor="ductStaticPressure">Static Pressure (in.wg)</Label>
                <Input
                  id="ductStaticPressure"
                  type="number"
                  step="0.1"
                  value={params.ductStaticPressure || ''}
                  onChange={(e) => updateParam('ductStaticPressure', Number(e.target.value))}
                  placeholder="1.5"
                />
              </div>
            )}
          </div>

          {systemType === 'ahu' && (
            <div className="space-y-2">
              <Label htmlFor="minOutsideAir">Minimum Outside Air (%)</Label>
              <Input
                id="minOutsideAir"
                type="number"
                value={params.minOutsideAir || ''}
                onChange={(e) => updateParam('minOutsideAir', Number(e.target.value))}
                placeholder="20"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderFlowSection = () => {
    if (!['chiller_plant', 'cooling_tower', 'boiler'].includes(systemType)) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Flow Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="designGpm">Design Flow (GPM)</Label>
            <Input
              id="designGpm"
              type="number"
              value={params.designGpm || ''}
              onChange={(e) => updateParam('designGpm', Number(e.target.value))}
              placeholder="500"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderScheduleSection = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupiedStart">Occupied Start</Label>
            <Input
              id="occupiedStart"
              type="time"
              value={params.occupiedStart || '07:00'}
              onChange={(e) => updateParam('occupiedStart', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupiedEnd">Occupied End</Label>
            <Input
              id="occupiedEnd"
              type="time"
              value={params.occupiedEnd || '18:00'}
              onChange={(e) => updateParam('occupiedEnd', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="weekendSchedule" className="cursor-pointer">Weekend Schedule Different</Label>
          <Switch
            id="weekendSchedule"
            checked={params.weekendSchedule || false}
            onCheckedChange={(checked) => updateParam('weekendSchedule', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="prayerTimeShutdown" className="cursor-pointer">Prayer Time Shutdown</Label>
          <Switch
            id="prayerTimeShutdown"
            checked={params.prayerTimeShutdown || false}
            onCheckedChange={(checked) => updateParam('prayerTimeShutdown', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderSafetySection = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Safety Setpoints
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {systemType === 'ahu' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="freezeProtectTemp">Freeze Protection (°F)</Label>
              <Input
                id="freezeProtectTemp"
                type="number"
                value={params.freezeProtectTemp || ''}
                onChange={(e) => updateParam('freezeProtectTemp', Number(e.target.value))}
                placeholder="38"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterDpAlarm">Filter ΔP Alarm (in.wg)</Label>
              <Input
                id="filterDpAlarm"
                type="number"
                step="0.1"
                value={params.filterDpAlarm || ''}
                onChange={(e) => updateParam('filterDpAlarm', Number(e.target.value))}
                placeholder="1.0"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="highTempAlarm">High Temp Alarm (°F)</Label>
            <Input
              id="highTempAlarm"
              type="number"
              value={params.highTempAlarm || ''}
              onChange={(e) => updateParam('highTempAlarm', Number(e.target.value))}
              placeholder="90"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowTempAlarm">Low Temp Alarm (°F)</Label>
            <Input
              id="lowTempAlarm"
              type="number"
              value={params.lowTempAlarm || ''}
              onChange={(e) => updateParam('lowTempAlarm', Number(e.target.value))}
              placeholder="55"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVFDSection = () => {
    if (!['ahu', 'chiller_plant', 'cooling_tower'].includes(systemType)) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            VFD Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minVfdSpeed">Min Speed (%)</Label>
              <Input
                id="minVfdSpeed"
                type="number"
                value={params.minVfdSpeed || ''}
                onChange={(e) => updateParam('minVfdSpeed', Number(e.target.value))}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxVfdSpeed">Max Speed (%)</Label>
              <Input
                id="maxVfdSpeed"
                type="number"
                value={params.maxVfdSpeed || ''}
                onChange={(e) => updateParam('maxVfdSpeed', Number(e.target.value))}
                placeholder="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStagingSection = () => {
    if (!['chiller_plant', 'cooling_tower', 'boiler'].includes(systemType)) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Staging
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="stagingDelay">Staging Delay (seconds)</Label>
            <Input
              id="stagingDelay"
              type="number"
              value={params.stagingDelay || ''}
              onChange={(e) => updateParam('stagingDelay', Number(e.target.value))}
              placeholder="300"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="leadLagRotation" className="cursor-pointer">Lead/Lag Rotation</Label>
            <Switch
              id="leadLagRotation"
              checked={params.leadLagRotation || false}
              onCheckedChange={(checked) => updateParam('leadLagRotation', checked)}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEconomizerSection = () => {
    if (!['ahu', 'split_package'].includes(systemType)) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wind className="h-4 w-4 text-primary" />
            Economizer & Ventilation
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="economizer" className="cursor-pointer">Economizer Enabled</Label>
            <Switch
              id="economizer"
              checked={params.economizer || false}
              onCheckedChange={(checked) => updateParam('economizer', checked)}
            />
          </div>

          {params.economizer && (
            <div className="space-y-2">
              <Label htmlFor="economizerLockout">Economizer Lockout (°F OAT)</Label>
              <Input
                id="economizerLockout"
                type="number"
                value={params.economizerLockout || ''}
                onChange={(e) => updateParam('economizerLockout', Number(e.target.value))}
                placeholder="75"
              />
            </div>
          )}

          {systemType === 'ahu' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="demandControlVentilation" className="cursor-pointer">Demand Control Ventilation (DCV)</Label>
              <Switch
                id="demandControlVentilation"
                checked={params.demandControlVentilation || false}
                onCheckedChange={(checked) => updateParam('demandControlVentilation', checked)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderHeatRecoverySection = () => {
    if (systemType !== 'vrf') return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-primary" />
            Heat Recovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="heatRecovery" className="cursor-pointer">Heat Recovery Mode</Label>
            <Switch
              id="heatRecovery"
              checked={params.heatRecovery || false}
              onCheckedChange={(checked) => updateParam('heatRecovery', checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enable simultaneous heating and cooling with heat transfer between zones
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {renderTemperatureSection()}
      {renderAirflowSection()}
      {renderFlowSection()}
      {renderScheduleSection()}
      {renderSafetySection()}
      {renderVFDSection()}
      {renderStagingSection()}
      {renderEconomizerSection()}
      {renderHeatRecoverySection()}
    </div>
  );
}
