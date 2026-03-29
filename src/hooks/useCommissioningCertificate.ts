import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type CommissioningProject = Tables<'commissioning_projects'>;
type CommissioningChecklist = Tables<'commissioning_checklists'>;
type CommissioningTest = Tables<'commissioning_tests'>;

export interface CertificateSignatory {
  name: string;
  title: string;
  date: string;
}

export interface CertificateOptions {
  certificateType: 'preliminary' | 'final' | 'conditional';
  certificateNumber: string;
  includeSections: {
    varianceSummary: boolean;
    testResultsSummary: boolean;
    testDetails: boolean;
    failedTestsOnly: boolean;
    photoDocumentation: boolean;
  };
  maxPhotosPerTest: number;
  signatories: {
    commissioningAgent: CertificateSignatory;
    contractor: CertificateSignatory;
    owner?: CertificateSignatory;
  };
  conditions: string[];
}

interface VarianceField {
  field: string;
  design_value: any;
  installed_value: any;
  variance_percent: number | null;
  status: 'match' | 'within_tolerance' | 'warning' | 'fail';
}

interface VarianceSummary {
  fields: VarianceField[];
  total_fields: number;
  within_tolerance: number;
  tolerance_percent: number;
}

interface PhotoData {
  url: string;
  base64: string;
  testName: string;
  testDate?: string;
}

export function useCommissioningCertificate() {
  const getCertificateTypeLabel = (type: string): string => {
    switch (type) {
      case 'preliminary':
        return 'PRELIMINARY COMMISSIONING CERTIFICATE';
      case 'final':
        return 'FINAL COMMISSIONING CERTIFICATE';
      case 'conditional':
        return 'CONDITIONAL COMMISSIONING CERTIFICATE';
      default:
        return 'COMMISSIONING CERTIFICATE';
    }
  };

  const getStatusColor = (status: string): [number, number, number] => {
    switch (status) {
      case 'match':
      case 'within_tolerance':
      case 'pass':
        return [34, 197, 94]; // green
      case 'warning':
        return [234, 179, 8]; // yellow
      case 'fail':
        return [239, 68, 68]; // red
      default:
        return [100, 100, 100]; // gray
    }
  };

  const fetchPhotosAsBase64 = async (
    tests: CommissioningTest[],
    maxPhotosPerTest: number
  ): Promise<PhotoData[]> => {
    const photos: PhotoData[] = [];

    for (const test of tests) {
      const testPhotos = (test.photos_urls as string[]) || [];
      const photosToInclude = testPhotos.slice(0, maxPhotosPerTest);

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

          photos.push({
            url,
            base64,
            testName: test.test_name,
            testDate: test.test_date || undefined,
          });
        } catch (error) {
          console.error('Error fetching photo:', error);
          // Skip failed photos
        }
      }
    }

    return photos;
  };

  const generateCertificate = async (
    project: CommissioningProject,
    checklists: CommissioningChecklist[],
    tests: CommissioningTest[],
    options: CertificateOptions
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Fetch photos if needed
    let photos: PhotoData[] = [];
    if (options.includeSections.photoDocumentation) {
      photos = await fetchPhotosAsBase64(tests, options.maxPhotosPerTest);
    }

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    // Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('HVAC COMMISSIONING', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('CERTIFICATE', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(getCertificateTypeLabel(options.certificateType), pageWidth / 2, 38, { align: 'center' });

    currentY = 55;

    // Certificate info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Certificate No: ${options.certificateNumber}`, 14, currentY);
    doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, pageWidth - 14, currentY, { align: 'right' });
    
    currentY += 15;

    // Project Information Section
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT INFORMATION', 18, currentY);
    currentY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const projectInfo = [
      ['Project:', project.name],
      ['Contractor:', project.contractor_name || '-'],
      ['Start Date:', project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : '-'],
      ['Completion:', project.actual_completion_date ? format(new Date(project.actual_completion_date), 'MMM d, yyyy') : 'In Progress'],
      ['Status:', project.status.charAt(0).toUpperCase() + project.status.slice(1)],
    ];

    projectInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 18, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 55, currentY);
      currentY += 6;
    });

    currentY += 10;

    // Commissioning Summary Section
    const passedChecklists = checklists.filter(c => c.overall_status === 'pass').length;
    const failedChecklists = checklists.filter(c => c.overall_status === 'fail').length;
    const pendingChecklists = checklists.length - passedChecklists - failedChecklists;
    
    const passedTests = tests.filter(t => t.result === 'pass').length;
    const failedTests = tests.filter(t => t.result === 'fail').length;
    const pendingTests = tests.length - passedTests - failedTests;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMMISSIONING SUMMARY', 18, currentY);
    currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Total', 'Passed', 'Failed', 'Pending']],
      body: [
        ['Checklists', checklists.length, passedChecklists, failedChecklists, pendingChecklists],
        ['Tests', tests.length, passedTests, failedTests, pendingTests],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Variance Summary Section (if enabled)
    if (options.includeSections.varianceSummary) {
      const checklistsWithVariance = checklists.filter(c => c.variance_summary);
      
      if (checklistsWithVariance.length > 0) {
        checkPageBreak(60);
        
        doc.setFillColor(241, 245, 249);
        doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('VARIANCE SUMMARY (Design vs. Installed)', 18, currentY);
        currentY += 10;

        checklistsWithVariance.forEach((checklist) => {
          const varianceData = checklist.variance_summary;
          if (!varianceData || typeof varianceData !== 'object') return;
          
          const variance = varianceData as unknown as VarianceSummary;
          if (!variance.fields) return;
          checkPageBreak(40 + variance.fields.length * 8);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`Equipment: ${checklist.equipment_tag || 'N/A'}`, 18, currentY);
          currentY += 5;

          autoTable(doc, {
            startY: currentY,
            head: [['Parameter', 'Design', 'Installed', 'Variance', 'Status']],
            body: variance.fields.map(field => [
              field.field,
              String(field.design_value ?? '-'),
              String(field.installed_value ?? '-'),
              field.variance_percent !== null ? `${field.variance_percent > 0 ? '+' : ''}${field.variance_percent.toFixed(1)}%` : '-',
              field.status.toUpperCase(),
            ]),
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
              if (data.column.index === 4 && data.section === 'body') {
                const status = String(data.cell.raw).toLowerCase();
                const [r, g, b] = getStatusColor(status);
                data.cell.styles.textColor = [r, g, b];
                data.cell.styles.fontStyle = 'bold';
              }
            },
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        });
      }
    }

    // Test Results Section (if enabled)
    if (options.includeSections.testResultsSummary || options.includeSections.testDetails) {
      checkPageBreak(50);

      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TEST RESULTS', 18, currentY);
      currentY += 10;

      const testsToShow = options.includeSections.failedTestsOnly 
        ? tests.filter(t => t.result === 'fail')
        : tests;

      if (testsToShow.length > 0) {
        // Add photo reference column if photos are included
        const hasPhotos = options.includeSections.photoDocumentation && photos.length > 0;
        
        autoTable(doc, {
          startY: currentY,
          head: [hasPhotos 
            ? ['Test Name', 'Expected', 'Actual', 'Variance', 'Result', 'Photos']
            : ['Test Name', 'Expected', 'Actual', 'Variance', 'Result']
          ],
          body: testsToShow.map(test => {
            const testPhotoCount = photos.filter(p => p.testName === test.test_name).length;
            const row = [
              test.test_name,
              test.expected_value || '-',
              test.actual_value || '-',
              test.variance_percent !== null ? `${test.variance_percent > 0 ? '+' : ''}${test.variance_percent.toFixed(1)}%` : '-',
              test.result.toUpperCase(),
            ];
            if (hasPhotos) {
              row.push(testPhotoCount > 0 ? `${testPhotoCount} photo${testPhotoCount > 1 ? 's' : ''}` : '-');
            }
            return row;
          }),
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] },
          margin: { left: 14, right: 14 },
          didParseCell: (data) => {
            const resultColumnIndex = hasPhotos ? 4 : 4;
            if (data.column.index === resultColumnIndex && data.section === 'body') {
              const result = String(data.cell.raw).toLowerCase();
              const [r, g, b] = getStatusColor(result);
              data.cell.styles.textColor = [r, g, b];
              data.cell.styles.fontStyle = 'bold';
            }
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Photo Documentation Section (if enabled and has photos)
    if (options.includeSections.photoDocumentation && photos.length > 0) {
      checkPageBreak(80);

      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`PHOTO DOCUMENTATION (${photos.length} photos)`, 18, currentY);
      currentY += 15;

      // Photo grid - 4 photos per row
      const photosPerRow = 4;
      const photoWidth = (pageWidth - 28 - (photosPerRow - 1) * 5) / photosPerRow;
      const photoHeight = photoWidth * 0.75; // 4:3 aspect ratio
      const captionHeight = 12;

      let photoX = 14;
      let photoIndex = 0;

      for (const photo of photos) {
        // Check if we need a new page
        if (checkPageBreak(photoHeight + captionHeight + 10)) {
          photoX = 14;
        }

        // Check if we need a new row
        if (photoIndex > 0 && photoIndex % photosPerRow === 0) {
          currentY += photoHeight + captionHeight + 10;
          photoX = 14;
          
          if (checkPageBreak(photoHeight + captionHeight + 10)) {
            photoX = 14;
          }
        }

        try {
          // Add photo
          doc.addImage(
            photo.base64,
            'JPEG',
            photoX,
            currentY,
            photoWidth,
            photoHeight,
            undefined,
            'MEDIUM'
          );

          // Add caption
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          
          const caption = photo.testName.length > 20 
            ? photo.testName.substring(0, 17) + '...'
            : photo.testName;
          doc.text(caption, photoX + photoWidth / 2, currentY + photoHeight + 4, { align: 'center' });
          
          if (photo.testDate) {
            doc.setFontSize(6);
            doc.text(
              format(new Date(photo.testDate), 'MMM d'),
              photoX + photoWidth / 2,
              currentY + photoHeight + 8,
              { align: 'center' }
            );
          }

          doc.setTextColor(0, 0, 0);
        } catch (error) {
          console.error('Error adding photo to PDF:', error);
        }

        photoX += photoWidth + 5;
        photoIndex++;
      }

      // Move past the last row of photos
      currentY += photoHeight + captionHeight + 15;
    }

    // Conditions/Exceptions Section (for conditional certificates)
    if (options.certificateType === 'conditional' && options.conditions.length > 0) {
      checkPageBreak(40 + options.conditions.length * 8);

      doc.setFillColor(254, 243, 199); // yellow-100
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(161, 98, 7); // yellow-700
      doc.text('CONDITIONS / EXCEPTIONS', 18, currentY);
      currentY += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      options.conditions.forEach((condition, index) => {
        doc.text(`${index + 1}. ${condition}`, 18, currentY);
        currentY += 7;
      });

      currentY += 10;
    }

    // Certification Statement
    checkPageBreak(80);

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
      ? 'This certifies that the HVAC systems have been commissioned in accordance with project specifications and industry standards, subject to the conditions listed above.'
      : 'This certifies that the HVAC systems have been commissioned in accordance with project specifications and industry standards.';
    
    const splitText = doc.splitTextToSize(certificationText, pageWidth - 36);
    doc.text(splitText, 18, currentY);
    currentY += splitText.length * 6 + 15;

    // Signature Blocks
    const drawSignatureBlock = (signatory: CertificateSignatory, label: string, x: number, y: number) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, y);
      
      doc.setFont('helvetica', 'normal');
      y += 15;
      
      // Signature line
      doc.setDrawColor(100, 100, 100);
      doc.line(x, y, x + 70, y);
      y += 5;
      
      if (signatory.name) {
        doc.text(`Name: ${signatory.name}`, x, y);
        y += 5;
      }
      if (signatory.title) {
        doc.text(`Title: ${signatory.title}`, x, y);
        y += 5;
      }
      if (signatory.date) {
        doc.text(`Date: ${signatory.date}`, x, y);
      }
    };

    checkPageBreak(70);

    // Two signature blocks side by side
    drawSignatureBlock(options.signatories.commissioningAgent, 'Commissioning Agent', 18, currentY);
    drawSignatureBlock(options.signatories.contractor, 'Contractor Representative', pageWidth / 2 + 10, currentY);
    
    currentY += 45;

    // Owner signature if provided
    if (options.signatories.owner && options.signatories.owner.name) {
      checkPageBreak(40);
      drawSignatureBlock(options.signatories.owner, 'Owner Representative', 18, currentY);
      currentY += 45;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Certificate generated on ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
    const fileName = `Commissioning-Certificate-${project.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);

    return fileName;
  };

  const generateCertificateNumber = (projectId: string): string => {
    const year = new Date().getFullYear();
    const shortId = projectId.substring(0, 4).toUpperCase();
    const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CX-${year}-${shortId}-${seq}`;
  };

  return {
    generateCertificate,
    generateCertificateNumber,
    getCertificateTypeLabel,
  };
}
