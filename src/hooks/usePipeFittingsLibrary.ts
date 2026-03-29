import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PipeFitting {
  id: string;
  fitting_code: string;
  fitting_name: string;
  fitting_category: string;
  pipe_material: string | null;
  nominal_size_range: string | null;
  k_factor: number;
  equivalent_length_factor: number | null;
  description: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export type FittingCategory = 'elbow' | 'tee' | 'valve' | 'reducer' | 'strainer' | 'equipment' | 'entrance' | 'exit';

export interface FittingsFilter {
  category?: FittingCategory;
  searchTerm?: string;
}

export function usePipeFittingsLibrary(filter?: FittingsFilter) {
  return useQuery({
    queryKey: ['pipe-fittings-library', filter],
    queryFn: async () => {
      let query = supabase
        .from('pipe_fittings_library')
        .select('*')
        .eq('is_active', true)
        .order('fitting_category')
        .order('fitting_name');

      if (filter?.category) {
        query = query.eq('fitting_category', filter.category);
      }

      if (filter?.searchTerm) {
        query = query.or(
          `fitting_name.ilike.%${filter.searchTerm}%,fitting_code.ilike.%${filter.searchTerm}%,description.ilike.%${filter.searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PipeFitting[];
    },
  });
}

export function usePipeFitting(fittingId?: string) {
  return useQuery({
    queryKey: ['pipe-fitting', fittingId],
    queryFn: async () => {
      if (!fittingId) return null;

      const { data, error } = await supabase
        .from('pipe_fittings_library')
        .select('*')
        .eq('id', fittingId)
        .single();

      if (error) throw error;
      return data as PipeFitting;
    },
    enabled: !!fittingId,
  });
}

export function usePipeFittingsByCategory() {
  const { data: fittings, ...rest } = usePipeFittingsLibrary();

  const groupedFittings = fittings?.reduce((acc, fitting) => {
    const category = fitting.fitting_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(fitting);
    return acc;
  }, {} as Record<string, PipeFitting[]>);

  const categories = groupedFittings ? Object.keys(groupedFittings) : [];

  return {
    ...rest,
    data: groupedFittings,
    categories,
  };
}

export const FITTING_CATEGORY_LABELS: Record<string, string> = {
  elbow: 'Elbows',
  tee: 'Tees',
  valve: 'Valves',
  reducer: 'Reducers & Enlargements',
  strainer: 'Strainers',
  equipment: 'Equipment',
  entrance: 'Entrances',
  exit: 'Exits',
};

export const COMMON_PIPE_FITTINGS = [
  { code: 'EL90-STD', name: '90° Elbow', kFactor: 0.75 },
  { code: 'EL45-STD', name: '45° Elbow', kFactor: 0.35 },
  { code: 'TEE-THRU', name: 'Tee - Through', kFactor: 0.40 },
  { code: 'TEE-BRANCH', name: 'Tee - Branch', kFactor: 1.80 },
  { code: 'VLV-GATE-O', name: 'Gate Valve', kFactor: 0.17 },
  { code: 'VLV-BALL-O', name: 'Ball Valve', kFactor: 0.05 },
  { code: 'VLV-CHK-SWING', name: 'Check Valve', kFactor: 2.00 },
  { code: 'STR-Y', name: 'Y-Strainer', kFactor: 2.00 },
];
