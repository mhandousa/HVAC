import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SegmentData } from '@/components/duct-design/SegmentPropertiesPanel';
import { DuctSystemAnalysis } from './useDuctSystemAnalysis';

interface DuctSystemExportData {
  systemName: string;
  systemType: string;
  segments: SegmentData[];
  analysis: DuctSystemAnalysis;
  summary: {
    totalCFM: number;
    totalPressureDrop: number;
    maxVelocity: number;
    segmentCount: number;
    fanStaticPressure: number;
  };
  settings: {
    ductMaterial: string;
    sizingMethod: string;
    targetVelocity?: number;
    targetFriction?: number;
  };
}

function formatDimensions(segment: SegmentData): string {
  if (segment.shape === 'round') {
    return segment.diameterIn ? `${segment.diameterIn}" Ø` : '-';
  }
  return segment.widthIn && segment.heightIn 
    ? `${segment.widthIn}" x ${segment.heightIn}"` 
    : '-';
}

export function useDuctSystemExport() {
  const exportToPDF = useCallback((data: DuctSystemExportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.systemName, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Duct System Design Report', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // System Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('System Summary', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      ['System Type', data.systemType.replace('_', ' ').toUpperCase()],
      ['Total Airflow', `${data.summary.totalCFM.toFixed(0)} CFM`],
      ['Total Pressure Drop', `${data.summary.totalPressureDrop.toFixed(1)} Pa`],
      ['Max Velocity', `${data.summary.maxVelocity.toFixed(0)} fpm`],
      ['Fan Static Pressure', `${data.summary.fanStaticPressure.toFixed(1)} in.wg`],
      ['Duct Material', data.settings.ductMaterial.replace(/_/g, ' ')],
      ['Sizing Method', data.settings.sizingMethod.replace(/_/g, ' ')],
      ['Segment Count', data.summary.segmentCount.toString()],
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

    // Critical Path
    if (data.analysis.criticalPath.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Critical Path Analysis', 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Critical Path Pressure Drop: ${data.analysis.criticalPathPressureDrop.toFixed(1)} Pa`, 14, y);
      y += 6;
      doc.text(`System ${data.analysis.isBalanced ? 'is balanced' : 'requires damper adjustment'}`, 14, y);
      y += 12;
    }

    // Duct Schedule
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Duct Schedule', 14, y);
    y += 8;

    const ductScheduleData = data.segments.map((seg) => [
      seg.name,
      formatDimensions(seg),
      seg.lengthFt?.toFixed(0) || '-',
      seg.cfm.toFixed(0),
      seg.velocityFpm?.toFixed(0) || '-',
      seg.totalPressureDropPa?.toFixed(1) || '-',
      seg.isCriticalPath ? 'Yes' : 'No',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Segment', 'Size', 'Length (ft)', 'CFM', 'Velocity (fpm)', 'ΔP (Pa)', 'Critical']],
      body: ductScheduleData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Fittings Summary
    const allFittings = data.segments.flatMap((seg) =>
      seg.fittings.map((f) => ({
        segment: seg.name,
        ...f,
      }))
    );

    if (allFittings.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Fittings Schedule', 14, y);
      y += 8;

      const fittingsData = allFittings.map((f) => [
        f.segment,
        f.fittingName,
        f.quantity.toString(),
        f.lossCoefficient.toFixed(2),
        f.pressureLossPa?.toFixed(1) || '-',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Segment', 'Fitting', 'Qty', 'Loss Coef.', 'ΔP (Pa)']],
        body: fittingsData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Branch Balancing
    if (data.analysis.branches.length > 1) {
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Branch Balancing Analysis', 14, y);
      y += 8;

      const branchData = data.analysis.branches.map((b) => [
        b.branchName,
        b.cfm.toFixed(0),
        b.pressureDrop.toFixed(1),
        b.deltaFromCritical.toFixed(1),
        b.damperRequired ? 'Yes' : 'No',
        b.recommendedDamperPosition ? `${b.recommendedDamperPosition}%` : '-',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Branch', 'CFM', 'ΔP (Pa)', 'Δ Critical', 'Damper Adj.', 'Position']],
        body: branchData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
      });
    }

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

    doc.save(`${data.systemName.replace(/\s+/g, '_')}_Duct_Design.pdf`);
  }, []);

  const exportToExcel = useCallback((data: DuctSystemExportData) => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Duct System Design Report'],
      [],
      ['System Name', data.systemName],
      ['System Type', data.systemType],
      [],
      ['System Summary'],
      ['Total Airflow (CFM)', data.summary.totalCFM],
      ['Total Pressure Drop (Pa)', data.summary.totalPressureDrop],
      ['Max Velocity (fpm)', data.summary.maxVelocity],
      ['Fan Static Pressure (in.wg)', data.summary.fanStaticPressure],
      ['Segment Count', data.summary.segmentCount],
      [],
      ['Design Settings'],
      ['Duct Material', data.settings.ductMaterial],
      ['Sizing Method', data.settings.sizingMethod],
      ['Target Velocity (fpm)', data.settings.targetVelocity || ''],
      ['Target Friction (Pa/m)', data.settings.targetFriction || ''],
      [],
      ['Critical Path Analysis'],
      ['Critical Path Pressure Drop (Pa)', data.analysis.criticalPathPressureDrop],
      ['System Balanced', data.analysis.isBalanced ? 'Yes' : 'No'],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Duct Schedule Sheet
    const ductScheduleData = [
      ['Segment', 'Shape', 'Dimensions', 'Length (ft)', 'CFM', 'Velocity (fpm)', 'Friction (Pa/100ft)', 'Pressure Drop (Pa)', 'Critical Path', 'Has Damper', 'Parent'],
      ...data.segments.map((seg) => [
        seg.name,
        seg.shape,
        formatDimensions(seg),
        seg.lengthFt,
        seg.cfm,
        seg.velocityFpm,
        seg.frictionLossPer100ft,
        seg.totalPressureDropPa,
        seg.isCriticalPath ? 'Yes' : 'No',
        seg.hasDamper ? 'Yes' : 'No',
        seg.parentId || '',
      ]),
    ];

    const ductSheet = XLSX.utils.aoa_to_sheet(ductScheduleData);
    XLSX.utils.book_append_sheet(wb, ductSheet, 'Duct Schedule');

    // Fittings Sheet
    const fittingsData = [
      ['Segment', 'Fitting Code', 'Fitting Name', 'Quantity', 'Loss Coefficient', 'Pressure Loss (Pa)'],
    ];
    data.segments.forEach((seg) => {
      seg.fittings.forEach((f) => {
        fittingsData.push([
          seg.name,
          f.fittingCode,
          f.fittingName,
          f.quantity,
          f.lossCoefficient,
          f.pressureLossPa || '',
        ] as any);
      });
    });

    const fittingsSheet = XLSX.utils.aoa_to_sheet(fittingsData);
    XLSX.utils.book_append_sheet(wb, fittingsSheet, 'Fittings');

    // Branch Balancing Sheet
    if (data.analysis.branches.length > 0) {
      const branchData = [
        ['Branch', 'CFM', 'Pressure Drop (Pa)', 'Delta from Critical (Pa)', 'Damper Required', 'Recommended Position (%)'],
        ...data.analysis.branches.map((b) => [
          b.branchName,
          b.cfm,
          b.pressureDrop,
          b.deltaFromCritical,
          b.damperRequired ? 'Yes' : 'No',
          b.recommendedDamperPosition || '',
        ]),
      ];

      const branchSheet = XLSX.utils.aoa_to_sheet(branchData);
      XLSX.utils.book_append_sheet(wb, branchSheet, 'Branch Balancing');
    }

    XLSX.writeFile(wb, `${data.systemName.replace(/\s+/g, '_')}_Duct_Design.xlsx`);
  }, []);

  return { exportToPDF, exportToExcel };
}
