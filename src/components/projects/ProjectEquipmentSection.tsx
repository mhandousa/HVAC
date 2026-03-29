import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectEquipmentHierarchy } from '@/hooks/useProjectEquipmentHierarchy';
import { Equipment } from '@/hooks/useEquipment';
import { EquipmentDetailDrawer } from '@/components/equipment/EquipmentDetailDrawer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Building2,
  Layers,
  MapPin,
  Wrench,
  ChevronRight,
  ChevronDown,
  Loader2,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectEquipmentSectionProps {
  projectId: string;
}

const statusColors: Record<string, string> = {
  operational: 'bg-success/10 text-success border-success/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  offline: 'bg-destructive/10 text-destructive border-destructive/20',
  retired: 'bg-muted text-muted-foreground border-border',
};

export function ProjectEquipmentSection({ projectId }: ProjectEquipmentSectionProps) {
  const { data: hierarchy, isLoading } = useProjectEquipmentHierarchy(projectId);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEquipmentDetailOpen, setIsEquipmentDetailOpen] = useState(false);

  const openEquipmentDetail = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsEquipmentDetailOpen(true);
  };

  const toggleBuilding = (buildingId: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      if (next.has(buildingId)) {
        next.delete(buildingId);
      } else {
        next.add(buildingId);
      }
      return next;
    });
  };

  const toggleFloor = (floorId: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      if (next.has(floorId)) {
        next.delete(floorId);
      } else {
        next.add(floorId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!hierarchy) return;
    const buildingIds = new Set(hierarchy.buildings.map(b => b.building.id));
    const floorIds = new Set(
      hierarchy.buildings.flatMap(b => b.floors.map(f => f.floor.id))
    );
    setExpandedBuildings(buildingIds);
    setExpandedFloors(floorIds);
  };

  const collapseAll = () => {
    setExpandedBuildings(new Set());
    setExpandedFloors(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hierarchy) {
    return null;
  }

  const totalEquipment =
    hierarchy.buildings.reduce(
      (sum, b) =>
        sum +
        b.floors.reduce(
          (fSum, f) => fSum + f.zones.reduce((zSum, z) => zSum + z.equipment.length, 0),
          0
        ),
      0
    ) + hierarchy.unassignedEquipment.length;

  const hasEquipment = totalEquipment > 0;
  const hasBuildings = hierarchy.buildings.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Equipment
          {totalEquipment > 0 && (
            <Badge variant="secondary">{totalEquipment}</Badge>
          )}
        </h2>
        {hasEquipment && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        )}
      </div>

      {!hasEquipment ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Wrench className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No equipment in this project</p>
            <p className="text-xs text-muted-foreground/70">
              Add equipment from the Equipment page or through zone details
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/equipment">
                Go to Equipment
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Buildings hierarchy */}
          {hierarchy.buildings.map(({ building, floors }) => {
            const buildingEquipmentCount = floors.reduce(
              (sum, f) => sum + f.zones.reduce((zSum, z) => zSum + z.equipment.length, 0),
              0
            );

            if (buildingEquipmentCount === 0) return null;

            const isBuildingExpanded = expandedBuildings.has(building.id);

            return (
              <Collapsible
                key={building.id}
                open={isBuildingExpanded}
                onOpenChange={() => toggleBuilding(building.id)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardContent className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isBuildingExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{building.name}</p>
                          {building.address && (
                            <p className="text-xs text-muted-foreground truncate">
                              {building.address}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {buildingEquipmentCount} equipment
                        </Badge>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-4 pb-3 space-y-2">
                      {floors.map(({ floor, zones }) => {
                        const floorEquipmentCount = zones.reduce(
                          (sum, z) => sum + z.equipment.length,
                          0
                        );

                        if (floorEquipmentCount === 0) return null;

                        const isFloorExpanded = expandedFloors.has(floor.id);

                        return (
                          <Collapsible
                            key={floor.id}
                            open={isFloorExpanded}
                            onOpenChange={() => toggleFloor(floor.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-3 py-2 pl-6 cursor-pointer hover:bg-muted/30 rounded-md transition-colors">
                                {isFloorExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                )}
                                <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-sm flex-1">{floor.name}</span>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {floorEquipmentCount}
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="pl-12 space-y-2 pt-1">
                                {zones.map(({ zone, equipment }) => {
                                  if (equipment.length === 0) return null;

                                  return (
                                    <div key={zone.id} className="space-y-1">
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{zone.name}</span>
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {zone.zone_type}
                                        </Badge>
                                      </div>
                                      <div className="pl-5 space-y-1">
                                        {equipment.map((eq) => (
                                          <div
                                            key={eq.id}
                                            className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/50 hover:bg-primary/10 hover:border-primary/20 cursor-pointer transition-colors"
                                            onClick={() => openEquipmentDetail(eq)}
                                          >
                                            <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">
                                                {eq.name}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {eq.tag}
                                                {eq.manufacturer && ` • ${eq.manufacturer}`}
                                              </p>
                                            </div>
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                'text-xs capitalize shrink-0',
                                                statusColors[eq.status]
                                              )}
                                            >
                                              {eq.status}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}

          {/* Unassigned equipment */}
          {hierarchy.unassignedEquipment.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Unassigned to Zone</p>
                    <p className="text-xs text-muted-foreground">
                      Equipment linked to project but not to a specific zone
                    </p>
                  </div>
                  <Badge variant="outline">
                    {hierarchy.unassignedEquipment.length}
                  </Badge>
                </div>
                <div className="pl-11 space-y-1">
                  {hierarchy.unassignedEquipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/50 hover:bg-primary/10 cursor-pointer transition-colors"
                      onClick={() => openEquipmentDetail(eq)}
                    >
                      <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {eq.tag}
                          {eq.manufacturer && ` • ${eq.manufacturer}`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs capitalize shrink-0',
                          statusColors[eq.status]
                        )}
                      >
                        {eq.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Equipment Detail Drawer */}
      <EquipmentDetailDrawer
        equipment={selectedEquipment}
        open={isEquipmentDetailOpen}
        onOpenChange={setIsEquipmentDetailOpen}
      />
    </div>
  );
}
