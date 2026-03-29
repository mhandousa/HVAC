import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { ValidationSummary } from '@/hooks/useTerminalUnitValidation';

interface TerminalUnitValidationSummaryProps {
  summary: ValidationSummary;
  showValidation: boolean;
  onShowValidationChange: (show: boolean) => void;
  filterMode: 'all' | 'issues' | 'errors';
  onFilterModeChange: (mode: 'all' | 'issues' | 'errors') => void;
}

const TerminalUnitValidationSummary: React.FC<TerminalUnitValidationSummaryProps> = ({
  summary,
  showValidation,
  onShowValidationChange,
  filterMode,
  onFilterModeChange,
}) => {
  const varianceLabel = summary.totalCfmVariance >= 0 
    ? `+${summary.totalCfmVariance.toFixed(0)} CFM (oversized)`
    : `${summary.totalCfmVariance.toFixed(0)} CFM (undersized)`;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">CFM Validation Summary</h3>
          <div className="flex items-center gap-2">
            <Switch
              id="show-validation"
              checked={showValidation}
              onCheckedChange={onShowValidationChange}
            />
            <Label htmlFor="show-validation" className="text-xs text-muted-foreground cursor-pointer">
              {showValidation ? (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Show
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Hide
                </span>
              )}
            </Label>
          </div>
        </div>

        {/* Status Counts */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-lg font-semibold">{summary.passCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">Pass</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-lg font-semibold">{summary.warningCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">Warning</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-1 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-lg font-semibold">{summary.errorCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">Error</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded-md bg-muted/50 border border-border">
            <div className="flex items-center gap-1 text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span className="text-lg font-semibold">{summary.noDataCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">No Data</span>
          </div>
        </div>

        {/* CFM Totals */}
        {summary.totalRequiredCfm > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mb-3">
            <span>
              Total: <span className="font-medium text-foreground">{summary.totalSuppliedCfm.toLocaleString()} CFM</span> supplied
              {' / '}
              <span className="font-medium text-foreground">{summary.totalRequiredCfm.toLocaleString()} CFM</span> required
            </span>
            <Badge 
              variant="outline" 
              className={
                Math.abs(summary.totalCfmVariance) <= summary.totalRequiredCfm * 0.05
                  ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                  : Math.abs(summary.totalCfmVariance) <= summary.totalRequiredCfm * 0.15
                  ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                  : 'border-destructive/50 text-destructive'
              }
            >
              {varianceLabel}
            </Badge>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={filterMode === 'all' ? 'default' : 'outline'}
              className="h-7 text-xs px-2"
              onClick={() => onFilterModeChange('all')}
            >
              All ({summary.totalUnits})
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'issues' ? 'default' : 'outline'}
              className="h-7 text-xs px-2"
              onClick={() => onFilterModeChange('issues')}
              disabled={summary.warningCount + summary.errorCount === 0}
            >
              Issues ({summary.warningCount + summary.errorCount})
            </Button>
            <Button
              size="sm"
              variant={filterMode === 'errors' ? 'default' : 'outline'}
              className="h-7 text-xs px-2"
              onClick={() => onFilterModeChange('errors')}
              disabled={summary.errorCount === 0}
            >
              Errors ({summary.errorCount})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TerminalUnitValidationSummary;
