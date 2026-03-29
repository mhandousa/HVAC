import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wind, Thermometer, Droplets, AlertCircle } from 'lucide-react';
import { calculateHeatRejection, calculateCoolingTower, calculateCwFlow } from '@/lib/chilled-water-plant-calculations';
import type { CoolingTowerConfig } from '@/hooks/useChilledWaterPlants';

interface CoolingTowerPanelProps {
  designLoadTons: number;
  diversityFactor: number;
  cwDeltaT: number;
  chillerType: 'water-cooled' | 'air-cooled';
  approachF: number;
  wetBulbF: number;
  numberOfCells: number | null;
  onApproachChange: (value: number) => void;
  onWetBulbChange: (value: number) => void;
  onNumberOfCellsChange: (value: number | null) => void;
  onCoolingTowerConfigChange: (config: CoolingTowerConfig | null) => void;
}

export function CoolingTowerPanel({
  designLoadTons,
  diversityFactor,
  cwDeltaT,
  chillerType,
  approachF,
  wetBulbF,
  numberOfCells,
  onApproachChange,
  onWetBulbChange,
  onNumberOfCellsChange,
  onCoolingTowerConfigChange,
}: CoolingTowerPanelProps) {
  
  // If air-cooled, no cooling tower needed
  if (chillerType === 'air-cooled') {
    onCoolingTowerConfigChange(null);
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Wind className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Cooling Tower Not Required</p>
            <p className="text-sm mt-2">
              Air-cooled chillers reject heat directly to the atmosphere and do not require cooling towers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const diversifiedLoad = designLoadTons * diversityFactor;
  const heatRejectionTons = calculateHeatRejection(diversifiedLoad);
  const cwFlowGpm = calculateCwFlow(diversifiedLoad);
  
  // Calculate cooling tower sizing
  const towerResult = useMemo(() => {
    if (diversifiedLoad <= 0) return null;
    
    const result = calculateCoolingTower({
      heatRejectionTons,
      approachF,
      rangeF: cwDeltaT,
      wetBulbF,
      numberOfCells: numberOfCells || undefined,
    });
    
    const config: CoolingTowerConfig = {
      numberOfCells: result.numberOfCells,
      capacityPerCellTons: result.capacityPerCellTons,
      totalCapacityTons: result.totalCapacityTons,
      approachF: approachF,
      rangeF: cwDeltaT,
      designWetBulbF: wetBulbF,
      fanHpPerCell: Math.round(result.estimatedFanHp / result.numberOfCells),
      totalFanKw: result.estimatedFanKw,
    };
    onCoolingTowerConfigChange(config);
    
    return result;
  }, [diversifiedLoad, heatRejectionTons, approachF, cwDeltaT, wetBulbF, numberOfCells]);
  
  return (
    <div className="space-y-6">
      {/* Design Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Design Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="wetBulb">Design Wet Bulb (°F)</Label>
              <Input
                id="wetBulb"
                type="number"
                value={wetBulbF}
                onChange={(e) => onWetBulbChange(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Local 1% design wet bulb temperature
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approach">Approach (°F)</Label>
              <Input
                id="approach"
                type="number"
                min={3}
                max={15}
                value={approachF}
                onChange={(e) => onApproachChange(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Leaving water temp - wet bulb (typical: 5-10°F)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="range">Range (°F)</Label>
              <Input
                id="range"
                type="number"
                value={cwDeltaT}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                From condenser water delta-T
              </p>
            </div>
          </div>
          
          {/* Temperature Diagram */}
          {towerResult && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Hot Water In</p>
                  <p className="text-xl font-bold text-red-600">{towerResult.enteringWaterTempF}°F</p>
                </div>
                
                <div className="flex-1 mx-4 relative">
                  <div className="h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                    <Wind className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-1">Evaporative Cooling</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Cold Water Out</p>
                  <p className="text-xl font-bold text-blue-600">{towerResult.leavingWaterTempF}°F</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Heat Rejection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Heat Rejection Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Chiller Load</p>
              <p className="text-2xl font-bold">{Math.round(diversifiedLoad)}</p>
              <p className="text-xs text-muted-foreground">tons</p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Heat Rejection</p>
              <p className="text-2xl font-bold text-red-600">{Math.round(heatRejectionTons)}</p>
              <p className="text-xs text-muted-foreground">tons (×1.25)</p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">CW Flow</p>
              <p className="text-2xl font-bold text-orange-600">{Math.round(cwFlowGpm)}</p>
              <p className="text-xs text-muted-foreground">GPM</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tower Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tower Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Number of Cells</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="Auto"
                  value={numberOfCells || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    onNumberOfCellsChange(val);
                  }}
                />
                {numberOfCells === null && (
                  <Badge variant="outline">Auto: {towerResult?.numberOfCells || '-'}</Badge>
                )}
              </div>
            </div>
          </div>
          
          {towerResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Cells</p>
                <p className="text-2xl font-bold">{towerResult.numberOfCells}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Each Cell</p>
                <p className="text-2xl font-bold">{towerResult.capacityPerCellTons}</p>
                <p className="text-xs text-muted-foreground">tons</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-green-600">{towerResult.totalCapacityTons}</p>
                <p className="text-xs text-muted-foreground">tons</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Fan Power</p>
                <p className="text-2xl font-bold">{towerResult.estimatedFanKw}</p>
                <p className="text-xs text-muted-foreground">kW total</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Cooling Tower Schedule */}
      {towerResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cooling Tower Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Tag</th>
                    <th className="text-right p-2">Capacity (Tons)</th>
                    <th className="text-right p-2">Flow (GPM)</th>
                    <th className="text-right p-2">Fan HP</th>
                    <th className="text-center p-2">EWT/LWT</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: towerResult.numberOfCells }, (_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 font-mono">CT-{String(i + 1).padStart(2, '0')}</td>
                      <td className="p-2 text-right">{towerResult.capacityPerCellTons}</td>
                      <td className="p-2 text-right">{Math.round(cwFlowGpm / towerResult.numberOfCells)}</td>
                      <td className="p-2 text-right">{Math.round(towerResult.estimatedFanHp / towerResult.numberOfCells)}</td>
                      <td className="p-2 text-center">{towerResult.enteringWaterTempF}°F / {towerResult.leavingWaterTempF}°F</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Notes */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="font-medium text-foreground">Saudi Arabia Considerations</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Design wet bulb for Riyadh: 72°F (22°C) at 1%</li>
                <li>Design wet bulb for Jeddah: 84°F (29°C) at 1%</li>
                <li>Consider drift eliminators for water conservation</li>
                <li>Size basin heaters if freeze protection is needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
