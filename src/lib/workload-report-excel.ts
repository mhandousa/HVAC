import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { WorkloadReportData, WorkloadReportConfig } from './workload-report-pdf';

export function generateWorkloadReportExcel(
  config: WorkloadReportConfig,
  data: WorkloadReportData
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Filter technicians if individual report
  const technicians = config.technicianIds?.length
    ? data.technicianMetrics.filter(t => config.technicianIds?.includes(t.id))
    : data.technicianMetrics;

  // Sheet 1: Team Summary
  if (config.includeSections.stats) {
    const summaryData = [
      ['Technician Workload Report'],
      ['Generated', format(data.generatedAt, 'MMM d, yyyy h:mm a')],
      ['Date Range', `${format(data.dateRange.start, 'MMM d, yyyy')} - ${format(data.dateRange.end, 'MMM d, yyyy')}`],
      [],
      ['Team Statistics'],
      ['Metric', 'Value'],
      ['Total Assigned', data.teamStats.totalAssignments],
      ['Total Active', data.teamStats.totalActive],
      ['Total Resolved', data.teamStats.totalResolved],
      ['Total Overdue', data.teamStats.totalOverdue],
      ['Technician Count', data.teamStats.technicianCount],
      ['Unassigned Items', data.teamStats.unassignedCount],
      ['Average Resolution Days', data.teamStats.avgResolutionDays.toFixed(1)],
      ['Average On-Time Rate', `${data.teamStats.avgOnTimeRate.toFixed(0)}%`],
      ['Balance Score', `${data.balanceScore}%`],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Team Summary');
  }

  // Sheet 2: Technician Metrics
  const metricsHeaders = [
    'Name',
    'Email',
    'Total Assigned',
    'Active',
    'In Progress',
    'Resolved',
    'Overdue',
    'Resolution Rate (%)',
    'On-Time Rate (%)',
    'Avg Resolution Days',
    'Resolved This Week',
    'Trend',
    'Urgent Count',
    'High Count',
    'Medium Count',
    'Low Count',
  ];

  const metricsData = technicians.map(t => [
    t.name,
    t.email,
    t.totalAssigned,
    t.activeAssignments,
    t.inProgressAssignments,
    t.resolvedAssignments,
    t.overdueAssignments,
    t.resolutionRate.toFixed(1),
    t.onTimeCompletionRate.toFixed(1),
    t.avgResolutionDays.toFixed(1),
    t.resolvedThisWeek,
    t.trend,
    t.urgentCount,
    t.highCount,
    t.mediumCount,
    t.lowCount,
  ]);

  const metricsSheet = XLSX.utils.aoa_to_sheet([metricsHeaders, ...metricsData]);
  metricsSheet['!cols'] = metricsHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Technician Metrics');

  // Sheet 3: Assignment Details
  if (config.includeSections.assignments) {
    const assignmentHeaders = [
      'Assignment ID',
      'Assigned To',
      'Assigned By',
      'Priority',
      'Status',
      'Due Date',
      'Is Overdue',
      'Days Until Due',
      'Resolution Days',
      'Created At',
      'Updated At',
      'Notes',
    ];

    const assignmentData = data.assignments.map(a => {
      const tech = data.technicianMetrics.find(t => t.id === a.assignedTo);
      const assigner = data.technicianMetrics.find(t => t.id === a.assignedBy);
      return [
        a.id,
        tech?.name || a.assignedTo,
        assigner?.name || a.assignedBy,
        a.priority,
        a.status,
        a.dueDate ? format(new Date(a.dueDate), 'yyyy-MM-dd') : '',
        a.isOverdue ? 'Yes' : 'No',
        a.daysUntilDue ?? '',
        a.resolutionDays ?? '',
        format(new Date(a.createdAt), 'yyyy-MM-dd HH:mm'),
        format(new Date(a.updatedAt), 'yyyy-MM-dd HH:mm'),
        a.notes || '',
      ];
    });

    const assignmentSheet = XLSX.utils.aoa_to_sheet([assignmentHeaders, ...assignmentData]);
    assignmentSheet['!cols'] = assignmentHeaders.map((_, i) => ({ wch: i === 0 ? 36 : 18 }));
    XLSX.utils.book_append_sheet(workbook, assignmentSheet, 'Assignment Details');
  }

  // Sheet 4: Workload Distribution
  const distributionHeaders = ['Technician', 'Assigned', 'In Progress', 'Overdue', 'Resolved', 'Total'];
  const distributionData = technicians.map(t => [
    t.name,
    t.activeAssignments,
    t.inProgressAssignments,
    t.overdueAssignments,
    t.resolvedAssignments,
    t.totalAssigned,
  ]);

  const distributionSheet = XLSX.utils.aoa_to_sheet([distributionHeaders, ...distributionData]);
  distributionSheet['!cols'] = distributionHeaders.map(() => ({ wch: 15 }));
  XLSX.utils.book_append_sheet(workbook, distributionSheet, 'Workload Distribution');

  // Sheet 5: Balancing Suggestions
  if (config.includeSections.balancing && data.balancingSuggestions && data.balancingSuggestions.length > 0) {
    const balancingHeaders = ['From Technician', 'To Technician', 'Assignment Count', 'Reason'];
    const balancingData = data.balancingSuggestions.map(s => [
      s.fromTechnicianName,
      s.toTechnicianName,
      s.assignmentCount,
      s.reason,
    ]);

    const balancingSheet = XLSX.utils.aoa_to_sheet([balancingHeaders, ...balancingData]);
    balancingSheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, balancingSheet, 'Balancing Suggestions');
  }

  // Sheet 6: Priority Breakdown
  const priorityHeaders = ['Technician', 'Urgent', 'High', 'Medium', 'Low', 'Total'];
  const priorityData = technicians.map(t => [
    t.name,
    t.urgentCount,
    t.highCount,
    t.mediumCount,
    t.lowCount,
    t.totalAssigned,
  ]);

  const prioritySheet = XLSX.utils.aoa_to_sheet([priorityHeaders, ...priorityData]);
  prioritySheet['!cols'] = priorityHeaders.map(() => ({ wch: 15 }));
  XLSX.utils.book_append_sheet(workbook, prioritySheet, 'Priority Breakdown');

  return workbook;
}

export function downloadWorkloadReportExcel(
  config: WorkloadReportConfig,
  data: WorkloadReportData,
  filename?: string
) {
  const workbook = generateWorkloadReportExcel(config, data);
  const reportTypeName = config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1);
  const defaultFilename = `Workload_Report_${reportTypeName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
}
