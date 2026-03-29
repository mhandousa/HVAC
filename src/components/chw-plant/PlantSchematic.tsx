import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChillerConfig, PumpConfig, CoolingTowerConfig } from '@/hooks/useChilledWaterPlants';

interface PlantSchematicProps {
  chillerConfig: ChillerConfig | null;
  primaryPumpConfig: PumpConfig | null;
  secondaryPumpConfig: PumpConfig | null;
  condenserPumpConfig: PumpConfig | null;
  coolingTowerConfig: CoolingTowerConfig | null;
  pumpingConfig: 'primary-only' | 'primary-secondary' | 'variable-primary';
}

export function PlantSchematic({
  chillerConfig,
  primaryPumpConfig,
  secondaryPumpConfig,
  condenserPumpConfig,
  coolingTowerConfig,
  pumpingConfig,
}: PlantSchematicProps) {
  const isWaterCooled = chillerConfig?.chillerType === 'water-cooled';
  const hasBypass = pumpingConfig === 'primary-secondary';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Plant Schematic</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox="0 0 800 450"
            className="w-full h-auto min-w-[600px]"
            style={{ maxHeight: '500px' }}
          >
            {/* Background */}
            <rect width="800" height="450" fill="transparent" />
            
            {/* Title */}
            <text x="400" y="25" textAnchor="middle" className="fill-foreground text-sm font-medium">
              {pumpingConfig === 'primary-secondary' ? 'Primary-Secondary CHW System' : 
               pumpingConfig === 'variable-primary' ? 'Variable Primary Flow System' : 
               'Primary-Only CHW System'}
            </text>
            
            {/* Cooling Tower (if water-cooled) */}
            {isWaterCooled && coolingTowerConfig && (
              <g transform="translate(600, 60)">
                {/* Tower body */}
                <rect x="0" y="0" width="120" height="80" rx="4" className="fill-muted stroke-border" strokeWidth="2" />
                <text x="60" y="95" textAnchor="middle" className="fill-foreground text-xs">
                  Cooling Tower
                </text>
                <text x="60" y="110" textAnchor="middle" className="fill-muted-foreground text-xs">
                  {coolingTowerConfig.numberOfCells} cells × {coolingTowerConfig.capacityPerCellTons}T
                </text>
                
                {/* Fan symbols */}
                {Array.from({ length: Math.min(coolingTowerConfig.numberOfCells, 3) }, (_, i) => (
                  <g key={i} transform={`translate(${20 + i * 35}, 15)`}>
                    <circle cx="15" cy="15" r="12" className="fill-background stroke-primary" strokeWidth="2" />
                    <line x1="15" y1="3" x2="15" y2="27" className="stroke-primary" strokeWidth="1.5" />
                    <line x1="3" y1="15" x2="27" y2="15" className="stroke-primary" strokeWidth="1.5" />
                  </g>
                ))}
                
                {/* Water labels */}
                <text x="-10" y="20" textAnchor="end" className="fill-orange-500 text-xs">
                  {coolingTowerConfig.designWetBulbF + coolingTowerConfig.approachF + coolingTowerConfig.rangeF}°F
                </text>
                <text x="-10" y="70" textAnchor="end" className="fill-blue-500 text-xs">
                  {coolingTowerConfig.designWetBulbF + coolingTowerConfig.approachF}°F
                </text>
              </g>
            )}
            
            {/* Condenser Water Pumps (if water-cooled) */}
            {isWaterCooled && condenserPumpConfig && (
              <g transform="translate(480, 100)">
                {Array.from({ length: Math.min(condenserPumpConfig.numberOfPumps, 3) }, (_, i) => (
                  <g key={i} transform={`translate(0, ${i * 30})`}>
                    <circle cx="20" cy="15" r="12" className="fill-orange-100 dark:fill-orange-950 stroke-orange-500" strokeWidth="2" />
                    <text x="20" y="19" textAnchor="middle" className="fill-orange-600 text-xs font-bold">P</text>
                  </g>
                ))}
                <text x="20" y={Math.min(condenserPumpConfig.numberOfPumps, 3) * 30 + 15} textAnchor="middle" className="fill-muted-foreground text-xs">
                  CW Pumps
                </text>
              </g>
            )}
            
            {/* Chillers */}
            <g transform="translate(250, 150)">
              {chillerConfig && Array.from({ length: Math.min(chillerConfig.numberOfChillers, 3) }, (_, i) => (
                <g key={i} transform={`translate(0, ${i * 70})`}>
                  {/* Chiller box */}
                  <rect x="0" y="0" width="100" height="50" rx="4" className="fill-blue-100 dark:fill-blue-950 stroke-blue-500" strokeWidth="2" />
                  <text x="50" y="20" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300 text-xs font-medium">
                    CH-0{i + 1}
                  </text>
                  <text x="50" y="35" textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-xs">
                    {chillerConfig.capacityPerChillerTons}T
                  </text>
                  
                  {/* Evaporator side (left - CHW) */}
                  <line x1="-30" y1="15" x2="0" y2="15" className="stroke-blue-500" strokeWidth="3" />
                  <line x1="-30" y1="35" x2="0" y2="35" className="stroke-blue-300" strokeWidth="3" />
                  
                  {/* Condenser side (right - CW) */}
                  {isWaterCooled && (
                    <>
                      <line x1="100" y1="15" x2="130" y2="15" className="stroke-orange-500" strokeWidth="3" />
                      <line x1="100" y1="35" x2="130" y2="35" className="stroke-orange-300" strokeWidth="3" />
                    </>
                  )}
                </g>
              ))}
              
              {chillerConfig && chillerConfig.numberOfChillers > 3 && (
                <text x="50" y={3 * 70 + 20} textAnchor="middle" className="fill-muted-foreground text-xs">
                  +{chillerConfig.numberOfChillers - 3} more
                </text>
              )}
            </g>
            
            {/* Primary CHW Pumps */}
            <g transform="translate(120, 150)">
              {primaryPumpConfig && Array.from({ length: Math.min(primaryPumpConfig.numberOfPumps, 3) }, (_, i) => (
                <g key={i} transform={`translate(0, ${i * 70})`}>
                  <circle cx="20" cy="25" r="15" className="fill-blue-100 dark:fill-blue-950 stroke-blue-500" strokeWidth="2" />
                  <text x="20" y="30" textAnchor="middle" className="fill-blue-600 text-sm font-bold">P</text>
                  <line x1="35" y1="25" x2="60" y2="25" className="stroke-blue-500" strokeWidth="3" />
                </g>
              ))}
              <text x="20" y={Math.min(primaryPumpConfig?.numberOfPumps || 2, 3) * 70 + 20} textAnchor="middle" className="fill-muted-foreground text-xs">
                Primary
              </text>
            </g>
            
            {/* Decoupler / Bypass (for primary-secondary) */}
            {hasBypass && (
              <g transform="translate(60, 280)">
                <line x1="0" y1="0" x2="0" y2="60" className="stroke-cyan-500" strokeWidth="3" strokeDasharray="5,5" />
                <text x="5" y="35" className="fill-cyan-600 text-xs" transform="rotate(-90, 5, 35)">
                  Bypass
                </text>
              </g>
            )}
            
            {/* Secondary CHW Pumps (for primary-secondary) */}
            {hasBypass && secondaryPumpConfig && (
              <g transform="translate(20, 320)">
                {Array.from({ length: Math.min(secondaryPumpConfig.numberOfPumps, 3) }, (_, i) => (
                  <g key={i} transform={`translate(${i * 40}, 0)`}>
                    <circle cx="15" cy="15" r="12" className="fill-cyan-100 dark:fill-cyan-950 stroke-cyan-500" strokeWidth="2" />
                    <text x="15" y="19" textAnchor="middle" className="fill-cyan-600 text-xs font-bold">P</text>
                  </g>
                ))}
                <text x={Math.min(secondaryPumpConfig.numberOfPumps, 3) * 20} y="45" textAnchor="middle" className="fill-muted-foreground text-xs">
                  Secondary Pumps
                </text>
              </g>
            )}
            
            {/* Building Load */}
            <g transform="translate(20, 380)">
              <rect x="0" y="0" width="180" height="50" rx="4" className="fill-muted stroke-border" strokeWidth="2" />
              <text x="90" y="30" textAnchor="middle" className="fill-foreground text-sm">
                Building Load
              </text>
            </g>
            
            {/* CHW Supply/Return Headers */}
            <g>
              {/* Supply (cold - going to building) */}
              <line x1="60" y1="380" x2="60" y2="150" className="stroke-blue-500" strokeWidth="4" />
              <text x="45" y="270" className="fill-blue-500 text-xs" transform="rotate(-90, 45, 270)">
                CHW Supply
              </text>
              
              {/* Return (warm - from building) */}
              <line x1="140" y1="380" x2="140" y2="150" className="stroke-blue-300" strokeWidth="4" />
              <text x="155" y="270" className="fill-blue-400 text-xs" transform="rotate(-90, 155, 270)">
                CHW Return
              </text>
            </g>
            
            {/* CW Headers (if water-cooled) */}
            {isWaterCooled && (
              <g>
                {/* CW Supply (cold - from tower) */}
                <path d="M 660 140 L 660 200 L 380 200" className="stroke-blue-400" strokeWidth="3" fill="none" />
                
                {/* CW Return (hot - to tower) */}
                <path d="M 380 170 L 700 170 L 700 60" className="stroke-orange-400" strokeWidth="3" fill="none" />
              </g>
            )}
            
            {/* Legend */}
            <g transform="translate(600, 380)">
              <text x="0" y="0" className="fill-foreground text-xs font-medium">Legend:</text>
              <line x1="0" y1="15" x2="30" y2="15" className="stroke-blue-500" strokeWidth="3" />
              <text x="35" y="19" className="fill-muted-foreground text-xs">CHW Supply</text>
              <line x1="0" y1="30" x2="30" y2="30" className="stroke-blue-300" strokeWidth="3" />
              <text x="35" y="34" className="fill-muted-foreground text-xs">CHW Return</text>
              {isWaterCooled && (
                <>
                  <line x1="0" y1="45" x2="30" y2="45" className="stroke-orange-500" strokeWidth="3" />
                  <text x="35" y="49" className="fill-muted-foreground text-xs">CW Hot</text>
                  <line x1="0" y1="60" x2="30" y2="60" className="stroke-orange-300" strokeWidth="3" />
                  <text x="35" y="64" className="fill-muted-foreground text-xs">CW Cold</text>
                </>
              )}
            </g>
          </svg>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          Simplified schematic - actual installation may vary
        </p>
      </CardContent>
    </Card>
  );
}
