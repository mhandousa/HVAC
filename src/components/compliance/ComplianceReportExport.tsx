import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { useASHRAE90ComplianceExport } from '@/hooks/useASHRAE90ComplianceExport';
import type { ComplianceReport } from '@/hooks/useASHRAE90Compliance';

interface ComplianceReportExportProps {
  report: ComplianceReport | null;
}

export function ComplianceReportExport({ report }: ComplianceReportExportProps) {
  const { exportToPdf, exportToCsv } = useASHRAE90ComplianceExport();

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete the compliance check to enable report export
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Compliance Report
        </CardTitle>
        <CardDescription>
          Download the compliance report for project documentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => exportToPdf(report)}
          >
            <FileText className="h-4 w-4 text-red-500" />
            <div className="text-left">
              <p className="font-medium">PDF Report</p>
              <p className="text-xs text-muted-foreground">Professional compliance document</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => exportToCsv(report)}
          >
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
            <div className="text-left">
              <p className="font-medium">CSV Export</p>
              <p className="text-xs text-muted-foreground">Spreadsheet with all checks</p>
            </div>
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">Report Contents:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>• Project information and climate zone</li>
            <li>• Overall compliance score and status</li>
            <li>• Equipment efficiency checks ({report.equipmentChecks.length} items)</li>
            <li>• System compliance checks ({report.systemChecks.length} items)</li>
            <li>• Pump power checks ({report.pumpChecks.length} items)</li>
            <li>• Mandatory requirements ({report.mandatoryChecks.length} items)</li>
            <li>• Recommendations for non-compliant items</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
