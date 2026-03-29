import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleColumn } from '@/hooks/useEquipmentSchedule';

interface ScheduleColumnConfigProps {
  columns: ScheduleColumn[];
  onColumnsChange: (columns: ScheduleColumn[]) => void;
}

function SortableColumnItem({ 
  column, 
  onToggle, 
  onLabelChange 
}: { 
  column: ScheduleColumn; 
  onToggle: () => void;
  onLabelChange: (label: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-background border rounded-md ${
        column.enabled ? 'border-primary/30' : 'border-border opacity-60'
      }`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <Input
        value={column.label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="flex-1 h-8 text-sm"
        placeholder="Column label"
      />
      
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onToggle}
      >
        {column.enabled ? (
          <Eye className="h-4 w-4 text-primary" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

export function ScheduleColumnConfig({ columns, onColumnsChange }: ScheduleColumnConfigProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(c => c.id === active.id);
      const newIndex = columns.findIndex(c => c.id === over.id);
      onColumnsChange(arrayMove(columns, oldIndex, newIndex));
    }
  };

  const toggleColumn = (columnId: string) => {
    onColumnsChange(
      columns.map(c => c.id === columnId ? { ...c, enabled: !c.enabled } : c)
    );
  };

  const updateLabel = (columnId: string, label: string) => {
    onColumnsChange(
      columns.map(c => c.id === columnId ? { ...c, label } : c)
    );
  };

  const enableAll = () => {
    onColumnsChange(columns.map(c => ({ ...c, enabled: true })));
  };

  const disableOptional = () => {
    const requiredIds = ['tag', 'name', 'location'];
    onColumnsChange(
      columns.map(c => ({ ...c, enabled: requiredIds.includes(c.id) }))
    );
  };

  const enabledCount = columns.filter(c => c.enabled).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Column Configuration</CardTitle>
          <span className="text-sm text-muted-foreground">
            {enabledCount} of {columns.length} visible
          </span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={enableAll}>
            Show All
          </Button>
          <Button variant="outline" size="sm" onClick={disableOptional}>
            Essential Only
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Drag to reorder • Click eye to toggle • Edit labels inline
        </Label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {columns.map(column => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  onToggle={() => toggleColumn(column.id)}
                  onLabelChange={(label) => updateLabel(column.id, label)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
