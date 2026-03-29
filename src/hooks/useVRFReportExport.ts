import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { VRFSystem, VRFIndoorUnit, VRFBranchSelector } from './useVRFSystems';
import { getPipeSizeName } from '@/lib/vrf-refrigerant-calculations';

export interface VRFReportData {
  system: VRFSystem;
  indoorUnits: VRFIndoorUnit[];
  branchSelectors: VRFBranchSelector[];
  validationMessages?: { level: string; message: string }[];
}

export function useVRFReportExport() {
  const exportToPDF = (data: VRFReportData) => {
    const { system, indoorUnits, branchSelectors, validationMessages = [] } = data;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('VRF System Design Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // System Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`System: ${system.system_name}`, 14, yPos);
    doc.text(`Tag: ${system.system_tag || 'N/A'}`, pageWidth - 60, yPos);
    yPos += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, yPos);
    doc.text(`Revision: ${system.revision}`, pageWidth - 60, yPos);
    yPos += 10;

    // System Configuration Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('System Configuration', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Parameter', 'Value']],
      body: [
        ['System Type', system.system_type === 'heat_recovery' ? 'Heat Recovery (3-Pipe)' : 'Heat Pump (2-Pipe)'],
        ['Refrigerant', system.refrigerant_type],
        ['Outdoor Unit Capacity', `${system.outdoor_unit_capacity_kw?.toFixed(1) || 'N/A'} kW (${system.outdoor_unit_capacity_tons?.toFixed(1) || 'N/A'} Tons)`],
        ['Outdoor Unit Model', system.outdoor_unit_model || 'N/A'],
        ['Manufacturer', system.outdoor_unit_manufacturer || 'N/A'],
        ['Number of ODUs', system.number_of_outdoor_units.toString()],
        ['Total Indoor Capacity', `${system.total_indoor_capacity_kw?.toFixed(1) || 'N/A'} kW`],
        ['Capacity Ratio', `${((system.capacity_ratio || 0) * 100).toFixed(0)}%`],
        ['Max Piping Length', `${system.max_piping_length_ft || 'N/A'} ft (Actual: ${system.max_piping_length_actual_ft || 'N/A'} ft)`],
        ['Max Elevation Diff', `${system.max_elevation_diff_ft || 'N/A'} ft (Actual: ${system.actual_elevation_diff_ft || 'N/A'} ft)`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Indoor Units Table
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Indoor Units Schedule', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Tag', 'Type', 'Zone', 'Capacity (kW)', 'Liquid Line', 'Suction Line', 'Length (ft)', 'Elevation (ft)']],
      body: indoorUnits.map(unit => [
        unit.unit_tag,
        unit.unit_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        unit.zone_name || '-',
        unit.cooling_capacity_kw.toFixed(1),
        unit.liquid_line_size_in ? getPipeSizeName(unit.liquid_line_size_in) : '-',
        unit.suction_line_size_in ? getPipeSizeName(unit.suction_line_size_in) : '-',
        unit.liquid_line_length_ft.toFixed(0),
        `${unit.is_above_outdoor ? '+' : '-'}${unit.elevation_from_outdoor_ft}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Branch Selectors (if heat recovery)
    if (branchSelectors.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Branch Selectors', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['Tag', 'Model', 'Capacity (kW)', 'Connected Units', 'Distance (ft)', 'Elevation (ft)']],
        body: branchSelectors.map(bs => [
          bs.selector_tag,
          bs.selector_model || '-',
          bs.capacity_kw?.toFixed(1) || '-',
          bs.connected_unit_count.toString(),
          bs.distance_from_outdoor_ft?.toFixed(0) || '-',
          bs.elevation_from_outdoor_ft.toFixed(0),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Validation Summary
    if (validationMessages.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Validation Summary', 14, yPos);
      yPos += 6;

      const errors = validationMessages.filter(m => m.level === 'error');
      const warnings = validationMessages.filter(m => m.level === 'warning');

      autoTable(doc, {
        startY: yPos,
        head: [['Level', 'Message']],
        body: validationMessages.map(m => [
          m.level.toUpperCase(),
          m.message,
        ]),
        theme: 'striped',
        headStyles: { fillColor: errors.length > 0 ? [220, 38, 38] : [234, 179, 8] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
        },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount} | VRF System: ${system.system_name} | Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`VRF_Report_${system.system_tag || system.system_name}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportToExcel = (data: VRFReportData) => {
    const { system, indoorUnits, branchSelectors, validationMessages = [] } = data;
    const wb = XLSX.utils.book_new();

    // System Configuration Sheet
    const configData = [
      ['VRF System Design Report'],
      [''],
      ['System Configuration'],
      ['Parameter', 'Value'],
      ['System Name', system.system_name],
      ['System Tag', system.system_tag || 'N/A'],
      ['System Type', system.system_type === 'heat_recovery' ? 'Heat Recovery (3-Pipe)' : 'Heat Pump (2-Pipe)'],
      ['Refrigerant', system.refrigerant_type],
      ['Outdoor Unit Capacity (kW)', system.outdoor_unit_capacity_kw || 'N/A'],
      ['Outdoor Unit Capacity (Tons)', system.outdoor_unit_capacity_tons || 'N/A'],
      ['Outdoor Unit Model', system.outdoor_unit_model || 'N/A'],
      ['Manufacturer', system.outdoor_unit_manufacturer || 'N/A'],
      ['Number of ODUs', system.number_of_outdoor_units],
      ['Total Indoor Capacity (kW)', system.total_indoor_capacity_kw || 'N/A'],
      ['Capacity Ratio (%)', system.capacity_ratio ? (system.capacity_ratio * 100).toFixed(0) : 'N/A'],
      ['Max Piping Length (ft)', system.max_piping_length_ft || 'N/A'],
      ['Actual Piping Length (ft)', system.max_piping_length_actual_ft || 'N/A'],
      ['Max Elevation Diff (ft)', system.max_elevation_diff_ft || 'N/A'],
      ['Actual Elevation Diff (ft)', system.actual_elevation_diff_ft || 'N/A'],
      ['Oil Return Verified', system.oil_return_verified ? 'Yes' : 'No'],
      ['Status', system.status],
      ['Revision', system.revision],
    ];
    const wsConfig = XLSX.utils.aoa_to_sheet(configData);
    XLSX.utils.book_append_sheet(wb, wsConfig, 'System Configuration');

    // Indoor Units Sheet
    const iduHeaders = ['Tag', 'Type', 'Zone', 'Capacity (kW)', 'Capacity (BTU)', 'Liquid Size', 'Suction Size', 'Liquid Length (ft)', 'Suction Length (ft)', 'Elevation (ft)', 'Above ODU', 'Oil Return OK'];
    const iduData = indoorUnits.map(unit => [
      unit.unit_tag,
      unit.unit_type.replace(/_/g, ' '),
      unit.zone_name || '',
      unit.cooling_capacity_kw,
      unit.cooling_capacity_btu || unit.cooling_capacity_kw * 3412,
      unit.liquid_line_size_in ? getPipeSizeName(unit.liquid_line_size_in) : '',
      unit.suction_line_size_in ? getPipeSizeName(unit.suction_line_size_in) : '',
      unit.liquid_line_length_ft,
      unit.suction_line_length_ft || unit.liquid_line_length_ft,
      unit.elevation_from_outdoor_ft,
      unit.is_above_outdoor ? 'Yes' : 'No',
      unit.oil_return_ok ? 'Yes' : 'No',
    ]);
    const wsIDU = XLSX.utils.aoa_to_sheet([iduHeaders, ...iduData]);
    XLSX.utils.book_append_sheet(wb, wsIDU, 'Indoor Units');

    // Branch Selectors Sheet
    if (branchSelectors.length > 0) {
      const bsHeaders = ['Tag', 'Model', 'Capacity (kW)', 'Connected Units', 'Total Connected Capacity (kW)', 'Distance (ft)', 'Elevation (ft)', 'Liquid Size', 'Suction Size', 'Discharge Size'];
      const bsData = branchSelectors.map(bs => [
        bs.selector_tag,
        bs.selector_model || '',
        bs.capacity_kw || '',
        bs.connected_unit_count,
        bs.total_connected_capacity_kw || '',
        bs.distance_from_outdoor_ft || '',
        bs.elevation_from_outdoor_ft,
        bs.liquid_line_size_in ? getPipeSizeName(bs.liquid_line_size_in) : '',
        bs.suction_line_size_in ? getPipeSizeName(bs.suction_line_size_in) : '',
        bs.discharge_line_size_in ? getPipeSizeName(bs.discharge_line_size_in) : '',
      ]);
      const wsBS = XLSX.utils.aoa_to_sheet([bsHeaders, ...bsData]);
      XLSX.utils.book_append_sheet(wb, wsBS, 'Branch Selectors');
    }

    // Validation Sheet
    if (validationMessages.length > 0) {
      const valHeaders = ['Level', 'Message'];
      const valData = validationMessages.map(m => [m.level.toUpperCase(), m.message]);
      const wsVal = XLSX.utils.aoa_to_sheet([valHeaders, ...valData]);
      XLSX.utils.book_append_sheet(wb, wsVal, 'Validation');
    }

    // Piping Summary Sheet
    const pipingData = [
      ['Piping Summary'],
      [''],
      ['Metric', 'Value'],
      ['Total Liquid Line Length (ft)', system.total_liquid_line_length_ft || 'N/A'],
      ['Total Suction Line Length (ft)', system.total_suction_line_length_ft || 'N/A'],
      ['Total Indoor Units', indoorUnits.length],
      ['Total Branch Selectors', branchSelectors.length],
    ];
    const wsPiping = XLSX.utils.aoa_to_sheet(pipingData);
    XLSX.utils.book_append_sheet(wb, wsPiping, 'Piping Summary');

    XLSX.writeFile(wb, `VRF_Report_${system.system_tag || system.system_name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return { exportToPDF, exportToExcel };
}
