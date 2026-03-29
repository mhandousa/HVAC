import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InstallationSchedule, InstallationPhase, getCalendarDate, formatDuration } from './treatment-installation-scheduler';
import { format } from 'date-fns';

interface SchedulePDFOptions {
  includeDetails?: boolean;
  includeCosts?: boolean;
  startDate?: Date;
  projectName?: string;
}

export async function exportScheduleToPDF(
  schedule: InstallationSchedule,
  options: SchedulePDFOptions = {}
): Promise<void> {
  const {
    includeDetails = true,
    includeCosts = true,
    startDate,
    projectName = 'Acoustic Treatment Project',
  } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACOUSTIC TREATMENT INSTALLATION SCHEDULE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Project Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Package: ${schedule.packageName}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, yPosition);
  if (startDate) {
    yPosition += 5;
    doc.text(`Planned Start: ${format(startDate, 'MMMM d, yyyy')}`, 14, yPosition);
  }
  yPosition += 10;

  // Summary Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHEDULE SUMMARY', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryData = [
    ['Duration', `${schedule.totalDays} working days`],
    ['Total Hours', formatDuration(schedule.totalHours)],
    ['Phases', `${schedule.totalPhases}`],
    ['Zones', `${schedule.totalZones}`],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 60 },
    },
    margin: { left: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Schedule Overview Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SCHEDULE OVERVIEW', 14, yPosition);
  yPosition += 7;

  const overviewHeaders = ['Phase', 'Days', 'Zones', 'Hours'];
  const overviewData = schedule.phases.map(phase => {
    const dayRange = startDate 
      ? `${format(getCalendarDate(startDate, phase.startDay - 1), 'MMM d')} - ${format(getCalendarDate(startDate, phase.endDay - 1), 'MMM d')}`
      : `Day ${phase.startDay} - ${phase.endDay}`;
    const phaseHours = phase.zones.reduce((sum, z) => sum + z.estimatedHours, 0);
    return [
      phase.name,
      dayRange,
      `${phase.zones.length}`,
      formatDuration(phaseHours),
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [overviewHeaders],
    body: overviewData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Phase Details (if includeDetails)
  if (includeDetails) {
    schedule.phases.forEach((phase, phaseIndex) => {
      // Check if we need a new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${phase.name}`, 14, yPosition);
      yPosition += 6;

      const phaseHeaders = ['Zone', 'Space Type', 'Start', 'End', 'Duration'];
      const phaseData = phase.zones.map(zone => {
        const startStr = startDate 
          ? format(getCalendarDate(startDate, zone.startDay - 1), 'MMM d')
          : `Day ${zone.startDay}`;
        const endStr = startDate 
          ? format(getCalendarDate(startDate, zone.endDay - 1), 'MMM d')
          : `Day ${zone.endDay}`;
        return [
          zone.zoneName,
          zone.spaceType,
          startStr,
          endStr,
          formatDuration(zone.estimatedHours),
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [phaseHeaders],
        body: phaseData,
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    });
  }

  // Milestones
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MILESTONES', 14, yPosition);
  yPosition += 7;

  const milestoneData = schedule.milestones.map(milestone => {
    const dateStr = startDate 
      ? format(getCalendarDate(startDate, milestone.day - 1), 'MMMM d, yyyy')
      : `Day ${milestone.day}`;
    return [dateStr, milestone.label];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Date', 'Milestone']],
    body: milestoneData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  // Treatment Legend
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  if (yPosition > 260) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TREATMENT CATEGORIES', 14, yPosition);
  yPosition += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const categories = [
    { name: 'Silencer', desc: 'Sound attenuators for duct systems' },
    { name: 'Lining', desc: 'Acoustic duct lining materials' },
    { name: 'Isolator', desc: 'Vibration isolation mounts and hangers' },
    { name: 'Panel', desc: 'Acoustic panels for room treatment' },
  ];
  
  categories.forEach(cat => {
    doc.text(`• ${cat.name}: ${cat.desc}`, 18, yPosition);
    yPosition += 4;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `installation-schedule-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
