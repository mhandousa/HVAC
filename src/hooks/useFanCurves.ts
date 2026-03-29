import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fan curve data point type
export interface FanCurvePoint {
  cfm: number;
  staticPressure: number;
  bhp: number;
  efficiency: number;
}

// Fan curve type from database
export interface FanCurve {
  id: string;
  organization_id: string | null;
  manufacturer: string;
  model: string;
  fan_type: string;
  wheel_diameter_in: number | null;
  rpm: number | null;
  motor_hp: number | null;
  curve_data: FanCurvePoint[];
  max_cfm: number | null;
  min_cfm: number | null;
  max_static_pressure: number | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

// Operating point result
export interface OperatingPoint {
  cfm: number;
  staticPressure: number;
  bhp: number;
  efficiency: number;
  isValid: boolean;
  message: string;
}

// System curve point
export interface SystemCurvePoint {
  cfm: number;
  staticPressure: number;
}

// Fetch all fan curves
export function useFanCurves() {
  return useQuery({
    queryKey: ['fan-curves'],
    queryFn: async (): Promise<FanCurve[]> => {
      const { data, error } = await supabase
        .from('fan_curves')
        .select('*')
        .eq('is_active', true)
        .order('manufacturer', { ascending: true });

      if (error) throw error;
      
      // Parse curve_data from JSON
      return (data || []).map((row) => ({
        ...row,
        curve_data: typeof row.curve_data === 'string' 
          ? JSON.parse(row.curve_data) 
          : Array.isArray(row.curve_data)
            ? (row.curve_data as unknown as FanCurvePoint[])
            : [],
      }));
    },
  });
}

// Calculate system curve based on design point
// System curve follows: SP = SP_static + K * Q^2
export function calculateSystemCurve(
  designCfm: number,
  designStaticPressure: number,
  staticPressure: number = 0
): SystemCurvePoint[] {
  const dynamicHead = designStaticPressure - staticPressure;
  const k = dynamicHead / Math.pow(designCfm, 2);
  
  const points: SystemCurvePoint[] = [];
  const maxCfm = designCfm * 1.5;
  
  for (let cfm = 0; cfm <= maxCfm; cfm += maxCfm / 20) {
    points.push({
      cfm,
      staticPressure: staticPressure + k * Math.pow(cfm, 2),
    });
  }
  
  return points;
}

// Find operating point where fan curve intersects system curve
export function findOperatingPoint(
  fanCurve: FanCurvePoint[],
  systemCurve: SystemCurvePoint[]
): OperatingPoint {
  if (!fanCurve || fanCurve.length < 2) {
    return {
      cfm: 0,
      staticPressure: 0,
      bhp: 0,
      efficiency: 0,
      isValid: false,
      message: 'Invalid fan curve data',
    };
  }

  // Sort fan curve by CFM
  const sortedFanCurve = [...fanCurve].sort((a, b) => a.cfm - b.cfm);
  
  // Find intersection point
  for (let i = 0; i < sortedFanCurve.length - 1; i++) {
    const f1 = sortedFanCurve[i];
    const f2 = sortedFanCurve[i + 1];
    
    // Find corresponding system curve points
    const s1 = systemCurve.find((s) => s.cfm >= f1.cfm) || systemCurve[0];
    const s2 = systemCurve.find((s) => s.cfm >= f2.cfm) || systemCurve[systemCurve.length - 1];
    
    // Check if curves cross in this segment
    const fanDiff1 = f1.staticPressure - s1.staticPressure;
    const fanDiff2 = f2.staticPressure - s2.staticPressure;
    
    if (fanDiff1 * fanDiff2 <= 0) {
      // Intersection found - interpolate
      const ratio = Math.abs(fanDiff1) / (Math.abs(fanDiff1) + Math.abs(fanDiff2));
      const cfm = f1.cfm + ratio * (f2.cfm - f1.cfm);
      const staticPressure = f1.staticPressure + ratio * (f2.staticPressure - f1.staticPressure);
      const bhp = f1.bhp + ratio * (f2.bhp - f1.bhp);
      const efficiency = f1.efficiency + ratio * (f2.efficiency - f1.efficiency);
      
      // Validate operating point
      const maxEfficiency = Math.max(...fanCurve.map((p) => p.efficiency));
      const isInGoodRange = efficiency >= maxEfficiency * 0.7;
      
      return {
        cfm,
        staticPressure,
        bhp,
        efficiency,
        isValid: isInGoodRange,
        message: isInGoodRange
          ? `Operating at ${efficiency.toFixed(0)}% efficiency, within recommended range`
          : `Operating at ${efficiency.toFixed(0)}% efficiency, outside optimal range (${(maxEfficiency * 0.7).toFixed(0)}-${maxEfficiency.toFixed(0)}%)`,
      };
    }
  }
  
  // No intersection found - fan curve doesn't meet system requirements
  return {
    cfm: 0,
    staticPressure: 0,
    bhp: 0,
    efficiency: 0,
    isValid: false,
    message: 'Fan cannot meet system requirements - select a larger fan',
  };
}

// Find best matching fans for given requirements
export function findBestFan(
  fans: FanCurve[],
  requiredCfm: number,
  requiredStaticPressure: number
): Array<{ fan: FanCurve; operatingPoint: OperatingPoint; score: number }> {
  const systemCurve = calculateSystemCurve(requiredCfm, requiredStaticPressure);
  
  const ranked = fans
    .map((fan) => {
      const operatingPoint = findOperatingPoint(fan.curve_data, systemCurve);
      
      // Score based on: efficiency, proximity to required point, and validity
      let score = 0;
      
      if (operatingPoint.isValid) {
        score += 50; // Base score for valid operating point
        score += operatingPoint.efficiency * 0.5; // Up to 50 points for efficiency
        
        // Penalize for being far from required CFM
        const cfmDiff = Math.abs(operatingPoint.cfm - requiredCfm) / requiredCfm;
        score -= cfmDiff * 20;
        
        // Bonus for being close to design point
        if (cfmDiff < 0.1) score += 10;
      }
      
      return { fan, operatingPoint, score };
    })
    .filter((r) => r.operatingPoint.cfm > 0 || r.score > 0)
    .sort((a, b) => b.score - a.score);
  
  return ranked;
}

// Create a new fan curve
export function useCreateFanCurve() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fanCurve: Omit<FanCurve, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('fan_curves')
        .insert([{
          ...fanCurve,
          curve_data: JSON.stringify(fanCurve.curve_data),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-curves'] });
      toast.success('Fan curve created');
    },
    onError: (error) => {
      toast.error(`Failed to create fan curve: ${error.message}`);
    },
  });
}

// Update a fan curve
export function useUpdateFanCurve() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FanCurve> & { id: string }) => {
      const { data, error } = await supabase
        .from('fan_curves')
        .update({
          ...updates,
          curve_data: updates.curve_data ? JSON.stringify(updates.curve_data) : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-curves'] });
      toast.success('Fan curve updated');
    },
    onError: (error) => {
      toast.error(`Failed to update fan curve: ${error.message}`);
    },
  });
}

// Delete a fan curve
export function useDeleteFanCurve() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fan_curves')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-curves'] });
      toast.success('Fan curve deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete fan curve: ${error.message}`);
    },
  });
}
