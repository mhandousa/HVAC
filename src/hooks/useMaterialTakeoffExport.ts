import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MaterialTakeoff } from './useMaterialTakeoff';

export function useMaterialTakeoffExport() {
  const exportToPDF = useCallback((takeoff: MaterialTakeoff) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Material Takeoff / Bill of Quantities', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const systemNames = [takeoff.ductSystemName, takeoff.pipeSystemName].filter(Boolean).join(' | ');
    if (systemNames) {
      doc.text(systemNames, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
    }
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(takeoff.generatedDate).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;
    
    const summaryData = [
      ['Category', 'Quantity', 'Unit'],
      ['Duct Sheet Metal Area', takeoff.summary.totalDuctAreaSqFt.toFixed(1), 'ft²'],
      ['Duct Sheet Metal Weight', takeoff.summary.totalDuctWeightLbs.toFixed(0), 'lbs'],
      ['Duct Total Length', takeoff.summary.totalDuctLengthFt.toFixed(1), 'ft'],
      ['Pipe Total Length', takeoff.summary.totalPipeLengthFt.toFixed(1), 'ft'],
      ['Pipe Total Weight', takeoff.summary.totalPipeWeightLbs.toFixed(0), 'lbs'],
      ['Insulation Area', takeoff.summary.totalInsulationAreaSqM.toFixed(1), 'm²'],
      ['Insulation Est. Cost', `SAR ${takeoff.summary.totalInsulationCostSAR.toFixed(0)}`, ''],
      ['Duct Fittings Count', takeoff.summary.totalDuctFittings.toString(), 'pcs'],
      ['Pipe Fittings Count', takeoff.summary.totalPipeFittings.toString(), 'pcs'],
      ['Diffusers/Grilles', takeoff.summary.totalDiffusers.toString(), 'pcs'],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Duct Materials Schedule
    if (takeoff.ductMaterials.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Duct Materials Schedule', 14, yPos);
      yPos += 8;
      
      const ductData = takeoff.ductMaterials.map(d => [
        d.segmentName,
        d.shape === 'round' ? 'Round' : 'Rect',
        d.dimensions,
        d.lengthFt.toFixed(1),
        d.surfaceAreaSqFt.toFixed(1),
        d.weightLbs.toFixed(0),
        `${d.gauge} ga`,
        d.material,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Segment', 'Shape', 'Size', 'Length (ft)', 'Area (ft²)', 'Weight (lb)', 'Gauge', 'Material']],
        body: ductData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Pipe Materials Schedule
    if (takeoff.pipeMaterials.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Pipe Materials Schedule', 14, yPos);
      yPos += 8;
      
      const pipeData = takeoff.pipeMaterials.map(p => [
        p.segmentName,
        p.nominalSize,
        p.lengthFt.toFixed(1),
        p.material,
        p.schedule,
        p.weightLbsPerFt.toFixed(2),
        p.totalWeightLbs.toFixed(0),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Segment', 'Size', 'Length (ft)', 'Material', 'Schedule', 'Wt/ft (lb)', 'Total (lb)']],
        body: pipeData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Fittings Schedule
    const allFittings = [...takeoff.ductFittings, ...takeoff.pipeFittings];
    if (allFittings.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Fittings Schedule', 14, yPos);
      yPos += 8;
      
      const fittingsData = allFittings.map(f => [
        f.fittingType,
        f.fittingCode,
        f.size,
        f.quantity.toString(),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Fitting Type', 'Code', 'Size', 'Quantity']],
        body: fittingsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Insulation Schedule
    if (takeoff.insulation.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Insulation Schedule', 14, yPos);
      yPos += 8;
      
      const insulationData = takeoff.insulation.map(i => [
        i.segmentName,
        i.application === 'duct' ? 'Duct' : 'Pipe',
        i.insulationType,
        `${i.thicknessMm} mm`,
        i.surfaceAreaSqM.toFixed(2),
        `SAR ${(i.surfaceAreaSqM * i.costPerM2).toFixed(0)}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Segment', 'Type', 'Material', 'Thickness', 'Area (m²)', 'Est. Cost']],
        body: insulationData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Diffusers & Grilles
    if (takeoff.diffusersGrilles.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Diffusers & Grilles', 14, yPos);
      yPos += 8;
      
      const diffuserData = takeoff.diffusersGrilles.map(d => [
        d.type,
        d.model,
        d.neckSize,
        d.cfm.toString(),
        d.quantity.toString(),
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Model', 'Neck Size', 'CFM', 'Qty']],
        body: diffuserData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }
    
    // Footer on each page
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save
    const filename = `Material_Takeoff_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }, []);
  
  const exportToExcel = useCallback((takeoff: MaterialTakeoff) => {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Material Takeoff / Bill of Quantities'],
      [''],
      ['System', takeoff.ductSystemName || takeoff.pipeSystemName || 'N/A'],
      ['Generated', new Date(takeoff.generatedDate).toLocaleDateString()],
      [''],
      ['Summary'],
      ['Category', 'Quantity', 'Unit'],
      ['Duct Sheet Metal Area', takeoff.summary.totalDuctAreaSqFt, 'ft²'],
      ['Duct Sheet Metal Weight', takeoff.summary.totalDuctWeightLbs, 'lbs'],
      ['Duct Total Length', takeoff.summary.totalDuctLengthFt, 'ft'],
      ['Pipe Total Length', takeoff.summary.totalPipeLengthFt, 'ft'],
      ['Pipe Total Weight', takeoff.summary.totalPipeWeightLbs, 'lbs'],
      ['Insulation Area', takeoff.summary.totalInsulationAreaSqM, 'm²'],
      ['Insulation Est. Cost', takeoff.summary.totalInsulationCostSAR, 'SAR'],
      ['Duct Fittings Count', takeoff.summary.totalDuctFittings, 'pcs'],
      ['Pipe Fittings Count', takeoff.summary.totalPipeFittings, 'pcs'],
      ['Diffusers/Grilles', takeoff.summary.totalDiffusers, 'pcs'],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Duct Schedule Sheet
    if (takeoff.ductMaterials.length > 0) {
      const ductData = [
        ['Segment', 'Shape', 'Dimensions', 'Length (ft)', 'Area (ft²)', 'Weight (lb)', 'Gauge', 'Material'],
        ...takeoff.ductMaterials.map(d => [
          d.segmentName,
          d.shape,
          d.dimensions,
          d.lengthFt,
          d.surfaceAreaSqFt,
          d.weightLbs,
          d.gauge,
          d.material,
        ]),
        [''],
        ['TOTALS', '', '', takeoff.summary.totalDuctLengthFt, takeoff.summary.totalDuctAreaSqFt, takeoff.summary.totalDuctWeightLbs, '', ''],
      ];
      const ductSheet = XLSX.utils.aoa_to_sheet(ductData);
      XLSX.utils.book_append_sheet(workbook, ductSheet, 'Duct Schedule');
    }
    
    // Pipe Schedule Sheet
    if (takeoff.pipeMaterials.length > 0) {
      const pipeData = [
        ['Segment', 'Nominal Size', 'Length (ft)', 'Material', 'Schedule', 'Weight/ft (lb)', 'Total Weight (lb)'],
        ...takeoff.pipeMaterials.map(p => [
          p.segmentName,
          p.nominalSize,
          p.lengthFt,
          p.material,
          p.schedule,
          p.weightLbsPerFt,
          p.totalWeightLbs,
        ]),
        [''],
        ['TOTALS', '', takeoff.summary.totalPipeLengthFt, '', '', '', takeoff.summary.totalPipeWeightLbs],
      ];
      const pipeSheet = XLSX.utils.aoa_to_sheet(pipeData);
      XLSX.utils.book_append_sheet(workbook, pipeSheet, 'Pipe Schedule');
    }
    
    // Fittings Sheet
    const allFittings = [...takeoff.ductFittings, ...takeoff.pipeFittings];
    if (allFittings.length > 0) {
      const fittingsData = [
        ['Fitting Type', 'Code', 'Size', 'Quantity'],
        ...allFittings.map(f => [
          f.fittingType,
          f.fittingCode,
          f.size,
          f.quantity,
        ]),
      ];
      const fittingsSheet = XLSX.utils.aoa_to_sheet(fittingsData);
      XLSX.utils.book_append_sheet(workbook, fittingsSheet, 'Fittings');
    }
    
    // Insulation Sheet
    if (takeoff.insulation.length > 0) {
      const insulationData = [
        ['Segment', 'Application', 'Material', 'Thickness (mm)', 'Area (m²)', 'Cost/m² (SAR)', 'Est. Cost (SAR)'],
        ...takeoff.insulation.map(i => [
          i.segmentName,
          i.application,
          i.insulationType,
          i.thicknessMm,
          i.surfaceAreaSqM,
          i.costPerM2,
          i.surfaceAreaSqM * i.costPerM2,
        ]),
        [''],
        ['TOTALS', '', '', '', takeoff.summary.totalInsulationAreaSqM, '', takeoff.summary.totalInsulationCostSAR],
      ];
      const insulationSheet = XLSX.utils.aoa_to_sheet(insulationData);
      XLSX.utils.book_append_sheet(workbook, insulationSheet, 'Insulation');
    }
    
    // Diffusers & Grilles Sheet
    if (takeoff.diffusersGrilles.length > 0) {
      const diffuserData = [
        ['Type', 'Model', 'Neck Size', 'CFM', 'Quantity'],
        ...takeoff.diffusersGrilles.map(d => [
          d.type,
          d.model,
          d.neckSize,
          d.cfm,
          d.quantity,
        ]),
        [''],
        ['TOTAL', '', '', '', takeoff.summary.totalDiffusers],
      ];
      const diffuserSheet = XLSX.utils.aoa_to_sheet(diffuserData);
      XLSX.utils.book_append_sheet(workbook, diffuserSheet, 'Diffusers & Grilles');
    }
    
    // Save
    const filename = `Material_Takeoff_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, []);
  
  return { exportToPDF, exportToExcel };
}
