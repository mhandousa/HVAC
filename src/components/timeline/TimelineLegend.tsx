import React from 'react';

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-primary/30 rounded" />
        <span>Planned</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-green-500 rounded" />
        <span>Completed (on time)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-blue-500 rounded" />
        <span>In Progress</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-red-500 rounded" />
        <span>Delayed</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-muted rounded" />
        <span>Pending</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rotate-45 bg-yellow-500" />
        <span>Milestone</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 bg-orange-500" />
        <span>Today</span>
      </div>
    </div>
  );
}
