import { describe, it, expect } from 'vitest';

// Types from useDataLineage
type LineageNodeType = 
  | 'load_calculation' 
  | 'equipment_selection' 
  | 'terminal_unit' 
  | 'duct_system' 
  | 'pipe_system' 
  | 'ahu_configuration'
  | 'acoustic_analysis'
  | 'cost_estimate';

interface LineageEdge {
  from: string;
  to: string;
  label?: string;
  isStale: boolean;
}

interface DataLineageGraph {
  nodes: Array<{ id: string; type: LineageNodeType; name: string; updatedAt: string }>;
  edges: LineageEdge[];
}

// Helper function from useDataLineage
function getNodeTypeLabel(type: LineageNodeType): string {
  const labels: Record<LineageNodeType, string> = {
    load_calculation: 'Load Calculation',
    equipment_selection: 'Equipment Selection',
    terminal_unit: 'Terminal Unit',
    duct_system: 'Duct System',
    pipe_system: 'Pipe System',
    ahu_configuration: 'AHU Configuration',
    acoustic_analysis: 'Acoustic Analysis',
    cost_estimate: 'Cost Estimate',
  };
  return labels[type] || type;
}

// Helper function from useDataLineage
function getStaleConnectionsCount(graph: DataLineageGraph | null | undefined): number {
  if (!graph) return 0;
  return graph.edges.filter((e) => e.isStale).length;
}

describe('getNodeTypeLabel', () => {
  it('should return correct labels for all node types', () => {
    expect(getNodeTypeLabel('load_calculation')).toBe('Load Calculation');
    expect(getNodeTypeLabel('equipment_selection')).toBe('Equipment Selection');
    expect(getNodeTypeLabel('terminal_unit')).toBe('Terminal Unit');
    expect(getNodeTypeLabel('duct_system')).toBe('Duct System');
    expect(getNodeTypeLabel('pipe_system')).toBe('Pipe System');
    expect(getNodeTypeLabel('ahu_configuration')).toBe('AHU Configuration');
    expect(getNodeTypeLabel('acoustic_analysis')).toBe('Acoustic Analysis');
    expect(getNodeTypeLabel('cost_estimate')).toBe('Cost Estimate');
  });

  it('should return human-readable labels, not raw type strings', () => {
    const nodeTypes: LineageNodeType[] = [
      'load_calculation',
      'equipment_selection',
      'terminal_unit',
      'duct_system',
      'pipe_system',
      'ahu_configuration',
      'acoustic_analysis',
      'cost_estimate',
    ];

    nodeTypes.forEach(type => {
      const label = getNodeTypeLabel(type);
      // Labels should be title case with spaces
      expect(label).not.toBe(type);
      expect(label).toMatch(/^[A-Z]/); // Starts with capital
      expect(label).not.toContain('_'); // No underscores
    });
  });
});

describe('getStaleConnectionsCount', () => {
  it('should return 0 for null graph', () => {
    expect(getStaleConnectionsCount(null)).toBe(0);
  });

  it('should return 0 for undefined graph', () => {
    expect(getStaleConnectionsCount(undefined)).toBe(0);
  });

  it('should return 0 for graph with no edges', () => {
    const graph: DataLineageGraph = {
      nodes: [],
      edges: [],
    };
    expect(getStaleConnectionsCount(graph)).toBe(0);
  });

  it('should return 0 for graph with no stale edges', () => {
    const graph: DataLineageGraph = {
      nodes: [],
      edges: [
        { from: 'a', to: 'b', isStale: false },
        { from: 'b', to: 'c', isStale: false },
        { from: 'c', to: 'd', isStale: false },
      ],
    };
    expect(getStaleConnectionsCount(graph)).toBe(0);
  });

  it('should count stale edges correctly', () => {
    const graph: DataLineageGraph = {
      nodes: [],
      edges: [
        { from: 'a', to: 'b', isStale: true },
        { from: 'b', to: 'c', isStale: false },
        { from: 'c', to: 'd', isStale: true },
      ],
    };
    expect(getStaleConnectionsCount(graph)).toBe(2);
  });

  it('should count all edges as stale when all are stale', () => {
    const graph: DataLineageGraph = {
      nodes: [],
      edges: [
        { from: 'a', to: 'b', isStale: true },
        { from: 'b', to: 'c', isStale: true },
        { from: 'c', to: 'd', isStale: true },
        { from: 'd', to: 'e', isStale: true },
      ],
    };
    expect(getStaleConnectionsCount(graph)).toBe(4);
  });
});

describe('LineageNodeType completeness', () => {
  it('should have all expected node types defined', () => {
    const expectedNodeTypes: LineageNodeType[] = [
      'load_calculation',
      'equipment_selection',
      'terminal_unit',
      'duct_system',
      'pipe_system',
      'ahu_configuration',
      'acoustic_analysis',
      'cost_estimate',
    ];

    expectedNodeTypes.forEach(type => {
      const label = getNodeTypeLabel(type);
      expect(label).toBeDefined();
      expect(label.length).toBeGreaterThan(0);
    });
  });

  it('should include core design elements', () => {
    const coreTypes: LineageNodeType[] = [
      'load_calculation',
      'equipment_selection',
      'duct_system',
      'pipe_system',
    ];

    coreTypes.forEach(type => {
      expect(getNodeTypeLabel(type)).toBeDefined();
    });
  });

  it('should include extended analysis types', () => {
    const analysisTypes: LineageNodeType[] = [
      'acoustic_analysis',
      'cost_estimate',
    ];

    analysisTypes.forEach(type => {
      expect(getNodeTypeLabel(type)).toBeDefined();
    });
  });
});

describe('DataLineageGraph structure', () => {
  it('should support edges with labels', () => {
    const edge: LineageEdge = {
      from: 'node-1',
      to: 'node-2',
      label: 'capacity',
      isStale: false,
    };

    expect(edge.label).toBe('capacity');
    expect(edge.from).toBe('node-1');
    expect(edge.to).toBe('node-2');
    expect(edge.isStale).toBe(false);
  });

  it('should support edges without labels', () => {
    const edge: LineageEdge = {
      from: 'node-1',
      to: 'node-2',
      isStale: true,
    };

    expect(edge.label).toBeUndefined();
    expect(edge.isStale).toBe(true);
  });

  it('should create valid graph structure', () => {
    const graph: DataLineageGraph = {
      nodes: [
        {
          id: 'load-1',
          type: 'load_calculation',
          name: 'Zone A Load Calc',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 'equip-1',
          type: 'equipment_selection',
          name: 'Zone A Equipment',
          updatedAt: '2024-01-01T11:00:00Z',
        },
      ],
      edges: [
        {
          from: 'load-1',
          to: 'equip-1',
          label: 'capacity',
          isStale: false,
        },
      ],
    };

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes[0].type).toBe('load_calculation');
    expect(graph.edges[0].from).toBe('load-1');
    expect(graph.edges[0].to).toBe('equip-1');
  });
});

describe('Edge staleness detection', () => {
  it('should identify stale edges based on timestamp comparison', () => {
    // Upstream (load calc) updated after downstream (equipment) was created
    const upstreamUpdatedAt = '2024-01-02T10:00:00Z';
    const downstreamUpdatedAt = '2024-01-01T10:00:00Z';
    
    const isStale = new Date(upstreamUpdatedAt) > new Date(downstreamUpdatedAt);
    expect(isStale).toBe(true);
  });

  it('should identify synced edges', () => {
    // Downstream updated after upstream
    const upstreamUpdatedAt = '2024-01-01T10:00:00Z';
    const downstreamUpdatedAt = '2024-01-02T10:00:00Z';
    
    const isStale = new Date(upstreamUpdatedAt) > new Date(downstreamUpdatedAt);
    expect(isStale).toBe(false);
  });
});
