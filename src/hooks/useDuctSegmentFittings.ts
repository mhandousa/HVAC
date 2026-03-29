import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuctSegmentFitting {
  id: string;
  duct_segment_id: string;
  fitting_type: string;
  fitting_description: string | null;
  loss_coefficient: number | null;
  equivalent_length_ft: number | null;
  quantity: number | null;
  created_at: string;
  // Joined from duct_fittings_library if available
  library_fitting?: {
    id: string;
    fitting_code: string;
    fitting_name: string;
    fitting_category: string;
    duct_shape: string;
    loss_coefficient: number;
    description: string | null;
    radius_ratio: number | null;
    angle_degrees: number | null;
    ashrae_reference: string | null;
  } | null;
}

export function useDuctSegmentFittings(segmentId?: string) {
  return useQuery({
    queryKey: ['duct-segment-fittings', segmentId],
    queryFn: async () => {
      if (!segmentId) return [];

      const { data, error } = await supabase
        .from('duct_fittings')
        .select('*')
        .eq('duct_segment_id', segmentId)
        .order('created_at');

      if (error) throw error;
      return data as DuctSegmentFitting[];
    },
    enabled: !!segmentId,
  });
}

export function useDuctSystemFittings(systemId?: string) {
  return useQuery({
    queryKey: ['duct-system-fittings', systemId],
    queryFn: async () => {
      if (!systemId) return [];

      // First get all segment IDs for this system
      const { data: segments, error: segmentsError } = await supabase
        .from('duct_segments')
        .select('id')
        .eq('duct_system_id', systemId);

      if (segmentsError) throw segmentsError;
      if (!segments || segments.length === 0) return [];

      const segmentIds = segments.map(s => s.id);

      // Then get all fittings for these segments
      const { data: fittings, error: fittingsError } = await supabase
        .from('duct_fittings')
        .select('*')
        .in('duct_segment_id', segmentIds)
        .order('created_at');

      if (fittingsError) throw fittingsError;
      return fittings as DuctSegmentFitting[];
    },
    enabled: !!systemId,
  });
}

// Get fittings count by type for a segment
export function useFittingsCountByType(segmentId?: string) {
  const { data: fittings, ...rest } = useDuctSegmentFittings(segmentId);
  
  const countByType = fittings?.reduce((acc, fitting) => {
    const type = fitting.fitting_type;
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += fitting.quantity || 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    countByType,
    totalFittings: fittings?.reduce((sum, f) => sum + (f.quantity || 1), 0) || 0,
    ...rest,
  };
}
