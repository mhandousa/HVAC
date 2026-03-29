export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acoustic_calculations: {
        Row: {
          calculated_nc: number | null
          calculation_type: string
          created_at: string | null
          created_by: string | null
          id: string
          input_data: Json | null
          meets_target: boolean | null
          name: string
          organization_id: string
          project_id: string
          results: Json | null
          target_nc: number | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          calculated_nc?: number | null
          calculation_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_data?: Json | null
          meets_target?: boolean | null
          name: string
          organization_id: string
          project_id: string
          results?: Json | null
          target_nc?: number | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          calculated_nc?: number | null
          calculation_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_data?: Json | null
          meets_target?: boolean | null
          name?: string
          organization_id?: string
          project_id?: string
          results?: Json | null
          target_nc?: number | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acoustic_calculations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "acoustic_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoustic_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoustic_calculations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      ahu_configurations: {
        Row: {
          ahu_name: string
          ahu_tag: string
          ashrae_62_1_compliant: boolean | null
          ashrae_90_1_compliant: boolean | null
          control_sequence_json: Json | null
          control_strategy: string | null
          cooling_coil_config: Json | null
          created_at: string | null
          created_by: string | null
          damper_config: Json | null
          description: string | null
          design_cfm: number
          design_static_pressure_in: number | null
          duct_static_setpoint_in: number | null
          economizer_lockout_temp_f: number | null
          economizer_type: string | null
          erv_config: Json | null
          filter_config: Json | null
          heating_coil_config: Json | null
          humidifier_config: Json | null
          id: string
          location: string | null
          min_oa_percent: number | null
          notes: string | null
          organization_id: string
          outdoor_air_cfm: number | null
          preheat_coil_config: Json | null
          project_id: string | null
          relief_fan_config: Json | null
          return_air_cfm: number | null
          return_fan_bhp: number | null
          return_fan_config: Json | null
          revision: string | null
          sound_attenuator_config: Json | null
          status: string | null
          supply_air_temp_setpoint_f: number | null
          supply_fan_bhp: number | null
          supply_fan_config: Json | null
          total_cooling_capacity_tons: number | null
          total_heating_capacity_mbh: number | null
          total_pressure_drop_in: number | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          ahu_name: string
          ahu_tag: string
          ashrae_62_1_compliant?: boolean | null
          ashrae_90_1_compliant?: boolean | null
          control_sequence_json?: Json | null
          control_strategy?: string | null
          cooling_coil_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          damper_config?: Json | null
          description?: string | null
          design_cfm: number
          design_static_pressure_in?: number | null
          duct_static_setpoint_in?: number | null
          economizer_lockout_temp_f?: number | null
          economizer_type?: string | null
          erv_config?: Json | null
          filter_config?: Json | null
          heating_coil_config?: Json | null
          humidifier_config?: Json | null
          id?: string
          location?: string | null
          min_oa_percent?: number | null
          notes?: string | null
          organization_id: string
          outdoor_air_cfm?: number | null
          preheat_coil_config?: Json | null
          project_id?: string | null
          relief_fan_config?: Json | null
          return_air_cfm?: number | null
          return_fan_bhp?: number | null
          return_fan_config?: Json | null
          revision?: string | null
          sound_attenuator_config?: Json | null
          status?: string | null
          supply_air_temp_setpoint_f?: number | null
          supply_fan_bhp?: number | null
          supply_fan_config?: Json | null
          total_cooling_capacity_tons?: number | null
          total_heating_capacity_mbh?: number | null
          total_pressure_drop_in?: number | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          ahu_name?: string
          ahu_tag?: string
          ashrae_62_1_compliant?: boolean | null
          ashrae_90_1_compliant?: boolean | null
          control_sequence_json?: Json | null
          control_strategy?: string | null
          cooling_coil_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          damper_config?: Json | null
          description?: string | null
          design_cfm?: number
          design_static_pressure_in?: number | null
          duct_static_setpoint_in?: number | null
          economizer_lockout_temp_f?: number | null
          economizer_type?: string | null
          erv_config?: Json | null
          filter_config?: Json | null
          heating_coil_config?: Json | null
          humidifier_config?: Json | null
          id?: string
          location?: string | null
          min_oa_percent?: number | null
          notes?: string | null
          organization_id?: string
          outdoor_air_cfm?: number | null
          preheat_coil_config?: Json | null
          project_id?: string | null
          relief_fan_config?: Json | null
          return_air_cfm?: number | null
          return_fan_bhp?: number | null
          return_fan_config?: Json | null
          revision?: string | null
          sound_attenuator_config?: Json | null
          status?: string | null
          supply_air_temp_setpoint_f?: number | null
          supply_fan_bhp?: number | null
          supply_fan_config?: Json | null
          total_cooling_capacity_tons?: number | null
          total_heating_capacity_mbh?: number | null
          total_pressure_drop_in?: number | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ahu_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ahu_configurations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ahu_configurations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      ashrae_90_1_compliance_checks: {
        Row: {
          city_id: string | null
          climate_zone: string
          created_at: string | null
          detailed_results: Json | null
          economizer_checks_passed: number | null
          economizer_checks_total: number | null
          equipment_checks_passed: number | null
          equipment_checks_total: number | null
          fan_power_checks_passed: number | null
          fan_power_checks_total: number | null
          id: string
          mandatory_checks_passed: number | null
          mandatory_checks_total: number | null
          name: string
          organization_id: string
          overall_compliance_percent: number | null
          project_id: string
          pump_power_checks_passed: number | null
          pump_power_checks_total: number | null
          updated_at: string | null
        }
        Insert: {
          city_id?: string | null
          climate_zone: string
          created_at?: string | null
          detailed_results?: Json | null
          economizer_checks_passed?: number | null
          economizer_checks_total?: number | null
          equipment_checks_passed?: number | null
          equipment_checks_total?: number | null
          fan_power_checks_passed?: number | null
          fan_power_checks_total?: number | null
          id?: string
          mandatory_checks_passed?: number | null
          mandatory_checks_total?: number | null
          name: string
          organization_id: string
          overall_compliance_percent?: number | null
          project_id: string
          pump_power_checks_passed?: number | null
          pump_power_checks_total?: number | null
          updated_at?: string | null
        }
        Update: {
          city_id?: string | null
          climate_zone?: string
          created_at?: string | null
          detailed_results?: Json | null
          economizer_checks_passed?: number | null
          economizer_checks_total?: number | null
          equipment_checks_passed?: number | null
          equipment_checks_total?: number | null
          fan_power_checks_passed?: number | null
          fan_power_checks_total?: number | null
          id?: string
          mandatory_checks_passed?: number | null
          mandatory_checks_total?: number | null
          name?: string
          organization_id?: string
          overall_compliance_percent?: number | null
          project_id?: string
          pump_power_checks_passed?: number | null
          pump_power_checks_total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ashrae_90_1_compliance_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ashrae_90_1_compliance_checks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      boiler_selections: {
        Row: {
          afue: number | null
          ahri_certified: boolean | null
          annual_fuel_consumption: Json | null
          asme_certified: boolean | null
          boiler_catalog_id: string | null
          boiler_tag: string | null
          boiler_type: string | null
          created_at: string | null
          created_by: string | null
          efficiency_analysis: Json | null
          fit_score: number | null
          fuel_type: string | null
          full_load_amps: number | null
          hot_water_plant_id: string | null
          hw_flow_gpm: number | null
          hw_return_temp_f: number | null
          hw_supply_temp_f: number | null
          id: string
          manufacturer: string | null
          model_number: string | null
          notes: string | null
          organization_id: string
          power_input_kw: number | null
          project_id: string | null
          required_capacity_btuh: number | null
          selected_capacity_btuh: number | null
          selection_name: string
          status: string | null
          thermal_efficiency: number | null
          turndown_ratio: number | null
          updated_at: string | null
          voltage: string | null
        }
        Insert: {
          afue?: number | null
          ahri_certified?: boolean | null
          annual_fuel_consumption?: Json | null
          asme_certified?: boolean | null
          boiler_catalog_id?: string | null
          boiler_tag?: string | null
          boiler_type?: string | null
          created_at?: string | null
          created_by?: string | null
          efficiency_analysis?: Json | null
          fit_score?: number | null
          fuel_type?: string | null
          full_load_amps?: number | null
          hot_water_plant_id?: string | null
          hw_flow_gpm?: number | null
          hw_return_temp_f?: number | null
          hw_supply_temp_f?: number | null
          id?: string
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          organization_id: string
          power_input_kw?: number | null
          project_id?: string | null
          required_capacity_btuh?: number | null
          selected_capacity_btuh?: number | null
          selection_name: string
          status?: string | null
          thermal_efficiency?: number | null
          turndown_ratio?: number | null
          updated_at?: string | null
          voltage?: string | null
        }
        Update: {
          afue?: number | null
          ahri_certified?: boolean | null
          annual_fuel_consumption?: Json | null
          asme_certified?: boolean | null
          boiler_catalog_id?: string | null
          boiler_tag?: string | null
          boiler_type?: string | null
          created_at?: string | null
          created_by?: string | null
          efficiency_analysis?: Json | null
          fit_score?: number | null
          fuel_type?: string | null
          full_load_amps?: number | null
          hot_water_plant_id?: string | null
          hw_flow_gpm?: number | null
          hw_return_temp_f?: number | null
          hw_supply_temp_f?: number | null
          id?: string
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          organization_id?: string
          power_input_kw?: number | null
          project_id?: string | null
          required_capacity_btuh?: number | null
          selected_capacity_btuh?: number | null
          selection_name?: string
          status?: string | null
          thermal_efficiency?: number | null
          turndown_ratio?: number | null
          updated_at?: string | null
          voltage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boiler_selections_boiler_catalog_id_fkey"
            columns: ["boiler_catalog_id"]
            isOneToOne: false
            referencedRelation: "equipment_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boiler_selections_hot_water_plant_id_fkey"
            columns: ["hot_water_plant_id"]
            isOneToOne: false
            referencedRelation: "hot_water_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boiler_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boiler_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          project_id: string
          total_area_sqm: number | null
          total_floors: number | null
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          project_id: string
          total_area_sqm?: number | null
          total_floors?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          total_area_sqm?: number | null
          total_floors?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_credits: {
        Row: {
          achieved_points: number | null
          certification_project_id: string
          compliance_data: Json | null
          compliance_percentage: number | null
          created_at: string
          credit_category: string | null
          credit_id: string
          credit_name: string
          documentation_urls: string[] | null
          id: string
          last_assessed_at: string | null
          max_points: number | null
          notes: string | null
          status: string
          target_points: number | null
          updated_at: string
        }
        Insert: {
          achieved_points?: number | null
          certification_project_id: string
          compliance_data?: Json | null
          compliance_percentage?: number | null
          created_at?: string
          credit_category?: string | null
          credit_id: string
          credit_name: string
          documentation_urls?: string[] | null
          id?: string
          last_assessed_at?: string | null
          max_points?: number | null
          notes?: string | null
          status?: string
          target_points?: number | null
          updated_at?: string
        }
        Update: {
          achieved_points?: number | null
          certification_project_id?: string
          compliance_data?: Json | null
          compliance_percentage?: number | null
          created_at?: string
          credit_category?: string | null
          credit_id?: string
          credit_name?: string
          documentation_urls?: string[] | null
          id?: string
          last_assessed_at?: string | null
          max_points?: number | null
          notes?: string | null
          status?: string
          target_points?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_credits_certification_project_id_fkey"
            columns: ["certification_project_id"]
            isOneToOne: false
            referencedRelation: "certification_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_projects: {
        Row: {
          achieved_date: string | null
          certification_type: string
          created_at: string
          created_by: string | null
          current_ieq_score: number | null
          id: string
          notes: string | null
          organization_id: string
          project_id: string | null
          registration_date: string | null
          status: string
          target_certification_date: string | null
          target_ieq_score: number | null
          target_level: string | null
          updated_at: string
        }
        Insert: {
          achieved_date?: string | null
          certification_type: string
          created_at?: string
          created_by?: string | null
          current_ieq_score?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          registration_date?: string | null
          status?: string
          target_certification_date?: string | null
          target_ieq_score?: number | null
          target_level?: string | null
          updated_at?: string
        }
        Update: {
          achieved_date?: string | null
          certification_type?: string
          created_at?: string
          created_by?: string | null
          current_ieq_score?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          registration_date?: string | null
          status?: string
          target_certification_date?: string | null
          target_ieq_score?: number | null
          target_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_readings_log: {
        Row: {
          certification_project_id: string
          credit_id: string
          id: string
          is_compliant: boolean | null
          parameter: string
          reading_value: number | null
          recorded_at: string
          threshold_value: number | null
          unit: string | null
          zone_id: string | null
          zone_name: string | null
        }
        Insert: {
          certification_project_id: string
          credit_id: string
          id?: string
          is_compliant?: boolean | null
          parameter: string
          reading_value?: number | null
          recorded_at?: string
          threshold_value?: number | null
          unit?: string | null
          zone_id?: string | null
          zone_name?: string | null
        }
        Update: {
          certification_project_id?: string
          credit_id?: string
          id?: string
          is_compliant?: boolean | null
          parameter?: string
          reading_value?: number | null
          recorded_at?: string
          threshold_value?: number | null
          unit?: string | null
          zone_id?: string | null
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certification_readings_log_certification_project_id_fkey"
            columns: ["certification_project_id"]
            isOneToOne: false
            referencedRelation: "certification_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_readings_log_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      chilled_water_plants: {
        Row: {
          chiller_config: Json | null
          chiller_type: string | null
          chw_delta_t_f: number | null
          chw_return_temp_f: number | null
          chw_supply_temp_f: number | null
          condenser_pump_config: Json | null
          cooling_tower_config: Json | null
          created_at: string | null
          created_by: string | null
          cw_delta_t_f: number | null
          cw_return_temp_f: number | null
          cw_supply_temp_f: number | null
          design_cooling_load_tons: number
          diversity_factor: number | null
          future_expansion_percent: number | null
          header_pipe_config: Json | null
          id: string
          notes: string | null
          organization_id: string
          plant_name: string
          plant_tag: string | null
          primary_pump_config: Json | null
          project_id: string | null
          pumping_config: string | null
          redundancy_mode: string | null
          revision: string | null
          secondary_pump_config: Json | null
          status: string | null
          total_condenser_flow_gpm: number | null
          total_installed_capacity_tons: number | null
          total_primary_flow_gpm: number | null
          total_secondary_flow_gpm: number | null
          updated_at: string | null
        }
        Insert: {
          chiller_config?: Json | null
          chiller_type?: string | null
          chw_delta_t_f?: number | null
          chw_return_temp_f?: number | null
          chw_supply_temp_f?: number | null
          condenser_pump_config?: Json | null
          cooling_tower_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          cw_delta_t_f?: number | null
          cw_return_temp_f?: number | null
          cw_supply_temp_f?: number | null
          design_cooling_load_tons: number
          diversity_factor?: number | null
          future_expansion_percent?: number | null
          header_pipe_config?: Json | null
          id?: string
          notes?: string | null
          organization_id: string
          plant_name: string
          plant_tag?: string | null
          primary_pump_config?: Json | null
          project_id?: string | null
          pumping_config?: string | null
          redundancy_mode?: string | null
          revision?: string | null
          secondary_pump_config?: Json | null
          status?: string | null
          total_condenser_flow_gpm?: number | null
          total_installed_capacity_tons?: number | null
          total_primary_flow_gpm?: number | null
          total_secondary_flow_gpm?: number | null
          updated_at?: string | null
        }
        Update: {
          chiller_config?: Json | null
          chiller_type?: string | null
          chw_delta_t_f?: number | null
          chw_return_temp_f?: number | null
          chw_supply_temp_f?: number | null
          condenser_pump_config?: Json | null
          cooling_tower_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          cw_delta_t_f?: number | null
          cw_return_temp_f?: number | null
          cw_supply_temp_f?: number | null
          design_cooling_load_tons?: number
          diversity_factor?: number | null
          future_expansion_percent?: number | null
          header_pipe_config?: Json | null
          id?: string
          notes?: string | null
          organization_id?: string
          plant_name?: string
          plant_tag?: string | null
          primary_pump_config?: Json | null
          project_id?: string | null
          pumping_config?: string | null
          redundancy_mode?: string | null
          revision?: string | null
          secondary_pump_config?: Json | null
          status?: string | null
          total_condenser_flow_gpm?: number | null
          total_installed_capacity_tons?: number | null
          total_primary_flow_gpm?: number | null
          total_secondary_flow_gpm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chilled_water_plants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chilled_water_plants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chiller_selections: {
        Row: {
          ahri_certificate_number: string | null
          ahri_certified: boolean | null
          ambient_design_temp_f: number | null
          ashrae_90_1_compliant: boolean | null
          chiller_tag: string | null
          chiller_type: string
          chw_flow_gpm: number | null
          chw_plant_id: string | null
          chw_return_temp_f: number | null
          chw_supply_temp_f: number | null
          compressor_type: string | null
          condenser_airflow_cfm: number | null
          condenser_fan_kw: number | null
          condenser_pressure_drop_ft: number | null
          created_at: string | null
          created_by: string | null
          cw_flow_gpm: number | null
          cw_return_temp_f: number | null
          cw_supply_temp_f: number | null
          datasheet_url: string | null
          dimensions_json: Json | null
          duty_type: string | null
          evaporator_pressure_drop_ft: number | null
          full_load_amps: number | null
          id: string
          list_price_sar: number | null
          locked_rotor_amps: number | null
          manufacturer: string | null
          model_number: string | null
          name: string
          notes: string | null
          nplv: number | null
          organization_id: string
          part_load_100_kw_per_ton: number | null
          part_load_25_kw_per_ton: number | null
          part_load_50_kw_per_ton: number | null
          part_load_75_kw_per_ton: number | null
          phases: number | null
          power_input_kw: number | null
          project_id: string | null
          rated_capacity_kw: number | null
          rated_capacity_tons: number
          rated_cop: number | null
          rated_eer: number | null
          rated_iplv: number | null
          refrigerant_type: string | null
          saso_certified: boolean | null
          sequence_number: number | null
          sound_power_level_db: number | null
          sound_pressure_level_db: number | null
          status: string | null
          updated_at: string | null
          voltage: string | null
          weight_operating_lbs: number | null
          weight_shipping_lbs: number | null
        }
        Insert: {
          ahri_certificate_number?: string | null
          ahri_certified?: boolean | null
          ambient_design_temp_f?: number | null
          ashrae_90_1_compliant?: boolean | null
          chiller_tag?: string | null
          chiller_type: string
          chw_flow_gpm?: number | null
          chw_plant_id?: string | null
          chw_return_temp_f?: number | null
          chw_supply_temp_f?: number | null
          compressor_type?: string | null
          condenser_airflow_cfm?: number | null
          condenser_fan_kw?: number | null
          condenser_pressure_drop_ft?: number | null
          created_at?: string | null
          created_by?: string | null
          cw_flow_gpm?: number | null
          cw_return_temp_f?: number | null
          cw_supply_temp_f?: number | null
          datasheet_url?: string | null
          dimensions_json?: Json | null
          duty_type?: string | null
          evaporator_pressure_drop_ft?: number | null
          full_load_amps?: number | null
          id?: string
          list_price_sar?: number | null
          locked_rotor_amps?: number | null
          manufacturer?: string | null
          model_number?: string | null
          name: string
          notes?: string | null
          nplv?: number | null
          organization_id: string
          part_load_100_kw_per_ton?: number | null
          part_load_25_kw_per_ton?: number | null
          part_load_50_kw_per_ton?: number | null
          part_load_75_kw_per_ton?: number | null
          phases?: number | null
          power_input_kw?: number | null
          project_id?: string | null
          rated_capacity_kw?: number | null
          rated_capacity_tons: number
          rated_cop?: number | null
          rated_eer?: number | null
          rated_iplv?: number | null
          refrigerant_type?: string | null
          saso_certified?: boolean | null
          sequence_number?: number | null
          sound_power_level_db?: number | null
          sound_pressure_level_db?: number | null
          status?: string | null
          updated_at?: string | null
          voltage?: string | null
          weight_operating_lbs?: number | null
          weight_shipping_lbs?: number | null
        }
        Update: {
          ahri_certificate_number?: string | null
          ahri_certified?: boolean | null
          ambient_design_temp_f?: number | null
          ashrae_90_1_compliant?: boolean | null
          chiller_tag?: string | null
          chiller_type?: string
          chw_flow_gpm?: number | null
          chw_plant_id?: string | null
          chw_return_temp_f?: number | null
          chw_supply_temp_f?: number | null
          compressor_type?: string | null
          condenser_airflow_cfm?: number | null
          condenser_fan_kw?: number | null
          condenser_pressure_drop_ft?: number | null
          created_at?: string | null
          created_by?: string | null
          cw_flow_gpm?: number | null
          cw_return_temp_f?: number | null
          cw_supply_temp_f?: number | null
          datasheet_url?: string | null
          dimensions_json?: Json | null
          duty_type?: string | null
          evaporator_pressure_drop_ft?: number | null
          full_load_amps?: number | null
          id?: string
          list_price_sar?: number | null
          locked_rotor_amps?: number | null
          manufacturer?: string | null
          model_number?: string | null
          name?: string
          notes?: string | null
          nplv?: number | null
          organization_id?: string
          part_load_100_kw_per_ton?: number | null
          part_load_25_kw_per_ton?: number | null
          part_load_50_kw_per_ton?: number | null
          part_load_75_kw_per_ton?: number | null
          phases?: number | null
          power_input_kw?: number | null
          project_id?: string | null
          rated_capacity_kw?: number | null
          rated_capacity_tons?: number
          rated_cop?: number | null
          rated_eer?: number | null
          rated_iplv?: number | null
          refrigerant_type?: string | null
          saso_certified?: boolean | null
          sequence_number?: number | null
          sound_power_level_db?: number | null
          sound_pressure_level_db?: number | null
          status?: string | null
          updated_at?: string | null
          voltage?: string | null
          weight_operating_lbs?: number | null
          weight_shipping_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chiller_selections_chw_plant_id_fkey"
            columns: ["chw_plant_id"]
            isOneToOne: false
            referencedRelation: "chilled_water_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chiller_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chiller_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chiller_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      coil_selections: {
        Row: {
          ahu_configuration_id: string | null
          air_pressure_drop_in: number | null
          capacity_mbh: number | null
          capacity_tons: number | null
          coil_type: string
          connection_size: string | null
          created_at: string | null
          created_by: string | null
          design_cfm: number | null
          entering_air_db_f: number | null
          entering_air_wb_f: number | null
          face_area_sqft: number | null
          face_velocity_fpm: number | null
          fin_material: string | null
          fins_per_inch: number | null
          fluid_type: string | null
          fluid_velocity_fps: number | null
          id: string
          leaving_air_db_f: number | null
          leaving_air_wb_f: number | null
          manufacturer: string | null
          model_number: string | null
          name: string
          notes: string | null
          organization_id: string
          project_id: string | null
          return_temp_f: number | null
          rows: number | null
          status: string | null
          supply_temp_f: number | null
          tube_material: string | null
          updated_at: string | null
          water_flow_gpm: number | null
          water_pressure_drop_ft: number | null
          zone_id: string | null
        }
        Insert: {
          ahu_configuration_id?: string | null
          air_pressure_drop_in?: number | null
          capacity_mbh?: number | null
          capacity_tons?: number | null
          coil_type: string
          connection_size?: string | null
          created_at?: string | null
          created_by?: string | null
          design_cfm?: number | null
          entering_air_db_f?: number | null
          entering_air_wb_f?: number | null
          face_area_sqft?: number | null
          face_velocity_fpm?: number | null
          fin_material?: string | null
          fins_per_inch?: number | null
          fluid_type?: string | null
          fluid_velocity_fps?: number | null
          id?: string
          leaving_air_db_f?: number | null
          leaving_air_wb_f?: number | null
          manufacturer?: string | null
          model_number?: string | null
          name: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          return_temp_f?: number | null
          rows?: number | null
          status?: string | null
          supply_temp_f?: number | null
          tube_material?: string | null
          updated_at?: string | null
          water_flow_gpm?: number | null
          water_pressure_drop_ft?: number | null
          zone_id?: string | null
        }
        Update: {
          ahu_configuration_id?: string | null
          air_pressure_drop_in?: number | null
          capacity_mbh?: number | null
          capacity_tons?: number | null
          coil_type?: string
          connection_size?: string | null
          created_at?: string | null
          created_by?: string | null
          design_cfm?: number | null
          entering_air_db_f?: number | null
          entering_air_wb_f?: number | null
          face_area_sqft?: number | null
          face_velocity_fpm?: number | null
          fin_material?: string | null
          fins_per_inch?: number | null
          fluid_type?: string | null
          fluid_velocity_fps?: number | null
          id?: string
          leaving_air_db_f?: number | null
          leaving_air_wb_f?: number | null
          manufacturer?: string | null
          model_number?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          return_temp_f?: number | null
          rows?: number | null
          status?: string | null
          supply_temp_f?: number | null
          tube_material?: string | null
          updated_at?: string | null
          water_flow_gpm?: number | null
          water_pressure_drop_ft?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coil_selections_ahu_configuration_id_fkey"
            columns: ["ahu_configuration_id"]
            isOneToOne: false
            referencedRelation: "ahu_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coil_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "coil_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coil_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coil_selections_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      commissioning_checklists: {
        Row: {
          checklist_type: string
          commissioning_project_id: string
          created_at: string
          design_data: Json | null
          equipment_id: string | null
          equipment_tag: string | null
          id: string
          installed_data: Json | null
          notes: string | null
          overall_status: string
          updated_at: string
          variance_summary: Json | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          checklist_type: string
          commissioning_project_id: string
          created_at?: string
          design_data?: Json | null
          equipment_id?: string | null
          equipment_tag?: string | null
          id?: string
          installed_data?: Json | null
          notes?: string | null
          overall_status?: string
          updated_at?: string
          variance_summary?: Json | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          checklist_type?: string
          commissioning_project_id?: string
          created_at?: string
          design_data?: Json | null
          equipment_id?: string | null
          equipment_tag?: string | null
          id?: string
          installed_data?: Json | null
          notes?: string | null
          overall_status?: string
          updated_at?: string
          variance_summary?: Json | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissioning_checklists_commissioning_project_id_fkey"
            columns: ["commissioning_project_id"]
            isOneToOne: false
            referencedRelation: "commissioning_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissioning_checklists_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissioning_checklists_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissioning_photo_metadata: {
        Row: {
          captured_at: string | null
          created_at: string | null
          deficiency_severity: string | null
          deficiency_tags: string[] | null
          description: string | null
          id: string
          is_before_photo: boolean | null
          photo_url: string
          related_after_photo_url: string | null
          remediation_completed_at: string | null
          remediation_notes: string | null
          test_id: string
          updated_at: string | null
        }
        Insert: {
          captured_at?: string | null
          created_at?: string | null
          deficiency_severity?: string | null
          deficiency_tags?: string[] | null
          description?: string | null
          id?: string
          is_before_photo?: boolean | null
          photo_url: string
          related_after_photo_url?: string | null
          remediation_completed_at?: string | null
          remediation_notes?: string | null
          test_id: string
          updated_at?: string | null
        }
        Update: {
          captured_at?: string | null
          created_at?: string | null
          deficiency_severity?: string | null
          deficiency_tags?: string[] | null
          description?: string | null
          id?: string
          is_before_photo?: boolean | null
          photo_url?: string
          related_after_photo_url?: string | null
          remediation_completed_at?: string | null
          remediation_notes?: string | null
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissioning_photo_metadata_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "commissioning_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      commissioning_projects: {
        Row: {
          actual_completion_date: string | null
          building_id: string | null
          contractor_contact: string | null
          contractor_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          project_id: string | null
          start_date: string | null
          status: string
          target_completion_date: string | null
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          building_id?: string | null
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          building_id?: string | null
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissioning_projects_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissioning_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissioning_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissioning_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      commissioning_tests: {
        Row: {
          actual_value: string | null
          checklist_id: string
          created_at: string
          expected_value: string | null
          id: string
          notes: string | null
          photos_urls: string[] | null
          result: string
          technician_id: string | null
          technician_name: string | null
          test_category: string | null
          test_date: string | null
          test_name: string
          tolerance_percent: number | null
          variance_percent: number | null
        }
        Insert: {
          actual_value?: string | null
          checklist_id: string
          created_at?: string
          expected_value?: string | null
          id?: string
          notes?: string | null
          photos_urls?: string[] | null
          result?: string
          technician_id?: string | null
          technician_name?: string | null
          test_category?: string | null
          test_date?: string | null
          test_name: string
          tolerance_percent?: number | null
          variance_percent?: number | null
        }
        Update: {
          actual_value?: string | null
          checklist_id?: string
          created_at?: string
          expected_value?: string | null
          id?: string
          notes?: string | null
          photos_urls?: string[] | null
          result?: string
          technician_id?: string | null
          technician_name?: string | null
          test_category?: string | null
          test_date?: string | null
          test_name?: string
          tolerance_percent?: number | null
          variance_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commissioning_tests_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "commissioning_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissioning_tests_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_equipment: {
        Row: {
          contract_id: string
          coverage_notes: string | null
          created_at: string
          equipment_id: string
          id: string
        }
        Insert: {
          contract_id: string
          coverage_notes?: string | null
          created_at?: string
          equipment_id: string
          id?: string
        }
        Update: {
          contract_id?: string
          coverage_notes?: string | null
          created_at?: string
          equipment_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_equipment_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_pm_schedules: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          pm_schedule_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          pm_schedule_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          pm_schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_pm_schedules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_pm_schedules_pm_schedule_id_fkey"
            columns: ["pm_schedule_id"]
            isOneToOne: false
            referencedRelation: "pm_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewals: {
        Row: {
          contract_id: string
          id: string
          new_end_date: string
          new_value_sar: number | null
          notes: string | null
          previous_end_date: string
          previous_value_sar: number | null
          renewed_at: string
          renewed_by: string | null
        }
        Insert: {
          contract_id: string
          id?: string
          new_end_date: string
          new_value_sar?: number | null
          notes?: string | null
          previous_end_date: string
          previous_value_sar?: number | null
          renewed_at?: string
          renewed_by?: string | null
        }
        Update: {
          contract_id?: string
          id?: string
          new_end_date?: string
          new_value_sar?: number | null
          notes?: string | null
          previous_end_date?: string
          previous_value_sar?: number | null
          renewed_at?: string
          renewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_renewals_renewed_by_fkey"
            columns: ["renewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      control_valve_selections: {
        Row: {
          created_at: string | null
          cv_required: number | null
          cv_selected: number | null
          id: string
          organization_id: string
          pipe_system_id: string | null
          pressure_drop_psi: number | null
          project_id: string | null
          size_inches: number | null
          status: string | null
          updated_at: string | null
          valve_authority: number | null
          valve_type: string | null
        }
        Insert: {
          created_at?: string | null
          cv_required?: number | null
          cv_selected?: number | null
          id?: string
          organization_id: string
          pipe_system_id?: string | null
          pressure_drop_psi?: number | null
          project_id?: string | null
          size_inches?: number | null
          status?: string | null
          updated_at?: string | null
          valve_authority?: number | null
          valve_type?: string | null
        }
        Update: {
          created_at?: string | null
          cv_required?: number | null
          cv_selected?: number | null
          id?: string
          organization_id?: string
          pipe_system_id?: string | null
          pressure_drop_psi?: number | null
          project_id?: string | null
          size_inches?: number | null
          status?: string | null
          updated_at?: string | null
          valve_authority?: number | null
          valve_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_valve_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_valve_selections_pipe_system_id_fkey"
            columns: ["pipe_system_id"]
            isOneToOne: false
            referencedRelation: "pipe_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_valve_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cooling_tower_selections: {
        Row: {
          approach_f: number | null
          basin_heater_kw: number | null
          blowdown_gpm: number | null
          capacity_per_cell_tons: number | null
          chw_plant_id: string | null
          created_at: string | null
          created_by: string | null
          cw_flow_gpm: number | null
          cw_return_temp_f: number | null
          cw_supply_temp_f: number | null
          cycles_of_concentration: number | null
          design_wet_bulb_f: number | null
          dimensions_json: Json | null
          drift_rate_percent: number | null
          fan_hp_per_cell: number | null
          fan_type: string | null
          fill_type: string | null
          id: string
          makeup_water_gpm: number | null
          manufacturer: string | null
          material: string | null
          model_number: string | null
          motor_efficiency_percent: number | null
          name: string
          notes: string | null
          number_of_cells: number | null
          organization_id: string
          project_id: string | null
          range_f: number | null
          sound_level_db: number | null
          status: string | null
          total_capacity_tons: number | null
          total_fan_kw: number | null
          tower_type: string | null
          updated_at: string | null
          weight_operating_lbs: number | null
        }
        Insert: {
          approach_f?: number | null
          basin_heater_kw?: number | null
          blowdown_gpm?: number | null
          capacity_per_cell_tons?: number | null
          chw_plant_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cw_flow_gpm?: number | null
          cw_return_temp_f?: number | null
          cw_supply_temp_f?: number | null
          cycles_of_concentration?: number | null
          design_wet_bulb_f?: number | null
          dimensions_json?: Json | null
          drift_rate_percent?: number | null
          fan_hp_per_cell?: number | null
          fan_type?: string | null
          fill_type?: string | null
          id?: string
          makeup_water_gpm?: number | null
          manufacturer?: string | null
          material?: string | null
          model_number?: string | null
          motor_efficiency_percent?: number | null
          name: string
          notes?: string | null
          number_of_cells?: number | null
          organization_id: string
          project_id?: string | null
          range_f?: number | null
          sound_level_db?: number | null
          status?: string | null
          total_capacity_tons?: number | null
          total_fan_kw?: number | null
          tower_type?: string | null
          updated_at?: string | null
          weight_operating_lbs?: number | null
        }
        Update: {
          approach_f?: number | null
          basin_heater_kw?: number | null
          blowdown_gpm?: number | null
          capacity_per_cell_tons?: number | null
          chw_plant_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cw_flow_gpm?: number | null
          cw_return_temp_f?: number | null
          cw_supply_temp_f?: number | null
          cycles_of_concentration?: number | null
          design_wet_bulb_f?: number | null
          dimensions_json?: Json | null
          drift_rate_percent?: number | null
          fan_hp_per_cell?: number | null
          fan_type?: string | null
          fill_type?: string | null
          id?: string
          makeup_water_gpm?: number | null
          manufacturer?: string | null
          material?: string | null
          model_number?: string | null
          motor_efficiency_percent?: number | null
          name?: string
          notes?: string | null
          number_of_cells?: number | null
          organization_id?: string
          project_id?: string | null
          range_f?: number | null
          sound_level_db?: number | null
          status?: string | null
          total_capacity_tons?: number | null
          total_fan_kw?: number | null
          tower_type?: string | null
          updated_at?: string | null
          weight_operating_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cooling_tower_selections_chw_plant_id_fkey"
            columns: ["chw_plant_id"]
            isOneToOne: false
            referencedRelation: "chilled_water_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooling_tower_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cooling_tower_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cooling_tower_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          alternate_phone: string | null
          city: string | null
          company_name: string | null
          company_name_ar: string | null
          contact_email: string | null
          contact_name: string
          contact_name_ar: string | null
          contact_phone: string
          contract_end_date: string | null
          contract_start_date: string | null
          contract_type: string | null
          contract_value_sar: number | null
          created_at: string
          credit_limit_sar: number | null
          customer_number: string
          customer_type: string | null
          has_service_contract: boolean | null
          id: string
          is_active: boolean | null
          last_service_date: string | null
          organization_id: string
          payment_terms: string | null
          postal_code: string | null
          preferred_contact_method: string | null
          preferred_technician_id: string | null
          special_instructions: string | null
          total_revenue_sar: number | null
          total_work_orders: number | null
          trade_license: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address: string
          alternate_phone?: string | null
          city?: string | null
          company_name?: string | null
          company_name_ar?: string | null
          contact_email?: string | null
          contact_name: string
          contact_name_ar?: string | null
          contact_phone: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type?: string | null
          contract_value_sar?: number | null
          created_at?: string
          credit_limit_sar?: number | null
          customer_number: string
          customer_type?: string | null
          has_service_contract?: boolean | null
          id?: string
          is_active?: boolean | null
          last_service_date?: string | null
          organization_id: string
          payment_terms?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_technician_id?: string | null
          special_instructions?: string | null
          total_revenue_sar?: number | null
          total_work_orders?: number | null
          trade_license?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string
          alternate_phone?: string | null
          city?: string | null
          company_name?: string | null
          company_name_ar?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_name_ar?: string | null
          contact_phone?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_type?: string | null
          contract_value_sar?: number | null
          created_at?: string
          credit_limit_sar?: number | null
          customer_number?: string
          customer_type?: string | null
          has_service_contract?: boolean | null
          id?: string
          is_active?: boolean | null
          last_service_date?: string | null
          organization_id?: string
          payment_terms?: string | null
          postal_code?: string | null
          preferred_contact_method?: string | null
          preferred_technician_id?: string | null
          special_instructions?: string | null
          total_revenue_sar?: number | null
          total_work_orders?: number | null
          trade_license?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deficiency_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          notification_sent_at: string | null
          organization_id: string
          photo_metadata_id: string
          priority: string | null
          reminder_sent_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          notification_sent_at?: string | null
          organization_id: string
          photo_metadata_id: string
          priority?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          notification_sent_at?: string | null
          organization_id?: string
          photo_metadata_id?: string
          priority?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deficiency_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiency_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiency_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiency_assignments_photo_metadata_id_fkey"
            columns: ["photo_metadata_id"]
            isOneToOne: false
            referencedRelation: "commissioning_photo_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      design_alternatives: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          is_primary: boolean | null
          name: string
          organization_id: string
          project_id: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data?: Json
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          is_primary?: boolean | null
          name: string
          organization_id: string
          project_id: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          organization_id?: string
          project_id?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_alternatives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "design_alternatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_alternatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_approval_comments: {
        Row: {
          approval_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          parent_comment_id: string | null
          updated_at: string
        }
        Insert: {
          approval_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_approval_comments_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "design_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_approval_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "design_approval_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      design_approvals: {
        Row: {
          created_at: string | null
          due_date: string | null
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
          priority: string | null
          project_id: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision_id: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
          priority?: string | null
          project_id: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
          priority?: string | null
          project_id?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "design_approvals_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "design_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_approvals_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      design_completeness_building_snapshots: {
        Row: {
          building_id: string
          building_name: string
          created_at: string
          fully_complete_zones: number
          id: string
          overall_completeness_percent: number
          snapshot_id: string
          total_zones: number
          zones_passing_nc: number | null
          zones_with_acoustic: number | null
          zones_with_distribution: number
          zones_with_equipment: number
          zones_with_erv: number | null
          zones_with_load_calc: number
          zones_with_ventilation: number | null
        }
        Insert: {
          building_id: string
          building_name: string
          created_at?: string
          fully_complete_zones?: number
          id?: string
          overall_completeness_percent?: number
          snapshot_id: string
          total_zones?: number
          zones_passing_nc?: number | null
          zones_with_acoustic?: number | null
          zones_with_distribution?: number
          zones_with_equipment?: number
          zones_with_erv?: number | null
          zones_with_load_calc?: number
          zones_with_ventilation?: number | null
        }
        Update: {
          building_id?: string
          building_name?: string
          created_at?: string
          fully_complete_zones?: number
          id?: string
          overall_completeness_percent?: number
          snapshot_id?: string
          total_zones?: number
          zones_passing_nc?: number | null
          zones_with_acoustic?: number | null
          zones_with_distribution?: number
          zones_with_equipment?: number
          zones_with_erv?: number | null
          zones_with_load_calc?: number
          zones_with_ventilation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_completeness_building_snapshots_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_completeness_building_snapshots_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "design_completeness_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      design_completeness_snapshots: {
        Row: {
          acoustic_percent: number | null
          boiler_avg_afue: number | null
          boiler_selection_count: number | null
          boiler_total_capacity_mbh: number | null
          chiller_avg_iplv: number | null
          chiller_selection_count: number | null
          chiller_total_capacity_tons: number | null
          created_at: string
          distribution_percent: number
          equipment_percent: number
          erv_percent: number | null
          fully_complete_zones: number
          has_ahu_configurations: boolean | null
          has_ashrae_90_1_compliance: boolean | null
          has_chw_plant: boolean | null
          has_coil_selections: boolean | null
          has_control_valve_selections: boolean | null
          has_cooling_tower_selections: boolean | null
          has_economizer_selections: boolean | null
          has_expansion_tank_selections: boolean | null
          has_fan_selections: boolean | null
          has_filter_selections: boolean | null
          has_hw_plant: boolean | null
          has_insulation_calculations: boolean | null
          has_pump_selections: boolean | null
          has_sbc_compliance: boolean | null
          has_sequence_of_operations: boolean | null
          has_silencer_selections: boolean | null
          has_smoke_control: boolean | null
          has_thermal_comfort: boolean | null
          has_vibration_isolation_selections: boolean | null
          id: string
          load_calc_percent: number
          nc_compliance_percent: number | null
          organization_id: string
          overall_completeness_percent: number
          project_id: string
          snapshot_date: string
          total_zones: number
          ventilation_percent: number | null
          zones_passing_nc: number | null
          zones_with_acoustic: number | null
          zones_with_distribution: number
          zones_with_equipment: number
          zones_with_erv: number | null
          zones_with_load_calc: number
          zones_with_ventilation: number | null
        }
        Insert: {
          acoustic_percent?: number | null
          boiler_avg_afue?: number | null
          boiler_selection_count?: number | null
          boiler_total_capacity_mbh?: number | null
          chiller_avg_iplv?: number | null
          chiller_selection_count?: number | null
          chiller_total_capacity_tons?: number | null
          created_at?: string
          distribution_percent?: number
          equipment_percent?: number
          erv_percent?: number | null
          fully_complete_zones?: number
          has_ahu_configurations?: boolean | null
          has_ashrae_90_1_compliance?: boolean | null
          has_chw_plant?: boolean | null
          has_coil_selections?: boolean | null
          has_control_valve_selections?: boolean | null
          has_cooling_tower_selections?: boolean | null
          has_economizer_selections?: boolean | null
          has_expansion_tank_selections?: boolean | null
          has_fan_selections?: boolean | null
          has_filter_selections?: boolean | null
          has_hw_plant?: boolean | null
          has_insulation_calculations?: boolean | null
          has_pump_selections?: boolean | null
          has_sbc_compliance?: boolean | null
          has_sequence_of_operations?: boolean | null
          has_silencer_selections?: boolean | null
          has_smoke_control?: boolean | null
          has_thermal_comfort?: boolean | null
          has_vibration_isolation_selections?: boolean | null
          id?: string
          load_calc_percent?: number
          nc_compliance_percent?: number | null
          organization_id: string
          overall_completeness_percent?: number
          project_id: string
          snapshot_date: string
          total_zones?: number
          ventilation_percent?: number | null
          zones_passing_nc?: number | null
          zones_with_acoustic?: number | null
          zones_with_distribution?: number
          zones_with_equipment?: number
          zones_with_erv?: number | null
          zones_with_load_calc?: number
          zones_with_ventilation?: number | null
        }
        Update: {
          acoustic_percent?: number | null
          boiler_avg_afue?: number | null
          boiler_selection_count?: number | null
          boiler_total_capacity_mbh?: number | null
          chiller_avg_iplv?: number | null
          chiller_selection_count?: number | null
          chiller_total_capacity_tons?: number | null
          created_at?: string
          distribution_percent?: number
          equipment_percent?: number
          erv_percent?: number | null
          fully_complete_zones?: number
          has_ahu_configurations?: boolean | null
          has_ashrae_90_1_compliance?: boolean | null
          has_chw_plant?: boolean | null
          has_coil_selections?: boolean | null
          has_control_valve_selections?: boolean | null
          has_cooling_tower_selections?: boolean | null
          has_economizer_selections?: boolean | null
          has_expansion_tank_selections?: boolean | null
          has_fan_selections?: boolean | null
          has_filter_selections?: boolean | null
          has_hw_plant?: boolean | null
          has_insulation_calculations?: boolean | null
          has_pump_selections?: boolean | null
          has_sbc_compliance?: boolean | null
          has_sequence_of_operations?: boolean | null
          has_silencer_selections?: boolean | null
          has_smoke_control?: boolean | null
          has_thermal_comfort?: boolean | null
          has_vibration_isolation_selections?: boolean | null
          id?: string
          load_calc_percent?: number
          nc_compliance_percent?: number | null
          organization_id?: string
          overall_completeness_percent?: number
          project_id?: string
          snapshot_date?: string
          total_zones?: number
          ventilation_percent?: number | null
          zones_passing_nc?: number | null
          zones_with_acoustic?: number | null
          zones_with_distribution?: number
          zones_with_equipment?: number
          zones_with_erv?: number | null
          zones_with_load_calc?: number
          zones_with_ventilation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_completeness_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_completeness_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_revisions: {
        Row: {
          change_summary: string | null
          change_type: string
          changes: Json | null
          comment: string | null
          created_at: string
          created_by: string | null
          current_data: Json
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
          previous_data: Json | null
          project_id: string
          revision_number: number
        }
        Insert: {
          change_summary?: string | null
          change_type?: string
          changes?: Json | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          current_data: Json
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
          previous_data?: Json | null
          project_id: string
          revision_number?: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string
          changes?: Json | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          current_data?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
          previous_data?: Json | null
          project_id?: string
          revision_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_revisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      design_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
          organization_id: string
          template_data: Json
          template_type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          organization_id: string
          template_data: Json
          template_type: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          organization_id?: string
          template_data?: Json
          template_type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diffuser_grilles: {
        Row: {
          airflow_cfm: number | null
          created_at: string
          duct_system_id: string
          face_velocity_fpm: number | null
          id: string
          location_description: string | null
          model: string | null
          neck_size: string | null
          noise_nc: number | null
          pressure_drop_pa: number | null
          quantity: number | null
          style: string | null
          terminal_type: string | null
          throw_distance_ft: number | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          airflow_cfm?: number | null
          created_at?: string
          duct_system_id: string
          face_velocity_fpm?: number | null
          id?: string
          location_description?: string | null
          model?: string | null
          neck_size?: string | null
          noise_nc?: number | null
          pressure_drop_pa?: number | null
          quantity?: number | null
          style?: string | null
          terminal_type?: string | null
          throw_distance_ft?: number | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          airflow_cfm?: number | null
          created_at?: string
          duct_system_id?: string
          face_velocity_fpm?: number | null
          id?: string
          location_description?: string | null
          model?: string | null
          neck_size?: string | null
          noise_nc?: number | null
          pressure_drop_pa?: number | null
          quantity?: number | null
          style?: string | null
          terminal_type?: string | null
          throw_distance_ft?: number | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diffuser_grilles_duct_system_id_fkey"
            columns: ["duct_system_id"]
            isOneToOne: false
            referencedRelation: "duct_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diffuser_grilles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_internal: boolean | null
          note_type: string | null
          organization_id: string
          work_order_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          note_type?: string | null
          organization_id: string
          work_order_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal?: boolean | null
          note_type?: string | null
          organization_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_notes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: string | null
          equipment_id: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          organization_id: string
          project_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          equipment_id?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          organization_id: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          equipment_id?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      duct_fittings: {
        Row: {
          created_at: string
          duct_segment_id: string
          equivalent_length_ft: number | null
          fitting_description: string | null
          fitting_type: string
          id: string
          loss_coefficient: number | null
          quantity: number | null
        }
        Insert: {
          created_at?: string
          duct_segment_id: string
          equivalent_length_ft?: number | null
          fitting_description?: string | null
          fitting_type: string
          id?: string
          loss_coefficient?: number | null
          quantity?: number | null
        }
        Update: {
          created_at?: string
          duct_segment_id?: string
          equivalent_length_ft?: number | null
          fitting_description?: string | null
          fitting_type?: string
          id?: string
          loss_coefficient?: number | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "duct_fittings_duct_segment_id_fkey"
            columns: ["duct_segment_id"]
            isOneToOne: false
            referencedRelation: "duct_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      duct_fittings_library: {
        Row: {
          angle_degrees: number | null
          ashrae_reference: string | null
          created_at: string | null
          description: string | null
          duct_shape: string
          fitting_category: string
          fitting_code: string
          fitting_name: string
          id: string
          is_active: boolean | null
          loss_coefficient: number
          radius_ratio: number | null
        }
        Insert: {
          angle_degrees?: number | null
          ashrae_reference?: string | null
          created_at?: string | null
          description?: string | null
          duct_shape: string
          fitting_category: string
          fitting_code: string
          fitting_name: string
          id?: string
          is_active?: boolean | null
          loss_coefficient: number
          radius_ratio?: number | null
        }
        Update: {
          angle_degrees?: number | null
          ashrae_reference?: string | null
          created_at?: string | null
          description?: string | null
          duct_shape?: string
          fitting_category?: string
          fitting_code?: string
          fitting_name?: string
          id?: string
          is_active?: boolean | null
          loss_coefficient?: number
          radius_ratio?: number | null
        }
        Relationships: []
      }
      duct_segments: {
        Row: {
          cfm: number
          created_at: string
          damper_pressure_drop_pa: number | null
          diameter_in: number | null
          duct_shape: string | null
          duct_system_id: string
          dynamic_loss_pa: number | null
          equivalent_diameter_mm: number | null
          fittings_equivalent_length_ft: number | null
          friction_loss_per_100ft: number | null
          from_node: string | null
          gauge_thickness_mm: number | null
          has_damper: boolean | null
          height_in: number | null
          id: string
          is_critical_path: boolean | null
          length_ft: number | null
          material_type: string | null
          parent_segment_id: string | null
          sealing_class: string | null
          segment_name: string
          sort_order: number | null
          to_node: string | null
          total_pressure_drop: number | null
          updated_at: string
          velocity_fpm: number | null
          width_in: number | null
          zone_id: string | null
        }
        Insert: {
          cfm: number
          created_at?: string
          damper_pressure_drop_pa?: number | null
          diameter_in?: number | null
          duct_shape?: string | null
          duct_system_id: string
          dynamic_loss_pa?: number | null
          equivalent_diameter_mm?: number | null
          fittings_equivalent_length_ft?: number | null
          friction_loss_per_100ft?: number | null
          from_node?: string | null
          gauge_thickness_mm?: number | null
          has_damper?: boolean | null
          height_in?: number | null
          id?: string
          is_critical_path?: boolean | null
          length_ft?: number | null
          material_type?: string | null
          parent_segment_id?: string | null
          sealing_class?: string | null
          segment_name: string
          sort_order?: number | null
          to_node?: string | null
          total_pressure_drop?: number | null
          updated_at?: string
          velocity_fpm?: number | null
          width_in?: number | null
          zone_id?: string | null
        }
        Update: {
          cfm?: number
          created_at?: string
          damper_pressure_drop_pa?: number | null
          diameter_in?: number | null
          duct_shape?: string | null
          duct_system_id?: string
          dynamic_loss_pa?: number | null
          equivalent_diameter_mm?: number | null
          fittings_equivalent_length_ft?: number | null
          friction_loss_per_100ft?: number | null
          from_node?: string | null
          gauge_thickness_mm?: number | null
          has_damper?: boolean | null
          height_in?: number | null
          id?: string
          is_critical_path?: boolean | null
          length_ft?: number | null
          material_type?: string | null
          parent_segment_id?: string | null
          sealing_class?: string | null
          segment_name?: string
          sort_order?: number | null
          to_node?: string | null
          total_pressure_drop?: number | null
          updated_at?: string
          velocity_fpm?: number | null
          width_in?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duct_segments_duct_system_id_fkey"
            columns: ["duct_system_id"]
            isOneToOne: false
            referencedRelation: "duct_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duct_segments_parent_segment_id_fkey"
            columns: ["parent_segment_id"]
            isOneToOne: false
            referencedRelation: "duct_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duct_segments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      duct_system_zones: {
        Row: {
          airflow_cfm: number | null
          created_at: string | null
          duct_system_id: string
          id: string
          notes: string | null
          zone_id: string
        }
        Insert: {
          airflow_cfm?: number | null
          created_at?: string | null
          duct_system_id: string
          id?: string
          notes?: string | null
          zone_id: string
        }
        Update: {
          airflow_cfm?: number | null
          created_at?: string | null
          duct_system_id?: string
          id?: string
          notes?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duct_system_zones_duct_system_id_fkey"
            columns: ["duct_system_id"]
            isOneToOne: false
            referencedRelation: "duct_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duct_system_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      duct_systems: {
        Row: {
          created_at: string
          created_by: string | null
          critical_path_pressure_pa: number | null
          design_method: string | null
          design_velocity_fpm: number | null
          duct_material: string | null
          fan_power_kw: number | null
          fan_type: string | null
          friction_rate_pa_per_m: number | null
          id: string
          insulation_type: string | null
          load_calculation_id: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          sizing_method: string | null
          status: string | null
          system_name: string
          system_static_pressure_pa: number | null
          system_type: string | null
          target_friction_rate: number | null
          total_airflow_cfm: number | null
          total_duct_area_m2: number | null
          total_duct_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          critical_path_pressure_pa?: number | null
          design_method?: string | null
          design_velocity_fpm?: number | null
          duct_material?: string | null
          fan_power_kw?: number | null
          fan_type?: string | null
          friction_rate_pa_per_m?: number | null
          id?: string
          insulation_type?: string | null
          load_calculation_id?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          sizing_method?: string | null
          status?: string | null
          system_name: string
          system_static_pressure_pa?: number | null
          system_type?: string | null
          target_friction_rate?: number | null
          total_airflow_cfm?: number | null
          total_duct_area_m2?: number | null
          total_duct_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          critical_path_pressure_pa?: number | null
          design_method?: string | null
          design_velocity_fpm?: number | null
          duct_material?: string | null
          fan_power_kw?: number | null
          fan_type?: string | null
          friction_rate_pa_per_m?: number | null
          id?: string
          insulation_type?: string | null
          load_calculation_id?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          sizing_method?: string | null
          status?: string | null
          system_name?: string
          system_static_pressure_pa?: number | null
          system_type?: string | null
          target_friction_rate?: number | null
          total_airflow_cfm?: number | null
          total_duct_area_m2?: number | null
          total_duct_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duct_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duct_systems_load_calculation_id_fkey"
            columns: ["load_calculation_id"]
            isOneToOne: false
            referencedRelation: "load_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duct_systems_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duct_systems_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      economizer_selections: {
        Row: {
          ahu_id: string | null
          changeover_temp_f: number | null
          created_at: string | null
          design_cfm: number | null
          economizer_type: string | null
          energy_savings_kwh: number | null
          id: string
          min_oa_cfm: number | null
          organization_id: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ahu_id?: string | null
          changeover_temp_f?: number | null
          created_at?: string | null
          design_cfm?: number | null
          economizer_type?: string | null
          energy_savings_kwh?: number | null
          id?: string
          min_oa_cfm?: number | null
          organization_id: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ahu_id?: string | null
          changeover_temp_f?: number | null
          created_at?: string | null
          design_cfm?: number | null
          economizer_type?: string | null
          energy_savings_kwh?: number | null
          id?: string
          min_oa_cfm?: number | null
          organization_id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "economizer_selections_ahu_id_fkey"
            columns: ["ahu_id"]
            isOneToOne: false
            referencedRelation: "ahu_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "economizer_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "economizer_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_daily_aggregates: {
        Row: {
          avg_demand_kw: number | null
          avg_outside_temp_f: number | null
          cooling_degree_days: number | null
          created_at: string
          date: string
          demand_cost: number | null
          energy_cost: number | null
          heating_degree_days: number | null
          id: string
          meter_id: string
          min_demand_kw: number | null
          peak_demand_kw: number | null
          reading_count: number | null
          total_consumption: number
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          avg_demand_kw?: number | null
          avg_outside_temp_f?: number | null
          cooling_degree_days?: number | null
          created_at?: string
          date: string
          demand_cost?: number | null
          energy_cost?: number | null
          heating_degree_days?: number | null
          id?: string
          meter_id: string
          min_demand_kw?: number | null
          peak_demand_kw?: number | null
          reading_count?: number | null
          total_consumption?: number
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          avg_demand_kw?: number | null
          avg_outside_temp_f?: number | null
          cooling_degree_days?: number | null
          created_at?: string
          date?: string
          demand_cost?: number | null
          energy_cost?: number | null
          heating_degree_days?: number | null
          id?: string
          meter_id?: string
          min_demand_kw?: number | null
          peak_demand_kw?: number | null
          reading_count?: number | null
          total_consumption?: number
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_daily_aggregates_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "energy_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_meters: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          ct_ratio: number | null
          demand_cost_per_kw: number | null
          equipment_id: string | null
          id: string
          is_main_meter: boolean | null
          meter_tag: string
          meter_type: string
          name: string
          organization_id: string
          project_id: string | null
          pulse_factor: number | null
          serial_number: string | null
          status: string
          system_type: string
          unit: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          ct_ratio?: number | null
          demand_cost_per_kw?: number | null
          equipment_id?: string | null
          id?: string
          is_main_meter?: boolean | null
          meter_tag: string
          meter_type?: string
          name: string
          organization_id: string
          project_id?: string | null
          pulse_factor?: number | null
          serial_number?: string | null
          status?: string
          system_type?: string
          unit?: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          ct_ratio?: number | null
          demand_cost_per_kw?: number | null
          equipment_id?: string | null
          id?: string
          is_main_meter?: boolean | null
          meter_tag?: string
          meter_type?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          pulse_factor?: number | null
          serial_number?: string | null
          status?: string
          system_type?: string
          unit?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_meters_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_meters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_meters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_meters_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_readings: {
        Row: {
          consumption: number | null
          demand_kw: number | null
          id: string
          meter_id: string
          outside_air_temp_f: number | null
          power_factor: number | null
          quality: string
          received_at: string
          recorded_at: string
          source: string | null
          value: number
        }
        Insert: {
          consumption?: number | null
          demand_kw?: number | null
          id?: string
          meter_id: string
          outside_air_temp_f?: number | null
          power_factor?: number | null
          quality?: string
          received_at?: string
          recorded_at: string
          source?: string | null
          value: number
        }
        Update: {
          consumption?: number | null
          demand_kw?: number | null
          id?: string
          meter_id?: string
          outside_air_temp_f?: number | null
          power_factor?: number | null
          quality?: string
          received_at?: string
          recorded_at?: string
          source?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "energy_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "energy_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          capacity_unit: string | null
          capacity_value: number | null
          category_id: string | null
          created_at: string
          equipment_type: string | null
          id: string
          install_date: string | null
          manufacturer: string | null
          model: string | null
          name: string
          organization_id: string
          project_id: string | null
          serial_number: string | null
          specifications: Json | null
          status: string
          tag: string
          updated_at: string
          warranty_expiry: string | null
          zone_id: string | null
        }
        Insert: {
          capacity_unit?: string | null
          capacity_value?: number | null
          category_id?: string | null
          created_at?: string
          equipment_type?: string | null
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          organization_id: string
          project_id?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          tag: string
          updated_at?: string
          warranty_expiry?: string | null
          zone_id?: string | null
        }
        Update: {
          capacity_unit?: string | null
          capacity_value?: number | null
          category_id?: string | null
          created_at?: string
          equipment_type?: string | null
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          organization_id?: string
          project_id?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          tag?: string
          updated_at?: string
          warranty_expiry?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_catalog: {
        Row: {
          afue: number | null
          ahri_cert_number: string | null
          ahri_certified: boolean | null
          airflow_max_l_s: number | null
          airflow_min_l_s: number | null
          airflow_rated_l_s: number | null
          ashrae_compliant: boolean | null
          asme_compliant: boolean | null
          chw_delta_t_f: number | null
          combustion_efficiency: number | null
          compressor_type: string | null
          cond_pressure_drop_ft: number | null
          cooling_capacity_kw: number | null
          cooling_capacity_tons: number | null
          cop: number | null
          created_at: string
          cw_delta_t_f: number | null
          datasheet_url: string | null
          dimensions: Json | null
          eer: number | null
          energy_rating_stars: number | null
          equipment_category: string
          equipment_subcategory: string | null
          evap_pressure_drop_ft: number | null
          external_static_pressure_pa: number | null
          fuel_type: string | null
          full_load_amps: number | null
          heating_capacity_kw: number | null
          id: string
          iom_manual_url: string | null
          iplv: number | null
          is_active: boolean | null
          lead_time_weeks: number | null
          list_price_sar: number | null
          lra: number | null
          manufacturer: string
          min_modulation: number | null
          model_number: string
          nox_emissions_ppm: number | null
          operating_range_cooling: Json | null
          operating_range_heating: Json | null
          part_load_curve: Json | null
          phases: number | null
          power_input_kw: number | null
          pressure_drop_kpa: number | null
          refrigerant_charge_kg: number | null
          refrigerant_type: string | null
          saso_certificate_number: string | null
          saso_certified: boolean | null
          sec_approved: boolean | null
          seer: number | null
          sound_power_level_db: number | null
          sound_pressure_level_db: number | null
          submittal_url: string | null
          supply_temp_range: Json | null
          thermal_efficiency: number | null
          turndown_ratio: number | null
          updated_at: string
          voltage: string | null
          waterflow_l_s: number | null
          weight_kg: number | null
        }
        Insert: {
          afue?: number | null
          ahri_cert_number?: string | null
          ahri_certified?: boolean | null
          airflow_max_l_s?: number | null
          airflow_min_l_s?: number | null
          airflow_rated_l_s?: number | null
          ashrae_compliant?: boolean | null
          asme_compliant?: boolean | null
          chw_delta_t_f?: number | null
          combustion_efficiency?: number | null
          compressor_type?: string | null
          cond_pressure_drop_ft?: number | null
          cooling_capacity_kw?: number | null
          cooling_capacity_tons?: number | null
          cop?: number | null
          created_at?: string
          cw_delta_t_f?: number | null
          datasheet_url?: string | null
          dimensions?: Json | null
          eer?: number | null
          energy_rating_stars?: number | null
          equipment_category: string
          equipment_subcategory?: string | null
          evap_pressure_drop_ft?: number | null
          external_static_pressure_pa?: number | null
          fuel_type?: string | null
          full_load_amps?: number | null
          heating_capacity_kw?: number | null
          id?: string
          iom_manual_url?: string | null
          iplv?: number | null
          is_active?: boolean | null
          lead_time_weeks?: number | null
          list_price_sar?: number | null
          lra?: number | null
          manufacturer: string
          min_modulation?: number | null
          model_number: string
          nox_emissions_ppm?: number | null
          operating_range_cooling?: Json | null
          operating_range_heating?: Json | null
          part_load_curve?: Json | null
          phases?: number | null
          power_input_kw?: number | null
          pressure_drop_kpa?: number | null
          refrigerant_charge_kg?: number | null
          refrigerant_type?: string | null
          saso_certificate_number?: string | null
          saso_certified?: boolean | null
          sec_approved?: boolean | null
          seer?: number | null
          sound_power_level_db?: number | null
          sound_pressure_level_db?: number | null
          submittal_url?: string | null
          supply_temp_range?: Json | null
          thermal_efficiency?: number | null
          turndown_ratio?: number | null
          updated_at?: string
          voltage?: string | null
          waterflow_l_s?: number | null
          weight_kg?: number | null
        }
        Update: {
          afue?: number | null
          ahri_cert_number?: string | null
          ahri_certified?: boolean | null
          airflow_max_l_s?: number | null
          airflow_min_l_s?: number | null
          airflow_rated_l_s?: number | null
          ashrae_compliant?: boolean | null
          asme_compliant?: boolean | null
          chw_delta_t_f?: number | null
          combustion_efficiency?: number | null
          compressor_type?: string | null
          cond_pressure_drop_ft?: number | null
          cooling_capacity_kw?: number | null
          cooling_capacity_tons?: number | null
          cop?: number | null
          created_at?: string
          cw_delta_t_f?: number | null
          datasheet_url?: string | null
          dimensions?: Json | null
          eer?: number | null
          energy_rating_stars?: number | null
          equipment_category?: string
          equipment_subcategory?: string | null
          evap_pressure_drop_ft?: number | null
          external_static_pressure_pa?: number | null
          fuel_type?: string | null
          full_load_amps?: number | null
          heating_capacity_kw?: number | null
          id?: string
          iom_manual_url?: string | null
          iplv?: number | null
          is_active?: boolean | null
          lead_time_weeks?: number | null
          list_price_sar?: number | null
          lra?: number | null
          manufacturer?: string
          min_modulation?: number | null
          model_number?: string
          nox_emissions_ppm?: number | null
          operating_range_cooling?: Json | null
          operating_range_heating?: Json | null
          part_load_curve?: Json | null
          phases?: number | null
          power_input_kw?: number | null
          pressure_drop_kpa?: number | null
          refrigerant_charge_kg?: number | null
          refrigerant_type?: string | null
          saso_certificate_number?: string | null
          saso_certified?: boolean | null
          sec_approved?: boolean | null
          seer?: number | null
          sound_power_level_db?: number | null
          sound_pressure_level_db?: number | null
          submittal_url?: string | null
          supply_temp_range?: Json | null
          thermal_efficiency?: number | null
          turndown_ratio?: number | null
          updated_at?: string
          voltage?: string | null
          waterflow_l_s?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      equipment_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_health_scores: {
        Row: {
          analysis_factors: Json | null
          condition_score: number | null
          created_at: string
          efficiency_score: number | null
          equipment_id: string
          id: string
          last_analyzed_at: string
          maintenance_urgency: string | null
          organization_id: string
          overall_score: number
          performance_score: number | null
          predicted_maintenance_date: string | null
          recommendations: Json | null
          reliability_score: number | null
          risk_level: string | null
          sensor_data_summary: Json | null
          trend: string | null
          updated_at: string
        }
        Insert: {
          analysis_factors?: Json | null
          condition_score?: number | null
          created_at?: string
          efficiency_score?: number | null
          equipment_id: string
          id?: string
          last_analyzed_at?: string
          maintenance_urgency?: string | null
          organization_id: string
          overall_score: number
          performance_score?: number | null
          predicted_maintenance_date?: string | null
          recommendations?: Json | null
          reliability_score?: number | null
          risk_level?: string | null
          sensor_data_summary?: Json | null
          trend?: string | null
          updated_at?: string
        }
        Update: {
          analysis_factors?: Json | null
          condition_score?: number | null
          created_at?: string
          efficiency_score?: number | null
          equipment_id?: string
          id?: string
          last_analyzed_at?: string
          maintenance_urgency?: string | null
          organization_id?: string
          overall_score?: number
          performance_score?: number | null
          predicted_maintenance_date?: string | null
          recommendations?: Json | null
          reliability_score?: number | null
          risk_level?: string | null
          sensor_data_summary?: Json | null
          trend?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_health_scores_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: true
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_health_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_schedules: {
        Row: {
          columns_config: Json | null
          created_at: string
          created_by: string | null
          custom_header: Json | null
          equipment_ids: string[] | null
          grouping_mode: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          project_id: string | null
          revision: string | null
          schedule_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          columns_config?: Json | null
          created_at?: string
          created_by?: string | null
          custom_header?: Json | null
          equipment_ids?: string[] | null
          grouping_mode?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          revision?: string | null
          schedule_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          columns_config?: Json | null
          created_at?: string
          created_by?: string | null
          custom_header?: Json | null
          equipment_ids?: string[] | null
          grouping_mode?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          revision?: string | null
          schedule_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_selections: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          comparison_notes: string | null
          created_at: string
          created_by: string | null
          equipment_category: string | null
          id: string
          lifecycle_cost_analysis: Json | null
          load_calculation_id: string | null
          organization_id: string
          project_id: string | null
          required_capacity_kw: number | null
          required_capacity_tons: number | null
          selected_equipment: Json | null
          selection_name: string
          status: string | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          comparison_notes?: string | null
          created_at?: string
          created_by?: string | null
          equipment_category?: string | null
          id?: string
          lifecycle_cost_analysis?: Json | null
          load_calculation_id?: string | null
          organization_id: string
          project_id?: string | null
          required_capacity_kw?: number | null
          required_capacity_tons?: number | null
          selected_equipment?: Json | null
          selection_name: string
          status?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          comparison_notes?: string | null
          created_at?: string
          created_by?: string | null
          equipment_category?: string | null
          id?: string
          lifecycle_cost_analysis?: Json | null
          load_calculation_id?: string | null
          organization_id?: string
          project_id?: string | null
          required_capacity_kw?: number | null
          required_capacity_tons?: number | null
          selected_equipment?: Json | null
          selection_name?: string
          status?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_selections_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_selections_load_calculation_id_fkey"
            columns: ["load_calculation_id"]
            isOneToOne: false
            referencedRelation: "load_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_selections_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      erv_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_value: number | null
          alert_type: string
          created_at: string
          equipment_id: string | null
          id: string
          is_active: boolean | null
          message: string | null
          organization_id: string
          resolved_at: string | null
          schedule_id: string | null
          severity: string
          threshold_value: number | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number | null
          alert_type: string
          created_at?: string
          equipment_id?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          organization_id: string
          resolved_at?: string | null
          schedule_id?: string | null
          severity?: string
          threshold_value?: number | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number | null
          alert_type?: string
          created_at?: string
          equipment_id?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          organization_id?: string
          resolved_at?: string | null
          schedule_id?: string | null
          severity?: string
          threshold_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "erv_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_alerts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_alerts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "erv_maintenance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      erv_annual_simulations: {
        Row: {
          avg_outdoor_temp_c: number | null
          cooling_recovery_kwh: number | null
          cost_savings_sar: number | null
          created_at: string
          erv_calculation_id: string
          heating_recovery_kwh: number | null
          id: string
          month: number
          operating_hours: number | null
        }
        Insert: {
          avg_outdoor_temp_c?: number | null
          cooling_recovery_kwh?: number | null
          cost_savings_sar?: number | null
          created_at?: string
          erv_calculation_id: string
          heating_recovery_kwh?: number | null
          id?: string
          month: number
          operating_hours?: number | null
        }
        Update: {
          avg_outdoor_temp_c?: number | null
          cooling_recovery_kwh?: number | null
          cost_savings_sar?: number | null
          created_at?: string
          erv_calculation_id?: string
          heating_recovery_kwh?: number | null
          id?: string
          month?: number
          operating_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "erv_annual_simulations_erv_calculation_id_fkey"
            columns: ["erv_calculation_id"]
            isOneToOne: false
            referencedRelation: "erv_sizing_calculations"
            referencedColumns: ["id"]
          },
        ]
      }
      erv_maintenance_logs: {
        Row: {
          created_at: string
          filter_part_number: string | null
          filter_type: string | null
          id: string
          labor_cost_sar: number | null
          labor_hours: number | null
          maintenance_type: string
          notes: string | null
          parts_cost_sar: number | null
          performed_at: string
          performed_by: string | null
          photos_urls: string[] | null
          post_maintenance_efficiency: number | null
          pre_maintenance_efficiency: number | null
          pressure_drop_after_pa: number | null
          pressure_drop_before_pa: number | null
          schedule_id: string
          technician_name: string | null
        }
        Insert: {
          created_at?: string
          filter_part_number?: string | null
          filter_type?: string | null
          id?: string
          labor_cost_sar?: number | null
          labor_hours?: number | null
          maintenance_type: string
          notes?: string | null
          parts_cost_sar?: number | null
          performed_at?: string
          performed_by?: string | null
          photos_urls?: string[] | null
          post_maintenance_efficiency?: number | null
          pre_maintenance_efficiency?: number | null
          pressure_drop_after_pa?: number | null
          pressure_drop_before_pa?: number | null
          schedule_id: string
          technician_name?: string | null
        }
        Update: {
          created_at?: string
          filter_part_number?: string | null
          filter_type?: string | null
          id?: string
          labor_cost_sar?: number | null
          labor_hours?: number | null
          maintenance_type?: string
          notes?: string | null
          parts_cost_sar?: number | null
          performed_at?: string
          performed_by?: string | null
          photos_urls?: string[] | null
          post_maintenance_efficiency?: number | null
          pre_maintenance_efficiency?: number | null
          pressure_drop_after_pa?: number | null
          pressure_drop_before_pa?: number | null
          schedule_id?: string
          technician_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erv_maintenance_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_maintenance_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "erv_maintenance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      erv_maintenance_schedules: {
        Row: {
          created_at: string
          equipment_id: string | null
          erv_name: string
          frequency_days: number
          id: string
          is_active: boolean | null
          last_performed_at: string | null
          maintenance_type: string
          next_due_at: string
          notes: string | null
          organization_id: string
          reminder_days_before: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          erv_name: string
          frequency_days?: number
          id?: string
          is_active?: boolean | null
          last_performed_at?: string | null
          maintenance_type: string
          next_due_at: string
          notes?: string | null
          organization_id: string
          reminder_days_before?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          erv_name?: string
          frequency_days?: number
          id?: string
          is_active?: boolean | null
          last_performed_at?: string | null
          maintenance_type?: string
          next_due_at?: string
          notes?: string | null
          organization_id?: string
          reminder_days_before?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erv_maintenance_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_maintenance_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      erv_performance_readings: {
        Row: {
          created_at: string
          equipment_id: string | null
          exhaust_air_temp_f: number | null
          exhaust_airflow_cfm: number | null
          filter_pressure_drop_pa: number | null
          id: string
          latent_efficiency: number | null
          notes: string | null
          organization_id: string
          outdoor_air_temp_f: number | null
          power_consumption_kw: number | null
          reading_at: string
          return_air_temp_f: number | null
          schedule_id: string | null
          sensible_efficiency: number | null
          supply_air_temp_f: number | null
          supply_airflow_cfm: number | null
          total_efficiency: number | null
          wheel_speed_rpm: number | null
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          exhaust_air_temp_f?: number | null
          exhaust_airflow_cfm?: number | null
          filter_pressure_drop_pa?: number | null
          id?: string
          latent_efficiency?: number | null
          notes?: string | null
          organization_id: string
          outdoor_air_temp_f?: number | null
          power_consumption_kw?: number | null
          reading_at?: string
          return_air_temp_f?: number | null
          schedule_id?: string | null
          sensible_efficiency?: number | null
          supply_air_temp_f?: number | null
          supply_airflow_cfm?: number | null
          total_efficiency?: number | null
          wheel_speed_rpm?: number | null
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          exhaust_air_temp_f?: number | null
          exhaust_airflow_cfm?: number | null
          filter_pressure_drop_pa?: number | null
          id?: string
          latent_efficiency?: number | null
          notes?: string | null
          organization_id?: string
          outdoor_air_temp_f?: number | null
          power_consumption_kw?: number | null
          reading_at?: string
          return_air_temp_f?: number | null
          schedule_id?: string | null
          sensible_efficiency?: number | null
          supply_air_temp_f?: number | null
          supply_airflow_cfm?: number | null
          total_efficiency?: number | null
          wheel_speed_rpm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "erv_performance_readings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_performance_readings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_performance_readings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "erv_maintenance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      erv_runtime_tracking: {
        Row: {
          baseline_pressure_drop_pa: number | null
          created_at: string
          current_pressure_drop_pa: number | null
          equipment_id: string | null
          id: string
          last_reset_at: string | null
          organization_id: string
          predicted_filter_life_days: number | null
          pressure_trend_slope: number | null
          runtime_hours_total: number
          runtime_since_filter: number
          schedule_id: string | null
          updated_at: string
        }
        Insert: {
          baseline_pressure_drop_pa?: number | null
          created_at?: string
          current_pressure_drop_pa?: number | null
          equipment_id?: string | null
          id?: string
          last_reset_at?: string | null
          organization_id: string
          predicted_filter_life_days?: number | null
          pressure_trend_slope?: number | null
          runtime_hours_total?: number
          runtime_since_filter?: number
          schedule_id?: string | null
          updated_at?: string
        }
        Update: {
          baseline_pressure_drop_pa?: number | null
          created_at?: string
          current_pressure_drop_pa?: number | null
          equipment_id?: string | null
          id?: string
          last_reset_at?: string | null
          organization_id?: string
          predicted_filter_life_days?: number | null
          pressure_trend_slope?: number | null
          runtime_hours_total?: number
          runtime_since_filter?: number
          schedule_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erv_runtime_tracking_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_runtime_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_runtime_tracking_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "erv_maintenance_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      erv_sizing_calculations: {
        Row: {
          annual_cost_savings_sar: number | null
          annual_energy_savings_kwh: number | null
          calculation_name: string
          city: string | null
          cooling_cop: number | null
          created_at: string
          created_by: string | null
          design_mode: string | null
          electricity_rate_sar: number | null
          erv_type: string | null
          heating_cop: number | null
          id: string
          indoor_rh_percent: number | null
          indoor_temp_f: number | null
          is_recovery_beneficial: boolean | null
          latent_efficiency_percent: number | null
          latent_recovery_btuh: number | null
          load_reduction_percent: number | null
          notes: string | null
          operating_hours_per_year: number | null
          organization_id: string
          outdoor_air_cfm: number | null
          outdoor_rh_percent: number | null
          outdoor_temp_f: number | null
          project_id: string | null
          sensible_efficiency_percent: number | null
          sensible_recovery_btuh: number | null
          status: string | null
          total_recovery_btuh: number | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          annual_cost_savings_sar?: number | null
          annual_energy_savings_kwh?: number | null
          calculation_name: string
          city?: string | null
          cooling_cop?: number | null
          created_at?: string
          created_by?: string | null
          design_mode?: string | null
          electricity_rate_sar?: number | null
          erv_type?: string | null
          heating_cop?: number | null
          id?: string
          indoor_rh_percent?: number | null
          indoor_temp_f?: number | null
          is_recovery_beneficial?: boolean | null
          latent_efficiency_percent?: number | null
          latent_recovery_btuh?: number | null
          load_reduction_percent?: number | null
          notes?: string | null
          operating_hours_per_year?: number | null
          organization_id: string
          outdoor_air_cfm?: number | null
          outdoor_rh_percent?: number | null
          outdoor_temp_f?: number | null
          project_id?: string | null
          sensible_efficiency_percent?: number | null
          sensible_recovery_btuh?: number | null
          status?: string | null
          total_recovery_btuh?: number | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          annual_cost_savings_sar?: number | null
          annual_energy_savings_kwh?: number | null
          calculation_name?: string
          city?: string | null
          cooling_cop?: number | null
          created_at?: string
          created_by?: string | null
          design_mode?: string | null
          electricity_rate_sar?: number | null
          erv_type?: string | null
          heating_cop?: number | null
          id?: string
          indoor_rh_percent?: number | null
          indoor_temp_f?: number | null
          is_recovery_beneficial?: boolean | null
          latent_efficiency_percent?: number | null
          latent_recovery_btuh?: number | null
          load_reduction_percent?: number | null
          notes?: string | null
          operating_hours_per_year?: number | null
          organization_id?: string
          outdoor_air_cfm?: number | null
          outdoor_rh_percent?: number | null
          outdoor_temp_f?: number | null
          project_id?: string | null
          sensible_efficiency_percent?: number | null
          sensible_recovery_btuh?: number | null
          status?: string | null
          total_recovery_btuh?: number | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erv_sizing_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_sizing_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erv_sizing_calculations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      expansion_tank_selections: {
        Row: {
          acceptance_volume_gallons: number | null
          created_at: string | null
          id: string
          organization_id: string
          pre_charge_psi: number | null
          project_id: string | null
          status: string | null
          system_type: string | null
          system_volume_gallons: number | null
          tank_size_gallons: number | null
          updated_at: string | null
        }
        Insert: {
          acceptance_volume_gallons?: number | null
          created_at?: string | null
          id?: string
          organization_id: string
          pre_charge_psi?: number | null
          project_id?: string | null
          status?: string | null
          system_type?: string | null
          system_volume_gallons?: number | null
          tank_size_gallons?: number | null
          updated_at?: string | null
        }
        Update: {
          acceptance_volume_gallons?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string
          pre_charge_psi?: number | null
          project_id?: string | null
          status?: string | null
          system_type?: string | null
          system_volume_gallons?: number | null
          tank_size_gallons?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expansion_tank_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expansion_tank_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_curves: {
        Row: {
          created_at: string
          curve_data: Json
          fan_type: string
          id: string
          is_active: boolean | null
          manufacturer: string
          max_cfm: number | null
          max_static_pressure: number | null
          min_cfm: number | null
          model: string
          motor_hp: number | null
          notes: string | null
          organization_id: string | null
          rpm: number | null
          updated_at: string
          wheel_diameter_in: number | null
        }
        Insert: {
          created_at?: string
          curve_data?: Json
          fan_type?: string
          id?: string
          is_active?: boolean | null
          manufacturer: string
          max_cfm?: number | null
          max_static_pressure?: number | null
          min_cfm?: number | null
          model: string
          motor_hp?: number | null
          notes?: string | null
          organization_id?: string | null
          rpm?: number | null
          updated_at?: string
          wheel_diameter_in?: number | null
        }
        Update: {
          created_at?: string
          curve_data?: Json
          fan_type?: string
          id?: string
          is_active?: boolean | null
          manufacturer?: string
          max_cfm?: number | null
          max_static_pressure?: number | null
          min_cfm?: number | null
          model?: string
          motor_hp?: number | null
          notes?: string | null
          organization_id?: string | null
          rpm?: number | null
          updated_at?: string
          wheel_diameter_in?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_curves_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_selections: {
        Row: {
          ahu_configuration_id: string | null
          application: string | null
          created_at: string | null
          created_by: string | null
          design_cfm: number
          design_static_pressure_in: number
          duct_system_id: string | null
          fan_curve_id: string | null
          fan_tag: string | null
          fan_type: string
          id: string
          manufacturer: string | null
          model_number: string | null
          motor_fla: number | null
          motor_hp: number | null
          motor_phase: string | null
          motor_rpm: number | null
          motor_voltage: string | null
          nc_rating: number | null
          operating_bhp: number | null
          operating_cfm: number | null
          operating_efficiency_percent: number | null
          operating_point_valid: boolean | null
          operating_static_pressure_in: number | null
          organization_id: string
          selected_equipment: Json | null
          selection_notes: string | null
          sound_power_db: number | null
          status: string | null
          updated_at: string | null
          vfd_required: boolean | null
          weight_lb: number | null
          wheel_diameter_in: number | null
        }
        Insert: {
          ahu_configuration_id?: string | null
          application?: string | null
          created_at?: string | null
          created_by?: string | null
          design_cfm: number
          design_static_pressure_in: number
          duct_system_id?: string | null
          fan_curve_id?: string | null
          fan_tag?: string | null
          fan_type: string
          id?: string
          manufacturer?: string | null
          model_number?: string | null
          motor_fla?: number | null
          motor_hp?: number | null
          motor_phase?: string | null
          motor_rpm?: number | null
          motor_voltage?: string | null
          nc_rating?: number | null
          operating_bhp?: number | null
          operating_cfm?: number | null
          operating_efficiency_percent?: number | null
          operating_point_valid?: boolean | null
          operating_static_pressure_in?: number | null
          organization_id: string
          selected_equipment?: Json | null
          selection_notes?: string | null
          sound_power_db?: number | null
          status?: string | null
          updated_at?: string | null
          vfd_required?: boolean | null
          weight_lb?: number | null
          wheel_diameter_in?: number | null
        }
        Update: {
          ahu_configuration_id?: string | null
          application?: string | null
          created_at?: string | null
          created_by?: string | null
          design_cfm?: number
          design_static_pressure_in?: number
          duct_system_id?: string | null
          fan_curve_id?: string | null
          fan_tag?: string | null
          fan_type?: string
          id?: string
          manufacturer?: string | null
          model_number?: string | null
          motor_fla?: number | null
          motor_hp?: number | null
          motor_phase?: string | null
          motor_rpm?: number | null
          motor_voltage?: string | null
          nc_rating?: number | null
          operating_bhp?: number | null
          operating_cfm?: number | null
          operating_efficiency_percent?: number | null
          operating_point_valid?: boolean | null
          operating_static_pressure_in?: number | null
          organization_id?: string
          selected_equipment?: Json | null
          selection_notes?: string | null
          sound_power_db?: number | null
          status?: string | null
          updated_at?: string | null
          vfd_required?: boolean | null
          weight_lb?: number | null
          wheel_diameter_in?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_selections_ahu_configuration_id_fkey"
            columns: ["ahu_configuration_id"]
            isOneToOne: false
            referencedRelation: "ahu_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_selections_duct_system_id_fkey"
            columns: ["duct_system_id"]
            isOneToOne: false
            referencedRelation: "duct_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_selections_fan_curve_id_fkey"
            columns: ["fan_curve_id"]
            isOneToOne: false
            referencedRelation: "fan_curves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_selections: {
        Row: {
          ahu_configuration_id: string | null
          annual_energy_cost_sar: number | null
          clean_pressure_drop_in: number | null
          created_at: string | null
          created_by: string | null
          design_cfm: number | null
          dirty_pressure_drop_in: number | null
          dust_holding_capacity_g: number | null
          efficiency_percent: number | null
          face_area_sqft: number | null
          face_velocity_fpm: number | null
          filter_position: string
          filter_type: string | null
          final_pressure_drop_in: number | null
          id: string
          manufacturer: string | null
          merv_rating: number | null
          model_number: string | null
          name: string
          nominal_size: string | null
          notes: string | null
          organization_id: string
          project_id: string | null
          quantity: number | null
          replacement_cost_sar: number | null
          replacement_interval_months: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ahu_configuration_id?: string | null
          annual_energy_cost_sar?: number | null
          clean_pressure_drop_in?: number | null
          created_at?: string | null
          created_by?: string | null
          design_cfm?: number | null
          dirty_pressure_drop_in?: number | null
          dust_holding_capacity_g?: number | null
          efficiency_percent?: number | null
          face_area_sqft?: number | null
          face_velocity_fpm?: number | null
          filter_position: string
          filter_type?: string | null
          final_pressure_drop_in?: number | null
          id?: string
          manufacturer?: string | null
          merv_rating?: number | null
          model_number?: string | null
          name: string
          nominal_size?: string | null
          notes?: string | null
          organization_id: string
          project_id?: string | null
          quantity?: number | null
          replacement_cost_sar?: number | null
          replacement_interval_months?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ahu_configuration_id?: string | null
          annual_energy_cost_sar?: number | null
          clean_pressure_drop_in?: number | null
          created_at?: string | null
          created_by?: string | null
          design_cfm?: number | null
          dirty_pressure_drop_in?: number | null
          dust_holding_capacity_g?: number | null
          efficiency_percent?: number | null
          face_area_sqft?: number | null
          face_velocity_fpm?: number | null
          filter_position?: string
          filter_type?: string | null
          final_pressure_drop_in?: number | null
          id?: string
          manufacturer?: string | null
          merv_rating?: number | null
          model_number?: string | null
          name?: string
          nominal_size?: string | null
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          quantity?: number | null
          replacement_cost_sar?: number | null
          replacement_interval_months?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_selections_ahu_configuration_id_fkey"
            columns: ["ahu_configuration_id"]
            isOneToOne: false
            referencedRelation: "ahu_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "filter_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          area_sqm: number | null
          building_id: string
          created_at: string
          floor_number: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          area_sqm?: number | null
          building_id: string
          created_at?: string
          floor_number: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number | null
          building_id?: string
          created_at?: string
          floor_number?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_water_plants: {
        Row: {
          boiler_config: Json | null
          boiler_count: number | null
          boiler_type: string
          created_at: string | null
          created_by: string | null
          diversity_factor: number | null
          expansion_tank_config: Json | null
          future_expansion_percent: number | null
          heating_load_btuh: number
          id: string
          notes: string | null
          organization_id: string
          piping_config: Json | null
          plant_name: string
          plant_tag: string | null
          primary_pump_config: Json | null
          project_id: string | null
          pumping_config: string | null
          redundancy_mode: string | null
          return_temp_f: number | null
          revision: string | null
          secondary_pump_config: Json | null
          status: string | null
          supply_temp_f: number | null
          system_volume_gal: number | null
          updated_at: string | null
        }
        Insert: {
          boiler_config?: Json | null
          boiler_count?: number | null
          boiler_type: string
          created_at?: string | null
          created_by?: string | null
          diversity_factor?: number | null
          expansion_tank_config?: Json | null
          future_expansion_percent?: number | null
          heating_load_btuh: number
          id?: string
          notes?: string | null
          organization_id: string
          piping_config?: Json | null
          plant_name: string
          plant_tag?: string | null
          primary_pump_config?: Json | null
          project_id?: string | null
          pumping_config?: string | null
          redundancy_mode?: string | null
          return_temp_f?: number | null
          revision?: string | null
          secondary_pump_config?: Json | null
          status?: string | null
          supply_temp_f?: number | null
          system_volume_gal?: number | null
          updated_at?: string | null
        }
        Update: {
          boiler_config?: Json | null
          boiler_count?: number | null
          boiler_type?: string
          created_at?: string | null
          created_by?: string | null
          diversity_factor?: number | null
          expansion_tank_config?: Json | null
          future_expansion_percent?: number | null
          heating_load_btuh?: number
          id?: string
          notes?: string | null
          organization_id?: string
          piping_config?: Json | null
          plant_name?: string
          plant_tag?: string | null
          primary_pump_config?: Json | null
          project_id?: string | null
          pumping_config?: string | null
          redundancy_mode?: string | null
          return_temp_f?: number | null
          revision?: string | null
          secondary_pump_config?: Json | null
          status?: string | null
          supply_temp_f?: number | null
          system_volume_gal?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hot_water_plants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hot_water_plants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      insulation_calculations: {
        Row: {
          air_temp_c: number | null
          air_velocity_mps: number | null
          ambient_temp_c: number
          calculation_type: string
          created_at: string
          created_by: string | null
          description: string | null
          dew_point_c: number | null
          duct_height_mm: number | null
          duct_width_mm: number | null
          fluid_temp_c: number | null
          id: string
          insulation_material: string | null
          insulation_thickness_mm: number | null
          location_id: string | null
          meets_condensation_requirement: boolean | null
          meets_sbc_code: boolean | null
          name: string
          organization_id: string
          pipe_length_m: number | null
          pipe_size_inches: number | null
          project_id: string | null
          relative_humidity: number
          results: Json
          service_type: string | null
          status: string | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          air_temp_c?: number | null
          air_velocity_mps?: number | null
          ambient_temp_c: number
          calculation_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dew_point_c?: number | null
          duct_height_mm?: number | null
          duct_width_mm?: number | null
          fluid_temp_c?: number | null
          id?: string
          insulation_material?: string | null
          insulation_thickness_mm?: number | null
          location_id?: string | null
          meets_condensation_requirement?: boolean | null
          meets_sbc_code?: boolean | null
          name: string
          organization_id: string
          pipe_length_m?: number | null
          pipe_size_inches?: number | null
          project_id?: string | null
          relative_humidity: number
          results?: Json
          service_type?: string | null
          status?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          air_temp_c?: number | null
          air_velocity_mps?: number | null
          ambient_temp_c?: number
          calculation_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dew_point_c?: number | null
          duct_height_mm?: number | null
          duct_width_mm?: number | null
          fluid_temp_c?: number | null
          id?: string
          insulation_material?: string | null
          insulation_thickness_mm?: number | null
          location_id?: string | null
          meets_condensation_requirement?: boolean | null
          meets_sbc_code?: boolean | null
          name?: string
          organization_id?: string
          pipe_length_m?: number | null
          pipe_size_inches?: number | null
          project_id?: string | null
          relative_humidity?: number
          results?: Json
          service_type?: string | null
          status?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insulation_calculations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "insulation_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insulation_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insulation_calculations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          discount_percent: number | null
          equipment_id: string | null
          id: string
          invoice_id: string
          line_total: number
          pm_schedule_id: string | null
          quantity: number
          sort_order: number | null
          unit_price: number
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          description: string
          discount_percent?: number | null
          equipment_id?: string | null
          id?: string
          invoice_id: string
          line_total: number
          pm_schedule_id?: string | null
          quantity?: number
          sort_order?: number | null
          unit_price: number
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number | null
          equipment_id?: string | null
          id?: string
          invoice_id?: string
          line_total?: number
          pm_schedule_id?: string | null
          quantity?: number
          sort_order?: number | null
          unit_price?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_pm_schedule_id_fkey"
            columns: ["pm_schedule_id"]
            isOneToOne: false
            referencedRelation: "pm_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_percent: number | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          organization_id: string
          payment_method: string | null
          status: string
          subtotal: number
          terms: string | null
          total_amount: number
          updated_at: string
          vat_amount: number
          vat_rate: number | null
          work_order_id: string | null
          zatca_clearance_status: string | null
          zatca_invoice_hash: string | null
          zatca_qr_code: string | null
          zatca_reported_at: string | null
          zatca_submission_status: string | null
          zatca_uuid: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
          work_order_id?: string | null
          zatca_clearance_status?: string | null
          zatca_invoice_hash?: string | null
          zatca_qr_code?: string | null
          zatca_reported_at?: string | null
          zatca_submission_status?: string | null
          zatca_uuid?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          status?: string
          subtotal?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
          work_order_id?: string | null
          zatca_clearance_status?: string | null
          zatca_invoice_hash?: string | null
          zatca_qr_code?: string | null
          zatca_reported_at?: string | null
          zatca_submission_status?: string | null
          zatca_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_devices: {
        Row: {
          connection_config: Json | null
          created_at: string
          device_id: string
          device_type: string
          equipment_id: string | null
          id: string
          is_active: boolean
          last_reading_at: string | null
          last_reading_value: number | null
          max_threshold: number | null
          min_threshold: number | null
          name: string
          organization_id: string
          protocol: string
          setpoint: number | null
          status: string
          unit: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          connection_config?: Json | null
          created_at?: string
          device_id: string
          device_type?: string
          equipment_id?: string | null
          id?: string
          is_active?: boolean
          last_reading_at?: string | null
          last_reading_value?: number | null
          max_threshold?: number | null
          min_threshold?: number | null
          name: string
          organization_id: string
          protocol?: string
          setpoint?: number | null
          status?: string
          unit?: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          connection_config?: Json | null
          created_at?: string
          device_id?: string
          device_type?: string
          equipment_id?: string | null
          id?: string
          is_active?: boolean
          last_reading_at?: string | null
          last_reading_value?: number | null
          max_threshold?: number | null
          min_threshold?: number | null
          name?: string
          organization_id?: string
          protocol?: string
          setpoint?: number | null
          status?: string
          unit?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_devices_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_devices_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      load_calculations: {
        Row: {
          area_sqft: number
          building_id: string | null
          building_type: string | null
          calculation_name: string
          calculation_type: string | null
          ceiling_height_ft: number
          cfm_required: number | null
          cooling_load_btuh: number | null
          cooling_load_tons: number | null
          created_at: string
          created_by: string | null
          equipment_power_density: number | null
          heating_load_btuh: number | null
          id: string
          indoor_humidity_target: number | null
          indoor_temp_summer_f: number | null
          indoor_temp_winter_f: number | null
          lighting_power_density: number | null
          load_breakdown: Json | null
          notes: string | null
          occupant_count: number | null
          organization_id: string
          outdoor_humidity_summer: number | null
          outdoor_temp_summer_f: number | null
          outdoor_temp_winter_f: number | null
          project_id: string | null
          roof_r_value: number | null
          status: string | null
          updated_at: string
          wall_r_value: number | null
          window_shgc: number | null
          window_to_wall_ratio: number | null
          window_u_factor: number | null
          zone_id: string | null
        }
        Insert: {
          area_sqft: number
          building_id?: string | null
          building_type?: string | null
          calculation_name: string
          calculation_type?: string | null
          ceiling_height_ft: number
          cfm_required?: number | null
          cooling_load_btuh?: number | null
          cooling_load_tons?: number | null
          created_at?: string
          created_by?: string | null
          equipment_power_density?: number | null
          heating_load_btuh?: number | null
          id?: string
          indoor_humidity_target?: number | null
          indoor_temp_summer_f?: number | null
          indoor_temp_winter_f?: number | null
          lighting_power_density?: number | null
          load_breakdown?: Json | null
          notes?: string | null
          occupant_count?: number | null
          organization_id: string
          outdoor_humidity_summer?: number | null
          outdoor_temp_summer_f?: number | null
          outdoor_temp_winter_f?: number | null
          project_id?: string | null
          roof_r_value?: number | null
          status?: string | null
          updated_at?: string
          wall_r_value?: number | null
          window_shgc?: number | null
          window_to_wall_ratio?: number | null
          window_u_factor?: number | null
          zone_id?: string | null
        }
        Update: {
          area_sqft?: number
          building_id?: string | null
          building_type?: string | null
          calculation_name?: string
          calculation_type?: string | null
          ceiling_height_ft?: number
          cfm_required?: number | null
          cooling_load_btuh?: number | null
          cooling_load_tons?: number | null
          created_at?: string
          created_by?: string | null
          equipment_power_density?: number | null
          heating_load_btuh?: number | null
          id?: string
          indoor_humidity_target?: number | null
          indoor_temp_summer_f?: number | null
          indoor_temp_winter_f?: number | null
          lighting_power_density?: number | null
          load_breakdown?: Json | null
          notes?: string | null
          occupant_count?: number | null
          organization_id?: string
          outdoor_humidity_summer?: number | null
          outdoor_temp_summer_f?: number | null
          outdoor_temp_winter_f?: number | null
          project_id?: string | null
          roof_r_value?: number | null
          status?: string | null
          updated_at?: string
          wall_r_value?: number | null
          window_shgc?: number | null
          window_to_wall_ratio?: number | null
          window_u_factor?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "load_calculations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_calculations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acoustic_zone_id: string | null
          alert_type: string
          created_at: string
          device_id: string | null
          equipment_id: string | null
          id: string
          is_active: boolean
          measured_nc: number | null
          message: string | null
          organization_id: string
          resolved_at: string | null
          severity: string
          target_nc: number | null
          threshold: number | null
          title: string
          triggered_at: string
          value: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acoustic_zone_id?: string | null
          alert_type?: string
          created_at?: string
          device_id?: string | null
          equipment_id?: string | null
          id?: string
          is_active?: boolean
          measured_nc?: number | null
          message?: string | null
          organization_id: string
          resolved_at?: string | null
          severity?: string
          target_nc?: number | null
          threshold?: number | null
          title: string
          triggered_at?: string
          value?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acoustic_zone_id?: string | null
          alert_type?: string
          created_at?: string
          device_id?: string | null
          equipment_id?: string | null
          id?: string
          is_active?: boolean
          measured_nc?: number | null
          message?: string | null
          organization_id?: string
          resolved_at?: string | null
          severity?: string
          target_nc?: number | null
          threshold?: number | null
          title?: string
          triggered_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_acoustic_zone_id_fkey"
            columns: ["acoustic_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "iot_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          invoice_id: string
          paid_at: string | null
          payment_reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          invoice_id: string
          paid_at?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          invoice_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          authorization_code: string | null
          bank_account_number: string | null
          bank_name: string | null
          card_last_four: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          customer_id: string | null
          id: string
          invoice_id: string
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string
          payment_number: string
          receipt_url: string | null
          refund_amount: number | null
          refund_date: string | null
          refund_reason: string | null
          sadad_bill_number: string | null
          sadad_payment_number: string | null
          status: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          card_last_four?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string
          payment_number: string
          receipt_url?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_reason?: string | null
          sadad_bill_number?: string | null
          sadad_payment_number?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          card_last_four?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string
          payment_number?: string
          receipt_url?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_reason?: string | null
          sadad_bill_number?: string | null
          sadad_payment_number?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pipe_fittings_library: {
        Row: {
          created_at: string | null
          description: string | null
          equivalent_length_factor: number | null
          fitting_category: string
          fitting_code: string
          fitting_name: string
          id: string
          is_active: boolean | null
          k_factor: number
          nominal_size_range: string | null
          notes: string | null
          pipe_material: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          equivalent_length_factor?: number | null
          fitting_category: string
          fitting_code: string
          fitting_name: string
          id?: string
          is_active?: boolean | null
          k_factor: number
          nominal_size_range?: string | null
          notes?: string | null
          pipe_material?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          equivalent_length_factor?: number | null
          fitting_category?: string
          fitting_code?: string
          fitting_name?: string
          id?: string
          is_active?: boolean | null
          k_factor?: number
          nominal_size_range?: string | null
          notes?: string | null
          pipe_material?: string | null
        }
        Relationships: []
      }
      pipe_segment_fittings: {
        Row: {
          created_at: string | null
          fitting_code: string
          fitting_description: string | null
          head_loss_ft: number | null
          id: string
          k_factor: number
          pipe_segment_id: string
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          fitting_code: string
          fitting_description?: string | null
          head_loss_ft?: number | null
          id?: string
          k_factor: number
          pipe_segment_id: string
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          fitting_code?: string
          fitting_description?: string | null
          head_loss_ft?: number | null
          id?: string
          k_factor?: number
          pipe_segment_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipe_segment_fittings_pipe_segment_id_fkey"
            columns: ["pipe_segment_id"]
            isOneToOne: false
            referencedRelation: "pipe_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      pipe_segments: {
        Row: {
          created_at: string | null
          dynamic_loss_ft: number | null
          elevation_change_ft: number | null
          fittings_equivalent_length_ft: number | null
          flow_gpm: number
          fluid_temp_f: number | null
          fluid_type: string | null
          friction_loss_per_100ft: number | null
          from_node: string | null
          id: string
          inside_diameter_in: number | null
          is_critical_path: boolean | null
          length_ft: number | null
          material_type: string | null
          nominal_size_in: number | null
          parent_segment_id: string | null
          pipe_system_id: string
          reynolds_number: number | null
          schedule_class: string | null
          segment_name: string
          segment_type: string | null
          sort_order: number | null
          to_node: string | null
          total_pressure_drop_ft: number | null
          updated_at: string | null
          velocity_fps: number | null
          wall_thickness_in: number | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          dynamic_loss_ft?: number | null
          elevation_change_ft?: number | null
          fittings_equivalent_length_ft?: number | null
          flow_gpm: number
          fluid_temp_f?: number | null
          fluid_type?: string | null
          friction_loss_per_100ft?: number | null
          from_node?: string | null
          id?: string
          inside_diameter_in?: number | null
          is_critical_path?: boolean | null
          length_ft?: number | null
          material_type?: string | null
          nominal_size_in?: number | null
          parent_segment_id?: string | null
          pipe_system_id: string
          reynolds_number?: number | null
          schedule_class?: string | null
          segment_name: string
          segment_type?: string | null
          sort_order?: number | null
          to_node?: string | null
          total_pressure_drop_ft?: number | null
          updated_at?: string | null
          velocity_fps?: number | null
          wall_thickness_in?: number | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          dynamic_loss_ft?: number | null
          elevation_change_ft?: number | null
          fittings_equivalent_length_ft?: number | null
          flow_gpm?: number
          fluid_temp_f?: number | null
          fluid_type?: string | null
          friction_loss_per_100ft?: number | null
          from_node?: string | null
          id?: string
          inside_diameter_in?: number | null
          is_critical_path?: boolean | null
          length_ft?: number | null
          material_type?: string | null
          nominal_size_in?: number | null
          parent_segment_id?: string | null
          pipe_system_id?: string
          reynolds_number?: number | null
          schedule_class?: string | null
          segment_name?: string
          segment_type?: string | null
          sort_order?: number | null
          to_node?: string | null
          total_pressure_drop_ft?: number | null
          updated_at?: string | null
          velocity_fps?: number | null
          wall_thickness_in?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipe_segments_parent_segment_id_fkey"
            columns: ["parent_segment_id"]
            isOneToOne: false
            referencedRelation: "pipe_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipe_segments_pipe_system_id_fkey"
            columns: ["pipe_system_id"]
            isOneToOne: false
            referencedRelation: "pipe_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipe_segments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      pipe_system_zones: {
        Row: {
          created_at: string | null
          flow_gpm: number | null
          id: string
          notes: string | null
          pipe_system_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          flow_gpm?: number | null
          id?: string
          notes?: string | null
          pipe_system_id: string
          zone_id: string
        }
        Update: {
          created_at?: string | null
          flow_gpm?: number | null
          id?: string
          notes?: string | null
          pipe_system_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipe_system_zones_pipe_system_id_fkey"
            columns: ["pipe_system_id"]
            isOneToOne: false
            referencedRelation: "pipe_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipe_system_zones_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      pipe_systems: {
        Row: {
          created_at: string | null
          created_by: string | null
          critical_path_head_ft: number | null
          design_delta_t_f: number | null
          design_method: string | null
          fluid_temp_f: number | null
          fluid_type: string | null
          glycol_percentage: number | null
          id: string
          load_calculation_id: string | null
          max_friction_ft_per_100ft: number | null
          max_velocity_fps: number | null
          notes: string | null
          organization_id: string
          pipe_material: string | null
          project_id: string | null
          pump_power_hp: number | null
          sizing_method: string | null
          status: string | null
          system_head_ft: number | null
          system_name: string
          system_type: string | null
          target_velocity_fps: number | null
          total_flow_gpm: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          critical_path_head_ft?: number | null
          design_delta_t_f?: number | null
          design_method?: string | null
          fluid_temp_f?: number | null
          fluid_type?: string | null
          glycol_percentage?: number | null
          id?: string
          load_calculation_id?: string | null
          max_friction_ft_per_100ft?: number | null
          max_velocity_fps?: number | null
          notes?: string | null
          organization_id: string
          pipe_material?: string | null
          project_id?: string | null
          pump_power_hp?: number | null
          sizing_method?: string | null
          status?: string | null
          system_head_ft?: number | null
          system_name: string
          system_type?: string | null
          target_velocity_fps?: number | null
          total_flow_gpm?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          critical_path_head_ft?: number | null
          design_delta_t_f?: number | null
          design_method?: string | null
          fluid_temp_f?: number | null
          fluid_type?: string | null
          glycol_percentage?: number | null
          id?: string
          load_calculation_id?: string | null
          max_friction_ft_per_100ft?: number | null
          max_velocity_fps?: number | null
          notes?: string | null
          organization_id?: string
          pipe_material?: string | null
          project_id?: string | null
          pump_power_hp?: number | null
          sizing_method?: string | null
          status?: string | null
          system_head_ft?: number | null
          system_name?: string
          system_type?: string | null
          target_velocity_fps?: number | null
          total_flow_gpm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipe_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipe_systems_load_calculation_id_fkey"
            columns: ["load_calculation_id"]
            isOneToOne: false
            referencedRelation: "load_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipe_systems_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipe_systems_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_schedules: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          equipment_id: string | null
          estimated_hours: number | null
          frequency_type: string
          frequency_value: number
          id: string
          is_active: boolean
          last_completed_at: string | null
          name: string
          next_due_at: string | null
          organization_id: string
          priority: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment_id?: string | null
          estimated_hours?: number | null
          frequency_type?: string
          frequency_value?: number
          id?: string
          is_active?: boolean
          last_completed_at?: string | null
          name: string
          next_due_at?: string | null
          organization_id: string
          priority?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment_id?: string | null
          estimated_hours?: number | null
          frequency_type?: string
          frequency_value?: number
          id?: string
          is_active?: boolean
          last_completed_at?: string | null
          name?: string
          next_due_at?: string | null
          organization_id?: string
          priority?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_schedules_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_drop_calculations: {
        Row: {
          calculation_type: string
          components: Json
          created_at: string
          created_by: string | null
          description: string | null
          flow_rate: number
          id: string
          name: string
          organization_id: string
          project_id: string | null
          size_inches: number
          status: string | null
          total_pressure_drop: number
          unit: string
          updated_at: string
          velocity: number | null
          velocity_pressure: number | null
          zone_id: string | null
        }
        Insert: {
          calculation_type: string
          components?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_rate: number
          id?: string
          name: string
          organization_id: string
          project_id?: string | null
          size_inches: number
          status?: string | null
          total_pressure_drop: number
          unit?: string
          updated_at?: string
          velocity?: number | null
          velocity_pressure?: number | null
          zone_id?: string | null
        }
        Update: {
          calculation_type?: string
          components?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_rate?: number
          id?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          size_inches?: number
          status?: string | null
          total_pressure_drop?: number
          unit?: string
          updated_at?: string
          velocity?: number | null
          velocity_pressure?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pressure_drop_calculations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pressure_drop_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pressure_drop_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pressure_drop_calculations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_customers: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_customers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_design_data: {
        Row: {
          building_id: string | null
          created_at: string
          created_by: string | null
          data_type: string
          id: string
          input_data: Json | null
          name: string
          notes: string | null
          organization_id: string
          output_data: Json | null
          project_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          data_type: string
          id?: string
          input_data?: Json | null
          name: string
          notes?: string | null
          organization_id: string
          output_data?: Json | null
          project_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          data_type?: string
          id?: string
          input_data?: Json | null
          name?: string
          notes?: string | null
          organization_id?: string
          output_data?: Json | null
          project_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_design_data_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_design_data_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_design_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_design_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stage_locks: {
        Row: {
          created_at: string
          id: string
          locked_at: string
          locked_by: string | null
          project_id: string
          reason: string | null
          sign_off_notes: string | null
          signed_off_at: string | null
          signed_off_by: string | null
          stage_id: string
          unlock_requested_at: string | null
          unlock_requested_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          project_id: string
          reason?: string | null
          sign_off_notes?: string | null
          signed_off_at?: string | null
          signed_off_by?: string | null
          stage_id: string
          unlock_requested_at?: string | null
          unlock_requested_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          locked_at?: string
          locked_by?: string | null
          project_id?: string
          reason?: string | null
          sign_off_notes?: string | null
          signed_off_at?: string | null
          signed_off_by?: string | null
          stage_id?: string
          unlock_requested_at?: string | null
          unlock_requested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stage_locks_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_stage_locks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_locks_unlock_requested_by_fkey"
            columns: ["unlock_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_stage_milestones: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          created_at: string | null
          estimated_duration_days: number | null
          id: string
          notes: string | null
          organization_id: string
          planned_end_date: string | null
          planned_start_date: string | null
          project_id: string
          stage_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string | null
          estimated_duration_days?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          project_id: string
          stage_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string | null
          estimated_duration_days?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          project_id?: string
          stage_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_stage_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stage_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          building_type: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          organization_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          building_type?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          organization_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          building_type?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      psychrometric_analyses: {
        Row: {
          air_states: Json
          airflow_cfm: number | null
          altitude_ft: number | null
          atmospheric_pressure_psia: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          hvac_preset: string | null
          id: string
          name: string
          organization_id: string
          processes: Json | null
          project_id: string | null
          status: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          air_states?: Json
          airflow_cfm?: number | null
          altitude_ft?: number | null
          atmospheric_pressure_psia?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hvac_preset?: string | null
          id?: string
          name: string
          organization_id: string
          processes?: Json | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          air_states?: Json
          airflow_cfm?: number | null
          altitude_ft?: number | null
          atmospheric_pressure_psia?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hvac_preset?: string | null
          id?: string
          name?: string
          organization_id?: string
          processes?: Json | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psychrometric_analyses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychrometric_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychrometric_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychrometric_analyses_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      psychrometric_presets: {
        Row: {
          air_states: Json
          altitude_ft: number | null
          category: string
          climate_zone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon_name: string
          id: string
          is_public: boolean
          name: string
          organization_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          air_states?: Json
          altitude_ft?: number | null
          category?: string
          climate_zone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          is_public?: boolean
          name: string
          organization_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          air_states?: Json
          altitude_ft?: number | null
          category?: string
          climate_zone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_name?: string
          id?: string
          is_public?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "psychrometric_presets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychrometric_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pump_curves: {
        Row: {
          created_at: string | null
          created_by: string | null
          curve_data: Json
          id: string
          impeller_diameter_in: number | null
          is_active: boolean | null
          manufacturer: string
          max_flow_gpm: number | null
          max_head_ft: number | null
          min_flow_gpm: number | null
          model: string
          motor_hp: number | null
          notes: string | null
          npsh_required: Json | null
          organization_id: string
          pump_type: string | null
          rpm: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          curve_data?: Json
          id?: string
          impeller_diameter_in?: number | null
          is_active?: boolean | null
          manufacturer: string
          max_flow_gpm?: number | null
          max_head_ft?: number | null
          min_flow_gpm?: number | null
          model: string
          motor_hp?: number | null
          notes?: string | null
          npsh_required?: Json | null
          organization_id: string
          pump_type?: string | null
          rpm?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          curve_data?: Json
          id?: string
          impeller_diameter_in?: number | null
          is_active?: boolean | null
          manufacturer?: string
          max_flow_gpm?: number | null
          max_head_ft?: number | null
          min_flow_gpm?: number | null
          model?: string
          motor_hp?: number | null
          notes?: string | null
          npsh_required?: Json | null
          organization_id?: string
          pump_type?: string | null
          rpm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pump_curves_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pump_curves_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pump_selections: {
        Row: {
          application: string | null
          created_at: string | null
          created_by: string | null
          design_flow_gpm: number
          design_head_ft: number
          discharge_size_in: number | null
          id: string
          impeller_diameter_in: number | null
          manufacturer: string | null
          model_number: string | null
          motor_fla: number | null
          motor_hp: number | null
          motor_phase: string | null
          motor_rpm: number | null
          motor_voltage: string | null
          npsh_available_ft: number | null
          npsh_margin_adequate: boolean | null
          npsh_required_ft: number | null
          operating_bhp: number | null
          operating_efficiency_percent: number | null
          operating_flow_gpm: number | null
          operating_head_ft: number | null
          operating_point_valid: boolean | null
          organization_id: string
          pipe_system_id: string | null
          pump_arrangement: string | null
          pump_curve_id: string | null
          pump_tag: string | null
          pump_type: string
          selected_equipment: Json | null
          selection_notes: string | null
          status: string | null
          suction_size_in: number | null
          updated_at: string | null
          vfd_required: boolean | null
          weight_lb: number | null
        }
        Insert: {
          application?: string | null
          created_at?: string | null
          created_by?: string | null
          design_flow_gpm: number
          design_head_ft: number
          discharge_size_in?: number | null
          id?: string
          impeller_diameter_in?: number | null
          manufacturer?: string | null
          model_number?: string | null
          motor_fla?: number | null
          motor_hp?: number | null
          motor_phase?: string | null
          motor_rpm?: number | null
          motor_voltage?: string | null
          npsh_available_ft?: number | null
          npsh_margin_adequate?: boolean | null
          npsh_required_ft?: number | null
          operating_bhp?: number | null
          operating_efficiency_percent?: number | null
          operating_flow_gpm?: number | null
          operating_head_ft?: number | null
          operating_point_valid?: boolean | null
          organization_id: string
          pipe_system_id?: string | null
          pump_arrangement?: string | null
          pump_curve_id?: string | null
          pump_tag?: string | null
          pump_type: string
          selected_equipment?: Json | null
          selection_notes?: string | null
          status?: string | null
          suction_size_in?: number | null
          updated_at?: string | null
          vfd_required?: boolean | null
          weight_lb?: number | null
        }
        Update: {
          application?: string | null
          created_at?: string | null
          created_by?: string | null
          design_flow_gpm?: number
          design_head_ft?: number
          discharge_size_in?: number | null
          id?: string
          impeller_diameter_in?: number | null
          manufacturer?: string | null
          model_number?: string | null
          motor_fla?: number | null
          motor_hp?: number | null
          motor_phase?: string | null
          motor_rpm?: number | null
          motor_voltage?: string | null
          npsh_available_ft?: number | null
          npsh_margin_adequate?: boolean | null
          npsh_required_ft?: number | null
          operating_bhp?: number | null
          operating_efficiency_percent?: number | null
          operating_flow_gpm?: number | null
          operating_head_ft?: number | null
          operating_point_valid?: boolean | null
          organization_id?: string
          pipe_system_id?: string | null
          pump_arrangement?: string | null
          pump_curve_id?: string | null
          pump_tag?: string | null
          pump_type?: string
          selected_equipment?: Json | null
          selection_notes?: string | null
          status?: string | null
          suction_size_in?: number | null
          updated_at?: string | null
          vfd_required?: boolean | null
          weight_lb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pump_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pump_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pump_selections_pipe_system_id_fkey"
            columns: ["pipe_system_id"]
            isOneToOne: false
            referencedRelation: "pipe_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pump_selections_pump_curve_id_fkey"
            columns: ["pump_curve_id"]
            isOneToOne: false
            referencedRelation: "pump_curves"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          line_total: number
          quantity: number
          recurring_invoice_id: string
          sort_order: number | null
          unit_price: number
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          line_total: number
          quantity?: number
          recurring_invoice_id: string
          sort_order?: number | null
          unit_price: number
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          line_total?: number
          quantity?: number
          recurring_invoice_id?: string
          sort_order?: number | null
          unit_price?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoice_line_items_recurring_invoice_id_fkey"
            columns: ["recurring_invoice_id"]
            isOneToOne: false
            referencedRelation: "recurring_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          end_date: string | null
          frequency_type: string
          frequency_value: number
          id: string
          invoices_generated: number | null
          is_active: boolean | null
          last_generated_at: string | null
          next_invoice_date: string | null
          organization_id: string
          service_contract_id: string | null
          start_date: string
          subtotal: number
          template_name: string
          total_amount: number
          updated_at: string
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          end_date?: string | null
          frequency_type?: string
          frequency_value?: number
          id?: string
          invoices_generated?: number | null
          is_active?: boolean | null
          last_generated_at?: string | null
          next_invoice_date?: string | null
          organization_id: string
          service_contract_id?: string | null
          start_date: string
          subtotal?: number
          template_name: string
          total_amount?: number
          updated_at?: string
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          end_date?: string | null
          frequency_type?: string
          frequency_value?: number
          id?: string
          invoices_generated?: number | null
          is_active?: boolean | null
          last_generated_at?: string | null
          next_invoice_date?: string | null
          organization_id?: string
          service_contract_id?: string | null
          start_date?: string
          subtotal?: number
          template_name?: string
          total_amount?: number
          updated_at?: string
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_service_contract_id_fkey"
            columns: ["service_contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sbc_compliance_checks: {
        Row: {
          check_name: string
          climate_zone_id: string | null
          compliance_score_percent: number | null
          created_at: string | null
          created_by: string | null
          equipment_data: Json | null
          failed_count: number | null
          id: string
          notes: string | null
          organization_id: string
          passed_count: number | null
          pending_count: number | null
          project_id: string | null
          requirement_results: Json | null
          status: string | null
          total_requirements: number | null
          updated_at: string | null
        }
        Insert: {
          check_name: string
          climate_zone_id?: string | null
          compliance_score_percent?: number | null
          created_at?: string | null
          created_by?: string | null
          equipment_data?: Json | null
          failed_count?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          passed_count?: number | null
          pending_count?: number | null
          project_id?: string | null
          requirement_results?: Json | null
          status?: string | null
          total_requirements?: number | null
          updated_at?: string | null
        }
        Update: {
          check_name?: string
          climate_zone_id?: string | null
          compliance_score_percent?: number | null
          created_at?: string | null
          created_by?: string | null
          equipment_data?: Json | null
          failed_count?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          passed_count?: number | null
          pending_count?: number | null
          project_id?: string | null
          requirement_results?: Json | null
          status?: string | null
          total_requirements?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sbc_compliance_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sbc_compliance_checks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          device_id: string
          id: string
          quality: string
          received_at: string
          recorded_at: string
          value: number
        }
        Insert: {
          device_id: string
          id?: string
          quality?: string
          received_at?: string
          recorded_at?: string
          value: number
        }
        Update: {
          device_id?: string
          id?: string
          quality?: string
          received_at?: string
          recorded_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "iot_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_of_operations: {
        Row: {
          control_strategy: Json | null
          created_at: string
          created_by: string | null
          custom_sections: Json | null
          equipment_ids: string[] | null
          generated_sequence: Json | null
          id: string
          name: string
          operating_mode: string | null
          organization_id: string
          project_id: string | null
          status: string | null
          system_type: string
          updated_at: string
          version: number | null
          zone_ids: string[] | null
        }
        Insert: {
          control_strategy?: Json | null
          created_at?: string
          created_by?: string | null
          custom_sections?: Json | null
          equipment_ids?: string[] | null
          generated_sequence?: Json | null
          id?: string
          name: string
          operating_mode?: string | null
          organization_id: string
          project_id?: string | null
          status?: string | null
          system_type: string
          updated_at?: string
          version?: number | null
          zone_ids?: string[] | null
        }
        Update: {
          control_strategy?: Json | null
          created_at?: string
          created_by?: string | null
          custom_sections?: Json | null
          equipment_ids?: string[] | null
          generated_sequence?: Json | null
          id?: string
          name?: string
          operating_mode?: string | null
          organization_id?: string
          project_id?: string | null
          status?: string | null
          system_type?: string
          updated_at?: string
          version?: number | null
          zone_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_of_operations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_of_operations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_of_operations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      service_contracts: {
        Row: {
          after_hours_support: boolean | null
          auto_renew: boolean | null
          billing_frequency: string | null
          contract_name: string
          contract_number: string
          contract_type: string
          contract_value_sar: number
          coverage_description: string | null
          coverage_type: string
          created_at: string
          created_by: string | null
          customer_id: string
          end_date: string
          excluded_equipment: string[] | null
          id: string
          included_equipment: string[] | null
          next_pm_visit: string | null
          notes: string | null
          organization_id: string
          payment_terms: string | null
          pm_visits_completed: number | null
          pm_visits_per_year: number | null
          project_id: string | null
          renewal_date: string | null
          resolution_time_hours: number | null
          response_time_hours: number | null
          sla_priority: string | null
          special_terms: string | null
          start_date: string
          status: string
          updated_at: string
          weekend_support: boolean | null
        }
        Insert: {
          after_hours_support?: boolean | null
          auto_renew?: boolean | null
          billing_frequency?: string | null
          contract_name: string
          contract_number: string
          contract_type?: string
          contract_value_sar?: number
          coverage_description?: string | null
          coverage_type?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          end_date: string
          excluded_equipment?: string[] | null
          id?: string
          included_equipment?: string[] | null
          next_pm_visit?: string | null
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          pm_visits_completed?: number | null
          pm_visits_per_year?: number | null
          project_id?: string | null
          renewal_date?: string | null
          resolution_time_hours?: number | null
          response_time_hours?: number | null
          sla_priority?: string | null
          special_terms?: string | null
          start_date: string
          status?: string
          updated_at?: string
          weekend_support?: boolean | null
        }
        Update: {
          after_hours_support?: boolean | null
          auto_renew?: boolean | null
          billing_frequency?: string | null
          contract_name?: string
          contract_number?: string
          contract_type?: string
          contract_value_sar?: number
          coverage_description?: string | null
          coverage_type?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          end_date?: string
          excluded_equipment?: string[] | null
          id?: string
          included_equipment?: string[] | null
          next_pm_visit?: string | null
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          pm_visits_completed?: number | null
          pm_visits_per_year?: number | null
          project_id?: string | null
          renewal_date?: string | null
          resolution_time_hours?: number | null
          response_time_hours?: number | null
          sla_priority?: string | null
          special_terms?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          weekend_support?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "service_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      silencer_selections: {
        Row: {
          attenuation_required_db: number | null
          created_at: string | null
          duct_size: string | null
          id: string
          manufacturer: string | null
          organization_id: string
          pressure_drop_in_wg: number | null
          project_id: string | null
          silencer_model: string | null
          status: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          attenuation_required_db?: number | null
          created_at?: string | null
          duct_size?: string | null
          id?: string
          manufacturer?: string | null
          organization_id: string
          pressure_drop_in_wg?: number | null
          project_id?: string | null
          silencer_model?: string | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          attenuation_required_db?: number | null
          created_at?: string | null
          duct_size?: string | null
          id?: string
          manufacturer?: string | null
          organization_id?: string
          pressure_drop_in_wg?: number | null
          project_id?: string | null
          silencer_model?: string | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "silencer_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "silencer_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "silencer_selections_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      smoke_control_calculations: {
        Row: {
          ambient_temp_f: number | null
          building_id: string | null
          calculation_name: string
          calculation_type: string
          created_at: string | null
          created_by: string | null
          door_height_ft: number | null
          door_width_ft: number | null
          exhaust_result: Json | null
          fire_size_btu_s: number | null
          id: string
          makeup_air_temp_f: number | null
          notes: string | null
          number_of_doors: number | null
          organization_id: string
          perimeter_ft: number | null
          pressurization_result: Json | null
          project_id: string | null
          reference_standard: string | null
          simultaneous_doors_open: number | null
          smoke_layer_height_ft: number | null
          space_area_sqft: number | null
          space_height_ft: number | null
          status: string | null
          target_pressure_in_wc: number | null
          updated_at: string | null
        }
        Insert: {
          ambient_temp_f?: number | null
          building_id?: string | null
          calculation_name: string
          calculation_type: string
          created_at?: string | null
          created_by?: string | null
          door_height_ft?: number | null
          door_width_ft?: number | null
          exhaust_result?: Json | null
          fire_size_btu_s?: number | null
          id?: string
          makeup_air_temp_f?: number | null
          notes?: string | null
          number_of_doors?: number | null
          organization_id: string
          perimeter_ft?: number | null
          pressurization_result?: Json | null
          project_id?: string | null
          reference_standard?: string | null
          simultaneous_doors_open?: number | null
          smoke_layer_height_ft?: number | null
          space_area_sqft?: number | null
          space_height_ft?: number | null
          status?: string | null
          target_pressure_in_wc?: number | null
          updated_at?: string | null
        }
        Update: {
          ambient_temp_f?: number | null
          building_id?: string | null
          calculation_name?: string
          calculation_type?: string
          created_at?: string | null
          created_by?: string | null
          door_height_ft?: number | null
          door_width_ft?: number | null
          exhaust_result?: Json | null
          fire_size_btu_s?: number | null
          id?: string
          makeup_air_temp_f?: number | null
          notes?: string | null
          number_of_doors?: number | null
          organization_id?: string
          perimeter_ft?: number | null
          pressurization_result?: Json | null
          project_id?: string | null
          reference_standard?: string | null
          simultaneous_doors_open?: number | null
          smoke_layer_height_ft?: number | null
          space_area_sqft?: number | null
          space_height_ft?: number | null
          status?: string | null
          target_pressure_in_wc?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smoke_control_calculations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smoke_control_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smoke_control_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      soo_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          organization_id: string | null
          system_type: string
          template_content: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          organization_id?: string | null
          system_type: string
          template_content?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          organization_id?: string | null
          system_type?: string
          template_content?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soo_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_schedules: {
        Row: {
          availability_type: string | null
          break_duration_minutes: number | null
          clock_in_location_lat: number | null
          clock_in_location_lng: number | null
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string
          end_time: string
          id: string
          is_available: boolean | null
          notes: string | null
          organization_id: string
          schedule_date: string
          start_time: string
          technician_id: string
          updated_at: string
        }
        Insert: {
          availability_type?: string | null
          break_duration_minutes?: number | null
          clock_in_location_lat?: number | null
          clock_in_location_lng?: number | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          organization_id: string
          schedule_date: string
          start_time?: string
          technician_id: string
          updated_at?: string
        }
        Update: {
          availability_type?: string | null
          break_duration_minutes?: number | null
          clock_in_location_lat?: number | null
          clock_in_location_lng?: number | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          organization_id?: string
          schedule_date?: string
          start_time?: string
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_schedules_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_skills: {
        Row: {
          certification_expiry: string | null
          certified_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          proficiency_level: string
          skill_id: string
          skill_type: string
          technician_id: string
          updated_at: string | null
        }
        Insert: {
          certification_expiry?: string | null
          certified_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          proficiency_level?: string
          skill_id: string
          skill_type: string
          technician_id: string
          updated_at?: string | null
        }
        Update: {
          certification_expiry?: string | null
          certified_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          proficiency_level?: string
          skill_id?: string
          skill_type?: string
          technician_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_skills_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_unit_selections: {
        Row: {
          ceiling_type: string | null
          chw_coil_capacity_btuh: number | null
          coil_fins_per_inch: number | null
          coil_rows: number | null
          cooling_load_btuh: number | null
          created_at: string | null
          created_by: string | null
          damper_actuator: string | null
          duct_system_id: string | null
          entering_air_temp_f: number | null
          entering_water_temp_f: number | null
          fan_motor_hp: number | null
          fan_speed_settings: number | null
          has_damper: boolean | null
          has_discharge_sensor: boolean | null
          has_flow_station: boolean | null
          has_reheat: boolean | null
          heating_load_btuh: number | null
          hw_coil_capacity_btuh: number | null
          id: string
          inlet_size_in: number | null
          leaving_air_temp_f: number | null
          leaving_water_temp_f: number | null
          location_description: string | null
          manufacturer: string | null
          max_cfm: number | null
          min_cfm: number | null
          model_number: string | null
          noise_nc: number | null
          notes: string | null
          organization_id: string
          outdoor_air_cfm: number | null
          project_id: string | null
          quantity: number | null
          reheat_kw: number | null
          reheat_stages: number | null
          reheat_type: string | null
          selected_size: string | null
          sound_power_db: number | null
          status: string | null
          supply_cfm: number | null
          unit_tag: string
          unit_type: string
          updated_at: string | null
          water_flow_gpm: number | null
          water_pressure_drop_ft: number | null
          zone_id: string | null
        }
        Insert: {
          ceiling_type?: string | null
          chw_coil_capacity_btuh?: number | null
          coil_fins_per_inch?: number | null
          coil_rows?: number | null
          cooling_load_btuh?: number | null
          created_at?: string | null
          created_by?: string | null
          damper_actuator?: string | null
          duct_system_id?: string | null
          entering_air_temp_f?: number | null
          entering_water_temp_f?: number | null
          fan_motor_hp?: number | null
          fan_speed_settings?: number | null
          has_damper?: boolean | null
          has_discharge_sensor?: boolean | null
          has_flow_station?: boolean | null
          has_reheat?: boolean | null
          heating_load_btuh?: number | null
          hw_coil_capacity_btuh?: number | null
          id?: string
          inlet_size_in?: number | null
          leaving_air_temp_f?: number | null
          leaving_water_temp_f?: number | null
          location_description?: string | null
          manufacturer?: string | null
          max_cfm?: number | null
          min_cfm?: number | null
          model_number?: string | null
          noise_nc?: number | null
          notes?: string | null
          organization_id: string
          outdoor_air_cfm?: number | null
          project_id?: string | null
          quantity?: number | null
          reheat_kw?: number | null
          reheat_stages?: number | null
          reheat_type?: string | null
          selected_size?: string | null
          sound_power_db?: number | null
          status?: string | null
          supply_cfm?: number | null
          unit_tag: string
          unit_type: string
          updated_at?: string | null
          water_flow_gpm?: number | null
          water_pressure_drop_ft?: number | null
          zone_id?: string | null
        }
        Update: {
          ceiling_type?: string | null
          chw_coil_capacity_btuh?: number | null
          coil_fins_per_inch?: number | null
          coil_rows?: number | null
          cooling_load_btuh?: number | null
          created_at?: string | null
          created_by?: string | null
          damper_actuator?: string | null
          duct_system_id?: string | null
          entering_air_temp_f?: number | null
          entering_water_temp_f?: number | null
          fan_motor_hp?: number | null
          fan_speed_settings?: number | null
          has_damper?: boolean | null
          has_discharge_sensor?: boolean | null
          has_flow_station?: boolean | null
          has_reheat?: boolean | null
          heating_load_btuh?: number | null
          hw_coil_capacity_btuh?: number | null
          id?: string
          inlet_size_in?: number | null
          leaving_air_temp_f?: number | null
          leaving_water_temp_f?: number | null
          location_description?: string | null
          manufacturer?: string | null
          max_cfm?: number | null
          min_cfm?: number | null
          model_number?: string | null
          noise_nc?: number | null
          notes?: string | null
          organization_id?: string
          outdoor_air_cfm?: number | null
          project_id?: string | null
          quantity?: number | null
          reheat_kw?: number | null
          reheat_stages?: number | null
          reheat_type?: string | null
          selected_size?: string | null
          sound_power_db?: number | null
          status?: string | null
          supply_cfm?: number | null
          unit_tag?: string
          unit_type?: string
          updated_at?: string | null
          water_flow_gpm?: number | null
          water_pressure_drop_ft?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terminal_unit_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_unit_selections_duct_system_id_fkey"
            columns: ["duct_system_id"]
            isOneToOne: false
            referencedRelation: "duct_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_unit_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_unit_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_unit_selections_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      thermal_comfort_analyses: {
        Row: {
          acceptability_class: string | null
          adaptive_result: Json | null
          air_temp_c: number | null
          air_velocity_m_s: number | null
          analysis_name: string
          analysis_type: string
          clothing_insulation_clo: number | null
          created_at: string | null
          created_by: string | null
          id: string
          indoor_operative_temp_c: number | null
          mean_outdoor_temp_c: number | null
          mean_radiant_temp_c: number | null
          metabolic_rate_met: number | null
          notes: string | null
          organization_id: string
          pmv_result: Json | null
          project_id: string | null
          relative_humidity_percent: number | null
          status: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          acceptability_class?: string | null
          adaptive_result?: Json | null
          air_temp_c?: number | null
          air_velocity_m_s?: number | null
          analysis_name: string
          analysis_type: string
          clothing_insulation_clo?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          indoor_operative_temp_c?: number | null
          mean_outdoor_temp_c?: number | null
          mean_radiant_temp_c?: number | null
          metabolic_rate_met?: number | null
          notes?: string | null
          organization_id: string
          pmv_result?: Json | null
          project_id?: string | null
          relative_humidity_percent?: number | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          acceptability_class?: string | null
          adaptive_result?: Json | null
          air_temp_c?: number | null
          air_velocity_m_s?: number | null
          analysis_name?: string
          analysis_type?: string
          clothing_insulation_clo?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          indoor_operative_temp_c?: number | null
          mean_outdoor_temp_c?: number | null
          mean_radiant_temp_c?: number | null
          metabolic_rate_met?: number | null
          notes?: string | null
          organization_id?: string
          pmv_result?: Json | null
          project_id?: string | null
          relative_humidity_percent?: number | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thermal_comfort_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thermal_comfort_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thermal_comfort_analyses_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ventilation_calculations: {
        Row: {
          calculation_name: string
          created_at: string
          created_by: string | null
          diversity_factor: number | null
          id: string
          notes: string | null
          organization_id: string
          outdoor_air_mass_flow_lb_hr: number | null
          project_id: string | null
          status: string | null
          supply_air_cfm: number | null
          system_efficiency: number | null
          system_outdoor_air_cfm: number | null
          system_outdoor_air_percent: number | null
          total_floor_area_sqft: number | null
          total_occupancy: number | null
          total_vbz_cfm: number | null
          total_voz_cfm: number | null
          updated_at: string
        }
        Insert: {
          calculation_name: string
          created_at?: string
          created_by?: string | null
          diversity_factor?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          outdoor_air_mass_flow_lb_hr?: number | null
          project_id?: string | null
          status?: string | null
          supply_air_cfm?: number | null
          system_efficiency?: number | null
          system_outdoor_air_cfm?: number | null
          system_outdoor_air_percent?: number | null
          total_floor_area_sqft?: number | null
          total_occupancy?: number | null
          total_vbz_cfm?: number | null
          total_voz_cfm?: number | null
          updated_at?: string
        }
        Update: {
          calculation_name?: string
          created_at?: string
          created_by?: string | null
          diversity_factor?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          outdoor_air_mass_flow_lb_hr?: number | null
          project_id?: string | null
          status?: string | null
          supply_air_cfm?: number | null
          system_efficiency?: number | null
          system_outdoor_air_cfm?: number | null
          system_outdoor_air_percent?: number | null
          total_floor_area_sqft?: number | null
          total_occupancy?: number | null
          total_vbz_cfm?: number | null
          total_voz_cfm?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventilation_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventilation_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ventilation_zone_results: {
        Row: {
          created_at: string
          default_occupancy: number | null
          ez: number | null
          floor_area_sqft: number | null
          id: string
          occupancy: number | null
          operating_mode: string | null
          ra_cfm_sqft: number | null
          return_location: string | null
          rp_cfm_person: number | null
          space_type_id: string | null
          supply_location: string | null
          vbz_cfm: number | null
          ventilation_calculation_id: string
          voz_cfm: number | null
          zone_id: string | null
          zone_name: string
        }
        Insert: {
          created_at?: string
          default_occupancy?: number | null
          ez?: number | null
          floor_area_sqft?: number | null
          id?: string
          occupancy?: number | null
          operating_mode?: string | null
          ra_cfm_sqft?: number | null
          return_location?: string | null
          rp_cfm_person?: number | null
          space_type_id?: string | null
          supply_location?: string | null
          vbz_cfm?: number | null
          ventilation_calculation_id: string
          voz_cfm?: number | null
          zone_id?: string | null
          zone_name: string
        }
        Update: {
          created_at?: string
          default_occupancy?: number | null
          ez?: number | null
          floor_area_sqft?: number | null
          id?: string
          occupancy?: number | null
          operating_mode?: string | null
          ra_cfm_sqft?: number | null
          return_location?: string | null
          rp_cfm_person?: number | null
          space_type_id?: string | null
          supply_location?: string | null
          vbz_cfm?: number | null
          ventilation_calculation_id?: string
          voz_cfm?: number | null
          zone_id?: string | null
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventilation_zone_results_ventilation_calculation_id_fkey"
            columns: ["ventilation_calculation_id"]
            isOneToOne: false
            referencedRelation: "ventilation_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventilation_zone_results_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_notification_logs: {
        Row: {
          created_at: string
          days_pending: number | null
          id: string
          notification_type: string
          organization_id: string
          project_id: string | null
          recipient_email: string
          recipient_name: string | null
          remediation_record_id: string
          sent_at: string
          zone_id: string
          zone_name: string | null
        }
        Insert: {
          created_at?: string
          days_pending?: number | null
          id?: string
          notification_type: string
          organization_id: string
          project_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          remediation_record_id: string
          sent_at?: string
          zone_id: string
          zone_name?: string | null
        }
        Update: {
          created_at?: string
          days_pending?: number | null
          id?: string
          notification_type?: string
          organization_id?: string
          project_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          remediation_record_id?: string
          sent_at?: string
          zone_id?: string
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_notification_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_notification_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vibration_isolation_selections: {
        Row: {
          created_at: string | null
          deflection_inches: number | null
          efficiency_percent: number | null
          equipment_type: string | null
          equipment_weight_lbs: number | null
          id: string
          isolator_type: string | null
          operating_rpm: number | null
          organization_id: string
          project_id: string | null
          status: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          deflection_inches?: number | null
          efficiency_percent?: number | null
          equipment_type?: string | null
          equipment_weight_lbs?: number | null
          id?: string
          isolator_type?: string | null
          operating_rpm?: number | null
          organization_id: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          deflection_inches?: number | null
          efficiency_percent?: number | null
          equipment_type?: string | null
          equipment_weight_lbs?: number | null
          id?: string
          isolator_type?: string | null
          operating_rpm?: number | null
          organization_id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vibration_isolation_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibration_isolation_selections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vibration_isolation_selections_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      vrf_branch_selectors: {
        Row: {
          capacity_kw: number | null
          connected_unit_count: number | null
          created_at: string | null
          discharge_line_size_in: number | null
          distance_from_outdoor_ft: number | null
          elevation_from_outdoor_ft: number | null
          id: string
          liquid_line_size_in: number | null
          selector_model: string | null
          selector_tag: string
          sort_order: number | null
          suction_line_size_in: number | null
          total_connected_capacity_kw: number | null
          vrf_system_id: string
        }
        Insert: {
          capacity_kw?: number | null
          connected_unit_count?: number | null
          created_at?: string | null
          discharge_line_size_in?: number | null
          distance_from_outdoor_ft?: number | null
          elevation_from_outdoor_ft?: number | null
          id?: string
          liquid_line_size_in?: number | null
          selector_model?: string | null
          selector_tag: string
          sort_order?: number | null
          suction_line_size_in?: number | null
          total_connected_capacity_kw?: number | null
          vrf_system_id: string
        }
        Update: {
          capacity_kw?: number | null
          connected_unit_count?: number | null
          created_at?: string | null
          discharge_line_size_in?: number | null
          distance_from_outdoor_ft?: number | null
          elevation_from_outdoor_ft?: number | null
          id?: string
          liquid_line_size_in?: number | null
          selector_model?: string | null
          selector_tag?: string
          sort_order?: number | null
          suction_line_size_in?: number | null
          total_connected_capacity_kw?: number | null
          vrf_system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vrf_branch_selectors_vrf_system_id_fkey"
            columns: ["vrf_system_id"]
            isOneToOne: false
            referencedRelation: "vrf_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      vrf_indoor_units: {
        Row: {
          branch_selector_id: string | null
          connection_type: string | null
          cooling_capacity_btu: number | null
          cooling_capacity_kw: number
          created_at: string | null
          elevation_from_outdoor_ft: number | null
          heating_capacity_kw: number | null
          id: string
          is_above_outdoor: boolean | null
          liquid_line_equiv_length_ft: number | null
          liquid_line_length_ft: number
          liquid_line_pressure_drop_psi: number | null
          liquid_line_size_in: number | null
          liquid_velocity_fps: number | null
          model_number: string | null
          oil_return_ok: boolean | null
          parent_unit_id: string | null
          sort_order: number | null
          suction_line_equiv_length_ft: number | null
          suction_line_length_ft: number | null
          suction_line_pressure_drop_psi: number | null
          suction_line_size_in: number | null
          suction_velocity_fps: number | null
          unit_tag: string
          unit_type: string
          updated_at: string | null
          vrf_system_id: string
          zone_id: string | null
          zone_name: string | null
        }
        Insert: {
          branch_selector_id?: string | null
          connection_type?: string | null
          cooling_capacity_btu?: number | null
          cooling_capacity_kw: number
          created_at?: string | null
          elevation_from_outdoor_ft?: number | null
          heating_capacity_kw?: number | null
          id?: string
          is_above_outdoor?: boolean | null
          liquid_line_equiv_length_ft?: number | null
          liquid_line_length_ft?: number
          liquid_line_pressure_drop_psi?: number | null
          liquid_line_size_in?: number | null
          liquid_velocity_fps?: number | null
          model_number?: string | null
          oil_return_ok?: boolean | null
          parent_unit_id?: string | null
          sort_order?: number | null
          suction_line_equiv_length_ft?: number | null
          suction_line_length_ft?: number | null
          suction_line_pressure_drop_psi?: number | null
          suction_line_size_in?: number | null
          suction_velocity_fps?: number | null
          unit_tag: string
          unit_type: string
          updated_at?: string | null
          vrf_system_id: string
          zone_id?: string | null
          zone_name?: string | null
        }
        Update: {
          branch_selector_id?: string | null
          connection_type?: string | null
          cooling_capacity_btu?: number | null
          cooling_capacity_kw?: number
          created_at?: string | null
          elevation_from_outdoor_ft?: number | null
          heating_capacity_kw?: number | null
          id?: string
          is_above_outdoor?: boolean | null
          liquid_line_equiv_length_ft?: number | null
          liquid_line_length_ft?: number
          liquid_line_pressure_drop_psi?: number | null
          liquid_line_size_in?: number | null
          liquid_velocity_fps?: number | null
          model_number?: string | null
          oil_return_ok?: boolean | null
          parent_unit_id?: string | null
          sort_order?: number | null
          suction_line_equiv_length_ft?: number | null
          suction_line_length_ft?: number | null
          suction_line_pressure_drop_psi?: number | null
          suction_line_size_in?: number | null
          suction_velocity_fps?: number | null
          unit_tag?: string
          unit_type?: string
          updated_at?: string | null
          vrf_system_id?: string
          zone_id?: string | null
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vrf_indoor_units_branch_selector_id_fkey"
            columns: ["branch_selector_id"]
            isOneToOne: false
            referencedRelation: "vrf_branch_selectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vrf_indoor_units_parent_unit_id_fkey"
            columns: ["parent_unit_id"]
            isOneToOne: false
            referencedRelation: "vrf_indoor_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vrf_indoor_units_vrf_system_id_fkey"
            columns: ["vrf_system_id"]
            isOneToOne: false
            referencedRelation: "vrf_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vrf_indoor_units_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      vrf_piping_segments: {
        Row: {
          capacity_served_kw: number | null
          created_at: string | null
          elevation_change_ft: number | null
          equivalent_length_ft: number | null
          from_component_id: string | null
          from_component_type: string | null
          id: string
          is_riser: boolean | null
          length_ft: number
          line_type: string
          min_oil_return_velocity_fps: number | null
          nominal_size_in: number | null
          oil_return_verified: boolean | null
          parent_segment_id: string | null
          pressure_drop_psi: number | null
          refrigerant_flow_lb_hr: number | null
          segment_name: string
          segment_type: string
          sort_order: number | null
          to_component_id: string | null
          to_component_type: string | null
          velocity_fps: number | null
          vrf_system_id: string
        }
        Insert: {
          capacity_served_kw?: number | null
          created_at?: string | null
          elevation_change_ft?: number | null
          equivalent_length_ft?: number | null
          from_component_id?: string | null
          from_component_type?: string | null
          id?: string
          is_riser?: boolean | null
          length_ft: number
          line_type: string
          min_oil_return_velocity_fps?: number | null
          nominal_size_in?: number | null
          oil_return_verified?: boolean | null
          parent_segment_id?: string | null
          pressure_drop_psi?: number | null
          refrigerant_flow_lb_hr?: number | null
          segment_name: string
          segment_type: string
          sort_order?: number | null
          to_component_id?: string | null
          to_component_type?: string | null
          velocity_fps?: number | null
          vrf_system_id: string
        }
        Update: {
          capacity_served_kw?: number | null
          created_at?: string | null
          elevation_change_ft?: number | null
          equivalent_length_ft?: number | null
          from_component_id?: string | null
          from_component_type?: string | null
          id?: string
          is_riser?: boolean | null
          length_ft?: number
          line_type?: string
          min_oil_return_velocity_fps?: number | null
          nominal_size_in?: number | null
          oil_return_verified?: boolean | null
          parent_segment_id?: string | null
          pressure_drop_psi?: number | null
          refrigerant_flow_lb_hr?: number | null
          segment_name?: string
          segment_type?: string
          sort_order?: number | null
          to_component_id?: string | null
          to_component_type?: string | null
          velocity_fps?: number | null
          vrf_system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vrf_piping_segments_parent_segment_id_fkey"
            columns: ["parent_segment_id"]
            isOneToOne: false
            referencedRelation: "vrf_piping_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vrf_piping_segments_vrf_system_id_fkey"
            columns: ["vrf_system_id"]
            isOneToOne: false
            referencedRelation: "vrf_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      vrf_systems: {
        Row: {
          actual_elevation_diff_ft: number | null
          capacity_ratio: number | null
          created_at: string | null
          created_by: string | null
          first_branch_max_length_ft: number | null
          id: string
          max_elevation_diff_ft: number | null
          max_piping_length_actual_ft: number | null
          max_piping_length_ft: number | null
          notes: string | null
          number_of_outdoor_units: number | null
          oil_return_notes: string | null
          oil_return_verified: boolean | null
          organization_id: string
          outdoor_unit_capacity_kw: number | null
          outdoor_unit_capacity_tons: number | null
          outdoor_unit_manufacturer: string | null
          outdoor_unit_model: string | null
          project_id: string | null
          refrigerant_type: string
          revision: string | null
          status: string | null
          system_name: string
          system_tag: string | null
          system_type: string
          total_indoor_capacity_kw: number | null
          total_indoor_capacity_tons: number | null
          total_liquid_line_length_ft: number | null
          total_suction_line_length_ft: number | null
          updated_at: string | null
        }
        Insert: {
          actual_elevation_diff_ft?: number | null
          capacity_ratio?: number | null
          created_at?: string | null
          created_by?: string | null
          first_branch_max_length_ft?: number | null
          id?: string
          max_elevation_diff_ft?: number | null
          max_piping_length_actual_ft?: number | null
          max_piping_length_ft?: number | null
          notes?: string | null
          number_of_outdoor_units?: number | null
          oil_return_notes?: string | null
          oil_return_verified?: boolean | null
          organization_id: string
          outdoor_unit_capacity_kw?: number | null
          outdoor_unit_capacity_tons?: number | null
          outdoor_unit_manufacturer?: string | null
          outdoor_unit_model?: string | null
          project_id?: string | null
          refrigerant_type?: string
          revision?: string | null
          status?: string | null
          system_name: string
          system_tag?: string | null
          system_type?: string
          total_indoor_capacity_kw?: number | null
          total_indoor_capacity_tons?: number | null
          total_liquid_line_length_ft?: number | null
          total_suction_line_length_ft?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_elevation_diff_ft?: number | null
          capacity_ratio?: number | null
          created_at?: string | null
          created_by?: string | null
          first_branch_max_length_ft?: number | null
          id?: string
          max_elevation_diff_ft?: number | null
          max_piping_length_actual_ft?: number | null
          max_piping_length_ft?: number | null
          notes?: string | null
          number_of_outdoor_units?: number | null
          oil_return_notes?: string | null
          oil_return_verified?: boolean | null
          organization_id?: string
          outdoor_unit_capacity_kw?: number | null
          outdoor_unit_capacity_tons?: number | null
          outdoor_unit_manufacturer?: string | null
          outdoor_unit_model?: string | null
          project_id?: string | null
          refrigerant_type?: string
          revision?: string | null
          status?: string | null
          system_name?: string
          system_tag?: string | null
          system_type?: string
          total_indoor_capacity_kw?: number | null
          total_indoor_capacity_tons?: number | null
          total_liquid_line_length_ft?: number | null
          total_suction_line_length_ft?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vrf_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vrf_systems_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vrf_systems_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_cache: {
        Row: {
          city_name: string
          created_at: string
          expires_at: string
          fetched_at: string
          humidity_percent: number | null
          id: string
          latitude: number | null
          longitude: number | null
          organization_id: string | null
          pressure_hpa: number | null
          temperature_c: number | null
          weather_condition: string | null
          weather_icon: string | null
          wind_speed_ms: number | null
        }
        Insert: {
          city_name: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          humidity_percent?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_id?: string | null
          pressure_hpa?: number | null
          temperature_c?: number | null
          weather_condition?: string | null
          weather_icon?: string | null
          wind_speed_ms?: number | null
        }
        Update: {
          city_name?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          humidity_percent?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_id?: string | null
          pressure_hpa?: number | null
          temperature_c?: number | null
          weather_condition?: string | null
          weather_icon?: string | null
          wind_speed_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          equipment_id: string | null
          equipment_tag: string | null
          id: string
          organization_id: string
          pm_schedule_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          equipment_tag?: string | null
          id?: string
          organization_id: string
          pm_schedule_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          equipment_tag?: string | null
          id?: string
          organization_id?: string
          pm_schedule_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_pm_schedule_id_fkey"
            columns: ["pm_schedule_id"]
            isOneToOne: false
            referencedRelation: "pm_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          building_type: string
          created_at: string | null
          description: string | null
          id: string
          is_system_default: boolean | null
          name: string
          optional_stages: string[]
          organization_id: string | null
          required_stages: string[]
          stage_config: Json
          typical_durations: Json | null
          updated_at: string | null
        }
        Insert: {
          building_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_default?: boolean | null
          name: string
          optional_stages?: string[]
          organization_id?: string | null
          required_stages?: string[]
          stage_config?: Json
          typical_durations?: Json | null
          updated_at?: string | null
        }
        Update: {
          building_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_default?: boolean | null
          name?: string
          optional_stages?: string[]
          organization_id?: string | null
          required_stages?: string[]
          stage_config?: Json
          typical_durations?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          acoustic_alert_severity: string | null
          acoustic_alerts_enabled: boolean | null
          acoustic_measurement_device_id: string | null
          area_sqm: number | null
          created_at: string
          floor_id: string
          id: string
          name: string
          nc_tolerance: number | null
          occupancy_capacity: number | null
          target_nc: number | null
          updated_at: string
          zone_type: string | null
        }
        Insert: {
          acoustic_alert_severity?: string | null
          acoustic_alerts_enabled?: boolean | null
          acoustic_measurement_device_id?: string | null
          area_sqm?: number | null
          created_at?: string
          floor_id: string
          id?: string
          name: string
          nc_tolerance?: number | null
          occupancy_capacity?: number | null
          target_nc?: number | null
          updated_at?: string
          zone_type?: string | null
        }
        Update: {
          acoustic_alert_severity?: string | null
          acoustic_alerts_enabled?: boolean | null
          acoustic_measurement_device_id?: string | null
          area_sqm?: number | null
          created_at?: string
          floor_id?: string
          id?: string
          name?: string
          nc_tolerance?: number | null
          occupancy_capacity?: number | null
          target_nc?: number | null
          updated_at?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_acoustic_measurement_device_id_fkey"
            columns: ["acoustic_measurement_device_id"]
            isOneToOne: false
            referencedRelation: "iot_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: { _name: string; _slug: string }
        Returns: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_project_id_from_zone: { Args: { p_zone_id: string }; Returns: string }
      get_zone_hierarchy: {
        Args: { p_zone_id: string }
        Returns: {
          building_id: string
          building_name: string
          floor_id: string
          floor_name: string
          organization_id: string
          project_id: string
          project_name: string
          zone_id: string
          zone_name: string
        }[]
      }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      user_org_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
