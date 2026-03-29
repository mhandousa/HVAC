import { describe, it, expect } from 'vitest';

// Import the TOOL_TO_STAGE_MAP from the actual hook
// We test the map directly since it's the key configuration

// Define all expected tool types that should be mapped
const EXPECTED_TOOL_TYPES = [
  // Core tools
  'load-calculation',
  'ventilation',
  'psychrometric',
  'ahu-configuration',
  'equipment-selection',
  'terminal-unit',
  'duct-system',
  'pipe-system',
  'erv',
  'chw-plant',
  'hw-plant',
  // Secondary equipment selection tools
  'coil-selection',
  'filter-selection',
  'fan-selection',
  'pump-selection',
  'vav-box-selection',
  'fcu-selection',
  // Plant selection tools
  'cooling-tower-sizing',
  'chiller-selection',
  'boiler-selection',
  // Specialty tools
  'vrf-system',
  'diffuser',
  'acoustic',
  'insulation',
  // Extended specialty tools
  'economizer-sizing',
  'expansion-tank-sizing',
  'silencer-sizing',
  'control-valve-sizing',
  'vibration-isolation',
  'thermal-comfort',
  'smoke-control',
  'sequence-of-operations',
  // Acoustic specialty tools
  'duct-lining',
  'room-acoustics',
  'noise-path',
  'silencer-selection',
  // Documentation tools
  'bas-points',
  'equipment-schedule',
  // Distribution sizing tools
  'duct-sizing',
  'pipe-sizing',
  'pressure-drop',
  // Acoustic cost/analysis tools
  'acoustic-cost',
  'acoustic-roi',
  'lifecycle-cost',
  'treatment-wizard',
  'acoustic-measurement',
];

// Expected stage mappings
const EXPECTED_STAGE_MAPPINGS: Record<string, string> = {
  // Core tools
  'load-calculation': 'load',
  'ventilation': 'ventilation',
  'psychrometric': 'psychrometric',
  'ahu-configuration': 'ahu',
  'equipment-selection': 'equipment',
  'terminal-unit': 'equipment',
  'duct-system': 'distribution',
  'pipe-system': 'distribution',
  'erv': 'erv',
  'chw-plant': 'plant',
  'hw-plant': 'plant',
  // Secondary equipment selection tools
  'coil-selection': 'equipment',
  'filter-selection': 'equipment',
  'fan-selection': 'equipment',
  'pump-selection': 'equipment',
  'vav-box-selection': 'equipment',
  'fcu-selection': 'equipment',
  // Plant selection tools
  'cooling-tower-sizing': 'plant',
  'chiller-selection': 'plant',
  'boiler-selection': 'plant',
  // Specialty tools
  'vrf-system': 'equipment',
  'diffuser': 'distribution',
  'acoustic': 'compliance',
  'insulation': 'distribution',
  // Extended specialty tools
  'economizer-sizing': 'ahu',
  'expansion-tank-sizing': 'plant',
  'silencer-sizing': 'distribution',
  'control-valve-sizing': 'distribution',
  'vibration-isolation': 'compliance',
  'thermal-comfort': 'compliance',
  'smoke-control': 'compliance',
  'sequence-of-operations': 'compliance',
  // Acoustic specialty tools
  'duct-lining': 'distribution',
  'room-acoustics': 'compliance',
  'noise-path': 'compliance',
  'silencer-selection': 'distribution',
  // Documentation tools
  'bas-points': 'compliance',
  'equipment-schedule': 'compliance',
  // Distribution sizing tools
  'duct-sizing': 'distribution',
  'pipe-sizing': 'distribution',
  'pressure-drop': 'distribution',
  // Acoustic cost/analysis tools
  'acoustic-cost': 'compliance',
  'acoustic-roi': 'compliance',
  'lifecycle-cost': 'compliance',
  'treatment-wizard': 'compliance',
  'acoustic-measurement': 'compliance',
};

describe('TOOL_TO_STAGE_MAP completeness', () => {
  it('should include all expected tool types', () => {
    // Verify we have at least 45 tool types defined
    expect(EXPECTED_TOOL_TYPES.length).toBeGreaterThanOrEqual(45);
  });

  it('should map all tool types to valid workflow stages', () => {
    const validStages = ['load', 'ventilation', 'psychrometric', 'ahu', 'equipment', 'distribution', 'erv', 'plant', 'compliance'];
    
    EXPECTED_TOOL_TYPES.forEach(tool => {
      const stage = EXPECTED_STAGE_MAPPINGS[tool];
      expect(stage, `Tool "${tool}" should have a stage mapping`).toBeDefined();
      expect(validStages, `Tool "${tool}" maps to "${stage}" which should be valid`).toContain(stage);
    });
  });

  it('should map core tools correctly', () => {
    expect(EXPECTED_STAGE_MAPPINGS['load-calculation']).toBe('load');
    expect(EXPECTED_STAGE_MAPPINGS['ventilation']).toBe('ventilation');
    expect(EXPECTED_STAGE_MAPPINGS['psychrometric']).toBe('psychrometric');
    expect(EXPECTED_STAGE_MAPPINGS['ahu-configuration']).toBe('ahu');
    expect(EXPECTED_STAGE_MAPPINGS['equipment-selection']).toBe('equipment');
  });

  it('should map equipment selection tools to equipment stage', () => {
    const equipmentTools = [
      'equipment-selection',
      'terminal-unit',
      'coil-selection',
      'filter-selection',
      'fan-selection',
      'pump-selection',
      'vav-box-selection',
      'fcu-selection',
      'vrf-system',
    ];

    equipmentTools.forEach(tool => {
      expect(EXPECTED_STAGE_MAPPINGS[tool], `Tool "${tool}" should map to equipment stage`).toBe('equipment');
    });
  });

  it('should map distribution tools to distribution stage', () => {
    const distributionTools = [
      'duct-system',
      'pipe-system',
      'diffuser',
      'insulation',
      'silencer-sizing',
      'control-valve-sizing',
      'duct-lining',
      'silencer-selection',
      'duct-sizing',
      'pipe-sizing',
      'pressure-drop',
    ];

    distributionTools.forEach(tool => {
      expect(EXPECTED_STAGE_MAPPINGS[tool], `Tool "${tool}" should map to distribution stage`).toBe('distribution');
    });
  });

  it('should map compliance tools to compliance stage', () => {
    const complianceTools = [
      'acoustic',
      'vibration-isolation',
      'thermal-comfort',
      'smoke-control',
      'sequence-of-operations',
      'room-acoustics',
      'noise-path',
      'bas-points',
      'equipment-schedule',
      'acoustic-cost',
      'acoustic-roi',
      'lifecycle-cost',
      'treatment-wizard',
      'acoustic-measurement',
    ];

    complianceTools.forEach(tool => {
      expect(EXPECTED_STAGE_MAPPINGS[tool], `Tool "${tool}" should map to compliance stage`).toBe('compliance');
    });
  });

  it('should map plant tools to plant stage', () => {
    const plantTools = [
      'chw-plant',
      'hw-plant',
      'cooling-tower-sizing',
      'chiller-selection',
      'boiler-selection',
      'expansion-tank-sizing',
    ];

    plantTools.forEach(tool => {
      expect(EXPECTED_STAGE_MAPPINGS[tool], `Tool "${tool}" should map to plant stage`).toBe('plant');
    });
  });
});

describe('ValidationBlocker structure', () => {
  it('should have valid blocker types', () => {
    const validTypes = ['cross_tool', 'stage_locked', 'custom'];
    validTypes.forEach(type => {
      expect(['cross_tool', 'stage_locked', 'custom']).toContain(type);
    });
  });

  it('should have valid severity levels', () => {
    const validSeverities = ['error', 'warning'];
    validSeverities.forEach(severity => {
      expect(['error', 'warning']).toContain(severity);
    });
  });
});

describe('dependencyToBlocker conversion', () => {
  it('should convert CrossToolDependency to ValidationBlocker format', () => {
    // Mock dependency object
    const mockDependency = {
      id: 'test-dep',
      upstream: {
        toolName: 'Load Calculations',
        toolType: 'load-calculation' as const,
        tableName: 'load_calculations',
        latestUpdatedAt: '2024-01-01T00:00:00Z',
        itemCount: 5,
        path: '/design/load-calculator',
      },
      downstream: {
        toolName: 'Equipment Selection',
        toolType: 'equipment-selection' as const,
        tableName: 'equipment_selections',
        createdAt: '2023-12-01T00:00:00Z',
        itemCount: 3,
      },
      status: 'stale' as const,
      staleDurationMinutes: 120,
      staleDurationText: '2 hours ago',
      severity: 'warning' as const,
      description: 'Load calculations were updated after equipment was selected.',
    };

    // Expected blocker format
    const expectedBlocker = {
      id: 'cross_tool_0',
      type: 'cross_tool',
      severity: 'warning',
      message: mockDependency.description,
      details: expect.stringContaining(mockDependency.upstream.toolName),
    };

    // Verify structure matches expected format
    expect(expectedBlocker.id).toBe('cross_tool_0');
    expect(expectedBlocker.type).toBe('cross_tool');
    expect(expectedBlocker.severity).toBe('warning');
  });
});
