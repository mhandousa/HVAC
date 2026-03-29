import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ZoomIn, ZoomOut, RotateCcw,
  Building2, Users, Wrench, HelpCircle, ChevronsUpDown, CheckCircle2,
  ChevronLeft, ChevronRight, AlertTriangle, X, Wind, Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZoneCompleteness } from '@/hooks/useDesignCompleteness';
import { ZoneHeatMapPopover } from './ZoneHeatMapPopover';
import { TerminalUnitIcon, getTerminalUnitLabel } from './TerminalUnitIcons';
interface FloorPlanHeatMapProps {
  zones: ZoneCompleteness[];
  projectId: string;
  floorId: string;
}

interface ZoneLayoutNode {
  zone: ZoneCompleteness;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ZoneTypeCategory {
  id: string;
  label: string;
  icon: typeof Building2;
  headerColor: string;
  zoneTypes: string[];
}

interface SeverityLevel {
  id: string;
  label: string;
  minScore: number;
  maxScore: number;
  color: string;
  textColor: string;
  priority: number;
}

const SEVERITY_LEVELS: SeverityLevel[] = [
  { id: 'critical', label: 'CRITICAL', minScore: 0, maxScore: 33, 
    color: 'hsl(0, 72%, 45%)', textColor: 'white', priority: 1 },
  { id: 'warning', label: 'WARNING', minScore: 34, maxScore: 66, 
    color: 'hsl(25, 95%, 50%)', textColor: 'white', priority: 2 },
  { id: 'good', label: 'GOOD', minScore: 67, maxScore: 99, 
    color: 'hsl(48, 86%, 40%)', textColor: 'white', priority: 3 },
  { id: 'complete', label: '✓', minScore: 100, maxScore: 100, 
    color: 'hsl(142, 71%, 35%)', textColor: 'white', priority: 4 }
];

const getZoneSeverity = (score: number): SeverityLevel => {
  if (score >= 100) return SEVERITY_LEVELS[3];
  if (score >= 67) return SEVERITY_LEVELS[2];
  if (score >= 34) return SEVERITY_LEVELS[1];
  return SEVERITY_LEVELS[0];
};

interface ZoneTypeGroup {
  category: ZoneTypeCategory;
  zones: ZoneCompleteness[];
  avgCompleteness: number;
  isExpanded: boolean;
}

const ZONE_CATEGORIES: ZoneTypeCategory[] = [
  {
    id: 'offices',
    label: 'Offices',
    icon: Building2,
    headerColor: 'hsl(221, 83%, 53%)',
    zoneTypes: ['office', 'meeting_room', 'conference']
  },
  {
    id: 'common',
    label: 'Common Areas',
    icon: Users,
    headerColor: 'hsl(280, 65%, 60%)',
    zoneTypes: ['lobby', 'common_area', 'kitchen', 'corridor', 'reception']
  },
  {
    id: 'mechanical',
    label: 'Mechanical/Support',
    icon: Wrench,
    headerColor: 'hsl(25, 95%, 53%)',
    zoneTypes: ['server_room', 'storage', 'restroom', 'electrical', 'mechanical']
  },
  {
    id: 'other',
    label: 'Other',
    icon: HelpCircle,
    headerColor: 'hsl(0, 0%, 50%)',
    zoneTypes: ['other']
  }
];

const CELL_SIZE = 80;
const GAP = 8;
const PADDING = 20;
const GROUP_HEADER_HEIGHT = 40;
const GROUP_GAP = 16;

export function FloorPlanHeatMap({ zones, projectId, floorId }: FloorPlanHeatMapProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(ZONE_CATEGORIES.map(c => c.id))
  );
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [criticalZoneIndex, setCriticalZoneIndex] = useState<number>(-1);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter zones for this floor
  const floorZones = useMemo(() => {
    return zones.filter(z => z.floorId === floorId);
  }, [zones, floorId]);

  // Count zones by severity level
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, warning: 0, good: 0, complete: 0 };
    floorZones.forEach(zone => {
      const severity = getZoneSeverity(zone.completenessScore);
      counts[severity.id as keyof typeof counts]++;
    });
    return counts;
  }, [floorZones]);

  // Apply incomplete filter and severity filter
  const filteredFloorZones = useMemo(() => {
    let filtered = floorZones;
    
    // Apply incomplete filter
    if (showOnlyIncomplete) {
      filtered = filtered.filter(z => z.completenessScore < 100);
    }
    
    // Apply severity filter
    if (severityFilter) {
      filtered = filtered.filter(z => 
        getZoneSeverity(z.completenessScore).id === severityFilter
      );
    }
    
    return filtered;
  }, [floorZones, showOnlyIncomplete, severityFilter]);

  // Track total counts for display
  const totalZoneCount = floorZones.length;
  const filteredZoneCount = filteredFloorZones.length;

  // Categorize zones into groups (using filtered zones)
  const zoneGroups = useMemo((): (ZoneTypeGroup & { totalZonesInCategory: number })[] => {
    const groups: (ZoneTypeGroup & { totalZonesInCategory: number })[] = [];
    
    ZONE_CATEGORIES.forEach(category => {
      // Get all zones in category (for total count)
      const allCategoryZones = floorZones.filter(zone => {
        const zoneType = zone.zoneType?.toLowerCase() || 'other';
        return category.zoneTypes.includes(zoneType) || 
          (category.id === 'other' && !ZONE_CATEGORIES.slice(0, -1).some(c => 
            c.zoneTypes.includes(zoneType)
          ));
      });
      
      // Get filtered zones in category
      const categoryZones = filteredFloorZones.filter(zone => {
        const zoneType = zone.zoneType?.toLowerCase() || 'other';
        return category.zoneTypes.includes(zoneType) || 
          (category.id === 'other' && !ZONE_CATEGORIES.slice(0, -1).some(c => 
            c.zoneTypes.includes(zoneType)
          ));
      });
      
      // Only show group if it has zones (either filtered or all)
      if (allCategoryZones.length > 0) {
        const avgCompleteness = Math.round(
          allCategoryZones.reduce((sum, z) => sum + z.completenessScore, 0) / allCategoryZones.length
        );
        
        groups.push({
          category,
          // Sort by severity priority (critical first), then by score ascending within same priority
          zones: categoryZones.sort((a, b) => {
            const severityA = getZoneSeverity(a.completenessScore);
            const severityB = getZoneSeverity(b.completenessScore);
            if (severityA.priority !== severityB.priority) {
              return severityA.priority - severityB.priority;
            }
            return a.completenessScore - b.completenessScore;
          }),
          totalZonesInCategory: allCategoryZones.length,
          avgCompleteness,
          isExpanded: expandedGroups.has(category.id)
        });
      }
    });
    
    return groups;
  }, [floorZones, filteredFloorZones, expandedGroups]);

  // Calculate layout with groups
  const { layout, groupLayouts, svgDimensions } = useMemo(() => {
    // Filter out groups with no visible zones when filter is active
    const visibleGroups = zoneGroups.filter(g => g.zones.length > 0 || !showOnlyIncomplete);
    
    if (visibleGroups.length === 0) {
      return { 
        layout: [] as ZoneLayoutNode[], 
        groupLayouts: [] as { group: ZoneTypeGroup & { totalZonesInCategory: number }; y: number; height: number }[],
        svgDimensions: { width: 400, height: 300 } 
      };
    }

    const nodes: ZoneLayoutNode[] = [];
    const groupLayoutsData: { group: ZoneTypeGroup & { totalZonesInCategory: number }; y: number; height: number }[] = [];
    let currentY = PADDING;
    const maxArea = Math.max(...filteredFloorZones.map(z => z.areaSqm || 50), 50);
    const minArea = Math.min(...filteredFloorZones.map(z => z.areaSqm || 50), 50);
    const cols = Math.ceil(Math.sqrt(Math.max(...visibleGroups.map(g => g.zones.length), 1) * 1.5));

    visibleGroups.forEach(group => {
      const groupStartY = currentY;
      currentY += GROUP_HEADER_HEIGHT;
      
      if (group.isExpanded) {
        let currentCol = 0;
        let currentX = PADDING;
        let rowHeight = 0;

        group.zones.forEach(zone => {
          const areaRatio = minArea === maxArea 
            ? 1 
            : 0.6 + 0.4 * ((zone.areaSqm || 50) - minArea) / (maxArea - minArea);
          
          const width = Math.round(CELL_SIZE * areaRatio * 1.2);
          const height = Math.round(CELL_SIZE * areaRatio);

          if (currentCol >= cols) {
            currentY += rowHeight + GAP;
            currentCol = 0;
            currentX = PADDING;
            rowHeight = 0;
          }

          nodes.push({
            zone,
            x: currentX,
            y: currentY,
            width,
            height,
          });

          rowHeight = Math.max(rowHeight, height);
          currentX += width + GAP;
          currentCol++;
        });

        currentY += rowHeight + GROUP_GAP;
      } else {
        currentY += GROUP_GAP;
      }
      
      groupLayoutsData.push({
        group,
        y: groupStartY,
        height: currentY - groupStartY - GROUP_GAP
      });
    });

    const maxX = nodes.length > 0 
      ? Math.max(...nodes.map(n => n.x + n.width)) + PADDING
      : 400;
    
    return {
      layout: nodes,
      groupLayouts: groupLayoutsData,
      svgDimensions: { width: Math.max(maxX, 400), height: currentY }
    };
  }, [zoneGroups, filteredFloorZones, showOnlyIncomplete]);

  const getZoneColor = (score: number) => {
    if (score >= 100) return 'hsl(142, 71%, 45%)';
    if (score >= 67) return 'hsl(48, 96%, 53%)';
    if (score >= 33) return 'hsl(25, 95%, 53%)';
    return 'hsl(0, 72%, 51%)';
  };

  const getZoneStroke = (score: number, isSelected: boolean) => {
    if (isSelected) return 'hsl(var(--primary))';
    if (score >= 100) return 'hsl(142, 71%, 35%)';
    if (score >= 67) return 'hsl(48, 96%, 43%)';
    if (score >= 33) return 'hsl(25, 95%, 43%)';
    return 'hsl(0, 72%, 41%)';
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  const toggleGroup = (categoryId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(ZONE_CATEGORIES.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // Critical zones for navigation (sorted by position: top-to-bottom, left-to-right)
  const criticalZones = useMemo(() => {
    return layout
      .filter(node => getZoneSeverity(node.zone.completenessScore).id === 'critical')
      .sort((a, b) => a.y - b.y || a.x - b.x);
  }, [layout]);

  // Reset critical zone index when zones change
  useEffect(() => {
    if (criticalZones.length === 0) {
      setCriticalZoneIndex(-1);
    } else if (criticalZoneIndex >= criticalZones.length) {
      setCriticalZoneIndex(criticalZones.length - 1);
    }
  }, [criticalZones.length, criticalZoneIndex]);

  // Scroll to a specific zone in the SVG container
  const scrollToZone = useCallback((node: ZoneLayoutNode) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollX = (node.x * zoom) - (container.clientWidth / 2) + (node.width * zoom / 2);
    const scrollY = (node.y * zoom) - (container.clientHeight / 2) + (node.height * zoom / 2);
    
    container.scrollTo({
      left: Math.max(0, scrollX),
      top: Math.max(0, scrollY),
      behavior: 'smooth'
    });
  }, [zoom]);

  // Navigate between critical zones
  const navigateToCriticalZone = useCallback((direction: 'next' | 'prev') => {
    if (criticalZones.length === 0) return;
    
    let newIndex: number;
    if (criticalZoneIndex === -1) {
      newIndex = direction === 'next' ? 0 : criticalZones.length - 1;
    } else {
      newIndex = direction === 'next' 
        ? (criticalZoneIndex + 1) % criticalZones.length
        : (criticalZoneIndex - 1 + criticalZones.length) % criticalZones.length;
    }
    
    setCriticalZoneIndex(newIndex);
    setSelectedZoneId(criticalZones[newIndex].zone.zoneId);
    scrollToZone(criticalZones[newIndex]);
  }, [criticalZones, criticalZoneIndex, scrollToZone]);

  // Keyboard shortcuts for critical zone navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === '[') {
        e.preventDefault();
        navigateToCriticalZone('prev');
      } else if (e.key === ']') {
        e.preventDefault();
        navigateToCriticalZone('next');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToCriticalZone]);

  if (floorZones.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg border border-dashed">
        <p className="text-muted-foreground">No zones on this floor</p>
      </div>
    );
  }

  // Show message when filters result in no zones
  if (filteredFloorZones.length === 0 && (showOnlyIncomplete || severityFilter)) {
    const filterDescription = severityFilter 
      ? `No ${severityFilter} zones${showOnlyIncomplete ? ' (incomplete filter also active)' : ''}`
      : 'All zones are 100% complete!';
    
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-muted/30 rounded-lg border border-dashed">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 dark:text-emerald-400 mb-4" />
        <p className="text-lg font-medium mb-2">{filterDescription}</p>
        <p className="text-muted-foreground mb-4">
          {severityFilter 
            ? `Try selecting a different severity level or clear the filter.`
            : `All ${totalZoneCount} zones on this floor have complete design data.`
          }
        </p>
        <div className="flex gap-2">
          {severityFilter && (
            <Button variant="outline" onClick={() => setSeverityFilter(null)}>
              Clear severity filter
            </Button>
          )}
          {showOnlyIncomplete && (
            <Button variant="outline" onClick={() => setShowOnlyIncomplete(false)}>
              Show all zones
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          
          <div className="h-4 w-px bg-border mx-2" />
          
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronsUpDown className="h-4 w-4 mr-1" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          
          <div className="h-4 w-px bg-border mx-2" />
          
          {/* Incomplete filter toggle */}
          <div className="flex items-center gap-2">
            <Switch 
              checked={showOnlyIncomplete} 
              onCheckedChange={setShowOnlyIncomplete}
              id="incomplete-filter"
            />
            <Label htmlFor="incomplete-filter" className="text-sm cursor-pointer">
              Show only incomplete
            </Label>
          </div>
          
          <span className="text-sm text-muted-foreground ml-auto">
            {showOnlyIncomplete 
              ? `Showing ${filteredZoneCount} of ${totalZoneCount} zones`
              : `${totalZoneCount} zones in ${zoneGroups.length} groups`
            }
          </span>
          
          {/* Terminal Unit Legend */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            <Wind className="h-3 w-3" />
            <span>= Terminal Units</span>
          </div>
        </div>

        {/* Severity Summary Panel */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Filter by severity:</span>
          
          <div className="flex items-center gap-2">
            {SEVERITY_LEVELS.map(severity => {
              const count = severityCounts[severity.id as keyof typeof severityCounts];
              const percentage = totalZoneCount > 0 ? Math.round((count / totalZoneCount) * 100) : 0;
              const isActive = severityFilter === severity.id;
              
              return (
                <button
                  key={severity.id}
                  onClick={() => setSeverityFilter(isActive ? null : severity.id)}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-lg border-2 transition-all",
                    "hover:scale-105 hover:shadow-md cursor-pointer min-w-[80px]",
                    isActive 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                  style={{ backgroundColor: `${severity.color}15` }}
                >
                  <span 
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: severity.color, color: severity.textColor }}
                  >
                    {severity.label}
                  </span>
                  <span 
                    className="text-xl font-bold mt-1"
                    style={{ color: severity.color }}
                  >
                    {count}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {percentage}%
                  </span>
                </button>
              );
            })}
          </div>
          
          {severityFilter && (
            <>
              <div className="h-6 w-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSeverityFilter(null)}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filter
              </Button>
            </>
          )}
        </div>

        {/* Critical Zone Navigation Bar */}
        {criticalZones.length > 0 && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {criticalZones.length} Critical
            </span>
            
            <div className="h-4 w-px bg-destructive/30 mx-1" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToCriticalZone('prev')}
              className="h-7 px-2 hover:bg-destructive/10"
            >
              <ChevronLeft className="h-4 w-4" />
              <kbd className="ml-1 text-[10px] bg-muted px-1 rounded font-mono">[</kbd>
            </Button>
            
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {criticalZoneIndex >= 0 
                ? `${criticalZoneIndex + 1} of ${criticalZones.length}`
                : '—'
              }
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToCriticalZone('next')}
              className="h-7 px-2 hover:bg-destructive/10"
            >
              <kbd className="mr-1 text-[10px] bg-muted px-1 rounded font-mono">]</kbd>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="h-4 w-px bg-destructive/30 mx-1" />
            
            <span className="text-xs text-muted-foreground">
              Use <kbd className="px-1 bg-muted rounded font-mono">[</kbd> <kbd className="px-1 bg-muted rounded font-mono">]</kbd> to navigate
            </span>
          </div>
        )}

        {/* SVG Canvas */}
        <div 
          ref={containerRef}
          className="overflow-auto bg-muted/20 rounded-lg border"
          style={{ maxHeight: '500px' }}
        >
          <svg
            width={svgDimensions.width * zoom}
            height={svgDimensions.height * zoom}
            viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
            className="transition-all duration-200"
          >
            {/* Grid background */}
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </pattern>
              
              {/* Critical zone glow filter */}
              <filter id="critical-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Group headers and zones */}
            {groupLayouts.map(({ group, y }) => {
              const Icon = group.category.icon;
              const isExpanded = group.isExpanded;
              
              return (
                <g key={group.category.id}>
                  {/* Group header */}
                  <g 
                    className="cursor-pointer"
                    onClick={() => toggleGroup(group.category.id)}
                  >
                    <rect
                      x={PADDING}
                      y={y}
                      width={svgDimensions.width - PADDING * 2}
                      height={GROUP_HEADER_HEIGHT - 4}
                      rx={6}
                      fill={group.category.headerColor}
                      opacity={0.15}
                      stroke={group.category.headerColor}
                      strokeWidth={1}
                    />
                    
                    {/* Expand/Collapse chevron */}
                    <g transform={`translate(${PADDING + 10}, ${y + GROUP_HEADER_HEIGHT / 2 - 8})`}>
                      {isExpanded ? (
                        <path d="M6 9l6 6 6-6" stroke={group.category.headerColor} strokeWidth="2" fill="none" />
                      ) : (
                        <path d="M9 6l6 6-6 6" stroke={group.category.headerColor} strokeWidth="2" fill="none" />
                      )}
                    </g>
                    
                    {/* Category label */}
                    <text
                      x={PADDING + 36}
                      y={y + GROUP_HEADER_HEIGHT / 2 + 1}
                      className="text-[13px] font-semibold pointer-events-none"
                      fill={group.category.headerColor}
                      dominantBaseline="middle"
                    >
                      {group.category.label}
                    </text>
                    
                    {/* Zone count and avg completeness */}
                    <text
                      x={PADDING + 160}
                      y={y + GROUP_HEADER_HEIGHT / 2 + 1}
                      className="text-[11px] pointer-events-none"
                      fill="hsl(var(--muted-foreground))"
                      dominantBaseline="middle"
                    >
                      {showOnlyIncomplete && group.zones.length < group.totalZonesInCategory
                        ? `${group.zones.length} of ${group.totalZonesInCategory} zones`
                        : `${group.zones.length} zones`
                      } • {group.avgCompleteness}% avg
                    </text>
                    
                    {/* Mini progress bar when collapsed */}
                    {!isExpanded && (
                      <g transform={`translate(${svgDimensions.width - PADDING - 110}, ${y + GROUP_HEADER_HEIGHT / 2 - 4})`}>
                        <rect
                          x={0}
                          y={0}
                          width={100}
                          height={8}
                          rx={4}
                          fill="hsl(var(--muted))"
                        />
                        <rect
                          x={0}
                          y={0}
                          width={group.avgCompleteness}
                          height={8}
                          rx={4}
                          fill={getZoneColor(group.avgCompleteness)}
                        />
                      </g>
                    )}
                  </g>
                </g>
              );
            })}

            {/* Zone rectangles */}
            {layout.map(node => {
              const isSelected = selectedZoneId === node.zone.zoneId;
              const severity = getZoneSeverity(node.zone.completenessScore);
              const isCritical = severity.id === 'critical';
              const badgeWidth = severity.id === 'complete' ? 18 : severity.label.length * 5 + 10;
              
              return (
                <ZoneHeatMapPopover
                  key={node.zone.zoneId}
                  zone={node.zone}
                  projectId={projectId}
                  open={isSelected}
                  onOpenChange={(open) => setSelectedZoneId(open ? node.zone.zoneId : null)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <g
                        className="cursor-pointer transition-all duration-150 hover:opacity-90"
                        onClick={() => setSelectedZoneId(
                          selectedZoneId === node.zone.zoneId ? null : node.zone.zoneId
                        )}
                      >
                        {/* Navigation focus ring (distinct from regular selection) */}
                        {criticalZoneIndex >= 0 && 
                         criticalZones[criticalZoneIndex]?.zone.zoneId === node.zone.zoneId && (
                          <rect
                            x={node.x - 6}
                            y={node.y - 6}
                            width={node.width + 12}
                            height={node.height + 12}
                            rx={10}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            strokeDasharray="8 4"
                            className="animate-pulse"
                          />
                        )}
                        
                        {/* Pulsing glow ring for critical zones */}
                        {isCritical && (
                          <rect
                            x={node.x - 3}
                            y={node.y - 3}
                            width={node.width + 6}
                            height={node.height + 6}
                            rx={8}
                            fill="none"
                            stroke="hsl(0, 72%, 51%)"
                            strokeWidth={2}
                            className="animate-critical-pulse"
                            style={{ filter: 'url(#critical-glow)' }}
                          />
                        )}
                        
                        <rect
                          x={node.x}
                          y={node.y}
                          width={node.width}
                          height={node.height}
                          rx={6}
                          fill={getZoneColor(node.zone.completenessScore)}
                          stroke={getZoneStroke(node.zone.completenessScore, isSelected)}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all duration-150"
                        />
                        
                        {/* Severity badge */}
                        <g transform={`translate(${node.x + node.width - badgeWidth - 4}, ${node.y + 4})`}>
                          <rect
                            x={0}
                            y={0}
                            width={badgeWidth}
                            height={14}
                            rx={3}
                            fill={severity.color}
                          />
                          {severity.id === 'complete' ? (
                            <path 
                              d="M5 7l3 3 5-5" 
                              stroke={severity.textColor}
                              strokeWidth="2" 
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ) : (
                            <text
                              x={badgeWidth / 2}
                              y={10.5}
                              textAnchor="middle"
                              className="text-[7px] font-bold pointer-events-none"
                              fill={severity.textColor}
                            >
                              {severity.label}
                            </text>
                          )}
                        </g>
                        
                        <text
                          x={node.x + node.width / 2}
                          y={node.y + node.height / 2 - (node.zone.hasTerminalUnitSelection ? 4 : 0)}
                          textAnchor="middle"
                          className="fill-white text-[10px] font-medium pointer-events-none"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                        >
                          {node.zone.zoneName.length > 12 
                            ? node.zone.zoneName.substring(0, 10) + '...'
                            : node.zone.zoneName
                          }
                        </text>
                        
                        <text
                          x={node.x + node.width / 2}
                          y={node.y + node.height / 2 + (node.zone.hasTerminalUnitSelection ? 8 : 12)}
                          textAnchor="middle"
                          className="fill-white text-[11px] font-bold pointer-events-none"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                        >
                          {node.zone.completenessScore}%
                        </text>
                        
                        {/* Terminal Unit Indicator */}
                        {node.zone.hasTerminalUnitSelection && node.zone.terminalUnitTotalQuantity > 0 && (
                          <g transform={`translate(${node.x + 4}, ${node.y + node.height - 16})`}>
                            {/* Background pill */}
                            <rect
                              x={0}
                              y={0}
                              width={Math.min(node.zone.terminalUnitTypes.length * 14 + 22, node.width - 8)}
                              height={12}
                              rx={6}
                              fill="rgba(0,0,0,0.65)"
                            />
                            
                            {/* Terminal unit icons */}
                            {node.zone.terminalUnitTypes.slice(0, 2).map((type, idx) => (
                              <g key={type} transform={`translate(${3 + idx * 12}, 1)`}>
                                <TerminalUnitIcon type={type} size={10} />
                              </g>
                            ))}
                            
                            {/* Quantity badge */}
                            <text
                              x={node.zone.terminalUnitTypes.slice(0, 2).length * 12 + 6}
                              y={9}
                              className="text-[8px] font-medium pointer-events-none"
                              fill="white"
                            >
                              ×{node.zone.terminalUnitTotalQuantity}
                            </text>
                          </g>
                        )}
                        
                        {/* Acoustic Status Indicator */}
                        {node.zone.hasAcousticAnalysis && (
                          <g transform={`translate(${node.x + node.width - 18}, ${node.y + node.height - 18})`}>
                            <circle
                              cx={7}
                              cy={7}
                              r={7}
                              fill={
                                node.zone.acousticMeetsTarget === true 
                                  ? 'hsl(142, 71%, 45%)'  // Green - passing
                                  : node.zone.acousticMeetsTarget === false
                                    ? 'hsl(0, 72%, 51%)'  // Red - failing
                                    : 'hsl(45, 93%, 47%)' // Yellow - pending
                              }
                              stroke="rgba(255,255,255,0.8)"
                              strokeWidth={1}
                            />
                            {/* Speaker icon path */}
                            <path
                              d="M4 5v4l2.5 2h1.5v-8h-1.5l-2.5 2z M9 4.5c1 1 1 4 0 5"
                              stroke="white"
                              strokeWidth={1}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )}
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{node.zone.zoneName}</span>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ 
                              backgroundColor: severity.color, 
                              color: severity.textColor 
                            }}
                          >
                            {severity.label}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          {node.zone.areaSqm} m² • {node.zone.completenessScore}% complete
                        </div>
                        
                        {/* Terminal Unit Info */}
                        {node.zone.hasTerminalUnitSelection && node.zone.terminalUnitTotalQuantity > 0 && (
                          <div className="flex items-center gap-1.5 text-primary pt-1 border-t border-border/50">
                            <Wind className="h-3 w-3" />
                            <span>
                              {node.zone.terminalUnitTotalQuantity} unit{node.zone.terminalUnitTotalQuantity > 1 ? 's' : ''}: {
                                node.zone.terminalUnitTypes.map(t => getTerminalUnitLabel(t)).join(', ')
                              }
                            </span>
                          </div>
                        )}
                        
                        {/* Acoustic Analysis Status */}
                        {node.zone.hasAcousticAnalysis && (
                          <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-border/50">
                            <Volume2 className="h-3 w-3" />
                            <span className={
                              node.zone.acousticMeetsTarget === true 
                                ? 'text-emerald-500' 
                                : node.zone.acousticMeetsTarget === false 
                                  ? 'text-destructive' 
                                  : 'text-amber-500'
                            }>
                              NC {node.zone.acousticMeetsTarget === true 
                                ? 'Compliant' 
                                : node.zone.acousticMeetsTarget === false 
                                  ? 'Non-Compliant' 
                                  : 'Pending'
                              }
                            </span>
                            <span className="text-muted-foreground">
                              ({node.zone.acousticCalculationCount} calc{node.zone.acousticCalculationCount !== 1 ? 's' : ''})
                            </span>
                          </div>
                        )}
                        
                        {node.zone.missingSteps.length > 0 && (
                          <div className="text-destructive">
                            Missing: {node.zone.missingSteps.map(s => 
                              s === 'load_calc' ? 'Load Calc' : 
                              s === 'equipment' ? 'Equipment' : 
                              s === 'distribution' ? 'Distribution' :
                              s === 'ventilation' ? 'Ventilation' :
                              s === 'erv' ? 'ERV' : 'Acoustic'
                            ).join(', ')}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </ZoneHeatMapPopover>
              );
            })}
          </svg>
        </div>
      </div>
    </TooltipProvider>
  );
}