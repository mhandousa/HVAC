import React from 'react';
import { CheckCircle2, Circle, Clock, Lock } from 'lucide-react';

export function WorkflowLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
      {/* Node status legend */}
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground font-medium">Status:</span>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-4 w-4 text-muted-foreground" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-muted-foreground/50" />
          <span>Locked</span>
        </div>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Edge type legend */}
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground font-medium">Flow:</span>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="12">
            <line 
              x1="0" y1="6" x2="24" y2="6" 
              stroke="hsl(var(--primary))" 
              strokeWidth="2" 
            />
          </svg>
          <span>Sequential</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="12">
            <line 
              x1="0" y1="6" x2="24" y2="6" 
              stroke="hsl(var(--warning))" 
              strokeWidth="2" 
              strokeDasharray="4 2"
            />
          </svg>
          <span>Dependency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="12">
            <line 
              x1="0" y1="6" x2="24" y2="6" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth="2" 
              strokeDasharray="2 2"
              opacity="0.5"
            />
          </svg>
          <span>Optional</span>
        </div>
      </div>
    </div>
  );
}
