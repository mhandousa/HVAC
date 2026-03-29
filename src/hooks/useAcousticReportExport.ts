// Comprehensive Acoustic Report Generator
// Combines Room Acoustics, Noise Path, and NC Compliance data into PDF report

import { useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ZoneAcousticData, FloorAcousticSummary } from './useZoneAcousticAnalysis';
import { RoomAcousticsResult } from '@/lib/room-acoustics-calculations';
import { NoisePath } from '@/lib/noise-path-calculations';
import { OctaveBandData, OCTAVE_BAND_FREQUENCIES } from '@/lib/nc-reference-curves';

export interface AcousticReportData {
  projectName: string;
  preparedBy: string;
  date: string;
  
  // Room Acoustics data (optional)
  roomAcoustics?: {
    roomName: string;
    result: RoomAcousticsResult;
  };
  
  // Noise Path data (optional)
  noisePath?: {
    path: NoisePath;
    targetNC: number;
  };
  
  // NC Compliance data (optional)
  ncCompliance?: {
    zones: ZoneAcousticData[];
    summary: FloorAcousticSummary;
  };
  
  // Include section flags
  includeSections: {
    executiveSummary: boolean;
    roomAcoustics: boolean;
    noisePath: boolean;
    ncCompliance: boolean;
    recommendations: boolean;
  };
}

export interface UseAcousticReportExportReturn {
  generateReport: (data: AcousticReportData) => Promise<void>;
  isGenerating: boolean;
  progress: number;
}

export function useAcousticReportExport(): UseAcousticReportExportReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateReport = useCallback(async (data: AcousticReportData) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Helper functions
      const addPageIfNeeded = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      const drawSectionHeader = (title: string) => {
        addPageIfNeeded(20);
        doc.setFontSize(14);
        doc.setTextColor(30, 64, 175); // Primary blue
        doc.text(title, margin, yPos);
        yPos += 3;
        doc.setDrawColor(30, 64, 175);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      };

      // ====== COVER PAGE ======
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Acoustic Analysis Report', margin, 35);
      
      doc.setFontSize(12);
      doc.text(data.projectName, margin, 48);
      
      doc.setTextColor(0, 0, 0);
      yPos = 80;
      
      doc.setFontSize(11);
      doc.text(`Prepared by: ${data.preparedBy}`, margin, yPos);
      yPos += 8;
      doc.text(`Date: ${data.date}`, margin, yPos);
      yPos += 20;

      // Table of Contents
      doc.setFontSize(12);
      doc.text('Contents', margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      let sectionNum = 1;
      if (data.includeSections.executiveSummary) {
        doc.text(`${sectionNum}. Executive Summary`, margin + 5, yPos);
        yPos += 6;
        sectionNum++;
      }
      if (data.includeSections.roomAcoustics && data.roomAcoustics) {
        doc.text(`${sectionNum}. Room Acoustics Analysis`, margin + 5, yPos);
        yPos += 6;
        sectionNum++;
      }
      if (data.includeSections.noisePath && data.noisePath) {
        doc.text(`${sectionNum}. Noise Path Analysis`, margin + 5, yPos);
        yPos += 6;
        sectionNum++;
      }
      if (data.includeSections.ncCompliance && data.ncCompliance) {
        doc.text(`${sectionNum}. NC Compliance Analysis`, margin + 5, yPos);
        yPos += 6;
        sectionNum++;
      }
      if (data.includeSections.recommendations) {
        doc.text(`${sectionNum}. Recommendations`, margin + 5, yPos);
        yPos += 6;
      }

      setProgress(10);

      // ====== EXECUTIVE SUMMARY ======
      if (data.includeSections.executiveSummary) {
        doc.addPage();
        yPos = margin;
        drawSectionHeader('1. Executive Summary');

        // Calculate overall compliance
        let overallStatus = 'Compliant';
        let compliancePercent = 100;
        
        if (data.ncCompliance) {
          const { summary } = data.ncCompliance;
          const compliantZones = summary.zonesAcceptable;
          const totalAnalyzed = summary.totalZones - summary.zonesNoData;
          compliancePercent = totalAnalyzed > 0 ? Math.round((compliantZones / totalAnalyzed) * 100) : 100;
          
          if (summary.zonesExceeding > 0) {
            overallStatus = 'Non-Compliant';
          } else if (summary.zonesMarginal > 0) {
            overallStatus = 'Marginal';
          }
        }

        if (data.roomAcoustics && !data.roomAcoustics.result.isCompliant) {
          overallStatus = 'Non-Compliant';
        }

        // Summary table
        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value', 'Status']],
          body: [
            ['Overall Compliance', `${compliancePercent}%`, overallStatus],
            ...(data.ncCompliance ? [
              ['Zones Analyzed', data.ncCompliance.summary.totalZones.toString(), '-'],
              ['Zones Exceeding NC', data.ncCompliance.summary.zonesExceeding.toString(), data.ncCompliance.summary.zonesExceeding > 0 ? 'Action Required' : 'OK'],
              ['Zones Marginal', data.ncCompliance.summary.zonesMarginal.toString(), data.ncCompliance.summary.zonesMarginal > 0 ? 'Monitor' : 'OK'],
            ] : []),
            ...(data.roomAcoustics ? [
              ['Room NC Rating', `NC-${Math.round(data.roomAcoustics.result.calculatedNC)}`, data.roomAcoustics.result.isCompliant ? 'Compliant' : 'Exceeds Target'],
              ['Room RT60', `${data.roomAcoustics.result.averageRT60.toFixed(2)} s`, '-'],
            ] : []),
          ],
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: margin, right: margin },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      setProgress(30);

      // ====== ROOM ACOUSTICS ======
      if (data.includeSections.roomAcoustics && data.roomAcoustics) {
        doc.addPage();
        yPos = margin;
        drawSectionHeader('2. Room Acoustics Analysis');

        const { result, roomName } = data.roomAcoustics;

        doc.setFontSize(11);
        doc.text(`Room: ${roomName}`, margin, yPos);
        yPos += 10;

        // Room Properties
        autoTable(doc, {
          startY: yPos,
          head: [['Property', 'Value']],
          body: [
            ['Volume', `${result.volume.toFixed(1)} m³`],
            ['Surface Area', `${result.totalSurfaceArea.toFixed(1)} m²`],
            ['Mean Free Path', `${result.meanFreePathLength.toFixed(2)} m`],
            ['Average RT60', `${result.averageRT60.toFixed(2)} s`],
            ['Calculated NC', `NC-${Math.round(result.calculatedNC)}`],
            ['Target NC', `NC-${result.targetNC}`],
            ['Compliance Margin', `${result.complianceMargin >= 0 ? '+' : ''}${result.complianceMargin.toFixed(1)} dB`],
          ],
          theme: 'grid',
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: margin, right: margin },
          columnStyles: { 0: { cellWidth: 60 } },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // SPL at receiver per frequency
        addPageIfNeeded(60);
        doc.setFontSize(11);
        doc.text('Sound Pressure Level at Receiver (dB)', margin, yPos);
        yPos += 5;

        const freqHeaders = ['Parameter', ...OCTAVE_BAND_FREQUENCIES];
        const lpTotalRow = ['Lp Total', ...OCTAVE_BAND_FREQUENCIES.map(f => result.lpTotal[f].toFixed(1))];
        const rt60Row = ['RT60 (s)', ...OCTAVE_BAND_FREQUENCIES.map(f => result.rt60PerBand[f].toFixed(2))];

        autoTable(doc, {
          startY: yPos,
          head: [freqHeaders],
          body: [lpTotalRow, rt60Row],
          theme: 'grid',
          headStyles: { fillColor: [100, 116, 139], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: margin, right: margin },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      setProgress(50);

      // ====== NOISE PATH ======
      if (data.includeSections.noisePath && data.noisePath) {
        doc.addPage();
        yPos = margin;
        drawSectionHeader('3. Noise Path Analysis');

        const { path, targetNC } = data.noisePath;

        doc.setFontSize(11);
        doc.text(`Source NC: NC-${path.sourceNC}`, margin, yPos);
        yPos += 6;
        doc.text(`Target: NC-${targetNC}`, margin, yPos);
        yPos += 6;
        doc.text(`Result: NC-${path.finalNC} (${path.isCompliant ? 'Compliant' : 'Exceeds Target'})`, margin, yPos);
        yPos += 10;

        // Path elements table
        const pathRows = path.elements.map(el => [
          el.name,
          el.type,
          el.outputNC.toString(),
          el.attenuation?.['1kHz']?.toFixed(1) || '-',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Element', 'Type', 'NC After', 'Attenuation (dB)']],
          body: pathRows,
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: margin, right: margin },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      setProgress(70);

      // ====== NC COMPLIANCE ======
      if (data.includeSections.ncCompliance && data.ncCompliance) {
        doc.addPage();
        yPos = margin;
        drawSectionHeader('4. NC Compliance Analysis');

        const { zones, summary } = data.ncCompliance;

        // Summary stats
        doc.setFontSize(11);
        doc.text(`Total Zones: ${summary.totalZones}`, margin, yPos);
        yPos += 6;
        doc.text(`Acceptable: ${summary.zonesAcceptable} | Marginal: ${summary.zonesMarginal} | Exceeding: ${summary.zonesExceeding} | No Data: ${summary.zonesNoData}`, margin, yPos);
        yPos += 10;

        // Zone table
        const zoneRows = zones
          .filter(z => z.estimatedNC !== null)
          .sort((a, b) => b.ncDelta - a.ncDelta)
          .map(z => [
            z.zoneName,
            z.spaceType,
            `NC-${z.targetNC}`,
            z.estimatedNC !== null ? `NC-${z.estimatedNC}` : '-',
            z.ncDelta > 0 ? `+${z.ncDelta}` : z.ncDelta.toString(),
            z.status === 'exceeds' ? 'FAIL' : z.status === 'marginal' ? 'WARN' : 'PASS',
          ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Zone', 'Space Type', 'Target', 'Estimated', 'Delta', 'Status']],
          body: zoneRows,
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: margin, right: margin },
          bodyStyles: { fontSize: 9 },
          didParseCell: (data) => {
            if (data.column.index === 5 && data.section === 'body') {
              const val = data.cell.raw as string;
              if (val === 'FAIL') {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              } else if (val === 'WARN') {
                data.cell.styles.textColor = [234, 179, 8];
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [22, 163, 74];
              }
            }
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      setProgress(85);

      // ====== RECOMMENDATIONS ======
      if (data.includeSections.recommendations) {
        addPageIfNeeded(80);
        drawSectionHeader('5. Recommendations');

        const allRecommendations: string[] = [];

        // Gather recommendations from all sources
        if (data.roomAcoustics?.result.recommendations) {
          allRecommendations.push(...data.roomAcoustics.result.recommendations);
        }

        if (data.ncCompliance?.zones) {
          data.ncCompliance.zones
            .filter(z => z.status === 'exceeds' || z.status === 'marginal')
            .forEach(z => {
              allRecommendations.push(...z.recommendations.slice(0, 2));
            });
        }

        // Add prioritized recommendations
        const uniqueRecs = [...new Set(allRecommendations)].slice(0, 10);

        if (uniqueRecs.length > 0) {
          uniqueRecs.forEach((rec, i) => {
            addPageIfNeeded(10);
            doc.text(`${i + 1}. ${rec}`, margin, yPos, { maxWidth: pageWidth - 2 * margin });
            yPos += 8;
          });
        } else {
          doc.text('No specific recommendations - all acoustic targets are met.', margin, yPos);
        }
      }

      setProgress(95);

      // Save the PDF
      const filename = `Acoustic_Report_${data.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      setProgress(100);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateReport,
    isGenerating,
    progress,
  };
}
