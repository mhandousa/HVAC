import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GitCompare,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  FileDown,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import type { DesignAlternative } from '@/hooks/useDesignAlternatives';
import { useAlternativeComparisonExport } from '@/hooks/useAlternativeComparisonExport';

interface ComparisonMetric {
  key: string;
  label: string;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | ((value: number) => string);
  higherIsBetter?: boolean;
}

interface AlternativeComparisonViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternatives: DesignAlternative[];
  metrics?: ComparisonMetric[];
  onSetPrimary?: (alternative: DesignAlternative) => void;
  projectName?: string;
}

// Default metrics for common design types
const DEFAULT_METRICS: Record<string, ComparisonMetric[]> = {
  load_calculation: [
    { key: 'total_cooling_load_btuh', label: 'Cooling Load', unit: 'BTU/h', format: 'number', higherIsBetter: false },
    { key: 'total_heating_load_btuh', label: 'Heating Load', unit: 'BTU/h', format: 'number', higherIsBetter: false },
    { key: 'total_cfm', label: 'Total CFM', format: 'number', higherIsBetter: false },
    { key: 'estimated_cost', label: 'Est. Cost', format: 'currency', higherIsBetter: false },
  ],
  equipment_selection: [
    { key: 'capacity_tons', label: 'Capacity', unit: 'tons', format: 'number' },
    { key: 'efficiency_eer', label: 'EER', format: 'number', higherIsBetter: true },
    { key: 'efficiency_iplv', label: 'IPLV', format: 'number', higherIsBetter: true },
    { key: 'power_kw', label: 'Power', unit: 'kW', format: 'number', higherIsBetter: false },
    { key: 'cost', label: 'Equipment Cost', format: 'currency', higherIsBetter: false },
  ],
  ahu_configuration: [
    { key: 'design_cfm', label: 'Design CFM', format: 'number' },
    { key: 'total_static_pressure', label: 'Static Pressure', unit: 'in. w.g.', format: 'number', higherIsBetter: false },
    { key: 'fan_bhp', label: 'Fan BHP', format: 'number', higherIsBetter: false },
    { key: 'cooling_capacity_tons', label: 'Cooling', unit: 'tons', format: 'number' },
    { key: 'heating_capacity_mbh', label: 'Heating', unit: 'MBH', format: 'number' },
  ],
};

export function AlternativeComparisonView({
  open,
  onOpenChange,
  alternatives,
  metrics: customMetrics,
  onSetPrimary,
  projectName,
}: AlternativeComparisonViewProps) {
  const entityType = alternatives[0]?.entity_type || 'load_calculation';
  const metrics = customMetrics || DEFAULT_METRICS[entityType] || DEFAULT_METRICS.load_calculation;
  const { exportToPdf, exportToExcel } = useAlternativeComparisonExport();

  // Extract values from alternatives and compute deltas
  const comparisonData = useMemo(() => {
    if (alternatives.length < 2) return [];

    return metrics.map(metric => {
      const values = alternatives.map(alt => {
        const value = getNestedValue(alt.data, metric.key);
        return typeof value === 'number' ? value : null;
      });

      // Use first alternative as baseline for delta calculation
      const baseValue = values[0];
      const deltas = values.map((val, idx) => {
        if (idx === 0 || val === null || baseValue === null || baseValue === 0) return null;
        return ((val - baseValue) / Math.abs(baseValue)) * 100;
      });

      return {
        metric,
        values,
        deltas,
      };
    });
  }, [alternatives, metrics]);

  const formatValue = (value: number | null, format?: ComparisonMetric['format'], unit?: string): string => {
    if (value === null) return '—';

    let formatted: string;
    if (typeof format === 'function') {
      formatted = format(value);
    } else {
      switch (format) {
        case 'currency':
          formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
          break;
        case 'percentage':
          formatted = `${value.toFixed(1)}%`;
          break;
        case 'number':
        default:
          formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
      }
    }

    return unit ? `${formatted} ${unit}` : formatted;
  };

  const DeltaBadge = ({ delta, higherIsBetter }: { delta: number | null; higherIsBetter?: boolean }) => {
    if (delta === null) return null;

    const isPositive = delta > 0;
    const isBetter = higherIsBetter ? isPositive : !isPositive;
    const isNeutral = Math.abs(delta) < 0.5;

    if (isNeutral) {
      return (
        <Badge variant="secondary" className="ml-2 gap-1">
          <Minus className="h-3 w-3" />
          0%
        </Badge>
      );
    }

    return (
      <Badge
        variant={isBetter ? 'default' : 'destructive'}
        className="ml-2 gap-1"
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? '+' : ''}{delta.toFixed(1)}%
      </Badge>
    );
  };

  const handleExportPdf = () => {
    exportToPdf({ alternatives, metrics, projectName, entityType });
  };

  const handleExportExcel = () => {
    exportToExcel({ alternatives, metrics, projectName, entityType });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            Compare Alternatives
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="space-y-6">
            {/* Alternative Headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${alternatives.length}, 1fr)` }}>
              <div className="text-sm font-medium text-muted-foreground">Metric</div>
              {alternatives.map((alt, idx) => (
                <div key={alt.id} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {alt.is_primary && <Star className="h-4 w-4 text-primary fill-primary" />}
                    <span className="font-medium">{alt.name}</span>
                  </div>
                  {alt.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {alt.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {idx === 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">Baseline</Badge>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Comparison Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Metric</TableHead>
                  {alternatives.map((alt, idx) => (
                    <TableHead key={alt.id} className="text-center">
                      {idx === 0 ? 'Value' : 'Value (Δ from baseline)'}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map(({ metric, values, deltas }) => (
                  <TableRow key={metric.key}>
                    <TableCell className="font-medium">{metric.label}</TableCell>
                    {values.map((value, idx) => (
                      <TableCell key={idx} className="text-center">
                        <span>{formatValue(value, metric.format, metric.unit)}</span>
                        {idx > 0 && <DeltaBadge delta={deltas[idx]} higherIsBetter={metric.higherIsBetter} />}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Comparison
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover">
                  <DropdownMenuItem onClick={handleExportPdf}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {onSetPrimary && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Set as primary:</span>
                  {alternatives.map(alt => (
                    <Button
                      key={alt.id}
                      variant={alt.is_primary ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSetPrimary(alt)}
                      disabled={alt.is_primary}
                    >
                      {alt.is_primary && <Star className="h-4 w-4 mr-1 fill-current" />}
                      {alt.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Helper to get nested values from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}
