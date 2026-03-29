import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BoilerType, FuelType, BoilerCatalogItem, BOILER_CATALOG } from '@/lib/boiler-selection-calculations';

export interface BoilerCatalogFilters {
  boilerType?: BoilerType;
  fuelType?: FuelType;
  manufacturer?: string;
  minCapacityBtuh?: number;
  maxCapacityBtuh?: number;
  minAfue?: number;
  asmeCompliant?: boolean;
  ahriCertified?: boolean;
}

/**
 * Fetch boilers from equipment_catalog
 * Returns empty array if no boilers in DB (falls back to static catalog in component)
 */
export function useBoilerCatalog(filters?: BoilerCatalogFilters) {
  return useQuery({
    queryKey: ['boiler_catalog', filters],
    queryFn: async () => {
      // Query equipment_catalog for boilers
      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('*')
        .eq('equipment_category', 'boiler')
        .eq('is_active', true)
        .order('list_price_sar', { ascending: true });

      if (error) throw error;
      
      // Return empty if no boilers - component will use static catalog
      return data || [];
    },
  });
}

/**
 * Adapter function to convert database items to BoilerCatalogItem
 */
export function adaptDbToBoiler(item: any): BoilerCatalogItem {
  return {
    id: item.id,
    manufacturer: item.manufacturer || '',
    model: item.model_number || '',
    boilerType: (item.equipment_subcategory || 'condensing-gas') as BoilerType,
    fuelType: (item.fuel_type || 'natural-gas') as FuelType,
    capacityBtuh: item.heating_capacity_btuh || 0,
    capacityKw: item.heating_capacity_kw || 0,
    afue: item.afue || 0,
    thermalEfficiency: item.thermal_efficiency || 0,
    combustionEfficiency: item.combustion_efficiency || 0,
    turndownRatio: item.turndown_ratio || 4,
    minModulation: item.min_modulation || 25,
    supplyTempRange: item.supply_temp_range || { min: 70, max: 180 },
    returnTempRange: item.return_temp_range || { min: 60, max: 160 },
    voltage: item.voltage || '120V',
    fla: item.full_load_amps || 0,
    noxEmissions: item.nox_emissions_ppm || 0,
    soundDb: item.sound_power_level_db || 0,
    weightLbs: Math.round((item.weight_kg || 0) * 2.205),
    asmeCompliant: item.asme_compliant || false,
    ahriCertified: item.ahri_certified || false,
    ahriCertNumber: item.ahri_cert_number,
    listPriceSar: item.list_price_sar || 0,
  };
}

/**
 * Get unique boiler manufacturers
 */
export function useBoilerManufacturers() {
  return useQuery({
    queryKey: ['boiler-catalog-manufacturers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('manufacturer')
        .eq('equipment_category', 'boiler')
        .eq('is_active', true);

      if (error) throw error;
      const manufacturers = [...new Set(data.map(d => d.manufacturer).filter(Boolean) as string[])];
      return manufacturers.sort();
    },
  });
}

/**
 * Get boiler catalog count
 */
export function useBoilerCatalogCount() {
  return useQuery({
    queryKey: ['boiler-catalog-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('equipment_catalog')
        .select('*', { count: 'exact', head: true })
        .eq('equipment_category', 'boiler')
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    },
  });
}
