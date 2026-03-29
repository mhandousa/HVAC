export interface Profile {
  id: string
  user_id: string
  organization_id: string | null
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  organization_id: string
  name: string
  description: string | null
  client_name: string | null
  location: string | null
  building_type: string | null
  status: string
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LoadCalculation {
  id: string
  organization_id: string
  project_id: string | null
  building_id: string | null
  calculation_name: string
  calculation_type: string | null
  area_sqft: number
  ceiling_height_ft: number
  building_type: string | null
  wall_r_value: number | null
  roof_r_value: number | null
  window_u_factor: number | null
  window_shgc: number | null
  window_to_wall_ratio: number | null
  occupant_count: number | null
  lighting_power_density: number | null
  equipment_power_density: number | null
  outdoor_temp_summer_f: number | null
  outdoor_temp_winter_f: number | null
  indoor_temp_summer_f: number | null
  indoor_temp_winter_f: number | null
  outdoor_humidity_summer: number | null
  indoor_humidity_target: number | null
  cooling_load_btuh: number | null
  heating_load_btuh: number | null
  cooling_load_tons: number | null
  cfm_required: number | null
  load_breakdown: Record<string, unknown> | null
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  zone_id: string | null
}

export interface EquipmentCatalog {
  id: string
  manufacturer: string
  model_number: string
  equipment_category: string
  equipment_subcategory: string | null
  cooling_capacity_kw: number | null
  cooling_capacity_tons: number | null
  heating_capacity_kw: number | null
  cop: number | null
  eer: number | null
  seer: number | null
  power_input_kw: number | null
  voltage: string | null
  phases: number | null
  refrigerant_type: string | null
  sound_power_level_db: number | null
  list_price_sar: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}
