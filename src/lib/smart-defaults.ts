/**
 * Smart Defaults Engine
 * Provides context-aware default values based on ASHRAE standards, building type, and climate zone
 */

export type BuildingType = 
  | 'office' 
  | 'retail' 
  | 'hospital' 
  | 'school' 
  | 'hotel' 
  | 'warehouse' 
  | 'residential' 
  | 'restaurant'
  | 'laboratory'
  | 'datacenter';

export type ClimateZone = 
  | '0A' | '0B' 
  | '1A' | '1B' 
  | '2A' | '2B' 
  | '3A' | '3B' | '3C' 
  | '4A' | '4B' | '4C' 
  | '5A' | '5B' | '5C' 
  | '6A' | '6B' 
  | '7' 
  | '8';

export interface SmartDefaultsContext {
  buildingType?: BuildingType;
  climateZone?: ClimateZone;
  zoneArea_sqft?: number;
  spaceType?: string;
  upstreamData?: {
    loadCalculation?: {
      cooling_load_btuh?: number;
      heating_load_btuh?: number;
      cfm?: number;
    };
    ventilation?: {
      outdoor_air_cfm?: number;
      zone_effectiveness?: number;
    };
  };
}

export interface SmartDefault {
  key: string;
  value: number | string;
  unit: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  category: 'envelope' | 'loads' | 'ventilation' | 'acoustic' | 'equipment';
}

// ASHRAE 90.1-2019 Table 5.5 - Envelope Requirements by Climate Zone
export const CLIMATE_ZONE_ENVELOPE_DEFAULTS: Record<string, {
  wall_r: number;
  roof_r: number;
  window_u: number;
  window_shgc: number;
  slab_r: number;
}> = {
  '0A': { wall_r: 5.7, roof_r: 20, window_u: 0.50, window_shgc: 0.25, slab_r: 0 },
  '0B': { wall_r: 5.7, roof_r: 20, window_u: 0.50, window_shgc: 0.25, slab_r: 0 },
  '1A': { wall_r: 5.7, roof_r: 20, window_u: 0.50, window_shgc: 0.25, slab_r: 0 },
  '1B': { wall_r: 5.7, roof_r: 20, window_u: 0.50, window_shgc: 0.25, slab_r: 0 },
  '2A': { wall_r: 5.7, roof_r: 25, window_u: 0.45, window_shgc: 0.25, slab_r: 0 },
  '2B': { wall_r: 5.7, roof_r: 25, window_u: 0.45, window_shgc: 0.25, slab_r: 0 },
  '3A': { wall_r: 7.6, roof_r: 30, window_u: 0.42, window_shgc: 0.25, slab_r: 0 },
  '3B': { wall_r: 7.6, roof_r: 30, window_u: 0.42, window_shgc: 0.25, slab_r: 0 },
  '3C': { wall_r: 7.6, roof_r: 30, window_u: 0.42, window_shgc: 0.25, slab_r: 0 },
  '4A': { wall_r: 13.0, roof_r: 38, window_u: 0.38, window_shgc: 0.38, slab_r: 10 },
  '4B': { wall_r: 13.0, roof_r: 38, window_u: 0.38, window_shgc: 0.38, slab_r: 10 },
  '4C': { wall_r: 13.0, roof_r: 38, window_u: 0.38, window_shgc: 0.38, slab_r: 10 },
  '5A': { wall_r: 13.0, roof_r: 38, window_u: 0.35, window_shgc: 0.40, slab_r: 10 },
  '5B': { wall_r: 13.0, roof_r: 38, window_u: 0.35, window_shgc: 0.40, slab_r: 10 },
  '5C': { wall_r: 13.0, roof_r: 38, window_u: 0.35, window_shgc: 0.40, slab_r: 10 },
  '6A': { wall_r: 19.0, roof_r: 49, window_u: 0.32, window_shgc: 0.40, slab_r: 15 },
  '6B': { wall_r: 19.0, roof_r: 49, window_u: 0.32, window_shgc: 0.40, slab_r: 15 },
  '7': { wall_r: 19.0, roof_r: 49, window_u: 0.28, window_shgc: 0.45, slab_r: 20 },
  '8': { wall_r: 25.0, roof_r: 60, window_u: 0.25, window_shgc: 0.45, slab_r: 25 },
};

// ASHRAE 90.1-2019 Table 9.5.1 - Lighting Power Density
export const BUILDING_TYPE_LPD: Record<BuildingType, number> = {
  office: 0.82,
  retail: 1.26,
  hospital: 1.05,
  school: 0.87,
  hotel: 0.75,
  warehouse: 0.45,
  residential: 0.60,
  restaurant: 0.90,
  laboratory: 1.33,
  datacenter: 0.82,
};

// Equipment Power Density (W/sqft) - Industry standards
export const BUILDING_TYPE_EPD: Record<BuildingType, number> = {
  office: 1.50,
  retail: 0.50,
  hospital: 2.00,
  school: 0.75,
  hotel: 0.50,
  warehouse: 0.25,
  residential: 0.50,
  restaurant: 2.50,
  laboratory: 4.00,
  datacenter: 50.00,
};

// ASHRAE 62.1-2019 Table 6.2.2.1 - Occupant Density (sqft per person)
export const BUILDING_TYPE_OCCUPANCY: Record<BuildingType, number> = {
  office: 150,
  retail: 60,
  hospital: 100,
  school: 35,
  hotel: 300,
  warehouse: 5000,
  residential: 500,
  restaurant: 15,
  laboratory: 200,
  datacenter: 500,
};

// Target NC levels by space type
export const SPACE_TYPE_NC_TARGETS: Record<string, number> = {
  'conference_room': 25,
  'private_office': 30,
  'open_office': 40,
  'lobby': 40,
  'classroom': 25,
  'library': 30,
  'hospital_patient_room': 25,
  'hospital_operating_room': 25,
  'hotel_guest_room': 30,
  'restaurant_dining': 40,
  'retail': 45,
  'warehouse': 55,
  'mechanical_room': 60,
  'default': 40,
};

// Equipment sizing safety factors
export const EQUIPMENT_SAFETY_FACTORS = {
  cooling: 1.15, // 15% oversizing
  heating: 1.20, // 20% oversizing
  fan: 1.10,
  pump: 1.10,
  duct_velocity_max_fpm: 1800,
  pipe_velocity_max_fps: 8,
};

// Design temperatures by climate zone (Saudi-specific for hot zones)
export const CLIMATE_ZONE_DESIGN_TEMPS: Record<string, {
  summer_db: number;
  summer_wb: number;
  winter_db: number;
}> = {
  '0A': { summer_db: 115, summer_wb: 82, winter_db: 55 },
  '0B': { summer_db: 120, summer_wb: 75, winter_db: 45 },
  '1A': { summer_db: 105, summer_wb: 80, winter_db: 50 },
  '1B': { summer_db: 110, summer_wb: 72, winter_db: 40 },
  '2A': { summer_db: 98, summer_wb: 78, winter_db: 35 },
  '2B': { summer_db: 102, summer_wb: 70, winter_db: 30 },
  '3A': { summer_db: 95, summer_wb: 77, winter_db: 25 },
  '3B': { summer_db: 100, summer_wb: 68, winter_db: 25 },
  '3C': { summer_db: 85, summer_wb: 65, winter_db: 35 },
  '4A': { summer_db: 93, summer_wb: 75, winter_db: 15 },
  '4B': { summer_db: 98, summer_wb: 65, winter_db: 20 },
  '4C': { summer_db: 85, summer_wb: 65, winter_db: 30 },
  '5A': { summer_db: 90, summer_wb: 73, winter_db: 5 },
  '5B': { summer_db: 95, summer_wb: 62, winter_db: 10 },
  '5C': { summer_db: 80, summer_wb: 62, winter_db: 25 },
  '6A': { summer_db: 88, summer_wb: 72, winter_db: -5 },
  '6B': { summer_db: 92, summer_wb: 60, winter_db: 0 },
  '7': { summer_db: 85, summer_wb: 68, winter_db: -15 },
  '8': { summer_db: 80, summer_wb: 65, winter_db: -30 },
};

/**
 * Generate smart defaults based on context
 */
export function generateSmartDefaults(context: SmartDefaultsContext): SmartDefault[] {
  const defaults: SmartDefault[] = [];
  const { buildingType, climateZone, zoneArea_sqft, spaceType } = context;

  // Envelope defaults (based on climate zone)
  if (climateZone && CLIMATE_ZONE_ENVELOPE_DEFAULTS[climateZone]) {
    const envelope = CLIMATE_ZONE_ENVELOPE_DEFAULTS[climateZone];
    
    defaults.push({
      key: 'wall_r_value',
      value: envelope.wall_r,
      unit: 'hr·ft²·°F/BTU',
      source: 'ASHRAE 90.1-2019 Table 5.5',
      confidence: 'high',
      category: 'envelope',
    });
    
    defaults.push({
      key: 'roof_r_value',
      value: envelope.roof_r,
      unit: 'hr·ft²·°F/BTU',
      source: 'ASHRAE 90.1-2019 Table 5.5',
      confidence: 'high',
      category: 'envelope',
    });
    
    defaults.push({
      key: 'window_u_factor',
      value: envelope.window_u,
      unit: 'BTU/hr·ft²·°F',
      source: 'ASHRAE 90.1-2019 Table 5.5',
      confidence: 'high',
      category: 'envelope',
    });
    
    defaults.push({
      key: 'window_shgc',
      value: envelope.window_shgc,
      unit: '',
      source: 'ASHRAE 90.1-2019 Table 5.5',
      confidence: 'high',
      category: 'envelope',
    });
  }

  // Internal load defaults (based on building type)
  if (buildingType) {
    defaults.push({
      key: 'lighting_power_density',
      value: BUILDING_TYPE_LPD[buildingType],
      unit: 'W/ft²',
      source: 'ASHRAE 90.1-2019 Table 9.5.1',
      confidence: 'high',
      category: 'loads',
    });
    
    defaults.push({
      key: 'equipment_power_density',
      value: BUILDING_TYPE_EPD[buildingType],
      unit: 'W/ft²',
      source: 'Industry Standard',
      confidence: 'medium',
      category: 'loads',
    });
    
    defaults.push({
      key: 'occupant_density',
      value: BUILDING_TYPE_OCCUPANCY[buildingType],
      unit: 'ft²/person',
      source: 'ASHRAE 62.1-2019 Table 6.2.2.1',
      confidence: 'high',
      category: 'loads',
    });

    // Calculate occupancy if area provided
    if (zoneArea_sqft) {
      const occupancy = Math.ceil(zoneArea_sqft / BUILDING_TYPE_OCCUPANCY[buildingType]);
      defaults.push({
        key: 'estimated_occupancy',
        value: occupancy,
        unit: 'people',
        source: 'Calculated from area',
        confidence: 'medium',
        category: 'loads',
      });
    }
  }

  // Design temperatures (based on climate zone)
  if (climateZone && CLIMATE_ZONE_DESIGN_TEMPS[climateZone]) {
    const temps = CLIMATE_ZONE_DESIGN_TEMPS[climateZone];
    
    defaults.push({
      key: 'summer_design_db',
      value: temps.summer_db,
      unit: '°F',
      source: 'ASHRAE Climate Data',
      confidence: 'high',
      category: 'equipment',
    });
    
    defaults.push({
      key: 'summer_design_wb',
      value: temps.summer_wb,
      unit: '°F',
      source: 'ASHRAE Climate Data',
      confidence: 'high',
      category: 'equipment',
    });
    
    defaults.push({
      key: 'winter_design_db',
      value: temps.winter_db,
      unit: '°F',
      source: 'ASHRAE Climate Data',
      confidence: 'high',
      category: 'equipment',
    });
  }

  // Acoustic targets (based on space type)
  const ncKey = spaceType?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const targetNc = SPACE_TYPE_NC_TARGETS[ncKey] || SPACE_TYPE_NC_TARGETS['default'];
  
  defaults.push({
    key: 'target_nc',
    value: targetNc,
    unit: 'NC',
    source: 'ASHRAE Handbook Applications',
    confidence: spaceType ? 'high' : 'low',
    category: 'acoustic',
  });

  // Equipment sizing factors
  defaults.push({
    key: 'cooling_safety_factor',
    value: EQUIPMENT_SAFETY_FACTORS.cooling,
    unit: '',
    source: 'Industry Practice',
    confidence: 'medium',
    category: 'equipment',
  });
  
  defaults.push({
    key: 'heating_safety_factor',
    value: EQUIPMENT_SAFETY_FACTORS.heating,
    unit: '',
    source: 'Industry Practice',
    confidence: 'medium',
    category: 'equipment',
  });

  return defaults;
}

/**
 * Get a specific smart default value
 */
export function getSmartDefault(
  key: string,
  context: SmartDefaultsContext
): SmartDefault | undefined {
  const defaults = generateSmartDefaults(context);
  return defaults.find(d => d.key === key);
}

/**
 * Get all defaults for a specific category
 */
export function getSmartDefaultsByCategory(
  category: SmartDefault['category'],
  context: SmartDefaultsContext
): SmartDefault[] {
  return generateSmartDefaults(context).filter(d => d.category === category);
}
