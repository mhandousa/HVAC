import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  Volume2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { AcousticZonePopover } from './AcousticZonePopover';

interface AcousticFloorPlanHeatMapProps {
  zones: ZoneAcousticData[];
  floorName?: string;
}

type AcousticStatus = 'exceeds' | 'marginal' | 'acceptable' | 'no-data';

interface StatusConfig {
  label: string;
  color: string;
  fill: string;
  stroke: string;
  glow?: string;
}

const STATUS_CONFIGS: Record<AcousticStatus, StatusConfig> = {
  exceeds: {
    label: 'Exceeds NC',
    color: 'hsl(0, 72%, 51%)',
    fill: 'hsl(0, 72%, 95%)',
    stroke: 'hsl(0, 72%, 51%)',
    glow: 'hsl(0, 72%, 51%)',
  },
  marginal: {
    label: 'Marginal',
    color: 'hsl(25, 95%, 53%)',
    fill: 'hsl(25, 95%, 95%)',
    stroke: 'hsl(25, 95%, 53%)',
  },
  acceptable: {
    label: 'Acceptable',
    color: 'hsl(142, 71%, 45%)',
    fill: 'hsl(142, 71%, 95%)',
    stroke: 'hsl(142, 71%, 45%)',
  },
  'no-data': {
    label: 'No Data',
    color: 'hsl(0, 0%, 50%)',
    fill: 'hsl(0, 0%, 95%)',
    stroke: 'hsl(0, 0%, 70%)',
  },
};

const CELL_SIZE = 120;
const GAP = 8;
const PADDING = 20;
const COLUMNS = 5;

export function AcousticFloorPlanHeatMap({ zones, floorName }: AcousticFloorPlanHeatMapProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AcousticStatus | 'all'>('all');
  const [criticalIndex, setCriticalIndex] = useState(0);

  // Filter zones by status
  const filteredZones = useMemo(() => {
    if (statusFilter === 'all') return zones;
    return zones.filter(z => z.status === statusFilter);
  }, [zones, statusFilter]);

  // Get zones that exceed or marginally exceed
  const problemZones = useMemo(() => {
    return zones
      .filter(z => z.status === 'exceeds' || z.status === 'marginal')
      .sort((a, b) => b.ncDelta - a.ncDelta);
  }, [zones]);

  // Calculate layout
  const layout = useMemo(() => {
    return filteredZones.map((zone, index) => {
      const row = Math.floor(index / COLUMNS);
      const col = index % COLUMNS;
      return {
        zone,
        x: PADDING + col * (CELL_SIZE + GAP),
        y: PADDING + row * (CELL_SIZE + GAP),
        width: CELL_SIZE,
        height: CELL_SIZE,
      };
    });
  }, [filteredZones]);

  // Calculate SVG dimensions
  const svgDimensions = useMemo(() => {
    const rows = Math.ceil(filteredZones.length / COLUMNS);
    return {
      width: PADDING * 2 + COLUMNS * CELL_SIZE + (COLUMNS - 1) * GAP,
      height: PADDING * 2 + rows * CELL_SIZE + (rows - 1) * GAP + 40, // Extra space for header
    };
  }, [filteredZones.length]);

  // Keyboard navigation for problem zones
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (problemZones.length === 0) return;
      
      if (e.key === '[') {
        setCriticalIndex(prev => (prev - 1 + problemZones.length) % problemZones.length);
      } else if (e.key === ']') {
        setCriticalIndex(prev => (prev + 1) % problemZones.length);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [problemZones.length]);

  // Navigate to problem zone
  const navigateToProblemZone = useCallback((direction: 'prev' | 'next') => {
    if (problemZones.length === 0) return;
    
    const newIndex = direction === 'next'
      ? (criticalIndex + 1) % problemZones.length
      : (criticalIndex - 1 + problemZones.length) % problemZones.length;
    
    setCriticalIndex(newIndex);
    setSelectedZone(problemZones[newIndex].zoneId);
  }, [criticalIndex, problemZones]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      exceeds: zones.filter(z => z.status === 'exceeds').length,
      marginal: zones.filter(z => z.status === 'marginal').length,
      acceptable: zones.filter(z => z.status === 'acceptable').length,
      'no-data': zones.filter(z => z.status === 'no-data').length,
    };
  }, [zones]);

  const handleZoomIn = () => setZoom(prev => Math.min(2, prev + 0.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.2));
  const handleReset = () => setZoom(1);

  if (zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
        <div className="text-center text-muted-foreground">
          <Volume2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No zones available for this floor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({zones.length})
            </Button>
            {Object.entries(statusCounts).map(([status, count]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status as AcousticStatus)}
                className="gap-1"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS_CONFIGS[status as AcousticStatus].color }}
                />
                {count}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Problem Zone Navigation */}
      {problemZones.length > 0 && (
        <div className="flex items-center justify-center gap-4 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">
            {problemZones.length} zone{problemZones.length !== 1 ? 's' : ''} exceeding NC
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigateToProblemZone('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {criticalIndex + 1} of {problemZones.length}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateToProblemZone('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            Use [ ] to navigate
          </Badge>
        </div>
      )}

      {/* SVG Floor Plan */}
      <div className="border rounded-lg overflow-auto bg-muted/10" style={{ maxHeight: '600px' }}>
        <svg
          width={svgDimensions.width * zoom}
          height={svgDimensions.height * zoom}
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          className="transition-all duration-200"
        >
          {/* Background Grid */}
          <defs>
            <pattern id="acoustic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--muted))" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            
            {/* Glow filter for exceeding zones */}
            <filter id="acoustic-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="hsl(0, 72%, 51%)" floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#acoustic-grid)" />

          {/* Floor Name Header */}
          {floorName && (
            <text
              x={PADDING}
              y={PADDING - 5}
              className="fill-muted-foreground text-sm font-medium"
            >
              {floorName}
            </text>
          )}

          {/* Zone Rectangles */}
          {layout.map(({ zone, x, y, width, height }) => {
            const config = STATUS_CONFIGS[zone.status];
            const isSelected = selectedZone === zone.zoneId;
            const isProblem = zone.status === 'exceeds';
            const isCurrentProblem = problemZones[criticalIndex]?.zoneId === zone.zoneId;
            
            return (
              <g key={zone.zoneId}>
                {/* Zone Rectangle */}
                <Popover>
                  <PopoverTrigger asChild>
                    <g className="cursor-pointer">
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={8}
                        fill={config.fill}
                        stroke={isSelected || isCurrentProblem ? config.color : config.stroke}
                        strokeWidth={isSelected || isCurrentProblem ? 3 : 1.5}
                        filter={isProblem ? 'url(#acoustic-glow)' : undefined}
                        className="transition-all duration-200 hover:opacity-80"
                        onClick={() => setSelectedZone(zone.zoneId)}
                      >
                        {isProblem && (
                          <animate
                            attributeName="opacity"
                            values="1;0.7;1"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        )}
                      </rect>

                      {/* Zone Name */}
                      <text
                        x={x + width / 2}
                        y={y + 20}
                        textAnchor="middle"
                        className="fill-foreground text-xs font-medium pointer-events-none"
                      >
                        {zone.zoneName.length > 14 
                          ? zone.zoneName.substring(0, 12) + '...' 
                          : zone.zoneName
                        }
                      </text>

                      {/* NC Value */}
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 5}
                        textAnchor="middle"
                        style={{ fill: config.color }}
                        className="text-2xl font-bold pointer-events-none"
                      >
                        {zone.estimatedNC !== null ? `NC-${zone.estimatedNC}` : '—'}
                      </text>

                      {/* Target NC */}
                      <text
                        x={x + width / 2}
                        y={y + height / 2 + 22}
                        textAnchor="middle"
                        className="fill-muted-foreground text-xs pointer-events-none"
                      >
                        Target: NC-{zone.targetNC}
                      </text>

                      {/* Delta */}
                      {zone.estimatedNC !== null && zone.ncDelta !== 0 && (
                        <text
                          x={x + width / 2}
                          y={y + height - 15}
                          textAnchor="middle"
                          style={{ fill: zone.ncDelta > 0 ? 'hsl(0, 72%, 51%)' : 'hsl(142, 71%, 45%)' }}
                          className="text-sm font-semibold pointer-events-none"
                        >
                          {zone.ncDelta > 0 ? '+' : ''}{zone.ncDelta} dB
                        </text>
                      )}

                      {/* Terminal Unit Count */}
                      {zone.terminalUnits.length > 0 && (
                        <g>
                          <rect
                            x={x + width - 28}
                            y={y + 5}
                            width={24}
                            height={18}
                            rx={4}
                            fill="hsl(var(--background))"
                            stroke={config.stroke}
                            strokeWidth={1}
                          />
                          <text
                            x={x + width - 16}
                            y={y + 17}
                            textAnchor="middle"
                            className="fill-foreground text-xs pointer-events-none"
                          >
                            {zone.terminalUnits.length}
                          </text>
                        </g>
                      )}

                      {/* Warning Icon for exceeding zones */}
                      {zone.status === 'exceeds' && (
                        <g transform={`translate(${x + 8}, ${y + 8})`}>
                          <circle r="10" fill="hsl(0, 72%, 51%)" />
                          <text
                            textAnchor="middle"
                            y={4}
                            className="fill-white text-xs font-bold pointer-events-none"
                          >
                            !
                          </text>
                        </g>
                      )}
                    </g>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" className="p-0">
                    <AcousticZonePopover zone={zone} onClose={() => setSelectedZone(null)} />
                  </PopoverContent>
                </Popover>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2">
        {Object.entries(STATUS_CONFIGS).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: config.fill, borderColor: config.stroke }}
            />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
