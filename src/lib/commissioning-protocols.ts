// HVAC Commissioning Protocols and Test Definitions

export interface CommissioningTest {
  id: string;
  name: string;
  nameAr: string;
  category: 'pretest' | 'functional' | 'performance' | 'integration';
  description: string;
  descriptionAr: string;
  expectedValue?: string;
  unit?: string;
  tolerance?: number; // Percentage tolerance
  testProcedure: string[];
  passCriteria: string;
  requiredEquipment?: string[];
}

export interface CommissioningProtocol {
  equipmentType: string;
  displayName: string;
  displayNameAr: string;
  tests: CommissioningTest[];
}

// ERV/HRV Commissioning Protocol
export const ERV_COMMISSIONING_PROTOCOL: CommissioningProtocol = {
  equipmentType: 'erv',
  displayName: 'Energy Recovery Ventilator',
  displayNameAr: 'وحدة استرجاع الطاقة',
  tests: [
    // Pre-tests
    {
      id: 'erv_filter_installed',
      name: 'Filters Properly Installed',
      nameAr: 'تركيب الفلاتر بشكل صحيح',
      category: 'pretest',
      description: 'Verify all filters are properly installed and sealed',
      descriptionAr: 'التحقق من تركيب جميع الفلاتر بشكل صحيح ومحكم',
      passCriteria: 'All filters in place with no bypass gaps',
      testProcedure: [
        'Open access panels to filter section',
        'Check filter orientation arrows match airflow direction',
        'Verify filter gaskets are properly seated',
        'Check for any gaps around filter frames',
        'Close and secure access panels',
      ],
    },
    {
      id: 'erv_ductwork_sealed',
      name: 'Ductwork Properly Sealed',
      nameAr: 'إحكام مجاري الهواء',
      category: 'pretest',
      description: 'Verify all duct connections are properly sealed',
      descriptionAr: 'التحقق من إحكام جميع وصلات مجاري الهواء',
      passCriteria: 'No visible leaks, connections tested',
      testProcedure: [
        'Visual inspection of all duct connections',
        'Check flexible duct connections for proper clamping',
        'Verify sealant at joints is intact',
        'Perform smoke test if required',
      ],
    },
    {
      id: 'erv_controls_connected',
      name: 'Controls Connected and Configured',
      nameAr: 'توصيل وتهيئة نظام التحكم',
      category: 'pretest',
      description: 'Verify BAS/controls integration is complete',
      descriptionAr: 'التحقق من اكتمال التكامل مع نظام إدارة المبنى',
      passCriteria: 'All points readable and commandable from BAS',
      testProcedure: [
        'Verify power supply to controller',
        'Check communication to BAS',
        'Confirm all I/O points are mapped correctly',
        'Test each control point for proper response',
      ],
    },
    {
      id: 'erv_electrical_verified',
      name: 'Electrical Connections Verified',
      nameAr: 'التحقق من التوصيلات الكهربائية',
      category: 'pretest',
      description: 'Verify all electrical connections and voltage',
      descriptionAr: 'التحقق من جميع التوصيلات الكهربائية والجهد',
      expectedValue: '380-415',
      unit: 'V',
      tolerance: 5,
      passCriteria: 'Voltage within ±5% of nameplate',
      testProcedure: [
        'Verify disconnect is properly sized and labeled',
        'Measure incoming voltage all phases',
        'Check motor lead connections',
        'Verify ground connections',
      ],
      requiredEquipment: ['Multimeter', 'Clamp meter'],
    },
    // Performance Tests
    {
      id: 'erv_supply_airflow',
      name: 'Supply Airflow Verification',
      nameAr: 'التحقق من تدفق هواء الإمداد',
      category: 'performance',
      description: 'Measure and verify supply airflow matches design',
      descriptionAr: 'قياس والتحقق من تطابق تدفق هواء الإمداد مع التصميم',
      unit: 'CFM',
      tolerance: 10,
      passCriteria: 'Within ±10% of design CFM',
      testProcedure: [
        'Set unit to 100% supply fan speed',
        'Allow system to stabilize for 5 minutes',
        'Measure airflow using flow hood or pitot traverse',
        'Record reading and compare to design value',
        'Adjust if needed and re-measure',
      ],
      requiredEquipment: ['Balancing hood', 'Pitot tube', 'Manometer'],
    },
    {
      id: 'erv_exhaust_airflow',
      name: 'Exhaust Airflow Verification',
      nameAr: 'التحقق من تدفق هواء العادم',
      category: 'performance',
      description: 'Measure and verify exhaust airflow matches design',
      descriptionAr: 'قياس والتحقق من تطابق تدفق هواء العادم مع التصميم',
      unit: 'CFM',
      tolerance: 10,
      passCriteria: 'Within ±10% of design CFM',
      testProcedure: [
        'Set unit to 100% exhaust fan speed',
        'Allow system to stabilize for 5 minutes',
        'Measure airflow using flow hood or pitot traverse',
        'Record reading and compare to design value',
        'Verify balance with supply airflow',
      ],
      requiredEquipment: ['Balancing hood', 'Pitot tube', 'Manometer'],
    },
    {
      id: 'erv_sensible_effectiveness',
      name: 'Sensible Heat Recovery Effectiveness',
      nameAr: 'كفاءة استرجاع الحرارة المحسوسة',
      category: 'performance',
      description: 'Calculate sensible effectiveness from temperature measurements',
      descriptionAr: 'حساب كفاءة الحرارة المحسوسة من قياسات درجة الحرارة',
      unit: '%',
      tolerance: 5,
      passCriteria: 'Within ±5% of rated effectiveness',
      testProcedure: [
        'Measure outdoor air temperature (OAT)',
        'Measure return air temperature (RAT)',
        'Measure supply air temperature (SAT)',
        'Calculate: Sensible Eff = (SAT - OAT) / (RAT - OAT) × 100%',
        'Compare to manufacturer rated effectiveness',
      ],
      requiredEquipment: ['Temperature sensors', 'Data logger'],
    },
    {
      id: 'erv_total_effectiveness',
      name: 'Total Heat Recovery Effectiveness',
      nameAr: 'كفاءة استرجاع الحرارة الكلية',
      category: 'performance',
      description: 'Calculate total (enthalpy) effectiveness including latent',
      descriptionAr: 'حساب الكفاءة الكلية (الإنثالبي) بما في ذلك الحرارة الكامنة',
      unit: '%',
      tolerance: 5,
      passCriteria: 'Within ±5% of rated effectiveness',
      testProcedure: [
        'Measure temperature and humidity at all four airstreams',
        'Calculate enthalpy values',
        'Total Eff = (h_supply - h_outdoor) / (h_return - h_outdoor) × 100%',
        'Compare to manufacturer rated effectiveness',
      ],
      requiredEquipment: ['Temperature/humidity sensors', 'Psychrometric chart/calculator'],
    },
    {
      id: 'erv_pressure_drop',
      name: 'Total Pressure Drop',
      nameAr: 'فقد الضغط الكلي',
      category: 'performance',
      description: 'Measure pressure drop across the unit',
      descriptionAr: 'قياس فقد الضغط عبر الوحدة',
      unit: 'Pa',
      tolerance: 15,
      passCriteria: 'Within ±15% of rated pressure drop',
      testProcedure: [
        'Install pressure taps upstream and downstream',
        'Set unit to design airflow rate',
        'Measure pressure drop across supply side',
        'Measure pressure drop across exhaust side',
        'Compare to manufacturer specifications',
      ],
      requiredEquipment: ['Manometer', 'Pressure taps'],
    },
    {
      id: 'erv_power_consumption',
      name: 'Power Consumption',
      nameAr: 'استهلاك الطاقة',
      category: 'performance',
      description: 'Measure actual power consumption vs rated',
      descriptionAr: 'قياس استهلاك الطاقة الفعلي مقارنة بالمقنن',
      unit: 'kW',
      tolerance: 10,
      passCriteria: 'Within ±10% of rated power at design conditions',
      testProcedure: [
        'Set unit to design operating conditions',
        'Measure voltage and current all phases',
        'Calculate power: P = √3 × V × I × PF',
        'Compare to nameplate rating',
      ],
      requiredEquipment: ['Clamp meter', 'Power analyzer'],
    },
    // Functional Tests
    {
      id: 'erv_frost_control',
      name: 'Frost Control Operation',
      nameAr: 'تشغيل التحكم في الصقيع',
      category: 'functional',
      description: 'Verify frost protection operates correctly',
      descriptionAr: 'التحقق من عمل حماية الصقيع بشكل صحيح',
      passCriteria: 'Frost protection activates at setpoint',
      testProcedure: [
        'Lower exhaust air temperature setpoint to trigger frost mode',
        'Verify bypass damper or defrost cycle activates',
        'Confirm alarm is generated if applicable',
        'Return to normal operation and verify recovery',
      ],
    },
    {
      id: 'erv_bypass_damper',
      name: 'Bypass Damper Operation',
      nameAr: 'تشغيل مخمد التجاوز',
      category: 'functional',
      description: 'Verify bypass damper modulates correctly',
      descriptionAr: 'التحقق من تعديل مخمد التجاوز بشكل صحيح',
      passCriteria: 'Damper modulates 0-100% per command',
      testProcedure: [
        'Command bypass damper to 0% (full recovery)',
        'Verify damper position indicator',
        'Command damper to 50%',
        'Command damper to 100% (full bypass)',
        'Verify smooth modulation throughout range',
      ],
    },
    {
      id: 'erv_wheel_rotation',
      name: 'Energy Wheel Rotation (if applicable)',
      nameAr: 'دوران عجلة الطاقة (إن وجدت)',
      category: 'functional',
      description: 'Verify energy wheel rotates at correct speed',
      descriptionAr: 'التحقق من دوران عجلة الطاقة بالسرعة الصحيحة',
      unit: 'RPM',
      tolerance: 5,
      passCriteria: 'Wheel speed within ±5% of design',
      testProcedure: [
        'Start unit in normal operation',
        'Measure wheel rotation speed with tachometer',
        'Compare to design RPM',
        'Check for any unusual noise or vibration',
        'Verify belt tension if belt-driven',
      ],
      requiredEquipment: ['Tachometer', 'Stroboscope'],
    },
    {
      id: 'erv_interlock_test',
      name: 'Safety Interlock Test',
      nameAr: 'اختبار تشابك السلامة',
      category: 'functional',
      description: 'Verify all safety interlocks function correctly',
      descriptionAr: 'التحقق من عمل جميع تشابكات السلامة بشكل صحيح',
      passCriteria: 'All interlocks stop unit operation when triggered',
      testProcedure: [
        'Test high static pressure switch (if applicable)',
        'Test dirty filter switch (if applicable)',
        'Test smoke detector interlock',
        'Test fire alarm interlock',
        'Verify unit shuts down for each condition',
      ],
    },
    // Integration Tests
    {
      id: 'erv_bas_integration',
      name: 'BAS Integration Verification',
      nameAr: 'التحقق من تكامل نظام إدارة المبنى',
      category: 'integration',
      description: 'Verify all BAS points are functioning correctly',
      descriptionAr: 'التحقق من عمل جميع نقاط نظام إدارة المبنى بشكل صحيح',
      passCriteria: 'All points read correctly and commands execute',
      testProcedure: [
        'Verify all analog inputs read correctly',
        'Verify all digital inputs reflect actual status',
        'Test all analog output commands',
        'Test all digital output commands',
        'Verify trending is functioning',
        'Test alarm generation and acknowledgment',
      ],
    },
    {
      id: 'erv_sequence_verification',
      name: 'Control Sequence Verification',
      nameAr: 'التحقق من تسلسل التحكم',
      category: 'integration',
      description: 'Verify control sequences match design intent',
      descriptionAr: 'التحقق من تطابق تسلسلات التحكم مع غرض التصميم',
      passCriteria: 'Sequences operate per SOO documentation',
      testProcedure: [
        'Review sequence of operations document',
        'Test startup sequence',
        'Test normal operation mode',
        'Test economizer mode (if applicable)',
        'Test shutdown sequence',
        'Document any deviations',
      ],
    },
  ],
};

// AHU Commissioning Protocol
export const AHU_COMMISSIONING_PROTOCOL: CommissioningProtocol = {
  equipmentType: 'ahu',
  displayName: 'Air Handling Unit',
  displayNameAr: 'وحدة مناولة الهواء',
  tests: [
    {
      id: 'ahu_filter_installed',
      name: 'Filters Properly Installed',
      nameAr: 'تركيب الفلاتر بشكل صحيح',
      category: 'pretest',
      description: 'Verify all filters are properly installed',
      descriptionAr: 'التحقق من تركيب جميع الفلاتر بشكل صحيح',
      passCriteria: 'All filters in place with proper sealing',
      testProcedure: [
        'Check pre-filter installation',
        'Check final filter installation',
        'Verify filter ratings match specifications',
        'Check for bypass air gaps',
      ],
    },
    {
      id: 'ahu_coil_cleanliness',
      name: 'Coil Cleanliness',
      nameAr: 'نظافة الملفات',
      category: 'pretest',
      description: 'Verify cooling and heating coils are clean',
      descriptionAr: 'التحقق من نظافة ملفات التبريد والتسخين',
      passCriteria: 'Coils visually clean, no debris or damage',
      testProcedure: [
        'Inspect cooling coil fins',
        'Inspect heating coil if applicable',
        'Check drain pan for debris',
        'Verify drain line is clear',
      ],
    },
    {
      id: 'ahu_supply_airflow',
      name: 'Supply Airflow',
      nameAr: 'تدفق هواء الإمداد',
      category: 'performance',
      description: 'Measure and verify supply airflow',
      descriptionAr: 'قياس والتحقق من تدفق هواء الإمداد',
      unit: 'CFM',
      tolerance: 10,
      passCriteria: 'Within ±10% of design',
      testProcedure: [
        'Set supply fan to design speed',
        'Measure total supply airflow',
        'Compare to design requirements',
      ],
      requiredEquipment: ['Balancing hood', 'Pitot tube'],
    },
    {
      id: 'ahu_static_pressure',
      name: 'Static Pressure',
      nameAr: 'الضغط الساكن',
      category: 'performance',
      description: 'Verify duct static pressure at design conditions',
      descriptionAr: 'التحقق من الضغط الساكن للمجاري عند ظروف التصميم',
      unit: 'in.wc',
      tolerance: 10,
      passCriteria: 'Maintains setpoint within tolerance',
      testProcedure: [
        'Locate static pressure sensor',
        'Verify sensor calibration',
        'Measure actual vs indicated pressure',
        'Test pressure control loop response',
      ],
      requiredEquipment: ['Manometer'],
    },
    {
      id: 'ahu_cooling_capacity',
      name: 'Cooling Capacity',
      nameAr: 'سعة التبريد',
      category: 'performance',
      description: 'Verify cooling coil capacity meets design',
      descriptionAr: 'التحقق من تطابق سعة ملف التبريد مع التصميم',
      unit: 'Tons',
      tolerance: 10,
      passCriteria: 'Capacity within ±10% of design',
      testProcedure: [
        'Measure entering and leaving air temperatures',
        'Measure airflow rate',
        'Calculate sensible capacity',
        'Compare to design load',
      ],
      requiredEquipment: ['Temperature sensors', 'Flow hood'],
    },
    {
      id: 'ahu_vfd_operation',
      name: 'VFD Operation',
      nameAr: 'تشغيل محول التردد',
      category: 'functional',
      description: 'Verify VFD operates correctly across speed range',
      descriptionAr: 'التحقق من عمل محول التردد عبر نطاق السرعة',
      passCriteria: 'Smooth operation 20-100% speed',
      testProcedure: [
        'Command VFD to minimum speed',
        'Verify fan operates smoothly',
        'Increase to 50% speed',
        'Increase to 100% speed',
        'Check for vibration or noise at each speed',
      ],
    },
    {
      id: 'ahu_damper_operation',
      name: 'Damper Operation',
      nameAr: 'تشغيل المخمدات',
      category: 'functional',
      description: 'Verify all dampers modulate correctly',
      descriptionAr: 'التحقق من تعديل جميع المخمدات بشكل صحيح',
      passCriteria: 'All dampers stroke full range',
      testProcedure: [
        'Test OA damper 0-100%',
        'Test RA damper 0-100%',
        'Test EA damper 0-100%',
        'Verify linkages and actuators',
      ],
    },
    {
      id: 'ahu_economizer',
      name: 'Economizer Operation',
      nameAr: 'تشغيل الإيكونومايزر',
      category: 'functional',
      description: 'Verify economizer functions per sequence',
      descriptionAr: 'التحقق من عمل الإيكونومايزر حسب التسلسل',
      passCriteria: 'Economizer activates at correct conditions',
      testProcedure: [
        'Simulate favorable outdoor conditions',
        'Verify OA damper opens',
        'Verify RA damper modulates',
        'Check changeover temperature/enthalpy',
      ],
    },
  ],
};

// Chiller Commissioning Protocol
export const CHILLER_COMMISSIONING_PROTOCOL: CommissioningProtocol = {
  equipmentType: 'chiller',
  displayName: 'Chiller',
  displayNameAr: 'مبرد',
  tests: [
    {
      id: 'chiller_oil_level',
      name: 'Oil Level Check',
      nameAr: 'فحص مستوى الزيت',
      category: 'pretest',
      description: 'Verify compressor oil level is correct',
      descriptionAr: 'التحقق من صحة مستوى زيت الضاغط',
      passCriteria: 'Oil level within sight glass range',
      testProcedure: [
        'Check oil sight glass on each compressor',
        'Verify oil is at proper level',
        'Check oil color for contamination',
      ],
    },
    {
      id: 'chiller_refrigerant_charge',
      name: 'Refrigerant Charge',
      nameAr: 'شحنة مبرد التكييف',
      category: 'pretest',
      description: 'Verify refrigerant charge is correct',
      descriptionAr: 'التحقق من صحة شحنة مبرد التكييف',
      passCriteria: 'Subcooling and superheat within range',
      testProcedure: [
        'Measure subcooling at condenser',
        'Measure superheat at evaporator',
        'Compare to manufacturer specifications',
      ],
      requiredEquipment: ['Refrigerant gauges', 'Temperature sensors'],
    },
    {
      id: 'chiller_capacity',
      name: 'Cooling Capacity',
      nameAr: 'سعة التبريد',
      category: 'performance',
      description: 'Verify chiller capacity at design conditions',
      descriptionAr: 'التحقق من سعة المبرد عند ظروف التصميم',
      unit: 'Tons',
      tolerance: 5,
      passCriteria: 'Capacity within ±5% of rated',
      testProcedure: [
        'Measure entering and leaving CHW temperatures',
        'Measure CHW flow rate',
        'Calculate capacity: Q = 500 × GPM × ΔT',
        'Compare to rated capacity',
      ],
      requiredEquipment: ['Temperature sensors', 'Flow meter'],
    },
    {
      id: 'chiller_efficiency',
      name: 'Operating Efficiency',
      nameAr: 'كفاءة التشغيل',
      category: 'performance',
      description: 'Measure kW/ton at various load conditions',
      descriptionAr: 'قياس كيلو واط/طن عند ظروف أحمال مختلفة',
      unit: 'kW/ton',
      tolerance: 10,
      passCriteria: 'Efficiency within ±10% of rated',
      testProcedure: [
        'Measure power input at 100% load',
        'Measure power input at 75% load',
        'Measure power input at 50% load',
        'Calculate kW/ton at each condition',
      ],
      requiredEquipment: ['Power analyzer'],
    },
    {
      id: 'chiller_staging',
      name: 'Chiller Staging',
      nameAr: 'تدريج المبردات',
      category: 'functional',
      description: 'Verify chiller staging sequence',
      descriptionAr: 'التحقق من تسلسل تدريج المبردات',
      passCriteria: 'Chillers stage on/off per sequence',
      testProcedure: [
        'Increase load to trigger lead chiller start',
        'Continue increasing to stage on lag chiller',
        'Decrease load to verify proper staging off',
        'Check minimum runtime and anti-short-cycle',
      ],
    },
  ],
};

// FCU Commissioning Protocol
export const FCU_COMMISSIONING_PROTOCOL: CommissioningProtocol = {
  equipmentType: 'fcu',
  displayName: 'Fan Coil Unit',
  displayNameAr: 'وحدة ملف المروحة',
  tests: [
    {
      id: 'fcu_airflow',
      name: 'Airflow Verification',
      nameAr: 'التحقق من تدفق الهواء',
      category: 'performance',
      description: 'Measure FCU supply airflow',
      descriptionAr: 'قياس تدفق هواء الإمداد للوحدة',
      unit: 'CFM',
      tolerance: 15,
      passCriteria: 'Within ±15% of design',
      testProcedure: [
        'Set fan to high speed',
        'Measure airflow at each diffuser',
        'Sum total and compare to design',
      ],
      requiredEquipment: ['Balancing hood'],
    },
    {
      id: 'fcu_valve_stroke',
      name: 'Control Valve Stroke',
      nameAr: 'شوط صمام التحكم',
      category: 'functional',
      description: 'Verify control valve strokes full range',
      descriptionAr: 'التحقق من أن صمام التحكم يعمل على النطاق الكامل',
      passCriteria: 'Valve modulates 0-100%',
      testProcedure: [
        'Command valve to 0% (closed)',
        'Verify no water flow through coil',
        'Command valve to 100% (open)',
        'Verify full water flow',
        'Test intermediate positions',
      ],
    },
    {
      id: 'fcu_thermostat',
      name: 'Thermostat Operation',
      nameAr: 'تشغيل منظم الحرارة',
      category: 'functional',
      description: 'Verify thermostat controls FCU correctly',
      descriptionAr: 'التحقق من تحكم منظم الحرارة في الوحدة بشكل صحيح',
      passCriteria: 'FCU responds to setpoint changes',
      testProcedure: [
        'Adjust setpoint above room temperature',
        'Verify cooling valve closes',
        'Adjust setpoint below room temperature',
        'Verify cooling valve opens',
        'Check deadband operation',
      ],
    },
  ],
};

// Acoustic Zone Commissioning Protocol
export const ACOUSTIC_COMMISSIONING_PROTOCOL: CommissioningProtocol = {
  equipmentType: 'acoustic',
  displayName: 'Zone Acoustic Verification',
  displayNameAr: 'التحقق الصوتي للمنطقة',
  tests: [
    // Pre-tests
    {
      id: 'acoustic_pre_hvac_off',
      name: 'Background Noise Measurement (HVAC Off)',
      nameAr: 'قياس الضوضاء الخلفية (التكييف مغلق)',
      category: 'pretest',
      description: 'Measure background NC with HVAC system off to establish baseline',
      descriptionAr: 'قياس مستوى NC الخلفي مع إيقاف نظام التكييف لتحديد خط الأساس',
      unit: 'NC',
      passCriteria: 'Background NC recorded for reference',
      testProcedure: [
        'Ensure HVAC system is completely off',
        'Close all windows and doors',
        'Allow room to settle for 5 minutes',
        'Measure NC at room center, 4ft above floor',
        'Record background NC level',
      ],
      requiredEquipment: ['Sound Level Meter', 'NC Analyzer'],
    },
    {
      id: 'acoustic_pre_meter_calibration',
      name: 'Sound Level Meter Calibration Verified',
      nameAr: 'التحقق من معايرة جهاز قياس الصوت',
      category: 'pretest',
      description: 'Verify calibration of NC/dB measurement equipment',
      descriptionAr: 'التحقق من معايرة أجهزة قياس NC/dB',
      passCriteria: 'Calibration certificate within valid date',
      testProcedure: [
        'Check calibration certificate date',
        'Verify calibrator battery level',
        'Apply calibrator to microphone',
        'Verify meter reads calibrator reference level',
        'Record calibration check result',
      ],
      requiredEquipment: ['Acoustic Calibrator', 'Calibration Certificate'],
    },
    // Performance Tests
    {
      id: 'acoustic_nc_center',
      name: 'NC Measurement - Room Center',
      nameAr: 'قياس NC - وسط الغرفة',
      category: 'performance',
      description: 'Measure NC at room center, 4ft above floor, with HVAC at design conditions',
      descriptionAr: 'قياس NC في وسط الغرفة، 4 أقدام فوق الأرضية، مع التكييف في ظروف التصميم',
      unit: 'NC',
      tolerance: 5,
      passCriteria: 'Within ±5 NC of target',
      testProcedure: [
        'Set HVAC system to 100% design airflow',
        'Allow system to stabilize for 10 minutes',
        'Position meter at room center, 4ft height',
        'Record NC reading for 30 seconds minimum',
        'Compare to design target NC',
      ],
      requiredEquipment: ['Sound Level Meter', 'NC Analyzer', 'Tripod'],
    },
    {
      id: 'acoustic_nc_near_diffuser',
      name: 'NC Measurement - Near Diffuser',
      nameAr: 'قياس NC - قرب الناشر',
      category: 'performance',
      description: 'Measure NC 1m below each supply diffuser to check diffuser-generated noise',
      descriptionAr: 'قياس NC على بعد 1 متر تحت كل ناشر إمداد للتحقق من الضوضاء الناتجة عن الناشر',
      unit: 'NC',
      tolerance: 8,
      passCriteria: 'No diffuser exceeds NC target by more than 8',
      testProcedure: [
        'Identify all supply diffusers in zone',
        'Position meter 1m below each diffuser',
        'Record NC reading at each position',
        'Identify highest reading',
        'Flag any diffuser exceeding limit',
      ],
      requiredEquipment: ['Sound Level Meter', 'NC Analyzer'],
    },
    {
      id: 'acoustic_nc_workstation',
      name: 'NC Measurement - Typical Workstation',
      nameAr: 'قياس NC - محطة العمل النموذجية',
      category: 'performance',
      description: 'Measure NC at representative desk/workstation positions',
      descriptionAr: 'قياس NC في مواقع المكاتب/محطات العمل التمثيلية',
      unit: 'NC',
      tolerance: 5,
      passCriteria: 'Average within target NC',
      testProcedure: [
        'Select 3-5 representative workstation locations',
        'Position meter at seated ear height',
        'Record NC at each location',
        'Calculate average NC',
        'Compare to space type target',
      ],
      requiredEquipment: ['Sound Level Meter', 'NC Analyzer'],
    },
    // Functional Tests
    {
      id: 'acoustic_vav_ramp',
      name: 'VAV Box Ramping Test',
      nameAr: 'اختبار تدرج صندوق VAV',
      category: 'functional',
      description: 'Verify NC at minimum, 50%, and maximum VAV airflow to understand noise variation',
      descriptionAr: 'التحقق من NC عند الحد الأدنى و50% والحد الأقصى لتدفق الهواء VAV لفهم تباين الضوضاء',
      passCriteria: 'NC at max flow ≤ target + 5',
      testProcedure: [
        'Set VAV to minimum position',
        'Allow stabilization, record NC',
        'Set VAV to 50% position',
        'Allow stabilization, record NC',
        'Set VAV to maximum position',
        'Allow stabilization, record NC',
        'Plot NC vs airflow curve',
      ],
      requiredEquipment: ['Sound Level Meter', 'BAS Access'],
    },
    {
      id: 'acoustic_damper_noise',
      name: 'Damper Position Noise Check',
      nameAr: 'فحص ضوضاء وضع المخمد',
      category: 'functional',
      description: 'Check for damper flutter, whistling, or unusual noises at various positions',
      descriptionAr: 'التحقق من اهتزاز المخمد أو الصفير أو الضوضاء غير العادية في المواضع المختلفة',
      passCriteria: 'No audible damper noise or tonal components',
      testProcedure: [
        'Listen at diffuser with HVAC running',
        'Modulate damper through full range',
        'Note any whistling or flutter sounds',
        'Check for tonal (pure tone) components',
        'Document any problematic positions',
      ],
    },
    {
      id: 'acoustic_diffuser_throw',
      name: 'Diffuser Throw Pattern Verification',
      nameAr: 'التحقق من نمط رمي الناشر',
      category: 'functional',
      description: 'Verify diffuser throw pattern matches design and does not cause drafts',
      descriptionAr: 'التحقق من أن نمط رمي الناشر يتطابق مع التصميم ولا يسبب تيارات هوائية',
      passCriteria: 'Throw pattern as designed, no drafts in occupied zone',
      testProcedure: [
        'Observe smoke pencil or ribbon behavior',
        'Verify throw reaches design distance',
        'Check for drafts in occupied zone',
        'Verify no short-circuiting to return',
      ],
      requiredEquipment: ['Smoke Pencil'],
    },
    // Integration Tests
    {
      id: 'acoustic_occupancy_comparison',
      name: 'Occupied vs Unoccupied Comparison',
      nameAr: 'مقارنة مشغول مقابل غير مشغول',
      category: 'integration',
      description: 'Compare NC readings during occupied and unoccupied modes',
      descriptionAr: 'مقارنة قراءات NC خلال أوضاع الإشغال وعدم الإشغال',
      passCriteria: 'NC difference documented for reference',
      testProcedure: [
        'Measure NC during unoccupied mode',
        'Measure NC during occupied mode',
        'Calculate and record difference',
        'Note any scheduling-related noise changes',
      ],
      requiredEquipment: ['Sound Level Meter'],
    },
    {
      id: 'acoustic_adjacent_zones',
      name: 'Adjacent Zone Noise Transmission',
      nameAr: 'انتقال الضوضاء من المناطق المجاورة',
      category: 'integration',
      description: 'Check for noise transmission from adjacent mechanical or high-activity zones',
      descriptionAr: 'التحقق من انتقال الضوضاء من المناطق الميكانيكية أو عالية النشاط المجاورة',
      passCriteria: 'No significant noise transmission identified',
      testProcedure: [
        'Turn off zone HVAC',
        'Measure background with adjacent zones running',
        'Identify any crosstalk through ducts or walls',
        'Document sources of transmitted noise',
      ],
    },
  ],
};

// Export all protocols
export const COMMISSIONING_PROTOCOLS: Record<string, CommissioningProtocol> = {
  erv: ERV_COMMISSIONING_PROTOCOL,
  ahu: AHU_COMMISSIONING_PROTOCOL,
  chiller: CHILLER_COMMISSIONING_PROTOCOL,
  fcu: FCU_COMMISSIONING_PROTOCOL,
  acoustic: ACOUSTIC_COMMISSIONING_PROTOCOL,
};

// Get protocol by equipment type
export function getCommissioningProtocol(equipmentType: string): CommissioningProtocol | undefined {
  return COMMISSIONING_PROTOCOLS[equipmentType.toLowerCase()];
}

// Get all available equipment types for commissioning
export function getCommissioningEquipmentTypes(): { type: string; name: string; nameAr: string }[] {
  return Object.values(COMMISSIONING_PROTOCOLS).map(p => ({
    type: p.equipmentType,
    name: p.displayName,
    nameAr: p.displayNameAr,
  }));
}

// Calculate test results summary
export function calculateTestSummary(tests: { result: string }[]): {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  marginal: number;
  passRate: number;
} {
  const total = tests.length;
  const passed = tests.filter(t => t.result === 'pass').length;
  const failed = tests.filter(t => t.result === 'fail').length;
  const pending = tests.filter(t => t.result === 'pending').length;
  const marginal = tests.filter(t => t.result === 'marginal').length;
  
  const completed = total - pending;
  const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;
  
  return { total, passed, failed, pending, marginal, passRate };
}
