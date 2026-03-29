import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { METRIC_COLORS, getSeverity, SeverityInfo } from '@/lib/design-completeness-utils';

interface ZoneComparisonChartProps {
  zones: ZoneCompleteness[];
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  selectedZoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
}

interface ZoneChartDataPoint {
  name: string;
  fullName: string;
  zoneId: string;
  zoneType: string;
  areaSqm: number;
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
  completenessScore: number;
  severity: SeverityInfo;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ZoneChartDataPoint;
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
        {data.zoneType} • {data.areaSqm.toFixed(0)} m²
      </p>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.loadCalc }} />
          <span>Load Calc: {data.loadCalcCount === 1 ? 'Complete' : 'Missing'}</span>
          {data.loadCalcCount === 1 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.equipment }} />
          <span>Equipment: {data.equipmentCount === 1 ? 'Complete' : 'Missing'}</span>
          {data.equipmentCount === 1 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.distribution }} />
          <span>Distribution: {data.distributionCount === 1 ? 'Complete' : 'Missing'}</span>
          {data.distributionCount === 1 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.ventilation }} />
          <span>Ventilation: {data.ventilationCount === 1 ? 'Complete' : 'Missing'}</span>
          {data.ventilationCount === 1 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: METRIC_COLORS.erv }} />
          <span>ERV/HRV: {data.ervCount === 1 ? 'Complete' : 'Missing'}</span>
          {data.ervCount === 1 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
      </div>
      <div className="pt-2 border-t flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Overall:</span>
        <Badge 
          variant="outline" 
          className="text-[10px]"
          style={{ 
            backgroundColor: data.severity.bgColor, 
            color: data.severity.textColor,
            borderColor: data.severity.color
          }}
        >
          {data.completenessScore}% - {data.severity.label}
        </Badge>
      </div>
    </div>
  );
};

export function ZoneComparisonChart({
  zones,
  selectedBuildingId,
  selectedFloorId,
  selectedZoneId,
  onZoneSelect,
}: ZoneComparisonChartProps) {
  const [viewMode, setViewMode] = useState<'percent' | 'status'>('percent');
  
  const chartData = useMemo(() => {
    if (!selectedFloorId) return { zones: [], floorName: '', buildingName: '' };
    
    const floorZones = zones.filter(z => z.floorId === selectedFloorId);
    const floorName = floorZones[0]?.floorName || '';
    const buildingName = floorZones[0]?.buildingName || '';
    
    const zoneData = floorZones
      .sort((a, b) => a.zoneName.localeCompare(b.zoneName))
      .map((zone): ZoneChartDataPoint => ({
        name: zone.zoneName.length > 10 ? zone.zoneName.substring(0, 8) + '...' : zone.zoneName,
        fullName: zone.zoneName,
        zoneId: zone.zoneId,
        zoneType: zone.zoneType,
        areaSqm: zone.areaSqm,
        loadCalcPercent: zone.hasLoadCalculation ? 100 : 0,
        equipmentPercent: zone.hasEquipmentSelection ? 100 : 0,
        distributionPercent: zone.hasDistributionSystem ? 100 : 0,
        ventilationPercent: zone.hasVentilationCalc ? 100 : 0,
        ervPercent: zone.hasERVSizing ? 100 : 0,
        loadCalcCount: zone.hasLoadCalculation ? 1 : 0,
        equipmentCount: zone.hasEquipmentSelection ? 1 : 0,
        distributionCount: zone.hasDistributionSystem ? 1 : 0,
        ventilationCount: zone.hasVentilationCalc ? 1 : 0,
        ervCount: zone.hasERVSizing ? 1 : 0,
        completenessScore: zone.completenessScore,
        severity: getSeverity(zone.completenessScore),
      }));
    
    return { zones: zoneData, floorName, buildingName };
  }, [zones, selectedFloorId]);

  if (!selectedFloorId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Zone Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Select a floor to compare zones
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.zones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Zone Comparison: {chartData.floorName}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No zones available on this floor
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
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Zone Comparison: {chartData.floorName}</CardTitle>
              <CardDescription>{chartData.buildingName} • {chartData.zones.length} zones</CardDescription>
            </div>
          </div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'percent' | 'status')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percentage</SelectItem>
              <SelectItem value="status">Status View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData.zones} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Bar 
              dataKey="loadCalcPercent"
              name="Load Calculation"
              fill={METRIC_COLORS.loadCalc}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onZoneSelect(data.zoneId)}
            >
              {chartData.zones.map((entry) => (
                <Cell
                  key={`loadCalc-${entry.zoneId}`}
                  opacity={selectedZoneId === entry.zoneId ? 1 : 0.7}
                  strokeWidth={selectedZoneId === entry.zoneId ? 2 : 0}
                  stroke={selectedZoneId === entry.zoneId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="equipmentPercent"
              name="Equipment Selection"
              fill={METRIC_COLORS.equipment}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onZoneSelect(data.zoneId)}
            >
              {chartData.zones.map((entry) => (
                <Cell
                  key={`equipment-${entry.zoneId}`}
                  opacity={selectedZoneId === entry.zoneId ? 1 : 0.7}
                  strokeWidth={selectedZoneId === entry.zoneId ? 2 : 0}
                  stroke={selectedZoneId === entry.zoneId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="distributionPercent"
              name="Distribution System"
              fill={METRIC_COLORS.distribution}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onZoneSelect(data.zoneId)}
            >
              {chartData.zones.map((entry) => (
                <Cell
                  key={`distribution-${entry.zoneId}`}
                  opacity={selectedZoneId === entry.zoneId ? 1 : 0.7}
                  strokeWidth={selectedZoneId === entry.zoneId ? 2 : 0}
                  stroke={selectedZoneId === entry.zoneId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="ventilationPercent"
              name="Ventilation (62.1)"
              fill={METRIC_COLORS.ventilation}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onZoneSelect(data.zoneId)}
            >
              {chartData.zones.map((entry) => (
                <Cell
                  key={`ventilation-${entry.zoneId}`}
                  opacity={selectedZoneId === entry.zoneId ? 1 : 0.7}
                  strokeWidth={selectedZoneId === entry.zoneId ? 2 : 0}
                  stroke={selectedZoneId === entry.zoneId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar 
              dataKey="ervPercent"
              name="ERV/HRV Sizing"
              fill={METRIC_COLORS.erv}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => onZoneSelect(data.zoneId)}
            >
              {chartData.zones.map((entry) => (
                <Cell
                  key={`erv-${entry.zoneId}`}
                  opacity={selectedZoneId === entry.zoneId ? 1 : 0.7}
                  strokeWidth={selectedZoneId === entry.zoneId ? 2 : 0}
                  stroke={selectedZoneId === entry.zoneId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Zone Status Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {chartData.zones.map((zone) => (
            <button
              key={zone.zoneId}
              onClick={() => onZoneSelect(zone.zoneId)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                selectedZoneId === zone.zoneId 
                  ? 'ring-2 ring-primary ring-offset-1' 
                  : 'hover:opacity-80'
              }`}
              style={{ 
                backgroundColor: zone.severity.bgColor, 
                color: zone.severity.textColor 
              }}
            >
              {zone.completenessScore === 100 && <CheckCircle2 className="h-3 w-3" />}
              {zone.fullName}: {zone.completenessScore}%
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
