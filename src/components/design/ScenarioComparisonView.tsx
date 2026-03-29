import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSandbox, type Scenario } from '@/contexts/SandboxContext';
import { cn } from '@/lib/utils';

export interface ComparisonMetric {
  key: string;
  label: string;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | ((value: number) => string);
  higherIsBetter?: boolean;
}

interface ScenarioComparisonViewProps {
  metrics: ComparisonMetric[];
  className?: string;
}

export function ScenarioComparisonView({
  metrics,
  className,
}: ScenarioComparisonViewProps) {
  const { state } = useSandbox();

  const comparisonData = useMemo(() => {
    if (!state.isActive || state.scenarios.length < 2) return null;

    const baseline = state.scenarios.find(s => s.isBaseline);
    if (!baseline) return null;

    return metrics.map(metric => {
      const baselineValue = getNestedValue(
        { ...state.baselineData, ...baseline.modifications },
        metric.key
      );

      const scenarioValues = state.scenarios
        .filter(s => !s.isBaseline)
        .map(scenario => {
          const value = getNestedValue(
            { ...state.baselineData, ...scenario.modifications },
            metric.key
          );
          const delta = typeof value === 'number' && typeof baselineValue === 'number'
            ? ((value - baselineValue) / baselineValue) * 100
            : null;
          
          return {
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            value,
            delta,
          };
        });

      return {
        metric,
        baselineValue,
        scenarios: scenarioValues,
      };
    });
  }, [state, metrics]);

  if (!state.isActive) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Activate sandbox mode to compare scenarios</p>
        </CardContent>
      </Card>
    );
  }

  if (state.scenarios.length < 2) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Create at least one scenario to compare</p>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData) return null;

  const nonBaselineScenarios = state.scenarios.filter(s => !s.isBaseline);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          Scenario Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="w-full">
          <div className="min-w-[400px]">
            {/* Header */}
            <div className="grid gap-2 pb-2 border-b" 
              style={{ gridTemplateColumns: `200px repeat(${nonBaselineScenarios.length + 1}, 1fr)` }}
            >
              <div className="text-xs font-medium text-muted-foreground">Metric</div>
              <div className="text-xs font-medium text-center">Baseline</div>
              {nonBaselineScenarios.map(scenario => (
                <div 
                  key={scenario.id} 
                  className={cn(
                    "text-xs font-medium text-center",
                    state.activeScenarioId === scenario.id && "text-primary"
                  )}
                >
                  {scenario.name}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-1 pt-2">
              {comparisonData.map(({ metric, baselineValue, scenarios }) => (
                <div 
                  key={metric.key}
                  className="grid gap-2 py-2 hover:bg-muted/50 rounded-md px-1"
                  style={{ gridTemplateColumns: `200px repeat(${scenarios.length + 1}, 1fr)` }}
                >
                  {/* Metric label */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{metric.label}</span>
                    <span className="text-xs text-muted-foreground">{metric.unit}</span>
                  </div>

                  {/* Baseline value */}
                  <div className="text-sm text-center font-mono">
                    {formatValue(baselineValue, metric.format)}
                  </div>

                  {/* Scenario values */}
                  {scenarios.map(({ scenarioId, value, delta }) => (
                    <div key={scenarioId} className="text-center">
                      <div className="text-sm font-mono">
                        {formatValue(value, metric.format)}
                      </div>
                      {delta !== null && (
                        <DeltaBadge 
                          delta={delta} 
                          higherIsBetter={metric.higherIsBetter} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Delta badge component
function DeltaBadge({ 
  delta, 
  higherIsBetter = false 
}: { 
  delta: number; 
  higherIsBetter?: boolean;
}) {
  const isPositive = delta > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  const isNeutral = Math.abs(delta) < 0.5;

  if (isNeutral) {
    return (
      <Badge variant="outline" className="text-xs h-5 px-1">
        <Minus className="h-3 w-3 mr-0.5" />
        0%
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs h-5 px-1",
        isGood 
          ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200"
          : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200"
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3 mr-0.5" />
      ) : (
        <TrendingDown className="h-3 w-3 mr-0.5" />
      )}
      {isPositive ? '+' : ''}{delta.toFixed(1)}%
    </Badge>
  );
}

// Helper functions
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function formatValue(
  value: unknown, 
  formatter?: 'number' | 'percentage' | 'currency' | ((value: number) => string)
): string {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'number') {
    if (!formatter || formatter === 'number') {
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (formatter === 'percentage') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (formatter === 'currency') {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    if (typeof formatter === 'function') {
      return formatter(value);
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
}

// Default metrics for common design tools
export const LOAD_CALCULATION_METRICS: ComparisonMetric[] = [
  { key: 'cooling_load_btuh', label: 'Cooling Load', unit: 'BTU/h', higherIsBetter: false },
  { key: 'heating_load_btuh', label: 'Heating Load', unit: 'BTU/h', higherIsBetter: false },
  { key: 'cfm', label: 'Supply CFM', unit: 'CFM', higherIsBetter: false },
  { key: 'oa_cfm', label: 'Outdoor Air', unit: 'CFM', higherIsBetter: false },
  { key: 'estimated_cost', label: 'Est. Cost', unit: '$', format: (v) => `$${v.toLocaleString()}`, higherIsBetter: false },
];

export const EQUIPMENT_METRICS: ComparisonMetric[] = [
  { key: 'capacity_tons', label: 'Capacity', unit: 'tons', higherIsBetter: false },
  { key: 'eer', label: 'EER', unit: 'BTU/Wh', higherIsBetter: true },
  { key: 'iplv', label: 'IPLV', unit: '', higherIsBetter: true },
  { key: 'first_cost', label: 'First Cost', unit: '$', format: (v) => `$${v.toLocaleString()}`, higherIsBetter: false },
  { key: 'annual_energy', label: 'Annual Energy', unit: 'kWh', higherIsBetter: false },
];

export const DUCT_SIZING_METRICS: ComparisonMetric[] = [
  { key: 'total_pressure_drop', label: 'Total Pressure Drop', unit: 'in. w.g.', higherIsBetter: false },
  { key: 'max_velocity', label: 'Max Velocity', unit: 'FPM', higherIsBetter: false },
  { key: 'duct_surface_area', label: 'Duct Surface Area', unit: 'ft²', higherIsBetter: false },
  { key: 'estimated_cost', label: 'Est. Cost', unit: '$', format: (v) => `$${v.toLocaleString()}`, higherIsBetter: false },
];
