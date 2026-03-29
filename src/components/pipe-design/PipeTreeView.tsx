import React from 'react';
import { ChevronRight, ChevronDown, Droplets, AlertTriangle, Gauge, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getVelocityStatus, formatNominalSize } from '@/lib/pipe-calculations';
import { PipeNodeType, getPipeNodeIcon, PIPE_NODE_TYPE_LABELS } from './PipeEquipmentIcons';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

export interface PipeSegmentNode {
  id: string;
  name: string;
  flowGPM: number;
  lengthFt: number | null;
  nominalSize: number | null;
  velocity: number | null;
  headLoss: number | null;
  isCriticalPath: boolean;
  parentId: string | null;
  nodeType?: PipeNodeType;
  children: PipeSegmentNode[];
}

interface PipeTreeViewProps {
  segments: PipeSegmentNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onReorderSegment?: (segmentId: string, newParentId: string | null) => void;
}

interface DraggableTreeNodeProps {
  node: PipeSegmentNode;
  depth: number;
  isSelected: boolean;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  allNodes: PipeSegmentNode[];
}

function DraggableTreeNode({
  node,
  depth,
  isSelected,
  expandedIds,
  onSelect,
  onToggleExpand,
  allNodes,
}: DraggableTreeNodeProps) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.id,
    data: { node },
  });
  
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { node },
  });

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const velocityStatus = node.velocity ? getVelocityStatus(node.velocity) : null;
  const nodeType = node.nodeType;
  const NodeIcon = nodeType ? getPipeNodeIcon(nodeType) : Droplets;

  return (
    <div ref={setDropRef}>
      <div
        ref={setDragRef}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-accent',
          node.isCriticalPath && 'border-l-2 border-primary',
          isDragging && 'opacity-50',
          isOver && 'bg-primary/20 ring-2 ring-primary ring-inset'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </div>

        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        <NodeIcon 
          size={16} 
          className={cn(
            node.isCriticalPath ? 'text-primary' : 'text-muted-foreground'
          )} 
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate text-sm">{node.name}</span>
            {node.isCriticalPath && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Critical
              </Badge>
            )}
            {nodeType && nodeType !== 'pipe' && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {PIPE_NODE_TYPE_LABELS[nodeType]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{node.flowGPM.toFixed(1)} GPM</span>
            {node.nominalSize && (
              <span>{formatNominalSize(node.nominalSize)}</span>
            )}
            {velocityStatus && (
              <span className={velocityStatus.color}>
                {node.velocity?.toFixed(1)} fps
              </span>
            )}
          </div>
        </div>

        {velocityStatus && node.velocity && node.velocity > 10 && (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        )}

        {node.headLoss !== null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Gauge className="h-3 w-3" />
            {node.headLoss.toFixed(2)} ft
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <DraggableTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isSelected={false}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              allNodes={allNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
}


export function PipeTreeView({
  segments,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  onReorderSegment,
}: PipeTreeViewProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const buildTree = (nodes: PipeSegmentNode[]): PipeSegmentNode[] => {
    const nodeMap = new Map<string, PipeSegmentNode>();
    const roots: PipeSegmentNode[] = [];

    // First pass: create a map of all nodes
    nodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Second pass: build the tree
    nodes.forEach((node) => {
      const current = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  };

  const tree = buildTree(segments);

  // Get all descendants of a node (to prevent circular references)
  const getDescendantIds = (nodeId: string, nodes: PipeSegmentNode[]): Set<string> => {
    const ids = new Set<string>();
    const findChildren = (id: string) => {
      const children = nodes.filter(n => n.parentId === id);
      children.forEach(child => {
        ids.add(child.id);
        findChildren(child.id);
      });
    };
    findChildren(nodeId);
    return ids;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onReorderSegment) return;

    const draggedId = active.id as string;
    const overIdRaw = over.id as string;

    // Check if dropping on root zone
    if (overIdRaw === 'drop-root') {
      onReorderSegment(draggedId, null);
      return;
    }

    const droppedOnId = overIdRaw.replace('drop-', '');

    // Don't drop on self
    if (draggedId === droppedOnId) return;

    // Don't allow dropping on descendants (would create circular reference)
    const descendants = getDescendantIds(draggedId, segments);
    if (descendants.has(droppedOnId)) return;

    // Update parent
    onReorderSegment(draggedId, droppedOnId);
  };

  const activeNode = activeId ? segments.find(s => s.id === activeId) : null;

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <Droplets className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No pipe segments</p>
        <p className="text-xs">Add segments to start designing</p>
      </div>
    );
  }

  // Root drop zone for making items root-level
  const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
    id: 'drop-root',
    data: { node: null },
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-0.5">
        {/* Root drop zone */}
        <div
          ref={setRootDropRef}
          className={cn(
            'h-2 rounded transition-colors',
            isOverRoot && 'bg-primary/30'
          )}
        />

        {tree.map((node) => (
          <DraggableTreeNode
            key={node.id}
            node={node}
            depth={0}
            isSelected={selectedId === node.id}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggleExpand={onToggleExpand}
            allNodes={segments}
          />
        ))}
      </div>

      <DragOverlay>
        {activeNode && (
          <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-md shadow-lg">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{activeNode.name}</span>
            <span className="text-xs text-muted-foreground">{activeNode.flowGPM.toFixed(1)} GPM</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
