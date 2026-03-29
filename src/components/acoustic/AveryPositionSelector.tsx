import React, { useMemo } from 'react';
import { AVERY_TEMPLATES, getAveryLayoutInfo } from '@/lib/label-templates';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AveryPositionSelectorProps {
  templateId: string;
  startPosition: number;
  onPositionChange: (position: number) => void;
  labelsNeeded: number;
}

export function AveryPositionSelector({
  templateId,
  startPosition,
  onPositionChange,
  labelsNeeded,
}: AveryPositionSelectorProps) {
  const template = AVERY_TEMPLATES[templateId];
  const layoutInfo = getAveryLayoutInfo(templateId);
  const totalLabels = layoutInfo.total;
  
  // Calculate how many labels will fit on first page
  const firstPageCapacity = totalLabels - (startPosition - 1);
  const labelsOnFirstPage = Math.min(labelsNeeded, firstPageCapacity);
  
  // Determine cell states
  const getCellState = (position: number): 'skipped' | 'start' | 'print' | 'empty' => {
    if (position < startPosition) return 'skipped';
    if (position === startPosition) return 'start';
    
    const printEndPosition = startPosition + labelsNeeded - 1;
    if (position <= printEndPosition && position <= totalLabels) return 'print';
    return 'empty';
  };
  
  // For large grids (5167), show a simplified view
  const isLargeGrid = totalLabels > 30;
  const visibleRows = isLargeGrid ? Math.min(layoutInfo.rows, 8) : layoutInfo.rows;
  
  const gridCells = useMemo(() => {
    const cells: { position: number; state: ReturnType<typeof getCellState> }[] = [];
    const maxCells = isLargeGrid ? visibleRows * layoutInfo.columns : totalLabels;
    
    for (let i = 1; i <= maxCells; i++) {
      cells.push({ position: i, state: getCellState(i) });
    }
    return cells;
  }, [startPosition, labelsNeeded, totalLabels, layoutInfo.columns, visibleRows, isLargeGrid]);

  return (
    <div className="space-y-3">
      {/* Position dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Start at position:</span>
        <Select
          value={startPosition.toString()}
          onValueChange={(v) => onPositionChange(parseInt(v))}
        >
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-48">
              {Array.from({ length: totalLabels }, (_, i) => i + 1).map((pos) => (
                <SelectItem key={pos} value={pos.toString()} className="text-xs">
                  {pos}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">of {totalLabels}</span>
      </div>

      {/* Visual grid */}
      <div className="border rounded-lg p-2 bg-muted/20">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${layoutInfo.columns}, 1fr)`,
          }}
        >
          {gridCells.map(({ position, state }) => (
            <button
              key={position}
              type="button"
              onClick={() => onPositionChange(position)}
              className={cn(
                "aspect-[2.5/1] text-[9px] font-medium rounded transition-all flex items-center justify-center relative",
                state === 'skipped' && "bg-muted text-muted-foreground/50 line-through",
                state === 'start' && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1",
                state === 'print' && "bg-primary/20 text-primary border border-primary/30",
                state === 'empty' && "bg-background border border-dashed border-muted-foreground/30 text-muted-foreground/50"
              )}
              title={`Position ${position}${state === 'skipped' ? ' (will be skipped)' : state === 'start' ? ' (starting position)' : state === 'print' ? ' (will print)' : ' (empty)'}`}
            >
              {position}
            </button>
          ))}
        </div>
        
        {isLargeGrid && (
          <div className="text-[10px] text-muted-foreground text-center mt-1">
            Showing first {visibleRows} rows of {layoutInfo.rows}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-muted" />
          <span className="text-muted-foreground">Skipped</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-primary" />
          <span className="text-muted-foreground">Start</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-primary/20 border border-primary/30" />
          <span className="text-muted-foreground">Will Print</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm border border-dashed border-muted-foreground/30" />
          <span className="text-muted-foreground">Empty</span>
        </div>
      </div>

      {/* Info text */}
      {startPosition > 1 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span>⚠️</span>
          First {startPosition - 1} position{startPosition > 2 ? 's' : ''} will be left blank
        </p>
      )}
    </div>
  );
}
