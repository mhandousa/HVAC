import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProjectBOQ } from '@/types/boq';

export function useBOQExport() {
  const exportToPDF = useCallback((boq: ProjectBOQ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Helper for page breaks
    const checkPageBreak = (requiredSpace: number = 40) => {
      if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }
    };
    
    // Cover Page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill of Quantities', pageWidth / 2, 60, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text(boq.projectName, pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated: ${boq.generatedDate}`, pageWidth / 2, 100, { align: 'center' });
    
    // Summary Box
    doc.setDrawColor(100);
    doc.rect(30, 120, pageWidth - 60, 80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 40, 135);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = [
      `Total Duct Area: ${boq.summary.totalDuctAreaSqFt.toFixed(0)} ft² (${boq.summary.totalDuctWeightLbs.toFixed(0)} lbs)`,
      `Total Pipe Length: ${boq.summary.totalPipeLengthFt.toFixed(0)} ft (${boq.summary.totalPipeWeightLbs.toFixed(0)} lbs)`,
      `Terminal Units: ${boq.summary.totalTerminalUnits} | Diffusers: ${boq.summary.totalDiffusers}`,
      `Equipment: ${boq.summary.totalEquipmentPieces} | AHUs: ${boq.summary.totalAHUs}`,
      `Accessories: ${boq.summary.totalAccessories} | Supports: ${boq.summary.totalSupports}`,
      `Insulation: ${boq.summary.totalInsulationAreaSqM.toFixed(1)} m² (Est. SAR ${boq.summary.totalInsulationCostSAR.toFixed(0)})`,
    ];
    summaryLines.forEach((line, idx) => {
      doc.text(line, 40, 150 + idx * 8);
    });
    
    // Table of Contents
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', 14, yPos);
    yPos += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const tocItems = [
      'Executive Summary',
      'Duct Systems Schedule',
      'Pipe Systems Schedule',
      'Duct Fittings Schedule',
      'Pipe Fittings Schedule',
      'Diffusers & Grilles Schedule',
      'Terminal Units Schedule',
      'Equipment Schedule',
      'AHU Components Schedule',
      'Accessories Schedule',
      'Supports & Hangers Schedule',
      'Insulation Schedule',
    ];
    tocItems.forEach((item, idx) => {
      doc.text(`${idx + 1}. ${item}`, 20, yPos);
      yPos += 8;
    });
    
    // Duct Systems Schedule
    if (boq.ductSystems.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Duct Systems Schedule', 14, yPos);
      yPos += 10;
      
      boq.ductSystems.forEach(system => {
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(system.systemName, 14, yPos);
        yPos += 5;
        
        if (system.segments.length > 0) {
          autoTable(doc, {
            startY: yPos,
            head: [['Segment', 'Shape', 'Dimensions', 'Length (ft)', 'Area (ft²)', 'Weight (lb)', 'Gauge']],
            body: system.segments.map(seg => [
              seg.segmentName,
              seg.shape,
              seg.dimensions,
              seg.lengthFt.toFixed(1),
              seg.surfaceAreaSqFt.toFixed(1),
              seg.weightLbs.toFixed(0),
              `${seg.gauge} ga`,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] },
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }
    
    // Pipe Systems Schedule
    if (boq.pipeSystems.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Pipe Systems Schedule', 14, yPos);
      yPos += 10;
      
      boq.pipeSystems.forEach(system => {
        checkPageBreak(60);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(system.systemName, 14, yPos);
        yPos += 5;
        
        if (system.segments.length > 0) {
          autoTable(doc, {
            startY: yPos,
            head: [['Segment', 'Size', 'Length (ft)', 'Material', 'Schedule', 'Weight (lb)']],
            body: system.segments.map(seg => [
              seg.segmentName,
              seg.nominalSize,
              seg.lengthFt.toFixed(1),
              seg.material,
              seg.schedule,
              seg.totalWeightLbs.toFixed(0),
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] },
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }
    
    // Terminal Units Schedule
    if (boq.terminalUnits.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Terminal Units Schedule', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tag', 'Type', 'Manufacturer', 'Model', 'CFM', 'Qty', 'Reheat', 'Zone']],
        body: boq.terminalUnits.map(tu => [
          tu.unitTag,
          tu.unitType,
          tu.manufacturer,
          tu.model,
          tu.airflowCfm.toString(),
          tu.quantity.toString(),
          tu.hasReheat ? tu.reheatType : 'No',
          tu.zoneName || '-',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    }
    
    // Equipment Schedule
    if (boq.equipmentSelections.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Equipment Schedule', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Name', 'Manufacturer', 'Model', 'Capacity', 'Qty']],
        body: boq.equipmentSelections.map(eq => [
          eq.category,
          eq.name,
          eq.manufacturer,
          eq.model,
          eq.capacity,
          eq.quantity.toString(),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    }
    
    // AHU Components Schedule
    if (boq.ahuComponents.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AHU Components Schedule', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tag', 'Name', 'CFM', 'Cooling (Tons)', 'Heating (MBH)', 'Supply Fan HP', 'Return Fan HP']],
        body: boq.ahuComponents.map(ahu => [
          ahu.ahuTag,
          ahu.ahuName,
          ahu.cfm.toLocaleString(),
          ahu.coolingTons?.toFixed(1) || '-',
          ahu.heatingMBH?.toFixed(0) || '-',
          ahu.supplyFanHP?.toFixed(1) || '-',
          ahu.returnFanHP?.toFixed(1) || '-',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    }
    
    // Accessories Schedule
    if (boq.accessories.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Accessories Schedule', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Description', 'Size', 'Qty', 'Source']],
        body: boq.accessories.map(acc => [
          acc.category,
          acc.description,
          acc.size,
          acc.quantity.toString(),
          acc.sourceUnit,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    }
    
    // Supports Schedule
    if (boq.supports.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Supports & Hangers Schedule', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Description', 'Size', 'Est. Qty', 'Basis']],
        body: boq.supports.map(sup => [
          sup.supportType,
          sup.description,
          sup.size,
          sup.estimatedQuantity.toString(),
          sup.basis,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    }
    
    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      doc.text(`BOQ - ${boq.projectName}`, 14, doc.internal.pageSize.getHeight() - 10);
    }
    
    const date = new Date().toISOString().split('T')[0];
    doc.save(`BOQ_${boq.projectName.replace(/\s+/g, '_')}_${date}.pdf`);
  }, []);
  
  const exportToExcel = useCallback((boq: ProjectBOQ) => {
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Bill of Quantities Summary'],
      ['Project:', boq.projectName],
      ['Generated:', boq.generatedDate],
      [''],
      ['Category', 'Value', 'Unit'],
      ['Total Duct Area', boq.summary.totalDuctAreaSqFt.toFixed(0), 'ft²'],
      ['Total Duct Weight', boq.summary.totalDuctWeightLbs.toFixed(0), 'lbs'],
      ['Total Duct Length', boq.summary.totalDuctLengthFt.toFixed(0), 'ft'],
      ['Total Pipe Length', boq.summary.totalPipeLengthFt.toFixed(0), 'ft'],
      ['Total Pipe Weight', boq.summary.totalPipeWeightLbs.toFixed(0), 'lbs'],
      ['Total Insulation Area', boq.summary.totalInsulationAreaSqM.toFixed(1), 'm²'],
      ['Est. Insulation Cost', boq.summary.totalInsulationCostSAR.toFixed(0), 'SAR'],
      [''],
      ['Component Counts'],
      ['Diffusers/Grilles', boq.summary.totalDiffusers],
      ['Terminal Units', boq.summary.totalTerminalUnits],
      ['Equipment Pieces', boq.summary.totalEquipmentPieces],
      ['AHUs', boq.summary.totalAHUs],
      ['Duct Fittings', boq.summary.totalDuctFittings],
      ['Pipe Fittings', boq.summary.totalPipeFittings],
      ['Accessories', boq.summary.totalAccessories],
      ['Supports', boq.summary.totalSupports],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Duct Schedule
    if (boq.ductSystems.length > 0) {
      const ductData: (string | number)[][] = [
        ['System', 'Segment', 'Shape', 'Dimensions', 'Length (ft)', 'Area (ft²)', 'Weight (lb)', 'Gauge', 'Material'],
      ];
      boq.ductSystems.forEach(system => {
        system.segments.forEach(seg => {
          ductData.push([
            system.systemName,
            seg.segmentName,
            seg.shape,
            seg.dimensions,
            seg.lengthFt,
            seg.surfaceAreaSqFt,
            seg.weightLbs,
            seg.gauge,
            seg.material,
          ]);
        });
      });
      const ductSheet = XLSX.utils.aoa_to_sheet(ductData);
      XLSX.utils.book_append_sheet(wb, ductSheet, 'Duct Schedule');
    }
    
    // Pipe Schedule
    if (boq.pipeSystems.length > 0) {
      const pipeData: (string | number)[][] = [
        ['System', 'Segment', 'Size', 'Length (ft)', 'Material', 'Schedule', 'Wt/ft (lb)', 'Total (lb)'],
      ];
      boq.pipeSystems.forEach(system => {
        system.segments.forEach(seg => {
          pipeData.push([
            system.systemName,
            seg.segmentName,
            seg.nominalSize,
            seg.lengthFt,
            seg.material,
            seg.schedule,
            seg.weightLbsPerFt,
            seg.totalWeightLbs,
          ]);
        });
      });
      const pipeSheet = XLSX.utils.aoa_to_sheet(pipeData);
      XLSX.utils.book_append_sheet(wb, pipeSheet, 'Pipe Schedule');
    }
    
    // Terminal Units
    if (boq.terminalUnits.length > 0) {
      const tuData: (string | number)[][] = [
        ['Tag', 'Type', 'Manufacturer', 'Model', 'Size', 'CFM', 'Qty', 'Reheat', 'Reheat Type', 'Zone'],
      ];
      boq.terminalUnits.forEach(tu => {
        tuData.push([
          tu.unitTag,
          tu.unitType,
          tu.manufacturer,
          tu.model,
          tu.size,
          tu.airflowCfm,
          tu.quantity,
          tu.hasReheat ? 'Yes' : 'No',
          tu.reheatType,
          tu.zoneName || '-',
        ]);
      });
      const tuSheet = XLSX.utils.aoa_to_sheet(tuData);
      XLSX.utils.book_append_sheet(wb, tuSheet, 'Terminal Units');
    }
    
    // Equipment
    if (boq.equipmentSelections.length > 0) {
      const eqData: (string | number)[][] = [
        ['Category', 'Name', 'Manufacturer', 'Model', 'Capacity', 'Qty', 'Notes'],
      ];
      boq.equipmentSelections.forEach(eq => {
        eqData.push([
          eq.category,
          eq.name,
          eq.manufacturer,
          eq.model,
          eq.capacity,
          eq.quantity,
          eq.notes,
        ]);
      });
      const eqSheet = XLSX.utils.aoa_to_sheet(eqData);
      XLSX.utils.book_append_sheet(wb, eqSheet, 'Equipment');
    }
    
    // AHU Components
    if (boq.ahuComponents.length > 0) {
      const ahuData: (string | number)[][] = [
        ['Tag', 'Name', 'CFM', 'Cooling (Tons)', 'Heating (MBH)', 'Supply Fan HP', 'Return Fan HP', 'Filter Type', 'Has ERV'],
      ];
      boq.ahuComponents.forEach(ahu => {
        ahuData.push([
          ahu.ahuTag,
          ahu.ahuName,
          ahu.cfm,
          ahu.coolingTons || '-',
          ahu.heatingMBH || '-',
          ahu.supplyFanHP || '-',
          ahu.returnFanHP || '-',
          ahu.filterType || '-',
          ahu.hasERV ? 'Yes' : 'No',
        ]);
      });
      const ahuSheet = XLSX.utils.aoa_to_sheet(ahuData);
      XLSX.utils.book_append_sheet(wb, ahuSheet, 'AHU Components');
    }
    
    // Accessories
    if (boq.accessories.length > 0) {
      const accData: (string | number)[][] = [
        ['Category', 'Description', 'Size', 'Quantity', 'Source Unit'],
      ];
      boq.accessories.forEach(acc => {
        accData.push([
          acc.category,
          acc.description,
          acc.size,
          acc.quantity,
          acc.sourceUnit,
        ]);
      });
      const accSheet = XLSX.utils.aoa_to_sheet(accData);
      XLSX.utils.book_append_sheet(wb, accSheet, 'Accessories');
    }
    
    // Supports
    if (boq.supports.length > 0) {
      const supData: (string | number)[][] = [
        ['Type', 'Description', 'Size', 'Est. Quantity', 'Basis'],
      ];
      boq.supports.forEach(sup => {
        supData.push([
          sup.supportType,
          sup.description,
          sup.size,
          sup.estimatedQuantity,
          sup.basis,
        ]);
      });
      const supSheet = XLSX.utils.aoa_to_sheet(supData);
      XLSX.utils.book_append_sheet(wb, supSheet, 'Supports');
    }
    
    // Insulation
    const allInsulation = [
      ...boq.ductSystems.flatMap(s => s.insulation),
      ...boq.pipeSystems.flatMap(s => s.insulation),
    ];
    if (allInsulation.length > 0) {
      const insData: (string | number)[][] = [
        ['Segment', 'Application', 'Material', 'Thickness (mm)', 'Area (m²)', 'Est. Cost (SAR)'],
      ];
      allInsulation.forEach(ins => {
        insData.push([
          ins.segmentName,
          ins.application,
          ins.insulationType,
          ins.thicknessMm,
          ins.surfaceAreaSqM,
          (ins.surfaceAreaSqM * ins.costPerM2).toFixed(0),
        ]);
      });
      const insSheet = XLSX.utils.aoa_to_sheet(insData);
      XLSX.utils.book_append_sheet(wb, insSheet, 'Insulation');
    }
    
    // Diffusers
    if (boq.diffusersGrilles.length > 0) {
      const diffData: (string | number | null)[][] = [
        ['Type', 'Style', 'Model', 'Neck Size', 'CFM', 'Qty', 'Location'],
      ];
      boq.diffusersGrilles.forEach(diff => {
        diffData.push([
          diff.terminalType,
          diff.style || '-',
          diff.model || '-',
          diff.neckSize || '-',
          diff.airflowCfm || '-',
          diff.quantity,
          diff.locationDescription || '-',
        ]);
      });
      const diffSheet = XLSX.utils.aoa_to_sheet(diffData);
      XLSX.utils.book_append_sheet(wb, diffSheet, 'Diffusers & Grilles');
    }
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `BOQ_${boq.projectName.replace(/\s+/g, '_')}_${date}.xlsx`);
  }, []);
  
  return { exportToPDF, exportToExcel };
}
