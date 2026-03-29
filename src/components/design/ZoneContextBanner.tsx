import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, Layers, ChevronRight, X, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useZoneContext } from '@/hooks/useZoneContext';
import { useZoneHierarchy } from '@/hooks/useZoneHierarchy';

interface ZoneContextBannerProps {
  /** Optional callback when user clicks "Change" */
  onChangeClick?: () => void;
  /** Optional callback when user clicks "Clear" */
  onClearClick?: () => void;
  /** Show clear button */
  showClear?: boolean;
  /** Compact mode for tight layouts */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional zone load data to display */
  zoneData?: {
    cfmRequired?: number;
    coolingLoadBtuh?: number;
    heatingLoadBtuh?: number;
  };
}

/**
 * ZoneContextBanner displays the current zone selection hierarchy
 * with breadcrumb-style navigation: Project → Building → Floor → Zone
 */
export function ZoneContextBanner({
  onChangeClick,
  onClearClick,
  showClear = false,
  compact = false,
  className,
  zoneData,
}: ZoneContextBannerProps) {
  const { projectId, zoneId, clearContext } = useZoneContext();
  const { data: hierarchy, isLoading } = useZoneHierarchy(zoneId || undefined);

  // Don't render if no zone is selected
  if (!zoneId) {
    return null;
  }

  const handleClear = () => {
    if (onClearClick) {
      onClearClick();
    } else {
      clearContext();
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/50 border animate-pulse",
        compact && "p-2",
        className
      )}>
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  if (!hierarchy) {
    // Fallback display when hierarchy data isn't available
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20",
        compact && "p-2 gap-2",
        className
      )}>
        <MapPin className={cn("text-primary", compact ? "w-4 h-4" : "w-5 h-5")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm font-medium text-foreground">
            <span className="truncate">Zone Selected</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Zone ID: {zoneId.slice(0, 8)}...
          </p>
        </div>
        {onChangeClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onChangeClick}
            className="shrink-0"
          >
            <Pencil className="w-3 h-3 mr-1" />
            Change
          </Button>
        )}
        {showClear && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClear}
            className="shrink-0 h-7 w-7"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20",
      compact && "p-2 gap-2",
      className
    )}>
      <MapPin className={cn("text-primary shrink-0", compact ? "w-4 h-4" : "w-5 h-5")} />
      
      <div className="flex-1 min-w-0">
        {/* Hierarchy breadcrumb */}
        <div className={cn(
          "flex items-center gap-1 flex-wrap",
          compact ? "text-xs" : "text-sm"
        )}>
          <span className="text-muted-foreground">Working in:</span>
          
          {/* Building */}
          <span className="font-medium text-foreground flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {hierarchy.building_name}
          </span>
          
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          
          {/* Floor */}
          <span className="font-medium text-foreground flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {hierarchy.floor_name}
          </span>
          
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          
          {/* Zone */}
          <Badge variant="secondary" className="font-medium">
            {hierarchy.zone_name}
          </Badge>
        </div>
        
        {/* Project name and optional load data */}
        <div className="flex items-center gap-3 mt-0.5">
          <Link 
            to={`/projects/${hierarchy.project_id}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Project: {hierarchy.project_name}
          </Link>
          
          {zoneData && (zoneData.cfmRequired || zoneData.coolingLoadBtuh) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-muted-foreground/50">|</span>
              {zoneData.cfmRequired && (
                <span>{zoneData.cfmRequired.toLocaleString()} CFM</span>
              )}
              {zoneData.coolingLoadBtuh && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span>{(zoneData.coolingLoadBtuh / 12000).toFixed(1)} tons</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {onChangeClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onChangeClick}
            className={compact ? "h-7 text-xs px-2" : ""}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Change
          </Button>
        )}
        {showClear && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClear}
            className={cn("text-muted-foreground hover:text-destructive", compact ? "h-7 w-7" : "h-8 w-8")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version that just shows the zone name with a badge
 */
export function ZoneContextBadge({
  className,
}: {
  className?: string;
}) {
  const { zoneId } = useZoneContext();
  const { data: hierarchy } = useZoneHierarchy(zoneId || undefined);

  if (!zoneId || !hierarchy) {
    return null;
  }

  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <MapPin className="w-3 h-3" />
      {hierarchy.zone_name}
    </Badge>
  );
}
