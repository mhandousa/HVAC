import { useMemo, useState } from "react";
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
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { ZoneCompleteness } from "@/hooks/useDesignCompleteness";
import { METRIC_COLORS } from "@/lib/design-completeness-utils";

interface BuildingComparisonChartProps {
  zones: ZoneCompleteness[];
  selectedBuildingId: string | null;
  onBuildingSelect: (buildingId: string) => void;
}

interface ChartDataPoint {
  name: string;
  fullName: string;
  buildingId: string;
  loadCalcPercent: number;
  equipmentPercent: number;
  distributionPercent: number;
  ventilationPercent: number;
  ervPercent: number;
  acousticPercent: number;
  loadCalcCount: number;
  equipmentCount: number;
  distributionCount: number;
  ventilationCount: number;
  ervCount: number;
  acousticCount: number;
  totalZones: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
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
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: METRIC_COLORS.loadCalc }}
          />
          <span>
            Load Calc: {data.loadCalcCount}/{data.totalZones} ({data.loadCalcPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: METRIC_COLORS.equipment }}
          />
          <span>
            Equipment: {data.equipmentCount}/{data.totalZones} ({data.equipmentPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: METRIC_COLORS.distribution }}
          />
          <span>
            Distribution: {data.distributionCount}/{data.totalZones} ({data.distributionPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: METRIC_COLORS.ventilation }}
          />
          <span>
            Ventilation: {data.ventilationCount}/{data.totalZones} ({data.ventilationPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: METRIC_COLORS.erv }}
          />
          <span>
            ERV/HRV: {data.ervCount}/{data.totalZones} ({data.ervPercent}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: METRIC_COLORS.acoustic }}
          />
          <span>
            Acoustic: {data.acousticCount}/{data.totalZones} ({data.acousticPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export function BuildingComparisonChart({
  zones,
  selectedBuildingId,
  onBuildingSelect,
}: BuildingComparisonChartProps) {
  const [viewMode, setViewMode] = useState<"percent" | "count">("percent");

  const chartData = useMemo(() => {
    const buildingMap = new Map<
      string,
      {
        id: string;
        name: string;
        zoneCount: number;
        zonesWithLoadCalc: number;
        zonesWithEquipment: number;
        zonesWithDistribution: number;
        zonesWithVentilation: number;
        zonesWithERV: number;
        zonesWithAcoustic: number;
      }
    >();

    zones.forEach((zone) => {
      if (!buildingMap.has(zone.buildingId)) {
        buildingMap.set(zone.buildingId, {
          id: zone.buildingId,
          name: zone.buildingName,
          zoneCount: 0,
          zonesWithLoadCalc: 0,
          zonesWithEquipment: 0,
          zonesWithDistribution: 0,
          zonesWithVentilation: 0,
          zonesWithERV: 0,
          zonesWithAcoustic: 0,
        });
      }

      const building = buildingMap.get(zone.buildingId)!;
      building.zoneCount++;
      if (zone.hasLoadCalculation) building.zonesWithLoadCalc++;
      if (zone.hasEquipmentSelection) building.zonesWithEquipment++;
      if (zone.hasDistributionSystem) building.zonesWithDistribution++;
      if (zone.hasVentilationCalc) building.zonesWithVentilation++;
      if (zone.hasERVSizing) building.zonesWithERV++;
      if (zone.hasAcousticAnalysis) building.zonesWithAcoustic++;
    });

    return Array.from(buildingMap.values()).map((building): ChartDataPoint => ({
      name: building.name.length > 15 ? building.name.substring(0, 12) + "..." : building.name,
      fullName: building.name,
      buildingId: building.id,
      loadCalcPercent:
        building.zoneCount > 0
          ? Math.round((building.zonesWithLoadCalc / building.zoneCount) * 100)
          : 0,
      equipmentPercent:
        building.zoneCount > 0
          ? Math.round((building.zonesWithEquipment / building.zoneCount) * 100)
          : 0,
      distributionPercent:
        building.zoneCount > 0
          ? Math.round((building.zonesWithDistribution / building.zoneCount) * 100)
          : 0,
      ventilationPercent:
        building.zoneCount > 0
          ? Math.round((building.zonesWithVentilation / building.zoneCount) * 100)
          : 0,
      ervPercent:
        building.zoneCount > 0
          ? Math.round((building.zonesWithERV / building.zoneCount) * 100)
          : 0,
      acousticPercent:
        building.zoneCount > 0
          ? Math.round((building.zonesWithAcoustic / building.zoneCount) * 100)
          : 0,
      loadCalcCount: building.zonesWithLoadCalc,
      equipmentCount: building.zonesWithEquipment,
      distributionCount: building.zonesWithDistribution,
      ventilationCount: building.zonesWithVentilation,
      ervCount: building.zonesWithERV,
      acousticCount: building.zonesWithAcoustic,
      totalZones: building.zoneCount,
    }));
  }, [zones]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Building Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No buildings available for comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBarClick = (data: ChartDataPoint) => {
    onBuildingSelect(data.buildingId);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Building Comparison</CardTitle>
              <CardDescription>Compare design completion across all buildings</CardDescription>
            </div>
          </div>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "percent" | "count")}>
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis
              domain={[0, viewMode === "percent" ? 100 : "auto"]}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickFormatter={(value) => (viewMode === "percent" ? `${value}%` : value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            <Bar
              dataKey={viewMode === "percent" ? "loadCalcPercent" : "loadCalcCount"}
              name="Load Calc"
              fill={METRIC_COLORS.loadCalc}
              radius={[2, 2, 0, 0]}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={selectedBuildingId === entry.buildingId ? 1 : 0.7}
                  strokeWidth={selectedBuildingId === entry.buildingId ? 2 : 0}
                  stroke={selectedBuildingId === entry.buildingId ? "hsl(var(--primary))" : undefined}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === "percent" ? "equipmentPercent" : "equipmentCount"}
              name="Equipment"
              fill={METRIC_COLORS.equipment}
              radius={[2, 2, 0, 0]}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={selectedBuildingId === entry.buildingId ? 1 : 0.7}
                  strokeWidth={selectedBuildingId === entry.buildingId ? 2 : 0}
                  stroke={selectedBuildingId === entry.buildingId ? "hsl(var(--primary))" : undefined}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === "percent" ? "distributionPercent" : "distributionCount"}
              name="Distribution"
              fill={METRIC_COLORS.distribution}
              radius={[2, 2, 0, 0]}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={selectedBuildingId === entry.buildingId ? 1 : 0.7}
                  strokeWidth={selectedBuildingId === entry.buildingId ? 2 : 0}
                  stroke={selectedBuildingId === entry.buildingId ? "hsl(var(--primary))" : undefined}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === "percent" ? "ventilationPercent" : "ventilationCount"}
              name="Ventilation"
              fill={METRIC_COLORS.ventilation}
              radius={[2, 2, 0, 0]}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={selectedBuildingId === entry.buildingId ? 1 : 0.7}
                  strokeWidth={selectedBuildingId === entry.buildingId ? 2 : 0}
                  stroke={selectedBuildingId === entry.buildingId ? "hsl(var(--primary))" : undefined}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === "percent" ? "ervPercent" : "ervCount"}
              name="ERV/HRV"
              fill={METRIC_COLORS.erv}
              radius={[2, 2, 0, 0]}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={selectedBuildingId === entry.buildingId ? 1 : 0.7}
                  strokeWidth={selectedBuildingId === entry.buildingId ? 2 : 0}
                  stroke={selectedBuildingId === entry.buildingId ? "hsl(var(--primary))" : undefined}
                />
              ))}
            </Bar>
            <Bar
              dataKey={viewMode === "percent" ? "acousticPercent" : "acousticCount"}
              name="Acoustic"
              fill={METRIC_COLORS.acoustic}
              radius={[2, 2, 0, 0]}
              cursor="pointer"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.buildingId}
                  opacity={selectedBuildingId === entry.buildingId ? 1 : 0.7}
                  strokeWidth={selectedBuildingId === entry.buildingId ? 2 : 0}
                  stroke={selectedBuildingId === entry.buildingId ? "hsl(var(--primary))" : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
