import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import type { ComplianceReport } from '@/hooks/useASHRAE90Compliance';

interface ComplianceScoreGaugeProps {
  report: ComplianceReport | null;
}

export function ComplianceScoreGauge({ report }: ComplianceScoreGaugeProps) {
  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-muted-foreground">
            <HelpCircle className="h-6 w-6 mr-2" />
            Select a city to begin compliance check
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-destructive';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
      case 'partial':
        return <AlertCircle className="h-8 w-8 text-amber-500" />;
      default:
        return <XCircle className="h-8 w-8 text-destructive" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant': return 'Fully Compliant';
      case 'partial': return 'Partially Compliant';
      default: return 'Non-Compliant';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Overall Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          {getStatusIcon(report.overallCompliance)}
          <div>
            <p className="font-semibold text-lg">{getStatusLabel(report.overallCompliance)}</p>
            <p className="text-sm text-muted-foreground">{report.codeVersion}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Compliance Score</span>
            <span className={`font-bold ${getScoreColor(report.complianceScore)}`}>
              {report.complianceScore}%
            </span>
          </div>
          <Progress 
            value={report.complianceScore} 
            className="h-3"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">{report.summary.passCount}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{report.summary.failCount}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{report.summary.exemptCount}</div>
            <div className="text-xs text-muted-foreground">Exempt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{report.summary.unknownCount}</div>
            <div className="text-xs text-muted-foreground">Unknown</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
