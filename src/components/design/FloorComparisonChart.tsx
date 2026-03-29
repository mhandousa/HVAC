import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Layers } from 'lucide-react';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { METRIC_COLORS } from '@/lib/design-completeness-utils';

interface FloorComparisonChartProps {
  zones: ZoneCompleteness[];
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
}

interface FloorChartDataPoint {
  name: string;
  fullName: string;
  floorId: string;
  buildingName: string;
  loadCalcPercent: number;
  equipmentPercent: number;
  distributionPercent: number;
  ventilationPercent: number;
  ervPercent: number;
  loadCalcCount: number;
  equipmentCount: number;
  distributionCount: number;
  ventilationCount: number;
  ervCount: number;
  totalZones: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: FloorChartDataPoint;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;
  
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 space-y-2">
      <p className="font-semibold">{data.fullName}</p>
      <p className="text-xs text-muted-foreground">
        {data.buildingName} • {data.totalZones} zones
      </p>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.loadCalc }} />
          <span>Load Calc: {data.loadCalcCount}/{data.totalZones} ({data.loadCalcPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.equipment }} />
          <span>Equipment: {data.equipmentCount}/{data.totalZones} ({data.equipmentPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.distribution }} />
          <span>Distribution: {data.distributionCount}/{data.totalZones} ({data.distributionPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.ventilation }} />
          <span>Ventilation: {data.ventilationCount}/{data.totalZones} ({data.ventilationPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.erv }} />
          <span>ERV/HRV: {data.ervCount}/{data.totalZones} ({data.ervPercent}%)</span>
        </div>
      </div>
    </div>
  );
};

export function FloorComparisonChart({
  zones,
  selectedBuildingId,
  selectedFloorId,
  onFloorSelect,
}: FloorComparisonChartProps) {
  const [viewMode, setViewMode] = useState<'percent' | 'count'>('percent');
  
  const chartData = useMemo(() => {
    if (!selectedBuildingId) return { floors: [], buildingName: '' };
    
    const buildingZones = zones.filter(z => z.buildingId === selectedBuildingId);
    const buildingName = buildingZones[0]?.buildingName || '';
    
    const floorMap = new Map<string, {
      id: string;
      name: string;
      zoneCount: number;
      zonesWithLoadCalc: number;
      zonesWithEquipment: number;
      zonesWithDistribution: number;
      zonesWithVentilation: number;
      zonesWithERV: number;
    }>();
    
    buildingZones.forEach(zone => {
      if (!floorMap.has(zone.floorId)) {
        floorMap.set(zone.floorId, {
          id: zone.floorId,
          name: zone.floorName,
          zoneCount: 0,
          zonesWithLoadCalc: 0,
          zonesWithEquipment: 0,
          zonesWithDistribution: 0,
          zonesWithVentilation: 0,
          zonesWithERV: 0,
        });
      }
      
      const floor = floorMap.get(zone.floorId)!;
      floor.zoneCount++;
      if (zone.hasLoadCalculation) floor.zonesWithLoadCalc++;
      if (zone.hasEquipmentSelection) floor.zonesWithEquipment++;
      if (zone.hasDistributionSystem) floor.zonesWithDistribution++;
      if (zone.hasVentilationCalc) floor.zonesWithVentilation++;
      if (zone.hasERVSizing) floor.zonesWithERV++;
    });
    
    const floors = Array.from(floorMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((floor): FloorChartDataPoint => ({
        name: floor.name.length > 12 ? floor.name.substring(0, 10) + '...' : floor.name,
        fullName: floor.name,
        floorId: floor.id,
        buildingName,
        loadCalcPercent: floor.zoneCount > 0 
          ? Math.round((floor.zonesWithLoadCalc / floor.zoneCount) * 100) : 0,
        equipmentPercent: floor.zoneCount > 0 
          ? Math.round((floor.zonesWithEquipment / floor.zoneCount) * 100) : 0,
        distributionPercent: floor.zoneCount > 0 
          ? Math.round((floor.zonesWithDistribution / floor.zoneCount) * 100) : 0,
        ventilationPercent: floor.zoneCount > 0 
          ? Math.round((floor.zonesWithVentilation / floor.zoneCount) * 100) : 0,
        ervPercent: floor.zoneCount > 0 
          ? Math.round((floor.zonesWithERV / floor.zoneCount) * 100) : 0,
        loadCalcCount: floor.zonesWithLoadCalc,
        equipmentCount: floor.zonesWithEquipment,
        distributionCount: floor.zonesWithDistribution,
        ventilationCount: floor.zonesWithVentilation,
        ervCount: floor.zonesWithERV,
        totalZones: floor.zoneCount,
      }));
    
    return { floors, buildingName };
  }, [zones, selectedBuildingId]);

  if (!selectedBuildingId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Floor Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Select a building to compare floors
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.floors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Floor Comparison: {chartData.buildingName}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No floors available in this building
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Floor Comparison: {chartData.buildingName}</CardTitle>
              <CardDescription>Compare design completion across floors</CardDescription>
            </div>
          </div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'percent' | 'count')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percentage</SelectItem>
              <SelectItem value="count">Zone Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData.floors} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis 
              domain={[0, viewMode === 'percent' ? 100 : 'auto']} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => viewMode === 'percent' ? `${value}%` : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Bar 
              dataKey={viewMode === 'percent' ? 'loadCalcPercent' : 'loadCalcCount'}
              name="Load Calculation"
              fill={METRIC_COLORS.loadCalc}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onFloorSelect(data.floorId)}
            >
              {chartData.floors.map((entry) => (
                <Cell
                  key={`loadCalc-${entry.floorId}`}
                  opacity={selectedFloorId === entry.floorId ? 1 : 0.7}
                  strokeWidth={selectedFloorId === entry.floorId ? 2 : 0}
                  stroke={selectedFloorId === entry.floorId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey={viewMode === 'percent' ? 'equipmentPercent' : 'equipmentCount'}
              name="Equipment Selection"
              fill={METRIC_COLORS.equipment}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onFloorSelect(data.floorId)}
            >
              {chartData.floors.map((entry) => (
                <Cell
                  key={`equipment-${entry.floorId}`}
                  opacity={selectedFloorId === entry.floorId ? 1 : 0.7}
                  strokeWidth={selectedFloorId === entry.floorId ? 2 : 0}
                  stroke={selectedFloorId === entry.floorId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey={viewMode === 'percent' ? 'distributionPercent' : 'distributionCount'}
              name="Distribution System"
              fill={METRIC_COLORS.distribution}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onFloorSelect(data.floorId)}
            >
              {chartData.floors.map((entry) => (
                <Cell
                  key={`distribution-${entry.floorId}`}
                  opacity={selectedFloorId === entry.floorId ? 1 : 0.7}
                  strokeWidth={selectedFloorId === entry.floorId ? 2 : 0}
                  stroke={selectedFloorId === entry.floorId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey={viewMode === 'percent' ? 'ventilationPercent' : 'ventilationCount'}
              name="Ventilation (62.1)"
              fill={METRIC_COLORS.ventilation}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onFloorSelect(data.floorId)}
            >
              {chartData.floors.map((entry) => (
                <Cell
                  key={`ventilation-${entry.floorId}`}
                  opacity={selectedFloorId === entry.floorId ? 1 : 0.7}
                  strokeWidth={selectedFloorId === entry.floorId ? 2 : 0}
                  stroke={selectedFloorId === entry.floorId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey={viewMode === 'percent' ? 'ervPercent' : 'ervCount'}
              name="ERV/HRV Sizing"
              fill={METRIC_COLORS.erv}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onFloorSelect(data.floorId)}
            >
              {chartData.floors.map((entry) => (
                <Cell
                  key={`erv-${entry.floorId}`}
                  opacity={selectedFloorId === entry.floorId ? 1 : 0.7}
                  strokeWidth={selectedFloorId === entry.floorId ? 2 : 0}
                  stroke={selectedFloorId === entry.floorId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
