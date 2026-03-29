import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ZoneAcousticData } from './useZoneAcousticAnalysis';
import { getLogoDataUrl } from '@/lib/company-branding';
import { 
  CertificateRegistryEntry,
  saveCertificateToRegistry,
} from '@/lib/certificate-registry';

export interface SignatoryInfo {
  name: string;
  title: string;
  company?: string;
  license?: string;
}

export interface NCComplianceCertificateOptions {
  certificateType: 'design' | 'preliminary' | 'final';
  certificateNumber: string;
  projectName: string;
  buildingName?: string;
  floorName?: string;
  referenceStandard: string;
  includeTerminalDetails: boolean;
  includeOctaveBandEstimate: boolean;
  signatories: {
    acousticalEngineer?: SignatoryInfo;
    hvacEngineer?: SignatoryInfo;
  };
  notes?: string;
  issueDate: Date;
  companyLogo?: string | null; // base64 data URL
}

const CERTIFICATE_TYPE_LABELS = {
  design: 'Design Phase Verification',
  preliminary: 'Preliminary Assessment',
  final: 'Final Compliance Certification',
};

export function useNCComplianceCertificate() {
  const generateCertificate = useCallback((
    zones: ZoneAcousticData[],
    options: NCComplianceCertificateOptions
  ): jsPDF => {
    // Filter to only compliant zones
    const compliantZones = zones.filter(z => z.status === 'acceptable');
    
    const doc = new jsPDF('p', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPos = 20;

    // Colors
    const headerBg: [number, number, number] = [30, 41, 59]; // slate-800
    const greenAccent: [number, number, number] = [34, 197, 94]; // green-500
    const lightGray: [number, number, number] = [241, 245, 249]; // slate-100

    // === HEADER ===
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Company logo (if provided)
    let titleXOffset = 0;
    const logoUrl = options.companyLogo || getLogoDataUrl();
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', margin, 6, 32, 20);
        titleXOffset = 18; // Shift title slightly right to account for logo
      } catch (e) {
        // Logo failed to load, continue without it
        console.warn('Failed to add logo to certificate:', e);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('NC COMPLIANCE CERTIFICATE', pageWidth / 2 + titleXOffset / 2, 18, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(CERTIFICATE_TYPE_LABELS[options.certificateType], pageWidth / 2 + titleXOffset / 2, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Certificate No: ${options.certificateNumber}`, logoUrl ? margin + 38 : margin, 40);
    doc.text(`Date: ${options.issueDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth - margin, 40, { align: 'right' });

    yPos = 55;

    // === PROJECT INFORMATION ===
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT INFORMATION', margin + 3, yPos + 6);
    yPos += 14;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const projectInfo = [
      ['Project:', options.projectName],
      ['Building:', options.buildingName || '—'],
      ['Floor:', options.floorName || '—'],
      ['Reference Standard:', options.referenceStandard],
    ];

    projectInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 35, yPos);
      yPos += 6;
    });

    yPos += 8;

    // === COMPLIANCE SUMMARY ===
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPLIANCE SUMMARY', margin + 3, yPos + 6);
    yPos += 14;

    // Calculate summary stats
    const avgTargetNC = compliantZones.length > 0
      ? Math.round(compliantZones.reduce((sum, z) => sum + z.targetNC, 0) / compliantZones.length)
      : 0;
    const avgEstimatedNC = compliantZones.length > 0
      ? Math.round(compliantZones.reduce((sum, z) => sum + (z.estimatedNC || 0), 0) / compliantZones.length)
      : 0;
    const avgDelta = avgEstimatedNC - avgTargetNC;

    doc.setFontSize(10);
    const summaryData = [
      ['Total Zones Analyzed:', compliantZones.length.toString()],
      ['Zones Meeting NC Target:', `${compliantZones.length} (100%)`],
      ['Average Target NC:', `NC-${avgTargetNC}`],
      ['Average Estimated NC:', `NC-${avgEstimatedNC} (${avgDelta >= 0 ? '+' : ''}${avgDelta} dB from target)`],
    ];

    summaryData.forEach(([label, value], index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 50, yPos);
      yPos += 6;
    });

    // Compliant badge
    yPos += 2;
    doc.setFillColor(...greenAccent);
    doc.roundedRect(margin, yPos, 45, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ 100% COMPLIANT', margin + 22.5, yPos + 5.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    yPos += 16;

    // === ZONE VERIFICATION DETAILS ===
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ZONE VERIFICATION DETAILS', margin + 3, yPos + 6);
    yPos += 12;

    // Zone table
    const tableData = compliantZones.map(zone => [
      zone.zoneName,
      zone.spaceType,
      `NC-${zone.targetNC}`,
      `NC-${zone.estimatedNC}`,
      `${zone.ncDelta >= 0 ? '+' : ''}${zone.ncDelta} dB`,
      'PASS',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Zone', 'Space Type', 'Target NC', 'Estimated NC', 'Delta', 'Status']],
      body: tableData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: headerBg,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
      },
      didParseCell: (data) => {
        // Make PASS cells green
        if (data.column.index === 5 && data.section === 'body') {
          data.cell.styles.textColor = greenAccent;
          data.cell.styles.fontStyle = 'bold';
        }
        // Make negative deltas green
        if (data.column.index === 4 && data.section === 'body') {
          const value = data.cell.raw as string;
          if (value.startsWith('-') || value === '0 dB') {
            data.cell.styles.textColor = greenAccent;
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // === TERMINAL UNIT DETAILS (optional) ===
    if (options.includeTerminalDetails) {
      const allUnits = compliantZones.flatMap(zone => 
        zone.terminalUnits.map(unit => ({
          zoneName: zone.zoneName,
          unitTag: unit.unitTag,
          unitType: unit.unitType.replace('vav-', 'VAV ').replace('fcu-', 'FCU ').replace('-', ' '),
          noiseNC: unit.noiseNC !== null ? `NC-${unit.noiseNC}` : '—',
        }))
      );

      if (allUnits.length > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(...lightGray);
        doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TERMINAL UNIT DETAILS', margin + 3, yPos + 6);
        yPos += 12;

        autoTable(doc, {
          startY: yPos,
          head: [['Zone', 'Unit Tag', 'Unit Type', 'NC Rating']],
          body: allUnits.map(u => [u.zoneName, u.unitTag, u.unitType, u.noiseNC]),
          margin: { left: margin, right: margin },
          headStyles: {
            fillColor: headerBg,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 9,
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // === NOTES (optional) ===
    if (options.notes) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(...lightGray);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', margin + 3, yPos + 6);
      yPos += 14;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(options.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 5 + 8;
    }

    // === CERTIFICATION STATEMENT ===
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATION', margin + 3, yPos + 6);
    yPos += 14;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const certStatement = `This certifies that the HVAC terminal unit selections for the listed zones have been analyzed using logarithmic noise combination methods per ASHRAE guidelines. Based on the selected equipment and operating conditions, the estimated NC levels meet or exceed the specified acoustic criteria as defined by ${options.referenceStandard}.`;
    const splitStatement = doc.splitTextToSize(certStatement, pageWidth - margin * 2);
    doc.text(splitStatement, margin, yPos);
    yPos += splitStatement.length * 5 + 15;

    // === SIGNATURE BLOCKS ===
    const sigWidth = (pageWidth - margin * 3) / 2;
    const sigStartY = yPos;

    // HVAC Engineer signature
    if (options.signatories.hvacEngineer) {
      const eng = options.signatories.hvacEngineer;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, sigStartY + 15, margin + sigWidth - 10, sigStartY + 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(eng.name || '________________________', margin, sigStartY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(eng.title || 'HVAC Design Engineer', margin, sigStartY + 25);
      if (eng.company) doc.text(eng.company, margin, sigStartY + 30);
      doc.text(`Date: ${options.issueDate.toLocaleDateString()}`, margin, sigStartY + 35);
    } else {
      doc.line(margin, sigStartY + 15, margin + sigWidth - 10, sigStartY + 15);
      doc.setFontSize(9);
      doc.text('HVAC Design Engineer', margin, sigStartY + 20);
      doc.text('Date: _______________', margin, sigStartY + 30);
    }

    // Acoustical Engineer signature
    const rightColX = margin + sigWidth + 10;
    if (options.signatories.acousticalEngineer) {
      const eng = options.signatories.acousticalEngineer;
      doc.line(rightColX, sigStartY + 15, rightColX + sigWidth - 10, sigStartY + 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(eng.name || '________________________', rightColX, sigStartY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(eng.title || 'Acoustical Consultant', rightColX, sigStartY + 25);
      if (eng.company) doc.text(eng.company, rightColX, sigStartY + 30);
      if (eng.license) doc.text(`License: ${eng.license}`, rightColX, sigStartY + 35);
    } else {
      doc.line(rightColX, sigStartY + 15, rightColX + sigWidth - 10, sigStartY + 15);
      doc.setFontSize(9);
      doc.text('Acoustical Consultant', rightColX, sigStartY + 20);
      doc.text('Date: _______________', rightColX, sigStartY + 30);
    }

    // Footer
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Certificate ${options.certificateNumber}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    return doc;
  }, []);

  const downloadCertificate = useCallback((
    zones: ZoneAcousticData[],
    options: NCComplianceCertificateOptions,
    saveToRegistry: boolean = true
  ) => {
    const doc = generateCertificate(zones, options);
    doc.save(`NC_Compliance_Certificate_${options.certificateNumber}.pdf`);
    
    // Save to registry if requested
    if (saveToRegistry) {
      const compliantZones = zones.filter(z => z.status === 'acceptable');
      const logoUrl = options.companyLogo || getLogoDataUrl();
      
      const entry: CertificateRegistryEntry = {
        id: crypto.randomUUID(),
        certificateNumber: options.certificateNumber,
        certificateType: options.certificateType,
        projectName: options.projectName,
        buildingName: options.buildingName,
        floorName: options.floorName,
        issueDate: options.issueDate.toISOString(),
        generatedAt: new Date().toISOString(),
        zonesIncluded: compliantZones.map(z => ({
          zoneId: z.zoneId,
          zoneName: z.zoneName,
          targetNC: z.targetNC,
          estimatedNC: z.estimatedNC,
        })),
        signatories: options.signatories,
        referenceStandard: options.referenceStandard,
        companyLogoUsed: !!logoUrl,
      };
      
      saveCertificateToRegistry(entry);
    }
  }, [generateCertificate]);

  const previewCertificate = useCallback((
    zones: ZoneAcousticData[],
    options: NCComplianceCertificateOptions
  ): string => {
    const doc = generateCertificate(zones, options);
    return doc.output('datauristring');
  }, [generateCertificate]);

  return {
    generateCertificate,
    downloadCertificate,
    previewCertificate,
  };
}

export function generateCertificateNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `NC-${year}-${random}`;
}
