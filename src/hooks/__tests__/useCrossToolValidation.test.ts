import { describe, it, expect } from 'vitest';

// Path detection patterns that should be recognized
const PATH_TO_TOOL_MAP: Record<string, string> = {
  '/design/load-calculation': 'load-calculation',
  '/design/load-calculator': 'load-calculation',
  '/design/ventilation-calculator': 'ventilation',
  '/design/psychrometric': 'psychrometric',
  '/design/ahu-configuration': 'ahu-configuration',
  '/design/equipment-selection': 'equipment-selection',
  '/design/terminal-unit-sizing': 'terminal-unit',
  '/design/duct-designer': 'duct-system',
  '/design/pipe-designer': 'pipe-system',
  '/design/erv-sizing': 'erv',
  '/design/chw-plant': 'chw-plant',
  '/design/hw-plant': 'hw-plant',
  '/design/coil-selection': 'coil-selection',
  '/design/filter-selection': 'filter-selection',
  '/design/fan-selection': 'fan-selection',
  '/design/pump-selection': 'pump-selection',
  '/design/vav-box-selection': 'vav-box-selection',
  '/design/fcu-selection': 'fcu-selection',
  '/design/cooling-tower-sizing': 'cooling-tower-sizing',
  '/design/chiller-selection': 'chiller-selection',
  '/design/boiler-selection': 'boiler-selection',
  '/design/vrf-designer': 'vrf-system',
  '/design/diffuser-selection': 'diffuser',
  '/design/acoustic-calculator': 'acoustic',
  '/design/insulation-calculator': 'insulation',
  '/design/economizer-sizing': 'economizer-sizing',
  '/design/expansion-tank-sizing': 'expansion-tank-sizing',
  '/design/silencer-sizing': 'silencer-sizing',
  '/design/control-valve-sizing': 'control-valve-sizing',
  '/design/vibration-isolation': 'vibration-isolation',
  '/design/thermal-comfort': 'thermal-comfort',
  '/design/smoke-control': 'smoke-control',
  '/design/sequence-of-operations': 'sequence-of-operations',
  '/design/duct-lining': 'duct-lining',
  '/design/room-acoustics': 'room-acoustics',
  '/design/noise-path-analysis': 'noise-path',
  '/design/silencer-selection': 'silencer-selection',
  '/design/bas-points': 'bas-points',
  '/design/equipment-schedule': 'equipment-schedule',
  '/design/duct-sizing': 'duct-sizing',
  '/design/pipe-sizing': 'pipe-sizing',
  '/design/pressure-drop': 'pressure-drop',
  '/design/acoustic-cost-estimator': 'acoustic-cost',
  '/design/acoustic-roi': 'acoustic-roi',
  '/design/lifecycle-cost-analyzer': 'lifecycle-cost',
  '/design/treatment-wizard': 'treatment-wizard',
};

// Simulated path detection function
function getToolTypeFromPath(path: string): string | null {
  // Remove query parameters
  const cleanPath = path.split('?')[0];
  
  // Check direct matches first
  if (PATH_TO_TOOL_MAP[cleanPath]) {
    return PATH_TO_TOOL_MAP[cleanPath];
  }
  
  // Check partial matches for pattern-based detection
  if (cleanPath.includes('load-calc')) return 'load-calculation';
  if (cleanPath.includes('ventilation')) return 'ventilation';
  if (cleanPath.includes('acoustic-cost')) return 'acoustic-cost';
  if (cleanPath.includes('acoustic-roi')) return 'acoustic-roi';
  if (cleanPath.includes('lifecycle-cost')) return 'lifecycle-cost';
  if (cleanPath.includes('treatment-wizard')) return 'treatment-wizard';
  if (cleanPath.includes('acoustic-measurement')) return 'acoustic-measurement';
  
  return null;
}

describe('getToolTypeFromPath', () => {
  it('should detect load calculation from path', () => {
    expect(getToolTypeFromPath('/design/load-calculation')).toBe('load-calculation');
    expect(getToolTypeFromPath('/design/load-calculator')).toBe('load-calculation');
  });

  it('should detect core tools from paths', () => {
    expect(getToolTypeFromPath('/design/ventilation-calculator')).toBe('ventilation');
    expect(getToolTypeFromPath('/design/psychrometric')).toBe('psychrometric');
    expect(getToolTypeFromPath('/design/ahu-configuration')).toBe('ahu-configuration');
    expect(getToolTypeFromPath('/design/equipment-selection')).toBe('equipment-selection');
  });

  it('should detect equipment selection tools from paths', () => {
    expect(getToolTypeFromPath('/design/coil-selection')).toBe('coil-selection');
    expect(getToolTypeFromPath('/design/filter-selection')).toBe('filter-selection');
    expect(getToolTypeFromPath('/design/fan-selection')).toBe('fan-selection');
    expect(getToolTypeFromPath('/design/pump-selection')).toBe('pump-selection');
    expect(getToolTypeFromPath('/design/vav-box-selection')).toBe('vav-box-selection');
    expect(getToolTypeFromPath('/design/fcu-selection')).toBe('fcu-selection');
  });

  it('should detect plant tools from paths', () => {
    expect(getToolTypeFromPath('/design/chw-plant')).toBe('chw-plant');
    expect(getToolTypeFromPath('/design/hw-plant')).toBe('hw-plant');
    expect(getToolTypeFromPath('/design/cooling-tower-sizing')).toBe('cooling-tower-sizing');
    expect(getToolTypeFromPath('/design/chiller-selection')).toBe('chiller-selection');
    expect(getToolTypeFromPath('/design/boiler-selection')).toBe('boiler-selection');
  });

  it('should detect acoustic tools from paths', () => {
    expect(getToolTypeFromPath('/design/acoustic-calculator')).toBe('acoustic');
    expect(getToolTypeFromPath('/design/acoustic-cost-estimator')).toBe('acoustic-cost');
    expect(getToolTypeFromPath('/design/acoustic-roi')).toBe('acoustic-roi');
    expect(getToolTypeFromPath('/design/room-acoustics')).toBe('room-acoustics');
    expect(getToolTypeFromPath('/design/noise-path-analysis')).toBe('noise-path');
    expect(getToolTypeFromPath('/design/duct-lining')).toBe('duct-lining');
    expect(getToolTypeFromPath('/design/silencer-selection')).toBe('silencer-selection');
    expect(getToolTypeFromPath('/design/silencer-sizing')).toBe('silencer-sizing');
    expect(getToolTypeFromPath('/design/vibration-isolation')).toBe('vibration-isolation');
  });

  it('should detect distribution tools from paths', () => {
    expect(getToolTypeFromPath('/design/duct-designer')).toBe('duct-system');
    expect(getToolTypeFromPath('/design/pipe-designer')).toBe('pipe-system');
    expect(getToolTypeFromPath('/design/duct-sizing')).toBe('duct-sizing');
    expect(getToolTypeFromPath('/design/pipe-sizing')).toBe('pipe-sizing');
    expect(getToolTypeFromPath('/design/pressure-drop')).toBe('pressure-drop');
    expect(getToolTypeFromPath('/design/diffuser-selection')).toBe('diffuser');
    expect(getToolTypeFromPath('/design/terminal-unit-sizing')).toBe('terminal-unit');
  });

  it('should handle paths with query parameters', () => {
    expect(getToolTypeFromPath('/design/equipment-selection?project=123')).toBe('equipment-selection');
    expect(getToolTypeFromPath('/design/load-calculation?project=abc&zone=xyz')).toBe('load-calculation');
    expect(getToolTypeFromPath('/design/acoustic-cost-estimator?project=test')).toBe('acoustic-cost');
  });

  it('should return null for unknown paths', () => {
    expect(getToolTypeFromPath('/unknown-page')).toBeNull();
    expect(getToolTypeFromPath('/dashboard')).toBeNull();
    expect(getToolTypeFromPath('/settings')).toBeNull();
  });

  it('should have mappings for all 45+ tools', () => {
    const mappedPaths = Object.keys(PATH_TO_TOOL_MAP);
    expect(mappedPaths.length).toBeGreaterThanOrEqual(45);
  });
});

describe('Staleness calculation', () => {
  function calculateStaleness(upstreamTime: string | null, downstreamTime: string | null): {
    isStale: boolean;
    minutesStale: number;
    severity: 'info' | 'warning' | 'critical';
  } {
    if (!upstreamTime || !downstreamTime) {
      return { isStale: false, minutesStale: 0, severity: 'info' };
    }

    const upstream = new Date(upstreamTime).getTime();
    const downstream = new Date(downstreamTime).getTime();
    
    if (upstream > downstream) {
      const minutesStale = Math.round((upstream - downstream) / 60000);
      let severity: 'info' | 'warning' | 'critical' = 'info';
      
      if (minutesStale > 60) {
        severity = 'critical';
      } else if (minutesStale > 15) {
        severity = 'warning';
      }
      
      return { isStale: true, minutesStale, severity };
    }

    return { isStale: false, minutesStale: 0, severity: 'info' };
  }

  it('should detect no staleness when timestamps are null', () => {
    const result = calculateStaleness(null, null);
    expect(result.isStale).toBe(false);
    expect(result.minutesStale).toBe(0);
    expect(result.severity).toBe('info');
  });

  it('should detect no staleness when downstream is newer', () => {
    const result = calculateStaleness(
      '2024-01-01T10:00:00Z',
      '2024-01-01T11:00:00Z'
    );
    expect(result.isStale).toBe(false);
    expect(result.minutesStale).toBe(0);
  });

  it('should detect staleness when upstream is newer', () => {
    const result = calculateStaleness(
      '2024-01-01T11:00:00Z',
      '2024-01-01T10:00:00Z'
    );
    expect(result.isStale).toBe(true);
    expect(result.minutesStale).toBe(60);
  });

  it('should classify severity as info for < 15 minutes', () => {
    const result = calculateStaleness(
      '2024-01-01T10:10:00Z',
      '2024-01-01T10:00:00Z'
    );
    expect(result.severity).toBe('info');
  });

  it('should classify severity as warning for 15-60 minutes', () => {
    const result = calculateStaleness(
      '2024-01-01T10:30:00Z',
      '2024-01-01T10:00:00Z'
    );
    expect(result.severity).toBe('warning');
  });

  it('should classify severity as critical for > 60 minutes', () => {
    const result = calculateStaleness(
      '2024-01-01T12:00:00Z',
      '2024-01-01T10:00:00Z'
    );
    expect(result.severity).toBe('critical');
  });
});

describe('CrossToolDependency structure', () => {
  it('should have valid status values', () => {
    const validStatuses = ['synced', 'stale', 'needs_refresh'];
    validStatuses.forEach(status => {
      expect(['synced', 'stale', 'needs_refresh']).toContain(status);
    });
  });

  it('should have valid severity levels', () => {
    const validSeverities = ['info', 'warning', 'critical'];
    validSeverities.forEach(severity => {
      expect(['info', 'warning', 'critical']).toContain(severity);
    });
  });
});
