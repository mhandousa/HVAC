import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EquipmentHealthScore {
  id: string;
  equipment_id: string;
  organization_id: string;
  overall_score: number;
  performance_score: number | null;
  reliability_score: number | null;
  efficiency_score: number | null;
  condition_score: number | null;
  trend: 'improving' | 'stable' | 'declining' | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  predicted_maintenance_date: string | null;
  maintenance_urgency: 'none' | 'routine' | 'soon' | 'urgent' | 'immediate' | null;
  analysis_factors: Record<string, unknown>;
  recommendations: string[];
  sensor_data_summary: Record<string, unknown>;
  last_analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentWithHealth {
  id: string;
  tag: string;
  name: string;
  equipment_type: string | null;
  manufacturer: string | null;
  model: string | null;
  status: string;
  health_score: EquipmentHealthScore | null;
}

export function useEquipmentHealthScores() {
  return useQuery({
    queryKey: ['equipment-health-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_health_scores')
        .select('*')
        .order('overall_score', { ascending: true });

      if (error) throw error;
      return data as EquipmentHealthScore[];
    },
  });
}

export function useEquipmentHealthScore(equipmentId: string | undefined) {
  return useQuery({
    queryKey: ['equipment-health-score', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return null;

      const { data, error } = await supabase
        .from('equipment_health_scores')
        .select('*')
        .eq('equipment_id', equipmentId)
        .maybeSingle();

      if (error) throw error;
      return data as EquipmentHealthScore | null;
    },
    enabled: !!equipmentId,
  });
}

export function useEquipmentWithHealthScores() {
  return useQuery({
    queryKey: ['equipment-with-health'],
    queryFn: async () => {
      // Fetch equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, tag, name, equipment_type, manufacturer, model, status')
        .order('tag');

      if (equipmentError) throw equipmentError;

      // Fetch health scores
      const { data: healthScores, error: healthError } = await supabase
        .from('equipment_health_scores')
        .select('*');

      if (healthError) throw healthError;

      // Merge data
      const healthMap = new Map<string, EquipmentHealthScore>();
      for (const score of healthScores || []) {
        healthMap.set(score.equipment_id, score as EquipmentHealthScore);
      }

      return (equipment || []).map(eq => ({
        ...eq,
        health_score: healthMap.get(eq.id) || null,
      })) as EquipmentWithHealth[];
    },
  });
}

export function useAnalyzeEquipmentHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipmentId: string) => {
      const { data, error } = await supabase.functions.invoke('equipment-health', {
        body: { equipment_id: equipmentId, include_ai_analysis: true },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-health-scores'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-health-score', data.equipment_id] });
      queryClient.invalidateQueries({ queryKey: ['equipment-with-health'] });
      toast.success(`Health analysis complete for ${data.equipment_tag}`);
    },
    onError: (error) => {
      console.error('Health analysis error:', error);
      toast.error('Failed to analyze equipment health');
    },
  });
}

export function useAnalyzeAllEquipmentHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all equipment IDs
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id')
        .eq('status', 'operational');

      if (equipmentError) throw equipmentError;

      const results = [];
      
      // Analyze each equipment (in batches of 3 to avoid rate limits)
      for (let i = 0; i < (equipment || []).length; i += 3) {
        const batch = equipment!.slice(i, i + 3);
        const batchResults = await Promise.all(
          batch.map(async (eq) => {
            try {
              const { data, error } = await supabase.functions.invoke('equipment-health', {
                body: { equipment_id: eq.id, include_ai_analysis: true },
              });
              if (error) return { id: eq.id, success: false, error };
              return { id: eq.id, success: true, data };
            } catch (err) {
              return { id: eq.id, success: false, error: err };
            }
          })
        );
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + 3 < equipment!.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      queryClient.invalidateQueries({ queryKey: ['equipment-health-scores'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-with-health'] });
      toast.success(`Analyzed health for ${successCount} equipment items`);
    },
    onError: (error) => {
      console.error('Bulk health analysis error:', error);
      toast.error('Failed to analyze equipment health');
    },
  });
}

export function getHealthScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 90) return 'text-success';
  if (score >= 70) return 'text-info';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export function getHealthScoreBgColor(score: number | null): string {
  if (score === null) return 'bg-muted';
  if (score >= 90) return 'bg-success/10';
  if (score >= 70) return 'bg-info/10';
  if (score >= 50) return 'bg-warning/10';
  return 'bg-destructive/10';
}

export function getRiskLevelColor(level: string | null): string {
  switch (level) {
    case 'low': return 'text-success';
    case 'medium': return 'text-warning';
    case 'high': return 'text-orange-500';
    case 'critical': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

export function getTrendIcon(trend: string | null): { icon: string; color: string } {
  switch (trend) {
    case 'improving': return { icon: '↑', color: 'text-success' };
    case 'declining': return { icon: '↓', color: 'text-destructive' };
    default: return { icon: '→', color: 'text-muted-foreground' };
  }
}

export function getUrgencyBadgeVariant(urgency: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (urgency) {
    case 'immediate': return 'destructive';
    case 'urgent': return 'destructive';
    case 'soon': return 'default';
    case 'routine': return 'secondary';
    default: return 'outline';
  }
}
