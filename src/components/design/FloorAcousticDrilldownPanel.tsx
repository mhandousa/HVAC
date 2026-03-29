import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, ChevronUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloorAcousticData } from '@/hooks/useFloorAcousticSummary';

interface FloorAcousticDrilldownPanelProps {
  buildingName: string;
  floors: FloorAcousticData[];
  onClose: () => void;
  onFloorSelect?: (floorId: string) => void;
  sortBy?: 'name' | 'compliance' | 'worstDelta';
  onSortChange?: (sort: 'name' | 'compliance' | 'worstDelta') => void;
}

const ACOUSTIC_STATUS_COLORS = {
  acceptable: 'hsl(142, 71%, 45%)',
  marginal: 'hsl(45, 93%, 47%)',
  exceeds: 'hsl(0, 72%, 51%)',
  noData: 'hsl(220, 14%, 75%)',
};

export function FloorAcousticDrilldownPanel({
  buildingName,
  floors,
  onClose,
  onFloorSelect,
  sortBy = 'compliance',
  onSortChange,
}: FloorAcousticDrilldownPanelProps) {
  const sortedFloors = useMemo(() => {
    const sorted = [...floors];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.floorName.localeCompare(b.floorName));
        break;
      case 'compliance':
        sorted.sort((a, b) => a.compliancePercent - b.compliancePercent);
        break;
      case 'worstDelta':
        sorted.sort((a, b) => b.worstNCDelta - a.worstNCDelta);
        break;
    }
    return sorted;
  }, [floors, sortBy]);

  return (
    <div className="border-t bg-muted/30 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{buildingName} Floors</span>
          <Badge variant="secondary" className="text-xs">
            {floors.length} floors
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onSortChange && (
            <Select value={sortBy} onValueChange={(v) => onSortChange(v as 'name' | 'compliance' | 'worstDelta')}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliance">By Compliance</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
                <SelectItem value="worstDelta">By Worst NC</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Floor List */}
      <div className="divide-y max-h-[280px] overflow-y-auto">
        {sortedFloors.map((floor) => {
          const total = floor.totalZones;
          const acceptablePercent = total > 0 ? (floor.zonesAcceptable / total) * 100 : 0;
          const marginalPercent = total > 0 ? (floor.zonesMarginal / total) * 100 : 0;
          const exceedsPercent = total > 0 ? (floor.zonesExceeding / total) * 100 : 0;
          const noDataPercent = total > 0 ? (floor.zonesNoData / total) * 100 : 0;

          return (
            <div
              key={floor.floorId}
              className={cn(
                'px-4 py-3 hover:bg-muted/50 transition-colors',
                onFloorSelect && 'cursor-pointer'
              )}
              onClick={() => onFloorSelect?.(floor.floorId)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{floor.floorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {floor.totalZones} zones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {floor.worstNCDelta > 0 && (
                    <Badge
                      variant={floor.worstNCDelta > 5 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      Worst: +{floor.worstNCDelta} dB
                    </Badge>
                  )}
                  {onFloorSelect && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Stacked Progress Bar */}
              <div className="relative h-3 w-full rounded-full overflow-hidden bg-muted">
                <div
                  className="absolute left-0 top-0 h-full transition-all"
                  style={{
                    width: `${acceptablePercent}%`,
                    backgroundColor: ACOUSTIC_STATUS_COLORS.acceptable,
                  }}
                />
                <div
                  className="absolute top-0 h-full transition-all"
                  style={{
                    left: `${acceptablePercent}%`,
                    width: `${marginalPercent}%`,
                    backgroundColor: ACOUSTIC_STATUS_COLORS.marginal,
                  }}
                />
                <div
                  className="absolute top-0 h-full transition-all"
                  style={{
                    left: `${acceptablePercent + marginalPercent}%`,
                    width: `${exceedsPercent}%`,
                    backgroundColor: ACOUSTIC_STATUS_COLORS.exceeds,
                  }}
                />
                <div
                  className="absolute top-0 h-full transition-all"
                  style={{
                    left: `${acceptablePercent + marginalPercent + exceedsPercent}%`,
                    width: `${noDataPercent}%`,
                    backgroundColor: ACOUSTIC_STATUS_COLORS.noData,
                  }}
                />
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.acceptable }} />
                  {floor.zonesAcceptable}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.marginal }} />
                  {floor.zonesMarginal}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.exceeds }} />
                  {floor.zonesExceeding}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.noData }} />
                  {floor.zonesNoData}
                </span>
                <span className="ml-auto font-medium">
                  {floor.compliancePercent}% compliant
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t text-xs text-muted-foreground bg-muted/30">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.acceptable }} />
          Acceptable
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.marginal }} />
          Marginal
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.exceeds }} />
          Exceeding
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACOUSTIC_STATUS_COLORS.noData }} />
          No Data
        </span>
      </div>
    </div>
  );
}
