import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Building2,
  Award,
  Filter,
  Image as ImageIcon,
  ArrowLeftRight,
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Tables } from '@/integrations/supabase/types';
import { CommissioningCertificateDialog } from './CommissioningCertificateDialog';
import { supabase } from '@/integrations/supabase/client';
import { DEFICIENCY_CATEGORIES, getTagLabel, getSeverityInfo, DeficiencySeverity } from '@/lib/deficiency-types';

type CommissioningProject = Tables<'commissioning_projects'>;
type CommissioningChecklist = Tables<'commissioning_checklists'>;
type CommissioningTest = Tables<'commissioning_tests'>;

interface PhotoMetadata {
  id: string;
  test_id: string;
  photo_url: string;
  deficiency_tags: string[];
  deficiency_severity: string | null;
  description: string | null;
  is_before_photo: boolean;
  related_after_photo_url: string | null;
}

interface CommissioningReportExportProps {
  project: CommissioningProject;
  checklists: CommissioningChecklist[];
  tests: CommissioningTest[];
}

export function CommissioningReportExport({
  project,
  checklists,
  tests,
}: CommissioningReportExportProps) {
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata[]>([]);
  const [selectedDeficiencyFilters, setSelectedDeficiencyFilters] = useState<string[]>([]);
  const [includeBeforeAfter, setIncludeBeforeAfter] = useState(true);
  
  // Fetch photo metadata for all tests
  useEffect(() => {
    const fetchPhotoMetadata = async () => {
      const testIds = tests.map((t) => t.id);
      if (testIds.length === 0) return;

      const { data } = await supabase
        .from('commissioning_photo_metadata')
        .select('*')
        .in('test_id', testIds);

      if (data) {
        setPhotoMetadata(data as PhotoMetadata[]);
      }
    };

    fetchPhotoMetadata();
  }, [tests]);

  const passedChecklists = checklists.filter(c => c.overall_status === 'pass').length;
  const failedChecklists = checklists.filter(c => c.overall_status === 'fail').length;
  const passedTests = tests.filter(t => t.result === 'pass').length;
  const failedTests = tests.filter(t => t.result === 'fail').length;

  // Count deficiencies by category
  const deficiencyCounts: Record<string, number> = {};
  photoMetadata.forEach((m) => {
    m.deficiency_tags?.forEach((tag) => {
      deficiencyCounts[tag] = (deficiencyCounts[tag] || 0) + 1;
    });
  });

  // Count before/after pairs
  const comparisonPairs = photoMetadata.filter((m) => m.is_before_photo && m.related_after_photo_url);

  const toggleDeficiencyFilter = (tag: string) => {
    if (selectedDeficiencyFilters.includes(tag)) {
      setSelectedDeficiencyFilters(selectedDeficiencyFilters.filter((t) => t !== tag));
    } else {
      setSelectedDeficiencyFilters([...selectedDeficiencyFilters, tag]);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('HVAC Commissioning Report', 14, 22);
    
    // Project info
    doc.setFontSize(12);
    doc.text(`Project: ${project.name}`, 14, 35);
    doc.text(`Status: ${project.status}`, 14, 42);
    doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, 14, 49);
    if (project.contractor_name) {
      doc.text(`Contractor: ${project.contractor_name}`, 14, 56);
    }

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 14, 70);
    
    autoTable(doc, {
      startY: 75,
      head: [['Metric', 'Value']],
      body: [
        ['Total Checklists', checklists.length.toString()],
        ['Passed Checklists', passedChecklists.toString()],
        ['Failed Checklists', failedChecklists.toString()],
        ['Total Tests', tests.length.toString()],
        ['Passed Tests', passedTests.toString()],
        ['Failed Tests', failedTests.toString()],
        ['Documented Deficiencies', Object.keys(deficiencyCounts).length.toString()],
        ['Before/After Comparisons', comparisonPairs.length.toString()],
      ],
    });

    // Deficiency Summary
    if (Object.keys(deficiencyCounts).length > 0) {
      doc.setFontSize(14);
      doc.text('Deficiency Summary', 14, (doc as any).lastAutoTable.finalY + 15);

      const deficiencyData = Object.entries(deficiencyCounts)
        .filter(([tag]) => selectedDeficiencyFilters.length === 0 || selectedDeficiencyFilters.includes(tag))
        .map(([tag, count]) => [getTagLabel(tag), count.toString()]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Deficiency Type', 'Count']],
        body: deficiencyData,
      });
    }

    // Checklists
    if (checklists.length > 0) {
      doc.setFontSize(14);
      doc.text('Equipment Checklists', 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Equipment', 'Type', 'Status', 'Verified']],
        body: checklists.map(c => [
          c.equipment_tag || '-',
          c.checklist_type,
          c.overall_status,
          c.verified_at ? format(new Date(c.verified_at), 'MMM d, yyyy') : 'Pending',
        ]),
      });
    }

    // Tests with failures
    const failedTestsList = tests.filter(t => t.result === 'fail');
    if (failedTestsList.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Failed Tests', 14, 22);

      autoTable(doc, {
        startY: 27,
        head: [['Test Name', 'Category', 'Expected', 'Actual', 'Variance %']],
        body: failedTestsList.map(t => [
          t.test_name,
          t.test_category || '-',
          t.expected_value || '-',
          t.actual_value || '-',
          t.variance_percent?.toFixed(1) || '-',
        ]),
      });
    }

    // Photo deficiencies section
    const filteredPhotoMetadata = photoMetadata.filter((m) => {
      if (selectedDeficiencyFilters.length === 0) return m.deficiency_tags?.length > 0;
      return m.deficiency_tags?.some((tag) => selectedDeficiencyFilters.includes(tag));
    });

    if (filteredPhotoMetadata.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Documented Deficiencies', 14, 22);

      const deficiencyTableData = filteredPhotoMetadata.map((m) => {
        const test = tests.find((t) => t.id === m.test_id);
        const severityInfo = m.deficiency_severity
          ? getSeverityInfo(m.deficiency_severity as DeficiencySeverity)
          : null;
        return [
          test?.test_name || '-',
          m.deficiency_tags?.map(getTagLabel).join(', ') || '-',
          severityInfo?.label || '-',
          m.description || '-',
          m.is_before_photo ? (m.related_after_photo_url ? 'Resolved' : 'Pending') : 'N/A',
        ];
      });

      autoTable(doc, {
        startY: 27,
        head: [['Test', 'Deficiency Type', 'Severity', 'Description', 'Status']],
        body: deficiencyTableData,
        styles: { fontSize: 9 },
        columnStyles: {
          3: { cellWidth: 50 },
        },
      });
    }

    // Before/After comparisons section
    if (includeBeforeAfter && comparisonPairs.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Before/After Comparisons', 14, 22);
      doc.setFontSize(10);
      doc.text(`${comparisonPairs.length} remediation(s) documented with comparison photos`, 14, 32);

      const comparisonData = comparisonPairs.map((m) => {
        const test = tests.find((t) => t.id === m.test_id);
        return [
          test?.test_name || '-',
          m.deficiency_tags?.map(getTagLabel).join(', ') || '-',
          m.description || '-',
          'See attached photos',
        ];
      });

      autoTable(doc, {
        startY: 40,
        head: [['Test', 'Original Issue', 'Description', 'Photos']],
        body: comparisonData,
      });
    }

    doc.save(`Commissioning-Report-${project.name}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['HVAC Commissioning Report'],
      [''],
      ['Project', project.name],
      ['Status', project.status],
      ['Date', format(new Date(), 'MMM d, yyyy')],
      ['Contractor', project.contractor_name || '-'],
      [''],
      ['Summary'],
      ['Total Checklists', checklists.length],
      ['Passed Checklists', passedChecklists],
      ['Failed Checklists', failedChecklists],
      ['Total Tests', tests.length],
      ['Passed Tests', passedTests],
      ['Failed Tests', failedTests],
      ['Documented Deficiencies', Object.keys(deficiencyCounts).length],
      ['Before/After Comparisons', comparisonPairs.length],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Checklists sheet
    const checklistsData = [
      ['Equipment Tag', 'Type', 'Status', 'Verified Date', 'Notes'],
      ...checklists.map(c => [
        c.equipment_tag || '-',
        c.checklist_type,
        c.overall_status,
        c.verified_at ? format(new Date(c.verified_at), 'MMM d, yyyy') : 'Pending',
        c.notes || '',
      ]),
    ];
    const checklistsWs = XLSX.utils.aoa_to_sheet(checklistsData);
    XLSX.utils.book_append_sheet(wb, checklistsWs, 'Checklists');

    // Tests sheet
    const testsData = [
      ['Test Name', 'Category', 'Expected', 'Actual', 'Tolerance %', 'Variance %', 'Result', 'Technician', 'Notes'],
      ...tests.map(t => [
        t.test_name,
        t.test_category || '-',
        t.expected_value || '-',
        t.actual_value || '-',
        t.tolerance_percent || '-',
        t.variance_percent?.toFixed(1) || '-',
        t.result,
        t.technician_name || '-',
        t.notes || '',
      ]),
    ];
    const testsWs = XLSX.utils.aoa_to_sheet(testsData);
    XLSX.utils.book_append_sheet(wb, testsWs, 'Tests');

    // Deficiencies sheet
    if (photoMetadata.length > 0) {
      const deficienciesData = [
        ['Test Name', 'Deficiency Tags', 'Severity', 'Description', 'Is Before Photo', 'Has After Photo'],
        ...photoMetadata
          .filter((m) => m.deficiency_tags?.length > 0)
          .map((m) => {
            const test = tests.find((t) => t.id === m.test_id);
            return [
              test?.test_name || '-',
              m.deficiency_tags?.map(getTagLabel).join(', ') || '-',
              m.deficiency_severity || '-',
              m.description || '-',
              m.is_before_photo ? 'Yes' : 'No',
              m.related_after_photo_url ? 'Yes' : 'No',
            ];
          }),
      ];
      const deficienciesWs = XLSX.utils.aoa_to_sheet(deficienciesData);
      XLSX.utils.book_append_sheet(wb, deficienciesWs, 'Deficiencies');
    }

    XLSX.writeFile(wb, `Commissioning-Report-${project.name}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Commissioning Report Preview
          </CardTitle>
          <CardDescription>
            Review the report summary before exporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Project Info */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {project.contractor_name && `${project.contractor_name} • `}
                  {format(new Date(project.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <Badge className="ml-auto" variant={project.status === 'completed' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>

            <Separator />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{checklists.length}</p>
                <p className="text-sm text-muted-foreground">Total Checklists</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{passedChecklists}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{failedChecklists}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {checklists.length - passedChecklists - failedChecklists}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>

            <Separator />

            {/* Test Summary */}
            <div>
              <h4 className="font-medium mb-3">Test Results Summary</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>{passedTests} Passed</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>{failedTests} Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>{tests.length - passedTests - failedTests} Pending</span>
                </div>
              </div>
            </div>

            {/* Photo Documentation Summary */}
            {photoMetadata.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Photo Documentation Summary
                  </h4>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{photoMetadata.length}</Badge>
                      <span className="text-sm">Total Photos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{Object.keys(deficiencyCounts).length}</Badge>
                      <span className="text-sm">Tagged Deficiencies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      <Badge variant="outline">{comparisonPairs.length}</Badge>
                      <span className="text-sm">Before/After Pairs</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Failed Tests Alert */}
            {failedTests > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Action Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {failedTests} test(s) failed and require attention before commissioning can be completed.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deficiency Filters */}
      {Object.keys(deficiencyCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filter Report by Deficiency Type
            </CardTitle>
            <CardDescription>
              Select which deficiency types to include in the report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-3">
                {DEFICIENCY_CATEGORIES.map((category) => {
                  const categoryTags = category.tags.filter((tag) => deficiencyCounts[tag.id]);
                  if (categoryTags.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        {category.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categoryTags.map((tag) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={tag.id}
                              checked={selectedDeficiencyFilters.includes(tag.id)}
                              onCheckedChange={() => toggleDeficiencyFilter(tag.id)}
                            />
                            <Label htmlFor={tag.id} className="text-sm cursor-pointer">
                              {tag.label} ({deficiencyCounts[tag.id]})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <Checkbox
                id="include-before-after"
                checked={includeBeforeAfter}
                onCheckedChange={(checked) => setIncludeBeforeAfter(checked === true)}
              />
              <Label htmlFor="include-before-after" className="text-sm cursor-pointer">
                Include Before/After Comparisons ({comparisonPairs.length} pairs)
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Download the commissioning report in your preferred format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={exportToPDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={exportToExcel} variant="outline" className="flex-1">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => setShowCertificateDialog(true)} variant="outline" className="flex-1">
              <Award className="h-4 w-4 mr-2" />
              Generate Certificate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Dialog */}
      <CommissioningCertificateDialog
        open={showCertificateDialog}
        onOpenChange={setShowCertificateDialog}
        project={project}
        checklists={checklists}
        tests={tests}
      />
    </div>
  );
}
