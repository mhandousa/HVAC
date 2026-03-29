import { useMemo, useState } from 'react';
import { DuctTreeNode } from './DuctTreeView';
import { SegmentData } from './SegmentPropertiesPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Wind, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DuctNodeType, DUCT_NODE_COLORS, getDuctNodeIcon } from './DuctEquipmentIcons';

interface DuctLayoutCanvasProps {
  nodes?: DuctTreeNode[];
  segments?: SegmentData[];
  selectedId?: string;
  onSelect: (id: string) => void;
  colorBy?: 'velocity' | 'pressure' | 'none';
  criticalPathIds?: Set<string>;
}

interface LayoutNode {
  id: string;
  name: string;
  x: number;
  y: number;
  cfm: number;
  type: DuctTreeNode['type'];
  nodeType?: DuctNodeType;
  isCriticalPath?: boolean;
  hasWarning?: boolean;
  velocity?: number;
  pressureDrop?: number;
}

interface LayoutEdge {
  from: string;
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isCriticalPath?: boolean;
}

// Simple layout algorithm - positions nodes in a tree structure
function calculateLayoutFromNodes(nodes: DuctTreeNode[]): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const layoutNodes: LayoutNode[] = [];
  const layoutEdges: LayoutEdge[] = [];

  const nodeWidth = 140;
  const nodeHeight = 60;
  const horizontalSpacing = 60;
  const verticalSpacing = 100;

  function processNode(
    node: DuctTreeNode,
    depth: number,
    siblingIndex: number,
    totalSiblings: number,
    parentX?: number,
    parentY?: number
  ): { x: number; y: number } {
    // Calculate position
    const x = 100 + depth * (nodeWidth + horizontalSpacing);
    
    // Center siblings vertically
    const totalHeight = totalSiblings * (nodeHeight + verticalSpacing) - verticalSpacing;
    const startY = 200 - totalHeight / 2;
    const y = startY + siblingIndex * (nodeHeight + verticalSpacing);

    layoutNodes.push({
      id: node.id,
      name: node.name,
      x,
      y,
      cfm: node.cfm,
      type: node.type,
      isCriticalPath: node.isCriticalPath,
      hasWarning: node.hasWarning,
      velocity: node.velocity,
      pressureDrop: node.pressureDrop,
    });

    // Add edge from parent
    if (parentX !== undefined && parentY !== undefined) {
      layoutEdges.push({
        from: '', // We don't track parent ID here for simplicity
        to: node.id,
        fromX: parentX + nodeWidth,
        fromY: parentY + nodeHeight / 2,
        toX: x,
        toY: y + nodeHeight / 2,
        isCriticalPath: node.isCriticalPath,
      });
    }

    // Process children
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, i) => {
        processNode(child, depth + 1, i, node.children!.length, x, y);
      });
    }

    return { x, y };
  }

  // Process root nodes
  nodes.forEach((node, i) => {
    processNode(node, 0, i, nodes.length);
  });

  return { nodes: layoutNodes, edges: layoutEdges };
}

// Layout algorithm from flat segments with parentId
function calculateLayoutFromSegments(
  segments: SegmentData[], 
  criticalPathIds?: Set<string>
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const layoutNodes: LayoutNode[] = [];
  const layoutEdges: LayoutEdge[] = [];

  const nodeWidth = 140;
  const nodeHeight = 60;
  const horizontalSpacing = 60;
  const verticalSpacing = 80;

  // Build parent-children map
  const childrenMap = new Map<string | null, SegmentData[]>();
  segments.forEach(seg => {
    const parentId = seg.parentId || null;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(seg);
  });

  const positionMap = new Map<string, { x: number; y: number }>();

  function processSegment(
    segment: SegmentData,
    depth: number,
    siblingIndex: number,
    totalSiblings: number
  ): { subtreeHeight: number } {
    const children = childrenMap.get(segment.id) || [];
    
    // Calculate x position based on depth
    const x = 100 + depth * (nodeWidth + horizontalSpacing);
    
    // Calculate subtree height first
    let subtreeHeight = 0;
    const childPositions: { segment: SegmentData; height: number }[] = [];
    
    if (children.length > 0) {
      children.forEach((child, i) => {
        const result = processSegment(child, depth + 1, i, children.length);
        childPositions.push({ segment: child, height: result.subtreeHeight });
        subtreeHeight += result.subtreeHeight;
      });
      subtreeHeight += (children.length - 1) * verticalSpacing;
    } else {
      subtreeHeight = nodeHeight;
    }

    // Store position after calculating subtree
    return { subtreeHeight };
  }

  // First pass - calculate subtree heights
  const rootSegments = childrenMap.get(null) || [];
  
  // Second pass - position nodes
  let currentY = 100;
  
  function positionNode(
    segment: SegmentData,
    depth: number,
    startY: number
  ): number {
    const children = childrenMap.get(segment.id) || [];
    const x = 100 + depth * (nodeWidth + horizontalSpacing);
    
    let y: number;
    let endY = startY;
    
    if (children.length > 0) {
      // Position children first
      children.forEach(child => {
        endY = positionNode(child, depth + 1, endY);
      });
      
      // Center this node among its children
      const firstChildPos = positionMap.get(children[0].id)!;
      const lastChildPos = positionMap.get(children[children.length - 1].id)!;
      y = (firstChildPos.y + lastChildPos.y) / 2;
    } else {
      y = startY;
      endY = startY + nodeHeight + verticalSpacing;
    }
    
    positionMap.set(segment.id, { x, y });
    
    const isCritical = criticalPathIds?.has(segment.id) || segment.isCriticalPath;
    
    layoutNodes.push({
      id: segment.id,
      name: segment.name,
      x,
      y,
      cfm: segment.cfm,
      type: segment.parentId ? 'branch' : 'main',
      nodeType: segment.nodeType,
      isCriticalPath: isCritical,
      hasWarning: (segment.velocityFpm || 0) > 1800,
      velocity: segment.velocityFpm,
      pressureDrop: segment.totalPressureDropPa,
    });
    
    // Add edge to parent
    if (segment.parentId) {
      const parentPos = positionMap.get(segment.parentId);
      if (parentPos) {
        layoutEdges.push({
          from: segment.parentId,
          to: segment.id,
          fromX: parentPos.x + nodeWidth,
          fromY: parentPos.y + nodeHeight / 2,
          toX: x,
          toY: y + nodeHeight / 2,
          isCriticalPath: isCritical,
        });
      }
    }
    
    return endY;
  }
  
  rootSegments.forEach(seg => {
    currentY = positionNode(seg, 0, currentY);
  });

  return { nodes: layoutNodes, edges: layoutEdges };
}

function getColorForValue(value: number, max: number, type: 'velocity' | 'pressure'): string {
  const ratio = Math.min(value / max, 1);
  
  if (type === 'velocity') {
    // Green to yellow to red (800 to 2000+ fpm)
    if (ratio < 0.5) {
      return 'hsl(152 76% 40%)'; // Green
    } else if (ratio < 0.75) {
      return 'hsl(38 92% 50%)'; // Yellow/Warning
    } else {
      return 'hsl(0 72% 51%)'; // Red
    }
  } else {
    // Blue gradient for pressure
    const lightness = 60 - ratio * 30;
    return `hsl(199 89% ${lightness}%)`;
  }
}

export function DuctLayoutCanvas({ 
  nodes, 
  segments,
  selectedId, 
  onSelect, 
  colorBy = 'none',
  criticalPathIds 
}: DuctLayoutCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    if (segments && segments.length > 0) {
      return calculateLayoutFromSegments(segments, criticalPathIds);
    }
    if (nodes && nodes.length > 0) {
      return calculateLayoutFromNodes(nodes);
    }
    return { nodes: [], edges: [] };
  }, [nodes, segments, criticalPathIds]);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (layoutNodes.length === 0) return { width: 800, height: 500 };
    const maxX = Math.max(...layoutNodes.map((n) => n.x)) + 200;
    const maxY = Math.max(...layoutNodes.map((n) => n.y)) + 100;
    return { width: Math.max(maxX, 800), height: Math.max(maxY, 500) };
  }, [layoutNodes]);

  // Get max values for color scaling
  const maxVelocity = Math.max(...layoutNodes.map((n) => n.velocity || 0), 2000);
  const maxPressure = Math.max(...layoutNodes.map((n) => n.pressureDrop || 0), 100);

  const isEmpty = (!nodes || nodes.length === 0) && (!segments || segments.length === 0);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-lg">
        <Wind className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No Duct Layout</p>
        <p className="text-xs">Add segments to visualize the system</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted/20 rounded-lg border">
      {/* Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background"
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background"
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      {colorBy !== 'none' && (
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur rounded-md p-2 text-xs z-10">
          <span className="text-muted-foreground">Color by: </span>
          <span className="font-medium capitalize">{colorBy}</span>
        </div>
      )}

      {/* Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox={`${-pan.x} ${-pan.y} ${bounds.width / zoom} ${bounds.height / zoom}`}
        className="select-none"
      >
        {/* Edges (duct runs) */}
        {layoutEdges.map((edge, i) => (
          <g key={i}>
            <path
              d={`M ${edge.fromX} ${edge.fromY} 
                  C ${edge.fromX + 40} ${edge.fromY}, 
                    ${edge.toX - 40} ${edge.toY}, 
                    ${edge.toX} ${edge.toY}`}
              fill="none"
              stroke={edge.isCriticalPath ? 'hsl(38 92% 50%)' : 'hsl(215 25% 70%)'}
              strokeWidth={edge.isCriticalPath ? 4 : 2}
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Nodes */}
        {layoutNodes.map((node) => {
          const isSelected = selectedId === node.id;
          const nodeTypeColor = node.nodeType && node.nodeType !== 'duct' 
            ? DUCT_NODE_COLORS[node.nodeType] 
            : undefined;
          const nodeColor =
            nodeTypeColor ||
            (colorBy === 'velocity' && node.velocity
              ? getColorForValue(node.velocity, maxVelocity, 'velocity')
              : colorBy === 'pressure' && node.pressureDrop
              ? getColorForValue(node.pressureDrop, maxPressure, 'pressure')
              : undefined);

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelect(node.id)}
              className="cursor-pointer"
            >
              {/* Node background */}
              <rect
                x={0}
                y={0}
                width={140}
                height={60}
                rx={8}
                fill={nodeColor || (isSelected ? 'hsl(199 89% 48%)' : 'hsl(0 0% 100%)')}
                stroke={
                  node.isCriticalPath
                    ? 'hsl(38 92% 50%)'
                    : isSelected
                    ? 'hsl(199 89% 48%)'
                    : 'hsl(215 25% 88%)'
                }
                strokeWidth={isSelected || node.isCriticalPath ? 2 : 1}
                className="transition-all"
              />

              {/* Node type indicator */}
              {node.nodeType && node.nodeType !== 'duct' ? (
                <g transform="translate(8, 8)">
                  {(() => {
                    const IconComponent = getDuctNodeIcon(node.nodeType);
                    return (
                      <foreignObject width={18} height={18}>
                        <div className="text-white">
                          <IconComponent size={18} />
                        </div>
                      </foreignObject>
                    );
                  })()}
                </g>
              ) : node.type === 'ahu' ? (
                <Wind
                  className="text-primary"
                  x={8}
                  y={8}
                  width={16}
                  height={16}
                />
              ) : node.type === 'terminal' ? (
                <circle
                  cx={16}
                  cy={16}
                  r={6}
                  fill="none"
                  stroke={isSelected || nodeColor ? 'white' : 'currentColor'}
                  strokeWidth={2}
                />
              ) : null}

              {/* Node name */}
              <text
                x={70}
                y={24}
                textAnchor="middle"
                className="text-xs font-medium"
                fill={isSelected || nodeColor ? 'white' : 'currentColor'}
              >
                {node.name.length > 14 ? node.name.slice(0, 12) + '...' : node.name}
              </text>

              {/* CFM */}
              <text
                x={70}
                y={44}
                textAnchor="middle"
                className="text-[10px] font-mono"
                fill={isSelected || nodeColor ? 'rgba(255,255,255,0.9)' : 'hsl(215 15% 45%)'}
              >
                {node.cfm.toLocaleString()} CFM
              </text>

              {/* Warning indicator */}
              {node.hasWarning && (
                <circle cx={130} cy={10} r={6} fill="hsl(38 92% 50%)" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default DuctLayoutCanvas;
