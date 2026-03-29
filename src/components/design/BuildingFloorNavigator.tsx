import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Layers, CheckCircle2 } from 'lucide-react';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { cn } from '@/lib/utils';
import { getSeverity } from '@/lib/design-completeness-utils';

interface BuildingFloorNavigatorProps {
  zones: ZoneCompleteness[];
  selectedBuildingId: string | null;
  selectedFloorId: string | null;
  onBuildingChange: (buildingId: string) => void;
  onFloorChange: (floorId: string) => void;
}

interface BuildingData {
  id: string;
  name: string;
  floors: FloorData[];
}

interface FloorData {
  id: string;
  name: string;
  zoneCount: number;
  completeCount: number;
  overallCompleteness: number;
}

export function BuildingFloorNavigator({
  zones,
  selectedBuildingId,
  selectedFloorId,
  onBuildingChange,
  onFloorChange,
}: BuildingFloorNavigatorProps) {
  // Group zones by building and floor
  const buildings = useMemo(() => {
    const buildingMap = new Map<string, BuildingData>();

    zones.forEach(zone => {
      if (!buildingMap.has(zone.buildingId)) {
        buildingMap.set(zone.buildingId, {
          id: zone.buildingId,
          name: zone.buildingName,
          floors: [],
        });
      }

      const building = buildingMap.get(zone.buildingId)!;
      let floor = building.floors.find(f => f.id === zone.floorId);
      
      if (!floor) {
        floor = {
          id: zone.floorId,
          name: zone.floorName,
          zoneCount: 0,
          completeCount: 0,
          overallCompleteness: 0,
        };
        building.floors.push(floor);
      }

      floor.zoneCount++;
      if (zone.completenessScore === 100) {
        floor.completeCount++;
      }
    });

    // Calculate floor completeness
    buildingMap.forEach(building => {
      building.floors.forEach(floor => {
        const floorZones = zones.filter(z => z.floorId === floor.id);
        floor.overallCompleteness = floorZones.length > 0
          ? Math.round(floorZones.reduce((sum, z) => sum + z.completenessScore, 0) / floorZones.length)
          : 0;
      });
      // Sort floors by name
      building.floors.sort((a, b) => a.name.localeCompare(b.name));
    });

    return Array.from(buildingMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [zones]);

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  // Calculate building-level stats
  const buildingStats = useMemo(() => {
    if (!selectedBuilding) return null;
    
    const totalZones = selectedBuilding.floors.reduce((sum, f) => sum + f.zoneCount, 0);
    const completeZones = selectedBuilding.floors.reduce((sum, f) => sum + f.completeCount, 0);
    const overallCompleteness = totalZones > 0
      ? Math.round(selectedBuilding.floors.reduce((sum, f) => sum + (f.overallCompleteness * f.zoneCount), 0) / totalZones)
      : 0;
    
    return {
      totalZones,
      completeZones,
      overallCompleteness,
      floorCount: selectedBuilding.floors.length,
    };
  }, [selectedBuilding]);

  return (
    <div className="space-y-4">
      {/* Building selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Building:</span>
        </div>
        <Select
          value={selectedBuildingId || ''}
          onValueChange={onBuildingChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select building" />
          </SelectTrigger>
          <SelectContent>
            {buildings.map(building => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Building progress summary */}
      {selectedBuilding && buildingStats && (
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
          <Building2 className="h-6 w-6 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium truncate">{selectedBuilding.name}</span>
              <span 
                className="text-sm font-bold ml-2"
                style={{ color: getSeverity(buildingStats.overallCompleteness).color }}
              >
                {buildingStats.overallCompleteness}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${buildingStats.overallCompleteness}%`,
                  backgroundColor: getSeverity(buildingStats.overallCompleteness).color
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {buildingStats.completeZones}/{buildingStats.totalZones} zones complete across {buildingStats.floorCount} floor{buildingStats.floorCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Floor cards with progress bars */}
      {selectedBuilding && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Floors:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {selectedBuilding.floors.map(floor => {
              const severity = getSeverity(floor.overallCompleteness);
              const isSelected = floor.id === selectedFloorId;
              
              return (
                <button
                  key={floor.id}
                  onClick={() => onFloorChange(floor.id)}
                  className={cn(
                    "flex flex-col p-3 rounded-lg border-2 text-left transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-muted hover:border-muted-foreground/30 bg-card"
                  )}
                >
                  {/* Floor name */}
                  <span className={cn(
                    "font-medium text-sm truncate w-full",
                    isSelected && "text-primary"
                  )}>
                    {floor.name}
                  </span>
                  
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${floor.overallCompleteness}%`,
                        backgroundColor: severity.color
                      }}
                    />
                  </div>
                  
                  {/* Stats row */}
                  <div className="flex items-center justify-between mt-2 gap-1">
                    <span className="text-[10px] text-muted-foreground truncate">
                      {floor.completeCount}/{floor.zoneCount} complete
                    </span>
                    <span 
                      className="text-xs font-bold shrink-0"
                      style={{ color: severity.color }}
                    >
                      {floor.overallCompleteness}%
                    </span>
                  </div>
                  
                  {/* Severity badge */}
                  <div className="mt-2">
                    {severity.id === 'complete' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: severity.bgColor, 
                          color: severity.textColor 
                        }}
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        COMPLETE
                      </span>
                    ) : (
                      <span 
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: severity.bgColor, 
                          color: severity.textColor 
                        }}
                      >
                        {severity.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
