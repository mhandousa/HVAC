import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import type { ChilledWaterPlant } from '@/hooks/useChilledWaterPlants';
import { useChilledWaterPlantExport } from '@/hooks/useChilledWaterPlantExport';

interface PlantSummaryReportProps {
  plant: ChilledWaterPlant;
  projectName?: string;
}

export function PlantSummaryReport({ plant, projectName }: PlantSummaryReportProps) {
  const { exportToPdf, exportToExcel } = useChilledWaterPlantExport();
  
  const totalPumpPowerKw = 
    (plant.primary_pump_config?.motorKw || 0) * ((plant.primary_pump_config?.numberOfPumps || 0) - 1) +
    (plant.secondary_pump_config?.motorKw || 0) * ((plant.secondary_pump_config?.numberOfPumps || 0) - 1) +
    (plant.condenser_pump_config?.motorKw || 0) * ((plant.condenser_pump_config?.numberOfPumps || 0) - 1);
  
  const towerFanPowerKw = plant.cooling_tower_config?.totalFanKw || 0;
  
  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{plant.plant_name}</h2>
          {plant.plant_tag && (
            <p className="text-sm text-muted-foreground">Tag: {plant.plant_tag}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToPdf(plant, projectName)}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportToExcel(plant, projectName)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Design Load</p>
            <p className="text-3xl font-bold">{plant.design_cooling_load_tons}</p>
            <p className="text-xs text-muted-foreground">tons</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Installed Capacity</p>
            <p className="text-3xl font-bold text-green-600">{plant.total_installed_capacity_tons || '-'}</p>
            <p className="text-xs text-muted-foreground">tons</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Total Pump Power</p>
            <p className="text-3xl font-bold">{totalPumpPowerKw.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kW</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Tower Fan Power</p>
            <p className="text-3xl font-bold">{towerFanPowerKw.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">kW</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Equipment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Equipment</th>
                  <th className="text-center p-3">Qty</th>
                  <th className="text-right p-3">Capacity</th>
                  <th className="text-right p-3">Flow (GPM)</th>
                  <th className="text-right p-3">Power</th>
                  <th className="text-center p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {/* Chillers */}
                {plant.chiller_config && (
                  <tr className="border-b">
                    <td className="p-3 font-medium">
                      {plant.chiller_config.chillerType === 'water-cooled' ? 'Water-Cooled Chiller' : 'Air-Cooled Chiller'}
                    </td>
                    <td className="p-3 text-center">{plant.chiller_config.numberOfChillers}</td>
                    <td className="p-3 text-right">{plant.chiller_config.capacityPerChillerTons} tons ea.</td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right">~{Math.round(plant.chiller_config.capacityPerChillerTons * 0.6)} kW ea.</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{plant.chiller_config.redundancyMode?.toUpperCase()}</Badge>
                    </td>
                  </tr>
                )}
                
                {/* Primary Pumps */}
                {plant.primary_pump_config && (
                  <tr className="border-b">
                    <td className="p-3 font-medium">Primary CHW Pump</td>
                    <td className="p-3 text-center">{plant.primary_pump_config.numberOfPumps}</td>
                    <td className="p-3 text-right">{plant.primary_pump_config.headFt} ft head</td>
                    <td className="p-3 text-right">{plant.primary_pump_config.flowPerPumpGpm}</td>
                    <td className="p-3 text-right">{plant.primary_pump_config.motorHp} HP</td>
                    <td className="p-3 text-center">
                      {plant.primary_pump_config.hasVfd && <Badge>VFD</Badge>}
                    </td>
                  </tr>
                )}
                
                {/* Secondary Pumps */}
                {plant.secondary_pump_config && Object.keys(plant.secondary_pump_config).length > 0 && (
                  <tr className="border-b">
                    <td className="p-3 font-medium">Secondary CHW Pump</td>
                    <td className="p-3 text-center">{plant.secondary_pump_config.numberOfPumps}</td>
                    <td className="p-3 text-right">{plant.secondary_pump_config.headFt} ft head</td>
                    <td className="p-3 text-right">{plant.secondary_pump_config.flowPerPumpGpm}</td>
                    <td className="p-3 text-right">{plant.secondary_pump_config.motorHp} HP</td>
                    <td className="p-3 text-center">
                      {plant.secondary_pump_config.hasVfd && <Badge>VFD</Badge>}
                    </td>
                  </tr>
                )}
                
                {/* Condenser Pumps */}
                {plant.condenser_pump_config && Object.keys(plant.condenser_pump_config).length > 0 && (
                  <tr className="border-b">
                    <td className="p-3 font-medium">Condenser Water Pump</td>
                    <td className="p-3 text-center">{plant.condenser_pump_config.numberOfPumps}</td>
                    <td className="p-3 text-right">{plant.condenser_pump_config.headFt} ft head</td>
                    <td className="p-3 text-right">{plant.condenser_pump_config.flowPerPumpGpm}</td>
                    <td className="p-3 text-right">{plant.condenser_pump_config.motorHp} HP</td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                )}
                
                {/* Cooling Towers */}
                {plant.cooling_tower_config && Object.keys(plant.cooling_tower_config).length > 0 && (
                  <tr className="border-b">
                    <td className="p-3 font-medium">Cooling Tower</td>
                    <td className="p-3 text-center">{plant.cooling_tower_config.numberOfCells} cells</td>
                    <td className="p-3 text-right">{plant.cooling_tower_config.capacityPerCellTons} tons/cell</td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right">{plant.cooling_tower_config.totalFanKw} kW</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">
                        {plant.cooling_tower_config.approachF}°F approach
                      </Badge>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Header Pipe Sizes */}
      {plant.header_pipe_config && Object.keys(plant.header_pipe_config).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Header Pipe Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">CHW Supply</p>
                <p className="text-2xl font-bold text-blue-600">{plant.header_pipe_config.chwSupplySize}"</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">CHW Return</p>
                <p className="text-2xl font-bold text-blue-400">{plant.header_pipe_config.chwReturnSize}"</p>
              </div>
              {plant.header_pipe_config.cwSupplySize > 0 && (
                <>
                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">CW Supply</p>
                    <p className="text-2xl font-bold text-orange-600">{plant.header_pipe_config.cwSupplySize}"</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">CW Return</p>
                    <p className="text-2xl font-bold text-orange-400">{plant.header_pipe_config.cwReturnSize}"</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Design Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Design Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Diversity Factor</p>
              <p className="font-medium">{plant.diversity_factor || 1.0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Future Expansion</p>
              <p className="font-medium">{plant.future_expansion_percent || 0}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">CHW Temps</p>
              <p className="font-medium">{plant.chw_supply_temp_f || 44}°F / {plant.chw_return_temp_f || 54}°F</p>
            </div>
            <div>
              <p className="text-muted-foreground">CW Temps</p>
              <p className="font-medium">{plant.cw_supply_temp_f || 85}°F / {plant.cw_return_temp_f || 95}°F</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pumping Config</p>
              <p className="font-medium capitalize">{plant.pumping_config?.replace('-', ' ') || 'Primary-Secondary'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Redundancy</p>
              <p className="font-medium">{plant.redundancy_mode?.toUpperCase() || 'N+1'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={plant.status === 'issued' ? 'default' : 'outline'}>
                {plant.status?.toUpperCase() || 'DRAFT'}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Revision</p>
              <p className="font-medium">{plant.revision || 'A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Notes */}
      {plant.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{plant.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
