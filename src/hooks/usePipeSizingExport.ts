import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PipeSection {
  id: string;
  name: string;
  flowGpm: number;
  length: number;
  fittings: number;
  fluid: string;
  material: string;
  nominalSize?: number;
  velocity?: number;
  frictionLoss?: number;
  totalPressureDrop?: number;
}

interface PipeSizingExportData {
  sections: PipeSection[];
  maxVelocity: number;
  maxFriction: number;
  defaultMaterial: string;
  defaultFluid: string;
  totalSystemHead: number;
  glycolPercent: number;
}

function formatNominalSize(size: number): string {
  if (size < 1) {
    const fractions: Record<number, string> = {
      0.5: '1/2"',
      0.75: '3/4"',
    };
    return fractions[size] || `${size}"`;
  }
  if (size === 1.25) return '1-1/4"';
  if (size === 1.5) return '1-1/2"';
  if (size === 2.5) return '2-1/2"';
  return `${size}"`;
}

export function usePipeSizingExport() {
  const exportToPDF = useCallback((data: PipeSizingExportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Pipe Sizing Report', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // System Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('System Summary', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      ['Pipe Material', data.defaultMaterial.replace(/_/g, ' ').toUpperCase()],
      ['Fluid Type', data.defaultFluid.replace(/-/g, ' ').toUpperCase()],
      ['Max Velocity', `${data.maxVelocity} fps`],
      ['Max Friction', `${data.maxFriction} ft/100ft`],
      ['Glycol %', `${data.glycolPercent}%`],
      ['Total System Head', `${data.totalSystemHead.toFixed(2)} ft`],
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

    // Pipe Schedule
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Pipe Schedule', 14, y);
    y += 8;

    const scheduleData = data.sections.map((section) => [
      section.name,
      section.flowGpm.toFixed(0),
      section.nominalSize ? formatNominalSize(section.nominalSize) : '-',
      section.material.toUpperCase(),
      section.length.toString(),
      section.fittings.toString(),
      section.velocity?.toFixed(2) || '-',
      section.frictionLoss?.toFixed(2) || '-',
      section.totalPressureDrop?.toFixed(2) || '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Section', 'Flow (GPM)', 'Size', 'Material', 'Length (ft)', 'Fittings (eq. ft)', 'Velocity (fps)', 'Friction (ft/100ft)', 'Head Loss (ft)']],
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

    doc.save('Pipe_Sizing_Report.pdf');
  }, []);

  const exportToExcel = useCallback((data: PipeSizingExportData) => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Pipe Sizing Report'],
      [],
      ['System Summary'],
      ['Pipe Material', data.defaultMaterial],
      ['Fluid Type', data.defaultFluid],
      ['Max Velocity (fps)', data.maxVelocity],
      ['Max Friction (ft/100ft)', data.maxFriction],
      ['Glycol %', data.glycolPercent],
      ['Total System Head (ft)', data.totalSystemHead],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Pipe Schedule Sheet
    const scheduleData = [
      ['Section', 'Flow (GPM)', 'Nominal Size', 'Material', 'Fluid', 'Length (ft)', 'Fittings Eq. Length (ft)', 'Velocity (fps)', 'Friction (ft/100ft)', 'Head Loss (ft)'],
      ...data.sections.map((section) => [
        section.name,
        section.flowGpm,
        section.nominalSize || '',
        section.material,
        section.fluid,
        section.length,
        section.fittings,
        section.velocity || '',
        section.frictionLoss || '',
        section.totalPressureDrop || '',
      ]),
    ];

    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, scheduleSheet, 'Pipe Schedule');

    XLSX.writeFile(wb, 'Pipe_Sizing_Report.xlsx');
  }, []);

  return { exportToPDF, exportToExcel };
}
