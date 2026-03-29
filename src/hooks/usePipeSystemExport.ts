import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PipeSegmentData } from '@/components/pipe-design/PipeSegmentPropertiesPanel';
import { PipeSystemAnalysis } from './usePipeSystemAnalysis';
import { formatNominalSize } from '@/lib/pipe-calculations';

interface PipeSystemExportData {
  systemName: string;
  systemType: string;
  segments: PipeSegmentData[];
  analysis: PipeSystemAnalysis;
  summary: {
    totalFlow: number;
    totalHeadLoss: number;
    maxVelocity: number;
    hydraulicHP: number;
    brakeHP: number;
    motorHP: number;
  };
  settings: {
    pipeMaterial: string;
    sizingMethod: string;
    targetVelocity: number;
    maxFriction: number;
    fluidTempF: number;
    glycolPercent: number;
  };
}

export function usePipeSystemExport() {
  const exportToPDF = useCallback((data: PipeSystemExportData) => {
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
    doc.text(`Pipe System Design Report`, pageWidth / 2, y, { align: 'center' });
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
      ['Total Flow', `${data.summary.totalFlow.toFixed(1)} GPM`],
      ['Total Head Loss', `${data.summary.totalHeadLoss.toFixed(2)} ft`],
      ['Max Velocity', `${data.summary.maxVelocity.toFixed(1)} fps`],
      ['Motor Size Required', `${data.summary.motorHP} HP`],
      ['Pipe Material', data.settings.pipeMaterial.replace(/_/g, ' ')],
      ['Fluid Temperature', `${data.settings.fluidTempF}°F`],
      ['Glycol %', `${data.settings.glycolPercent}%`],
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
      doc.text(`Critical Path Head Loss: ${data.analysis.criticalPathHeadLoss.toFixed(2)} ft`, 14, y);
      y += 6;
      doc.text(`System ${data.analysis.isBalanced ? 'is balanced' : 'requires balance valves'}`, 14, y);
      y += 12;
    }

    // Pipe Schedule
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Pipe Schedule', 14, y);
    y += 8;

    const pipeScheduleData = data.segments.map((seg) => [
      seg.name,
      seg.nominalSize ? formatNominalSize(seg.nominalSize) : '-',
      seg.lengthFt?.toFixed(0) || '-',
      seg.flowGPM.toFixed(1),
      seg.velocity?.toFixed(2) || '-',
      seg.totalHeadLoss?.toFixed(2) || '-',
      seg.isCriticalPath ? 'Yes' : 'No',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Segment', 'Size', 'Length (ft)', 'Flow (GPM)', 'Velocity (fps)', 'Head Loss (ft)', 'Critical']],
      body: pipeScheduleData,
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
        f.kFactor.toFixed(2),
        (f.kFactor * f.quantity).toFixed(2),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Segment', 'Fitting', 'Qty', 'K-Factor', 'Total K']],
        body: fittingsData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Circuit Balancing
    if (data.analysis.circuits.length > 1) {
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Circuit Balancing Analysis', 14, y);
      y += 8;

      const circuitData = data.analysis.circuits.map((c) => [
        c.circuitName,
        c.flow.toFixed(1),
        c.headLoss.toFixed(2),
        c.deltaFromCritical.toFixed(2),
        c.balanceValveRequired ? 'Yes' : 'No',
        c.recommendedCv?.toFixed(1) || '-',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Circuit', 'Flow (GPM)', 'Head Loss (ft)', 'Δ Critical (ft)', 'Valve Req.', 'Cv']],
        body: circuitData,
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

    doc.save(`${data.systemName.replace(/\s+/g, '_')}_Pipe_Design.pdf`);
  }, []);

  const exportToExcel = useCallback((data: PipeSystemExportData) => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Pipe System Design Report'],
      [],
      ['System Name', data.systemName],
      ['System Type', data.systemType],
      [],
      ['System Summary'],
      ['Total Flow (GPM)', data.summary.totalFlow],
      ['Total Head Loss (ft)', data.summary.totalHeadLoss],
      ['Max Velocity (fps)', data.summary.maxVelocity],
      ['Hydraulic HP', data.summary.hydraulicHP],
      ['Brake HP', data.summary.brakeHP],
      ['Motor Size (HP)', data.summary.motorHP],
      [],
      ['Design Settings'],
      ['Pipe Material', data.settings.pipeMaterial],
      ['Sizing Method', data.settings.sizingMethod],
      ['Target Velocity (fps)', data.settings.targetVelocity],
      ['Max Friction (ft/100ft)', data.settings.maxFriction],
      ['Fluid Temperature (°F)', data.settings.fluidTempF],
      ['Glycol %', data.settings.glycolPercent],
      [],
      ['Critical Path Analysis'],
      ['Critical Path Head Loss (ft)', data.analysis.criticalPathHeadLoss],
      ['System Balanced', data.analysis.isBalanced ? 'Yes' : 'No'],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Pipe Schedule Sheet
    const pipeScheduleData = [
      ['Segment', 'Size', 'Length (ft)', 'Flow (GPM)', 'Velocity (fps)', 'Friction (ft/100ft)', 'Head Loss (ft)', 'Critical Path', 'Parent'],
      ...data.segments.map((seg) => [
        seg.name,
        seg.nominalSize ? formatNominalSize(seg.nominalSize) : '',
        seg.lengthFt,
        seg.flowGPM,
        seg.velocity,
        seg.frictionPer100ft,
        seg.totalHeadLoss,
        seg.isCriticalPath ? 'Yes' : 'No',
        seg.parentId || '',
      ]),
    ];

    const pipeSheet = XLSX.utils.aoa_to_sheet(pipeScheduleData);
    XLSX.utils.book_append_sheet(wb, pipeSheet, 'Pipe Schedule');

    // Fittings Sheet
    const fittingsData = [
      ['Segment', 'Fitting Code', 'Fitting Name', 'Quantity', 'K-Factor', 'Total K'],
    ];
    data.segments.forEach((seg) => {
      seg.fittings.forEach((f) => {
        fittingsData.push([
          seg.name,
          f.fittingCode,
          f.fittingName,
          f.quantity,
          f.kFactor,
          f.kFactor * f.quantity,
        ] as any);
      });
    });

    const fittingsSheet = XLSX.utils.aoa_to_sheet(fittingsData);
    XLSX.utils.book_append_sheet(wb, fittingsSheet, 'Fittings');

    // Circuit Balancing Sheet
    if (data.analysis.circuits.length > 0) {
      const circuitData = [
        ['Circuit', 'Flow (GPM)', 'Head Loss (ft)', 'Delta from Critical (ft)', 'Balance Valve Required', 'Recommended Cv'],
        ...data.analysis.circuits.map((c) => [
          c.circuitName,
          c.flow,
          c.headLoss,
          c.deltaFromCritical,
          c.balanceValveRequired ? 'Yes' : 'No',
          c.recommendedCv || '',
        ]),
      ];

      const circuitSheet = XLSX.utils.aoa_to_sheet(circuitData);
      XLSX.utils.book_append_sheet(wb, circuitSheet, 'Circuit Balancing');
    }

    XLSX.writeFile(wb, `${data.systemName.replace(/\s+/g, '_')}_Pipe_Design.xlsx`);
  }, []);

  return { exportToPDF, exportToExcel };
}
