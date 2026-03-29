import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { HotWaterPlant } from './useHotWaterPlants';

interface BoilerConfigData {
  count: number;
  capacityPerUnitBtuh: number;
  totalCapacityBtuh: number;
  type: string;
  efficiency: number;
  redundancyMode?: string;
}

interface PumpConfigData {
  count: number;
  flowGpm: number;
  headFt: number;
  horsePower: number;
  type: string;
  vfd?: boolean;
}

interface ExpansionTankConfigData {
  volume_gal: number;
  acceptance_gal: number;
  fill_pressure_psi: number;
  operating_pressure_psi: number;
  manufacturer?: string;
  model?: string;
}

interface PipeConfigData {
  chw_supply_size_in: number;
  chw_return_size_in: number;
  material: string;
  insulation_in: number;
}

export function useHotWaterPlantExport() {
  const exportToPdf = useCallback((plant: HotWaterPlant, projectName?: string) => {
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // Header
    doc.setFillColor(220, 53, 69); // Red-orange for HW
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Hot Water Plant Report', margin, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth - margin - 60, 22);
    yPos = 45;

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Plant Info Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(plant.plant_name, margin, yPos);
    if (plant.plant_tag) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tag: ${plant.plant_tag}`, margin, yPos + 6);
    }
    if (projectName) {
      doc.text(`Project: ${projectName}`, margin, yPos + 12);
    }
    yPos += 25;

    // Design Parameters Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Design Parameters', margin, yPos);
    yPos += 5;

    const heatingLoadMbh = (plant.heating_load_btuh / 1000).toFixed(0);
    const heatingLoadKw = (plant.heating_load_btuh / 3412).toFixed(1);
    const deltaT = (plant.supply_temp_f || 180) - (plant.return_temp_f || 160);

    autoTable(doc, {
      startY: yPos,
      head: [['Parameter', 'Value', 'Unit']],
      body: [
        ['Heating Load', heatingLoadMbh, 'MBH'],
        ['Heating Load', heatingLoadKw, 'kW'],
        ['Supply Temperature', String(plant.supply_temp_f || 180), '°F'],
        ['Return Temperature', String(plant.return_temp_f || 160), '°F'],
        ['Design ΔT', String(deltaT), '°F'],
        ['Diversity Factor', String(plant.diversity_factor || 1.0), ''],
        ['Future Expansion', `${plant.future_expansion_percent || 0}`, '%'],
        ['Redundancy Mode', plant.redundancy_mode || 'N', ''],
        ['Status', plant.status || 'Draft', ''],
      ],
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Boiler Configuration
    const boilerConfig = plant.boiler_config as unknown as BoilerConfigData | null;
    if (boilerConfig && typeof boilerConfig === 'object') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Boiler Configuration', margin, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: [
          ['Boiler Type', plant.boiler_type || 'Condensing Gas'],
          ['Number of Boilers', String(plant.boiler_count || boilerConfig.count || 1)],
          ['Capacity per Unit', `${((boilerConfig.capacityPerUnitBtuh || 0) / 1000).toFixed(0)} MBH`],
          ['Total Capacity', `${((boilerConfig.totalCapacityBtuh || plant.heating_load_btuh) / 1000).toFixed(0)} MBH`],
          ['Efficiency (AFUE)', `${((boilerConfig.efficiency || 0.95) * 100).toFixed(1)}%`],
          ['Redundancy Mode', boilerConfig.redundancyMode || plant.redundancy_mode || 'N'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69] },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Pump Configuration
    const pumpConfig = plant.primary_pump_config as unknown as PumpConfigData | null;
    if (pumpConfig && typeof pumpConfig === 'object') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Pump Configuration', margin, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: [
          ['Pump Type', pumpConfig.type || 'Centrifugal'],
          ['Number of Pumps', String(pumpConfig.count || 1)],
          ['Flow Rate', `${pumpConfig.flowGpm?.toFixed(1) || '-'} GPM`],
          ['Total Head', `${pumpConfig.headFt?.toFixed(1) || '-'} ft`],
          ['Motor Size', `${pumpConfig.horsePower?.toFixed(1) || '-'} HP`],
          ['VFD', pumpConfig.vfd ? 'Yes' : 'No'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69] },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Expansion Tank
    const tankConfig = plant.expansion_tank_config as unknown as ExpansionTankConfigData | null;
    if (tankConfig && typeof tankConfig === 'object') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Expansion Tank', margin, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: [
          ['Tank Volume', `${tankConfig.volume_gal?.toFixed(1) || '-'} gal`],
          ['Acceptance Volume', `${tankConfig.acceptance_gal?.toFixed(1) || '-'} gal`],
          ['Fill Pressure', `${tankConfig.fill_pressure_psi?.toFixed(1) || '-'} psi`],
          ['Operating Pressure', `${tankConfig.operating_pressure_psi?.toFixed(1) || '-'} psi`],
          ['System Volume', `${plant.system_volume_gal || '-'} gal`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69] },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Notes
    if (plant.notes) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', margin, yPos);
      yPos += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(plant.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, yPos);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} | ${plant.plant_name} | ${format(new Date(), 'PP')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const filename = `hw-plant-${plant.plant_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}`;
    doc.save(`${filename}.pdf`);
    toast.success('Hot Water Plant report exported to PDF');
  }, []);

  const exportToExcel = useCallback((plant: HotWaterPlant, projectName?: string) => {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const deltaT = (plant.supply_temp_f || 180) - (plant.return_temp_f || 160);
    const summaryData = [
      ['Hot Water Plant Report'],
      ['Generated', format(new Date(), 'PPpp')],
      [''],
      ['Plant Information'],
      ['Plant Name', plant.plant_name],
      ['Plant Tag', plant.plant_tag || '-'],
      ['Project', projectName || '-'],
      ['Status', plant.status || 'Draft'],
      [''],
      ['Design Parameters'],
      ['Heating Load (MBH)', (plant.heating_load_btuh / 1000).toFixed(0)],
      ['Heating Load (kW)', (plant.heating_load_btuh / 3412).toFixed(1)],
      ['Supply Temperature (°F)', plant.supply_temp_f || 180],
      ['Return Temperature (°F)', plant.return_temp_f || 160],
      ['Design ΔT (°F)', deltaT],
      ['Diversity Factor', plant.diversity_factor || 1.0],
      ['Future Expansion (%)', plant.future_expansion_percent || 0],
      ['Redundancy Mode', plant.redundancy_mode || 'N'],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Boilers Sheet
    const boilerConfig = plant.boiler_config as unknown as BoilerConfigData | null;
    if (boilerConfig && typeof boilerConfig === 'object') {
      const boilerData = [
        ['Boiler Configuration'],
        [''],
        ['Parameter', 'Value'],
        ['Boiler Type', plant.boiler_type || 'Condensing Gas'],
        ['Number of Boilers', plant.boiler_count || boilerConfig.count || 1],
        ['Capacity per Unit (MBH)', ((boilerConfig.capacityPerUnitBtuh || 0) / 1000).toFixed(0)],
        ['Total Capacity (MBH)', ((boilerConfig.totalCapacityBtuh || plant.heating_load_btuh) / 1000).toFixed(0)],
        ['Efficiency (AFUE)', `${((boilerConfig.efficiency || 0.95) * 100).toFixed(1)}%`],
        ['Redundancy Mode', boilerConfig.redundancyMode || plant.redundancy_mode || 'N'],
      ];
      const boilerSheet = XLSX.utils.aoa_to_sheet(boilerData);
      boilerSheet['!cols'] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, boilerSheet, 'Boilers');
    }

    // Pumps Sheet
    const pumpConfig = plant.primary_pump_config as unknown as PumpConfigData | null;
    if (pumpConfig && typeof pumpConfig === 'object') {
      const pumpData = [
        ['Pump Configuration'],
        [''],
        ['Parameter', 'Value'],
        ['Pump Type', pumpConfig.type || 'Centrifugal'],
        ['Number of Pumps', pumpConfig.count || 1],
        ['Flow Rate (GPM)', pumpConfig.flowGpm?.toFixed(1) || '-'],
        ['Total Head (ft)', pumpConfig.headFt?.toFixed(1) || '-'],
        ['Motor Size (HP)', pumpConfig.horsePower?.toFixed(1) || '-'],
        ['VFD', pumpConfig.vfd ? 'Yes' : 'No'],
      ];
      const pumpSheet = XLSX.utils.aoa_to_sheet(pumpData);
      pumpSheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, pumpSheet, 'Pumps');
    }

    // Expansion Tank Sheet
    const tankConfig = plant.expansion_tank_config as unknown as ExpansionTankConfigData | null;
    if (tankConfig && typeof tankConfig === 'object') {
      const tankData = [
        ['Expansion Tank'],
        [''],
        ['Parameter', 'Value'],
        ['Tank Volume (gal)', tankConfig.volume_gal?.toFixed(1) || '-'],
        ['Acceptance Volume (gal)', tankConfig.acceptance_gal?.toFixed(1) || '-'],
        ['Fill Pressure (psi)', tankConfig.fill_pressure_psi?.toFixed(1) || '-'],
        ['Operating Pressure (psi)', tankConfig.operating_pressure_psi?.toFixed(1) || '-'],
        ['System Volume (gal)', plant.system_volume_gal || '-'],
      ];
      const tankSheet = XLSX.utils.aoa_to_sheet(tankData);
      tankSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, tankSheet, 'Expansion Tank');
    }

    const filename = `hw-plant-${plant.plant_name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Hot Water Plant report exported to Excel');
  }, []);

  return { exportToPdf, exportToExcel };
}
