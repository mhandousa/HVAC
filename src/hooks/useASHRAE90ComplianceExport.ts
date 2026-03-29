import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComplianceReport, ComplianceCheckResult } from './useASHRAE90Compliance';

export function useASHRAE90ComplianceExport() {
  const getStatusColor = (status: string): [number, number, number] => {
    switch (status) {
      case 'pass': return [34, 197, 94]; // green
      case 'fail': return [239, 68, 68]; // red
      case 'warning': return [245, 158, 11]; // amber
      case 'exempt': return [59, 130, 246]; // blue
      default: return [156, 163, 175]; // gray
    }
  };

  const exportToPdf = (report: ComplianceReport) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ASHRAE 90.1 Compliance Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(report.codeVersion, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Project Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Information', 14, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${report.projectName}`, 14, yPos);
    yPos += 5;
    doc.text(`Location: ${report.cityName}, Saudi Arabia`, 14, yPos);
    yPos += 5;
    doc.text(`Climate Zone: ${report.climateZone.ashraeZone} - ${report.climateZone.name}`, 14, yPos);
    yPos += 5;
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, yPos);
    yPos += 12;

    // Overall Compliance Status
    const statusColor = report.overallCompliance === 'compliant' ? [34, 197, 94] :
      report.overallCompliance === 'partial' ? [245, 158, 11] : [239, 68, 68];
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(14, yPos, pageWidth - 28, 20, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${report.overallCompliance.toUpperCase()} - Score: ${report.complianceScore}%`,
      pageWidth / 2,
      yPos + 13,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
    yPos += 28;

    // Summary Statistics
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance Summary', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Count']],
      body: [
        ['Total Checks', report.summary.totalChecks.toString()],
        ['Passed', report.summary.passCount.toString()],
        ['Failed', report.summary.failCount.toString()],
        ['Warnings', report.summary.warningCount.toString()],
        ['Exempt', report.summary.exemptCount.toString()],
        ['Unknown', report.summary.unknownCount.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
      },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Equipment Checks
    if (report.equipmentChecks.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Equipment Efficiency Checks', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['Equipment', 'Requirement', 'Required', 'Actual', 'Status']],
        body: report.equipmentChecks.map(check => [
          check.itemName,
          check.requirement,
          check.requiredValue,
          check.actualValue,
          check.status.toUpperCase(),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          4: { 
            cellWidth: 25,
            halign: 'center',
          },
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const status = report.equipmentChecks[data.row.index]?.status;
            if (status) {
              const color = getStatusColor(status);
              doc.setTextColor(color[0], color[1], color[2]);
            }
          }
        },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const status = report.equipmentChecks[data.row.index]?.status;
            if (status) {
              const color = getStatusColor(status);
              data.cell.styles.textColor = color;
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // System Checks
    if (report.systemChecks.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('System Compliance Checks', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['System', 'Requirement', 'Required', 'Actual', 'Status']],
        body: report.systemChecks.map(check => [
          check.itemName,
          check.requirement,
          check.requiredValue,
          check.actualValue,
          check.status.toUpperCase(),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const status = report.systemChecks[data.row.index]?.status;
            if (status) {
              const color = getStatusColor(status);
              data.cell.styles.textColor = color;
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Pump Checks
    if (report.pumpChecks.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Pump Power Checks', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['Pump', 'Requirement', 'Required', 'Actual', 'Status']],
        body: report.pumpChecks.map(check => [
          check.itemName,
          check.requirement,
          check.requiredValue,
          check.actualValue,
          check.status.toUpperCase(),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const status = report.pumpChecks[data.row.index]?.status;
            if (status) {
              const color = getStatusColor(status);
              data.cell.styles.textColor = color;
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Mandatory Requirements
    if (report.mandatoryChecks.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Mandatory Requirements', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['Requirement', 'Description', 'Status', 'Reference']],
        body: report.mandatoryChecks.map(check => [
          check.itemName,
          check.requirement,
          check.status.toUpperCase(),
          check.reference || '',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 80 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30 },
        },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const status = report.mandatoryChecks[data.row.index]?.status;
            if (status) {
              const color = getStatusColor(status);
              data.cell.styles.textColor = color;
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', 14, yPos);
      yPos += 6;

      report.recommendations.forEach((rec, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 28);
        doc.text(lines, 14, yPos);
        yPos += lines.length * 4 + 3;
      });
    }

    // Footer on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(
        `ASHRAE 90.1 Compliance Report - ${report.projectName} - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    const filename = `ASHRAE_90.1_Compliance_${report.projectName.replace(/\s+/g, '_')}_${
      new Date().toISOString().split('T')[0]
    }.pdf`;
    doc.save(filename);
  };

  const exportToCsv = (report: ComplianceReport) => {
    const headers = [
      'Check Type',
      'Item Name',
      'Requirement',
      'Required Value',
      'Actual Value',
      'Status',
      'Notes',
      'Reference',
      'Recommendation',
    ];

    const allChecks = [
      ...report.equipmentChecks,
      ...report.systemChecks,
      ...report.pumpChecks,
      ...report.mandatoryChecks,
    ];

    const rows = allChecks.map(check => [
      check.checkType,
      check.itemName,
      check.requirement,
      check.requiredValue,
      check.actualValue,
      check.status,
      check.notes || '',
      check.reference || '',
      check.recommendation || '',
    ]);

    // Add summary rows at the top
    const summaryRows = [
      ['Project:', report.projectName, '', '', '', '', '', '', ''],
      ['Location:', report.cityName, '', '', '', '', '', '', ''],
      ['Climate Zone:', `${report.climateZone.ashraeZone} - ${report.climateZone.name}`, '', '', '', '', '', '', ''],
      ['Code Version:', report.codeVersion, '', '', '', '', '', '', ''],
      ['Generated:', new Date(report.generatedAt).toLocaleString(), '', '', '', '', '', '', ''],
      ['Overall Status:', report.overallCompliance, '', '', '', '', '', '', ''],
      ['Compliance Score:', `${report.complianceScore}%`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['Summary:', '', '', '', '', '', '', '', ''],
      ['Total Checks:', report.summary.totalChecks.toString(), '', '', '', '', '', '', ''],
      ['Passed:', report.summary.passCount.toString(), '', '', '', '', '', '', ''],
      ['Failed:', report.summary.failCount.toString(), '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
    ];

    const csvContent = [
      ...summaryRows.map(row => row.join(',')),
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ASHRAE_90.1_Compliance_${report.projectName.replace(/\s+/g, '_')}_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    link.click();
  };

  return { exportToPdf, exportToCsv };
}
