import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type CommissioningProject = Tables<'commissioning_projects'>;
type CommissioningChecklist = Tables<'commissioning_checklists'>;

export interface AcousticCertificateSignatory {
  name: string;
  title: string;
  date: string;
  company?: string;
  license?: string;
}

export interface AcousticCertificateOptions {
  certificateType: 'preliminary' | 'final' | 'conditional';
  certificateNumber: string;
  includeSections: {
    zoneComplianceSummary: boolean;
    measurementDetails: boolean;
    terminalUnitBreakdown: boolean;
    photoDocumentation: boolean;
    octaveBandData: boolean;
    remediationHistory: boolean;
  };
  maxPhotosPerZone: number;
  signatories: {
    acousticalEngineer: AcousticCertificateSignatory;
    commissioningAgent: AcousticCertificateSignatory;
    owner?: AcousticCertificateSignatory;
  };
  conditions: string[];
  referenceStandard: string;
}

interface AcousticDesignData {
  zone_id?: string;
  zone_name?: string;
  floor_name?: string;
  space_type?: string;
  target_nc?: number;
  estimated_nc?: number | null;
  terminal_units?: {
    unit_tag: string;
    unit_type: string;
    design_nc: number | null;
  }[];
}

interface AcousticInstalledData {
  measured_nc?: number;
  measurement_date?: string;
  measurement_positions?: {
    position: string;
    nc_reading: number;
  }[];
  ambient_conditions?: {
    hvac_mode?: string;
    occupancy?: string;
    background_nc?: number;
  };
  technician_notes?: string;
  equipment_used?: string;
  photos?: string[];
}

interface ZoneVerificationResult {
  zoneName: string;
  spaceType: string;
  floorName: string;
  targetNC: number;
  estimatedNC: number | null;
  measuredNC: number | null;
  delta: number | null;
  status: 'pass' | 'marginal' | 'fail' | 'pending';
  measurementDate: string | null;
  positions: { position: string; nc_reading: number }[];
  terminalUnits: { unit_tag: string; unit_type: string; design_nc: number | null }[];
}

interface PhotoData {
  url: string;
  base64: string;
  zoneName: string;
  description?: string;
}

export function useAcousticCommissioningCertificate() {
  const getCertificateTypeLabel = (type: string): string => {
    switch (type) {
      case 'preliminary':
        return 'PRELIMINARY ACOUSTIC COMMISSIONING CERTIFICATE';
      case 'final':
        return 'FINAL ACOUSTIC COMMISSIONING CERTIFICATE';
      case 'conditional':
        return 'CONDITIONAL ACOUSTIC COMMISSIONING CERTIFICATE';
      default:
        return 'ACOUSTIC COMMISSIONING CERTIFICATE';
    }
  };

  const getStatusColor = (status: string): [number, number, number] => {
    switch (status) {
      case 'pass':
        return [34, 197, 94]; // green
      case 'marginal':
        return [234, 179, 8]; // yellow
      case 'fail':
        return [239, 68, 68]; // red
      default:
        return [100, 100, 100]; // gray
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pass': return 'PASS';
      case 'marginal': return 'MARGINAL';
      case 'fail': return 'FAIL';
      default: return 'PENDING';
    }
  };

  const processChecklists = (checklists: CommissioningChecklist[]): ZoneVerificationResult[] => {
    return checklists
      .filter(c => {
        const designData = c.design_data as AcousticDesignData | null;
        return designData?.target_nc !== undefined;
      })
      .map(c => {
        const designData = c.design_data as AcousticDesignData | null;
        const installedData = c.installed_data as AcousticInstalledData | null;
        
        const targetNC = designData?.target_nc ?? 40;
        const measuredNC = installedData?.measured_nc ?? null;
        const delta = measuredNC !== null ? measuredNC - targetNC : null;
        
        let status: 'pass' | 'marginal' | 'fail' | 'pending' = 'pending';
        if (delta !== null) {
          if (delta <= 0) status = 'pass';
          else if (delta <= 5) status = 'marginal';
          else status = 'fail';
        }

        return {
          zoneName: designData?.zone_name || c.equipment_tag || 'Unknown Zone',
          spaceType: designData?.space_type || 'Office',
          floorName: designData?.floor_name || '',
          targetNC,
          estimatedNC: designData?.estimated_nc ?? null,
          measuredNC,
          delta,
          status,
          measurementDate: installedData?.measurement_date || null,
          positions: installedData?.measurement_positions || [],
          terminalUnits: designData?.terminal_units || [],
        };
      });
  };

  const fetchPhotosAsBase64 = async (
    checklists: CommissioningChecklist[],
    maxPhotosPerZone: number
  ): Promise<PhotoData[]> => {
    const photos: PhotoData[] = [];

    for (const checklist of checklists) {
      const designData = checklist.design_data as AcousticDesignData | null;
      const installedData = checklist.installed_data as AcousticInstalledData | null;
      const zoneName = designData?.zone_name || checklist.equipment_tag || 'Unknown';
      const zonePhotos = installedData?.photos || [];
      const photosToInclude = zonePhotos.slice(0, maxPhotosPerZone);

      for (const url of photosToInclude) {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          photos.push({ url, base64, zoneName });
        } catch (error) {
          console.error('Error fetching photo:', error);
        }
      }
    }

    return photos;
  };

  const generateCertificate = async (
    project: CommissioningProject,
    checklists: CommissioningChecklist[],
    options: AcousticCertificateOptions
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    const zones = processChecklists(checklists);
    
    // Fetch photos if needed
    let photos: PhotoData[] = [];
    if (options.includeSections.photoDocumentation) {
      photos = await fetchPhotosAsBase64(checklists, options.maxPhotosPerZone);
    }

    // Statistics
    const stats = {
      total: zones.length,
      pass: zones.filter(z => z.status === 'pass').length,
      marginal: zones.filter(z => z.status === 'marginal').length,
      fail: zones.filter(z => z.status === 'fail').length,
      pending: zones.filter(z => z.status === 'pending').length,
    };
    const completed = stats.pass + stats.marginal + stats.fail;
    const passRate = completed > 0 ? Math.round((stats.pass / completed) * 100) : 0;

    const checkPageBreak = (requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    // ============ HEADER ============
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ACOUSTIC COMMISSIONING', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('NC COMPLIANCE CERTIFICATE', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(getCertificateTypeLabel(options.certificateType), pageWidth / 2, 42, { align: 'center' });

    currentY = 60;

    // Certificate info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Certificate No: ${options.certificateNumber}`, 14, currentY);
    doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, pageWidth - 14, currentY, { align: 'right' });
    
    currentY += 15;

    // ============ PROJECT INFORMATION ============
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT INFORMATION', 18, currentY);
    currentY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const projectInfo = [
      ['Project:', project.name],
      ['Building:', project.building_id ? 'Building ID: ' + project.building_id : '-'],
      ['Verification Date:', format(new Date(), 'MMM d, yyyy')],
      ['Reference Standard:', options.referenceStandard || 'ASHRAE Handbook / Saudi Building Code'],
    ];

    projectInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 18, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 60, currentY);
      currentY += 6;
    });

    currentY += 10;

    // ============ COMPLIANCE SUMMARY ============
    if (options.includeSections.zoneComplianceSummary) {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPLIANCE SUMMARY', 18, currentY);
      currentY += 12;

      // Summary stats
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Total Zones Verified: ${stats.total}`, 18, currentY);
      currentY += 6;
      
      // Pass
      doc.setTextColor(...getStatusColor('pass'));
      doc.text(`✓ Compliant: ${stats.pass} (${stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0}%)`, 18, currentY);
      currentY += 5;
      
      // Marginal
      doc.setTextColor(...getStatusColor('marginal'));
      doc.text(`⚠ Marginal (within 5dB): ${stats.marginal} (${stats.total > 0 ? Math.round((stats.marginal / stats.total) * 100) : 0}%)`, 18, currentY);
      currentY += 5;
      
      // Fail
      doc.setTextColor(...getStatusColor('fail'));
      doc.text(`✗ Non-Compliant: ${stats.fail} (${stats.total > 0 ? Math.round((stats.fail / stats.total) * 100) : 0}%)`, 18, currentY);
      currentY += 5;
      
      // Pending
      doc.setTextColor(100, 100, 100);
      doc.text(`○ Pending: ${stats.pending}`, 18, currentY);
      
      doc.setTextColor(0, 0, 0);
      currentY += 12;

      // Overall Pass Rate
      doc.setFont('helvetica', 'bold');
      doc.text(`Overall Pass Rate: ${passRate}%`, 18, currentY);
      currentY += 15;
    }

    // ============ ZONE VERIFICATION DETAILS ============
    checkPageBreak(60);
    
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ZONE VERIFICATION DETAILS', 18, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [['Zone', 'Type', 'Target', 'Measured', 'Delta', 'Status']],
      body: zones.map(z => [
        z.zoneName.length > 20 ? z.zoneName.substring(0, 17) + '...' : z.zoneName,
        z.spaceType,
        `NC-${z.targetNC}`,
        z.measuredNC !== null ? `NC-${z.measuredNC}` : '-',
        z.delta !== null ? (z.delta > 0 ? `+${z.delta}` : `${z.delta}`) + ' dB' : '-',
        getStatusLabel(z.status),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const status = String(data.cell.raw).toLowerCase();
          const statusMap: Record<string, string> = { 'pass': 'pass', 'marginal': 'marginal', 'fail': 'fail' };
          const mappedStatus = statusMap[status] || 'pending';
          const [r, g, b] = getStatusColor(mappedStatus);
          data.cell.styles.textColor = [r, g, b];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // ============ MEASUREMENT DETAILS ============
    if (options.includeSections.measurementDetails) {
      const zonesWithDetails = zones.filter(z => z.positions.length > 0);
      
      if (zonesWithDetails.length > 0) {
        checkPageBreak(50);
        
        doc.setFillColor(241, 245, 249);
        doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MEASUREMENT POSITION DETAILS', 18, currentY);
        currentY += 12;

        for (const zone of zonesWithDetails.slice(0, 5)) { // Limit to 5 zones for space
          checkPageBreak(30);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${zone.zoneName} (Target NC-${zone.targetNC})`, 18, currentY);
          currentY += 6;

          doc.setFont('helvetica', 'normal');
          zone.positions.forEach(pos => {
            doc.text(`  • ${pos.position}: NC-${pos.nc_reading}`, 22, currentY);
            currentY += 5;
          });
          currentY += 5;
        }
      }
    }

    // ============ PHOTO DOCUMENTATION ============
    if (options.includeSections.photoDocumentation && photos.length > 0) {
      checkPageBreak(80);

      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`PHOTO DOCUMENTATION (${photos.length} photos)`, 18, currentY);
      currentY += 15;

      const photosPerRow = 3;
      const photoWidth = (pageWidth - 28 - (photosPerRow - 1) * 5) / photosPerRow;
      const photoHeight = photoWidth * 0.75;
      const captionHeight = 10;

      let photoX = 14;
      let photoIndex = 0;

      for (const photo of photos) {
        if (photoIndex > 0 && photoIndex % photosPerRow === 0) {
          currentY += photoHeight + captionHeight + 8;
          photoX = 14;
          checkPageBreak(photoHeight + captionHeight + 10);
        }

        try {
          doc.addImage(photo.base64, 'JPEG', photoX, currentY, photoWidth, photoHeight, undefined, 'MEDIUM');
          
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          const caption = photo.zoneName.length > 18 ? photo.zoneName.substring(0, 15) + '...' : photo.zoneName;
          doc.text(caption, photoX + photoWidth / 2, currentY + photoHeight + 4, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        } catch (error) {
          console.error('Error adding photo:', error);
        }

        photoX += photoWidth + 5;
        photoIndex++;
      }

      currentY += photoHeight + captionHeight + 15;
    }

    // ============ CONDITIONS (for conditional certificates) ============
    if (options.certificateType === 'conditional' && options.conditions.length > 0) {
      checkPageBreak(40 + options.conditions.length * 8);

      doc.setFillColor(254, 243, 199);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7);
      doc.text('CONDITIONS / EXCEPTIONS', 18, currentY);
      currentY += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      options.conditions.forEach((condition, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${condition}`, pageWidth - 40);
        doc.text(lines, 18, currentY);
        currentY += lines.length * 5 + 3;
      });

      currentY += 10;
    }

    // ============ CERTIFICATION STATEMENT ============
    checkPageBreak(90);

    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CERTIFICATION', 18, currentY);
    currentY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const certificationText = options.certificateType === 'conditional'
      ? 'This certifies that acoustic verification of the HVAC systems has been performed in accordance with project specifications and applicable noise criteria standards, subject to the conditions listed above. The zones listed have been verified for NC compliance with the noted results.'
      : 'This certifies that acoustic verification of the HVAC systems has been performed in accordance with project specifications and applicable noise criteria standards. The zones listed have been verified for NC compliance with the noted results.';
    
    const splitText = doc.splitTextToSize(certificationText, pageWidth - 36);
    doc.text(splitText, 18, currentY);
    currentY += splitText.length * 5 + 15;

    // ============ SIGNATURE BLOCKS ============
    const drawSignatureBlock = (signatory: AcousticCertificateSignatory, label: string, x: number, y: number) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, y);
      
      doc.setFont('helvetica', 'normal');
      y += 15;
      
      doc.setDrawColor(100, 100, 100);
      doc.line(x, y, x + 75, y);
      y += 5;
      
      if (signatory.name) {
        doc.text(`Name: ${signatory.name}`, x, y);
        y += 5;
      }
      if (signatory.title) {
        doc.text(`Title: ${signatory.title}`, x, y);
        y += 5;
      }
      if (signatory.company) {
        doc.text(`Company: ${signatory.company}`, x, y);
        y += 5;
      }
      if (signatory.license) {
        doc.text(`License: ${signatory.license}`, x, y);
        y += 5;
      }
      if (signatory.date) {
        doc.text(`Date: ${signatory.date}`, x, y);
      }
    };

    checkPageBreak(60);
    
    drawSignatureBlock(options.signatories.acousticalEngineer, 'Acoustical Engineer', 14, currentY);
    drawSignatureBlock(options.signatories.commissioningAgent, 'Commissioning Agent', pageWidth / 2 + 5, currentY);

    if (options.signatories.owner) {
      currentY += 50;
      checkPageBreak(50);
      drawSignatureBlock(options.signatories.owner, 'Owner Representative', 14, currentY);
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages} | Certificate No: ${options.certificateNumber} | Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    return doc;
  };

  const downloadCertificate = async (
    project: CommissioningProject,
    checklists: CommissioningChecklist[],
    options: AcousticCertificateOptions
  ) => {
    const doc = await generateCertificate(project, checklists, options);
    const filename = `acoustic-certificate-${options.certificateNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
    return filename;
  };

  const previewCertificate = async (
    project: CommissioningProject,
    checklists: CommissioningChecklist[],
    options: AcousticCertificateOptions
  ): Promise<string> => {
    const doc = await generateCertificate(project, checklists, options);
    return doc.output('bloburl').toString();
  };

  return {
    generateCertificate,
    downloadCertificate,
    previewCertificate,
  };
}
