// Hook for exporting Noise Path Analysis to PDF
import { useCallback, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NoisePath, getPathRecommendations } from '@/lib/noise-path-calculations';
import { OCTAVE_BAND_FREQUENCIES } from '@/lib/nc-reference-curves';

export interface NoisePathExportOptions {
  includeOctaveBands?: boolean;
  includeDiagram?: boolean;
  includeRecommendations?: boolean;
  projectName?: string;
  preparedBy?: string;
  recommendations?: string[];
}

export function useNoisePathExport() {
  const [isExporting, setIsExporting] = useState(false);
  const exportToPDF = useCallback(async (
    path: NoisePath,
    options: NoisePathExportOptions = {}
  ) => {
    setIsExporting(true);
    try {
      const {
        includeOctaveBands = true,
        includeRecommendations = true,
        projectName = 'HVAC Project',
        preparedBy = 'Design Engineer',
        recommendations: passedRecommendations,
      } = options;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // ==================== Cover/Header Section ====================
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('Noise Path Analysis Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Project info
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Project: ${projectName}`, 20, yPos);
    yPos += 7;
    doc.text(`Prepared By: ${preparedBy}`, 20, yPos);
    yPos += 7;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 12;

    // Horizontal line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // ==================== Executive Summary ====================
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Executive Summary', 20, yPos);
    yPos += 10;

    // Compliance status box
    const isCompliant = path.isCompliant;
    const boxColor: [number, number, number] = isCompliant ? [34, 139, 34] : [220, 53, 69];
    doc.setFillColor(...boxColor);
    doc.roundedRect(20, yPos, 80, 25, 3, 3, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT', 60, yPos + 10, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`NC-${Math.round(path.finalNC)} at receiver`, 60, yPos + 19, { align: 'center' });
    
    // Summary stats
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    const statsX = 115;
    doc.text(`Source: ${path.sourceEquipment}`, statsX, yPos + 5);
    doc.text(`Destination: ${path.destinationZone}`, statsX, yPos + 12);
    doc.text(`Target: NC-${path.targetNC}`, statsX, yPos + 19);
    doc.text(`Total Attenuation: ${path.totalAttenuation} dB`, statsX, yPos + 26);
    
    yPos += 35;

    // ==================== Path Summary ====================
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Path Summary', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Source NC: NC-${Math.round(path.sourceNC)}`, 25, yPos);
    doc.text(`Final NC: NC-${Math.round(path.finalNC)}`, 80, yPos);
    doc.text(`Margin: ${path.complianceMargin.toFixed(1)} dB`, 135, yPos);
    yPos += 10;

    // ==================== Path Elements Table ====================
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Transmission Path Elements', 20, yPos);
    yPos += 5;

    const elementsData = path.elements.map((el, idx) => {
      // Calculate overall output level (simplified)
      const outputLevel = Object.values(el.outputLevel).reduce((sum, v) => sum + v, 0) / 8;
      const inputLevel = Object.values(el.inputLevel).reduce((sum, v) => sum + v, 0) / 8;
      const attenuation = (inputLevel - outputLevel).toFixed(1);
      
      return [
        (idx + 1).toString(),
        el.name,
        el.type.replace(/_/g, ' ').toUpperCase(),
        `${inputLevel.toFixed(0)} dB`,
        `${attenuation} dB`,
        `${outputLevel.toFixed(0)} dB`,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Element', 'Type', 'Input Level', 'Attenuation', 'Output Level']],
      body: elementsData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: 255,
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250],
      },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // ==================== Octave Band Data ====================
    if (includeOctaveBands && path.elements.length > 0) {
      // Check if we need a new page
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102);
      doc.text('Octave Band Analysis', 20, yPos);
      yPos += 5;

      const lastElement = path.elements[path.elements.length - 1];
      const firstElement = path.elements[0];

      const octaveData = OCTAVE_BAND_FREQUENCIES.map(freq => [
        freq,
        firstElement.inputLevel[freq].toFixed(0),
        lastElement.outputLevel[freq].toFixed(0),
        (firstElement.inputLevel[freq] - lastElement.outputLevel[freq]).toFixed(0),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Frequency', 'Source (dB)', 'At Receiver (dB)', 'Total Atten. (dB)']],
        body: octaveData,
        theme: 'striped',
        headStyles: {
          fillColor: [0, 102, 153],
          textColor: 255,
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center',
        },
        margin: { left: 40, right: 40 },
        tableWidth: 'auto',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // ==================== Attenuation Diagram (Simple Text Version) ====================
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Path Attenuation Diagram', 20, yPos);
    yPos += 10;

    // Draw simple bar chart representation
    const diagramWidth = pageWidth - 40;
    const sourceLevel = path.sourceNC;
    const targetLevel = path.targetNC;
    const maxLevel = Math.max(sourceLevel, 70);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    // Draw scale
    for (let nc = 20; nc <= 70; nc += 10) {
      const x = 20 + ((nc - 20) / (maxLevel - 20)) * diagramWidth;
      doc.text(`NC-${nc}`, x, yPos + 3, { align: 'center' });
    }
    yPos += 8;
    
    // Source bar
    const sourceWidth = ((sourceLevel - 20) / (maxLevel - 20)) * diagramWidth;
    doc.setFillColor(220, 53, 69);
    doc.rect(20, yPos, sourceWidth, 8, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(`Source: NC-${Math.round(sourceLevel)}`, 20 + sourceWidth + 5, yPos + 6);
    yPos += 12;
    
    // Final bar
    const finalWidth = ((path.finalNC - 20) / (maxLevel - 20)) * diagramWidth;
    doc.setFillColor(isCompliant ? 34 : 220, isCompliant ? 139 : 53, isCompliant ? 34 : 69);
    doc.rect(20, yPos, finalWidth, 8, 'F');
    doc.text(`Final: NC-${Math.round(path.finalNC)}`, 20 + finalWidth + 5, yPos + 6);
    yPos += 12;
    
    // Target line
    const targetX = 20 + ((targetLevel - 20) / (maxLevel - 20)) * diagramWidth;
    doc.setDrawColor(0, 100, 200);
    doc.setLineWidth(1);
    doc.line(targetX, yPos - 28, targetX, yPos);
    doc.setFontSize(8);
    doc.setTextColor(0, 100, 200);
    doc.text(`Target NC-${targetLevel}`, targetX, yPos + 5, { align: 'center' });
    yPos += 15;

    // ==================== Recommendations ====================
    if (includeRecommendations) {
      const recommendations = passedRecommendations || getPathRecommendations(path);
      
      if (recommendations.length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text('Recommendations', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        
        recommendations.forEach((rec, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${idx + 1}. ${rec}`, 25, yPos);
          yPos += 6;
        });
      }
    }

    // ==================== Footer ====================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | Generated by HVAC Design Tools`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const filename = `Noise_Path_Analysis_${path.sourceEquipment.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    return filename;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToPDF, isExporting };
}
