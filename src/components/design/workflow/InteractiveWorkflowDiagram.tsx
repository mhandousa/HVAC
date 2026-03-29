import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize2, Layers, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowEdge } from './WorkflowEdge';
import { WorkflowLegend } from './WorkflowLegend';
import { WorkflowTooltip } from './WorkflowTooltip';
import {
  stageNodes,
  toolNodes,
  allEdges,
  getNodePosition,
  getUpstreamNodes,
  getDownstreamNodes,
  DIAGRAM_CONFIG,
  type WorkflowNode as WorkflowNodeType,
  type NodeStatus
} from '@/lib/workflow-diagram-data';
import { useDesignWorkflowProgress } from '@/hooks/useDesignWorkflowProgress';
import { cn } from '@/lib/utils';

interface InteractiveWorkflowDiagramProps {
  projectId?: string | null;
  className?: string;
  embedded?: boolean;
}

type ViewMode = 'stages' | 'tools';

export function InteractiveWorkflowDiagram({ 
  projectId, 
  className,
  embedded = false 
}: InteractiveWorkflowDiagramProps) {
  const navigate = useNavigate();
  const { data: progress } = useDesignWorkflowProgress(projectId ?? null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('stages');
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltipNode, setTooltipNode] = useState<WorkflowNodeType | null>(null);

  // Get current nodes based on view mode
  const nodes = useMemo(() => {
    return viewMode === 'stages' ? stageNodes : [...stageNodes, ...toolNodes];
  }, [viewMode]);

  // Get edges based on view mode
  const edges = useMemo(() => {
    if (viewMode === 'stages') {
      return allEdges.filter(e => 
        stageNodes.some(n => n.id === e.from) && 
        stageNodes.some(n => n.id === e.to)
      );
    }
    return allEdges;
  }, [viewMode]);

  // Get node status from progress data
  const getNodeStatus = useCallback((nodeId: string): NodeStatus => {
    if (!progress) return 'pending';
    
    const stageProgress = progress.stages.find(s => 
      s.stageId.toLowerCase().includes(nodeId) || 
      nodeId.includes(s.stageId.toLowerCase())
    );
    
    if (!stageProgress) return 'pending';
    if (stageProgress.isComplete) return 'complete';
    if (stageProgress.hasData) return 'in-progress';
    
    // Check if prerequisites are met
    const upstreamIds = getUpstreamNodes(nodeId);
    const allUpstreamComplete = upstreamIds.every(upId => {
      const upProgress = progress.stages.find(s => 
        s.stageId.toLowerCase().includes(upId)
      );
      return upProgress?.isComplete || upProgress?.hasData;
    });
    
    return allUpstreamComplete ? 'pending' : 'locked';
  }, [progress]);

  // Check if node is highlighted (hovered or selected)
  const isNodeHighlighted = useCallback((nodeId: string) => {
    return hoveredNode === nodeId || selectedNode === nodeId;
  }, [hoveredNode, selectedNode]);

  // Check if node is upstream of highlighted node
  const isUpstream = useCallback((nodeId: string) => {
    const targetId = hoveredNode || selectedNode;
    if (!targetId) return false;
    return getUpstreamNodes(targetId).includes(nodeId);
  }, [hoveredNode, selectedNode]);

  // Check if node is downstream of highlighted node
  const isDownstream = useCallback((nodeId: string) => {
    const targetId = hoveredNode || selectedNode;
    if (!targetId) return false;
    return getDownstreamNodes(targetId).includes(nodeId);
  }, [hoveredNode, selectedNode]);

  // Handle node click
  const handleNodeClick = useCallback((node: WorkflowNodeType) => {
    if (selectedNode === node.id) {
      // If clicking same node, navigate
      const url = projectId ? `${node.path}?project=${projectId}` : node.path;
      navigate(url);
    } else {
      // First click selects, shows tooltip
      setSelectedNode(node.id);
      setTooltipNode(node);
    }
  }, [selectedNode, projectId, navigate]);

  // Handle zoom
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleFitView = () => setZoom(1);

  // Calculate canvas dimensions
  const canvasWidth = DIAGRAM_CONFIG.canvasWidth * zoom;
  const canvasHeight = DIAGRAM_CONFIG.canvasHeight * zoom;

  // Get tooltip position
  const getTooltipPosition = useCallback((node: WorkflowNodeType) => {
    const pos = getNodePosition(node);
    return {
      x: pos.x * zoom,
      y: pos.y * zoom
    };
  }, [zoom]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">HVAC Design Workflow</h3>
          {progress && (
            <span className="text-xs text-muted-foreground">
              ({Math.round(progress.overallProgress)}% complete)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            size="sm"
          >
            <ToggleGroupItem value="stages" aria-label="Stage view">
              <Layers className="h-4 w-4 mr-1" />
              Stages
            </ToggleGroupItem>
            <ToggleGroupItem value="tools" aria-label="Tool view">
              <GitBranch className="h-4 w-4 mr-1" />
              Tools
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Zoom controls */}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFitView}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Diagram canvas */}
      <div 
        className="relative overflow-auto bg-background flex-1"
        style={{ minHeight: embedded ? 400 : 600 }}
        onClick={() => {
          setSelectedNode(null);
          setTooltipNode(null);
        }}
      >
        <svg
          width={canvasWidth}
          height={canvasHeight}
          className="mx-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {/* CSS for animations */}
          <defs>
            <style>
              {`
                @keyframes flowPulse {
                  0% { stroke-dashoffset: 20; }
                  100% { stroke-dashoffset: 0; }
                }
                .workflow-edge-animated {
                  animation: flowPulse 1s linear infinite;
                }
              `}
            </style>
          </defs>

          {/* Edges layer */}
          <g className="edges">
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const fromPos = getNodePosition(fromNode);
              const toPos = getNodePosition(toNode);
              const isEdgeHighlighted = 
                isNodeHighlighted(edge.from) || 
                isNodeHighlighted(edge.to) ||
                (hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode));

              return (
                <WorkflowEdge
                  key={edge.id}
                  edge={edge}
                  fromPos={fromPos}
                  toPos={toPos}
                  isHighlighted={!!isEdgeHighlighted}
                  nodeRadius={DIAGRAM_CONFIG.stageNodeRadius}
                />
              );
            })}
          </g>

          {/* Nodes layer */}
          <g className="nodes">
            {nodes.map(node => {
              const pos = getNodePosition(node);
              const status = getNodeStatus(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node);
                  }}
                >
                  <WorkflowNode
                    node={node}
                    status={status}
                    isHighlighted={isNodeHighlighted(node.id)}
                    isUpstream={isUpstream(node.id)}
                    isDownstream={isDownstream(node.id)}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip overlay */}
        {tooltipNode && (
          <WorkflowTooltip
            node={tooltipNode}
            position={getTooltipPosition(tooltipNode)}
            onNavigate={() => {
              const url = projectId 
                ? `${tooltipNode.path}?project=${projectId}` 
                : tooltipNode.path;
              navigate(url);
            }}
          />
        )}
      </div>

      {/* Legend */}
      {!embedded && <WorkflowLegend />}
    </div>
  );
}
