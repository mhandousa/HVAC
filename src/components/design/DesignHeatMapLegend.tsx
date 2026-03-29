import { Calculator, Box, GitBranch, Volume2 } from 'lucide-react';

export function DesignHeatMapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
      {/* Color scale */}
      <div className="flex items-center gap-2">
        <span className="font-medium">Completeness:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-destructive" />
          <span>0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-orange-500" />
          <span>33%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-yellow-500" />
          <span>67%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded bg-green-500" />
          <span>100%</span>
        </div>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Missing indicators */}
      <div className="flex items-center gap-4">
        <span className="font-medium">Missing:</span>
        <div className="flex items-center gap-1.5">
          <Calculator className="h-4 w-4 text-destructive" />
          <span>Load Calc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Box className="h-4 w-4 text-destructive" />
          <span>Equipment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-4 w-4 text-destructive" />
          <span>Distribution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Volume2 className="h-4 w-4 text-destructive" />
          <span>Acoustic</span>
        </div>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Acoustic NC Status */}
      <div className="flex items-center gap-4">
        <span className="font-medium">NC Status:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span>Compliant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-destructive" />
          <span>Exceeded</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-amber-500" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
