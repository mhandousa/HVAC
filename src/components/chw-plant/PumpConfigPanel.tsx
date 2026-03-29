import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Droplets, Gauge, Zap } from 'lucide-react';
import {
  calculateChwFlow,
  calculateCwFlow,
  calculatePumpSizing,
  estimatePumpHead,
  calculateHeaderPipe,
  type PumpSizingResult,
} from '@/lib/chilled-water-plant-calculations';
import type { PumpConfig, HeaderPipeConfig } from '@/hooks/useChilledWaterPlants';

interface PumpConfigPanelProps {
  designLoadTons: number;
  diversityFactor: number;
  chwDeltaT: number;
  chillerType: 'water-cooled' | 'air-cooled';
  pumpingConfig: 'primary-only' | 'primary-secondary' | 'variable-primary';
  numberOfChillers: number;
  onPumpingConfigChange: (value: 'primary-only' | 'primary-secondary' | 'variable-primary') => void;
  onPrimaryPumpConfigChange: (config: PumpConfig) => void;
  onSecondaryPumpConfigChange: (config: PumpConfig | null) => void;
  onCondenserPumpConfigChange: (config: PumpConfig | null) => void;
  onHeaderPipeConfigChange: (config: HeaderPipeConfig) => void;
}

export function PumpConfigPanel({
  designLoadTons,
  diversityFactor,
  chwDeltaT,
  chillerType,
  pumpingConfig,
  numberOfChillers,
  onPumpingConfigChange,
  onPrimaryPumpConfigChange,
  onSecondaryPumpConfigChange,
  onCondenserPumpConfigChange,
  onHeaderPipeConfigChange,
}: PumpConfigPanelProps) {
  
  // Calculate flows
  const diversifiedLoad = designLoadTons * diversityFactor;
  const chwFlowGpm = calculateChwFlow(diversifiedLoad, chwDeltaT);
  const cwFlowGpm = chillerType === 'water-cooled' ? calculateCwFlow(diversifiedLoad) : 0;
  
  // Primary pump configuration
  const primaryPumpResult = useMemo(() => {
    if (numberOfChillers <= 0) return null;
    
    // For primary-only variable flow, size for total flow
    // For primary-secondary, primary pumps are constant flow sized per chiller
    const isPrimaryVariable = pumpingConfig === 'variable-primary' as string;
    const numberOfPumps = isPrimaryVariable ? numberOfChillers + 1 : numberOfChillers + 1; // N+1
    const totalFlow = isPrimaryVariable ? chwFlowGpm : chwFlowGpm;
    const headFt = estimatePumpHead('primary');
    
    const result = calculatePumpSizing({
      flowGpm: totalFlow,
      headFt,
      numberOfPumps,
      redundancy: true,
    });
    
    const config: PumpConfig = {
      pumpType: 'primary',
      numberOfPumps: result.numberOfPumps,
      flowPerPumpGpm: result.flowPerPumpGpm,
      headFt: result.headFt,
      motorHp: result.motorHp,
      motorKw: result.motorKw,
      hasVfd: isPrimaryVariable || pumpingConfig === 'variable-primary',
      redundancy: true,
    };
    onPrimaryPumpConfigChange(config);
    
    return result;
  }, [chwFlowGpm, numberOfChillers, pumpingConfig]);
  
  // Secondary pump configuration
  const secondaryPumpResult = useMemo(() => {
    if (pumpingConfig !== 'primary-secondary') {
      onSecondaryPumpConfigChange(null);
      return null;
    }
    
    const numberOfPumps = Math.max(2, Math.ceil(numberOfChillers / 2)) + 1; // At least 2+1
    const headFt = estimatePumpHead('secondary');
    
    const result = calculatePumpSizing({
      flowGpm: chwFlowGpm,
      headFt,
      numberOfPumps,
      redundancy: true,
    });
    
    const config: PumpConfig = {
      pumpType: 'secondary',
      numberOfPumps: result.numberOfPumps,
      flowPerPumpGpm: result.flowPerPumpGpm,
      headFt: result.headFt,
      motorHp: result.motorHp,
      motorKw: result.motorKw,
      hasVfd: true, // Secondary pumps always have VFD
      redundancy: true,
    };
    onSecondaryPumpConfigChange(config);
    
    return result;
  }, [chwFlowGpm, numberOfChillers, pumpingConfig]);
  
  // Condenser pump configuration
  const condenserPumpResult = useMemo(() => {
    if (chillerType !== 'water-cooled') {
      onCondenserPumpConfigChange(null);
      return null;
    }
    
    const numberOfPumps = numberOfChillers + 1; // N+1
    const headFt = estimatePumpHead('condenser');
    
    const result = calculatePumpSizing({
      flowGpm: cwFlowGpm,
      headFt,
      numberOfPumps,
      redundancy: true,
    });
    
    const config: PumpConfig = {
      pumpType: 'condenser',
      numberOfPumps: result.numberOfPumps,
      flowPerPumpGpm: result.flowPerPumpGpm,
      headFt: result.headFt,
      motorHp: result.motorHp,
      motorKw: result.motorKw,
      hasVfd: false, // CW pumps typically constant flow
      redundancy: true,
    };
    onCondenserPumpConfigChange(config);
    
    return result;
  }, [cwFlowGpm, numberOfChillers, chillerType]);
  
  // Header pipe sizing
  useMemo(() => {
    const chwSupply = calculateHeaderPipe({ flowGpm: chwFlowGpm, fluidType: 'chw' });
    const cwSupply = chillerType === 'water-cooled' 
      ? calculateHeaderPipe({ flowGpm: cwFlowGpm, fluidType: 'cw' })
      : null;
    
    const config: HeaderPipeConfig = {
      chwSupplySize: chwSupply.pipeSizeIn,
      chwReturnSize: chwSupply.pipeSizeIn,
      cwSupplySize: cwSupply?.pipeSizeIn || 0,
      cwReturnSize: cwSupply?.pipeSizeIn || 0,
    };
    onHeaderPipeConfigChange(config);
  }, [chwFlowGpm, cwFlowGpm, chillerType]);
  
  const renderPumpCard = (
    title: string,
    icon: React.ReactNode,
    result: PumpSizingResult | null,
    hasVfd: boolean,
    colorClass: string
  ) => {
    if (!result) return null;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className={`${colorClass} rounded-lg p-3 text-center`}>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="text-xl font-bold">{result.numberOfPumps}</p>
              <p className="text-xs text-muted-foreground">({result.runningPumps} duty + 1 standby)</p>
            </div>
            
            <div className={`${colorClass} rounded-lg p-3 text-center`}>
              <p className="text-xs text-muted-foreground">Flow/Pump</p>
              <p className="text-xl font-bold">{result.flowPerPumpGpm}</p>
              <p className="text-xs text-muted-foreground">GPM</p>
            </div>
            
            <div className={`${colorClass} rounded-lg p-3 text-center`}>
              <p className="text-xs text-muted-foreground">Head</p>
              <p className="text-xl font-bold">{result.headFt}</p>
              <p className="text-xs text-muted-foreground">ft</p>
            </div>
            
            <div className={`${colorClass} rounded-lg p-3 text-center`}>
              <p className="text-xs text-muted-foreground">Motor</p>
              <p className="text-xl font-bold">{result.motorHp}</p>
              <p className="text-xs text-muted-foreground">HP</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between p-2 bg-muted/30 rounded">
            <span className="text-sm">VFD Control</span>
            <Badge variant={hasVfd ? 'default' : 'secondary'}>
              {hasVfd ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Pumping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Pumping Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pumping Arrangement</Label>
            <Select
              value={pumpingConfig}
              onValueChange={(value: 'primary-only' | 'primary-secondary' | 'variable-primary') => onPumpingConfigChange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary-only">Primary-Only (Constant Flow)</SelectItem>
                <SelectItem value="primary-secondary">Primary-Secondary (Variable Flow)</SelectItem>
                <SelectItem value="variable-primary">Variable Primary Flow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            {pumpingConfig === 'primary-only' && (
              <p className="text-sm text-muted-foreground">
                Simple system with constant flow through chillers. Best for smaller plants or those with consistent loads. 
                Lower first cost but less efficient at part load.
              </p>
            )}
            {pumpingConfig === 'primary-secondary' && (
              <p className="text-sm text-muted-foreground">
                Decoupled loops with constant primary flow and variable secondary flow. Most common configuration.
                Provides optimal chiller efficiency and building distribution flexibility.
              </p>
            )}
            {pumpingConfig === 'variable-primary' && (
              <p className="text-sm text-muted-foreground">
                Single set of variable flow pumps serving both chillers and building. Lowest pump energy.
                Requires chillers rated for variable flow and bypass control.
              </p>
            )}
          </div>
          
          {/* Flow Summary */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">CHW Flow</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(chwFlowGpm)}</p>
              <p className="text-xs text-muted-foreground">GPM</p>
            </div>
            
            {chillerType === 'water-cooled' && (
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">CW Flow</p>
                <p className="text-2xl font-bold text-orange-600">{Math.round(cwFlowGpm)}</p>
                <p className="text-xs text-muted-foreground">GPM</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Pump Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderPumpCard(
          'Primary CHW Pumps',
          <Droplets className="h-5 w-5 text-blue-500" />,
          primaryPumpResult,
          pumpingConfig === 'variable-primary',
          'bg-blue-50 dark:bg-blue-950/30'
        )}
        
        {pumpingConfig === 'primary-secondary' && renderPumpCard(
          'Secondary CHW Pumps',
          <Droplets className="h-5 w-5 text-cyan-500" />,
          secondaryPumpResult,
          true,
          'bg-cyan-50 dark:bg-cyan-950/30'
        )}
        
        {chillerType === 'water-cooled' && renderPumpCard(
          'Condenser Water Pumps',
          <Droplets className="h-5 w-5 text-orange-500" />,
          condenserPumpResult,
          false,
          'bg-orange-50 dark:bg-orange-950/30'
        )}
      </div>
      
      {/* Total Pump Power */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Total Pump Power
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Primary</p>
              <p className="text-xl font-bold">
                {primaryPumpResult ? (primaryPumpResult.motorKw * primaryPumpResult.runningPumps).toFixed(1) : 0} kW
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Secondary</p>
              <p className="text-xl font-bold">
                {secondaryPumpResult ? (secondaryPumpResult.motorKw * secondaryPumpResult.runningPumps).toFixed(1) : 0} kW
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Condenser</p>
              <p className="text-xl font-bold">
                {condenserPumpResult ? (condenserPumpResult.motorKw * condenserPumpResult.runningPumps).toFixed(1) : 0} kW
              </p>
            </div>
            
            <div className="text-center bg-primary/10 rounded-lg p-2">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-primary">
                {(
                  (primaryPumpResult ? primaryPumpResult.motorKw * primaryPumpResult.runningPumps : 0) +
                  (secondaryPumpResult ? secondaryPumpResult.motorKw * secondaryPumpResult.runningPumps : 0) +
                  (condenserPumpResult ? condenserPumpResult.motorKw * condenserPumpResult.runningPumps : 0)
                ).toFixed(1)} kW
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
