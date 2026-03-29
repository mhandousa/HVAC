import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeficiencyItem } from '@/hooks/useDeficiencyDashboard';
import { useDeficiencyHeatMap, HeatMapCell } from '@/hooks/useDeficiencyHeatMap';
import { HeatMapCellComponent } from './HeatMapCell';
import { HeatMapLegend } from './HeatMapLegend';
import { LayoutGrid, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeficiencyHeatMapProps {
  deficiencies: DeficiencyItem[];
  onCellClick?: (type: 'equipment' | 'location', id: string) => void;
  selectedEquipmentType?: string;
  selectedProjectId?: string;
}

const intensityStyles = {
  low: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  medium: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700',
  high: 'bg-orange-200 dark:bg-orange-900/50 border-orange-400 dark:border-orange-600',
  critical: 'bg-red-200 dark:bg-red-900/60 border-red-400 dark:border-red-500',
};

export function DeficiencyHeatMap({
  deficiencies,
  onCellClick,
  selectedEquipmentType,
  selectedProjectId,
}: DeficiencyHeatMapProps) {
  const [viewMode, setViewMode] = useState<'equipment' | 'location'>('equipment');
  const { equipmentHeatMap, locationHeatMap } = useDeficiencyHeatMap(deficiencies);

  if (deficiencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Deficiency Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No deficiencies to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Deficiency Heat Map
          </CardTitle>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'equipment' | 'location')}>
            <TabsList className="h-8">
              <TabsTrigger value="equipment" className="text-xs gap-1 h-7 px-2">
                <LayoutGrid className="w-3 h-3" />
                Equipment
              </TabsTrigger>
              <TabsTrigger value="location" className="text-xs gap-1 h-7 px-2">
                <MapPin className="w-3 h-3" />
                Location
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewMode === 'equipment' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Issues grouped by equipment type. Click a cell to filter the table.
            </p>
            <div className="flex flex-wrap gap-3">
              {equipmentHeatMap.cells.map((cell) => (
                <HeatMapCellComponent
                  key={cell.id}
                  data={cell}
                  isSelected={selectedEquipmentType === cell.id}
                  onClick={() => onCellClick?.('equipment', cell.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Issues grouped by project. Click a project to filter the table.
            </p>
            <div className="space-y-3">
              {locationHeatMap.projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onCellClick?.('location', project.id)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all duration-200',
                    'hover:shadow-md cursor-pointer text-left',
                    intensityStyles[project.intensity],
                    selectedProjectId === project.id && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{project.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Score: {project.severityScore}
                      </span>
                      <span className="text-2xl font-bold">{project.totalCount}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <HeatMapLegend />
      </CardContent>
    </Card>
  );
}
