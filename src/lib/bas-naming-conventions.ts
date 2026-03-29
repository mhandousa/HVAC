// BAS Naming Conventions for Saudi Arabia Building Projects

export type NamingConvention = 'saudi_modon' | 'ashrae36' | 'haystack' | 'custom';

export interface NamingConfig {
  convention: NamingConvention;
  customPattern?: string;
  cityCode?: string;
  buildingCode?: string;
  sitePrefix?: string;
}

// Saudi Arabia city codes
export const SAUDI_CITY_CODES: Record<string, string> = {
  'Riyadh': 'RYD',
  'Jeddah': 'JED',
  'Dammam': 'DMM',
  'Makkah': 'MKH',
  'Madinah': 'MED',
  'Khobar': 'KHB',
  'Jubail': 'JUB',
  'Yanbu': 'YNB',
  'Tabuk': 'TBK',
  'Abha': 'ABH',
  'Taif': 'TIF',
  'Buraidah': 'BUR',
  'Hail': 'HAL',
  'Najran': 'NJR',
  'Jazan': 'JZN',
  'Al Kharj': 'KHJ',
  'Al Qatif': 'QTF',
  'Al Ahsa': 'AHS',
  'NEOM': 'NOM',
  'The Red Sea': 'RSP',
};

// Saudi industrial cities (MODON)
export const MODON_INDUSTRIAL_CITIES: Record<string, string> = {
  'Riyadh 1st Industrial City': 'R1IC',
  'Riyadh 2nd Industrial City': 'R2IC',
  'Riyadh 3rd Industrial City': 'R3IC',
  'Jeddah 1st Industrial City': 'J1IC',
  'Jeddah 2nd Industrial City': 'J2IC',
  'Dammam 1st Industrial City': 'D1IC',
  'Dammam 2nd Industrial City': 'D2IC',
  'Dammam 3rd Industrial City': 'D3IC',
  'Jubail Industrial City': 'JUIC',
  'Yanbu Industrial City': 'YNIC',
  'Sudair Industrial City': 'SDIC',
  'Modon Jazan': 'MDJZ',
};

export interface NameComponents {
  site: string;
  building: string;
  floor: string;
  zone: string;
  equipmentTag: string;
  pointId: string;
}

export interface NamingConventionInfo {
  id: NamingConvention;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  pattern: string;
  example: string;
  separator: string;
}

export const NAMING_CONVENTIONS: NamingConventionInfo[] = [
  {
    id: 'saudi_modon',
    name: 'Saudi MODON Standard',
    nameAr: 'معيار مدن السعودية',
    description: 'Standard naming convention for Saudi industrial cities',
    descriptionAr: 'معيار التسمية للمدن الصناعية السعودية',
    pattern: '{CITY}-{BLDG}-{FLR}-{ZONE}-{TAG}-{PT}',
    example: 'RYD-B01-02-Z01-AHU01-SA_TEMP',
    separator: '-',
  },
  {
    id: 'ashrae36',
    name: 'ASHRAE Guideline 36',
    nameAr: 'دليل أشري 36',
    description: 'ASHRAE Guideline 36 naming convention',
    descriptionAr: 'اتفاقية التسمية وفق دليل أشري 36',
    pattern: '{Site}.{Bldg}.{Sys}.{Equip}.{Point}',
    example: 'RYD.HQ.AHU.AHU01.SA_TEMP',
    separator: '.',
  },
  {
    id: 'haystack',
    name: 'Project Haystack',
    nameAr: 'مشروع هايستاك',
    description: 'Project Haystack tagging convention',
    descriptionAr: 'اتفاقية التوسيم لمشروع هايستاك',
    pattern: '{site}-{equip}-{point}',
    example: 'headquarters-ahu-01-sa-temp',
    separator: '-',
  },
  {
    id: 'custom',
    name: 'Custom Pattern',
    nameAr: 'نمط مخصص',
    description: 'User-defined naming pattern',
    descriptionAr: 'نمط تسمية محدد من المستخدم',
    pattern: 'User defined',
    example: 'Based on custom pattern',
    separator: '-',
  },
];

// Format floor number with proper padding
export function formatFloorNumber(floor: number | string): string {
  const floorNum = typeof floor === 'string' ? parseInt(floor, 10) : floor;
  if (isNaN(floorNum)) return 'XX';
  
  if (floorNum < 0) {
    return `B${Math.abs(floorNum).toString().padStart(2, '0')}`; // Basement
  }
  if (floorNum === 0) {
    return 'GF'; // Ground floor
  }
  return floorNum.toString().padStart(2, '0');
}

// Format zone number
export function formatZoneNumber(zone: number | string): string {
  const zoneNum = typeof zone === 'string' ? parseInt(zone, 10) : zone;
  if (isNaN(zoneNum)) return zone?.toString() || 'Z01';
  return `Z${zoneNum.toString().padStart(2, '0')}`;
}

// Generate point name based on convention
export function generatePointName(
  components: NameComponents,
  config: NamingConfig
): string {
  const { site, building, floor, zone, equipmentTag, pointId } = components;
  const { convention, customPattern, cityCode, buildingCode, sitePrefix } = config;

  const effectiveSite = sitePrefix || cityCode || site;
  const effectiveBuilding = buildingCode || building;

  switch (convention) {
    case 'saudi_modon':
      return [
        effectiveSite,
        effectiveBuilding,
        formatFloorNumber(floor),
        formatZoneNumber(zone),
        equipmentTag,
        pointId,
      ].filter(Boolean).join('-');

    case 'ashrae36':
      return [
        effectiveSite,
        effectiveBuilding,
        getSystemFromTag(equipmentTag),
        equipmentTag,
        pointId,
      ].filter(Boolean).join('.');

    case 'haystack':
      return [
        effectiveSite.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        equipmentTag.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        pointId.toLowerCase().replace(/_/g, '-'),
      ].filter(Boolean).join('-');

    case 'custom':
      if (customPattern) {
        return customPattern
          .replace('{SITE}', effectiveSite)
          .replace('{BLDG}', effectiveBuilding)
          .replace('{FLR}', formatFloorNumber(floor))
          .replace('{ZONE}', formatZoneNumber(zone))
          .replace('{TAG}', equipmentTag)
          .replace('{PT}', pointId)
          .replace('{CITY}', cityCode || '')
          .replace('{site}', effectiveSite.toLowerCase())
          .replace('{equip}', equipmentTag.toLowerCase())
          .replace('{point}', pointId.toLowerCase());
      }
      // Default to saudi_modon if no pattern provided
      return [effectiveSite, effectiveBuilding, formatFloorNumber(floor), equipmentTag, pointId]
        .filter(Boolean).join('-');

    default:
      return [effectiveSite, equipmentTag, pointId].filter(Boolean).join('-');
  }
}

// Extract system type from equipment tag
function getSystemFromTag(tag: string): string {
  const systemPrefixes: Record<string, string> = {
    'AHU': 'AHU',
    'FCU': 'FCU',
    'VAV': 'VAV',
    'CH': 'CHL',
    'CT': 'CT',
    'PMP': 'PMP',
    'CHWP': 'PMP',
    'CWP': 'PMP',
    'HWP': 'PMP',
    'ERV': 'ERV',
    'HRV': 'HRV',
    'MAU': 'MAU',
    'RTU': 'RTU',
    'PAU': 'PAU',
    'EF': 'EXH',
    'SF': 'SUP',
    'VRF': 'VRF',
    'BLR': 'HTG',
  };

  for (const [prefix, system] of Object.entries(systemPrefixes)) {
    if (tag.toUpperCase().startsWith(prefix)) {
      return system;
    }
  }
  return 'HVAC';
}

// BACnet object instance allocation
export interface BACnetInstanceConfig {
  startAI: number;
  startAO: number;
  startBI: number;
  startBO: number;
  startAV: number;
  startBV: number;
  startMSV: number;
}

export const DEFAULT_BACNET_INSTANCE_CONFIG: BACnetInstanceConfig = {
  startAI: 1,
  startAO: 1,
  startBI: 1,
  startBO: 1,
  startAV: 1,
  startBV: 1,
  startMSV: 1,
};

// Modbus address allocation
export interface ModbusAddressConfig {
  startAddress: number;
  addressSpacing: number; // Gap between equipment
  registerSpacing: number; // Gap between registers within equipment
}

export const DEFAULT_MODBUS_CONFIG: ModbusAddressConfig = {
  startAddress: 40001, // Holding registers start
  addressSpacing: 100, // 100 registers per equipment
  registerSpacing: 1, // Sequential
};

// Calculate modbus register size based on data type
export function getModbusRegisterSize(dataType: string): number {
  switch (dataType) {
    case 'float32':
      return 2; // 2 registers for 32-bit float
    case 'int16':
    case 'uint16':
      return 1;
    case 'bool':
      return 1; // 1 register (or could use coil)
    default:
      return 1;
  }
}

// Generate modbus address for a point
export function allocateModbusAddress(
  equipmentIndex: number,
  pointIndex: number,
  dataType: string,
  config: ModbusAddressConfig = DEFAULT_MODBUS_CONFIG
): number {
  const baseAddress = config.startAddress + (equipmentIndex * config.addressSpacing);
  let offset = 0;
  
  // Calculate offset based on previous points (simplified)
  for (let i = 0; i < pointIndex; i++) {
    offset += config.registerSpacing;
  }
  
  return baseAddress + offset;
}

// Validate naming convention
export function validateNamingConvention(convention: NamingConvention): NamingConventionInfo | undefined {
  return NAMING_CONVENTIONS.find(c => c.id === convention);
}

// Get city code from city name
export function getCityCode(cityName: string): string {
  return SAUDI_CITY_CODES[cityName] || MODON_INDUSTRIAL_CITIES[cityName] || cityName.substring(0, 3).toUpperCase();
}

// Parse equipment tag to extract components
export function parseEquipmentTag(tag: string): { type: string; number: string } {
  const match = tag.match(/^([A-Za-z]+)[-_]?(\d+.*)$/);
  if (match) {
    return { type: match[1].toUpperCase(), number: match[2] };
  }
  return { type: tag.toUpperCase(), number: '' };
}
