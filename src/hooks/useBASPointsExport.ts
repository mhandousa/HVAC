import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { GeneratedPointsList, GeneratedPoint } from './useBASPointsGenerator';

export type ExportFormat = 'excel' | 'csv' | 'pdf' | 'niagara' | 'metasys';

export interface ExportOptions {
  format: ExportFormat;
  includeArabic?: boolean;
  includeModbus?: boolean;
  includeBACnet?: boolean;
  groupByEquipment?: boolean;
  includeAlarms?: boolean;
}

export function useBASPointsExport() {
  const exportToExcel = useCallback((data: GeneratedPointsList, options: ExportOptions) => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['BAS Points List Summary', ''],
      ['', ''],
      ['Project Name', data.projectName],
      ['Generated At', new Date(data.generatedAt).toLocaleString()],
      ['Naming Convention', data.namingConvention],
      ['Total Equipment', data.totalEquipment],
      ['Total Points', data.totalPoints],
      ['', ''],
      ['Point Type Breakdown', ''],
      ['Analog Inputs (AI)', data.summary.aiCount],
      ['Analog Outputs (AO)', data.summary.aoCount],
      ['Binary Inputs (BI)', data.summary.biCount],
      ['Binary Outputs (BO)', data.summary.boCount],
      ['Analog Values (AV)', data.summary.avCount],
      ['Binary Values (BV)', data.summary.bvCount],
      ['Multi-State Values (MSV)', data.summary.msvCount],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ width: 25 }, { width: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // All Points Sheet
    const pointsHeaders = [
      'Point Name',
      'Equipment Tag',
      'Equipment Type',
      'Point Type',
      'Description',
      options.includeArabic ? 'Description (Arabic)' : null,
      'Unit',
      options.includeBACnet ? 'BACnet Object Type' : null,
      options.includeBACnet ? 'BACnet Instance' : null,
      options.includeModbus ? 'Modbus Address' : null,
      options.includeModbus ? 'Modbus Data Type' : null,
      'COV',
      'Range Min',
      'Range Max',
      'Alarm Low',
      'Alarm High',
      'Building',
      'Floor',
      'Zone',
    ].filter(Boolean);

    const pointsData = data.allPoints.map(point => [
      point.pointName,
      point.equipmentTag,
      point.equipmentType,
      point.pointType,
      point.description,
      options.includeArabic ? point.descriptionAr : null,
      point.unit,
      options.includeBACnet ? point.bacnetObjectType : null,
      options.includeBACnet ? point.bacnetInstance : null,
      options.includeModbus ? point.modbusAddress : null,
      options.includeModbus ? point.modbusDataType : null,
      point.cov ? 'Yes' : 'No',
      point.range?.min ?? '',
      point.range?.max ?? '',
      point.alarmLimits?.low ?? '',
      point.alarmLimits?.high ?? '',
      point.building ?? '',
      point.floor ?? '',
      point.zone ?? '',
    ].filter((_, i) => pointsHeaders[i] !== null));

    const pointsWs = XLSX.utils.aoa_to_sheet([pointsHeaders, ...pointsData]);
    pointsWs['!cols'] = pointsHeaders.map(() => ({ width: 18 }));
    XLSX.utils.book_append_sheet(wb, pointsWs, 'All Points');

    // BACnet Points Sheet
    if (options.includeBACnet) {
      const bacnetHeaders = [
        'Point Name',
        'Object Type',
        'Instance',
        'Description',
        'Unit',
        'COV',
        'Equipment Tag',
      ];
      const bacnetData = data.allPoints.map(point => [
        point.pointName,
        point.bacnetObjectType,
        point.bacnetInstance,
        point.description,
        point.unit,
        point.cov ? 'Yes' : 'No',
        point.equipmentTag,
      ]);
      const bacnetWs = XLSX.utils.aoa_to_sheet([bacnetHeaders, ...bacnetData]);
      bacnetWs['!cols'] = bacnetHeaders.map(() => ({ width: 18 }));
      XLSX.utils.book_append_sheet(wb, bacnetWs, 'BACnet Points');
    }

    // Modbus Points Sheet
    if (options.includeModbus) {
      const modbusHeaders = [
        'Point Name',
        'Register Address',
        'Data Type',
        'Register Count',
        'Description',
        'Unit',
        'Equipment Tag',
      ];
      const modbusData = data.allPoints
        .filter(p => p.modbusAddress !== undefined)
        .map(point => [
          point.pointName,
          point.modbusAddress,
          point.modbusDataType,
          point.modbusDataType === 'float32' ? 2 : 1,
          point.description,
          point.unit,
          point.equipmentTag,
        ]);
      const modbusWs = XLSX.utils.aoa_to_sheet([modbusHeaders, ...modbusData]);
      modbusWs['!cols'] = modbusHeaders.map(() => ({ width: 18 }));
      XLSX.utils.book_append_sheet(wb, modbusWs, 'Modbus Points');
    }

    // Alarm Points Sheet
    if (options.includeAlarms) {
      const alarmPoints = data.allPoints.filter(p => p.alarmLimits);
      const alarmHeaders = [
        'Point Name',
        'Equipment Tag',
        'Description',
        'Unit',
        'Low Limit',
        'High Limit',
        'Low-Low Limit',
        'High-High Limit',
      ];
      const alarmData = alarmPoints.map(point => [
        point.pointName,
        point.equipmentTag,
        point.description,
        point.unit,
        point.alarmLimits?.low ?? '',
        point.alarmLimits?.high ?? '',
        point.alarmLimits?.lowLow ?? '',
        point.alarmLimits?.highHigh ?? '',
      ]);
      const alarmWs = XLSX.utils.aoa_to_sheet([alarmHeaders, ...alarmData]);
      alarmWs['!cols'] = alarmHeaders.map(() => ({ width: 18 }));
      XLSX.utils.book_append_sheet(wb, alarmWs, 'Alarm Points');
    }

    // Equipment Summary Sheet
    const equipmentHeaders = ['Equipment Tag', 'Equipment Name', 'Type', 'Building', 'Floor', 'Zone', 'Point Count'];
    const equipmentData = data.pointsByEquipment.map(ep => [
      ep.equipment.tag,
      ep.equipment.name,
      ep.equipment.type,
      ep.equipment.building ?? '',
      ep.equipment.floor ?? '',
      ep.equipment.zone ?? '',
      ep.points.length,
    ]);
    const equipmentWs = XLSX.utils.aoa_to_sheet([equipmentHeaders, ...equipmentData]);
    equipmentWs['!cols'] = equipmentHeaders.map(() => ({ width: 18 }));
    XLSX.utils.book_append_sheet(wb, equipmentWs, 'Equipment');

    // Download
    const filename = `${data.projectName.replace(/[^a-z0-9]/gi, '_')}_BAS_Points_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, []);

  const exportToCSV = useCallback((data: GeneratedPointsList, options: ExportOptions) => {
    const headers = [
      'Point Name',
      'Equipment Tag',
      'Equipment Type',
      'Point Type',
      'Description',
      'Unit',
      'BACnet Object Type',
      'BACnet Instance',
      'Modbus Address',
      'Modbus Data Type',
    ];

    const rows = data.allPoints.map(point => [
      point.pointName,
      point.equipmentTag,
      point.equipmentType,
      point.pointType,
      `"${point.description}"`,
      point.unit,
      point.bacnetObjectType,
      point.bacnetInstance ?? '',
      point.modbusAddress ?? '',
      point.modbusDataType,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.projectName.replace(/[^a-z0-9]/gi, '_')}_BAS_Points.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportToPDF = useCallback((data: GeneratedPointsList, options: ExportOptions) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Title
    doc.setFontSize(18);
    doc.text('BAS Points List', 14, 15);
    
    // Project info
    doc.setFontSize(10);
    doc.text(`Project: ${data.projectName}`, 14, 25);
    doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 14, 30);
    doc.text(`Convention: ${data.namingConvention}`, 14, 35);
    doc.text(`Total Points: ${data.totalPoints}`, 14, 40);

    // Summary table
    autoTable(doc, {
      startY: 45,
      head: [['Point Type', 'Count']],
      body: [
        ['Analog Inputs (AI)', data.summary.aiCount],
        ['Analog Outputs (AO)', data.summary.aoCount],
        ['Binary Inputs (BI)', data.summary.biCount],
        ['Binary Outputs (BO)', data.summary.boCount],
        ['Analog Values (AV)', data.summary.avCount],
        ['Binary Values (BV)', data.summary.bvCount],
        ['Multi-State Values (MSV)', data.summary.msvCount],
        ['Total', data.totalPoints],
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14 },
      tableWidth: 80,
    });

    // Points table on new page
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Points List', 14, 15);

    const tableHeaders = ['Point Name', 'Tag', 'Type', 'PT', 'Description', 'Unit'];
    const tableBody = data.allPoints.map(point => [
      point.pointName,
      point.equipmentTag,
      point.equipmentType,
      point.pointType,
      point.description.substring(0, 40),
      point.unit,
    ]);

    autoTable(doc, {
      startY: 20,
      head: [tableHeaders],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 12 },
        4: { cellWidth: 60 },
        5: { cellWidth: 15 },
      },
    });

    doc.save(`${data.projectName.replace(/[^a-z0-9]/gi, '_')}_BAS_Points.pdf`);
  }, []);

  const exportToNiagara = useCallback((data: GeneratedPointsList, _options: ExportOptions) => {
    // Niagara N4 CSV import format
    const headers = [
      'Name',
      'Type',
      'Description',
      'Units',
      'Min',
      'Max',
    ];

    const niagaraTypeMap: Record<string, string> = {
      'AI': 'NumericPoint',
      'AO': 'NumericWritable',
      'BI': 'BooleanPoint',
      'BO': 'BooleanWritable',
      'AV': 'NumericPoint',
      'BV': 'BooleanPoint',
      'MSV': 'EnumPoint',
    };

    const rows = data.allPoints.map(point => [
      point.pointName,
      niagaraTypeMap[point.pointType] || 'NumericPoint',
      `"${point.description}"`,
      point.unit,
      point.range?.min ?? '',
      point.range?.max ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.projectName.replace(/[^a-z0-9]/gi, '_')}_Niagara_Import.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportToMetasys = useCallback((data: GeneratedPointsList, _options: ExportOptions) => {
    // Johnson Controls Metasys import format
    const headers = [
      'Point Name',
      'Point Type',
      'Description',
      'Engineering Units',
      'Low Limit',
      'High Limit',
      'Device',
    ];

    const metasysTypeMap: Record<string, string> = {
      'AI': 'AI',
      'AO': 'AO',
      'BI': 'BI',
      'BO': 'BO',
      'AV': 'AD',
      'BV': 'BD',
      'MSV': 'MSI',
    };

    const rows = data.allPoints.map(point => [
      point.pointName,
      metasysTypeMap[point.pointType] || 'AI',
      `"${point.description}"`,
      point.unit,
      point.range?.min ?? '',
      point.range?.max ?? '',
      point.equipmentTag,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.projectName.replace(/[^a-z0-9]/gi, '_')}_Metasys_Import.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportPoints = useCallback((data: GeneratedPointsList, options: ExportOptions) => {
    switch (options.format) {
      case 'excel':
        exportToExcel(data, options);
        break;
      case 'csv':
        exportToCSV(data, options);
        break;
      case 'pdf':
        exportToPDF(data, options);
        break;
      case 'niagara':
        exportToNiagara(data, options);
        break;
      case 'metasys':
        exportToMetasys(data, options);
        break;
    }
  }, [exportToExcel, exportToCSV, exportToPDF, exportToNiagara, exportToMetasys]);

  return {
    exportPoints,
    exportToExcel,
    exportToCSV,
    exportToPDF,
    exportToNiagara,
    exportToMetasys,
  };
}
