import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Wind, 
  Snowflake, 
  Flame, 
  Fan, 
  Gauge,
  FileText 
} from 'lucide-react';
import type { AHUConfiguration } from '@/hooks/useAHUConfigurations';
import { sizeCoolingCoil, sizeHeatingCoil, calculateFanPower, calculateTotalPressureDrop } from '@/lib/ahu-calculations';

interface AHUSummaryPanelProps {
  config: Partial<AHUConfiguration>;
}

export function AHUSummaryPanel({ config }: AHUSummaryPanelProps) {
  // Calculate derived values
  const coolingCalc = config.coolingCoilConfig && config.designCfm ? sizeCoolingCoil({
    airflowCfm: config.designCfm,
    enteringAirDb: config.coolingCoilConfig.enteringAirDb,
    enteringAirWb: config.coolingCoilConfig.enteringAirWb,
    leavingAirDb: config.coolingCoilConfig.leavingAirDb,
    leavingAirWb: config.coolingCoilConfig.leavingAirWb,
    chwSupplyTemp: config.coolingCoilConfig.chwSupplyTemp || 44,
    chwReturnTemp: config.coolingCoilConfig.chwReturnTemp || 54,
    rows: config.coolingCoilConfig.rows,
    finsPerInch: config.coolingCoilConfig.finsPerInch,
  }) : null;

  const heatingCalc = config.heatingCoilConfig && config.designCfm ? sizeHeatingCoil({
    airflowCfm: config.designCfm,
    enteringAirTemp: config.heatingCoilConfig.enteringAirTemp,
    leavingAirTemp: config.heatingCoilConfig.leavingAirTemp,
    coilType: config.heatingCoilConfig.coilType,
    hwSupplyTemp: config.heatingCoilConfig.hwSupplyTemp,
    hwReturnTemp: config.heatingCoilConfig.hwReturnTemp,
  }) : null;

  const supplyFanCalc = config.supplyFanConfig && config.designCfm ? calculateFanPower({
    cfm: config.designCfm,
    staticPressureIn: config.designStaticPressureIn || 2.5,
  }) : null;

  const pressureDrop = calculateTotalPressureDrop({
    coolingCoilIn: coolingCalc?.airPressureDropIn || 0,
    heatingCoilIn: heatingCalc?.airPressureDropIn || 0,
    filtersCleanIn: 0.35, // Estimated MERV 13
    filtersDirtyIn: 0.9,
    dampersIn: 0.1,
  });

  const completeness = {
    basicInfo: !!(config.ahuTag && config.ahuName && config.designCfm),
    coolingCoil: !!config.coolingCoilConfig,
    heatingCoil: !!config.heatingCoilConfig || true, // Optional
    fans: !!config.supplyFanConfig,
    controls: !!config.controlStrategy,
  };

  const completenessPercent = Object.values(completeness).filter(Boolean).length / 4 * 100;

  return (
    <div className="space-y-6">
      {/* Completeness Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configuration Summary</span>
            <Badge variant={completenessPercent === 100 ? 'default' : 'secondary'}>
              {completenessPercent.toFixed(0)}% Complete
            </Badge>
          </CardTitle>
          <CardDescription>
            {config.ahuTag} • {config.ahuName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CompletionItem label="Basic Info" complete={completeness.basicInfo} />
            <CompletionItem label="Cooling Coil" complete={completeness.coolingCoil} />
            <CompletionItem label="Fan Selection" complete={completeness.fans} />
            <CompletionItem label="Controls" complete={completeness.controls} />
          </div>
        </CardContent>
      </Card>

      {/* Design Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wind className="h-5 w-5" />
              Airflow Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Design Supply CFM" value={config.designCfm?.toLocaleString()} unit="CFM" />
            <SummaryRow label="Outdoor Air CFM" value={config.outdoorAirCfm?.toLocaleString()} unit="CFM" />
            <SummaryRow 
              label="OA Percentage" 
              value={config.designCfm && config.outdoorAirCfm 
                ? ((config.outdoorAirCfm / config.designCfm) * 100).toFixed(1) 
                : undefined
              } 
              unit="%" 
            />
            <Separator />
            <SummaryRow label="Control Strategy" value={config.controlStrategy?.toUpperCase()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="h-5 w-5" />
              Pressure Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Design Static" value={config.designStaticPressureIn?.toFixed(2)} unit="in. w.g." />
            <SummaryRow label="Total ΔP (Clean)" value={pressureDrop.totalCleanIn.toFixed(2)} unit="in. w.g." />
            <SummaryRow label="Total ΔP (Dirty)" value={pressureDrop.totalDirtyIn.toFixed(2)} unit="in. w.g." />
            <Separator />
            <SummaryRow 
              label="Margin" 
              value={config.designStaticPressureIn 
                ? (config.designStaticPressureIn - pressureDrop.totalDirtyIn).toFixed(2) 
                : undefined
              } 
              unit="in. w.g."
              warning={(config.designStaticPressureIn || 0) - pressureDrop.totalDirtyIn < 0.25}
            />
          </CardContent>
        </Card>
      </div>

      {/* Coil Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coolingCalc && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Snowflake className="h-5 w-5 text-blue-500" />
                Cooling Coil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Total Capacity" value={coolingCalc.totalCapacityTons.toFixed(1)} unit="Tons" />
              <SummaryRow label="Sensible Capacity" value={coolingCalc.sensibleCapacityMbh.toFixed(1)} unit="MBH" />
              <SummaryRow label="Latent Capacity" value={coolingCalc.latentCapacityMbh.toFixed(1)} unit="MBH" />
              <Separator />
              <SummaryRow label="CHW Flow" value={coolingCalc.waterFlowGpm.toFixed(1)} unit="GPM" />
              <SummaryRow label="Face Area" value={coolingCalc.faceAreaSqFt.toFixed(1)} unit="sq ft" />
              <SummaryRow label="Air ΔP" value={coolingCalc.airPressureDropIn.toFixed(2)} unit="in. w.g." />
            </CardContent>
          </Card>
        )}

        {heatingCalc && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flame className="h-5 w-5 text-orange-500" />
                Heating Coil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Capacity" value={heatingCalc.capacityMbh.toFixed(1)} unit="MBH" />
              {heatingCalc.waterFlowGpm && (
                <SummaryRow label="HW Flow" value={heatingCalc.waterFlowGpm.toFixed(1)} unit="GPM" />
              )}
              {heatingCalc.electricKw && (
                <SummaryRow label="Electric Load" value={heatingCalc.electricKw.toFixed(1)} unit="kW" />
              )}
              <Separator />
              <SummaryRow label="Air ΔP" value={heatingCalc.airPressureDropIn.toFixed(2)} unit="in. w.g." />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fan Summary */}
      {supplyFanCalc && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Fan className="h-5 w-5" />
              Fan Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Fan</th>
                    <th className="text-right py-2 font-medium">CFM</th>
                    <th className="text-right py-2 font-medium">Static</th>
                    <th className="text-right py-2 font-medium">BHP</th>
                    <th className="text-right py-2 font-medium">Motor HP</th>
                    <th className="text-right py-2 font-medium">Type</th>
                    <th className="text-right py-2 font-medium">VFD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Supply Fan</td>
                    <td className="text-right">{config.designCfm?.toLocaleString()}</td>
                    <td className="text-right">{config.designStaticPressureIn}" w.g.</td>
                    <td className="text-right">{supplyFanCalc.bhp}</td>
                    <td className="text-right">{supplyFanCalc.motorHp}</td>
                    <td className="text-right">{config.supplyFanConfig?.fanType || '-'}</td>
                    <td className="text-right">
                      {config.supplyFanConfig?.hasVfd ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground inline" />
                      )}
                    </td>
                  </tr>
                  {config.returnFanConfig && (
                    <tr className="border-b">
                      <td className="py-2">Return Fan</td>
                      <td className="text-right">{Math.round((config.designCfm || 0) * 0.9).toLocaleString()}</td>
                      <td className="text-right">{((config.designStaticPressureIn || 2.5) * 0.6).toFixed(1)}" w.g.</td>
                      <td className="text-right">-</td>
                      <td className="text-right">-</td>
                      <td className="text-right">{config.returnFanConfig.fanType}</td>
                      <td className="text-right">
                        {config.returnFanConfig.hasVfd ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground inline" />
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Notes & Remarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {config.notes || config.description || 'No notes added.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CompletionItem({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${complete ? 'bg-green-500/10' : 'bg-muted'}`}>
      {complete ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={`text-sm ${complete ? 'text-green-700' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}

function SummaryRow({ 
  label, 
  value, 
  unit, 
  warning 
}: { 
  label: string; 
  value?: string; 
  unit?: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${warning ? 'text-destructive' : ''}`}>
        {value ?? '-'} {value && unit}
        {warning && <AlertTriangle className="h-3 w-3 inline ml-1" />}
      </span>
    </div>
  );
}
