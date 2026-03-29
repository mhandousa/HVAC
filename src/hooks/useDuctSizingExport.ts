import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DuctSection {
  id: string;
  name: string;
  cfm: number;
  length: number;
  fittings: number;
  shape: 'round' | 'rectangular';
  diameter?: number;
  width?: number;
  height?: number;
  velocity?: number;
  frictionLoss?: number;
  totalPressureDrop?: number;
}

interface DuctSizingExportData {
  sections: DuctSection[];
  method: 'equal-friction' | 'velocity';
  targetFriction: number;
  targetVelocity: number;
  ductShape: 'round' | 'rectangular';
  totalSystemPressure: number;
  totalSystemCfm: number;
}

export function useDuctSizingExport() {
  const exportToPDF = useCallback((data: DuctSizingExportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Duct Sizing Report', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // System Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('System Summary', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      ['Sizing Method', data.method === 'equal-friction' ? 'Equal Friction' : 'Velocity Reduction'],
      ['Duct Shape', data.ductShape === 'round' ? 'Round' : 'Rectangular'],
      ['Target Friction', `${data.targetFriction} in. w.g./100ft`],
      ['Target Velocity', `${data.targetVelocity} FPM`],
      ['Total System CFM', `${data.totalSystemCfm.toLocaleString()} CFM`],
      ['Total System Pressure', `${data.totalSystemPressure.toFixed(2)} in. w.g.`],
    ];

    autoTable(doc, {
      startY: y,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Duct Schedule
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Duct Schedule', 14, y);
    y += 8;

    const scheduleData = data.sections.map((section) => {
      const size = section.shape === 'round'
        ? `${section.diameter}" Ø`
        : `${section.width}" x ${section.height}"`;
      return [
        section.name,
        section.cfm.toLocaleString(),
        size,
        section.length.toString(),
        section.fittings.toString(),
        section.velocity?.toLocaleString() || '-',
        section.frictionLoss?.toFixed(3) || '-',
        section.totalPressureDrop?.toFixed(3) || '-',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Section', 'CFM', 'Size', 'Length (ft)', 'Fittings (eq. ft)', 'Velocity (FPM)', 'Friction (/100ft)', 'Total ΔP']],
      body: scheduleData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save('Duct_Sizing_Report.pdf');
  }, []);

  const exportToExcel = useCallback((data: DuctSizingExportData) => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Duct Sizing Report'],
      [],
      ['System Summary'],
      ['Sizing Method', data.method === 'equal-friction' ? 'Equal Friction' : 'Velocity Reduction'],
      ['Duct Shape', data.ductShape],
      ['Target Friction (in. w.g./100ft)', data.targetFriction],
      ['Target Velocity (FPM)', data.targetVelocity],
      ['Total System CFM', data.totalSystemCfm],
      ['Total System Pressure (in. w.g.)', data.totalSystemPressure],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Duct Schedule Sheet
    const scheduleData = [
      ['Section', 'CFM', 'Shape', 'Diameter (in)', 'Width (in)', 'Height (in)', 'Length (ft)', 'Fittings Eq. Length (ft)', 'Velocity (FPM)', 'Friction (in/100ft)', 'Total Pressure Drop'],
      ...data.sections.map((section) => [
        section.name,
        section.cfm,
        section.shape,
        section.diameter || '',
        section.width || '',
        section.height || '',
        section.length,
        section.fittings,
        section.velocity || '',
        section.frictionLoss || '',
        section.totalPressureDrop || '',
      ]),
    ];

    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, scheduleSheet, 'Duct Schedule');

    XLSX.writeFile(wb, 'Duct_Sizing_Report.xlsx');
  }, []);

  return { exportToPDF, exportToExcel };
}
