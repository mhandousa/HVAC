/**
 * Utilities for calculating and displaying diffs between design revisions
 */

export interface DiffResult {
  path: string;
  label: string;
  previousValue: unknown;
  currentValue: unknown;
  changeType: 'added' | 'removed' | 'modified';
}

export interface DiffSummary {
  totalChanges: number;
  added: number;
  removed: number;
  modified: number;
  changes: DiffResult[];
}

/**
 * Deep compare two objects and return the differences
 */
export function calculateDiff(
  previous: Record<string, unknown> | null,
  current: Record<string, unknown>,
  path = ''
): DiffResult[] {
  const results: DiffResult[] = [];
  
  if (!previous) {
    // All fields are new
    for (const key of Object.keys(current)) {
      const currentPath = path ? `${path}.${key}` : key;
      results.push({
        path: currentPath,
        label: formatLabel(key),
        previousValue: null,
        currentValue: current[key],
        changeType: 'added',
      });
    }
    return results;
  }

  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const prevValue = previous[key];
    const currValue = current[key];

    // Skip internal fields
    if (key.startsWith('_') || key === 'id' || key === 'created_at' || key === 'updated_at') {
      continue;
    }

    if (prevValue === undefined && currValue !== undefined) {
      results.push({
        path: currentPath,
        label: formatLabel(key),
        previousValue: null,
        currentValue: currValue,
        changeType: 'added',
      });
    } else if (prevValue !== undefined && currValue === undefined) {
      results.push({
        path: currentPath,
        label: formatLabel(key),
        previousValue: prevValue,
        currentValue: null,
        changeType: 'removed',
      });
    } else if (typeof prevValue === 'object' && typeof currValue === 'object' && 
               prevValue !== null && currValue !== null && 
               !Array.isArray(prevValue) && !Array.isArray(currValue)) {
      // Recursively compare nested objects
      const nestedDiffs = calculateDiff(
        prevValue as Record<string, unknown>,
        currValue as Record<string, unknown>,
        currentPath
      );
      results.push(...nestedDiffs);
    } else if (!isEqual(prevValue, currValue)) {
      results.push({
        path: currentPath,
        label: formatLabel(key),
        previousValue: prevValue,
        currentValue: currValue,
        changeType: 'modified',
      });
    }
  }

  return results;
}

/**
 * Generate a summary of changes
 */
export function summarizeDiff(diffs: DiffResult[]): DiffSummary {
  return {
    totalChanges: diffs.length,
    added: diffs.filter(d => d.changeType === 'added').length,
    removed: diffs.filter(d => d.changeType === 'removed').length,
    modified: diffs.filter(d => d.changeType === 'modified').length,
    changes: diffs,
  };
}

/**
 * Generate a human-readable change summary
 */
export function generateChangeSummary(diffs: DiffResult[]): string {
  if (diffs.length === 0) {
    return 'No changes';
  }

  if (diffs.length === 1) {
    const diff = diffs[0];
    return `Updated ${diff.label}`;
  }

  if (diffs.length <= 3) {
    return diffs.map(d => d.label).join(', ');
  }

  return `${diffs.length} fields changed`;
}

/**
 * Format a camelCase or snake_case key into a readable label
 */
export function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format a value for display
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)';
    return `[${value.length} items]`;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}

/**
 * Deep equality check
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }
  
  return false;
}

/**
 * Group diffs by category based on path prefix
 */
export function groupDiffsByCategory(diffs: DiffResult[]): Record<string, DiffResult[]> {
  const groups: Record<string, DiffResult[]> = {};
  
  for (const diff of diffs) {
    const category = diff.path.split('.')[0] || 'General';
    const categoryLabel = formatLabel(category);
    
    if (!groups[categoryLabel]) {
      groups[categoryLabel] = [];
    }
    groups[categoryLabel].push(diff);
  }
  
  return groups;
}

/**
 * Entity type display names
 */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  load_calculation: 'Load Calculation',
  equipment_selection: 'Equipment Selection',
  ahu_configuration: 'AHU Configuration',
  duct_system: 'Duct System',
  pipe_system: 'Pipe System',
  ventilation_calculation: 'Ventilation Calculation',
  psychrometric_analysis: 'Psychrometric Analysis',
  acoustic_calculation: 'Acoustic Calculation',
  chiller_selection: 'Chiller Selection',
  boiler_selection: 'Boiler Selection',
  cooling_tower_selection: 'Cooling Tower Selection',
  coil_selection: 'Coil Selection',
  pump_selection: 'Pump Selection',
  vav_box_selection: 'VAV Box Selection',
  fcu_selection: 'FCU Selection',
  erv_calculation: 'ERV Calculation',
};

export function getEntityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] || formatLabel(entityType);
}
