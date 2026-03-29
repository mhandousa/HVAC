import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, CheckCircle2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { getSeverity, getStatusColor, SeverityInfo, BuildingOverview } from '@/lib/design-completeness-utils';

interface BuildingOverviewPanelProps {
  zones: ZoneCompleteness[];
  selectedBuildingId: string | null;
  onBuildingSelect: (buildingId: string) => void;
}

export function BuildingOverviewPanel({
  zones,
  selectedBuildingId,
  onBuildingSelect,
}: BuildingOverviewPanelProps) {
  const [sortBy, setSortBy] = useState<'name' | 'completion' | 'severity'>('severity');

  const buildingOverviews = useMemo(() => {
    const buildingMap = new Map<string, BuildingOverview>();

    zones.forEach(zone => {
      if (!buildingMap.has(zone.buildingId)) {
          buildingMap.set(zone.buildingId, {
            id: zone.buildingId,
            name: zone.buildingName,
            floorCount: 0,
            zoneCount: 0,
            completeZones: 0,
            overallCompleteness: 0,
            severity: getSeverity(0),
            zonesWithLoadCalc: 0,
            zonesWithEquipment: 0,
            zonesWithDistribution: 0,
            zonesWithVentilation: 0,
            zonesWithERV: 0,
          });
      }

      const building = buildingMap.get(zone.buildingId)!;
      building.zoneCount++;
      if (zone.completenessScore === 100) building.completeZones++;
        if (zone.hasLoadCalculation) building.zonesWithLoadCalc++;
        if (zone.hasEquipmentSelection) building.zonesWithEquipment++;
        if (zone.hasDistributionSystem) building.zonesWithDistribution++;
        if (zone.hasVentilationCalc) building.zonesWithVentilation++;
        if (zone.hasERVSizing) building.zonesWithERV++;
    });

    // Calculate floor counts and completeness
    buildingMap.forEach(building => {
      const buildingZones = zones.filter(z => z.buildingId === building.id);
      building.floorCount = new Set(buildingZones.map(z => z.floorId)).size;
      building.overallCompleteness = buildingZones.length > 0
        ? Math.round(buildingZones.reduce((sum, z) => sum + z.completenessScore, 0) / buildingZones.length)
        : 0;
      building.severity = getSeverity(building.overallCompleteness);
    });

    return Array.from(buildingMap.values());
  }, [zones]);

  const projectStats = useMemo(() => {
    const totalZones = buildingOverviews.reduce((sum, b) => sum + b.zoneCount, 0);
    const completeZones = buildingOverviews.reduce((sum, b) => sum + b.completeZones, 0);
    const overallCompleteness = totalZones > 0
      ? Math.round(buildingOverviews.reduce((sum, b) => sum + (b.overallCompleteness * b.zoneCount), 0) / totalZones)
      : 0;

    return {
      buildingCount: buildingOverviews.length,
      totalZones,
      completeZones,
      overallCompleteness,
      severity: getSeverity(overallCompleteness),
    };
  }, [buildingOverviews]);

  const sortedBuildings = useMemo(() => {
    return [...buildingOverviews].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'completion':
          return b.overallCompleteness - a.overallCompleteness;
        case 'severity':
          // Critical first (lower score = higher priority)
          return a.overallCompleteness - b.overallCompleteness;
        default:
          return 0;
      }
    });
  }, [buildingOverviews, sortBy]);

  if (buildingOverviews.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Project Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                {projectStats.buildingCount} building{projectStats.buildingCount !== 1 ? 's' : ''} • {projectStats.totalZones} zones
              </p>
            </div>
          </div>
          
          {/* Project Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: projectStats.severity.color }}>
                  {projectStats.overallCompleteness}%
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold"
                  style={{
                    backgroundColor: projectStats.severity.bgColor,
                    color: projectStats.severity.textColor,
                    borderColor: projectStats.severity.color,
                  }}
                >
                  {projectStats.severity.label}
                </Badge>
              </div>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${projectStats.overallCompleteness}%`,
                    backgroundColor: projectStats.severity.color,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sort Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Most Critical First</SelectItem>
              <SelectItem value="completion">Highest Completion</SelectItem>
              <SelectItem value="name">Building Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Building Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedBuildings.map(building => (
            <BuildingCard
              key={building.id}
              building={building}
              isSelected={building.id === selectedBuildingId}
              onClick={() => onBuildingSelect(building.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface BuildingCardProps {
  building: BuildingOverview;
  isSelected: boolean;
  onClick: () => void;
}

function BuildingCard({ building, isSelected, onClick }: BuildingCardProps) {
  const severity = building.severity;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col p-4 rounded-lg border-2 text-left transition-all w-full",
        "hover:shadow-lg hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border hover:border-muted-foreground/30 bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
        <span className="font-semibold truncate">{building.name}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${building.overallCompleteness}%`,
            backgroundColor: severity.color,
          }}
        />
      </div>

      {/* Percentage and Badge */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-2xl font-bold" style={{ color: severity.color }}>
          {building.overallCompleteness}%
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            backgroundColor: severity.bgColor,
            color: severity.textColor,
          }}
        >
          {severity.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {building.completeZones}/{building.zoneCount} zones
        </div>
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {building.floorCount} floor{building.floorCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Mini progress indicators for each design step */}
      <div className="flex gap-1 mt-3" title="Load Calc | Equipment | Distribution">
        <div
          className="flex-1 h-1.5 rounded-full transition-colors"
          style={{
            backgroundColor:
              building.zonesWithLoadCalc === building.zoneCount
                ? 'hsl(142, 71%, 45%)'
                : building.zonesWithLoadCalc > 0
                ? 'hsl(45, 93%, 47%)'
                : 'hsl(0, 72%, 51%)',
          }}
          title={`Load Calculations: ${building.zonesWithLoadCalc}/${building.zoneCount}`}
        />
        <div
          className="flex-1 h-1.5 rounded-full transition-colors"
          style={{
            backgroundColor:
              building.zonesWithEquipment === building.zoneCount
                ? 'hsl(142, 71%, 45%)'
                : building.zonesWithEquipment > 0
                ? 'hsl(45, 93%, 47%)'
                : 'hsl(0, 72%, 51%)',
          }}
          title={`Equipment Selection: ${building.zonesWithEquipment}/${building.zoneCount}`}
        />
        <div
          className="flex-1 h-1.5 rounded-full transition-colors"
          style={{
            backgroundColor:
              building.zonesWithDistribution === building.zoneCount
                ? 'hsl(142, 71%, 45%)'
                : building.zonesWithDistribution > 0
                ? 'hsl(45, 93%, 47%)'
                : 'hsl(0, 72%, 51%)',
          }}
          title={`Distribution System: ${building.zonesWithDistribution}/${building.zoneCount}`}
        />
      </div>
    </button>
  );
}
