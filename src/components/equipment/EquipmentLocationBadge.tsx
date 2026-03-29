import { Badge } from '@/components/ui/badge';
import { LocationPath, formatLocationPath } from '@/hooks/useLocationHierarchy';
import { MapPin, FolderKanban, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentLocationBadgeProps {
  locationPath: LocationPath | null | undefined;
  compact?: boolean;
  className?: string;
}

export function EquipmentLocationBadge({ 
  locationPath, 
  compact = false,
  className 
}: EquipmentLocationBadgeProps) {
  if (!locationPath) {
    return (
      <Badge variant="outline" className={cn('text-xs text-muted-foreground gap-1', className)}>
        <MapPin className="w-3 h-3" />
        Unassigned
      </Badge>
    );
  }

  if (compact) {
    // Show just zone or project name
    const label = locationPath.zoneName || locationPath.buildingName || locationPath.projectName || 'Unassigned';
    return (
      <Badge variant="outline" className={cn('text-xs gap-1', className)}>
        <MapPin className="w-3 h-3" />
        {label}
      </Badge>
    );
  }

  // Full path display
  return (
    <div className={cn('flex flex-wrap items-center gap-1 text-xs text-muted-foreground', className)}>
      {locationPath.projectName && (
        <Badge variant="secondary" className="text-xs gap-1">
          <FolderKanban className="w-3 h-3" />
          {locationPath.projectName}
        </Badge>
      )}
      {locationPath.buildingName && (
        <>
          <span>→</span>
          <Badge variant="outline" className="text-xs gap-1">
            <Building2 className="w-3 h-3" />
            {locationPath.buildingName}
          </Badge>
        </>
      )}
      {locationPath.floorName && (
        <>
          <span>→</span>
          <span>{locationPath.floorName}</span>
        </>
      )}
      {locationPath.zoneName && (
        <>
          <span>→</span>
          <Badge variant="outline" className="text-xs">
            {locationPath.zoneName}
          </Badge>
        </>
      )}
    </div>
  );
}
