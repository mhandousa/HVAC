import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVelocityStatus, formatNominalSize } from '@/lib/pipe-calculations';
import type { PipeSegmentNode } from './PipeTreeView';
import { PipeNodeType, PIPE_NODE_TYPE_LABELS } from './PipeEquipmentIcons';

interface PipeLayoutCanvasProps {
  segments: PipeSegmentNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function PipeLayoutCanvas({
  segments,
  selectedId,
  onSelect,
}: PipeLayoutCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Calculate node positions based on tree structure
  const calculatePositions = (): NodePosition[] => {
    const positions: NodePosition[] = [];
    const nodeWidth = 160;
    const nodeHeight = 60;
    const horizontalSpacing = 200;
    const verticalSpacing = 100;

    // Build parent-child map
    const childrenMap = new Map<string | null, PipeSegmentNode[]>();
    segments.forEach((segment) => {
      const parentId = segment.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(segment);
    });

    // Position nodes recursively
    const positionNode = (
      nodeId: string | null,
      x: number,
      y: number,
      level: number
    ): number => {
      const children = childrenMap.get(nodeId) || [];
      let currentY = y;

      children.forEach((child, index) => {
        const childX = x + horizontalSpacing;
        
        // Get subtree height first
        const subtreeHeight = positionNode(child.id, childX, currentY, level + 1);
        
        // Position this node at center of its subtree
        const nodeY = subtreeHeight > 0 ? currentY + (subtreeHeight - nodeHeight) / 2 : currentY;
        
        positions.push({
          id: child.id,
          x: x,
          y: nodeY,
          width: nodeWidth,
          height: nodeHeight,
        });

        currentY += Math.max(subtreeHeight, nodeHeight + verticalSpacing);
      });

      return currentY - y - verticalSpacing;
    };

    positionNode(null, 50, 50, 0);
    return positions;
  };

  const positions = calculatePositions();

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleFitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const getSegmentById = (id: string) => segments.find((s) => s.id === id);

  const renderConnections = () => {
    const connections: React.ReactNode[] = [];

    positions.forEach((pos) => {
      const segment = getSegmentById(pos.id);
      if (!segment?.parentId) return;

      const parentPos = positions.find((p) => p.id === segment.parentId);
      if (!parentPos) return;

      const startX = parentPos.x + parentPos.width;
      const startY = parentPos.y + parentPos.height / 2;
      const endX = pos.x;
      const endY = pos.y + pos.height / 2;

      // Draw curved connection
      const midX = (startX + endX) / 2;

      connections.push(
        <path
          key={`conn-${segment.parentId}-${pos.id}`}
          d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
          stroke={segment.isCriticalPath ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
          strokeWidth={segment.isCriticalPath ? 3 : 2}
          fill="none"
          opacity={0.6}
        />
      );

      // Flow direction arrow
      const arrowX = endX - 8;
      const arrowY = endY;
      connections.push(
        <polygon
          key={`arrow-${pos.id}`}
          points={`${arrowX - 6},${arrowY - 4} ${arrowX},${arrowY} ${arrowX - 6},${arrowY + 4}`}
          fill={segment.isCriticalPath ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
          opacity={0.6}
        />
      );
    });

    return connections;
  };

  const renderNodes = () => {
    return positions.map((pos) => {
      const segment = getSegmentById(pos.id);
      if (!segment) return null;

      const velocityStatus = segment.velocity ? getVelocityStatus(segment.velocity) : null;
      const isSelected = selectedId === pos.id;
      const nodeType = (segment as any).nodeType as PipeNodeType | undefined;
      const isEquipmentNode = nodeType && nodeType !== 'pipe';

      // Get icon dimensions based on node type
      const iconSize = isEquipmentNode ? 28 : 0;
      const contentOffsetX = isEquipmentNode ? 40 : 12;

      return (
        <g
          key={pos.id}
          transform={`translate(${pos.x}, ${pos.y})`}
          onClick={() => onSelect(pos.id)}
          style={{ cursor: 'pointer' }}
        >
          {/* Node background */}
          <rect
            width={pos.width}
            height={pos.height}
            rx={8}
            fill={isSelected ? 'hsl(var(--accent))' : 'hsl(var(--card))'}
            stroke={segment.isCriticalPath ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
            strokeWidth={isSelected ? 2 : 1}
          />

          {/* Critical path indicator */}
          {segment.isCriticalPath && (
            <rect
              x={0}
              y={0}
              width={4}
              height={pos.height}
              rx={2}
              fill="hsl(var(--primary))"
            />
          )}

          {/* Equipment icon */}
          {isEquipmentNode && nodeType && (
            <g transform={`translate(8, ${(pos.height - iconSize) / 2})`}>
              <EquipmentIconSVG nodeType={nodeType} size={iconSize} />
            </g>
          )}

          {/* Node content */}
          <text
            x={contentOffsetX}
            y={18}
            className="text-sm font-medium"
            fill="hsl(var(--foreground))"
          >
            {segment.name.length > (isEquipmentNode ? 12 : 16) 
              ? segment.name.slice(0, isEquipmentNode ? 12 : 16) + '...' 
              : segment.name}
          </text>

          {/* Node type label for equipment */}
          {isEquipmentNode && nodeType && (
            <text
              x={contentOffsetX}
              y={32}
              className="text-xs"
              fill="hsl(var(--primary))"
            >
              {PIPE_NODE_TYPE_LABELS[nodeType]}
            </text>
          )}

          <text
            x={contentOffsetX}
            y={isEquipmentNode ? 46 : 36}
            className="text-xs"
            fill="hsl(var(--muted-foreground))"
          >
            {segment.flowGPM.toFixed(1)} GPM
            {segment.nominalSize && ` • ${formatNominalSize(segment.nominalSize)}`}
          </text>

          {segment.velocity && !isEquipmentNode && (
            <text
              x={contentOffsetX}
              y={50}
              className="text-xs"
              fill={
                segment.velocity > 10
                  ? 'hsl(var(--destructive))'
                  : segment.velocity > 8
                  ? 'hsl(24, 100%, 50%)'
                  : 'hsl(var(--muted-foreground))'
              }
            >
              {segment.velocity.toFixed(1)} fps
            </text>
          )}
        </g>
      );
    });
  };

  // Equipment icon component for SVG rendering
  const EquipmentIconSVG = ({ nodeType, size }: { nodeType: PipeNodeType; size: number }) => {
    const iconColors: Record<string, string> = {
      pump: 'hsl(var(--primary))',
      chiller: 'hsl(210, 100%, 50%)',
      boiler: 'hsl(0, 80%, 50%)',
      coil: 'hsl(280, 70%, 50%)',
      heat_exchanger: 'hsl(30, 90%, 50%)',
      tank: 'hsl(45, 90%, 50%)',
      air_separator: 'hsl(180, 60%, 50%)',
      valve_gate: 'hsl(var(--muted-foreground))',
      valve_globe: 'hsl(var(--muted-foreground))',
      valve_ball: 'hsl(var(--muted-foreground))',
      valve_check: 'hsl(120, 60%, 40%)',
      valve_butterfly: 'hsl(var(--muted-foreground))',
      strainer: 'hsl(270, 60%, 50%)',
    };

    const color = iconColors[nodeType] || 'hsl(var(--foreground))';

    // Simplified SVG shapes for each equipment type
    switch (nodeType) {
      case 'pump':
        return (
          <g>
            <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke={color} strokeWidth="2" />
            <path d={`M ${size/2} ${size/4} L ${size*3/4} ${size/2} L ${size/2} ${size*3/4}`} fill="none" stroke={color} strokeWidth="2" />
          </g>
        );
      case 'chiller':
        return (
          <g>
            <rect x={2} y={size/4} width={size-4} height={size/2} fill="none" stroke={color} strokeWidth="2" rx="2" />
            <line x1={size/3} y1={size/4} x2={size/3} y2={size*3/4} stroke={color} strokeWidth="1.5" />
            <line x1={size*2/3} y1={size/4} x2={size*2/3} y2={size*3/4} stroke={color} strokeWidth="1.5" />
          </g>
        );
      case 'boiler':
        return (
          <g>
            <rect x={4} y={4} width={size-8} height={size-8} fill="none" stroke={color} strokeWidth="2" rx="2" />
            <path d={`M ${size/4} ${size*2/3} Q ${size/2} ${size/3} ${size*3/4} ${size*2/3}`} fill="none" stroke={color} strokeWidth="1.5" />
          </g>
        );
      case 'coil':
        return (
          <g>
            <path d={`M 4 ${size/2} Q ${size/4} ${size/4} ${size/2} ${size/2} Q ${size*3/4} ${size*3/4} ${size-4} ${size/2}`} fill="none" stroke={color} strokeWidth="2" />
            <line x1={4} y1={size/3} x2={4} y2={size*2/3} stroke={color} strokeWidth="2" />
            <line x1={size-4} y1={size/3} x2={size-4} y2={size*2/3} stroke={color} strokeWidth="2" />
          </g>
        );
      case 'valve_gate':
      case 'valve_globe':
      case 'valve_ball':
      case 'valve_butterfly':
        return (
          <g>
            <polygon points={`${size/2},4 ${size-4},${size/2} ${size/2},${size-4} 4,${size/2}`} fill="none" stroke={color} strokeWidth="2" />
            <line x1={size/2} y1={4} x2={size/2} y2={size-4} stroke={color} strokeWidth="1.5" />
          </g>
        );
      case 'valve_check':
        return (
          <g>
            <polygon points={`4,${size/2} ${size*2/3},4 ${size*2/3},${size-4}`} fill="none" stroke={color} strokeWidth="2" />
            <line x1={size*2/3} y1={4} x2={size*2/3} y2={size-4} stroke={color} strokeWidth="2" />
          </g>
        );
      case 'strainer':
        return (
          <g>
            <polygon points={`${size/2},4 ${size-4},${size/2} ${size/2},${size-4} 4,${size/2}`} fill="none" stroke={color} strokeWidth="2" />
            <circle cx={size/2} cy={size/2} r={size/6} fill="none" stroke={color} strokeWidth="1.5" />
          </g>
        );
      case 'tank':
        return (
          <g>
            <ellipse cx={size/2} cy={size/2} rx={size/2-4} ry={size/3} fill="none" stroke={color} strokeWidth="2" />
            <line x1={size/2} y1={size/6} x2={size/2} y2={0} stroke={color} strokeWidth="2" />
          </g>
        );
      case 'air_separator':
        return (
          <g>
            <circle cx={size/2} cy={size/2} r={size/2-4} fill="none" stroke={color} strokeWidth="2" />
            <circle cx={size/2} cy={size/3} r={size/8} fill={color} />
            <circle cx={size/3} cy={size*2/3} r={size/10} fill={color} />
            <circle cx={size*2/3} cy={size*2/3} r={size/10} fill={color} />
          </g>
        );
      case 'heat_exchanger':
        return (
          <g>
            <rect x={4} y={4} width={size-8} height={size-8} fill="none" stroke={color} strokeWidth="2" rx="2" />
            <line x1={4} y1={4} x2={size-4} y2={size-4} stroke={color} strokeWidth="1.5" />
          </g>
        );
      default:
        return (
          <g>
            <line x1={0} y1={size/2} x2={size} y2={size/2} stroke={color} strokeWidth="3" />
          </g>
        );
    }
  };

  // Calculate canvas bounds
  const maxX = Math.max(...positions.map((p) => p.x + p.width), 400);
  const maxY = Math.max(...positions.map((p) => p.y + p.height), 300);

  return (
    <div className="relative h-full bg-muted/30 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button variant="secondary" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleFitView}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Pan hint */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        <Move className="h-3 w-3" />
        Alt+Drag to pan
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 z-10 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn('w-full h-full', isPanning && 'cursor-grabbing')}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${maxX + 100} ${maxY + 100}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {/* Grid pattern */}
          <defs>
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                opacity="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connections */}
          {renderConnections()}

          {/* Nodes */}
          {renderNodes()}
        </svg>
      </div>

      {/* Empty state */}
      {segments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No pipe segments to display</p>
            <p className="text-xs mt-1">Add segments in the tree view</p>
          </div>
        </div>
      )}
    </div>
  );
}
