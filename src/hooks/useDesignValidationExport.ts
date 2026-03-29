import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DesignValidationReport, ValidationCheck } from './useDesignValidation';

export function useDesignValidationExport() {
  const exportToPdf = (report: DesignValidationReport) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Helper to add page if needed
    const checkAddPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Design Validation Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Project info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${report.projectName}`, 14, yPos);
    yPos += 6;
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, yPos);
    yPos += 10;

    // Overall Status Box
    const statusColors: Record<string, [number, number, number]> = {
      pass: [34, 197, 94],
      warning: [234, 179, 8],
      fail: [239, 68, 68],
      info: [59, 130, 246],
    };
    const statusColor = statusColors[report.overallStatus] || statusColors.info;
    
    doc.setFillColor(...statusColor);
    doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `OVERALL STATUS: ${report.overallStatus.toUpperCase()} (${report.summary.completionScore}% Score)`,
      pageWidth / 2,
      yPos + 10,
      { align: 'center' }
    );
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${report.summary.passCount} Pass | ${report.summary.warningCount} Warning | ${report.summary.failCount} Fail`,
      pageWidth / 2,
      yPos + 18,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
    yPos += 35;

    // Design Workflow Status
    checkAddPage(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Design Workflow Status', 14, yPos);
    yPos += 8;

    const stageData = [
      ['Load Calculations', report.stageStatus.loadCalculations.count.toString(), report.stageStatus.loadCalculations.hasData ? 'Complete' : 'Missing'],
      ['Equipment Selections', report.stageStatus.equipmentSelections.count.toString(), `${report.stageStatus.equipmentSelections.linkedToLoads} linked`],
      ['Duct Systems', report.stageStatus.ductSystems.count.toString(), `${report.stageStatus.ductSystems.linkedToLoads} linked`],
      ['Pipe Systems', report.stageStatus.pipeSystems.count.toString(), `${report.stageStatus.pipeSystems.linkedToLoads} linked`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Stage', 'Count', 'Status']],
      body: stageData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Zone Validations
    if (report.zoneValidations.length > 0) {
      checkAddPage(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Zone Validations', 14, yPos);
      yPos += 8;

      const zoneData = report.zoneValidations.map(zone => [
        zone.zoneName,
        zone.buildingName || '-',
        zone.checks.length.toString(),
        zone.passCount.toString(),
        zone.warningCount.toString(),
        zone.failCount.toString(),
        zone.overallStatus.toUpperCase(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Zone', 'Building', 'Checks', 'Pass', 'Warn', 'Fail', 'Status']],
        body: zoneData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const status = data.cell.raw as string;
            if (status === 'PASS') data.cell.styles.textColor = [34, 197, 94];
            else if (status === 'WARNING') data.cell.styles.textColor = [234, 179, 8];
            else if (status === 'FAIL') data.cell.styles.textColor = [239, 68, 68];
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // System Validations
    if (report.systemValidations.length > 0) {
      checkAddPage(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('System Validations', 14, yPos);
      yPos += 8;

      const systemData = report.systemValidations.map(sys => [
        sys.systemName,
        sys.systemType.toUpperCase(),
        sys.checks.length.toString(),
        sys.passCount.toString(),
        sys.warningCount.toString(),
        sys.failCount.toString(),
        sys.overallStatus.toUpperCase(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['System', 'Type', 'Checks', 'Pass', 'Warn', 'Fail', 'Status']],
        body: systemData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const status = data.cell.raw as string;
            if (status === 'PASS') data.cell.styles.textColor = [34, 197, 94];
            else if (status === 'WARNING') data.cell.styles.textColor = [234, 179, 8];
            else if (status === 'FAIL') data.cell.styles.textColor = [239, 68, 68];
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Detailed Checks
    const allChecks: ValidationCheck[] = [
      ...report.zoneValidations.flatMap(z => z.checks),
      ...report.systemValidations.flatMap(s => s.checks),
    ];

    if (allChecks.length > 0) {
      checkAddPage(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Validation Checks', 14, yPos);
      yPos += 8;

      const checksData = allChecks.map(check => [
        check.name,
        check.category.toUpperCase(),
        `${check.expected} ${check.unit}`,
        `${check.actual} ${check.unit}`,
        check.deviation !== undefined ? `${check.deviation > 0 ? '+' : ''}${check.deviation.toFixed(1)}%` : '-',
        check.status.toUpperCase(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Check', 'Category', 'Expected', 'Actual', 'Deviation', 'Status']],
        body: checksData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const status = data.cell.raw as string;
            if (status === 'PASS') data.cell.styles.textColor = [34, 197, 94];
            else if (status === 'WARNING') data.cell.styles.textColor = [234, 179, 8];
            else if (status === 'FAIL') data.cell.styles.textColor = [239, 68, 68];
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      checkAddPage(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', 14, yPos);
      yPos += 8;

      const recData = report.recommendations.map(rec => [
        rec.priority.toUpperCase(),
        rec.category,
        rec.message,
        rec.affectedItems.join(', '),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Priority', 'Category', 'Recommendation', 'Affected Items']],
        body: recData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: {
          2: { cellWidth: 80 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const priority = data.cell.raw as string;
            if (priority === 'HIGH') data.cell.styles.textColor = [239, 68, 68];
            else if (priority === 'MEDIUM') data.cell.styles.textColor = [234, 179, 8];
            else data.cell.styles.textColor = [59, 130, 246];
          }
        },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | HVACPro AI Design Validation Report`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    doc.save(`design-validation-${report.projectName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return { exportToPdf };
}
