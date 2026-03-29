import React from 'react';
import type { WorkflowEdge as WorkflowEdgeType, EdgeType } from '@/lib/workflow-diagram-data';

interface WorkflowEdgeProps {
  edge: WorkflowEdgeType;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
  isHighlighted: boolean;
  nodeRadius: number;
}

const edgeStyles: Record<EdgeType, { stroke: string; dashArray: string; opacity: number }> = {
  sequential: {
    stroke: 'hsl(var(--primary))',
    dashArray: 'none',
    opacity: 0.8
  },
  dependency: {
    stroke: 'hsl(var(--warning))',
    dashArray: '8 4',
    opacity: 0.6
  },
  optional: {
    stroke: 'hsl(var(--muted-foreground))',
    dashArray: '4 4',
    opacity: 0.4
  }
};

export function WorkflowEdge({
  edge,
  fromPos,
  toPos,
  isHighlighted,
  nodeRadius
}: WorkflowEdgeProps) {
  const style = edgeStyles[edge.type];
  
  // Adjust start/end points to account for node radius
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / distance;
  const unitY = dy / distance;
  
  const startX = fromPos.x + unitX * nodeRadius;
  const startY = fromPos.y + unitY * nodeRadius;
  const endX = toPos.x - unitX * nodeRadius;
  const endY = toPos.y - unitY * nodeRadius;

  // Create curved path for dependency edges
  const createPath = () => {
    if (edge.type === 'dependency' && Math.abs(dx) > 50) {
      // Curved path for cross dependencies
      const midY = (startY + endY) / 2;
      const controlOffset = Math.abs(dx) * 0.3;
      return `M ${startX} ${startY} 
              C ${startX} ${startY + controlOffset}, 
                ${endX} ${endY - controlOffset}, 
                ${endX} ${endY}`;
    }
    // Straight path for sequential edges
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  };

  // Arrow marker ID
  const markerId = `arrow-${edge.type}${isHighlighted ? '-highlight' : ''}`;

  return (
    <g className={isHighlighted ? 'animate-pulse' : ''}>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={isHighlighted ? 'hsl(var(--primary))' : style.stroke}
          />
        </marker>
      </defs>

      {/* Edge path */}
      <path
        d={createPath()}
        fill="none"
        stroke={isHighlighted ? 'hsl(var(--primary))' : style.stroke}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeDasharray={style.dashArray}
        opacity={isHighlighted ? 1 : style.opacity}
        markerEnd={`url(#${markerId})`}
        className={edge.type === 'sequential' ? 'workflow-edge-animated' : ''}
      />

      {/* Edge label */}
      {edge.label && isHighlighted && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 8}
          textAnchor="middle"
          className="text-[10px] fill-muted-foreground font-medium"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}
