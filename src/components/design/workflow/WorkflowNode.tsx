import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { WorkflowNode as WorkflowNodeType, NodeStatus } from '@/lib/workflow-diagram-data';
import { DIAGRAM_CONFIG } from '@/lib/workflow-diagram-data';

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  status: NodeStatus;
  isHighlighted: boolean;
  isUpstream: boolean;
  isDownstream: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const statusColors: Record<NodeStatus, { bg: string; border: string; text: string }> = {
  complete: {
    bg: 'hsl(var(--success) / 0.15)',
    border: 'hsl(var(--success))',
    text: 'hsl(var(--success))'
  },
  'in-progress': {
    bg: 'hsl(var(--primary) / 0.15)',
    border: 'hsl(var(--primary))',
    text: 'hsl(var(--primary))'
  },
  pending: {
    bg: 'hsl(var(--muted))',
    border: 'hsl(var(--border))',
    text: 'hsl(var(--muted-foreground))'
  },
  locked: {
    bg: 'hsl(var(--muted) / 0.5)',
    border: 'hsl(var(--border) / 0.5)',
    text: 'hsl(var(--muted-foreground) / 0.5)'
  }
};

export function WorkflowNode({
  node,
  status,
  isHighlighted,
  isUpstream,
  isDownstream,
  onClick,
  onMouseEnter,
  onMouseLeave
}: WorkflowNodeProps) {
  const Icon = node.icon;
  const colors = statusColors[status];
  const { stageNodeRadius } = DIAGRAM_CONFIG;
  
  const isStage = node.type === 'stage';
  const size = isStage ? stageNodeRadius * 2 : 80;

  // Determine glow effect based on relationship
  const getGlowClass = () => {
    if (isHighlighted) return 'ring-4 ring-primary/50';
    if (isUpstream) return 'ring-4 ring-destructive/40';
    if (isDownstream) return 'ring-4 ring-warning/40';
    return '';
  };

  return (
    <g
      className="cursor-pointer transition-all duration-200"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <foreignObject
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        className="overflow-visible"
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-full transition-all duration-300',
            'hover:scale-110 hover:shadow-lg',
            status === 'pending' && 'animate-pulse',
            getGlowClass()
          )}
          style={{
            width: size,
            height: size,
            backgroundColor: colors.bg,
            border: `3px solid ${colors.border}`,
          }}
        >
          <Icon 
            className="mb-1" 
            style={{ color: colors.text }} 
            size={isStage ? 24 : 18} 
          />
          <span 
            className="text-xs font-medium text-center px-1 leading-tight"
            style={{ color: colors.text }}
          >
            {node.shortName}
          </span>
        </div>
      </foreignObject>
      
      {/* Standards badges - shown on hover */}
      {node.standards && node.standards.length > 0 && isHighlighted && (
        <foreignObject
          x={size / 2 + 5}
          y={-15}
          width={120}
          height={60}
          className="overflow-visible pointer-events-none"
        >
          <div className="flex flex-col gap-1">
            {node.standards.slice(0, 2).map((std, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 whitespace-nowrap"
              >
                {std}
              </Badge>
            ))}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
