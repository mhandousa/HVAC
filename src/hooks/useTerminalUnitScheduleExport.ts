import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface TerminalUnitRow {
  id: string;
  unit_tag: string;
  unit_type: string;
  quantity: number;
  manufacturer: string | null;
  model_number: string | null;
  supply_cfm: number | null;
  min_cfm: number | null;
  max_cfm: number | null;
  outdoor_air_cfm: number | null;
  inlet_size_in: number | null;
  selected_size: string | null;
  cooling_load_btuh: number | null;
  heating_load_btuh: number | null;
  reheat_type: string | null;
  reheat_kw: number | null;
  has_damper: boolean;
  has_flow_station: boolean;
  has_discharge_sensor: boolean;
  noise_nc: number | null;
  status: string;
  notes: string | null;
  zone_name: string;
  floor_name: string;
  building_name: string;
}

export interface GroupedTerminalUnits {
  groupName: string;
  items: TerminalUnitRow[];
}

export interface ScheduleColumn {
  key: keyof TerminalUnitRow;
  label: string;
  enabled: boolean;
  width?: number;
}

export interface ScheduleHeader {
  title: string;
  projectNumber?: string;
  revision?: string;
  date?: string;
  preparedBy?: string;
  checkedBy?: string;
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

export const DEFAULT_TERMINAL_UNIT_COLUMNS: ScheduleColumn[] = [
  { key: 'unit_tag', label: 'Tag', enabled: true, width: 80 },
  { key: 'unit_type', label: 'Type', enabled: true, width: 100 },
  { key: 'quantity', label: 'Qty', enabled: true, width: 40 },
  { key: 'manufacturer', label: 'Manufacturer', enabled: false, width: 100 },
  { key: 'model_number', label: 'Model', enabled: false, width: 100 },
  { key: 'inlet_size_in', label: 'Inlet (in)', enabled: true, width: 60 },
  { key: 'supply_cfm', label: 'Supply CFM', enabled: true, width: 80 },
  { key: 'min_cfm', label: 'Min CFM', enabled: true, width: 70 },
  { key: 'max_cfm', label: 'Max CFM', enabled: true, width: 70 },
  { key: 'cooling_load_btuh', label: 'Cooling (BTU/h)', enabled: true, width: 100 },
  { key: 'heating_load_btuh', label: 'Heating (BTU/h)', enabled: true, width: 100 },
  { key: 'reheat_type', label: 'Reheat', enabled: true, width: 80 },
  { key: 'reheat_kw', label: 'Reheat kW', enabled: false, width: 70 },
  { key: 'noise_nc', label: 'NC', enabled: true, width: 50 },
  { key: 'zone_name', label: 'Zone', enabled: true, width: 120 },
  { key: 'building_name', label: 'Building', enabled: false, width: 100 },
  { key: 'floor_name', label: 'Floor', enabled: false, width: 80 },
  { key: 'status', label: 'Status', enabled: false, width: 80 },
];

const formatUnitType = (type: string): string => {
  const typeMap: Record<string, string> = {
    vav_reheat: 'VAV Reheat',
    vav_cooling: 'VAV Cooling Only',
    vav_fan_powered: 'VAV Fan Powered',
    fcu_2pipe: 'FCU 2-Pipe',
    fcu_4pipe: 'FCU 4-Pipe',
    fcu_electric: 'FCU Electric',
  };
  return typeMap[type] || type;
};

export function useTerminalUnitScheduleExport() {
  const exportToPDF = useCallback((
    data: GroupedTerminalUnits[],
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
      doc.text(header.title || 'TERMINAL UNIT SCHEDULE', pageWidth / 2, yPos, { align: 'center' });
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
      const totalUnits = data.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0), 0);
      const totalCfm = data.reduce((sum, g) => sum + g.items.reduce((s, i) => s + (i.supply_cfm || 0) * i.quantity, 0), 0);
      const typeCount: Record<string, number> = {};
      data.forEach(g => {
        g.items.forEach(item => {
          const type = formatUnitType(item.unit_type);
          typeCount[type] = (typeCount[type] || 0) + item.quantity;
        });
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', margin, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Total Units: ${totalUnits}  |  Total CFM: ${totalCfm.toLocaleString()}`, margin, yPos);
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
      if (group.groupName !== 'All Terminal Units') {
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
          const value = item[col.key];
          if (col.key === 'unit_type') {
            return formatUnitType(value as string);
          }
          if (col.key === 'reheat_type') {
            if (value === 'hot_water') return 'HW';
            if (value === 'electric') return 'Elec';
            if (value === 'none' || !value) return '-';
            return value?.toString() || '-';
          }
          if (col.key === 'has_damper' || col.key === 'has_flow_station' || col.key === 'has_discharge_sensor') {
            return value ? 'Yes' : 'No';
          }
          if (typeof value === 'number') {
            return value.toLocaleString();
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

    const filename = options.filename || `terminal-unit-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
  }, []);

  const exportToExcel = useCallback((
    data: GroupedTerminalUnits[],
    columns: ScheduleColumn[],
    header: ScheduleHeader,
    projectName: string,
    notes: string | null,
    options: ExportOptions
  ) => {
    const workbook = XLSX.utils.book_new();
    const enabledColumns = columns.filter(c => c.enabled);

    // Cover sheet
    const totalUnits = data.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0), 0);
    const totalCfm = data.reduce((sum, g) => sum + g.items.reduce((s, i) => s + (i.supply_cfm || 0) * i.quantity, 0), 0);
    
    const coverData = [
      ['TERMINAL UNIT SCHEDULE'],
      [''],
      ['Project:', projectName],
      ['Project Number:', header.projectNumber || '-'],
      ['Revision:', header.revision || 'A'],
      ['Date:', header.date || format(new Date(), 'yyyy-MM-dd')],
      ['Prepared By:', header.preparedBy || '-'],
      ['Checked By:', header.checkedBy || '-'],
      [''],
      ['Total Terminal Units:', totalUnits.toString()],
      ['Total Supply CFM:', totalCfm.toLocaleString()],
    ];

    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    coverSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Terminal unit schedule sheet
    const scheduleHeaders = enabledColumns.map(c => c.label);
    const scheduleData: (string | number)[][] = [scheduleHeaders];

    data.forEach(group => {
      if (group.groupName !== 'All Terminal Units') {
        scheduleData.push([group.groupName, ...Array(enabledColumns.length - 1).fill('')]);
      }
      group.items.forEach(item => {
        const row = enabledColumns.map(col => {
          const value = item[col.key];
          if (col.key === 'unit_type') {
            return formatUnitType(value as string);
          }
          if (col.key === 'reheat_type') {
            if (value === 'hot_water') return 'Hot Water';
            if (value === 'electric') return 'Electric';
            if (value === 'none' || !value) return '';
            return value?.toString() || '';
          }
          if (col.key === 'has_damper' || col.key === 'has_flow_station' || col.key === 'has_discharge_sensor') {
            return value ? 'Yes' : 'No';
          }
          if (typeof value === 'number') {
            return value;
          }
          return value?.toString() || '';
        });
        scheduleData.push(row);
      });
    });

    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    scheduleSheet['!cols'] = enabledColumns.map(c => ({ wch: c.width ? c.width / 6 : 15 }));
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Terminal Unit Schedule');

    // Summary sheet
    if (options.includeSummary) {
      const typeCount: Record<string, { count: number; cfm: number; cooling: number; heating: number }> = {};
      data.forEach(g => {
        g.items.forEach(item => {
          const type = formatUnitType(item.unit_type);
          if (!typeCount[type]) {
            typeCount[type] = { count: 0, cfm: 0, cooling: 0, heating: 0 };
          }
          typeCount[type].count += item.quantity;
          typeCount[type].cfm += (item.supply_cfm || 0) * item.quantity;
          typeCount[type].cooling += (item.cooling_load_btuh || 0) * item.quantity;
          typeCount[type].heating += (item.heating_load_btuh || 0) * item.quantity;
        });
      });

      const summaryData = [
        ['Unit Type', 'Quantity', 'Total CFM', 'Total Cooling (BTU/h)', 'Total Heating (BTU/h)'],
        ...Object.entries(typeCount).map(([type, stats]) => [
          type, 
          stats.count, 
          stats.cfm, 
          stats.cooling, 
          stats.heating
        ]),
        ['', '', '', '', ''],
        ['TOTAL', totalUnits, totalCfm, 
          Object.values(typeCount).reduce((s, v) => s + v.cooling, 0),
          Object.values(typeCount).reduce((s, v) => s + v.heating, 0)
        ],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Notes sheet
    if (options.includeNotes && notes) {
      const notesSheet = XLSX.utils.aoa_to_sheet([['Notes'], [notes]]);
      notesSheet['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes');
    }

    const filename = options.filename || `terminal-unit-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }, []);

  const copyToClipboard = useCallback((
    data: GroupedTerminalUnits[],
    columns: ScheduleColumn[]
  ) => {
    const enabledColumns = columns.filter(c => c.enabled);
    const headers = enabledColumns.map(c => c.label).join('\t');
    
    const rows: string[] = [headers];
    data.forEach(group => {
      if (group.groupName !== 'All Terminal Units') {
        rows.push(group.groupName);
      }
      group.items.forEach(item => {
        const row = enabledColumns.map(col => {
          const value = item[col.key];
          if (col.key === 'unit_type') {
            return formatUnitType(value as string);
          }
          if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
          }
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
