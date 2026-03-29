// Sequence of Operations Templates for HVAC Systems

export type SystemType = 'ahu' | 'chiller_plant' | 'vrf' | 'fcu' | 'split_package' | 'cooling_tower' | 'boiler';
export type OperatingMode = 'cooling_only' | 'heating_only' | 'cooling_heating' | 'economizer' | 'heat_recovery';

export interface ControlParameters {
  // Temperature setpoints
  coolingSetpoint?: number;
  heatingSetpoint?: number;
  supplyAirTemp?: number;
  chilledWaterSupplyTemp?: number;
  hotWaterSupplyTemp?: number;
  condenserWaterTemp?: number;
  
  // Pressure/Flow setpoints
  ductStaticPressure?: number;
  minOutsideAir?: number;
  designCfm?: number;
  designGpm?: number;
  
  // Schedule
  occupiedStart?: string;
  occupiedEnd?: string;
  weekendSchedule?: boolean;
  prayerTimeShutdown?: boolean;
  
  // Safety
  freezeProtectTemp?: number;
  highTempAlarm?: number;
  lowTempAlarm?: number;
  filterDpAlarm?: number;
  
  // VFD
  minVfdSpeed?: number;
  maxVfdSpeed?: number;
  
  // Staging
  stagingDelay?: number;
  leadLagRotation?: boolean;
  
  // Equipment specific
  economizer?: boolean;
  economizerLockout?: number;
  heatRecovery?: boolean;
  demandControlVentilation?: boolean;
}

export interface SequenceStep {
  stepNumber: number;
  description: string;
  condition?: string;
  action: string;
  setpoint?: string;
  notes?: string;
}

export interface AlarmDefinition {
  alarmName: string;
  condition: string;
  severity: 'critical' | 'warning' | 'info';
  action: string;
  resetCondition?: string;
}

export interface SetpointEntry {
  parameter: string;
  setpoint: string;
  range?: string;
  units: string;
}

export interface GeneratedSequence {
  systemDescription: string;
  equipmentList: string[];
  servedZones: string[];
  startupSequence: SequenceStep[];
  normalOperation: SequenceStep[];
  shutdownSequence: SequenceStep[];
  safetyInterlocks: SequenceStep[];
  alarmConditions: AlarmDefinition[];
  setpointSchedule: SetpointEntry[];
  maintenanceNotes: string[];
}

// Template interpolation helper
export function interpolate(template: string, values: Record<string, string | number | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : match;
  });
}

// System type display names
export const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  ahu: 'Air Handling Unit (AHU)',
  chiller_plant: 'Chiller Plant',
  vrf: 'Variable Refrigerant Flow (VRF)',
  fcu: 'Fan Coil Unit (FCU)',
  split_package: 'Split / Package Unit',
  cooling_tower: 'Cooling Tower',
  boiler: 'Boiler / Hot Water System',
};

export const OPERATING_MODE_LABELS: Record<OperatingMode, string> = {
  cooling_only: 'Cooling Only',
  heating_only: 'Heating Only',
  cooling_heating: 'Cooling & Heating',
  economizer: 'Economizer Enabled',
  heat_recovery: 'Heat Recovery',
};

// Default control parameters by system type
export const DEFAULT_CONTROL_PARAMS: Record<SystemType, Partial<ControlParameters>> = {
  ahu: {
    coolingSetpoint: 75,
    heatingSetpoint: 70,
    supplyAirTemp: 55,
    ductStaticPressure: 1.5,
    minOutsideAir: 20,
    designCfm: 10000,
    occupiedStart: '07:00',
    occupiedEnd: '18:00',
    freezeProtectTemp: 38,
    minVfdSpeed: 30,
    maxVfdSpeed: 100,
    economizer: true,
    economizerLockout: 75,
    filterDpAlarm: 1.0,
  },
  chiller_plant: {
    chilledWaterSupplyTemp: 44,
    condenserWaterTemp: 85,
    designGpm: 500,
    occupiedStart: '06:00',
    occupiedEnd: '20:00',
    stagingDelay: 300,
    leadLagRotation: true,
    minVfdSpeed: 20,
  },
  vrf: {
    coolingSetpoint: 75,
    heatingSetpoint: 70,
    occupiedStart: '07:00',
    occupiedEnd: '18:00',
    heatRecovery: true,
  },
  fcu: {
    coolingSetpoint: 75,
    heatingSetpoint: 70,
    minVfdSpeed: 0,
    maxVfdSpeed: 100,
  },
  split_package: {
    coolingSetpoint: 75,
    heatingSetpoint: 70,
    supplyAirTemp: 55,
    designCfm: 2000,
    economizer: false,
    occupiedStart: '07:00',
    occupiedEnd: '18:00',
  },
  cooling_tower: {
    condenserWaterTemp: 85,
    designGpm: 1000,
    minVfdSpeed: 25,
    maxVfdSpeed: 100,
    stagingDelay: 180,
  },
  boiler: {
    hotWaterSupplyTemp: 180,
    heatingSetpoint: 70,
    designGpm: 200,
    stagingDelay: 300,
    leadLagRotation: true,
  },
};

// AHU Template
export function generateAHUSequence(
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  const zoneList = zones.length > 0 ? zones.join(', ') : 'designated zones';
  
  return {
    systemDescription: `Air Handling Unit ${equipmentTag} is a variable air volume (VAV) system serving ${zoneList}. The unit is equipped with supply and return fans with variable frequency drives (VFDs), chilled water cooling coil, hot water heating coil${params.economizer ? ', and economizer section with modulating outside air dampers' : ''}. Design airflow is ${params.designCfm || 'TBD'} CFM.`,
    
    equipmentList: [
      `Supply Fan with VFD - ${params.designCfm} CFM`,
      `Return Fan with VFD`,
      `Chilled Water Cooling Coil`,
      `Hot Water Heating Coil`,
      params.economizer ? `Economizer Damper Section` : null,
      `MERV-13 Pre-Filter`,
      `MERV-15 Final Filter`,
      `Duct Smoke Detector`,
    ].filter(Boolean) as string[],
    
    servedZones: zones,
    
    startupSequence: [
      {
        stepNumber: 1,
        description: 'Safety Verification',
        condition: 'Upon call for operation',
        action: 'Verify supply air duct smoke detector is in normal (non-alarm) state. If in alarm, unit shall not start.',
        notes: 'Fire alarm interface required',
      },
      {
        stepNumber: 2,
        description: 'Damper Positioning',
        condition: 'Smoke detector clear',
        action: `Open outside air damper to minimum position (${params.minOutsideAir || 20}%). Close relief/exhaust damper. Open return air damper.`,
      },
      {
        stepNumber: 3,
        description: 'Supply Fan Start',
        condition: 'Dampers positioned',
        action: `Start supply fan VFD at ${params.minVfdSpeed || 30}% speed. Verify airflow is established via flow station or current draw.`,
        setpoint: `Initial speed: ${params.minVfdSpeed || 30}%`,
      },
      {
        stepNumber: 4,
        description: 'Return Fan Start',
        condition: 'Supply fan running for 30 seconds',
        action: 'Start return fan VFD. Track supply fan speed with offset for building pressurization.',
        setpoint: 'Return fan speed = Supply fan speed - 10%',
      },
      {
        stepNumber: 5,
        description: 'Enable Temperature Control',
        condition: 'Both fans operating normally',
        action: `Enable cooling coil valve modulation to maintain supply air temperature at ${params.supplyAirTemp || 55}°F. Enable heating coil if outdoor air temperature is below ${params.heatingSetpoint || 70}°F.`,
        setpoint: `SAT setpoint: ${params.supplyAirTemp || 55}°F`,
      },
    ],
    
    normalOperation: [
      {
        stepNumber: 1,
        description: 'Supply Air Temperature Control',
        condition: 'Occupied mode',
        action: `Modulate chilled water valve to maintain supply air temperature at setpoint. ${params.economizer ? 'When outdoor conditions permit, use economizer before mechanical cooling.' : ''}`,
        setpoint: `Cooling SAT: ${params.supplyAirTemp || 55}°F`,
      },
      {
        stepNumber: 2,
        description: 'Duct Static Pressure Control',
        condition: 'Supply fan operating',
        action: `Modulate supply fan VFD speed to maintain duct static pressure at setpoint measured 2/3 down the longest duct run.`,
        setpoint: `Static pressure: ${params.ductStaticPressure || 1.5} in.wg`,
      },
      {
        stepNumber: 3,
        description: 'Return Fan Tracking',
        condition: 'Supply fan operating',
        action: 'Modulate return fan VFD to maintain building at slight positive pressure. Return CFM shall be less than supply CFM.',
        setpoint: 'Building pressure: +0.03 to +0.05 in.wg',
      },
      ...(params.economizer ? [{
        stepNumber: 4,
        description: 'Economizer Operation',
        condition: `Outdoor air temperature below ${params.economizerLockout || 75}°F and outdoor enthalpy below return air enthalpy`,
        action: 'Modulate outside air damper from minimum to 100% to provide free cooling. Close return air damper proportionally.',
        setpoint: `Economizer lockout: ${params.economizerLockout || 75}°F OAT`,
      }] : []),
      ...(params.demandControlVentilation ? [{
        stepNumber: 5,
        description: 'Demand Control Ventilation',
        condition: 'CO2 sensors installed in return duct or zones',
        action: 'Reset minimum outside air damper position based on CO2 levels. Increase OA when CO2 exceeds 800 ppm, decrease when below 600 ppm.',
        setpoint: 'CO2 setpoint: 800 ppm',
      }] : []),
    ],
    
    shutdownSequence: [
      {
        stepNumber: 1,
        description: 'Disable Heating/Cooling',
        condition: 'Upon call for shutdown or unoccupied schedule',
        action: 'Close chilled water and hot water valves to 0%.',
      },
      {
        stepNumber: 2,
        description: 'Fan Coastdown',
        condition: 'Valves closed',
        action: 'Ramp down supply and return fan VFDs to 0% over 60 seconds.',
      },
      {
        stepNumber: 3,
        description: 'Damper Positioning',
        condition: 'Fans stopped',
        action: 'Close outside air damper. Open return air damper to prevent freezing.',
      },
      {
        stepNumber: 4,
        description: 'Freeze Protection Standby',
        condition: 'Unit off',
        action: `Enable freeze protection monitoring. If mixed air temperature falls below ${params.freezeProtectTemp || 38}°F, open heating valve and start supply fan at minimum speed.`,
      },
    ],
    
    safetyInterlocks: [
      {
        stepNumber: 1,
        description: 'Smoke Detector Shutdown',
        condition: 'Duct smoke detector activated',
        action: 'Immediately stop all fans. Close outside air damper. Notify BAS with critical alarm.',
      },
      {
        stepNumber: 2,
        description: 'Freeze Protection',
        condition: `Mixed air or discharge air temperature below ${params.freezeProtectTemp || 38}°F`,
        action: 'Open heating coil valve to 100%. If temperature does not rise within 60 seconds, stop fans and close OA damper.',
      },
      {
        stepNumber: 3,
        description: 'High Static Pressure',
        condition: 'Supply duct static pressure exceeds 3.0 in.wg',
        action: 'Reduce fan speed to minimum. Generate warning alarm. Check for closed VAV dampers.',
      },
      {
        stepNumber: 4,
        description: 'Fan Failure',
        condition: 'Current sensing indicates fan not operating or VFD fault',
        action: 'Shut down unit completely. Generate critical alarm. Disable automatic restart.',
      },
    ],
    
    alarmConditions: [
      { alarmName: 'Smoke Detected', condition: 'Duct smoke detector in alarm', severity: 'critical', action: 'Immediate shutdown, notify fire department' },
      { alarmName: 'Freeze Condition', condition: `Temperature < ${params.freezeProtectTemp || 38}°F`, severity: 'critical', action: 'Enable freeze protection sequence' },
      { alarmName: 'Supply Fan Failure', condition: 'Fan status off while commanded on', severity: 'critical', action: 'Shutdown and lockout' },
      { alarmName: 'High Filter DP', condition: `Filter DP > ${params.filterDpAlarm || 1.0} in.wg`, severity: 'warning', action: 'Generate maintenance work order' },
      { alarmName: 'High Discharge Temp', condition: `SAT > ${(params.supplyAirTemp || 55) + 10}°F when cooling`, severity: 'warning', action: 'Check CHW valve and supply' },
      { alarmName: 'Low Airflow', condition: 'Measured CFM < 80% of setpoint', severity: 'warning', action: 'Check filters, dampers, ductwork' },
    ],
    
    setpointSchedule: [
      { parameter: 'Supply Air Temperature (Cooling)', setpoint: `${params.supplyAirTemp || 55}`, range: '52-58', units: '°F' },
      { parameter: 'Supply Air Temperature (Heating)', setpoint: '85', range: '80-95', units: '°F' },
      { parameter: 'Duct Static Pressure', setpoint: `${params.ductStaticPressure || 1.5}`, range: '0.5-2.5', units: 'in.wg' },
      { parameter: 'Minimum Outside Air', setpoint: `${params.minOutsideAir || 20}`, range: '15-100', units: '%' },
      { parameter: 'Economizer Lockout', setpoint: `${params.economizerLockout || 75}`, range: '65-80', units: '°F OAT' },
      { parameter: 'Freeze Protection', setpoint: `${params.freezeProtectTemp || 38}`, range: '35-42', units: '°F' },
      { parameter: 'Occupied Schedule Start', setpoint: params.occupiedStart || '07:00', units: 'Time' },
      { parameter: 'Occupied Schedule End', setpoint: params.occupiedEnd || '18:00', units: 'Time' },
    ],
    
    maintenanceNotes: [
      'Replace pre-filters every 3 months or when DP exceeds alarm setpoint',
      'Replace final filters every 6-12 months',
      'Inspect and clean cooling/heating coils annually',
      'Verify damper operation and linkages quarterly',
      'Test smoke detectors annually per NFPA 90A',
      'Calibrate sensors (temperature, pressure, airflow) annually',
    ],
  };
}

// Chiller Plant Template
export function generateChillerPlantSequence(
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  return {
    systemDescription: `Chiller Plant ${equipmentTag} consists of water-cooled centrifugal/screw chillers with primary-secondary chilled water distribution, condenser water system with cooling towers, and associated pumping systems. The plant serves ${zones.length > 0 ? zones.join(', ') : 'the building chilled water loop'}.`,
    
    equipmentList: [
      'Chiller CH-1 (Lead)',
      'Chiller CH-2 (Lag)',
      'Primary Chilled Water Pumps PCHWP-1, PCHWP-2',
      'Secondary Chilled Water Pumps SCHWP-1, SCHWP-2 with VFDs',
      'Condenser Water Pumps CWP-1, CWP-2',
      'Cooling Towers CT-1, CT-2',
      'Plate Heat Exchanger (Free Cooling)',
    ],
    
    servedZones: zones,
    
    startupSequence: [
      {
        stepNumber: 1,
        description: 'System Verification',
        condition: 'Upon call for cooling (building load > 10% design)',
        action: 'Verify chilled water and condenser water isolation valves are open. Check glycol concentration if applicable.',
      },
      {
        stepNumber: 2,
        description: 'Start Cooling Tower',
        condition: 'Valves verified open',
        action: 'Start lead cooling tower fans. Verify basin water level and makeup water operation.',
        setpoint: `CW leaving temp: ${params.condenserWaterTemp || 85}°F`,
      },
      {
        stepNumber: 3,
        description: 'Start Condenser Water Pump',
        condition: 'Cooling tower running for 60 seconds',
        action: 'Start lead condenser water pump. Verify flow via flow switch or differential pressure.',
      },
      {
        stepNumber: 4,
        description: 'Start Primary CHW Pump',
        condition: 'CW flow established',
        action: 'Start lead primary chilled water pump. Verify CHW flow through chiller.',
      },
      {
        stepNumber: 5,
        description: 'Start Chiller',
        condition: 'CHW and CW flow verified, minimum flow met',
        action: `Start lead chiller. Allow ${params.stagingDelay || 300} seconds for stabilization before loading.`,
        setpoint: `CHWS temp: ${params.chilledWaterSupplyTemp || 44}°F`,
      },
      {
        stepNumber: 6,
        description: 'Start Secondary Pump',
        condition: 'Chiller online and loaded',
        action: 'Start secondary CHW pump VFD. Modulate speed to maintain differential pressure setpoint.',
      },
    ],
    
    normalOperation: [
      {
        stepNumber: 1,
        description: 'Chilled Water Temperature Control',
        condition: 'Plant operating',
        action: `Chiller modulates capacity to maintain leaving chilled water temperature at setpoint. Reset setpoint based on outdoor temperature or load.`,
        setpoint: `CHWS: ${params.chilledWaterSupplyTemp || 44}°F (reset 44-48°F)`,
      },
      {
        stepNumber: 2,
        description: 'Secondary Pump Control',
        condition: 'Building load varies',
        action: 'Modulate secondary pump VFD speed to maintain differential pressure at most remote coil.',
        setpoint: 'DP setpoint: 15 psid (adjustable)',
      },
      {
        stepNumber: 3,
        description: 'Chiller Staging',
        condition: 'Running chiller at >90% capacity for 15 minutes',
        action: `Stage on lag chiller. Wait ${params.stagingDelay || 300} seconds between stages.${params.leadLagRotation ? ' Rotate lead/lag on weekly basis.' : ''}`,
      },
      {
        stepNumber: 4,
        description: 'Chiller Destaging',
        condition: 'Running chillers at combined <50% capacity',
        action: 'Stage off lag chiller. Transfer load smoothly to lead chiller.',
      },
      {
        stepNumber: 5,
        description: 'Cooling Tower Control',
        condition: 'Condenser water temperature varies',
        action: `Stage cooling tower fans to maintain condenser water supply temperature. Use VFDs where available.`,
        setpoint: `CWS: ${params.condenserWaterTemp || 85}°F`,
      },
    ],
    
    shutdownSequence: [
      {
        stepNumber: 1,
        description: 'Unload Chillers',
        condition: 'Upon call for shutdown',
        action: 'Reduce chiller loading to minimum (typically 20-25%). Allow 5 minutes for unloading.',
      },
      {
        stepNumber: 2,
        description: 'Stop Chillers',
        condition: 'Chillers at minimum load',
        action: 'Stop chillers in reverse order of staging (lag first, then lead).',
      },
      {
        stepNumber: 3,
        description: 'Pump Down',
        condition: 'All chillers stopped',
        action: 'Run CHW and CW pumps for 5 minutes to dissipate residual heat. Then stop pumps.',
      },
      {
        stepNumber: 4,
        description: 'Stop Cooling Towers',
        condition: 'CW pumps stopped',
        action: 'Stop cooling tower fans. Maintain basin heaters if ambient conditions require.',
      },
    ],
    
    safetyInterlocks: [
      {
        stepNumber: 1,
        description: 'Low CHW Flow',
        condition: 'CHW flow < minimum (typically 50% of design)',
        action: 'Alarm and reduce chiller capacity. If flow falls below critical minimum, stop chiller.',
      },
      {
        stepNumber: 2,
        description: 'Low CW Flow',
        condition: 'CW flow switch open or DP below minimum',
        action: 'Immediately stop chiller to prevent condenser damage.',
      },
      {
        stepNumber: 3,
        description: 'High Condenser Pressure',
        condition: 'Condenser refrigerant pressure above limit',
        action: 'Chiller internal safeties will trip. Increase cooling tower capacity or reduce load.',
      },
      {
        stepNumber: 4,
        description: 'Low Evaporator Temperature',
        condition: 'Leaving CHW temperature approaching freeze point',
        action: 'Reduce chiller capacity. If below 36°F, stop chiller.',
      },
    ],
    
    alarmConditions: [
      { alarmName: 'Chiller Fault', condition: 'Internal chiller safety trip', severity: 'critical', action: 'Do not auto-restart. Investigate cause.' },
      { alarmName: 'Low CHW Flow', condition: 'Flow < 50% of design', severity: 'critical', action: 'Reduce capacity or shutdown' },
      { alarmName: 'High CHWS Temp', condition: 'CHWS > setpoint + 5°F', severity: 'warning', action: 'Stage additional chiller' },
      { alarmName: 'CT Basin Low Level', condition: 'Basin level below minimum', severity: 'warning', action: 'Check makeup water' },
      { alarmName: 'CW High Temp', condition: `CWS > ${(params.condenserWaterTemp || 85) + 10}°F`, severity: 'warning', action: 'Stage additional CT fans' },
    ],
    
    setpointSchedule: [
      { parameter: 'CHW Supply Temperature', setpoint: `${params.chilledWaterSupplyTemp || 44}`, range: '42-48', units: '°F' },
      { parameter: 'CHW Return Temperature', setpoint: '54', range: '52-58', units: '°F' },
      { parameter: 'CW Supply Temperature', setpoint: `${params.condenserWaterTemp || 85}`, range: '75-90', units: '°F' },
      { parameter: 'Secondary DP Setpoint', setpoint: '15', range: '10-25', units: 'psid' },
      { parameter: 'Staging Delay', setpoint: `${params.stagingDelay || 300}`, range: '180-600', units: 'seconds' },
      { parameter: 'Plant Enable OAT', setpoint: '55', range: '50-65', units: '°F' },
    ],
    
    maintenanceNotes: [
      'Perform chiller eddy current tube inspection annually',
      'Clean condenser tubes annually or as indicated by approach temperature',
      'Check refrigerant charge and oil levels quarterly',
      'Inspect cooling tower fill and drift eliminators annually',
      'Test water treatment weekly and adjust chemicals',
      'Verify flow switch and safety device operation monthly',
    ],
  };
}

// VRF Template
export function generateVRFSequence(
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  return {
    systemDescription: `Variable Refrigerant Flow (VRF) System ${equipmentTag} is a ${params.heatRecovery ? 'heat recovery' : 'heat pump'} type system serving ${zones.length > 0 ? zones.join(', ') : 'multiple indoor units'}. The system allows simultaneous heating and cooling${params.heatRecovery ? ' with heat recovery between zones' : ''}.`,
    
    equipmentList: [
      `Outdoor Unit(s) - ${equipmentTag}`,
      'Indoor Units - Wall-mounted, Ceiling Cassette, Ducted',
      'Branch Selector Boxes (Heat Recovery)',
      'Refrigerant Piping - Liquid and Suction Lines',
      'Wired Remote Controllers',
      'Central Controller / BMS Interface',
    ],
    
    servedZones: zones,
    
    startupSequence: [
      {
        stepNumber: 1,
        description: 'Pre-Start Check',
        condition: 'Upon power-up after extended shutdown',
        action: 'Allow crankcase heater to warm compressor oil for minimum 8 hours before first start.',
      },
      {
        stepNumber: 2,
        description: 'Controller Initialization',
        condition: 'System powered',
        action: 'Central controller performs auto-addressing of all indoor units and branch selectors.',
      },
      {
        stepNumber: 3,
        description: 'Start Outdoor Unit',
        condition: 'Indoor unit calls for cooling or heating',
        action: 'Outdoor unit receives demand signal. Inverter compressor starts at low frequency.',
      },
      {
        stepNumber: 4,
        description: 'Refrigerant Distribution',
        condition: 'Compressor running',
        action: 'Electronic expansion valves (EEVs) modulate to distribute refrigerant to calling indoor units.',
      },
      {
        stepNumber: 5,
        description: 'Fan Operation',
        condition: 'Refrigerant flow established',
        action: 'Indoor unit fan starts. Speed based on thermostat demand or user selection.',
      },
    ],
    
    normalOperation: [
      {
        stepNumber: 1,
        description: 'Zone Temperature Control',
        condition: 'System in operation',
        action: `Each indoor unit modulates EEV and fan speed to maintain zone setpoint.`,
        setpoint: `Cooling: ${params.coolingSetpoint || 75}°F / Heating: ${params.heatingSetpoint || 70}°F`,
      },
      {
        stepNumber: 2,
        description: 'Compressor Capacity Control',
        condition: 'Multiple zones operating',
        action: 'Outdoor unit inverter adjusts compressor frequency based on total system demand. Range typically 15Hz to 120Hz.',
      },
      ...(params.heatRecovery ? [{
        stepNumber: 3,
        description: 'Heat Recovery Mode',
        condition: 'Simultaneous heating and cooling demand',
        action: 'Branch selector boxes route refrigerant to provide heating to some zones and cooling to others. Heat rejected from cooling zones is recovered for heating zones.',
      }] : []),
      {
        stepNumber: 4,
        description: 'Defrost Cycle',
        condition: 'Outdoor coil temperature drops below threshold in heating mode (typically 25°F)',
        action: 'System initiates defrost. Indoor units may temporarily switch to cooling to provide hot gas for outdoor coil defrost. Duration typically 5-10 minutes.',
      },
      {
        stepNumber: 5,
        description: 'Oil Return',
        condition: 'Low oil level detected in outdoor unit',
        action: 'System initiates oil recovery cycle. All indoor EEVs modulate to return oil to outdoor unit compressor.',
      },
    ],
    
    shutdownSequence: [
      {
        stepNumber: 1,
        description: 'Zone Off Command',
        condition: 'User or schedule turns off zone',
        action: 'Indoor unit fan continues briefly to dissipate residual capacity. EEV closes.',
      },
      {
        stepNumber: 2,
        description: 'Reduce Outdoor Capacity',
        condition: 'Zones turning off',
        action: 'Outdoor unit reduces compressor frequency as demand decreases.',
      },
      {
        stepNumber: 3,
        description: 'Complete Shutdown',
        condition: 'All zones off',
        action: 'Outdoor unit compressor stops. Crankcase heater energizes to prevent refrigerant migration.',
      },
    ],
    
    safetyInterlocks: [
      {
        stepNumber: 1,
        description: 'High Pressure Protection',
        condition: 'Discharge pressure exceeds limit',
        action: 'Reduce compressor capacity. If condition persists, stop compressor.',
      },
      {
        stepNumber: 2,
        description: 'Low Pressure Protection',
        condition: 'Suction pressure falls below limit',
        action: 'Stop compressor to prevent damage. Check for refrigerant leak.',
      },
      {
        stepNumber: 3,
        description: 'Overcurrent Protection',
        condition: 'Compressor current exceeds rated value',
        action: 'Reduce capacity or stop compressor.',
      },
      {
        stepNumber: 4,
        description: 'High Ambient Lockout',
        condition: 'Outdoor temperature exceeds operating range (typically 115°F)',
        action: 'Reduce capacity. System may lock out in extreme conditions.',
        notes: 'Critical for Saudi Arabia high-ambient operation',
      },
    ],
    
    alarmConditions: [
      { alarmName: 'Compressor Fault', condition: 'Inverter or compressor protection trip', severity: 'critical', action: 'System lockout, manual reset required' },
      { alarmName: 'Communication Error', condition: 'Indoor unit communication lost', severity: 'warning', action: 'Check wiring and address settings' },
      { alarmName: 'Refrigerant Leak', condition: 'Low pressure with high superheat', severity: 'critical', action: 'Stop system, locate and repair leak' },
      { alarmName: 'Filter Dirty', condition: 'Indoor unit filter timer expired', severity: 'info', action: 'Clean or replace filter' },
      { alarmName: 'High Ambient', condition: 'OAT > 110°F', severity: 'warning', action: 'System may operate at reduced capacity' },
    ],
    
    setpointSchedule: [
      { parameter: 'Cooling Setpoint', setpoint: `${params.coolingSetpoint || 75}`, range: '64-86', units: '°F' },
      { parameter: 'Heating Setpoint', setpoint: `${params.heatingSetpoint || 70}`, range: '60-86', units: '°F' },
      { parameter: 'Fan Speed', setpoint: 'Auto', range: 'Low/Med/High/Auto', units: '-' },
      { parameter: 'Defrost Initiation', setpoint: '25', range: '20-32', units: '°F outdoor coil' },
      { parameter: 'High Ambient Limit', setpoint: '115', units: '°F OAT' },
    ],
    
    maintenanceNotes: [
      'Clean indoor unit filters every 2-4 weeks (washable type)',
      'Clean outdoor unit coil annually or as needed',
      'Check refrigerant charge annually using manufacturer procedures',
      'Inspect and clean condensate drains monthly',
      'Update firmware as manufacturer releases updates',
      'Perform thermal imaging annually to check connections',
    ],
  };
}

// FCU Template
export function generateFCUSequence(
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  return {
    systemDescription: `Fan Coil Unit ${equipmentTag} is a ${params.heatingSetpoint ? '4-pipe' : '2-pipe'} system serving ${zones.length > 0 ? zones[0] : 'the designated zone'}. The unit includes a multi-speed or ECM fan motor with chilled water cooling coil${params.heatingSetpoint ? ' and hot water heating coil' : ''}.`,
    
    equipmentList: [
      `Fan Coil Unit - ${equipmentTag}`,
      'Chilled Water Coil with 2-way Valve',
      params.heatingSetpoint ? 'Hot Water Coil with 2-way Valve' : null,
      'Multi-Speed Fan Motor or ECM',
      'Digital Thermostat / Zone Controller',
      'Condensate Pump (if required)',
    ].filter(Boolean) as string[],
    
    servedZones: zones,
    
    startupSequence: [
      {
        stepNumber: 1,
        description: 'Thermostat Call',
        condition: 'Zone temperature deviates from setpoint',
        action: `Thermostat sends cooling call (zone temp > ${params.coolingSetpoint || 75}°F) or heating call (zone temp < ${params.heatingSetpoint || 70}°F).`,
      },
      {
        stepNumber: 2,
        description: 'Valve Operation',
        condition: 'Call received',
        action: 'Open appropriate water valve (CHW for cooling, HW for heating). For 2-pipe system, central changeover determines water temperature.',
      },
      {
        stepNumber: 3,
        description: 'Fan Start',
        condition: 'Valve opening',
        action: 'Start fan motor at speed determined by thermostat demand (low/medium/high or modulating).',
      },
    ],
    
    normalOperation: [
      {
        stepNumber: 1,
        description: 'Temperature Control',
        condition: 'Unit operating',
        action: `Modulate water valve to maintain zone temperature at setpoint. Fan speed may adjust based on load.`,
        setpoint: `Cooling: ${params.coolingSetpoint || 75}°F / Heating: ${params.heatingSetpoint || 70}°F`,
      },
      {
        stepNumber: 2,
        description: 'Fan Speed Control',
        condition: 'Thermostat in Auto mode',
        action: 'Fan speed increases as demand increases. In manual mode, operates at user-selected speed.',
      },
      {
        stepNumber: 3,
        description: 'Deadband Operation',
        condition: 'Zone temperature within ±1°F of setpoint',
        action: 'Unit may cycle or modulate to minimum to prevent overcooling/overheating.',
      },
    ],
    
    shutdownSequence: [
      {
        stepNumber: 1,
        description: 'Setpoint Satisfied',
        condition: 'Zone temperature reaches setpoint',
        action: 'Close water valve. Fan continues to run briefly to extract residual capacity from coil.',
      },
      {
        stepNumber: 2,
        description: 'Fan Off',
        condition: 'Coil temperature normalizes',
        action: 'Fan stops. Unit enters standby mode awaiting next thermostat call.',
      },
    ],
    
    safetyInterlocks: [
      {
        stepNumber: 1,
        description: 'Condensate Overflow',
        condition: 'Condensate pan high level switch activated',
        action: 'Stop fan and close valves to prevent water damage. Generate alarm.',
      },
      {
        stepNumber: 2,
        description: 'Motor Thermal Protection',
        condition: 'Fan motor overheats',
        action: 'Internal thermal overload stops motor. Allow cooldown before restart.',
      },
    ],
    
    alarmConditions: [
      { alarmName: 'Condensate Overflow', condition: 'High level switch closed', severity: 'critical', action: 'Shutdown unit, clear drain' },
      { alarmName: 'Fan Failure', condition: 'No airflow when commanded', severity: 'warning', action: 'Check motor and capacitor' },
      { alarmName: 'Valve Stuck', condition: 'Zone temp not responding to valve command', severity: 'warning', action: 'Check valve actuator' },
      { alarmName: 'Filter Dirty', condition: 'Maintenance timer expired', severity: 'info', action: 'Clean or replace filter' },
    ],
    
    setpointSchedule: [
      { parameter: 'Cooling Setpoint', setpoint: `${params.coolingSetpoint || 75}`, range: '68-78', units: '°F' },
      { parameter: 'Heating Setpoint', setpoint: `${params.heatingSetpoint || 70}`, range: '65-75', units: '°F' },
      { parameter: 'Deadband', setpoint: '2', range: '1-4', units: '°F' },
      { parameter: 'Default Fan Speed', setpoint: 'Auto', units: '-' },
    ],
    
    maintenanceNotes: [
      'Clean or replace filters monthly',
      'Clean condensate drain pan and line quarterly',
      'Inspect coil condition annually',
      'Verify valve operation annually',
      'Check fan motor bearings and belts (if applicable)',
    ],
  };
}

// Split/Package Unit Template
export function generateSplitPackageSequence(
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  return {
    systemDescription: `Split/Package Unit ${equipmentTag} is a direct expansion (DX) cooling system${params.heatingSetpoint ? ' with electric or gas heating' : ''} serving ${zones.length > 0 ? zones.join(', ') : 'the designated area'}. Design capacity is ${params.designCfm || 'TBD'} CFM.`,
    
    equipmentList: [
      `${equipmentTag} - Indoor Unit`,
      'Outdoor Condensing Unit',
      'Compressor(s) - Scroll or Reciprocating',
      'Evaporator Coil with TXV',
      'Supply Fan - Direct Drive or Belt',
      params.heatingSetpoint ? 'Electric Heat Strip or Gas Furnace' : null,
      'Thermostat',
    ].filter(Boolean) as string[],
    
    servedZones: zones,
    
    startupSequence: [
      {
        stepNumber: 1,
        description: 'Thermostat Call',
        condition: 'Zone temperature deviates from setpoint by deadband',
        action: `Thermostat calls for cooling (temp > ${params.coolingSetpoint || 75}°F + deadband) or heating.`,
      },
      {
        stepNumber: 2,
        description: 'Start Indoor Fan',
        condition: 'G terminal energized',
        action: 'Indoor fan starts to establish airflow across evaporator coil.',
      },
      {
        stepNumber: 3,
        description: 'Start Compressor',
        condition: 'Indoor fan proven (or after 30 second delay)',
        action: 'Outdoor contactor closes, starting compressor. Condenser fan starts.',
      },
      {
        stepNumber: 4,
        description: 'Stage Additional Compressor',
        condition: 'Multi-stage unit and temperature not satisfied after 10 minutes',
        action: 'Energize second stage compressor or unloader.',
      },
    ],
    
    normalOperation: [
      {
        stepNumber: 1,
        description: 'Cooling Operation',
        condition: 'Compressor running',
        action: `DX coil provides cooling. Compressor runs until zone temperature falls to setpoint minus deadband.`,
        setpoint: `${params.coolingSetpoint || 75}°F`,
      },
      ...(params.heatingSetpoint ? [{
        stepNumber: 2,
        description: 'Heating Operation',
        condition: 'Heat call from thermostat',
        action: 'Electric heat strips energize in stages or gas valve opens. Indoor fan operates to distribute heat.',
        setpoint: `${params.heatingSetpoint}°F`,
      }] : []),
      ...(params.economizer ? [{
        stepNumber: 3,
        description: 'Economizer Operation',
        condition: `OAT < ${params.economizerLockout || 75}°F and economizer enabled`,
        action: 'Modulate outside air damper to provide free cooling. Compressor remains off if OA meets load.',
      }] : []),
    ],
    
    shutdownSequence: [
      {
        stepNumber: 1,
        description: 'Setpoint Satisfied',
        condition: 'Zone temperature reaches setpoint',
        action: 'Compressor de-energizes. Indoor fan continues for 60-90 seconds to extract coil capacity.',
      },
      {
        stepNumber: 2,
        description: 'Fan Off',
        condition: 'Delay timer complete',
        action: 'Indoor fan stops. System enters standby.',
      },
    ],
    
    safetyInterlocks: [
      {
        stepNumber: 1,
        description: 'High Pressure Safety',
        condition: 'Discharge pressure exceeds cutout (typically 400-450 psig for R-410A)',
        action: 'Compressor stops on high pressure switch. Manual reset may be required.',
      },
      {
        stepNumber: 2,
        description: 'Low Pressure Safety',
        condition: 'Suction pressure falls below cutout',
        action: 'Compressor stops on low pressure switch. Check for low refrigerant.',
      },
      {
        stepNumber: 3,
        description: 'Freeze Protection',
        condition: 'Suction line temperature below 32°F',
        action: 'Stop compressor to prevent evaporator icing.',
      },
      {
        stepNumber: 4,
        description: 'Motor Overload',
        condition: 'Compressor or fan motor draws excessive current',
        action: 'Internal overload trips motor. Allow cooldown before restart.',
      },
    ],
    
    alarmConditions: [
      { alarmName: 'High Pressure Lockout', condition: 'HP switch tripped', severity: 'critical', action: 'Check condenser airflow and refrigerant charge' },
      { alarmName: 'Low Pressure Lockout', condition: 'LP switch tripped', severity: 'critical', action: 'Check for refrigerant leak or restriction' },
      { alarmName: 'Compressor Failure', condition: 'Compressor not running when commanded', severity: 'critical', action: 'Check contactor and wiring' },
      { alarmName: 'Dirty Filter', condition: 'High static pressure or timer', severity: 'warning', action: 'Replace filter' },
      { alarmName: 'Frozen Coil', condition: 'Suction temp < 32°F', severity: 'warning', action: 'Check airflow and refrigerant' },
    ],
    
    setpointSchedule: [
      { parameter: 'Cooling Setpoint', setpoint: `${params.coolingSetpoint || 75}`, range: '68-80', units: '°F' },
      { parameter: 'Heating Setpoint', setpoint: `${params.heatingSetpoint || 70}`, range: '60-75', units: '°F' },
      { parameter: 'Deadband', setpoint: '1', range: '0.5-3', units: '°F' },
      { parameter: 'Fan-On Delay', setpoint: '30', units: 'seconds' },
      { parameter: 'Fan-Off Delay', setpoint: '90', units: 'seconds' },
    ],
    
    maintenanceNotes: [
      'Replace air filters monthly',
      'Clean evaporator coil annually',
      'Clean condenser coil annually (more often in dusty environments)',
      'Check refrigerant charge annually',
      'Verify thermostat calibration',
      'Lubricate motor bearings if applicable',
    ],
  };
}

// Cooling Tower Template
export function generateCoolingTowerSequence(
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  return {
    systemDescription: `Cooling Tower ${equipmentTag} rejects heat from the condenser water system. Design capacity is ${params.designGpm || 'TBD'} GPM with approach temperature designed for local wet bulb conditions.`,
    
    equipmentList: [
      `Cooling Tower - ${equipmentTag}`,
      'Tower Fan(s) with VFD (if equipped)',
      'Basin Heater',
      'Makeup Water Float Valve',
      'Bleed/Blowdown Valve',
      'Chemical Treatment System',
    ],
    
    servedZones: zones,
    
    startupSequence: [
      {
        stepNumber: 1,
        description: 'Basin Level Check',
        condition: 'CW pump about to start',
        action: 'Verify basin water level is adequate. Makeup valve should maintain level.',
      },
      {
        stepNumber: 2,
        description: 'Start Lead Fan',
        condition: 'CW flow established through tower',
        action: `Start lead cooling tower fan${params.minVfdSpeed ? ` at ${params.minVfdSpeed}% speed` : ''}. Verify rotation and airflow.`,
      },
    ],
    
    normalOperation: [
      {
        stepNumber: 1,
        description: 'CW Temperature Control',
        condition: 'Tower operating',
        action: `Modulate fan speed (VFD) or stage fans on/off to maintain leaving condenser water temperature at setpoint.`,
        setpoint: `CWS: ${params.condenserWaterTemp || 85}°F`,
      },
      {
        stepNumber: 2,
        description: 'Fan Staging',
        condition: 'Multiple fans available',
        action: `Stage fans based on CW temperature. Wait ${params.stagingDelay || 180} seconds between stages.`,
      },
      {
        stepNumber: 3,
        description: 'Free Cooling Mode',
        condition: 'Wet bulb temperature allows tower to meet load without chiller',
        action: 'Operate tower to provide water temperature suitable for direct heat exchange, bypassing chiller.',
      },
    ],
    
    shutdownSequence: [
      {
        stepNumber: 1,
        description: 'Stop Fans',
        condition: 'Chiller plant shutting down',
        action: 'Stop tower fans. Continue CW flow briefly if needed for chiller coastdown.',
      },
      {
        stepNumber: 2,
        description: 'Freeze Protection',
        condition: 'OAT approaching freezing',
        action: 'Energize basin heater. Consider draining tower if extended shutdown.',
      },
    ],
    
    safetyInterlocks: [
      {
        stepNumber: 1,
        description: 'Fan Vibration',
        condition: 'Vibration switch activated',
        action: 'Stop fan immediately. Inspect for blade damage or imbalance.',
      },
      {
        stepNumber: 2,
        description: 'Low Basin Level',
        condition: 'Level switch indicates low water',
        action: 'Alarm for makeup water failure. Stop fans if level critical.',
      },
    ],
    
    alarmConditions: [
      { alarmName: 'High CW Temp', condition: `CWS > ${(params.condenserWaterTemp || 85) + 10}°F`, severity: 'warning', action: 'Stage additional fans, check fill condition' },
      { alarmName: 'Fan Vibration', condition: 'Vibration switch closed', severity: 'critical', action: 'Stop fan, inspect' },
      { alarmName: 'Low Basin Level', condition: 'Low level switch active', severity: 'warning', action: 'Check makeup water supply' },
      { alarmName: 'Freeze Warning', condition: 'OAT < 40°F', severity: 'info', action: 'Verify basin heater operation' },
    ],
    
    setpointSchedule: [
      { parameter: 'CW Supply Temperature', setpoint: `${params.condenserWaterTemp || 85}`, range: '70-95', units: '°F' },
      { parameter: 'Fan Staging Delay', setpoint: `${params.stagingDelay || 180}`, range: '60-300', units: 'seconds' },
      { parameter: 'Min Fan Speed (VFD)', setpoint: `${params.minVfdSpeed || 25}`, range: '20-40', units: '%' },
    ],
    
    maintenanceNotes: [
      'Inspect and clean fill media annually',
      'Check drift eliminators annually',
      'Test and treat water weekly',
      'Inspect fan blades and bearings monthly',
      'Clean basin and strainers quarterly',
      'Verify basin heater operation before winter',
    ],
  };
}

// Boiler Template
export function generateBoilerSequence(
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  return {
    systemDescription: `Boiler ${equipmentTag} provides hot water for heating. Design supply temperature is ${params.hotWaterSupplyTemp || 180}°F at ${params.designGpm || 'TBD'} GPM.${params.leadLagRotation ? ' Multiple boilers operate in lead-lag configuration.' : ''}`,
    
    equipmentList: [
      `Boiler - ${equipmentTag}`,
      'Burner Assembly',
      'Hot Water Circulating Pumps',
      'Expansion Tank',
      'Air Separator',
      'Safety Relief Valve',
      'Low Water Cutoff',
    ],
    
    servedZones: zones,
    
    startupSequence: [
      {
        stepNumber: 1,
        description: 'Pre-Purge',
        condition: 'Call for heat',
        action: 'Combustion air fan runs to purge combustion chamber of any residual gas.',
      },
      {
        stepNumber: 2,
        description: 'Ignition',
        condition: 'Pre-purge complete',
        action: 'Igniter energizes. Gas valve opens. Flame sensor verifies ignition within 4 seconds.',
      },
      {
        stepNumber: 3,
        description: 'Modulation',
        condition: 'Flame established',
        action: 'Burner modulates from low fire to meet demand. Modulation based on water temperature.',
      },
    ],
    
    normalOperation: [
      {
        stepNumber: 1,
        description: 'Temperature Control',
        condition: 'Boiler firing',
        action: `Modulate burner to maintain hot water supply temperature at setpoint.`,
        setpoint: `HWS: ${params.hotWaterSupplyTemp || 180}°F`,
      },
      {
        stepNumber: 2,
        description: 'Outdoor Reset',
        condition: 'OAT sensor installed',
        action: 'Reset HWS temperature based on outdoor temperature. Lower OAT = higher HWS temp.',
        setpoint: 'Reset schedule: 180°F @ 0°F OAT to 140°F @ 60°F OAT',
      },
      {
        stepNumber: 3,
        description: 'Boiler Staging',
        condition: 'Multiple boilers, lead cannot meet load',
        action: `Stage on lag boiler after ${params.stagingDelay || 300} second delay.${params.leadLagRotation ? ' Rotate lead weekly.' : ''}`,
      },
    ],
    
    shutdownSequence: [
      {
        stepNumber: 1,
        description: 'Setpoint Satisfied',
        condition: 'HW temperature exceeds setpoint',
        action: 'Burner modulates to low fire then shuts down.',
      },
      {
        stepNumber: 2,
        description: 'Post-Purge',
        condition: 'Burner off',
        action: 'Combustion fan continues to purge combustion chamber.',
      },
    ],
    
    safetyInterlocks: [
      {
        stepNumber: 1,
        description: 'Flame Failure',
        condition: 'Flame sensor does not detect flame',
        action: 'Close gas valve immediately. Lockout after 3 failed ignition attempts.',
      },
      {
        stepNumber: 2,
        description: 'High Limit',
        condition: 'Water temperature exceeds high limit (typically 200°F)',
        action: 'Burner shuts down. Manual reset required.',
      },
      {
        stepNumber: 3,
        description: 'Low Water Cutoff',
        condition: 'Water level in boiler drops below minimum',
        action: 'Burner shuts down to prevent dry firing. Check for leaks.',
      },
      {
        stepNumber: 4,
        description: 'High Gas Pressure',
        condition: 'Gas pressure exceeds maximum',
        action: 'Burner shutdown. Check gas regulator.',
      },
    ],
    
    alarmConditions: [
      { alarmName: 'Flame Failure', condition: 'No flame detected', severity: 'critical', action: 'Lockout, manual reset required' },
      { alarmName: 'High Limit Trip', condition: 'Water temp > 200°F', severity: 'critical', action: 'Shutdown, investigate cause' },
      { alarmName: 'Low Water', condition: 'LWCO activated', severity: 'critical', action: 'Check water level and makeup' },
      { alarmName: 'Low HWS Temp', condition: 'HWS < setpoint - 10°F', severity: 'warning', action: 'Stage additional boiler' },
    ],
    
    setpointSchedule: [
      { parameter: 'HW Supply Temperature', setpoint: `${params.hotWaterSupplyTemp || 180}`, range: '140-200', units: '°F' },
      { parameter: 'High Limit', setpoint: '200', units: '°F' },
      { parameter: 'Outdoor Reset Range', setpoint: '180 @ 0°F to 140 @ 60°F', units: '°F' },
      { parameter: 'Staging Delay', setpoint: `${params.stagingDelay || 300}`, units: 'seconds' },
    ],
    
    maintenanceNotes: [
      'Perform combustion analysis annually',
      'Clean burner and heat exchanger annually',
      'Test low water cutoff weekly',
      'Test relief valve annually',
      'Check expansion tank pressure annually',
      'Inspect flue and venting annually',
    ],
  };
}

// Main generator function
export function generateSequence(
  systemType: SystemType,
  params: ControlParameters,
  equipmentTag: string,
  zones: string[]
): GeneratedSequence {
  switch (systemType) {
    case 'ahu':
      return generateAHUSequence(params, equipmentTag, zones);
    case 'chiller_plant':
      return generateChillerPlantSequence(params, equipmentTag, zones);
    case 'vrf':
      return generateVRFSequence(params, equipmentTag, zones);
    case 'fcu':
      return generateFCUSequence(params, equipmentTag, zones);
    case 'split_package':
      return generateSplitPackageSequence(params, equipmentTag, zones);
    case 'cooling_tower':
      return generateCoolingTowerSequence(params, equipmentTag, zones);
    case 'boiler':
      return generateBoilerSequence(params, equipmentTag, zones);
    default:
      throw new Error(`Unknown system type: ${systemType}`);
  }
}
