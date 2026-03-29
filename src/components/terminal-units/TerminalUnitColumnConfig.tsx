import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ScheduleColumn } from '@/hooks/useTerminalUnitScheduleExport';

interface SortableColumnItemProps {
  column: ScheduleColumn;
  onToggle: () => void;
  onLabelChange: (label: string) => void;
}

function SortableColumnItem({ column, onToggle, onLabelChange }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-md border ${
        column.enabled 
          ? 'bg-background border-border' 
          : 'bg-muted/30 border-muted'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <Input
        value={column.label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="h-7 text-sm flex-1"
        disabled={!column.enabled}
      />
      
      <button
        onClick={onToggle}
        className={`p-1.5 rounded hover:bg-muted transition-colors ${
          column.enabled ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {column.enabled ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

interface TerminalUnitColumnConfigProps {
  columns: ScheduleColumn[];
  onColumnsChange: (columns: ScheduleColumn[]) => void;
}

// Essential columns that should always be shown in "Essential Only" mode
const ESSENTIAL_COLUMN_KEYS = ['unit_tag', 'unit_type', 'quantity', 'zone_name', 'inlet_size_in', 'supply_cfm'];

export function TerminalUnitColumnConfig({
  columns,
  onColumnsChange,
}: TerminalUnitColumnConfigProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((c) => c.key === active.id);
      const newIndex = columns.findIndex((c) => c.key === over.id);
      onColumnsChange(arrayMove(columns, oldIndex, newIndex));
    }
  };

  const toggleColumn = (key: string) => {
    onColumnsChange(
      columns.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const updateLabel = (key: string, label: string) => {
    onColumnsChange(
      columns.map((c) => (c.key === key ? { ...c, label } : c))
    );
  };

  const enableAll = () => {
    onColumnsChange(columns.map((c) => ({ ...c, enabled: true })));
  };

  const showEssentialOnly = () => {
    onColumnsChange(
      columns.map((c) => ({
        ...c,
        enabled: ESSENTIAL_COLUMN_KEYS.includes(c.key),
      }))
    );
  };

  const enabledCount = columns.filter((c) => c.enabled).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Column Configuration</CardTitle>
            <CardDescription className="text-xs">
              Drag to reorder, click eye to toggle visibility
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {enabledCount} of {columns.length}
          </Badge>
        </div>
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={enableAll}
            className="text-xs h-7"
          >
            Show All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={showEssentialOnly}
            className="text-xs h-7"
          >
            Essential Only
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {columns.map((column) => (
                <SortableColumnItem
                  key={column.key}
                  column={column}
                  onToggle={() => toggleColumn(column.key)}
                  onLabelChange={(label) => updateLabel(column.key, label)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
