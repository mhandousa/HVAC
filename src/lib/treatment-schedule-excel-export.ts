import * as XLSX from 'xlsx';
import { InstallationSchedule, getCalendarDate, formatDuration } from './treatment-installation-scheduler';
import { format } from 'date-fns';

interface ScheduleExcelOptions {
  startDate?: Date;
  projectName?: string;
  includeCalendarDates?: boolean;
}

export function exportScheduleToExcel(
  schedule: InstallationSchedule,
  options: ScheduleExcelOptions = {}
): void {
  const {
    startDate,
    projectName = 'Acoustic Treatment Project',
    includeCalendarDates = true,
  } = options;

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['ACOUSTIC TREATMENT INSTALLATION SCHEDULE'],
    [],
    ['Project', projectName],
    ['Package', schedule.packageName],
    ['Generated', format(new Date(), 'MMMM d, yyyy')],
    ...(startDate ? [['Planned Start', format(startDate, 'MMMM d, yyyy')]] : []),
    [],
    ['SCHEDULE SUMMARY'],
    ['Total Duration', `${schedule.totalDays} working days`],
    ['Total Hours', formatDuration(schedule.totalHours)],
    ['Total Phases', schedule.totalPhases],
    ['Total Zones', schedule.totalZones],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Schedule (Full Schedule)
  const scheduleHeaders = [
    'Phase',
    'Zone',
    'Space Type',
    'Floor',
    'Start Day',
    'End Day',
    'Duration (hrs)',
    'Treatments',
    ...(startDate && includeCalendarDates ? ['Start Date', 'End Date'] : []),
  ];

  const scheduleRows: any[][] = [];
  schedule.phases.forEach(phase => {
    phase.zones.forEach(zone => {
      const treatmentNames = zone.treatments.map(t => t.name).join(', ');
      const row = [
        phase.name,
        zone.zoneName,
        zone.spaceType,
        zone.floorId,
        zone.startDay,
        zone.endDay,
        zone.estimatedHours.toFixed(1),
        treatmentNames,
      ];
      
      if (startDate && includeCalendarDates) {
        row.push(
          format(getCalendarDate(startDate, zone.startDay - 1), 'yyyy-MM-dd'),
          format(getCalendarDate(startDate, zone.endDay - 1), 'yyyy-MM-dd')
        );
      }
      
      scheduleRows.push(row);
    });
  });

  const scheduleSheet = XLSX.utils.aoa_to_sheet([scheduleHeaders, ...scheduleRows]);
  scheduleSheet['!cols'] = [
    { wch: 25 }, // Phase
    { wch: 25 }, // Zone
    { wch: 20 }, // Space Type
    { wch: 10 }, // Floor
    { wch: 10 }, // Start Day
    { wch: 10 }, // End Day
    { wch: 12 }, // Duration
    { wch: 50 }, // Treatments
    ...(startDate && includeCalendarDates ? [{ wch: 12 }, { wch: 12 }] : []),
  ];
  XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Schedule');

  // Sheet 3: Phases
  const phasesHeaders = ['Phase Number', 'Phase Name', 'Start Day', 'End Day', 'Duration (days)', 'Total Hours', 'Zones Count'];
  const phasesRows = schedule.phases.map(phase => {
    const phaseHours = phase.zones.reduce((sum, z) => sum + z.estimatedHours, 0);
    return [
      phase.phaseNumber,
      phase.name,
      phase.startDay,
      phase.endDay,
      phase.durationDays,
      phaseHours.toFixed(1),
      phase.zones.length,
    ];
  });

  if (startDate && includeCalendarDates) {
    phasesHeaders.push('Start Date', 'End Date');
    phasesRows.forEach((row, idx) => {
      const phase = schedule.phases[idx];
      row.push(
        format(getCalendarDate(startDate, phase.startDay - 1), 'yyyy-MM-dd'),
        format(getCalendarDate(startDate, phase.endDay - 1), 'yyyy-MM-dd')
      );
    });
  }

  const phasesSheet = XLSX.utils.aoa_to_sheet([phasesHeaders, ...phasesRows]);
  phasesSheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    ...(startDate && includeCalendarDates ? [{ wch: 12 }, { wch: 12 }] : []),
  ];
  XLSX.utils.book_append_sheet(workbook, phasesSheet, 'Phases');

  // Sheet 4: Treatments
  const treatmentsHeaders = ['Zone', 'Treatment Name', 'Category', 'Quantity', 'Hours'];
  const treatmentsRows: any[][] = [];
  
  schedule.phases.forEach(phase => {
    phase.zones.forEach(zone => {
      zone.treatments.forEach(treatment => {
        treatmentsRows.push([
          zone.zoneName,
          treatment.name,
          treatment.category,
          treatment.quantity,
          treatment.estimatedHours.toFixed(1),
        ]);
      });
    });
  });

  const treatmentsSheet = XLSX.utils.aoa_to_sheet([treatmentsHeaders, ...treatmentsRows]);
  treatmentsSheet['!cols'] = [
    { wch: 25 },
    { wch: 35 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(workbook, treatmentsSheet, 'Treatments');

  // Sheet 5: Milestones
  const milestonesHeaders = ['Day', 'Type', 'Description'];
  if (startDate && includeCalendarDates) {
    milestonesHeaders.push('Date');
  }
  
  const milestonesRows = schedule.milestones.map(milestone => {
    const row = [milestone.day, milestone.type, milestone.label];
    if (startDate && includeCalendarDates) {
      row.push(format(getCalendarDate(startDate, milestone.day - 1), 'yyyy-MM-dd'));
    }
    return row;
  });

  const milestonesSheet = XLSX.utils.aoa_to_sheet([milestonesHeaders, ...milestonesRows]);
  milestonesSheet['!cols'] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 40 },
    ...(startDate && includeCalendarDates ? [{ wch: 12 }] : []),
  ];
  XLSX.utils.book_append_sheet(workbook, milestonesSheet, 'Milestones');

  // Sheet 6: Calendar (if start date provided)
  if (startDate && includeCalendarDates) {
    const calendarHeaders = ['Date', 'Day Number', 'Zones Working', 'Treatments'];
    const calendarRows: any[][] = [];
    
    for (let day = 1; day <= schedule.totalDays; day++) {
      const date = getCalendarDate(startDate, day - 1);
      const zonesWorking: string[] = [];
      const treatments: string[] = [];
      
      schedule.phases.forEach(phase => {
        phase.zones.forEach(zone => {
          if (day >= zone.startDay && day <= zone.endDay) {
            zonesWorking.push(zone.zoneName);
            zone.treatments.forEach(t => {
              if (!treatments.includes(t.name)) {
                treatments.push(t.name);
              }
            });
          }
        });
      });
      
      calendarRows.push([
        format(date, 'yyyy-MM-dd'),
        day,
        zonesWorking.join(', '),
        treatments.join(', '),
      ]);
    }

    const calendarSheet = XLSX.utils.aoa_to_sheet([calendarHeaders, ...calendarRows]);
    calendarSheet['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 40 },
      { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(workbook, calendarSheet, 'Calendar');
  }

  // Save the workbook
  const filename = `installation-schedule-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
