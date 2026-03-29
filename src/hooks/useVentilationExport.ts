import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ZoneVentilationResult, SystemVentilationResult } from './useVentilationCalculator';

export function useVentilationExport() {
  const exportToPdf = (
    systemResult: SystemVentilationResult,
    projectName?: string,
    notes?: string
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ASHRAE 62.1 Ventilation Calculation Report', margin, yPos);
    yPos += 10;

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Ventilation Rate Procedure (VRP) per ASHRAE Standard 62.1-2022', margin, yPos);
    yPos += 10;

    // Project Info
    if (projectName) {
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Project: ${projectName}`, margin, yPos);
      yPos += 6;
    }
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 12;

    // Summary Box
    doc.setFillColor(240, 247, 255);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'S');
    
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('System Summary', margin + 4, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryCol1 = margin + 4;
    const summaryCol2 = pageWidth / 2;
    
    doc.text(`Total Zones: ${systemResult.zones.length}`, summaryCol1, yPos);
    doc.text(`Total Floor Area: ${systemResult.totalFloorArea.toLocaleString()} ft²`, summaryCol2, yPos);
    yPos += 6;
    
    doc.text(`Total Occupancy: ${systemResult.totalOccupancy} people`, summaryCol1, yPos);
    doc.text(`Diversity Factor: ${(systemResult.diversityFactor * 100).toFixed(0)}%`, summaryCol2, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text(`System Outdoor Air (Vot): ${Math.round(systemResult.systemOutdoorAir).toLocaleString()} CFM`, summaryCol1, yPos);
    doc.text(`System Efficiency (Ev): ${(systemResult.systemEfficiency * 100).toFixed(0)}%`, summaryCol2, yPos);
    
    yPos += 20;

    // Zone Details Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Zone Ventilation Details', margin, yPos);
    yPos += 6;

    const tableData = systemResult.zones.map((zone) => [
      zone.zoneName,
      zone.spaceType.spaceType,
      zone.floorArea.toLocaleString(),
      zone.occupancy.toString(),
      zone.Rp.toString(),
      zone.Ra.toFixed(2),
      Math.round(zone.Vbz).toLocaleString(),
      zone.Ez.toFixed(2),
      Math.round(zone.Voz).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [[
        'Zone Name',
        'Space Type',
        'Area (ft²)',
        'Occ.',
        'Rp',
        'Ra',
        'Vbz (CFM)',
        'Ez',
        'Voz (CFM)',
      ]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 12, halign: 'right' },
        4: { cellWidth: 12, halign: 'right' },
        5: { cellWidth: 12, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 12, halign: 'right' },
        8: { cellWidth: 20, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    // Get final Y position after table
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // System Calculations Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('System-Level Calculations', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const calculations = [
      `Total Breathing Zone OA (ΣVbz): ${Math.round(systemResult.totalVbz).toLocaleString()} CFM`,
      `Total Zone OA (ΣVoz): ${Math.round(systemResult.totalVoz).toLocaleString()} CFM`,
      `Diversity Factor (D): ${(systemResult.diversityFactor * 100).toFixed(0)}%`,
      `Uncorrected OA (Vou = D × ΣVoz): ${Math.round(systemResult.uncorrectedVou).toLocaleString()} CFM`,
      `System Ventilation Efficiency (Ev): ${(systemResult.systemEfficiency * 100).toFixed(1)}%`,
      `System Outdoor Air (Vot = Vou / Ev): ${Math.round(systemResult.systemOutdoorAir).toLocaleString()} CFM`,
    ];

    calculations.forEach((calc) => {
      doc.text(`• ${calc}`, margin + 4, yPos);
      yPos += 6;
    });

    yPos += 6;

    // Additional metrics
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Metrics:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    
    const effectiveCfmPerPerson = systemResult.totalOccupancy > 0 
      ? (systemResult.systemOutdoorAir / systemResult.totalOccupancy).toFixed(1) 
      : 'N/A';
    const effectiveCfmPerSqft = systemResult.totalFloorArea > 0 
      ? (systemResult.systemOutdoorAir / systemResult.totalFloorArea).toFixed(3) 
      : 'N/A';
    
    doc.text(`• Effective CFM/person: ${effectiveCfmPerPerson}`, margin + 4, yPos);
    yPos += 6;
    doc.text(`• Effective CFM/ft²: ${effectiveCfmPerSqft}`, margin + 4, yPos);
    yPos += 6;
    doc.text(`• Outdoor Air Mass Flow: ${Math.round(systemResult.outdoorAirMassFlow).toLocaleString()} lb/hr`, margin + 4, yPos);
    yPos += 12;

    // Check if we need a new page for formulas
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    // Formula Reference
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ASHRAE 62.1 Formula Reference', margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const formulas = [
      'Vbz = Rp × Pz + Ra × Az   (Breathing Zone Outdoor Airflow)',
      '    where Rp = outdoor air rate per person (CFM/person)',
      '          Pz = zone population',
      '          Ra = outdoor air rate per unit area (CFM/ft²)',
      '          Az = zone floor area (ft²)',
      '',
      'Voz = Vbz / Ez   (Zone Outdoor Airflow)',
      '    where Ez = zone air distribution effectiveness',
      '',
      'Vot = Vou / Ev   (System Outdoor Airflow)',
      '    where Vou = D × ΣVoz (uncorrected outdoor air)',
      '          D = occupancy diversity factor',
      '          Ev = system ventilation efficiency',
    ];

    formulas.forEach((formula) => {
      doc.text(formula, margin + 4, yPos);
      yPos += 5;
    });

    yPos += 8;

    // Notes section
    if (notes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margin, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPos);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `ASHRAE 62.1 Ventilation Report | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    const filename = projectName 
      ? `ASHRAE_62.1_Ventilation_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `ASHRAE_62.1_Ventilation_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const exportToCsv = (systemResult: SystemVentilationResult, projectName?: string) => {
    const headers = [
      'Zone Name',
      'Space Type',
      'Category',
      'Floor Area (ft²)',
      'Occupancy',
      'Default Occupancy',
      'Rp (CFM/person)',
      'Ra (CFM/ft²)',
      'People OA (CFM)',
      'Area OA (CFM)',
      'Vbz (CFM)',
      'Supply/Return Config',
      'Operating Mode',
      'Ez',
      'Voz (CFM)',
      'Effective CFM/person',
      'Effective CFM/ft²',
    ];

    const rows = systemResult.zones.map((zone) => [
      zone.zoneName,
      zone.spaceType.spaceType,
      zone.spaceType.category,
      zone.floorArea,
      zone.occupancy,
      zone.defaultOccupancy,
      zone.Rp,
      zone.Ra,
      Math.round(zone.peopleOutdoorAir),
      Math.round(zone.areaOutdoorAir),
      Math.round(zone.Vbz),
      zone.supplyConfig,
      zone.operatingMode,
      zone.Ez,
      Math.round(zone.Voz),
      zone.cfmPerPerson.toFixed(2),
      zone.cfmPerSqft.toFixed(4),
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['SYSTEM SUMMARY']);
    rows.push(['Total Floor Area (ft²)', systemResult.totalFloorArea]);
    rows.push(['Total Occupancy', systemResult.totalOccupancy]);
    rows.push(['Total Vbz (CFM)', Math.round(systemResult.totalVbz)]);
    rows.push(['Total Voz (CFM)', Math.round(systemResult.totalVoz)]);
    rows.push(['Diversity Factor', systemResult.diversityFactor]);
    rows.push(['Uncorrected Vou (CFM)', Math.round(systemResult.uncorrectedVou)]);
    rows.push(['System Efficiency (Ev)', systemResult.systemEfficiency]);
    rows.push(['System Outdoor Air Vot (CFM)', Math.round(systemResult.systemOutdoorAir)]);
    rows.push(['Outdoor Air Mass Flow (lb/hr)', Math.round(systemResult.outdoorAirMassFlow)]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const filename = projectName 
      ? `ASHRAE_62.1_Ventilation_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      : `ASHRAE_62.1_Ventilation_Data_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    exportToPdf,
    exportToCsv,
  };
}
