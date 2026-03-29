import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ShieldOff } from 'lucide-react';
import type { ComplianceCheckResult } from '@/hooks/useASHRAE90Compliance';

interface ComplianceCheckCardProps {
  check: ComplianceCheckResult;
}

export function ComplianceCheckCard({ check }: ComplianceCheckCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'exempt':
        return <ShieldOff className="h-5 w-5 text-blue-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Warning</Badge>;
      case 'exempt':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Exempt</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className={`
      ${check.status === 'fail' ? 'border-destructive/50' : ''}
      ${check.status === 'pass' ? 'border-emerald-500/50' : ''}
    `}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getStatusIcon(check.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{check.itemName}</p>
                <p className="text-sm text-muted-foreground">{check.requirement}</p>
              </div>
              {getStatusBadge(check.status)}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Required: </span>
                <span className="font-medium">{check.requiredValue}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Actual: </span>
                <span className={`font-medium ${
                  check.status === 'fail' ? 'text-destructive' : 
                  check.status === 'pass' ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}>
                  {check.actualValue}
                </span>
              </div>
            </div>

            {check.notes && (
              <p className="mt-2 text-xs text-muted-foreground">{check.notes}</p>
            )}

            {check.recommendation && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 rounded text-xs text-amber-800 dark:text-amber-200">
                <strong>Recommendation:</strong> {check.recommendation}
              </div>
            )}

            {check.reference && (
              <p className="mt-1 text-xs text-muted-foreground">
                Reference: {check.reference}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
