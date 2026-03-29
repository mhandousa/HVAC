// ASHRAE 62.1-2022 Ventilation Rate Procedure Data
// Table 6.2.2.1 - Minimum Ventilation Rates in Breathing Zone

export interface SpaceVentilationRate {
  id: string;
  category: string;
  spaceType: string;
  occupancyDensity: number;     // people per 1000 ft² (default)
  Rp: number;                   // CFM/person (outdoor air per person)
  Ra: number;                   // CFM/ft² (outdoor air per area)
  notes?: string;
}

export interface ZoneEffectivenessConfig {
  supplyLocation: 'ceiling' | 'floor';
  returnLocation: 'ceiling' | 'floor';
  heatingEz: number;
  coolingEz: number;
}

// ASHRAE 62.1 Table 6.2.2.1 - Minimum Ventilation Rates in Breathing Zone
export const ASHRAE_62_1_SPACE_TYPES: SpaceVentilationRate[] = [
  // Office Buildings
  { id: 'office_space', category: 'Office Buildings', spaceType: 'Office space', occupancyDensity: 5, Rp: 5, Ra: 0.06 },
  { id: 'conference_room', category: 'Office Buildings', spaceType: 'Conference/meeting room', occupancyDensity: 50, Rp: 5, Ra: 0.06 },
  { id: 'reception', category: 'Office Buildings', spaceType: 'Reception areas', occupancyDensity: 30, Rp: 5, Ra: 0.06 },
  { id: 'break_room', category: 'Office Buildings', spaceType: 'Break rooms', occupancyDensity: 25, Rp: 5, Ra: 0.12 },
  { id: 'main_entry_lobby', category: 'Office Buildings', spaceType: 'Main entry lobbies', occupancyDensity: 10, Rp: 5, Ra: 0.06 },
  { id: 'telephone_data_entry', category: 'Office Buildings', spaceType: 'Telephone/data entry', occupancyDensity: 60, Rp: 5, Ra: 0.06 },

  // Educational Facilities
  { id: 'classroom_5_8', category: 'Educational Facilities', spaceType: 'Classrooms (ages 5-8)', occupancyDensity: 25, Rp: 10, Ra: 0.12 },
  { id: 'classroom_9_plus', category: 'Educational Facilities', spaceType: 'Classrooms (ages 9+)', occupancyDensity: 35, Rp: 10, Ra: 0.12 },
  { id: 'lecture_hall', category: 'Educational Facilities', spaceType: 'Lecture classroom', occupancyDensity: 65, Rp: 7.5, Ra: 0.06 },
  { id: 'library', category: 'Educational Facilities', spaceType: 'Libraries', occupancyDensity: 10, Rp: 5, Ra: 0.12 },
  { id: 'daycare_sickroom', category: 'Educational Facilities', spaceType: 'Daycare sickroom', occupancyDensity: 25, Rp: 10, Ra: 0.18 },
  { id: 'daycare_through_4', category: 'Educational Facilities', spaceType: 'Daycare (through age 4)', occupancyDensity: 25, Rp: 10, Ra: 0.18 },
  { id: 'science_lab', category: 'Educational Facilities', spaceType: 'Science laboratories', occupancyDensity: 25, Rp: 10, Ra: 0.18 },
  { id: 'university_lab', category: 'Educational Facilities', spaceType: 'University/college laboratories', occupancyDensity: 25, Rp: 10, Ra: 0.18 },
  { id: 'art_classroom', category: 'Educational Facilities', spaceType: 'Art classroom', occupancyDensity: 20, Rp: 10, Ra: 0.18 },
  { id: 'music_theater_classroom', category: 'Educational Facilities', spaceType: 'Music/theater/dance', occupancyDensity: 35, Rp: 10, Ra: 0.06 },
  { id: 'multiuse_assembly', category: 'Educational Facilities', spaceType: 'Multiuse assembly', occupancyDensity: 100, Rp: 7.5, Ra: 0.06 },

  // Retail
  { id: 'sales_floor', category: 'Retail', spaceType: 'Sales floor (except as noted)', occupancyDensity: 15, Rp: 7.5, Ra: 0.12 },
  { id: 'mall_common', category: 'Retail', spaceType: 'Mall common areas', occupancyDensity: 40, Rp: 7.5, Ra: 0.06 },
  { id: 'supermarket', category: 'Retail', spaceType: 'Supermarket', occupancyDensity: 8, Rp: 7.5, Ra: 0.06 },
  { id: 'barbershop', category: 'Retail', spaceType: 'Barbershop', occupancyDensity: 25, Rp: 7.5, Ra: 0.06 },
  { id: 'beauty_nail_salon', category: 'Retail', spaceType: 'Beauty and nail salons', occupancyDensity: 25, Rp: 20, Ra: 0.12 },
  { id: 'pet_shop', category: 'Retail', spaceType: 'Pet shop (animal areas)', occupancyDensity: 10, Rp: 7.5, Ra: 0.18 },
  { id: 'pharmacy', category: 'Retail', spaceType: 'Pharmacy (prep area)', occupancyDensity: 10, Rp: 5, Ra: 0.18 },

  // Hotels/Hospitality
  { id: 'hotel_lobby', category: 'Hotels/Hospitality', spaceType: 'Lobby/prefunction', occupancyDensity: 30, Rp: 7.5, Ra: 0.06 },
  { id: 'hotel_bedroom', category: 'Hotels/Hospitality', spaceType: 'Bedroom/living room', occupancyDensity: 10, Rp: 5, Ra: 0.06 },
  { id: 'hotel_multipurpose', category: 'Hotels/Hospitality', spaceType: 'Multipurpose assembly', occupancyDensity: 120, Rp: 5, Ra: 0.06 },
  { id: 'hotel_bathroom', category: 'Hotels/Hospitality', spaceType: 'Bathroom', occupancyDensity: 10, Rp: 0, Ra: 0, notes: 'Exhaust per Section 6.5' },
  { id: 'hotel_laundry', category: 'Hotels/Hospitality', spaceType: 'Laundry rooms (central)', occupancyDensity: 10, Rp: 5, Ra: 0.12 },

  // Food and Beverage Service
  { id: 'restaurant_dining', category: 'Food and Beverage', spaceType: 'Restaurant dining rooms', occupancyDensity: 70, Rp: 7.5, Ra: 0.18 },
  { id: 'cafeteria', category: 'Food and Beverage', spaceType: 'Cafeteria/fast food dining', occupancyDensity: 100, Rp: 7.5, Ra: 0.18 },
  { id: 'kitchen_commercial', category: 'Food and Beverage', spaceType: 'Kitchen (commercial)', occupancyDensity: 20, Rp: 7.5, Ra: 0.12 },
  { id: 'bar_lounge', category: 'Food and Beverage', spaceType: 'Bars/cocktail lounges', occupancyDensity: 100, Rp: 7.5, Ra: 0.18 },

  // Healthcare Facilities
  { id: 'patient_room', category: 'Healthcare', spaceType: 'Patient rooms', occupancyDensity: 10, Rp: 25, Ra: 0.06 },
  { id: 'waiting_room', category: 'Healthcare', spaceType: 'Waiting rooms', occupancyDensity: 60, Rp: 7.5, Ra: 0.06 },
  { id: 'medical_exam', category: 'Healthcare', spaceType: 'Examination rooms', occupancyDensity: 20, Rp: 15, Ra: 0.06 },
  { id: 'medical_procedure', category: 'Healthcare', spaceType: 'Medical procedure room', occupancyDensity: 20, Rp: 15, Ra: 0.18 },
  { id: 'physical_therapy', category: 'Healthcare', spaceType: 'Physical therapy', occupancyDensity: 20, Rp: 15, Ra: 0.06 },
  { id: 'recovery_room', category: 'Healthcare', spaceType: 'Recovery room', occupancyDensity: 20, Rp: 15, Ra: 0.12 },
  { id: 'radiology', category: 'Healthcare', spaceType: 'Radiology/imaging waiting', occupancyDensity: 30, Rp: 7.5, Ra: 0.06 },
  { id: 'operating_room', category: 'Healthcare', spaceType: 'Operating rooms', occupancyDensity: 20, Rp: 30, Ra: 0.18, notes: 'Special requirements apply' },
  { id: 'dental_op', category: 'Healthcare', spaceType: 'Dental operatory', occupancyDensity: 20, Rp: 15, Ra: 0.06 },

  // Sports and Entertainment
  { id: 'gym', category: 'Sports/Entertainment', spaceType: 'Gym/aerobics room', occupancyDensity: 40, Rp: 20, Ra: 0.06 },
  { id: 'spectator_area', category: 'Sports/Entertainment', spaceType: 'Spectator areas', occupancyDensity: 150, Rp: 7.5, Ra: 0.06 },
  { id: 'playing_floor', category: 'Sports/Entertainment', spaceType: 'Playing floors (sports)', occupancyDensity: 30, Rp: 20, Ra: 0.18 },
  { id: 'game_arcade', category: 'Sports/Entertainment', spaceType: 'Game arcades', occupancyDensity: 20, Rp: 7.5, Ra: 0.18 },
  { id: 'bowling_alley', category: 'Sports/Entertainment', spaceType: 'Bowling alley (seating)', occupancyDensity: 40, Rp: 10, Ra: 0.12 },
  { id: 'disco_dance', category: 'Sports/Entertainment', spaceType: 'Disco/dance floors', occupancyDensity: 100, Rp: 20, Ra: 0.06 },
  { id: 'health_club', category: 'Sports/Entertainment', spaceType: 'Health club/aerobics room', occupancyDensity: 40, Rp: 20, Ra: 0.06 },
  { id: 'locker_room', category: 'Sports/Entertainment', spaceType: 'Locker/dressing rooms', occupancyDensity: 0, Rp: 0, Ra: 0.25, notes: 'Area-based only' },
  { id: 'swimming_pool', category: 'Sports/Entertainment', spaceType: 'Swimming pool area', occupancyDensity: 0, Rp: 0, Ra: 0.48, notes: 'Dehumidification requirements' },

  // Places of Religious Worship
  { id: 'worship_sanctuary', category: 'Religious Worship', spaceType: 'Worship sanctuary', occupancyDensity: 120, Rp: 5, Ra: 0.06 },
  { id: 'worship_fellowship', category: 'Religious Worship', spaceType: 'Fellowship hall', occupancyDensity: 120, Rp: 5, Ra: 0.06 },

  // Public Assembly
  { id: 'auditorium', category: 'Public Assembly', spaceType: 'Auditorium seating area', occupancyDensity: 150, Rp: 5, Ra: 0.06 },
  { id: 'convention_center', category: 'Public Assembly', spaceType: 'Convention/exhibit center', occupancyDensity: 40, Rp: 7.5, Ra: 0.06 },
  { id: 'museum', category: 'Public Assembly', spaceType: 'Museum/gallery', occupancyDensity: 40, Rp: 7.5, Ra: 0.06 },
  { id: 'theater_lobby', category: 'Public Assembly', spaceType: 'Theater lobby', occupancyDensity: 150, Rp: 7.5, Ra: 0.06 },
  { id: 'courtroom', category: 'Public Assembly', spaceType: 'Courtrooms', occupancyDensity: 70, Rp: 5, Ra: 0.06 },
  { id: 'legislative_chamber', category: 'Public Assembly', spaceType: 'Legislative chambers', occupancyDensity: 50, Rp: 5, Ra: 0.06 },

  // Transportation
  { id: 'airport_terminal', category: 'Transportation', spaceType: 'Airport terminal/waiting', occupancyDensity: 100, Rp: 7.5, Ra: 0.06 },
  { id: 'bus_train_station', category: 'Transportation', spaceType: 'Bus/rail station waiting', occupancyDensity: 100, Rp: 7.5, Ra: 0.06 },
  { id: 'ticket_booth', category: 'Transportation', spaceType: 'Ticket booths', occupancyDensity: 60, Rp: 7.5, Ra: 0.06 },

  // Correctional Facilities
  { id: 'prison_booking', category: 'Correctional', spaceType: 'Booking/waiting', occupancyDensity: 50, Rp: 7.5, Ra: 0.06 },
  { id: 'prison_cell', category: 'Correctional', spaceType: 'Cell', occupancyDensity: 25, Rp: 5, Ra: 0.12 },
  { id: 'prison_dayroom', category: 'Correctional', spaceType: 'Dayroom', occupancyDensity: 30, Rp: 5, Ra: 0.06 },
  { id: 'prison_guard_station', category: 'Correctional', spaceType: 'Guard stations', occupancyDensity: 15, Rp: 5, Ra: 0.06 },

  // Miscellaneous Spaces
  { id: 'corridor', category: 'Miscellaneous', spaceType: 'Corridors', occupancyDensity: 0, Rp: 0, Ra: 0.06, notes: 'Area-based ventilation only' },
  { id: 'storage', category: 'Miscellaneous', spaceType: 'Storage rooms', occupancyDensity: 0, Rp: 0, Ra: 0.12, notes: 'Area-based ventilation only' },
  { id: 'restroom', category: 'Miscellaneous', spaceType: 'Restrooms', occupancyDensity: 0, Rp: 0, Ra: 0, notes: 'Exhaust per Section 6.5 (typically 50-70 CFM/fixture)' },
  { id: 'elevator_lobby', category: 'Miscellaneous', spaceType: 'Elevator lobbies', occupancyDensity: 0, Rp: 0, Ra: 0.06, notes: 'Area-based ventilation only' },
  { id: 'stairway', category: 'Miscellaneous', spaceType: 'Stairways', occupancyDensity: 0, Rp: 0, Ra: 0.06, notes: 'May use transfer air' },
  { id: 'mechanical_room', category: 'Miscellaneous', spaceType: 'Mechanical/electrical rooms', occupancyDensity: 0, Rp: 0, Ra: 0, notes: 'No ventilation requirement' },
  { id: 'copy_print_room', category: 'Miscellaneous', spaceType: 'Copy/print rooms', occupancyDensity: 4, Rp: 5, Ra: 0.06 },
  { id: 'bank_vault', category: 'Miscellaneous', spaceType: 'Bank vaults/safe deposit', occupancyDensity: 5, Rp: 5, Ra: 0.06 },
  { id: 'data_center', category: 'Miscellaneous', spaceType: 'Computer (data processing)', occupancyDensity: 4, Rp: 5, Ra: 0.06 },
  { id: 'manufacturing', category: 'Miscellaneous', spaceType: 'Manufacturing (general)', occupancyDensity: 7, Rp: 10, Ra: 0.18, notes: 'May require industrial ventilation' },
  { id: 'warehouse', category: 'Miscellaneous', spaceType: 'Warehouse (storage)', occupancyDensity: 0, Rp: 0, Ra: 0.06, notes: 'Area-based only, forklifts may require more' },
  { id: 'parking_garage', category: 'Miscellaneous', spaceType: 'Parking garage', occupancyDensity: 0, Rp: 0, Ra: 0.12, notes: 'Special exhaust requirements per ASHRAE 62.1' },
];

// ASHRAE 62.1 Table 6.2.2.2 - Zone Air Distribution Effectiveness
export const ZONE_EFFECTIVENESS_TABLE: ZoneEffectivenessConfig[] = [
  { supplyLocation: 'ceiling', returnLocation: 'ceiling', heatingEz: 1.0, coolingEz: 1.0 },
  { supplyLocation: 'ceiling', returnLocation: 'floor', heatingEz: 1.0, coolingEz: 1.2 },
  { supplyLocation: 'floor', returnLocation: 'floor', heatingEz: 1.0, coolingEz: 1.0 },
  { supplyLocation: 'floor', returnLocation: 'ceiling', heatingEz: 0.7, coolingEz: 1.2 },
];

// Get zone effectiveness based on configuration
export function getZoneEffectiveness(
  supplyLocation: 'ceiling' | 'floor',
  returnLocation: 'ceiling' | 'floor',
  mode: 'heating' | 'cooling'
): number {
  const config = ZONE_EFFECTIVENESS_TABLE.find(
    c => c.supplyLocation === supplyLocation && c.returnLocation === returnLocation
  );
  
  if (!config) return 1.0; // Default
  
  return mode === 'heating' ? config.heatingEz : config.coolingEz;
}

// Get space types grouped by category
export function getSpaceTypesByCategory(): Record<string, SpaceVentilationRate[]> {
  return ASHRAE_62_1_SPACE_TYPES.reduce((acc, space) => {
    if (!acc[space.category]) {
      acc[space.category] = [];
    }
    acc[space.category].push(space);
    return acc;
  }, {} as Record<string, SpaceVentilationRate[]>);
}

// Get all unique categories
export function getCategories(): string[] {
  return [...new Set(ASHRAE_62_1_SPACE_TYPES.map(s => s.category))];
}

// Find space type by ID
export function getSpaceTypeById(id: string): SpaceVentilationRate | undefined {
  return ASHRAE_62_1_SPACE_TYPES.find(s => s.id === id);
}

// Common diversity factors by building type
export const DIVERSITY_FACTORS: Record<string, number> = {
  'office': 0.75,
  'retail': 0.85,
  'school': 0.90,
  'healthcare': 0.95,
  'hotel': 0.70,
  'restaurant': 0.85,
  'assembly': 1.00,
  'default': 0.85,
};

// Map existing zone types to ASHRAE 62.1 space types
export const ZONE_TYPE_TO_ASHRAE_MAP: Record<string, string> = {
  'office': 'office_space',
  'meeting_room': 'conference_room',
  'lobby': 'main_entry_lobby',
  'corridor': 'corridor',
  'restroom': 'restroom',
  'kitchen': 'kitchen_commercial',
  'server_room': 'data_center',
  'storage': 'storage',
  'mechanical': 'mechanical_room',
  'other': 'office_space', // Default fallback
};
