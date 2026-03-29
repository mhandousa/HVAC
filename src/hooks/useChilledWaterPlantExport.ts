import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ChilledWaterPlant } from './useChilledWaterPlants';

export function useChilledWaterPlantExport() {
  
  const exportToPdf = (plant: ChilledWaterPlant, projectName?: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Chilled Water Plant Sizing Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Plant info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Plant Name: ${plant.plant_name}`, 14, yPos);
    yPos += 7;
    if (plant.plant_tag) {
      doc.text(`Plant Tag: ${plant.plant_tag}`, 14, yPos);
      yPos += 7;
    }
    if (projectName) {
      doc.text(`Project: ${projectName}`, 14, yPos);
      yPos += 7;
    }
    doc.text(`Status: ${plant.status?.toUpperCase() || 'DRAFT'}`, 14, yPos);
    doc.text(`Revision: ${plant.revision || 'A'}`, 100, yPos);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, yPos);
    yPos += 15;
    
    // Design Parameters
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Design Parameters', 14, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Parameter', 'Value', 'Unit']],
      body: [
        ['Design Cooling Load', plant.design_cooling_load_tons.toString(), 'Tons'],
        ['Diversity Factor', (plant.diversity_factor || 1.0).toString(), '-'],
        ['Future Expansion', `${plant.future_expansion_percent || 0}`, '%'],
        ['CHW Supply Temperature', (plant.chw_supply_temp_f || 44).toString(), '°F'],
        ['CHW Return Temperature', (plant.chw_return_temp_f || 54).toString(), '°F'],
        ['CHW Delta-T', (plant.chw_delta_t_f || 10).toString(), '°F'],
        ['CW Supply Temperature', (plant.cw_supply_temp_f || 85).toString(), '°F'],
        ['CW Return Temperature', (plant.cw_return_temp_f || 95).toString(), '°F'],
        ['CW Delta-T', (plant.cw_delta_t_f || 10).toString(), '°F'],
        ['Pumping Configuration', plant.pumping_config?.replace('-', ' ').toUpperCase() || 'PRIMARY-SECONDARY', '-'],
        ['Redundancy Mode', plant.redundancy_mode?.toUpperCase() || 'N+1', '-'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // Chiller Configuration
    if (plant.chiller_config && Object.keys(plant.chiller_config).length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Chiller Configuration', 14, yPos);
      yPos += 8;
      
      const chillerConfig = plant.chiller_config;
      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: [
          ['Chiller Type', chillerConfig.chillerType?.replace('-', ' ').toUpperCase() || 'WATER-COOLED'],
          ['Number of Chillers', chillerConfig.numberOfChillers?.toString() || '-'],
          ['Capacity per Chiller', `${chillerConfig.capacityPerChillerTons || '-'} Tons`],
          ['Total Installed Capacity', `${chillerConfig.totalInstalledCapacityTons || '-'} Tons`],
          ['Part Load at Design', `${chillerConfig.partLoadAtDesign || '-'}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }
    
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    // Pump Configuration
    const pumps = [
      { name: 'Primary Pumps', config: plant.primary_pump_config },
      { name: 'Secondary Pumps', config: plant.secondary_pump_config },
      { name: 'Condenser Pumps', config: plant.condenser_pump_config },
    ].filter(p => p.config && Object.keys(p.config).length > 0);
    
    if (pumps.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Pump Configuration', 14, yPos);
      yPos += 8;
      
      const pumpData = pumps.map(p => [
        p.name,
        p.config?.numberOfPumps?.toString() || '-',
        `${p.config?.flowPerPumpGpm || '-'} GPM`,
        `${p.config?.headFt || '-'} ft`,
        `${p.config?.motorHp || '-'} HP`,
        p.config?.hasVfd ? 'Yes' : 'No',
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Pump Type', 'Qty', 'Flow/Pump', 'Head', 'Motor', 'VFD']],
        body: pumpData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }
    
    // Cooling Tower Configuration
    if (plant.cooling_tower_config && Object.keys(plant.cooling_tower_config).length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Cooling Tower Configuration', 14, yPos);
      yPos += 8;
      
      const towerConfig = plant.cooling_tower_config;
      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: [
          ['Number of Cells', towerConfig.numberOfCells?.toString() || '-'],
          ['Capacity per Cell', `${towerConfig.capacityPerCellTons || '-'} Tons`],
          ['Total Capacity', `${towerConfig.totalCapacityTons || '-'} Tons`],
          ['Approach', `${towerConfig.approachF || '-'} °F`],
          ['Range', `${towerConfig.rangeF || '-'} °F`],
          ['Design Wet Bulb', `${towerConfig.designWetBulbF || '-'} °F`],
          ['Total Fan Power', `${towerConfig.totalFanKw || '-'} kW`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }
    
    // Header Pipe Sizes
    if (plant.header_pipe_config && Object.keys(plant.header_pipe_config).length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Header Pipe Sizes', 14, yPos);
      yPos += 8;
      
      const pipeConfig = plant.header_pipe_config;
      autoTable(doc, {
        startY: yPos,
        head: [['Header', 'Size (in)']],
        body: [
          ['CHW Supply', pipeConfig.chwSupplySize?.toString() || '-'],
          ['CHW Return', pipeConfig.chwReturnSize?.toString() || '-'],
          ['CW Supply', pipeConfig.cwSupplySize?.toString() || '-'],
          ['CW Return', pipeConfig.cwReturnSize?.toString() || '-'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }
    
    // Notes
    if (plant.notes) {
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(plant.notes, pageWidth - 28);
      doc.text(splitNotes, 14, yPos);
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save
    const fileName = `CHW_Plant_${plant.plant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };
  
  const exportToExcel = (plant: ChilledWaterPlant, projectName?: string) => {
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Chilled Water Plant Sizing Report'],
      [],
      ['Plant Information'],
      ['Plant Name', plant.plant_name],
      ['Plant Tag', plant.plant_tag || '-'],
      ['Project', projectName || '-'],
      ['Status', plant.status?.toUpperCase() || 'DRAFT'],
      ['Revision', plant.revision || 'A'],
      ['Date', new Date().toLocaleDateString()],
      [],
      ['Design Parameters'],
      ['Design Cooling Load (Tons)', plant.design_cooling_load_tons],
      ['Diversity Factor', plant.diversity_factor || 1.0],
      ['Future Expansion (%)', plant.future_expansion_percent || 0],
      ['CHW Supply Temp (°F)', plant.chw_supply_temp_f || 44],
      ['CHW Return Temp (°F)', plant.chw_return_temp_f || 54],
      ['CHW Delta-T (°F)', plant.chw_delta_t_f || 10],
      ['CW Supply Temp (°F)', plant.cw_supply_temp_f || 85],
      ['CW Return Temp (°F)', plant.cw_return_temp_f || 95],
      ['CW Delta-T (°F)', plant.cw_delta_t_f || 10],
      ['Pumping Configuration', plant.pumping_config?.replace('-', ' ').toUpperCase() || 'PRIMARY-SECONDARY'],
      ['Redundancy Mode', plant.redundancy_mode?.toUpperCase() || 'N+1'],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Chillers Sheet
    if (plant.chiller_config && Object.keys(plant.chiller_config).length > 0) {
      const chillerData = [
        ['Chiller Configuration'],
        [],
        ['Parameter', 'Value'],
        ['Chiller Type', plant.chiller_config.chillerType?.replace('-', ' ').toUpperCase() || 'WATER-COOLED'],
        ['Number of Chillers', plant.chiller_config.numberOfChillers || '-'],
        ['Capacity per Chiller (Tons)', plant.chiller_config.capacityPerChillerTons || '-'],
        ['Total Installed Capacity (Tons)', plant.chiller_config.totalInstalledCapacityTons || '-'],
        ['Redundancy Mode', plant.chiller_config.redundancyMode?.toUpperCase() || '-'],
        ['Part Load at Design (%)', plant.chiller_config.partLoadAtDesign || '-'],
      ];
      
      const chillerSheet = XLSX.utils.aoa_to_sheet(chillerData);
      XLSX.utils.book_append_sheet(wb, chillerSheet, 'Chillers');
    }
    
    // Pumps Sheet
    const pumpData = [
      ['Pump Configuration'],
      [],
      ['Pump Type', 'Quantity', 'Flow/Pump (GPM)', 'Head (ft)', 'Motor (HP)', 'Motor (kW)', 'VFD', 'Redundancy'],
    ];
    
    if (plant.primary_pump_config && Object.keys(plant.primary_pump_config).length > 0) {
      const p = plant.primary_pump_config;
      pumpData.push(['Primary', p.numberOfPumps, p.flowPerPumpGpm, p.headFt, p.motorHp, p.motorKw, p.hasVfd ? 'Yes' : 'No', p.redundancy ? 'Yes' : 'No'] as unknown as string[]);
    }
    if (plant.secondary_pump_config && Object.keys(plant.secondary_pump_config).length > 0) {
      const p = plant.secondary_pump_config;
      pumpData.push(['Secondary', p.numberOfPumps, p.flowPerPumpGpm, p.headFt, p.motorHp, p.motorKw, p.hasVfd ? 'Yes' : 'No', p.redundancy ? 'Yes' : 'No'] as unknown as string[]);
    }
    if (plant.condenser_pump_config && Object.keys(plant.condenser_pump_config).length > 0) {
      const p = plant.condenser_pump_config;
      pumpData.push(['Condenser', p.numberOfPumps, p.flowPerPumpGpm, p.headFt, p.motorHp, p.motorKw, p.hasVfd ? 'Yes' : 'No', p.redundancy ? 'Yes' : 'No'] as unknown as string[]);
    }
    
    if (pumpData.length > 3) {
      const pumpSheet = XLSX.utils.aoa_to_sheet(pumpData);
      XLSX.utils.book_append_sheet(wb, pumpSheet, 'Pumps');
    }
    
    // Cooling Towers Sheet
    if (plant.cooling_tower_config && Object.keys(plant.cooling_tower_config).length > 0) {
      const t = plant.cooling_tower_config;
      const towerData = [
        ['Cooling Tower Configuration'],
        [],
        ['Parameter', 'Value'],
        ['Number of Cells', t.numberOfCells || '-'],
        ['Capacity per Cell (Tons)', t.capacityPerCellTons || '-'],
        ['Total Capacity (Tons)', t.totalCapacityTons || '-'],
        ['Approach (°F)', t.approachF || '-'],
        ['Range (°F)', t.rangeF || '-'],
        ['Design Wet Bulb (°F)', t.designWetBulbF || '-'],
        ['Fan HP per Cell', t.fanHpPerCell || '-'],
        ['Total Fan Power (kW)', t.totalFanKw || '-'],
      ];
      
      const towerSheet = XLSX.utils.aoa_to_sheet(towerData);
      XLSX.utils.book_append_sheet(wb, towerSheet, 'Cooling Towers');
    }
    
    // Piping Sheet
    if (plant.header_pipe_config && Object.keys(plant.header_pipe_config).length > 0) {
      const h = plant.header_pipe_config;
      const pipingData = [
        ['Header Pipe Sizes'],
        [],
        ['Header', 'Size (in)'],
        ['CHW Supply', h.chwSupplySize || '-'],
        ['CHW Return', h.chwReturnSize || '-'],
        ['CW Supply', h.cwSupplySize || '-'],
        ['CW Return', h.cwReturnSize || '-'],
        [],
        ['Flow Rates'],
        ['Primary CHW Flow (GPM)', plant.total_primary_flow_gpm || '-'],
        ['Secondary CHW Flow (GPM)', plant.total_secondary_flow_gpm || '-'],
        ['Condenser Water Flow (GPM)', plant.total_condenser_flow_gpm || '-'],
      ];
      
      const pipingSheet = XLSX.utils.aoa_to_sheet(pipingData);
      XLSX.utils.book_append_sheet(wb, pipingSheet, 'Piping');
    }
    
    // Save
    const fileName = `CHW_Plant_${plant.plant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  
  return { exportToPdf, exportToExcel };
}
