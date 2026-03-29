import { useMemo } from 'react';
import { PipeSegmentData } from '@/components/pipe-design/PipeSegmentPropertiesPanel';

export interface PipeTreeNode {
  segment: PipeSegmentData;
  children: PipeTreeNode[];
  cumulativeHeadLoss: number;
  depth: number;
}

export interface CircuitAnalysis {
  circuitId: string;
  circuitName: string;
  leafSegmentId: string;
  headLoss: number;
  flow: number;
  deltaFromCritical: number;
  balanceValveRequired: boolean;
  recommendedCv: number | null;
  isCriticalPath: boolean;
  pathSegmentIds: string[];
}

export interface LoopAnalysis {
  loopId: string;
  loopName: string;
  branchPoint: string;
  circuits: string[];
  maxHeadLoss: number;
  minHeadLoss: number;
  imbalance: number;
  balancingValves: BalancingValveRecommendation[];
}

export interface BalancingValveRecommendation {
  circuitId: string;
  circuitName: string;
  position: 'supply' | 'return';
  requiredPressureDrop: number;
  recommendedCv: number;
  flowGPM: number;
}

export interface PipeSystemAnalysis {
  criticalPath: string[];
  criticalPathHeadLoss: number;
  circuits: CircuitAnalysis[];
  loops: LoopAnalysis[];
  maxCircuitDelta: number;
  isBalanced: boolean;
  totalFlow: number;
  averageVelocity: number;
}

// Build tree structure from flat segment array
export function buildPipeTree(segments: PipeSegmentData[]): PipeTreeNode[] {
  const nodeMap = new Map<string, PipeTreeNode>();
  const roots: PipeTreeNode[] = [];

  // First pass: create nodes for all segments
  segments.forEach((segment) => {
    nodeMap.set(segment.id, {
      segment,
      children: [],
      cumulativeHeadLoss: 0,
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

// Find all leaf nodes (endpoints)
function findLeafNodes(nodes: PipeTreeNode[]): PipeTreeNode[] {
  const leaves: PipeTreeNode[] = [];

  function traverse(node: PipeTreeNode) {
    if (node.children.length === 0) {
      leaves.push(node);
    } else {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return leaves;
}

// Find branch points (nodes with multiple children)
function findBranchPoints(nodes: PipeTreeNode[]): Map<string, PipeTreeNode> {
  const branchPoints = new Map<string, PipeTreeNode>();

  function traverse(node: PipeTreeNode) {
    if (node.children.length > 1) {
      branchPoints.set(node.segment.id, node);
    }
    node.children.forEach(traverse);
  }

  nodes.forEach(traverse);
  return branchPoints;
}

// Trace path from leaf back to root, calculating cumulative head loss
function tracePathToRoot(
  node: PipeTreeNode,
  segments: PipeSegmentData[],
  nodeMap: Map<string, PipeTreeNode>
): { path: string[]; headLoss: number } {
  const path: string[] = [];
  let headLoss = 0;
  let current: PipeSegmentData | undefined = node.segment;

  while (current) {
    path.unshift(current.id);
    headLoss += current.totalHeadLoss || 0;
    
    if (current.parentId) {
      const parentNode = nodeMap.get(current.parentId);
      current = parentNode?.segment;
    } else {
      current = undefined;
    }
  }

  return { path, headLoss };
}

// Calculate required Cv for balance valve
// Cv = Q / sqrt(deltaP in psi), where 1 ft H2O = 0.433 psi
function calculateBalanceValveCv(flowGPM: number, deltaP_ft: number): number | null {
  if (deltaP_ft <= 0 || flowGPM <= 0) return null;
  const deltaP_psi = deltaP_ft * 0.433;
  return flowGPM / Math.sqrt(deltaP_psi);
}

// Detect parallel loops and calculate balancing requirements
function analyzeLoops(
  roots: PipeTreeNode[],
  circuits: CircuitAnalysis[],
  nodeMap: Map<string, PipeTreeNode>
): LoopAnalysis[] {
  const branchPoints = findBranchPoints(roots);
  const loops: LoopAnalysis[] = [];
  let loopIndex = 1;

  branchPoints.forEach((branchNode, branchId) => {
    // Find all circuits that pass through this branch point
    const branchCircuits = circuits.filter(c => 
      c.pathSegmentIds.includes(branchId)
    );

    if (branchCircuits.length < 2) return;

    // Calculate head loss from branch point to each circuit end
    const circuitHeadLosses = branchCircuits.map(c => {
      const branchIndex = c.pathSegmentIds.indexOf(branchId);
      const downstreamIds = c.pathSegmentIds.slice(branchIndex);
      const downstreamHeadLoss = downstreamIds.reduce((sum, id) => {
        const node = nodeMap.get(id);
        return sum + (node?.segment.totalHeadLoss || 0);
      }, 0);
      return { circuit: c, downstreamHeadLoss };
    });

    const maxHeadLoss = Math.max(...circuitHeadLosses.map(c => c.downstreamHeadLoss));
    const minHeadLoss = Math.min(...circuitHeadLosses.map(c => c.downstreamHeadLoss));
    const imbalance = maxHeadLoss - minHeadLoss;

    // Only create loop analysis if there's significant imbalance
    if (imbalance <= 0.5) return;

    // Generate balancing valve recommendations for non-critical circuits
    const balancingValves: BalancingValveRecommendation[] = circuitHeadLosses
      .filter(c => c.downstreamHeadLoss < maxHeadLoss)
      .map(c => {
        const requiredDrop = maxHeadLoss - c.downstreamHeadLoss;
        const cv = calculateBalanceValveCv(c.circuit.flow, requiredDrop);
        return {
          circuitId: c.circuit.circuitId,
          circuitName: c.circuit.circuitName,
          position: 'return' as const,
          requiredPressureDrop: requiredDrop,
          recommendedCv: cv || 0,
          flowGPM: c.circuit.flow,
        };
      })
      .filter(v => v.recommendedCv > 0);

    loops.push({
      loopId: `loop-${loopIndex++}`,
      loopName: `Loop at ${branchNode.segment.name}`,
      branchPoint: branchId,
      circuits: branchCircuits.map(c => c.circuitId),
      maxHeadLoss,
      minHeadLoss,
      imbalance,
      balancingValves,
    });
  });

  return loops;
}

// Main analysis function
export function analyzePipeSystem(segments: PipeSegmentData[]): PipeSystemAnalysis {
  if (segments.length === 0) {
    return {
      criticalPath: [],
      criticalPathHeadLoss: 0,
      circuits: [],
      loops: [],
      maxCircuitDelta: 0,
      isBalanced: true,
      totalFlow: 0,
      averageVelocity: 0,
    };
  }

  // Build tree
  const roots = buildPipeTree(segments);
  
  // Create node map for path tracing
  const nodeMap = new Map<string, PipeTreeNode>();
  function mapNodes(node: PipeTreeNode) {
    nodeMap.set(node.segment.id, node);
    node.children.forEach(mapNodes);
  }
  roots.forEach(mapNodes);

  // Find all leaf nodes
  const leaves = findLeafNodes(roots);

  if (leaves.length === 0) {
    return {
      criticalPath: [],
      criticalPathHeadLoss: 0,
      circuits: [],
      loops: [],
      maxCircuitDelta: 0,
      isBalanced: true,
      totalFlow: 0,
      averageVelocity: 0,
    };
  }

  // Trace paths from all leaves to find critical path
  const circuitPaths: { leaf: PipeTreeNode; path: string[]; headLoss: number }[] = [];
  
  leaves.forEach((leaf) => {
    const { path, headLoss } = tracePathToRoot(leaf, segments, nodeMap);
    circuitPaths.push({ leaf, path, headLoss });
  });

  // Find critical path (highest head loss)
  const criticalCircuit = circuitPaths.reduce((max, c) => 
    c.headLoss > max.headLoss ? c : max, circuitPaths[0]
  );

  const criticalPath = criticalCircuit.path;
  const criticalPathHeadLoss = criticalCircuit.headLoss;
  const criticalPathSet = new Set(criticalPath);

  // Calculate circuit analysis
  const circuitAnalyses: CircuitAnalysis[] = circuitPaths.map((c, i) => {
    const delta = criticalPathHeadLoss - c.headLoss;
    const balanceRequired = delta > 2; // More than 2 ft difference needs balancing
    const isCritical = c.path.every(id => criticalPathSet.has(id)) && 
                       c.path.length === criticalPath.length;
    
    return {
      circuitId: `circuit-${i + 1}`,
      circuitName: c.leaf.segment.name,
      leafSegmentId: c.leaf.segment.id,
      headLoss: c.headLoss,
      flow: c.leaf.segment.flowGPM,
      deltaFromCritical: delta,
      balanceValveRequired: balanceRequired,
      recommendedCv: balanceRequired ? calculateBalanceValveCv(c.leaf.segment.flowGPM, delta) : null,
      isCriticalPath: isCritical,
      pathSegmentIds: c.path,
    };
  });

  // Analyze parallel loops
  const loops = analyzeLoops(roots, circuitAnalyses, nodeMap);

  const maxCircuitDelta = Math.max(...circuitAnalyses.map((c) => c.deltaFromCritical), 0);
  const isBalanced = maxCircuitDelta <= 2;

  // Calculate totals
  const totalFlow = segments.reduce((sum, s) => {
    // Only count flow at leaf nodes to avoid double counting
    const isLeaf = !segments.some(other => other.parentId === s.id);
    return isLeaf ? sum + s.flowGPM : sum;
  }, 0);

  const velocities = segments.filter(s => s.velocity && s.velocity > 0).map(s => s.velocity!);
  const averageVelocity = velocities.length > 0 
    ? velocities.reduce((a, b) => a + b, 0) / velocities.length 
    : 0;

  return {
    criticalPath,
    criticalPathHeadLoss,
    circuits: circuitAnalyses,
    loops,
    maxCircuitDelta,
    isBalanced,
    totalFlow,
    averageVelocity,
  };
}

// React hook for pipe system analysis
export function usePipeSystemAnalysis(segments: PipeSegmentData[]) {
  const analysis = useMemo(() => analyzePipeSystem(segments), [segments]);

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

// Get color for circuit based on delta
export function getCircuitBalanceColor(delta: number): string {
  if (delta <= 2) return 'text-emerald-600';
  if (delta <= 5) return 'text-amber-500';
  return 'text-destructive';
}

// Get status label for circuit balance
export function getCircuitBalanceStatus(delta: number): string {
  if (delta <= 2) return 'Balanced';
  if (delta <= 5) return 'Minor Imbalance';
  return 'Needs Balancing';
}

// Get loop status color
export function getLoopBalanceColor(imbalance: number): string {
  if (imbalance <= 1) return 'text-emerald-600';
  if (imbalance <= 3) return 'text-amber-500';
  return 'text-destructive';
}

// Format Cv value for display
export function formatCv(cv: number): string {
  if (cv < 1) return cv.toFixed(2);
  if (cv < 10) return cv.toFixed(1);
  return Math.round(cv).toString();
}
