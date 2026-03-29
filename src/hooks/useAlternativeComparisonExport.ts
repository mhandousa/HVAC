import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';
import type { DesignAlternative } from '@/hooks/useDesignAlternatives';

interface ComparisonMetric {
  key: string;
  label: string;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | ((value: number) => string);
  higherIsBetter?: boolean;
}

interface ExportOptions {
  alternatives: DesignAlternative[];
  metrics: ComparisonMetric[];
  projectName?: string;
  entityType: string;
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

function formatValue(value: number | null, format?: ComparisonMetric['format'], unit?: string): string {
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
}

function formatEntityType(entityType: string): string {
  return entityType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useAlternativeComparisonExport() {
  const exportToPdf = useCallback(({ alternatives, metrics, projectName, entityType }: ExportOptions) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(18);
      doc.setTextColor(41, 98, 255);
      doc.text('Design Alternatives Comparison', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(formatEntityType(entityType), pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Project and date info
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      if (projectName) {
        doc.text(`Project: ${projectName}`, 14, yPos);
      }
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, yPos, { align: 'right' });
      yPos += 15;

      // Alternatives summary
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('Alternatives Compared:', 14, yPos);
      yPos += 6;

      alternatives.forEach((alt, idx) => {
        const prefix = idx === 0 ? '• (Baseline) ' : '• ';
        const primary = alt.is_primary ? ' ★ Primary' : '';
        const tags = alt.tags.length > 0 ? ` [${alt.tags.join(', ')}]` : '';
        doc.setFontSize(9);
        doc.text(`${prefix}${alt.name}${primary}${tags}`, 20, yPos);
        yPos += 5;
      });
      yPos += 10;

      // Comparison table
      const tableHeaders = ['Metric', ...alternatives.map((alt, idx) => 
        idx === 0 ? alt.name : `${alt.name} (Δ)`
      )];

      const tableData = metrics.map(metric => {
        const values = alternatives.map(alt => {
          const value = getNestedValue(alt.data, metric.key);
          return typeof value === 'number' ? value : null;
        });

        const baseValue = values[0];
        
        return [
          metric.label,
          ...values.map((value, idx) => {
            const formattedValue = formatValue(value, metric.format, metric.unit);
            if (idx === 0 || value === null || baseValue === null || baseValue === 0) {
              return formattedValue;
            }
            const delta = ((value - baseValue) / Math.abs(baseValue)) * 100;
            const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
            return `${formattedValue} (${deltaStr})`;
          }),
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [tableHeaders],
        body: tableData,
        headStyles: {
          fillColor: [41, 98, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left' },
          ...Object.fromEntries(
            alternatives.map((_, idx) => [idx + 1, { halign: 'center' }])
          ),
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      const fileName = `comparison-${entityType}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: 'PDF Exported',
        description: `Comparison report saved as ${fileName}`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
      });
    }
  }, []);

  const exportToExcel = useCallback(({ alternatives, metrics, projectName, entityType }: ExportOptions) => {
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Design Alternatives Comparison Report'],
        [''],
        ['Entity Type:', formatEntityType(entityType)],
        ['Project:', projectName || 'N/A'],
        ['Generated:', new Date().toLocaleString()],
        ['Number of Alternatives:', alternatives.length.toString()],
        [''],
        ['Alternatives:'],
        ...alternatives.map((alt, idx) => [
          `${idx + 1}. ${alt.name}`,
          alt.is_primary ? 'Primary' : '',
          alt.tags.join(', '),
          alt.description || '',
        ]),
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Comparison sheet
      const comparisonHeaders = ['Metric', 'Unit', ...alternatives.map(alt => alt.name)];
      const deltaHeaders = ['', '', ...alternatives.map((_, idx) => idx === 0 ? 'Baseline' : 'Δ from Baseline')];

      const comparisonData = metrics.map(metric => {
        const values = alternatives.map(alt => {
          const value = getNestedValue(alt.data, metric.key);
          return typeof value === 'number' ? value : null;
        });

        return [
          metric.label,
          metric.unit || '',
          ...values.map(v => v !== null ? v : ''),
        ];
      });

      const deltaData = metrics.map(metric => {
        const values = alternatives.map(alt => {
          const value = getNestedValue(alt.data, metric.key);
          return typeof value === 'number' ? value : null;
        });
        const baseValue = values[0];

        return [
          '',
          '',
          ...values.map((value, idx) => {
            if (idx === 0) return 'Baseline';
            if (value === null || baseValue === null || baseValue === 0) return '';
            const delta = ((value - baseValue) / Math.abs(baseValue)) * 100;
            return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
          }),
        ];
      });

      // Interleave comparison and delta rows
      const interleavedData: (string | number)[][] = [];
      comparisonData.forEach((row, idx) => {
        interleavedData.push(row);
        interleavedData.push(deltaData[idx]);
      });

      const comparisonSheet = XLSX.utils.aoa_to_sheet([
        comparisonHeaders,
        deltaHeaders,
        [],
        ...interleavedData,
      ]);

      // Set column widths
      comparisonSheet['!cols'] = [
        { wch: 25 },
        { wch: 12 },
        ...alternatives.map(() => ({ wch: 20 })),
      ];

      XLSX.utils.book_append_sheet(wb, comparisonSheet, 'Comparison');

      // Raw Data sheet
      const rawDataHeaders = ['Alternative', 'Is Primary', 'Tags', ...metrics.map(m => m.label)];
      const rawDataRows = alternatives.map(alt => [
        alt.name,
        alt.is_primary ? 'Yes' : 'No',
        alt.tags.join(', '),
        ...metrics.map(metric => {
          const value = getNestedValue(alt.data, metric.key);
          return typeof value === 'number' ? value : '';
        }),
      ]);

      const rawDataSheet = XLSX.utils.aoa_to_sheet([rawDataHeaders, ...rawDataRows]);
      rawDataSheet['!cols'] = [
        { wch: 25 },
        { wch: 12 },
        { wch: 25 },
        ...metrics.map(() => ({ wch: 18 })),
      ];
      XLSX.utils.book_append_sheet(wb, rawDataSheet, 'Raw Data');

      // Save
      const fileName = `comparison-${entityType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Excel Exported',
        description: `Comparison report saved as ${fileName}`,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate Excel report',
        variant: 'destructive',
      });
    }
  }, []);

  return { exportToPdf, exportToExcel };
}
