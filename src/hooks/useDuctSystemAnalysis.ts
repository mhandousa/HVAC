import { useMemo } from 'react';
import { SegmentData } from '@/components/duct-design/SegmentPropertiesPanel';

export interface DuctTreeNode {
  segment: SegmentData;
  children: DuctTreeNode[];
  cumulativePressureDrop: number;
  depth: number;
}

export interface BranchAnalysis {
  branchId: string;
  branchName: string;
  terminalSegmentId: string;
  pressureDrop: number;
  cfm: number;
  deltaFromCritical: number;
  damperRequired: boolean;
  recommendedDamperPosition: number | null;
}

export interface DuctSystemAnalysis {
  criticalPath: string[];
  criticalPathPressureDrop: number;
  branches: BranchAnalysis[];
  maxBranchDelta: number;
  isBalanced: boolean;
  totalCFM: number;
  maxVelocity: number;
}

// Build tree structure from flat segment array
export function buildDuctTree(segments: SegmentData[]): DuctTreeNode[] {
  const nodeMap = new Map<string, DuctTreeNode>();
  const roots: DuctTreeNode[] = [];

  // First pass: create nodes for all segments
  segments.forEach((segment) => {
    nodeMap.set(segment.id, {
      segment,
      children: [],
      cumulativePressureDrop: 0,
      depth: 0,
    });
  });

  // Second pass: build tree relationships
  segments.forEach((segment) => {
    const node = nodeMap.get(segment.id)!;
    if (segment.parentId && nodeMap.has(segment.parentId)) {
      const parentNode = nodeMap.get(segment.parentId)!;
      parentNode.children.push(node);
      node.depth = parentNode.depth + 1;
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Find all leaf nodes (terminals/diffusers)
function findLeafNodes(nodes: DuctTreeNode[]): DuctTreeNode[] {
  const leaves: DuctTreeNode[] = [];

  function traverse(node: DuctTreeNode) {
    if (node.children.length === 0) {
      leaves.push(node);
    } else {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return leaves;
}

// Trace path from leaf back to root, calculating cumulative pressure drop
function tracePathToRoot(
  node: DuctTreeNode,
  segments: SegmentData[],
  nodeMap: Map<string, DuctTreeNode>
): { path: string[]; pressureDrop: number } {
  const path: string[] = [];
  let pressureDrop = 0;
  let current: SegmentData | undefined = node.segment;

  while (current) {
    path.unshift(current.id);
    pressureDrop += current.totalPressureDropPa || 0;
    
    if (current.parentId) {
      const parentNode = nodeMap.get(current.parentId);
      current = parentNode?.segment;
    } else {
      current = undefined;
    }
  }

  return { path, pressureDrop };
}

// Calculate recommended damper position (0-100%) based on pressure difference
function calculateDamperPosition(deltaP: number, maxDelta: number): number | null {
  if (deltaP <= 0 || maxDelta <= 0) return null;
  // Higher delta means we need to restrict more
  const position = Math.min(100, Math.max(10, (deltaP / maxDelta) * 80 + 10));
  return Math.round(position);
}

// Main analysis function
export function analyzeDuctSystem(segments: SegmentData[]): DuctSystemAnalysis {
  if (segments.length === 0) {
    return {
      criticalPath: [],
      criticalPathPressureDrop: 0,
      branches: [],
      maxBranchDelta: 0,
      isBalanced: true,
      totalCFM: 0,
      maxVelocity: 0,
    };
  }

  // Build tree
  const roots = buildDuctTree(segments);
  
  // Create node map for path tracing
  const nodeMap = new Map<string, DuctTreeNode>();
  function mapNodes(node: DuctTreeNode) {
    nodeMap.set(node.segment.id, node);
    node.children.forEach(mapNodes);
  }
  roots.forEach(mapNodes);

  // Find all leaf nodes
  const leaves = findLeafNodes(roots);

  // Calculate summary stats
  const totalCFM = Math.max(...segments.map(s => s.cfm), 0);
  const maxVelocity = Math.max(...segments.map(s => s.velocityFpm || 0), 0);

  if (leaves.length === 0) {
    return {
      criticalPath: [],
      criticalPathPressureDrop: 0,
      branches: [],
      maxBranchDelta: 0,
      isBalanced: true,
      totalCFM,
      maxVelocity,
    };
  }

  // Trace paths from all leaves to find critical path
  const branches: { leaf: DuctTreeNode; path: string[]; pressureDrop: number }[] = [];
  
  leaves.forEach((leaf) => {
    const { path, pressureDrop } = tracePathToRoot(leaf, segments, nodeMap);
    branches.push({ leaf, path, pressureDrop });
  });

  // Find critical path (highest pressure drop)
  const criticalBranch = branches.reduce((max, b) => 
    b.pressureDrop > max.pressureDrop ? b : max, branches[0]
  );

  const criticalPath = criticalBranch.path;
  const criticalPathPressureDrop = criticalBranch.pressureDrop;

  // Calculate branch analysis
  const maxDelta = Math.max(...branches.map(b => criticalPathPressureDrop - b.pressureDrop), 0);
  
  const branchAnalyses: BranchAnalysis[] = branches.map((b, i) => {
    const delta = criticalPathPressureDrop - b.pressureDrop;
    // More than 10 Pa difference may need damper adjustment
    const damperRequired = delta > 10;
    
    return {
      branchId: `branch-${i + 1}`,
      branchName: b.leaf.segment.name,
      terminalSegmentId: b.leaf.segment.id,
      pressureDrop: b.pressureDrop,
      cfm: b.leaf.segment.cfm,
      deltaFromCritical: delta,
      damperRequired,
      recommendedDamperPosition: damperRequired ? calculateDamperPosition(delta, maxDelta) : null,
    };
  });

  const maxBranchDelta = Math.max(...branchAnalyses.map(b => b.deltaFromCritical), 0);
  const isBalanced = maxBranchDelta <= 10; // Within 10 Pa is considered balanced

  return {
    criticalPath,
    criticalPathPressureDrop,
    branches: branchAnalyses,
    maxBranchDelta,
    isBalanced,
    totalCFM,
    maxVelocity,
  };
}

// React hook for duct system analysis
export function useDuctSystemAnalysis(segments: SegmentData[]) {
  const analysis = useMemo(() => analyzeDuctSystem(segments), [segments]);

  // Mark segments on critical path
  const segmentsWithCriticalPath = useMemo(() => {
    const criticalSet = new Set(analysis.criticalPath);
    return segments.map((seg) => ({
      ...seg,
      isCriticalPath: criticalSet.has(seg.id),
    }));
  }, [segments, analysis.criticalPath]);

  return {
    analysis,
    segmentsWithCriticalPath,
    criticalPathIds: new Set(analysis.criticalPath),
  };
}

// Get color for branch based on delta
export function getBranchBalanceColor(delta: number): string {
  if (delta <= 10) return 'text-emerald-600';
  if (delta <= 25) return 'text-amber-500';
  return 'text-destructive';
}

// Get status label for branch balance
export function getBranchBalanceStatus(delta: number): string {
  if (delta <= 10) return 'Balanced';
  if (delta <= 25) return 'Minor Imbalance';
  return 'Needs Damper';
}
