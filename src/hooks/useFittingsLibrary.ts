import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuctFitting {
  id: string;
  fitting_code: string;
  fitting_name: string;
  fitting_category: string;
  duct_shape: 'round' | 'rectangular' | 'both';
  loss_coefficient: number;
  description: string | null;
  radius_ratio: number | null;
  angle_degrees: number | null;
  ashrae_reference: string | null;
  is_active: boolean;
}

export type FittingCategory = 'elbow' | 'tee' | 'transition' | 'damper' | 'entry' | 'exit' | 'takeoff' | 'flex';

export interface FittingsFilter {
  category?: FittingCategory | FittingCategory[];
  shape?: 'round' | 'rectangular' | 'both';
  searchTerm?: string;
}

export function useFittingsLibrary(filter?: FittingsFilter) {
  return useQuery({
    queryKey: ['duct-fittings-library', filter],
    queryFn: async () => {
      let query = supabase
        .from('duct_fittings_library')
        .select('*')
        .eq('is_active', true)
        .order('fitting_category')
        .order('fitting_name');

      // Apply category filter
      if (filter?.category) {
        if (Array.isArray(filter.category)) {
          query = query.in('fitting_category', filter.category);
        } else {
          query = query.eq('fitting_category', filter.category);
        }
      }

      // Apply shape filter
      if (filter?.shape && filter.shape !== 'both') {
        query = query.or(`duct_shape.eq.${filter.shape},duct_shape.eq.both`);
      }

      // Apply search term
      if (filter?.searchTerm) {
        query = query.or(`fitting_name.ilike.%${filter.searchTerm}%,fitting_code.ilike.%${filter.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DuctFitting[];
    },
  });
}

export function useFitting(fittingId?: string) {
  return useQuery({
    queryKey: ['duct-fitting', fittingId],
    queryFn: async () => {
      if (!fittingId) return null;

      const { data, error } = await supabase
        .from('duct_fittings_library')
        .select('*')
        .eq('id', fittingId)
        .single();

      if (error) throw error;
      return data as DuctFitting;
    },
    enabled: !!fittingId,
  });
}

export function useFittingsByCategory() {
  const { data: fittings, ...rest } = useFittingsLibrary();

  const groupedFittings = fittings?.reduce((acc, fitting) => {
    const category = fitting.fitting_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(fitting);
    return acc;
  }, {} as Record<string, DuctFitting[]>);

  return {
    groupedFittings,
    categories: groupedFittings ? Object.keys(groupedFittings) : [],
    ...rest,
  };
}

// Common fittings for quick selection
export const COMMON_FITTINGS: Array<{ code: string; name: string; coefficient: number }> = [
  { code: 'RND-E90-R1.5', name: '90° Elbow', coefficient: 0.16 },
  { code: 'RND-E45-R1.5', name: '45° Elbow', coefficient: 0.08 },
  { code: 'TEE-RND-90-S', name: 'Tee Branch', coefficient: 0.90 },
  { code: 'TRANS-RND-GRAD', name: 'Transition', coefficient: 0.05 },
  { code: 'DAMP-VCD-OPEN', name: 'Damper', coefficient: 0.20 },
  { code: 'ENTRY-PLENUM', name: 'Entry', coefficient: 0.50 },
  { code: 'EXIT-DIFF', name: 'To Diffuser', coefficient: 0.10 },
];

// Category display names
export const FITTING_CATEGORY_LABELS: Record<string, string> = {
  elbow: 'Elbows',
  tee: 'Tees & Wyes',
  transition: 'Transitions',
  damper: 'Dampers',
  entry: 'Entries',
  exit: 'Exits',
  takeoff: 'Takeoffs',
  flex: 'Flexible Duct',
};
