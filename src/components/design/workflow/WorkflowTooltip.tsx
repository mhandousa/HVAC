import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { WorkflowNode } from '@/lib/workflow-diagram-data';

interface WorkflowTooltipProps {
  node: WorkflowNode;
  position: { x: number; y: number };
  onNavigate: () => void;
}

export function WorkflowTooltip({ node, position, onNavigate }: WorkflowTooltipProps) {
  const Icon = node.icon;

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        left: position.x + 80,
        top: position.y - 20,
      }}
    >
      <div className="bg-popover border rounded-lg shadow-lg p-4 min-w-[240px] max-w-[300px]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h4 className="font-semibold text-sm">{node.name}</h4>
        </div>

        {/* Description */}
        {node.description && (
          <p className="text-xs text-muted-foreground mb-3">
            {node.description}
          </p>
        )}

        {/* Standards */}
        {node.standards && node.standards.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-muted-foreground">Standards:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {node.standards.map((std, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px]">
                  {std}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tools list (for stages) */}
        {node.tools && node.tools.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-muted-foreground">Tools:</span>
            <ul className="mt-1 space-y-0.5">
              {node.tools.map((tool, idx) => (
                <li key={idx} className="text-xs flex items-center gap-1">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigate button */}
        <button
          onClick={onNavigate}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Open Tool
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
