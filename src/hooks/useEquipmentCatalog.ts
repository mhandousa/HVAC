import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type EquipmentCatalogItem = Tables<'equipment_catalog'>;
export type EquipmentCatalogInsert = TablesInsert<'equipment_catalog'>;
export type EquipmentCatalogUpdate = TablesUpdate<'equipment_catalog'>;

export type EquipmentCategory = 
  | 'chiller' 
  | 'ahu' 
  | 'fan_coil' 
  | 'vrf' 
  | 'package_unit' 
  | 'boiler' 
  | 'cooling_tower' 
  | 'pump' 
  | 'split_system' 
  | 'mini_split' 
  | 'heat_pump' 
  | 'erv';

export interface CatalogFilters {
  category?: EquipmentCategory;
  manufacturer?: string;
  minCapacityTons?: number;
  maxCapacityTons?: number;
  minSeer?: number;
  sasoOnly?: boolean;
  isActive?: boolean;
}

export type ChillerSubcategory = 
  | 'water-cooled-centrifugal' 
  | 'water-cooled-screw' 
  | 'air-cooled-screw' 
  | 'air-cooled-scroll';

export type CompressorType = 'centrifugal' | 'screw' | 'scroll';

export interface ChillerCatalogFilters extends CatalogFilters {
  subcategory?: ChillerSubcategory;
  compressorType?: CompressorType;
  minIplv?: number;
  maxIplv?: number;
  ahriCertified?: boolean;
}

export function useEquipmentCatalog(filters?: CatalogFilters) {
  return useQuery({
    queryKey: ['equipment_catalog', filters],
    queryFn: async () => {
      let query = supabase
        .from('equipment_catalog')
        .select('*')
        .order('manufacturer', { ascending: true })
        .order('model_number', { ascending: true });

      if (filters?.category) {
        query = query.eq('equipment_category', filters.category);
      }

      if (filters?.manufacturer) {
        query = query.ilike('manufacturer', `%${filters.manufacturer}%`);
      }

      if (filters?.minCapacityTons) {
        query = query.gte('cooling_capacity_tons', filters.minCapacityTons);
      }

      if (filters?.maxCapacityTons) {
        query = query.lte('cooling_capacity_tons', filters.maxCapacityTons);
      }

      if (filters?.minSeer) {
        query = query.gte('seer', filters.minSeer);
      }

      if (filters?.sasoOnly) {
        query = query.eq('saso_certified', true);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      } else {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EquipmentCatalogItem[];
    },
  });
}

export function useEquipmentCatalogItem(id: string | undefined) {
  return useQuery({
    queryKey: ['equipment_catalog_item', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as EquipmentCatalogItem | null;
    },
    enabled: !!id,
  });
}

export function useManufacturers() {
  return useQuery({
    queryKey: ['equipment_catalog_manufacturers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('manufacturer')
        .eq('is_active', true);

      if (error) throw error;
      
      // Get unique manufacturers
      const manufacturers = [...new Set(data.map(d => d.manufacturer))].sort();
      return manufacturers;
    },
  });
}

export function useCreateEquipmentCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: EquipmentCatalogInsert) => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data as EquipmentCatalogItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_catalog'] });
      toast.success('Catalog item created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create catalog item');
    },
  });
}

export function useUpdateEquipmentCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EquipmentCatalogUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EquipmentCatalogItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment_catalog'] });
      queryClient.invalidateQueries({ queryKey: ['equipment_catalog_item', data.id] });
      toast.success('Catalog item updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update catalog item');
    },
  });
}

export function useDeleteEquipmentCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_catalog'] });
      toast.success('Catalog item deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete catalog item');
    },
  });
}

// Specialized hook for chiller catalog with AHRI-specific filters
export function useChillerCatalog(filters?: ChillerCatalogFilters) {
  return useQuery({
    queryKey: ['chiller_catalog', filters],
    queryFn: async () => {
      let query = supabase
        .from('equipment_catalog')
        .select('*')
        .eq('equipment_category', 'chiller')
        .eq('is_active', true)
        .order('cooling_capacity_tons', { ascending: true });

      if (filters?.subcategory) {
        query = query.eq('equipment_subcategory', filters.subcategory);
      }

      if (filters?.compressorType) {
        query = query.eq('compressor_type', filters.compressorType);
      }

      if (filters?.manufacturer) {
        query = query.ilike('manufacturer', `%${filters.manufacturer}%`);
      }

      if (filters?.minCapacityTons) {
        query = query.gte('cooling_capacity_tons', filters.minCapacityTons);
      }

      if (filters?.maxCapacityTons) {
        query = query.lte('cooling_capacity_tons', filters.maxCapacityTons);
      }

      if (filters?.minIplv) {
        query = query.gte('iplv', filters.minIplv);
      }

      if (filters?.maxIplv) {
        query = query.lte('iplv', filters.maxIplv);
      }

      if (filters?.ahriCertified) {
        query = query.eq('ahri_certified', true);
      }

      if (filters?.sasoOnly) {
        query = query.eq('saso_certified', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EquipmentCatalogItem[];
    },
  });
}
