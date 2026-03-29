import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export type ThrowPattern = '4-way' | '3-way' | '2-way' | '1-way' | 'linear' | 'radial';

interface ThrowPatternVisualizationProps {
  pattern: ThrowPattern;
  throwDistanceFt: number;
  roomWidthFt?: number;
  roomDepthFt?: number;
  ceilingHeightFt?: number;
  showIsotherms?: boolean;
  showRoomBoundary?: boolean;
  showGrid?: boolean;
  diffuserSizeIn?: number;
  className?: string;
}

export function ThrowPatternVisualization({
  pattern,
  throwDistanceFt,
  roomWidthFt = 20,
  roomDepthFt = 20,
  ceilingHeightFt = 9,
  showIsotherms = true,
  showRoomBoundary = true,
  showGrid = false,
  diffuserSizeIn = 12,
  className,
}: ThrowPatternVisualizationProps) {
  const viewBox = useMemo(() => {
    const maxDim = Math.max(roomWidthFt, roomDepthFt, throwDistanceFt * 2.5);
    const padding = maxDim * 0.1;
    return {
      minX: -maxDim / 2 - padding,
      minY: -maxDim / 2 - padding,
      width: maxDim + padding * 2,
      height: maxDim + padding * 2,
    };
  }, [roomWidthFt, roomDepthFt, throwDistanceFt]);

  const scale = 1; // 1 unit = 1 foot

  // Generate throw pattern paths based on type
  const throwPaths = useMemo(() => {
    const paths: { d: string; opacity: number }[] = [];
    const maxRadius = throwDistanceFt;

    // Create gradient rings for isotherm visualization
    const rings = [0.25, 0.5, 0.75, 1.0];

    switch (pattern) {
      case 'radial':
      case '4-way':
        // Full radial pattern (360°)
        rings.forEach((ring, i) => {
          const r = maxRadius * ring;
          paths.push({
            d: `M ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0`,
            opacity: 1 - ring * 0.6,
          });
        });
        break;

      case '3-way':
        // 270° pattern (missing one quadrant)
        rings.forEach((ring, i) => {
          const r = maxRadius * ring;
          paths.push({
            d: `M 0 ${-r} A ${r} ${r} 0 0 1 ${r} 0 A ${r} ${r} 0 0 1 0 ${r} A ${r} ${r} 0 0 1 ${-r} 0`,
            opacity: 1 - ring * 0.6,
          });
        });
        break;

      case '2-way':
        // Opposite directions (left-right)
        rings.forEach((ring, i) => {
          const r = maxRadius * ring;
          const width = r * 0.4;
          paths.push({
            d: `M ${-r} ${-width} L ${r} ${-width} L ${r} ${width} L ${-r} ${width} Z`,
            opacity: 1 - ring * 0.6,
          });
        });
        break;

      case '1-way':
        // Single direction
        rings.forEach((ring, i) => {
          const r = maxRadius * ring;
          const width = r * 0.5;
          paths.push({
            d: `M 0 ${-width} L ${r} ${-width * 0.5} L ${r} ${width * 0.5} L 0 ${width} Z`,
            opacity: 1 - ring * 0.6,
          });
        });
        break;

      case 'linear':
        // Linear slot pattern (elongated in one direction)
        rings.forEach((ring, i) => {
          const r = maxRadius * ring;
          const slotLength = r * 1.5;
          const width = r * 0.3;
          paths.push({
            d: `M ${-slotLength} ${-width} L ${slotLength} ${-width} L ${slotLength} ${width} L ${-slotLength} ${width} Z`,
            opacity: 1 - ring * 0.6,
          });
        });
        break;
    }

    return paths;
  }, [pattern, throwDistanceFt]);

  // Direction arrows for throw pattern
  const arrows = useMemo(() => {
    const arrowLength = throwDistanceFt * 0.6;
    const arrowPositions: { x: number; y: number; angle: number }[] = [];

    switch (pattern) {
      case 'radial':
      case '4-way':
        arrowPositions.push(
          { x: 0, y: -arrowLength, angle: 0 },
          { x: arrowLength, y: 0, angle: 90 },
          { x: 0, y: arrowLength, angle: 180 },
          { x: -arrowLength, y: 0, angle: 270 }
        );
        break;
      case '3-way':
        arrowPositions.push(
          { x: 0, y: -arrowLength, angle: 0 },
          { x: arrowLength, y: 0, angle: 90 },
          { x: 0, y: arrowLength, angle: 180 }
        );
        break;
      case '2-way':
        arrowPositions.push(
          { x: arrowLength, y: 0, angle: 90 },
          { x: -arrowLength, y: 0, angle: 270 }
        );
        break;
      case '1-way':
        arrowPositions.push({ x: arrowLength, y: 0, angle: 90 });
        break;
      case 'linear':
        arrowPositions.push(
          { x: arrowLength, y: 0, angle: 90 },
          { x: -arrowLength, y: 0, angle: 270 }
        );
        break;
    }

    return arrowPositions;
  }, [pattern, throwDistanceFt]);

  const diffuserSize = diffuserSizeIn / 12; // Convert to feet

  return (
    <div className={cn('relative bg-muted/30 rounded-lg overflow-hidden', className)}>
      <svg
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full"
        style={{ minHeight: 200 }}
      >
        {/* Grid */}
        {showGrid && (
          <g className="text-border" opacity={0.3}>
            {Array.from({ length: Math.ceil(viewBox.width / 5) + 1 }).map((_, i) => {
              const x = viewBox.minX + i * 5;
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={viewBox.minY}
                  x2={x}
                  y2={viewBox.minY + viewBox.height}
                  stroke="currentColor"
                  strokeWidth={0.05}
                />
              );
            })}
            {Array.from({ length: Math.ceil(viewBox.height / 5) + 1 }).map((_, i) => {
              const y = viewBox.minY + i * 5;
              return (
                <line
                  key={`h-${i}`}
                  x1={viewBox.minX}
                  y1={y}
                  x2={viewBox.minX + viewBox.width}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={0.05}
                />
              );
            })}
          </g>
        )}

        {/* Room boundary */}
        {showRoomBoundary && (
          <rect
            x={-roomWidthFt / 2}
            y={-roomDepthFt / 2}
            width={roomWidthFt}
            height={roomDepthFt}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.15}
            strokeDasharray="0.5 0.5"
            className="text-muted-foreground"
          />
        )}

        {/* Throw pattern gradient */}
        <defs>
          <radialGradient id="throw-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
          </radialGradient>
        </defs>

        {/* Throw pattern zones */}
        <g>
          {throwPaths.map((path, i) => (
            <path
              key={i}
              d={path.d}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={0.1}
              opacity={path.opacity}
              className="transition-opacity"
            />
          ))}
        </g>

        {/* Fill for throw pattern */}
        {throwPaths.length > 0 && (
          <path
            d={throwPaths[throwPaths.length - 1]?.d}
            fill="url(#throw-gradient)"
            stroke="none"
          />
        )}

        {/* Isotherm labels */}
        {showIsotherms && (
          <>
            <text
              x={throwDistanceFt + 0.5}
              y={0.3}
              fontSize={0.8}
              className="fill-muted-foreground"
            >
              {throwDistanceFt.toFixed(1)} ft
            </text>
            <text
              x={throwDistanceFt * 0.5 + 0.3}
              y={0.3}
              fontSize={0.6}
              className="fill-muted-foreground"
              opacity={0.7}
            >
              50 FPM
            </text>
          </>
        )}

        {/* Direction arrows */}
        {arrows.map((arrow, i) => (
          <g key={i} transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angle})`}>
            <path
              d="M 0 0 L -0.4 0.6 L 0 0.4 L 0.4 0.6 Z"
              fill="hsl(var(--primary))"
              opacity={0.8}
            />
          </g>
        ))}

        {/* Diffuser symbol (center) */}
        <g>
          {pattern === 'linear' ? (
            <rect
              x={-diffuserSize * 2}
              y={-diffuserSize / 4}
              width={diffuserSize * 4}
              height={diffuserSize / 2}
              fill="hsl(var(--background))"
              stroke="hsl(var(--foreground))"
              strokeWidth={0.1}
              rx={0.1}
            />
          ) : (
            <rect
              x={-diffuserSize / 2}
              y={-diffuserSize / 2}
              width={diffuserSize}
              height={diffuserSize}
              fill="hsl(var(--background))"
              stroke="hsl(var(--foreground))"
              strokeWidth={0.1}
              rx={0.1}
            />
          )}
          {/* Inner pattern lines */}
          {pattern !== 'linear' && (
            <>
              <line
                x1={-diffuserSize / 2}
                y1={-diffuserSize / 2}
                x2={diffuserSize / 2}
                y2={diffuserSize / 2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={0.05}
              />
              <line
                x1={diffuserSize / 2}
                y1={-diffuserSize / 2}
                x2={-diffuserSize / 2}
                y2={diffuserSize / 2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={0.05}
              />
            </>
          )}
        </g>

        {/* Scale indicator */}
        <g transform={`translate(${viewBox.minX + 1}, ${viewBox.minY + viewBox.height - 1.5})`}>
          <line x1={0} y1={0} x2={5} y2={0} stroke="currentColor" strokeWidth={0.1} className="text-foreground" />
          <line x1={0} y1={-0.2} x2={0} y2={0.2} stroke="currentColor" strokeWidth={0.1} className="text-foreground" />
          <line x1={5} y1={-0.2} x2={5} y2={0.2} stroke="currentColor" strokeWidth={0.1} className="text-foreground" />
          <text x={2.5} y={0.8} fontSize={0.6} textAnchor="middle" className="fill-muted-foreground">
            5 ft
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs space-y-0.5">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-primary opacity-80" />
          <span className="text-muted-foreground">Throw distance</span>
        </div>
        {showIsotherms && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary opacity-30" />
            <span className="text-muted-foreground">50 FPM isotherm</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThrowPatternVisualization;
