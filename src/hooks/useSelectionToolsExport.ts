import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ============= COIL SELECTION EXPORT =============

export interface CoilScheduleRow {
  tag: string;
  type: string;
  manufacturer: string;
  model: string;
  capacityTons?: number;
  capacityMbh?: number;
  cfm: number;
  rows: number;
  fpi: number;
  faceVelocity: number;
  waterFlowGpm: number;
  pressureDropFt: number;
  airPressureDropIn: number;
  zoneName?: string;
  buildingName?: string;
}

export interface FilterScheduleRow {
  tag: string;
  position: string;
  mervRating: number;
  filterType: string;
  manufacturer: string;
  model: string;
  cfm: number;
  cleanPdIn: number;
  dirtyPdIn: number;
  faceVelocity: number;
  replacementMonths: number;
  annualEnergyCostSar?: number;
  annualReplacementCostSar?: number;
}

export interface CoolingTowerScheduleRow {
  tag: string;
  manufacturer: string;
  model: string;
  towerType: string;
  fillType: string;
  numberOfCells: number;
  capacityTons: number;
  cwFlowGpm: number;
  approach: number;
  range: number;
  designWetBulb: number;
  fanKw: number;
  makeupGpm: number;
  city?: string;
}

export interface ChillerScheduleRow {
  tag: string;
  manufacturer: string;
  model: string;
  chillerType: string;
  compressorType?: string;
  capacityTons: number;
  eer: number;
  iplv: number;
  cop: number;
  refrigerant: string;
  voltage: string;
  fla: number;
  powerKw: number;
  chwFlow: number;
  cwFlow?: number;
  dutyType: string;
  partLoad100?: number;
  partLoad75?: number;
  partLoad50?: number;
  partLoad25?: number;
}

export interface BoilerScheduleRow {
  tag: string;
  manufacturer: string;
  model: string;
  boilerType: string;
  fuelType: string;
  capacityBtuh: number;
  capacityMbh: number;
  baseAfue: number;
  adjustedAfue?: number;
  thermalEfficiency: number;
  turndownRatio: string;
  hwSupplyTempF: number;
  hwReturnTempF: number;
  hwFlowGpm: number;
  voltage: string;
  ashrae90Compliant: boolean;
  asmeCompliant: boolean;
  dutyType: string;
  plantName?: string;
}

export interface SelectionExportOptions {
  projectName: string;
  projectId?: string;
  includeNotes?: boolean;
}

export function useSelectionToolsExport() {
  // ============= COIL SCHEDULE EXPORT =============
  
  const exportCoilScheduleToPDF = useCallback((
    coils: CoilScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COIL SELECTION SCHEDULE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.projectName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Summary
    const coolingCoils = coils.filter(c => c.type === 'cooling');
    const heatingCoils = coils.filter(c => c.type !== 'cooling');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Coils: ${coils.length}  |  Cooling: ${coolingCoils.length}  |  Heating: ${heatingCoils.length}`, margin, yPos);
    yPos += 8;

    // Table
    autoTable(doc, {
      startY: yPos,
      head: [['Tag', 'Type', 'Manufacturer', 'Model', 'Capacity', 'CFM', 'Rows', 'FPI', 'Face Vel (FPM)', 'Water (GPM)', 'Water PD (ft)', 'Air PD (in)']],
      body: coils.map(c => [
        c.tag,
        c.type.charAt(0).toUpperCase() + c.type.slice(1),
        c.manufacturer,
        c.model,
        c.type === 'cooling' ? `${c.capacityTons?.toFixed(1) || '-'} Tons` : `${c.capacityMbh?.toFixed(0) || '-'} MBH`,
        c.cfm.toLocaleString(),
        c.rows.toString(),
        c.fpi.toString(),
        c.faceVelocity.toFixed(0),
        c.waterFlowGpm.toFixed(1),
        c.pressureDropFt.toFixed(1),
        c.airPressureDropIn.toFixed(2),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    const filename = `coil-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
    toast.success('Coil schedule exported to PDF');
  }, []);

  const exportCoilScheduleToExcel = useCallback((
    coils: CoilScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const workbook = XLSX.utils.book_new();

    // Cover sheet
    const coverData = [
      ['COIL SELECTION SCHEDULE'],
      [''],
      ['Project:', options.projectName],
      ['Generated:', format(new Date(), 'yyyy-MM-dd HH:mm')],
      ['Total Coils:', coils.length.toString()],
    ];
    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    coverSheet['!cols'] = [{ wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Schedule sheet
    const scheduleData = [
      ['Tag', 'Type', 'Manufacturer', 'Model', 'Capacity', 'Unit', 'CFM', 'Rows', 'FPI', 'Face Velocity (FPM)', 'Water Flow (GPM)', 'Water PD (ft)', 'Air PD (in)', 'Zone', 'Building'],
      ...coils.map(c => [
        c.tag,
        c.type,
        c.manufacturer,
        c.model,
        c.type === 'cooling' ? c.capacityTons : c.capacityMbh,
        c.type === 'cooling' ? 'Tons' : 'MBH',
        c.cfm,
        c.rows,
        c.fpi,
        c.faceVelocity,
        c.waterFlowGpm,
        c.pressureDropFt,
        c.airPressureDropIn,
        c.zoneName || '-',
        c.buildingName || '-',
      ]),
    ];
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    scheduleSheet['!cols'] = Array(15).fill({ wch: 14 });
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Coil Schedule');

    const filename = `coil-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Coil schedule exported to Excel');
  }, []);

  // ============= FILTER SCHEDULE EXPORT =============

  const exportFilterScheduleToPDF = useCallback((
    filters: FilterScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FILTER SELECTION SCHEDULE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.projectName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Summary
    const prefilters = filters.filter(f => f.position === 'prefilter');
    const finalFilters = filters.filter(f => f.position === 'final');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Filters: ${filters.length}  |  Pre-filters: ${prefilters.length}  |  Final: ${finalFilters.length}`, margin, yPos);
    yPos += 8;

    // Table
    autoTable(doc, {
      startY: yPos,
      head: [['Tag', 'Position', 'MERV', 'Type', 'Manufacturer', 'Model', 'CFM', 'Clean PD (in)', 'Dirty PD (in)', 'Face Vel', 'Replace (mo)', 'Annual Cost (SAR)']],
      body: filters.map(f => [
        f.tag,
        f.position.charAt(0).toUpperCase() + f.position.slice(1),
        f.mervRating.toString(),
        f.filterType,
        f.manufacturer,
        f.model,
        f.cfm.toLocaleString(),
        f.cleanPdIn.toFixed(2),
        f.dirtyPdIn.toFixed(2),
        f.faceVelocity.toFixed(0),
        f.replacementMonths.toString(),
        ((f.annualEnergyCostSar || 0) + (f.annualReplacementCostSar || 0)).toLocaleString(),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    const filename = `filter-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
    toast.success('Filter schedule exported to PDF');
  }, []);

  const exportFilterScheduleToExcel = useCallback((
    filters: FilterScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const workbook = XLSX.utils.book_new();

    // Cover sheet
    const coverData = [
      ['FILTER SELECTION SCHEDULE'],
      [''],
      ['Project:', options.projectName],
      ['Generated:', format(new Date(), 'yyyy-MM-dd HH:mm')],
      ['Total Filters:', filters.length.toString()],
    ];
    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    coverSheet['!cols'] = [{ wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Schedule sheet
    const scheduleData = [
      ['Tag', 'Position', 'MERV Rating', 'Filter Type', 'Manufacturer', 'Model', 'CFM', 'Clean PD (in)', 'Dirty PD (in)', 'Face Velocity (FPM)', 'Replacement Interval (months)', 'Annual Energy Cost (SAR)', 'Annual Replacement Cost (SAR)', 'Total Annual Cost (SAR)'],
      ...filters.map(f => [
        f.tag,
        f.position,
        f.mervRating,
        f.filterType,
        f.manufacturer,
        f.model,
        f.cfm,
        f.cleanPdIn,
        f.dirtyPdIn,
        f.faceVelocity,
        f.replacementMonths,
        f.annualEnergyCostSar || 0,
        f.annualReplacementCostSar || 0,
        (f.annualEnergyCostSar || 0) + (f.annualReplacementCostSar || 0),
      ]),
    ];
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    scheduleSheet['!cols'] = Array(14).fill({ wch: 16 });
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Filter Schedule');

    const filename = `filter-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Filter schedule exported to Excel');
  }, []);

  // ============= COOLING TOWER SCHEDULE EXPORT =============

  const exportCoolingTowerScheduleToPDF = useCallback((
    towers: CoolingTowerScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COOLING TOWER SCHEDULE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.projectName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Summary
    const totalCapacity = towers.reduce((sum, t) => sum + t.capacityTons, 0);
    const totalCells = towers.reduce((sum, t) => sum + t.numberOfCells, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Towers: ${towers.length}  |  Total Cells: ${totalCells}  |  Total Capacity: ${totalCapacity.toFixed(0)} Tons`, margin, yPos);
    yPos += 8;

    // Table
    autoTable(doc, {
      startY: yPos,
      head: [['Tag', 'Manufacturer', 'Model', 'Type', 'Fill', 'Cells', 'Capacity (Tons)', 'CW Flow (GPM)', 'Approach (°F)', 'Range (°F)', 'WB (°F)', 'Fan (kW)', 'Makeup (GPM)']],
      body: towers.map(t => [
        t.tag,
        t.manufacturer,
        t.model,
        t.towerType.replace(/_/g, ' '),
        t.fillType,
        t.numberOfCells.toString(),
        t.capacityTons.toFixed(0),
        t.cwFlowGpm.toLocaleString(),
        t.approach.toString(),
        t.range.toString(),
        t.designWetBulb.toString(),
        t.fanKw.toFixed(1),
        t.makeupGpm.toFixed(1),
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    const filename = `cooling-tower-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
    toast.success('Cooling tower schedule exported to PDF');
  }, []);

  const exportCoolingTowerScheduleToExcel = useCallback((
    towers: CoolingTowerScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const workbook = XLSX.utils.book_new();

    // Cover sheet
    const totalCapacity = towers.reduce((sum, t) => sum + t.capacityTons, 0);
    const coverData = [
      ['COOLING TOWER SCHEDULE'],
      [''],
      ['Project:', options.projectName],
      ['Generated:', format(new Date(), 'yyyy-MM-dd HH:mm')],
      ['Total Towers:', towers.length.toString()],
      ['Total Capacity:', `${totalCapacity.toFixed(0)} Tons`],
    ];
    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    coverSheet['!cols'] = [{ wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Schedule sheet
    const scheduleData = [
      ['Tag', 'Manufacturer', 'Model', 'Tower Type', 'Fill Type', 'Number of Cells', 'Capacity (Tons)', 'CW Flow (GPM)', 'Approach (°F)', 'Range (°F)', 'Design Wet Bulb (°F)', 'Fan Power (kW)', 'Makeup Water (GPM)', 'City'],
      ...towers.map(t => [
        t.tag,
        t.manufacturer,
        t.model,
        t.towerType.replace(/_/g, ' '),
        t.fillType,
        t.numberOfCells,
        t.capacityTons,
        t.cwFlowGpm,
        t.approach,
        t.range,
        t.designWetBulb,
        t.fanKw,
        t.makeupGpm,
        t.city || '-',
      ]),
    ];
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    scheduleSheet['!cols'] = Array(14).fill({ wch: 16 });
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Cooling Tower Schedule');

    const filename = `cooling-tower-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Cooling tower schedule exported to Excel');
  }, []);

  // ============= CHILLER SCHEDULE EXPORT =============

  const exportChillerScheduleToPDF = useCallback((
    chillers: ChillerScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CHILLER SELECTION SCHEDULE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.projectName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Summary
    const totalCapacity = chillers.reduce((sum, c) => sum + c.capacityTons, 0);
    const avgIplv = chillers.length > 0 
      ? chillers.reduce((sum, c) => sum + c.iplv, 0) / chillers.length 
      : 0;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Chillers: ${chillers.length}  |  Total Capacity: ${totalCapacity.toFixed(0)} Tons  |  Avg IPLV: ${avgIplv.toFixed(2)}`, margin, yPos);
    yPos += 8;

    // Table
    autoTable(doc, {
      startY: yPos,
      head: [['Tag', 'Manufacturer', 'Model', 'Type', 'Capacity (Tons)', 'EER', 'IPLV', 'COP', 'Refrigerant', 'Voltage', 'FLA', 'Power (kW)', 'Duty']],
      body: chillers.map(c => [
        c.tag,
        c.manufacturer,
        c.model,
        c.chillerType.replace(/-/g, ' '),
        c.capacityTons.toFixed(0),
        c.eer.toFixed(2),
        c.iplv.toFixed(2),
        c.cop.toFixed(2),
        c.refrigerant,
        c.voltage,
        c.fla.toFixed(0),
        c.powerKw.toFixed(1),
        c.dutyType,
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    const filename = `chiller-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
    toast.success('Chiller schedule exported to PDF');
  }, []);

  const exportChillerScheduleToExcel = useCallback((
    chillers: ChillerScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const workbook = XLSX.utils.book_new();

    // Cover sheet
    const totalCapacity = chillers.reduce((sum, c) => sum + c.capacityTons, 0);
    const avgIplv = chillers.length > 0 
      ? chillers.reduce((sum, c) => sum + c.iplv, 0) / chillers.length 
      : 0;
    
    const coverData = [
      ['CHILLER SELECTION SCHEDULE'],
      [''],
      ['Project:', options.projectName],
      ['Generated:', format(new Date(), 'yyyy-MM-dd HH:mm')],
      ['Total Chillers:', chillers.length.toString()],
      ['Total Capacity:', `${totalCapacity.toFixed(0)} Tons`],
      ['Average IPLV:', avgIplv.toFixed(2)],
    ];
    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    coverSheet['!cols'] = [{ wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Schedule sheet
    const scheduleData = [
      ['Tag', 'Manufacturer', 'Model', 'Chiller Type', 'Compressor', 'Capacity (Tons)', 'EER', 'IPLV', 'COP', 'Refrigerant', 'Voltage', 'FLA', 'Power Input (kW)', 'CHW Flow (GPM)', 'CW Flow (GPM)', 'Duty Type'],
      ...chillers.map(c => [
        c.tag,
        c.manufacturer,
        c.model,
        c.chillerType,
        c.compressorType || '-',
        c.capacityTons,
        c.eer,
        c.iplv,
        c.cop,
        c.refrigerant,
        c.voltage,
        c.fla,
        c.powerKw,
        c.chwFlow,
        c.cwFlow || '-',
        c.dutyType,
      ]),
    ];
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    scheduleSheet['!cols'] = Array(16).fill({ wch: 14 });
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Chiller Schedule');

    // Part Load Analysis sheet
    const partLoadData = [
      ['Tag', '100% Load (kW/ton)', '75% Load (kW/ton)', '50% Load (kW/ton)', '25% Load (kW/ton)', 'IPLV'],
      ...chillers.map(c => [
        c.tag,
        c.partLoad100 || '-',
        c.partLoad75 || '-',
        c.partLoad50 || '-',
        c.partLoad25 || '-',
        c.iplv,
      ]),
    ];
    const partLoadSheet = XLSX.utils.aoa_to_sheet(partLoadData);
    partLoadSheet['!cols'] = Array(6).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, partLoadSheet, 'Part Load Analysis');

    const filename = `chiller-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Chiller schedule exported to Excel');
  }, []);

  // ============= BOILER SCHEDULE EXPORT =============
  
  const exportBoilerScheduleToPDF = useCallback((
    boilers: BoilerScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // Header with red-orange theme for boilers
    doc.setFillColor(220, 53, 69);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Boiler Schedule', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${options.projectName}`, margin, 26);
    doc.text(`Date: ${format(new Date(), 'PPP')}`, pageWidth - margin - 50, 18);
    yPos = 40;

    doc.setTextColor(0, 0, 0);

    // Summary Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Schedule Summary', margin, yPos);
    yPos += 8;

    const totalBoilers = boilers.length;
    const totalCapacityMbh = boilers.reduce((sum, b) => sum + b.capacityMbh, 0);
    const avgAfue = boilers.length > 0 
      ? boilers.reduce((sum, b) => sum + b.baseAfue, 0) / boilers.length 
      : 0;
    const ashrae90Count = boilers.filter(b => b.ashrae90Compliant).length;
    const condensingCount = boilers.filter(b => b.boilerType.toLowerCase().includes('condensing')).length;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: [
        ['Total Boilers', String(totalBoilers)],
        ['Total Capacity', `${totalCapacityMbh.toLocaleString()} MBH`],
        ['Average AFUE', `${(avgAfue * 100).toFixed(1)}%`],
        ['ASHRAE 90.1 Compliant', `${ashrae90Count} of ${totalBoilers}`],
        ['Condensing Boilers', `${condensingCount} of ${totalBoilers}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [220, 53, 69] },
      margin: { left: margin },
      tableWidth: 100,
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Main Schedule Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Boiler Equipment Schedule', margin, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [[
        'Tag', 'Manufacturer', 'Model', 'Type', 'Fuel', 'Capacity\n(MBH)', 
        'AFUE\n(%)', 'Thermal Eff\n(%)', 'Turndown', 'HW Supply\n(°F)', 
        'HW Return\n(°F)', 'Flow\n(GPM)', 'ASHRAE\n90.1'
      ]],
      body: boilers.map(b => [
        b.tag,
        b.manufacturer,
        b.model,
        b.boilerType,
        b.fuelType,
        b.capacityMbh.toLocaleString(),
        (b.baseAfue * 100).toFixed(1),
        (b.thermalEfficiency * 100).toFixed(1),
        b.turndownRatio,
        b.hwSupplyTempF,
        b.hwReturnTempF,
        b.hwFlowGpm.toFixed(1),
        b.ashrae90Compliant ? '✓' : '✗',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69], fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 18, halign: 'center' },
        8: { cellWidth: 16 },
        9: { cellWidth: 18, halign: 'center' },
        10: { cellWidth: 18, halign: 'center' },
        11: { cellWidth: 15, halign: 'right' },
        12: { cellWidth: 15, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | Boiler Schedule | ${options.projectName}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const filename = `boiler-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
    toast.success('Boiler schedule exported to PDF');
  }, []);

  const exportBoilerScheduleToExcel = useCallback((
    boilers: BoilerScheduleRow[],
    options: SelectionExportOptions
  ) => {
    const workbook = XLSX.utils.book_new();

    // Cover Sheet
    const coverData = [
      ['Boiler Equipment Schedule'],
      [''],
      ['Project', options.projectName],
      ['Generated', format(new Date(), 'PPpp')],
      ['Total Boilers', boilers.length],
      ['Total Capacity (MBH)', boilers.reduce((sum, b) => sum + b.capacityMbh, 0).toLocaleString()],
    ];
    const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
    coverSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, coverSheet, 'Cover');

    // Schedule Sheet
    const scheduleData = [
      [
        'Tag', 'Manufacturer', 'Model', 'Type', 'Fuel Type', 'Capacity (BTU/h)', 
        'Capacity (MBH)', 'AFUE (%)', 'Adjusted AFUE (%)', 'Thermal Eff (%)', 
        'Turndown Ratio', 'HW Supply (°F)', 'HW Return (°F)', 'HW Flow (GPM)', 
        'Voltage', 'ASHRAE 90.1', 'ASME Certified', 'Duty Type', 'Plant Name'
      ],
      ...boilers.map(b => [
        b.tag,
        b.manufacturer,
        b.model,
        b.boilerType,
        b.fuelType,
        b.capacityBtuh,
        b.capacityMbh,
        (b.baseAfue * 100).toFixed(1),
        b.adjustedAfue ? (b.adjustedAfue * 100).toFixed(1) : '-',
        (b.thermalEfficiency * 100).toFixed(1),
        b.turndownRatio,
        b.hwSupplyTempF,
        b.hwReturnTempF,
        b.hwFlowGpm.toFixed(2),
        b.voltage,
        b.ashrae90Compliant ? 'Yes' : 'No',
        b.asmeCompliant ? 'Yes' : 'No',
        b.dutyType,
        b.plantName || '-',
      ]),
    ];
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    scheduleSheet['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
      { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Boiler Schedule');

    // Efficiency Analysis Sheet
    const effData = [
      ['Efficiency Analysis'],
      [''],
      ['Tag', 'Boiler Type', 'Base AFUE (%)', 'ASHRAE 90.1 Min (%)', 'Margin (%)', 'Compliant'],
      ...boilers.map(b => {
        const minAfue = b.boilerType.toLowerCase().includes('condensing') ? 0.95 
          : b.boilerType.toLowerCase().includes('oil') ? 0.85 
          : b.fuelType === 'electric' ? 0.99 
          : 0.82;
        const margin = b.baseAfue - minAfue;
        return [
          b.tag,
          b.boilerType,
          (b.baseAfue * 100).toFixed(1),
          (minAfue * 100).toFixed(1),
          (margin * 100).toFixed(1),
          margin >= 0 ? 'Yes' : 'No',
        ];
      }),
    ];
    const effSheet = XLSX.utils.aoa_to_sheet(effData);
    effSheet['!cols'] = Array(6).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, effSheet, 'Efficiency Analysis');

    const filename = `boiler-schedule-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Boiler schedule exported to Excel');
  }, []);

  return {
    // Coil exports
    exportCoilScheduleToPDF,
    exportCoilScheduleToExcel,
    // Filter exports
    exportFilterScheduleToPDF,
    exportFilterScheduleToExcel,
    // Cooling tower exports
    exportCoolingTowerScheduleToPDF,
    exportCoolingTowerScheduleToExcel,
    // Chiller exports
    exportChillerScheduleToPDF,
    exportChillerScheduleToExcel,
    // Boiler exports
    exportBoilerScheduleToPDF,
    exportBoilerScheduleToExcel,
  };
}
