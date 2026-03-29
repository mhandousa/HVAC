import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface PumpCurvePoint {
  flow: number;
  head: number;
  efficiency: number;
  power: number;
}

export interface PumpCurve {
  id: string;
  organization_id: string;
  manufacturer: string;
  model: string;
  pump_type: string;
  impeller_diameter_in: number | null;
  rpm: number;
  curve_data: PumpCurvePoint[];
  motor_hp: number | null;
  npsh_required: number[];
  min_flow_gpm: number | null;
  max_flow_gpm: number | null;
  max_head_ft: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemCurvePoint {
  flow: number;
  head: number;
}

export interface OperatingPoint {
  flow: number;
  head: number;
  efficiency: number;
  power: number;
  isValid: boolean;
  message?: string;
}

// Calculate system curve: H = H_static + K * Q^2
export function calculateSystemCurve(
  staticHead: number,
  designFlow: number,
  designHead: number,
  points: number = 10
): SystemCurvePoint[] {
  // Calculate K factor from design point
  const dynamicHead = designHead - staticHead;
  const K = dynamicHead > 0 && designFlow > 0 ? dynamicHead / (designFlow * designFlow) : 0;

  const maxFlow = designFlow * 1.5;
  const curve: SystemCurvePoint[] = [];

  for (let i = 0; i <= points; i++) {
    const flow = (maxFlow / points) * i;
    const head = staticHead + K * flow * flow;
    curve.push({ flow, head });
  }

  return curve;
}

// Find operating point by interpolating pump curve
export function findOperatingPoint(
  pumpCurve: PumpCurvePoint[],
  systemCurve: SystemCurvePoint[]
): OperatingPoint | null {
  if (pumpCurve.length < 2 || systemCurve.length < 2) return null;

  // Find intersection by checking where pump head crosses system head
  for (let i = 0; i < systemCurve.length - 1; i++) {
    const sysPoint1 = systemCurve[i];
    const sysPoint2 = systemCurve[i + 1];

    // Find pump curve points around this flow
    const pumpPoint1 = interpolatePumpCurve(pumpCurve, sysPoint1.flow);
    const pumpPoint2 = interpolatePumpCurve(pumpCurve, sysPoint2.flow);

    if (!pumpPoint1 || !pumpPoint2) continue;

    // Check if pump curve crosses system curve
    const diff1 = pumpPoint1.head - sysPoint1.head;
    const diff2 = pumpPoint2.head - sysPoint2.head;

    if (diff1 >= 0 && diff2 <= 0) {
      // Intersection found - interpolate
      const ratio = diff1 / (diff1 - diff2);
      const opFlow = sysPoint1.flow + ratio * (sysPoint2.flow - sysPoint1.flow);
      const opHead = sysPoint1.head + ratio * (sysPoint2.head - sysPoint1.head);
      const opPoint = interpolatePumpCurve(pumpCurve, opFlow);

      if (opPoint) {
        // Validate operating point
        const isValid = opPoint.efficiency >= 50; // Efficiency should be above 50%
        return {
          flow: opFlow,
          head: opHead,
          efficiency: opPoint.efficiency,
          power: opPoint.power,
          isValid,
          message: isValid ? 'Operating point is within efficient range' : 'Operating point has low efficiency',
        };
      }
    }
  }

  return null;
}

// Interpolate pump curve at a given flow
function interpolatePumpCurve(curve: PumpCurvePoint[], flow: number): PumpCurvePoint | null {
  if (curve.length === 0) return null;
  
  // Handle edge cases
  if (flow <= curve[0].flow) return curve[0];
  if (flow >= curve[curve.length - 1].flow) return curve[curve.length - 1];

  // Find surrounding points and interpolate
  for (let i = 0; i < curve.length - 1; i++) {
    if (curve[i].flow <= flow && curve[i + 1].flow >= flow) {
      const ratio = (flow - curve[i].flow) / (curve[i + 1].flow - curve[i].flow);
      return {
        flow,
        head: curve[i].head + ratio * (curve[i + 1].head - curve[i].head),
        efficiency: curve[i].efficiency + ratio * (curve[i + 1].efficiency - curve[i].efficiency),
        power: curve[i].power + ratio * (curve[i + 1].power - curve[i].power),
      };
    }
  }

  return null;
}

// Find best pump for given requirements
export function findBestPump(
  pumps: PumpCurve[],
  requiredFlow: number,
  requiredHead: number
): { pump: PumpCurve; score: number; operatingPoint: OperatingPoint }[] {
  const results: { pump: PumpCurve; score: number; operatingPoint: OperatingPoint }[] = [];

  for (const pump of pumps) {
    // Check if pump can handle the required flow and head
    if (pump.min_flow_gpm && requiredFlow < pump.min_flow_gpm) continue;
    if (pump.max_flow_gpm && requiredFlow > pump.max_flow_gpm) continue;
    if (pump.max_head_ft && requiredHead > pump.max_head_ft) continue;

    // Calculate system curve through the design point
    const systemCurve = calculateSystemCurve(0, requiredFlow, requiredHead);
    const opPoint = findOperatingPoint(pump.curve_data, systemCurve);

    if (opPoint) {
      // Score based on efficiency and margin
      const efficiencyScore = opPoint.efficiency / 100;
      const flowMargin = pump.max_flow_gpm 
        ? 1 - Math.abs(requiredFlow - (pump.max_flow_gpm * 0.7)) / pump.max_flow_gpm 
        : 0.5;
      const score = efficiencyScore * 0.7 + flowMargin * 0.3;

      results.push({ pump, score, operatingPoint: opPoint });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function usePumpCurves() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['pump-curves', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('pump_curves')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('manufacturer', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        ...row,
        curve_data: (Array.isArray(row.curve_data) ? row.curve_data : []) as unknown as PumpCurvePoint[],
        npsh_required: (Array.isArray(row.npsh_required) ? row.npsh_required : []) as unknown as number[],
      })) as PumpCurve[];
    },
    enabled: !!organization?.id,
  });
}

export function usePumpCurve(pumpId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['pump-curve', pumpId],
    queryFn: async () => {
      if (!pumpId) return null;

      const { data, error } = await supabase
        .from('pump_curves')
        .select('*')
        .eq('id', pumpId)
        .single();

      if (error) throw error;

      return {
        ...data,
        curve_data: (Array.isArray(data.curve_data) ? data.curve_data : []) as unknown as PumpCurvePoint[],
        npsh_required: (Array.isArray(data.npsh_required) ? data.npsh_required : []) as unknown as number[],
      } as PumpCurve;
    },
    enabled: !!pumpId && !!organization?.id,
  });
}

export function useCreatePumpCurve() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (data: {
      manufacturer: string;
      model: string;
      pump_type?: string;
      motor_hp?: number;
      rpm?: number;
      min_flow_gpm?: number;
      max_flow_gpm?: number;
      max_head_ft?: number;
      curve_data: PumpCurvePoint[];
      notes?: string;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data: result, error } = await supabase
        .from('pump_curves')
        .insert([{
          organization_id: organization.id,
          manufacturer: data.manufacturer,
          model: data.model,
          pump_type: data.pump_type || 'centrifugal',
          motor_hp: data.motor_hp,
          rpm: data.rpm || 1750,
          min_flow_gpm: data.min_flow_gpm,
          max_flow_gpm: data.max_flow_gpm,
          max_head_ft: data.max_head_ft,
          curve_data: JSON.parse(JSON.stringify(data.curve_data)),
          notes: data.notes,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pump-curves'] });
      toast.success('Pump curve saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeletePumpCurve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pump_curves')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pump-curves'] });
      toast.success('Pump curve deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
