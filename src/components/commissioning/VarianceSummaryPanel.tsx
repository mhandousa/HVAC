import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Equal } from "lucide-react";
import { cn } from "@/lib/utils";

interface VarianceField {
  field: string;
  design_value: any;
  installed_value: any;
  variance_percent: number | null;
  status: 'match' | 'within_tolerance' | 'warning' | 'fail';
}

interface VarianceSummary {
  fields: VarianceField[];
  total_fields: number;
  within_tolerance: number;
  tolerance_percent: number;
}

interface VarianceSummaryPanelProps {
  designData: Record<string, any> | null;
  installedData: Record<string, any> | null;
  varianceSummary: VarianceSummary | null;
  tolerancePercent?: number;
  compact?: boolean;
}

const getStatusIcon = (status: VarianceField['status']) => {
  switch (status) {
    case 'match':
      return <Equal className="h-4 w-4 text-muted-foreground" />;
    case 'within_tolerance':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'fail':
      return <XCircle className="h-4 w-4 text-destructive" />;
  }
};

const getStatusBadge = (status: VarianceField['status'], variancePercent: number | null) => {
  if (status === 'match') {
    return <Badge variant="outline" className="text-xs">Match</Badge>;
  }
  
  const sign = variancePercent && variancePercent > 0 ? '+' : '';
  const varianceText = variancePercent !== null ? `${sign}${variancePercent.toFixed(1)}%` : 'N/A';
  
  const badgeClass = cn(
    "text-xs",
    status === 'within_tolerance' && "bg-green-100 text-green-800 border-green-200",
    status === 'warning' && "bg-yellow-100 text-yellow-800 border-yellow-200",
    status === 'fail' && "bg-red-100 text-red-800 border-red-200"
  );
  
  return <Badge variant="outline" className={badgeClass}>{varianceText}</Badge>;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const calculateVarianceSummary = (
  design: Record<string, any> | null,
  installed: Record<string, any> | null,
  tolerancePercent: number = 5
): VarianceSummary | null => {
  if (!design || !installed) return null;
  
  const fields: VarianceField[] = [];
  const allKeys = new Set([...Object.keys(design), ...Object.keys(installed)]);
  
  allKeys.forEach(key => {
    const designValue = design[key];
    const installedValue = installed[key];
    
    // Skip nested objects for now
    if (typeof designValue === 'object' && designValue !== null && !Array.isArray(designValue)) {
      return;
    }
    
    let variancePercent: number | null = null;
    let status: VarianceField['status'] = 'match';
    
    // For numeric values, calculate variance
    const designNum = parseFloat(String(designValue));
    const installedNum = parseFloat(String(installedValue));
    
    if (!isNaN(designNum) && !isNaN(installedNum) && designNum !== 0) {
      variancePercent = ((installedNum - designNum) / designNum) * 100;
      const absVariance = Math.abs(variancePercent);
      
      if (absVariance === 0) {
        status = 'match';
      } else if (absVariance <= tolerancePercent) {
        status = 'within_tolerance';
      } else if (absVariance <= tolerancePercent * 1.5) {
        status = 'warning';
      } else {
        status = 'fail';
      }
    } else if (String(designValue) === String(installedValue)) {
      status = 'match';
    } else if (installedValue !== undefined && installedValue !== null) {
      status = 'fail';
    }
    
    fields.push({
      field: key,
      design_value: designValue,
      installed_value: installedValue,
      variance_percent: variancePercent,
      status
    });
  });
  
  return {
    fields,
    total_fields: fields.length,
    within_tolerance: fields.filter(f => f.status !== 'fail').length,
    tolerance_percent: tolerancePercent
  };
};

export function VarianceSummaryPanel({ 
  designData, 
  installedData, 
  varianceSummary,
  tolerancePercent = 5,
  compact = false 
}: VarianceSummaryPanelProps) {
  // Use provided variance summary or calculate from raw data
  const summary = varianceSummary || calculateVarianceSummary(designData, installedData, tolerancePercent);
  
  if (!summary || summary.fields.length === 0) {
    if (!designData) {
      return (
        <div className="text-sm text-muted-foreground py-2">
          No design data available
        </div>
      );
    }
    return (
      <div className="text-sm text-muted-foreground py-2">
        No installed data recorded yet
      </div>
    );
  }
  
  const passRate = summary.total_fields > 0 
    ? Math.round((summary.within_tolerance / summary.total_fields) * 100) 
    : 0;
  
  const overallStatus = passRate === 100 ? 'pass' : passRate >= 80 ? 'warning' : 'fail';
  
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Variance Summary</span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              overallStatus === 'pass' && "bg-green-100 text-green-800",
              overallStatus === 'warning' && "bg-yellow-100 text-yellow-800",
              overallStatus === 'fail' && "bg-red-100 text-red-800"
            )}
          >
            {summary.within_tolerance}/{summary.total_fields} OK
          </Badge>
        </div>
        <div className="grid gap-1">
          {summary.fields.slice(0, 3).map((field, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground capitalize">{field.field.replace(/_/g, ' ')}</span>
              <div className="flex items-center gap-1">
                {getStatusIcon(field.status)}
                {getStatusBadge(field.status, field.variance_percent)}
              </div>
            </div>
          ))}
          {summary.fields.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{summary.fields.length - 3} more fields
            </span>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Variance Summary</CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              overallStatus === 'pass' && "bg-green-100 text-green-800",
              overallStatus === 'warning' && "bg-yellow-100 text-yellow-800",
              overallStatus === 'fail' && "bg-red-100 text-red-800"
            )}
          >
            {summary.within_tolerance}/{summary.total_fields} Within Tolerance (±{summary.tolerance_percent}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Parameter</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Design</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Installed</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Variance</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.fields.map((field, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2 capitalize">{field.field.replace(/_/g, ' ')}</td>
                  <td className="py-2 text-right font-mono text-muted-foreground">
                    {formatValue(field.design_value)}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {formatValue(field.installed_value)}
                  </td>
                  <td className="py-2 text-right">
                    {getStatusBadge(field.status, field.variance_percent)}
                  </td>
                  <td className="py-2 text-center">
                    {getStatusIcon(field.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
