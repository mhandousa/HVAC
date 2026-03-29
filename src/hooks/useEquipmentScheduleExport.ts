import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ScheduleColumn, ScheduleHeader } from './useEquipmentSchedule';

export interface EquipmentRow {
  id: string;
  tag: string;
  name: string;
  equipment_type: string | null;
  manufacturer: string | null;
  model: string | null;
  capacity_value: number | null;
  capacity_unit: string | null;
  serial_number: string | null;
  install_date: string | null;
  warranty_expiry: string | null;
  status: string;
  location: string;
  building?: string;
  floor?: string;
  zone?: string;
}

export interface GroupedEquipment {
  groupName: string;
  items: EquipmentRow[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel';
  orientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter' | 'a3';
  includeHeader: boolean;
  includeNotes: boolean;
  includeSummary: boolean;
  filename?: string;
}

export function useEquipmentScheduleExport() {
  const exportToPDF = useCallback((
    data: GroupedEquipment[],
    columns: ScheduleColumn[],
    header: ScheduleHeader,
    projectName: string,
    notes: string | null,
    options: ExportOptions
  ) => {
    const enabledColumns = columns.filter(c => c.enabled);
    const orientation = options.orientation === 'landscape' ? 'l' : 'p';
    const pageFormat: 'a3' | 'a4' | 'letter' = options.paperSize === 'a3' ? 'a3' : options.paperSize === 'letter' ? 'letter' : 'a4';
    
    const doc = new jsPDF({ orientation, format: pageFormat });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header
    if (options.includeHeader) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(header.title || 'MECHANICAL EQUIPMENT SCHEDULE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(projectName, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Header info row
      doc.setFontSize(9);
      const headerInfo = [
        header.projectNumber ? `Project No: ${header.projectNumber}` : null,
        header.revision ? `Rev: ${header.revision}` : null,
        header.date ? `Date: ${header.date}` : `Date: ${format(new Date(), 'yyyy-MM-dd')}`,
        header.preparedBy ? `Prepared By: ${header.preparedBy}` : null,
        header.checkedBy ? `Checked By: ${header.checkedBy}` : null,
      ].filter(Boolean);
      
      doc.text(headerInfo.join('  |  '), pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Divider line
      doc.setDrawColor(100);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    }

    // Summary section
    if (options.includeSummary) {
      const totalEquipment = data.reduce((sum, g) => sum + g.items.length, 0);
      const typeCount: Record<string, number> = {};
      data.forEach(g => {
        g.items.forEach(item => {
          const type = item.equipment_type || 'Other';
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', margin, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Total Equipment: ${totalEquipment}`, margin, yPos);
      yPos += 4;
      
      const summaryText = Object.entries(typeCount)
        .map(([type, count]) => `${type}: ${count}`)
        .join('  |  ');
      doc.text(summaryText, margin, yPos);
      yPos += 8;
    }

    // Table headers
    const tableHeaders = enabledColumns.map(c => c.label);
    
    // Process each group
    data.forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        yPos += 5;
      }

      // Group header
      if (group.groupName !== 'All Equipment') {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 6, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(group.groupName, margin + 2, yPos);
        yPos += 6;
      }

      // Table data
      const tableData = group.items.map(item => {
        return enabledColumns.map(col => {
          const value = item[col.key as keyof EquipmentRow];
          if (col.key === 'install_date' || col.key === 'warranty_expiry') {
            return value ? format(new Date(value as string), 'yyyy-MM-dd') : '-';
          }
          return value?.toString() || '-';
        });
      });

      autoTable(doc, {
        startY: yPos,
        head: [tableHeaders],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        columnStyles: enabledColumns.reduce((acc, col, idx) => {
          acc[idx] = { cellWidth: col.width ? col.width * 0.35 : 'auto' };
          return acc;
        }, {} as Record<number, { cellWidth: number | 'auto' }>),
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    });

    // Notes
    if (options.includeNotes && notes) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES:', margin, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPos);
    }

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    const filename = options.filename || `equipment-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
  }, []);

  const exportToExcel = useCallback((
    data: GroupedEquipment[],
    columns: ScheduleColumn[],
    header: ScheduleHeader,
    projectName: string,
    notes: string | null,
    options: ExportOptions
  ) => {
    const workbook = XLSX.utils.book_new();
    const enabledColumns = columns.filter(c => c.enabled);

    // Cover sheet
    const coverData = [
      ['MECHANICAL EQUIPMENT SCHEDULE'],
      [''],
      ['Project:', projectName],
      ['Project Number:', header.projectNumber || '-'],
      ['Revision:', header.revision || 'A'],
      ['Date:', header.date || format(new Date(), 'yyyy-MM-dd')],
      ['Prepared By:', header.preparedBy || '-'],
      ['Checked By:', header.checkedBy || '-'],
      [''],
      ['Total Equipment:', data.reduce((sum, g) => sum + g.items.length, 0).toString()],
    ];

    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    coverSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Equipment schedule sheet
    const scheduleHeaders = enabledColumns.map(c => c.label);
    const scheduleData: (string | number)[][] = [scheduleHeaders];

    data.forEach(group => {
      if (group.groupName !== 'All Equipment') {
        scheduleData.push([group.groupName, ...Array(enabledColumns.length - 1).fill('')]);
      }
      group.items.forEach(item => {
        const row = enabledColumns.map(col => {
          const value = item[col.key as keyof EquipmentRow];
          if (col.key === 'install_date' || col.key === 'warranty_expiry') {
            return value ? format(new Date(value as string), 'yyyy-MM-dd') : '';
          }
          return value?.toString() || '';
        });
        scheduleData.push(row);
      });
    });

    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    scheduleSheet['!cols'] = enabledColumns.map(c => ({ wch: c.width ? c.width / 6 : 15 }));
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Equipment Schedule');

    // Summary sheet
    if (options.includeSummary) {
      const typeCount: Record<string, number> = {};
      data.forEach(g => {
        g.items.forEach(item => {
          const type = item.equipment_type || 'Other';
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
      });

      const summaryData = [
        ['Equipment Type', 'Count'],
        ...Object.entries(typeCount).map(([type, count]) => [type, count]),
        ['', ''],
        ['Total', data.reduce((sum, g) => sum + g.items.length, 0)],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Notes sheet
    if (options.includeNotes && notes) {
      const notesSheet = XLSX.utils.aoa_to_sheet([['Notes'], [notes]]);
      notesSheet['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes');
    }

    const filename = options.filename || `equipment-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }, []);

  const copyToClipboard = useCallback((
    data: GroupedEquipment[],
    columns: ScheduleColumn[]
  ) => {
    const enabledColumns = columns.filter(c => c.enabled);
    const headers = enabledColumns.map(c => c.label).join('\t');
    
    const rows: string[] = [headers];
    data.forEach(group => {
      if (group.groupName !== 'All Equipment') {
        rows.push(group.groupName);
      }
      group.items.forEach(item => {
        const row = enabledColumns.map(col => {
          const value = item[col.key as keyof EquipmentRow];
          return value?.toString() || '';
        }).join('\t');
        rows.push(row);
      });
    });

    navigator.clipboard.writeText(rows.join('\n'));
  }, []);

  return {
    exportToPDF,
    exportToExcel,
    copyToClipboard,
  };
}
