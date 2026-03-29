import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Volume2 } from 'lucide-react';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { useFloorAcousticSummary } from '@/hooks/useFloorAcousticSummary';
import { FloorAcousticDrilldownPanel } from './FloorAcousticDrilldownPanel';
import { cn } from '@/lib/utils';

interface BuildingAcousticComparisonChartProps {
  zones: ZoneAcousticData[];
  buildings: { id: string; name: string }[];
  floors: { id: string; name: string; buildingId?: string }[];
  selectedBuildingId: string | null;
  onBuildingSelect?: (buildingId: string) => void;
  onFloorSelect?: (floorId: string) => void;
}

interface ChartDataPoint {
  name: string;
  fullName: string;
  buildingId: string;
  acceptablePercent: number;
  marginalPercent: number;
  exceedsPercent: number;
  noDataPercent: number;
  acceptableCount: number;
  marginalCount: number;
  exceedsCount: number;
  noDataCount: number;
  totalZones: number;
  worstDelta: number;
  compliancePercent: number;
}

const ACOUSTIC_STATUS_COLORS = {
  acceptable: 'hsl(142, 71%, 45%)',    // Green
  marginal: 'hsl(45, 93%, 47%)',       // Amber
  exceeds: 'hsl(0, 72%, 51%)',         // Red
  noData: 'hsl(220, 14%, 75%)',        // Gray
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 space-y-2">
      <p className="font-semibold">{data.fullName}</p>
      <p className="text-xs text-muted-foreground">{data.totalZones} total zones</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.acceptable }} />
          <span>Acceptable: {data.acceptableCount} ({data.acceptablePercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.marginal }} />
          <span>Marginal: {data.marginalCount} ({data.marginalPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.exceeds }} />
          <span>Exceeding: {data.exceedsCount} ({data.exceedsPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.noData }} />
          <span>No Data: {data.noDataCount} ({data.noDataPercent}%)</span>
        </div>
      </div>
      {data.worstDelta > 0 && (
        <p className="text-xs text-destructive border-t pt-2">
          Worst NC exceedance: +{data.worstDelta} dB
        </p>
      )}
    </div>
  );
};

export function BuildingAcousticComparisonChart({
  zones,
  buildings,
  floors,
  selectedBuildingId,
  onBuildingSelect,
  onFloorSelect,
}: BuildingAcousticComparisonChartProps) {
  const [viewMode, setViewMode] = useState<'percent' | 'count'>('percent');
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);
  const [floorSortBy, setFloorSortBy] = useState<'name' | 'compliance' | 'worstDelta'>('compliance');

  // Get floor-level data for drill-down
  const { byBuilding: floorsByBuilding } = useFloorAcousticSummary(zones, floors, buildings);

  const chartData = useMemo(() => {
    // Create floor -> building mapping
    const floorToBuildingMap = new Map<string, string>();
    floors.forEach(floor => {
      if (floor.buildingId) {
        floorToBuildingMap.set(floor.id, floor.buildingId);
      }
    });

    // Aggregate by building
    const buildingStats = new Map<string, {
      id: string;
      name: string;
      acceptable: number;
      marginal: number;
      exceeds: number;
      noData: number;
      total: number;
      worstDelta: number;
    }>();

    buildings.forEach(building => {
      buildingStats.set(building.id, {
        id: building.id,
        name: building.name,
        acceptable: 0,
        marginal: 0,
        exceeds: 0,
        noData: 0,
        total: 0,
        worstDelta: 0,
      });
    });

    zones.forEach(zone => {
      const buildingId = floorToBuildingMap.get(zone.floorId);
      if (!buildingId) return;

      const stats = buildingStats.get(buildingId);
      if (!stats) return;

      stats.total++;

      switch (zone.status) {
        case 'acceptable':
          stats.acceptable++;
          break;
        case 'marginal':
          stats.marginal++;
          break;
        case 'exceeds':
          stats.exceeds++;
          break;
        case 'no-data':
          stats.noData++;
          break;
      }

      if (zone.ncDelta > stats.worstDelta) {
        stats.worstDelta = zone.ncDelta;
      }
    });

    return Array.from(buildingStats.values())
      .filter(b => b.total > 0)
      .map((building): ChartDataPoint => ({
        name: building.name.length > 15 ? building.name.substring(0, 12) + '...' : building.name,
        fullName: building.name,
        buildingId: building.id,
        acceptablePercent: building.total > 0 ? Math.round((building.acceptable / building.total) * 100) : 0,
        marginalPercent: building.total > 0 ? Math.round((building.marginal / building.total) * 100) : 0,
        exceedsPercent: building.total > 0 ? Math.round((building.exceeds / building.total) * 100) : 0,
        noDataPercent: building.total > 0 ? Math.round((building.noData / building.total) * 100) : 0,
        acceptableCount: building.acceptable,
        marginalCount: building.marginal,
        exceedsCount: building.exceeds,
        noDataCount: building.noData,
        totalZones: building.total,
        worstDelta: building.worstDelta,
        compliancePercent: building.total > 0 
          ? Math.round((building.acceptable / (building.total - building.noData || 1)) * 100)
          : 100,
      }))
      .sort((a, b) => a.compliancePercent - b.compliancePercent);
  }, [zones, buildings, floors]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Building NC Compliance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No buildings with acoustic data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBarClick = (data: ChartDataPoint) => {
    // Toggle floor drill-down
    if (expandedBuildingId === data.buildingId) {
      setExpandedBuildingId(null);
    } else {
      setExpandedBuildingId(data.buildingId);
    }
    // Also notify parent
    if (onBuildingSelect) {
      onBuildingSelect(data.buildingId);
    }
  };

  const expandedBuilding = expandedBuildingId 
    ? buildings.find(b => b.id === expandedBuildingId)
    : null;
  const expandedFloors = expandedBuildingId 
    ? floorsByBuilding[expandedBuildingId] || []
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-primary" />
            <div>
            <CardTitle className="text-lg">Building NC Compliance</CardTitle>
              <CardDescription>Click a building to view floor-level breakdown</CardDescription>
            </div>
          </div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'percent' | 'count')}>
            <SelectTrigger className="w-[130px]">
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 5 }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, viewMode === 'percent' ? 100 : 'auto']}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickFormatter={(value) => viewMode === 'percent' ? `${value}%` : value}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              width={75}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            <Bar
              dataKey={viewMode === 'percent' ? 'acceptablePercent' : 'acceptableCount'}
              name="Acceptable"
              stackId="a"
              fill={ACOUSTIC_STATUS_COLORS.acceptable}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={expandedBuildingId === entry.buildingId || selectedBuildingId === entry.buildingId ? 1 : 0.8}
                  strokeWidth={expandedBuildingId === entry.buildingId ? 2 : 0}
                  stroke={expandedBuildingId === entry.buildingId ? 'hsl(var(--primary))' : undefined}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === 'percent' ? 'marginalPercent' : 'marginalCount'}
              name="Marginal"
              stackId="a"
              fill={ACOUSTIC_STATUS_COLORS.marginal}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={expandedBuildingId === entry.buildingId || selectedBuildingId === entry.buildingId ? 1 : 0.8}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === 'percent' ? 'exceedsPercent' : 'exceedsCount'}
              name="Exceeding"
              stackId="a"
              fill={ACOUSTIC_STATUS_COLORS.exceeds}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={expandedBuildingId === entry.buildingId || selectedBuildingId === entry.buildingId ? 1 : 0.8}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === 'percent' ? 'noDataPercent' : 'noDataCount'}
              name="No Data"
              stackId="a"
              fill={ACOUSTIC_STATUS_COLORS.noData}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={expandedBuildingId === entry.buildingId || selectedBuildingId === entry.buildingId ? 1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Expand hint */}
        {!expandedBuildingId && chartData.length > 0 && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
            <ChevronDown className="h-3 w-3" />
            <span>Click a building bar to view floor breakdown</span>
          </div>
        )}
      </CardContent>

      {/* Floor Drill-down Panel */}
      {expandedBuilding && expandedFloors.length > 0 && (
        <FloorAcousticDrilldownPanel
          buildingName={expandedBuilding.name}
          floors={expandedFloors}
          onClose={() => setExpandedBuildingId(null)}
          onFloorSelect={onFloorSelect}
          sortBy={floorSortBy}
          onSortChange={setFloorSortBy}
        />
      )}
    </Card>
  );
}
