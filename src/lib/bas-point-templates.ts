// BAS Point Templates for Saudi Arabia Building Projects
// Standard control points by equipment type with BACnet/Modbus support

export interface BASPoint {
  pointName: string;
  pointType: 'AI' | 'AO' | 'BI' | 'BO' | 'AV' | 'BV' | 'MSV';
  description: string;
  descriptionAr: string;
  unit: string;
  defaultValue?: number | boolean | string;
  range?: { min: number; max: number };
  alarmLimits?: { low?: number; high?: number; lowLow?: number; highHigh?: number };
  protocol: 'bacnet' | 'modbus' | 'both';
  bacnetObjectType: string;
  modbusDataType: 'int16' | 'uint16' | 'float32' | 'bool';
  cov: boolean;
  priority?: number;
  equipmentId?: string;
  equipmentTag?: string;
  modbusAddress?: number;
}

export interface PointTemplate {
  id: string;
  name: string;
  nameAr: string;
  type: BASPoint['pointType'];
  description: string;
  descriptionAr: string;
  unit: string;
  defaultIncluded: boolean;
  protocol: 'bacnet' | 'modbus' | 'both';
  bacnetObjectType: string;
  modbusDataType: 'int16' | 'uint16' | 'float32' | 'bool';
  cov: boolean;
  range?: { min: number; max: number };
  alarmLimits?: { low?: number; high?: number };
}

export interface EquipmentPointTemplate {
  equipmentType: string;
  equipmentTypeAr: string;
  category: string;
  points: PointTemplate[];
}

export const EQUIPMENT_POINT_TEMPLATES: EquipmentPointTemplate[] = [
  {
    equipmentType: 'AHU',
    equipmentTypeAr: 'وحدة مناولة الهواء',
    category: 'Air Handling',
    points: [
      { id: 'SF_SS', name: 'Supply Fan Status', nameAr: 'حالة مروحة التزويد', type: 'BI', description: 'Supply fan running status', descriptionAr: 'حالة تشغيل مروحة التزويد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'SF_CMD', name: 'Supply Fan Command', nameAr: 'أمر مروحة التزويد', type: 'BO', description: 'Supply fan start/stop command', descriptionAr: 'أمر تشغيل/إيقاف مروحة التزويد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'SF_SPD', name: 'Supply Fan Speed', nameAr: 'سرعة مروحة التزويد', type: 'AO', description: 'Supply fan speed command', descriptionAr: 'أمر سرعة مروحة التزويد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'SF_SPD_FB', name: 'Supply Fan Speed Feedback', nameAr: 'تغذية راجعة لسرعة المروحة', type: 'AI', description: 'Supply fan actual speed', descriptionAr: 'السرعة الفعلية لمروحة التزويد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'RF_SS', name: 'Return Fan Status', nameAr: 'حالة مروحة الراجع', type: 'BI', description: 'Return fan running status', descriptionAr: 'حالة تشغيل مروحة الراجع', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'RF_CMD', name: 'Return Fan Command', nameAr: 'أمر مروحة الراجع', type: 'BO', description: 'Return fan start/stop command', descriptionAr: 'أمر تشغيل/إيقاف مروحة الراجع', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'RF_SPD', name: 'Return Fan Speed', nameAr: 'سرعة مروحة الراجع', type: 'AO', description: 'Return fan speed command', descriptionAr: 'أمر سرعة مروحة الراجع', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'SA_TEMP', name: 'Supply Air Temperature', nameAr: 'درجة حرارة هواء التزويد', type: 'AI', description: 'Supply air temperature', descriptionAr: 'درجة حرارة هواء التزويد', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 10, max: 35 }, alarmLimits: { low: 12, high: 28 } },
      { id: 'SA_TEMP_SP', name: 'Supply Air Temp Setpoint', nameAr: 'نقطة ضبط درجة حرارة التزويد', type: 'AV', description: 'Supply air temperature setpoint', descriptionAr: 'نقطة ضبط درجة حرارة هواء التزويد', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false, range: { min: 10, max: 30 } },
      { id: 'RA_TEMP', name: 'Return Air Temperature', nameAr: 'درجة حرارة هواء الراجع', type: 'AI', description: 'Return air temperature', descriptionAr: 'درجة حرارة هواء الراجع', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 15, max: 35 } },
      { id: 'OA_TEMP', name: 'Outside Air Temperature', nameAr: 'درجة حرارة الهواء الخارجي', type: 'AI', description: 'Outside air temperature', descriptionAr: 'درجة حرارة الهواء الخارجي', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: -10, max: 55 } },
      { id: 'MA_TEMP', name: 'Mixed Air Temperature', nameAr: 'درجة حرارة الهواء المختلط', type: 'AI', description: 'Mixed air temperature', descriptionAr: 'درجة حرارة الهواء المختلط', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 10, max: 45 } },
      { id: 'CHW_VLV', name: 'Chilled Water Valve', nameAr: 'صمام الماء المبرد', type: 'AO', description: 'Chilled water valve position', descriptionAr: 'وضع صمام الماء المبرد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'CHW_VLV_FB', name: 'CHW Valve Feedback', nameAr: 'تغذية راجعة لصمام الماء المبرد', type: 'AI', description: 'Chilled water valve feedback', descriptionAr: 'التغذية الراجعة لصمام الماء المبرد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'HW_VLV', name: 'Hot Water Valve', nameAr: 'صمام الماء الساخن', type: 'AO', description: 'Hot water valve position', descriptionAr: 'وضع صمام الماء الساخن', unit: '%', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'OA_DMP', name: 'Outside Air Damper', nameAr: 'مخمد الهواء الخارجي', type: 'AO', description: 'Outside air damper position', descriptionAr: 'وضع مخمد الهواء الخارجي', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'RA_DMP', name: 'Return Air Damper', nameAr: 'مخمد هواء الراجع', type: 'AO', description: 'Return air damper position', descriptionAr: 'وضع مخمد هواء الراجع', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'EA_DMP', name: 'Exhaust Air Damper', nameAr: 'مخمد هواء العادم', type: 'AO', description: 'Exhaust air damper position', descriptionAr: 'وضع مخمد هواء العادم', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'FLT_DP', name: 'Filter Differential Pressure', nameAr: 'فرق ضغط الفلتر', type: 'AI', description: 'Filter differential pressure', descriptionAr: 'فرق الضغط عبر الفلتر', unit: 'Pa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 500 }, alarmLimits: { high: 350 } },
      { id: 'FLT_ALM', name: 'Filter Alarm', nameAr: 'إنذار الفلتر', type: 'BI', description: 'Filter dirty alarm', descriptionAr: 'إنذار اتساخ الفلتر', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'SMK_DET', name: 'Smoke Detector', nameAr: 'كاشف الدخان', type: 'BI', description: 'Smoke detector status', descriptionAr: 'حالة كاشف الدخان', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'SA_PRESS', name: 'Supply Air Pressure', nameAr: 'ضغط هواء التزويد', type: 'AI', description: 'Supply duct static pressure', descriptionAr: 'الضغط الساكن لمجرى التزويد', unit: 'Pa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 1000 } },
      { id: 'SA_PRESS_SP', name: 'SA Pressure Setpoint', nameAr: 'نقطة ضبط ضغط التزويد', type: 'AV', description: 'Supply duct pressure setpoint', descriptionAr: 'نقطة ضبط ضغط مجرى التزويد', unit: 'Pa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false, range: { min: 100, max: 500 } },
      { id: 'OCC_MODE', name: 'Occupancy Mode', nameAr: 'وضع الإشغال', type: 'MSV', description: 'Occupancy mode (Occupied/Unoccupied/Standby)', descriptionAr: 'وضع الإشغال (مشغول/غير مشغول/استعداد)', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
      { id: 'SYS_ALM', name: 'System Alarm', nameAr: 'إنذار النظام', type: 'BI', description: 'General system alarm', descriptionAr: 'إنذار النظام العام', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
    ]
  },
  {
    equipmentType: 'Chiller',
    equipmentTypeAr: 'مبرد الماء',
    category: 'Cooling',
    points: [
      { id: 'CH_SS', name: 'Chiller Status', nameAr: 'حالة المبرد', type: 'BI', description: 'Chiller running status', descriptionAr: 'حالة تشغيل المبرد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'CH_CMD', name: 'Chiller Command', nameAr: 'أمر المبرد', type: 'BO', description: 'Chiller start/stop command', descriptionAr: 'أمر تشغيل/إيقاف المبرد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'CH_LOAD', name: 'Chiller Load', nameAr: 'حمل المبرد', type: 'AI', description: 'Chiller load percentage', descriptionAr: 'نسبة حمل المبرد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'CHWS_TEMP', name: 'CHW Supply Temperature', nameAr: 'درجة حرارة تزويد الماء المبرد', type: 'AI', description: 'Chilled water supply temperature', descriptionAr: 'درجة حرارة تزويد الماء المبرد', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 3, max: 15 }, alarmLimits: { low: 4, high: 12 } },
      { id: 'CHWS_TEMP_SP', name: 'CHWS Temp Setpoint', nameAr: 'نقطة ضبط درجة حرارة التزويد', type: 'AV', description: 'CHW supply temperature setpoint', descriptionAr: 'نقطة ضبط درجة حرارة تزويد الماء المبرد', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false, range: { min: 4, max: 12 } },
      { id: 'CHWR_TEMP', name: 'CHW Return Temperature', nameAr: 'درجة حرارة راجع الماء المبرد', type: 'AI', description: 'Chilled water return temperature', descriptionAr: 'درجة حرارة راجع الماء المبرد', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 8, max: 20 } },
      { id: 'CWS_TEMP', name: 'Condenser Water Supply Temp', nameAr: 'درجة حرارة تزويد ماء المكثف', type: 'AI', description: 'Condenser water supply temperature', descriptionAr: 'درجة حرارة تزويد ماء المكثف', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 20, max: 45 } },
      { id: 'CWR_TEMP', name: 'Condenser Water Return Temp', nameAr: 'درجة حرارة راجع ماء المكثف', type: 'AI', description: 'Condenser water return temperature', descriptionAr: 'درجة حرارة راجع ماء المكثف', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 25, max: 50 } },
      { id: 'EVAP_DP', name: 'Evaporator Delta P', nameAr: 'فرق ضغط المبخر', type: 'AI', description: 'Evaporator differential pressure', descriptionAr: 'فرق الضغط عبر المبخر', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 200 } },
      { id: 'COND_DP', name: 'Condenser Delta P', nameAr: 'فرق ضغط المكثف', type: 'AI', description: 'Condenser differential pressure', descriptionAr: 'فرق الضغط عبر المكثف', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 200 } },
      { id: 'COMP_AMP', name: 'Compressor Amps', nameAr: 'أمبير الضاغط', type: 'AI', description: 'Compressor current draw', descriptionAr: 'سحب تيار الضاغط', unit: 'A', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 500 } },
      { id: 'EVAP_PRESS', name: 'Evaporator Pressure', nameAr: 'ضغط المبخر', type: 'AI', description: 'Evaporator refrigerant pressure', descriptionAr: 'ضغط مبرد المبخر', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'COND_PRESS', name: 'Condenser Pressure', nameAr: 'ضغط المكثف', type: 'AI', description: 'Condenser refrigerant pressure', descriptionAr: 'ضغط مبرد المكثف', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'OIL_PRESS', name: 'Oil Pressure', nameAr: 'ضغط الزيت', type: 'AI', description: 'Compressor oil pressure', descriptionAr: 'ضغط زيت الضاغط', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'OIL_TEMP', name: 'Oil Temperature', nameAr: 'درجة حرارة الزيت', type: 'AI', description: 'Compressor oil temperature', descriptionAr: 'درجة حرارة زيت الضاغط', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'RUN_HRS', name: 'Running Hours', nameAr: 'ساعات التشغيل', type: 'AI', description: 'Total running hours', descriptionAr: 'إجمالي ساعات التشغيل', unit: 'hrs', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: false },
      { id: 'ALARM', name: 'General Alarm', nameAr: 'إنذار عام', type: 'BI', description: 'General chiller alarm', descriptionAr: 'إنذار المبرد العام', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'FAULT', name: 'Fault Status', nameAr: 'حالة العطل', type: 'BI', description: 'Chiller fault status', descriptionAr: 'حالة عطل المبرد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'MODE', name: 'Operating Mode', nameAr: 'وضع التشغيل', type: 'MSV', description: 'Chiller operating mode', descriptionAr: 'وضع تشغيل المبرد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
    ]
  },
  {
    equipmentType: 'FCU',
    equipmentTypeAr: 'وحدة ملف المروحة',
    category: 'Terminal Units',
    points: [
      { id: 'FCU_SS', name: 'FCU Status', nameAr: 'حالة الوحدة', type: 'BI', description: 'FCU running status', descriptionAr: 'حالة تشغيل الوحدة', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'FCU_CMD', name: 'FCU Command', nameAr: 'أمر الوحدة', type: 'BO', description: 'FCU on/off command', descriptionAr: 'أمر تشغيل/إيقاف الوحدة', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'FAN_SPD', name: 'Fan Speed', nameAr: 'سرعة المروحة', type: 'MSV', description: 'Fan speed (Low/Med/High/Auto)', descriptionAr: 'سرعة المروحة (منخفض/متوسط/عالي/تلقائي)', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
      { id: 'SA_TEMP', name: 'Supply Air Temperature', nameAr: 'درجة حرارة هواء التزويد', type: 'AI', description: 'Supply air temperature', descriptionAr: 'درجة حرارة هواء التزويد', unit: '°C', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'CHW_VLV', name: 'Chilled Water Valve', nameAr: 'صمام الماء المبرد', type: 'AO', description: 'Chilled water valve position', descriptionAr: 'وضع صمام الماء المبرد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'HW_VLV', name: 'Hot Water Valve', nameAr: 'صمام الماء الساخن', type: 'AO', description: 'Hot water valve position', descriptionAr: 'وضع صمام الماء الساخن', unit: '%', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'ROOM_TEMP', name: 'Room Temperature', nameAr: 'درجة حرارة الغرفة', type: 'AI', description: 'Room temperature', descriptionAr: 'درجة حرارة الغرفة', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 15, max: 35 } },
      { id: 'ROOM_SP', name: 'Room Setpoint', nameAr: 'نقطة ضبط الغرفة', type: 'AV', description: 'Room temperature setpoint', descriptionAr: 'نقطة ضبط درجة حرارة الغرفة', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false, range: { min: 18, max: 28 } },
      { id: 'OCC_SENS', name: 'Occupancy Sensor', nameAr: 'حساس الإشغال', type: 'BI', description: 'Occupancy sensor status', descriptionAr: 'حالة حساس الإشغال', unit: '', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'MODE', name: 'Operating Mode', nameAr: 'وضع التشغيل', type: 'MSV', description: 'Mode (Cool/Heat/Fan/Auto)', descriptionAr: 'الوضع (تبريد/تدفئة/مروحة/تلقائي)', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
      { id: 'FLT_ALM', name: 'Filter Alarm', nameAr: 'إنذار الفلتر', type: 'BI', description: 'Filter dirty alarm', descriptionAr: 'إنذار اتساخ الفلتر', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
    ]
  },
  {
    equipmentType: 'VRF',
    equipmentTypeAr: 'نظام التدفق المتغير للمبرد',
    category: 'VRF Systems',
    points: [
      { id: 'ODU_SS', name: 'Outdoor Unit Status', nameAr: 'حالة الوحدة الخارجية', type: 'BI', description: 'Outdoor unit running status', descriptionAr: 'حالة تشغيل الوحدة الخارجية', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'ODU_CMD', name: 'Outdoor Unit Command', nameAr: 'أمر الوحدة الخارجية', type: 'BO', description: 'Outdoor unit on/off command', descriptionAr: 'أمر تشغيل/إيقاف الوحدة الخارجية', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'IDU_SS', name: 'Indoor Unit Status', nameAr: 'حالة الوحدة الداخلية', type: 'BI', description: 'Indoor unit running status', descriptionAr: 'حالة تشغيل الوحدة الداخلية', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'IDU_CMD', name: 'Indoor Unit Command', nameAr: 'أمر الوحدة الداخلية', type: 'BO', description: 'Indoor unit on/off command', descriptionAr: 'أمر تشغيل/إيقاف الوحدة الداخلية', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'COMP_SPD', name: 'Compressor Speed', nameAr: 'سرعة الضاغط', type: 'AI', description: 'Compressor speed percentage', descriptionAr: 'نسبة سرعة الضاغط', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'ROOM_TEMP', name: 'Room Temperature', nameAr: 'درجة حرارة الغرفة', type: 'AI', description: 'Room temperature', descriptionAr: 'درجة حرارة الغرفة', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 15, max: 35 } },
      { id: 'ROOM_SP', name: 'Room Setpoint', nameAr: 'نقطة ضبط الغرفة', type: 'AV', description: 'Room temperature setpoint', descriptionAr: 'نقطة ضبط درجة حرارة الغرفة', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false, range: { min: 18, max: 28 } },
      { id: 'MODE', name: 'Operating Mode', nameAr: 'وضع التشغيل', type: 'MSV', description: 'Mode (Cool/Heat/Fan/Auto/Dry)', descriptionAr: 'الوضع (تبريد/تدفئة/مروحة/تلقائي/تجفيف)', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
      { id: 'FAN_SPD', name: 'Fan Speed', nameAr: 'سرعة المروحة', type: 'MSV', description: 'Fan speed setting', descriptionAr: 'إعداد سرعة المروحة', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
      { id: 'REFR_PRESS_H', name: 'High Pressure', nameAr: 'الضغط العالي', type: 'AI', description: 'High side refrigerant pressure', descriptionAr: 'ضغط المبرد في الجانب العالي', unit: 'MPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'REFR_PRESS_L', name: 'Low Pressure', nameAr: 'الضغط المنخفض', type: 'AI', description: 'Low side refrigerant pressure', descriptionAr: 'ضغط المبرد في الجانب المنخفض', unit: 'MPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'OA_TEMP', name: 'Outdoor Temperature', nameAr: 'درجة حرارة الخارج', type: 'AI', description: 'Outdoor ambient temperature', descriptionAr: 'درجة حرارة الجو الخارجي', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'ERR_CODE', name: 'Error Code', nameAr: 'رمز الخطأ', type: 'AI', description: 'System error code', descriptionAr: 'رمز خطأ النظام', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'int16', cov: true },
      { id: 'ALARM', name: 'General Alarm', nameAr: 'إنذار عام', type: 'BI', description: 'General system alarm', descriptionAr: 'إنذار النظام العام', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
    ]
  },
  {
    equipmentType: 'Cooling Tower',
    equipmentTypeAr: 'برج التبريد',
    category: 'Cooling',
    points: [
      { id: 'CT_FAN_SS', name: 'Fan Status', nameAr: 'حالة المروحة', type: 'BI', description: 'Cooling tower fan status', descriptionAr: 'حالة مروحة برج التبريد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'CT_FAN_CMD', name: 'Fan Command', nameAr: 'أمر المروحة', type: 'BO', description: 'Cooling tower fan command', descriptionAr: 'أمر مروحة برج التبريد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'CT_FAN_SPD', name: 'Fan Speed', nameAr: 'سرعة المروحة', type: 'AO', description: 'VFD speed command', descriptionAr: 'أمر سرعة محول التردد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'CWS_TEMP', name: 'CW Supply Temperature', nameAr: 'درجة حرارة تزويد ماء المكثف', type: 'AI', description: 'Condenser water supply temperature', descriptionAr: 'درجة حرارة تزويد ماء المكثف', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 20, max: 45 } },
      { id: 'CWR_TEMP', name: 'CW Return Temperature', nameAr: 'درجة حرارة راجع ماء المكثف', type: 'AI', description: 'Condenser water return temperature', descriptionAr: 'درجة حرارة راجع ماء المكثف', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 25, max: 50 } },
      { id: 'CWS_TEMP_SP', name: 'CWS Temp Setpoint', nameAr: 'نقطة ضبط درجة حرارة التزويد', type: 'AV', description: 'CW supply temperature setpoint', descriptionAr: 'نقطة ضبط درجة حرارة تزويد ماء المكثف', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false, range: { min: 25, max: 35 } },
      { id: 'BASIN_LVL', name: 'Basin Level', nameAr: 'مستوى الحوض', type: 'AI', description: 'Basin water level', descriptionAr: 'مستوى ماء الحوض', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 }, alarmLimits: { low: 20, high: 95 } },
      { id: 'BASIN_LVL_LO', name: 'Basin Level Low', nameAr: 'مستوى الحوض منخفض', type: 'BI', description: 'Basin low level alarm', descriptionAr: 'إنذار انخفاض مستوى الحوض', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'MAKEUP_VLV', name: 'Makeup Valve', nameAr: 'صمام التعويض', type: 'BO', description: 'Makeup water valve', descriptionAr: 'صمام ماء التعويض', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'BLOWDOWN_VLV', name: 'Blowdown Valve', nameAr: 'صمام التصريف', type: 'BO', description: 'Blowdown valve', descriptionAr: 'صمام التصريف', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'VIB_MON', name: 'Vibration', nameAr: 'الاهتزاز', type: 'AI', description: 'Fan vibration level', descriptionAr: 'مستوى اهتزاز المروحة', unit: 'mm/s', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, alarmLimits: { high: 4.5 } },
      { id: 'OA_TEMP', name: 'Outside Air Temperature', nameAr: 'درجة حرارة الهواء الخارجي', type: 'AI', description: 'Ambient temperature', descriptionAr: 'درجة حرارة الجو', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'OA_RH', name: 'Outside Air Humidity', nameAr: 'رطوبة الهواء الخارجي', type: 'AI', description: 'Ambient relative humidity', descriptionAr: 'الرطوبة النسبية للجو', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
    ]
  },
  {
    equipmentType: 'Pump',
    equipmentTypeAr: 'مضخة',
    category: 'Pumps',
    points: [
      { id: 'PMP_SS', name: 'Pump Status', nameAr: 'حالة المضخة', type: 'BI', description: 'Pump running status', descriptionAr: 'حالة تشغيل المضخة', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'PMP_CMD', name: 'Pump Command', nameAr: 'أمر المضخة', type: 'BO', description: 'Pump start/stop command', descriptionAr: 'أمر تشغيل/إيقاف المضخة', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'PMP_SPD', name: 'Pump Speed', nameAr: 'سرعة المضخة', type: 'AO', description: 'VFD speed command', descriptionAr: 'أمر سرعة محول التردد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'PMP_SPD_FB', name: 'Speed Feedback', nameAr: 'تغذية راجعة للسرعة', type: 'AI', description: 'Actual pump speed', descriptionAr: 'السرعة الفعلية للمضخة', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'DP_SENSE', name: 'Differential Pressure', nameAr: 'فرق الضغط', type: 'AI', description: 'System differential pressure', descriptionAr: 'فرق ضغط النظام', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'DP_SP', name: 'DP Setpoint', nameAr: 'نقطة ضبط فرق الضغط', type: 'AV', description: 'Differential pressure setpoint', descriptionAr: 'نقطة ضبط فرق الضغط', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false },
      { id: 'FLOW', name: 'Flow Rate', nameAr: 'معدل التدفق', type: 'AI', description: 'Water flow rate', descriptionAr: 'معدل تدفق الماء', unit: 'L/s', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'AMP', name: 'Motor Current', nameAr: 'تيار المحرك', type: 'AI', description: 'Motor current draw', descriptionAr: 'سحب تيار المحرك', unit: 'A', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'VFD_FAULT', name: 'VFD Fault', nameAr: 'عطل محول التردد', type: 'BI', description: 'VFD fault status', descriptionAr: 'حالة عطل محول التردد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'SEAL_LK', name: 'Seal Leak', nameAr: 'تسرب الحشوة', type: 'BI', description: 'Mechanical seal leak detected', descriptionAr: 'تم اكتشاف تسرب الحشوة الميكانيكية', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'RUN_HRS', name: 'Running Hours', nameAr: 'ساعات التشغيل', type: 'AI', description: 'Total running hours', descriptionAr: 'إجمالي ساعات التشغيل', unit: 'hrs', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: false },
      { id: 'AUTO_MAN', name: 'Auto/Manual Mode', nameAr: 'وضع تلقائي/يدوي', type: 'BV', description: 'Automatic or manual control', descriptionAr: 'تحكم تلقائي أو يدوي', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Value', modbusDataType: 'bool', cov: true },
    ]
  },
  {
    equipmentType: 'ERV',
    equipmentTypeAr: 'وحدة استرداد الطاقة',
    category: 'Ventilation',
    points: [
      { id: 'SA_FAN_SS', name: 'Supply Fan Status', nameAr: 'حالة مروحة التزويد', type: 'BI', description: 'Supply fan running status', descriptionAr: 'حالة تشغيل مروحة التزويد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'SA_FAN_CMD', name: 'Supply Fan Command', nameAr: 'أمر مروحة التزويد', type: 'BO', description: 'Supply fan command', descriptionAr: 'أمر مروحة التزويد', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'EA_FAN_SS', name: 'Exhaust Fan Status', nameAr: 'حالة مروحة العادم', type: 'BI', description: 'Exhaust fan running status', descriptionAr: 'حالة تشغيل مروحة العادم', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'EA_FAN_CMD', name: 'Exhaust Fan Command', nameAr: 'أمر مروحة العادم', type: 'BO', description: 'Exhaust fan command', descriptionAr: 'أمر مروحة العادم', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'SA_FAN_SPD', name: 'Supply Fan Speed', nameAr: 'سرعة مروحة التزويد', type: 'AO', description: 'Supply fan VFD speed', descriptionAr: 'سرعة محول التردد لمروحة التزويد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'EA_FAN_SPD', name: 'Exhaust Fan Speed', nameAr: 'سرعة مروحة العادم', type: 'AO', description: 'Exhaust fan VFD speed', descriptionAr: 'سرعة محول التردد لمروحة العادم', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'SA_TEMP', name: 'Supply Air Temperature', nameAr: 'درجة حرارة هواء التزويد', type: 'AI', description: 'Supply air temperature', descriptionAr: 'درجة حرارة هواء التزويد', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'EA_TEMP', name: 'Exhaust Air Temperature', nameAr: 'درجة حرارة هواء العادم', type: 'AI', description: 'Exhaust air temperature', descriptionAr: 'درجة حرارة هواء العادم', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'OA_TEMP', name: 'Outside Air Temperature', nameAr: 'درجة حرارة الهواء الخارجي', type: 'AI', description: 'Outside air temperature', descriptionAr: 'درجة حرارة الهواء الخارجي', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'RA_TEMP', name: 'Return Air Temperature', nameAr: 'درجة حرارة هواء الراجع', type: 'AI', description: 'Return air temperature', descriptionAr: 'درجة حرارة هواء الراجع', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'BYPASS_DMP', name: 'Bypass Damper', nameAr: 'مخمد التجاوز', type: 'AO', description: 'Bypass damper position', descriptionAr: 'وضع مخمد التجاوز', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'WHEEL_SS', name: 'Wheel Status', nameAr: 'حالة العجلة', type: 'BI', description: 'Energy wheel running status', descriptionAr: 'حالة تشغيل عجلة الطاقة', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'WHEEL_SPD', name: 'Wheel Speed', nameAr: 'سرعة العجلة', type: 'AO', description: 'Energy wheel speed', descriptionAr: 'سرعة عجلة الطاقة', unit: 'RPM', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false },
      { id: 'FLT_DP_SA', name: 'Supply Filter DP', nameAr: 'فرق ضغط فلتر التزويد', type: 'AI', description: 'Supply filter differential pressure', descriptionAr: 'فرق ضغط فلتر التزويد', unit: 'Pa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, alarmLimits: { high: 350 } },
      { id: 'FLT_DP_EA', name: 'Exhaust Filter DP', nameAr: 'فرق ضغط فلتر العادم', type: 'AI', description: 'Exhaust filter differential pressure', descriptionAr: 'فرق ضغط فلتر العادم', unit: 'Pa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, alarmLimits: { high: 350 } },
      { id: 'EFFICIENCY', name: 'Heat Recovery Efficiency', nameAr: 'كفاءة استرداد الحرارة', type: 'AI', description: 'Calculated heat recovery efficiency', descriptionAr: 'كفاءة استرداد الحرارة المحسوبة', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'CO2', name: 'CO2 Level', nameAr: 'مستوى ثاني أكسيد الكربون', type: 'AI', description: 'CO2 concentration', descriptionAr: 'تركيز ثاني أكسيد الكربون', unit: 'ppm', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, alarmLimits: { high: 1000 } },
      { id: 'OCC_MODE', name: 'Occupancy Mode', nameAr: 'وضع الإشغال', type: 'MSV', description: 'Occupancy mode', descriptionAr: 'وضع الإشغال', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
    ]
  },
  {
    equipmentType: 'VAV',
    equipmentTypeAr: 'صندوق الهواء المتغير',
    category: 'Terminal Units',
    points: [
      { id: 'DMP_POS', name: 'Damper Position', nameAr: 'وضع المخمد', type: 'AO', description: 'Damper position command', descriptionAr: 'أمر وضع المخمد', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'DMP_POS_FB', name: 'Damper Position Feedback', nameAr: 'تغذية راجعة لوضع المخمد', type: 'AI', description: 'Actual damper position', descriptionAr: 'وضع المخمد الفعلي', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'AIRFLOW', name: 'Airflow', nameAr: 'تدفق الهواء', type: 'AI', description: 'Measured airflow', descriptionAr: 'تدفق الهواء المقاس', unit: 'CFM', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'AIRFLOW_SP', name: 'Airflow Setpoint', nameAr: 'نقطة ضبط تدفق الهواء', type: 'AV', description: 'Airflow setpoint', descriptionAr: 'نقطة ضبط تدفق الهواء', unit: 'CFM', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false },
      { id: 'AIRFLOW_MIN', name: 'Minimum Airflow', nameAr: 'الحد الأدنى لتدفق الهواء', type: 'AV', description: 'Minimum airflow setpoint', descriptionAr: 'نقطة ضبط الحد الأدنى لتدفق الهواء', unit: 'CFM', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false },
      { id: 'AIRFLOW_MAX', name: 'Maximum Airflow', nameAr: 'الحد الأقصى لتدفق الهواء', type: 'AV', description: 'Maximum airflow setpoint', descriptionAr: 'نقطة ضبط الحد الأقصى لتدفق الهواء', unit: 'CFM', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false },
      { id: 'ROOM_TEMP', name: 'Room Temperature', nameAr: 'درجة حرارة الغرفة', type: 'AI', description: 'Zone temperature', descriptionAr: 'درجة حرارة المنطقة', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'ROOM_SP', name: 'Room Setpoint', nameAr: 'نقطة ضبط الغرفة', type: 'AV', description: 'Zone temperature setpoint', descriptionAr: 'نقطة ضبط درجة حرارة المنطقة', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false, range: { min: 18, max: 28 } },
      { id: 'REHEAT_VLV', name: 'Reheat Valve', nameAr: 'صمام إعادة التسخين', type: 'AO', description: 'Reheat valve position', descriptionAr: 'وضع صمام إعادة التسخين', unit: '%', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Analog Output', modbusDataType: 'float32', cov: false, range: { min: 0, max: 100 } },
      { id: 'OCC_SENS', name: 'Occupancy Sensor', nameAr: 'حساس الإشغال', type: 'BI', description: 'Occupancy sensor status', descriptionAr: 'حالة حساس الإشغال', unit: '', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'OCC_MODE', name: 'Occupancy Mode', nameAr: 'وضع الإشغال', type: 'MSV', description: 'Occupancy mode', descriptionAr: 'وضع الإشغال', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Multi-State Value', modbusDataType: 'int16', cov: true },
      { id: 'CO2', name: 'CO2 Level', nameAr: 'مستوى ثاني أكسيد الكربون', type: 'AI', description: 'Zone CO2 level', descriptionAr: 'مستوى ثاني أكسيد الكربون في المنطقة', unit: 'ppm', defaultIncluded: false, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
    ]
  },
  {
    equipmentType: 'Boiler',
    equipmentTypeAr: 'غلاية',
    category: 'Heating',
    points: [
      { id: 'BLR_SS', name: 'Boiler Status', nameAr: 'حالة الغلاية', type: 'BI', description: 'Boiler running status', descriptionAr: 'حالة تشغيل الغلاية', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'BLR_CMD', name: 'Boiler Command', nameAr: 'أمر الغلاية', type: 'BO', description: 'Boiler enable command', descriptionAr: 'أمر تمكين الغلاية', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Output', modbusDataType: 'bool', cov: false },
      { id: 'FLAME_SS', name: 'Flame Status', nameAr: 'حالة اللهب', type: 'BI', description: 'Flame detected status', descriptionAr: 'حالة اكتشاف اللهب', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'HWS_TEMP', name: 'HW Supply Temperature', nameAr: 'درجة حرارة تزويد الماء الساخن', type: 'AI', description: 'Hot water supply temperature', descriptionAr: 'درجة حرارة تزويد الماء الساخن', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'HWS_TEMP_SP', name: 'HWS Temp Setpoint', nameAr: 'نقطة ضبط درجة حرارة التزويد', type: 'AV', description: 'HW supply temperature setpoint', descriptionAr: 'نقطة ضبط درجة حرارة تزويد الماء الساخن', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Value', modbusDataType: 'float32', cov: false },
      { id: 'HWR_TEMP', name: 'HW Return Temperature', nameAr: 'درجة حرارة راجع الماء الساخن', type: 'AI', description: 'Hot water return temperature', descriptionAr: 'درجة حرارة راجع الماء الساخن', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'FIRING_RATE', name: 'Firing Rate', nameAr: 'معدل الاشتعال', type: 'AI', description: 'Current firing rate', descriptionAr: 'معدل الاشتعال الحالي', unit: '%', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true, range: { min: 0, max: 100 } },
      { id: 'STACK_TEMP', name: 'Stack Temperature', nameAr: 'درجة حرارة المدخنة', type: 'AI', description: 'Flue gas temperature', descriptionAr: 'درجة حرارة غاز العادم', unit: '°C', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'WATER_PRESS', name: 'Water Pressure', nameAr: 'ضغط الماء', type: 'AI', description: 'Boiler water pressure', descriptionAr: 'ضغط ماء الغلاية', unit: 'kPa', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Analog Input', modbusDataType: 'float32', cov: true },
      { id: 'LOCKOUT', name: 'Lockout Status', nameAr: 'حالة الإغلاق', type: 'BI', description: 'Safety lockout status', descriptionAr: 'حالة إغلاق الأمان', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
      { id: 'ALARM', name: 'General Alarm', nameAr: 'إنذار عام', type: 'BI', description: 'General boiler alarm', descriptionAr: 'إنذار الغلاية العام', unit: '', defaultIncluded: true, protocol: 'both', bacnetObjectType: 'Binary Input', modbusDataType: 'bool', cov: true },
    ]
  },
];

export function getPointTemplatesByEquipmentType(equipmentType: string): PointTemplate[] {
  const template = EQUIPMENT_POINT_TEMPLATES.find(t => 
    t.equipmentType.toLowerCase() === equipmentType.toLowerCase()
  );
  return template?.points || [];
}

export function getEquipmentCategories(): string[] {
  return [...new Set(EQUIPMENT_POINT_TEMPLATES.map(t => t.category))];
}

export function getEquipmentTypesByCategory(category: string): string[] {
  return EQUIPMENT_POINT_TEMPLATES
    .filter(t => t.category === category)
    .map(t => t.equipmentType);
}
