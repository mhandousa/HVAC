import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ChevronDown, ChevronRight, Wind, Minus, AlertTriangle, CheckCircle2, Grip, Box, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DuctNodeType, DUCT_NODE_TYPE_LABELS, getDuctNodeIcon } from './DuctEquipmentIcons';

export interface DuctTreeNode {
  id: string;
  name: string;
  type: 'ahu' | 'main' | 'branch' | 'terminal' | 'diffuser';
  nodeType?: DuctNodeType;
  cfm: number;
  sized?: boolean;
  hasWarning?: boolean;
  isCriticalPath?: boolean;
  children?: DuctTreeNode[];
  pressureDrop?: number;
  velocity?: number;
  parentId?: string | null;
}

interface DuctTreeViewProps {
  nodes: DuctTreeNode[];
  selectedId?: string;
  onSelect: (id: string) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  onReorderSegment?: (segmentId: string, newParentId: string | null) => void;
}

const getNodeIcon = (type: DuctTreeNode['type'], nodeType?: DuctNodeType) => {
  // If a specific nodeType is set, use that icon
  if (nodeType && nodeType !== 'duct') {
    const IconComponent = getDuctNodeIcon(nodeType);
    return <IconComponent className="w-4 h-4 text-primary" size={16} />;
  }
  
  // Otherwise fall back to type-based icons
  switch (type) {
    case 'ahu':
      return <Box className="w-4 h-4 text-primary" />;
    case 'main':
      return <Minus className="w-4 h-4 text-primary rotate-90" />;
    case 'branch':
      return <Minus className="w-4 h-4 text-muted-foreground rotate-45" />;
    case 'terminal':
    case 'diffuser':
      return <Wind className="w-4 h-4 text-muted-foreground" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (node: DuctTreeNode) => {
  if (node.hasWarning) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
        </TooltipTrigger>
        <TooltipContent>High velocity or pressure warning</TooltipContent>
      </Tooltip>
    );
  }
  if (node.sized) {
    return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
  }
  return null;
};

interface DraggableNodeProps {
  id: string;
  children: React.ReactNode;
}

function DraggableNode({ id, children }: DraggableNodeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
}

function DroppableZone({ id, children }: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-md transition-colors',
        isOver && 'bg-primary/10 ring-1 ring-primary/30'
      )}
    >
      {children}
    </div>
  );
}

interface TreeNodeItemProps {
  node: DuctTreeNode;
  depth: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  enableDrag: boolean;
}

function TreeNodeItem({ 
  node, 
  depth, 
  selectedId, 
  onSelect,
  isExpanded,
  onToggleExpand,
  enableDrag,
}: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors group',
        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
        node.isCriticalPath && 'border-l-2 border-warning'
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={() => onSelect(node.id)}
    >
      {/* Expand/Collapse */}
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
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </Button>
      ) : (
        <div className="w-5" />
      )}

      {/* Icon */}
      {getNodeIcon(node.type, node.nodeType)}

      {/* Name */}
      <span className="flex-1 text-sm font-medium truncate">{node.name}</span>

      {/* CFM Badge */}
      <Badge variant="outline" className="text-xs font-mono">
        {node.cfm.toLocaleString()} CFM
      </Badge>

      {/* Status */}
      {getStatusBadge(node)}

      {/* Drag Handle */}
      {enableDrag && (
        <Grip className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      )}
    </div>
  );

  const nodeElement = enableDrag ? (
    <DroppableZone id={`drop-${node.id}`}>
      <DraggableNode id={node.id}>{content}</DraggableNode>
    </DroppableZone>
  ) : (
    content
  );

  return (
    <div>
      {nodeElement}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              isExpanded={true}
              onToggleExpand={onToggleExpand}
              enableDrag={enableDrag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DuctTreeView({ 
  nodes, 
  selectedId, 
  onSelect, 
  expandedIds,
  onToggleExpand,
  onReorderSegment 
}: DuctTreeViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Default expand handler if none provided
  const handleToggleExpand = onToggleExpand || (() => {});
  const isExpanded = (id: string) => expandedIds?.has(id) ?? true;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
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

    // Check for circular reference
    const isDescendant = (parentId: string, childId: string): boolean => {
      const findNode = (nodes: DuctTreeNode[], id: string): DuctTreeNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const checkDescendants = (node: DuctTreeNode): boolean => {
        if (node.id === childId) return true;
        if (node.children) {
          return node.children.some(checkDescendants);
        }
        return false;
      };

      const parentNode = findNode(nodes, parentId);
      return parentNode ? checkDescendants(parentNode) : false;
    };

    if (isDescendant(draggedId, droppedOnId)) {
      return; // Prevent circular reference
    }

    onReorderSegment(draggedId, droppedOnId);
  };

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Wind className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No duct segments</p>
        <p className="text-xs">Add segments to begin</p>
      </div>
    );
  }

  const treeContent = (
    <div className="space-y-0.5">
      {onReorderSegment && (
        <DroppableZone id="drop-root">
          <div className="h-2 rounded-sm hover:bg-primary/10 transition-colors" />
        </DroppableZone>
      )}
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          isExpanded={isExpanded(node.id)}
          onToggleExpand={handleToggleExpand}
          enableDrag={!!onReorderSegment}
        />
      ))}
    </div>
  );

  if (onReorderSegment) {
    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {treeContent}
      </DndContext>
    );
  }

  return treeContent;
}
