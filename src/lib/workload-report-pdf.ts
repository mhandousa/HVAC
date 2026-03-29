import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { WorkloadStats, TechnicianMetrics, EnrichedAssignment } from '@/hooks/useTechnicianWorkload';

export interface WorkloadReportConfig {
  reportType: 'summary' | 'detailed' | 'individual';
  dateRange: { start: Date; end: Date };
  includeSections: {
    stats: boolean;
    charts: boolean;
    assignments: boolean;
    skills: boolean;
    balancing: boolean;
  };
  technicianIds?: string[];
}

export interface WorkloadReportData {
  generatedAt: Date;
  dateRange: { start: Date; end: Date };
  teamStats: WorkloadStats;
  balanceScore: number;
  technicianMetrics: TechnicianMetrics[];
  assignments: EnrichedAssignment[];
  balancingSuggestions?: {
    fromTechnicianName: string;
    toTechnicianName: string;
    assignmentCount: number;
    reason: string;
  }[];
}

export function generateWorkloadReportPDF(
  config: WorkloadReportConfig,
  data: WorkloadReportData
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Filter technicians if individual report
  const technicians = config.technicianIds?.length
    ? data.technicianMetrics.filter(t => config.technicianIds?.includes(t.id))
    : data.technicianMetrics;

  // Helper: Add header
  const addHeader = () => {
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Technician Workload Report', margin, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateText = `${format(data.dateRange.start, 'MMM d, yyyy')} - ${format(data.dateRange.end, 'MMM d, yyyy')}`;
    doc.text(dateText, pageWidth - margin, 22, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 50;
  };

  // Helper: Add footer
  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${format(data.generatedAt, 'MMM d, yyyy h:mm a')}`,
      margin,
      pageHeight - 10
    );
    doc.text(
      `Page ${pageNum}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
    doc.setTextColor(0, 0, 0);
  };

  // Helper: Check page break
  const checkPageBreak = (requiredHeight: number, pageNum: { current: number }) => {
    if (yPos + requiredHeight > pageHeight - 30) {
      addFooter(pageNum.current);
      doc.addPage();
      pageNum.current++;
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper: Add section title
  const addSectionTitle = (title: string) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(title, margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  };

  let pageNum = { current: 1 };
  addHeader();

  // Section: Team Overview Stats
  if (config.includeSections.stats) {
    addSectionTitle('Team Overview');
    
    const statsData = [
      ['Total Assigned', data.teamStats.totalAssignments.toString()],
      ['Active', data.teamStats.totalActive.toString()],
      ['Resolved', data.teamStats.totalResolved.toString()],
      ['Overdue', data.teamStats.totalOverdue.toString()],
      ['Avg Resolution Time', `${data.teamStats.avgResolutionDays.toFixed(1)} days`],
      ['On-Time Rate', `${data.teamStats.avgOnTimeRate.toFixed(0)}%`],
      ['Balance Score', `${data.balanceScore}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Section: Technician Performance
  checkPageBreak(60, pageNum);
  addSectionTitle('Technician Performance');

  const technicianData = technicians.map(t => [
    t.name,
    t.totalAssigned.toString(),
    (t.activeAssignments + t.inProgressAssignments).toString(),
    t.resolvedAssignments.toString(),
    t.overdueAssignments.toString(),
    `${t.resolutionRate.toFixed(0)}%`,
    `${t.avgResolutionDays.toFixed(1)} days`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Technician', 'Total', 'Active', 'Resolved', 'Overdue', 'Resolution Rate', 'Avg Time']],
    body: technicianData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Section: Top Performers
  checkPageBreak(60, pageNum);
  addSectionTitle('Top Performers');

  const topPerformers = [...technicians]
    .filter(t => t.totalAssigned > 0)
    .sort((a, b) => b.resolutionRate - a.resolutionRate)
    .slice(0, 5);

  if (topPerformers.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    topPerformers.forEach((t, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      doc.text(
        `${medal} ${t.name} - ${t.resolutionRate.toFixed(0)}% resolution rate (${t.resolvedAssignments} resolved)`,
        margin,
        yPos
      );
      yPos += 7;
    });
    yPos += 10;
  }

  // Section: Assignments Summary (Detailed Report)
  if (config.reportType === 'detailed' && config.includeSections.assignments) {
    checkPageBreak(60, pageNum);
    addSectionTitle('Assignments Summary');

    const priorityCounts = {
      urgent: data.assignments.filter(a => a.priority === 'urgent').length,
      high: data.assignments.filter(a => a.priority === 'high').length,
      medium: data.assignments.filter(a => a.priority === 'medium').length,
      low: data.assignments.filter(a => a.priority === 'low').length,
    };

    const statusCounts = {
      assigned: data.assignments.filter(a => a.status === 'assigned').length,
      in_progress: data.assignments.filter(a => a.status === 'in_progress').length,
      resolved: data.assignments.filter(a => a.status === 'resolved').length,
      overdue: data.assignments.filter(a => a.isOverdue).length,
    };

    const summaryData = [
      ['By Priority', ''],
      ['Urgent', priorityCounts.urgent.toString()],
      ['High', priorityCounts.high.toString()],
      ['Medium', priorityCounts.medium.toString()],
      ['Low', priorityCounts.low.toString()],
      ['', ''],
      ['By Status', ''],
      ['Assigned', statusCounts.assigned.toString()],
      ['In Progress', statusCounts.in_progress.toString()],
      ['Resolved', statusCounts.resolved.toString()],
      ['Overdue', statusCounts.overdue.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: 'plain',
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Section: Balancing Suggestions
  if (config.includeSections.balancing && data.balancingSuggestions && data.balancingSuggestions.length > 0) {
    checkPageBreak(60, pageNum);
    addSectionTitle('Workload Balancing Suggestions');

    const balancingData = data.balancingSuggestions.map(s => [
      s.fromTechnicianName,
      s.toTechnicianName,
      s.assignmentCount.toString(),
      s.reason,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['From', 'To', 'Count', 'Reason']],
      body: balancingData,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Section: Individual Technician Details (for individual report type)
  if (config.reportType === 'individual' && technicians.length > 0) {
    technicians.forEach(tech => {
      checkPageBreak(80, pageNum);
      addSectionTitle(`Technician: ${tech.name}`);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${tech.email}`, margin, yPos);
      yPos += 7;
      doc.text(`Total Assignments: ${tech.totalAssigned}`, margin, yPos);
      yPos += 7;
      doc.text(`Active: ${tech.activeAssignments + tech.inProgressAssignments} | Resolved: ${tech.resolvedAssignments} | Overdue: ${tech.overdueAssignments}`, margin, yPos);
      yPos += 7;
      doc.text(`Resolution Rate: ${tech.resolutionRate.toFixed(0)}% | Avg Resolution: ${tech.avgResolutionDays.toFixed(1)} days`, margin, yPos);
      yPos += 15;

      // Technician's assignments
      if (config.includeSections.assignments && tech.assignments.length > 0) {
        const assignmentData = tech.assignments.slice(0, 10).map(a => [
          a.id.slice(0, 8),
          a.priority,
          a.status,
          a.dueDate ? format(new Date(a.dueDate), 'MMM d, yyyy') : 'N/A',
          a.isOverdue ? 'Yes' : 'No',
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['ID', 'Priority', 'Status', 'Due Date', 'Overdue']],
          body: assignmentData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 20;
      }
    });
  }

  // Add footer to last page
  addFooter(pageNum.current);

  return doc;
}

export function downloadWorkloadReportPDF(
  config: WorkloadReportConfig,
  data: WorkloadReportData,
  filename?: string
) {
  const doc = generateWorkloadReportPDF(config, data);
  const reportTypeName = config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1);
  const defaultFilename = `Workload_Report_${reportTypeName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename || defaultFilename);
}
