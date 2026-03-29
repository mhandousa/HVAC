import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AnalysisType = 'fault-detection' | 'energy-analysis' | 'maintenance-prediction' | 'general';

interface AnalysisResult {
  success: boolean;
  type: AnalysisType;
  result: unknown;
}

export function useHVACAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (
    type: AnalysisType,
    data: Record<string, unknown>,
    context?: string
  ): Promise<AnalysisResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('hvac-ai', {
        body: { type, data, context },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return result as AnalysisResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI analysis failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const detectFaults = async (sensorData: Record<string, unknown>, context?: string) => {
    return analyze('fault-detection', sensorData, context);
  };

  const analyzeEnergy = async (energyData: Record<string, unknown>, context?: string) => {
    return analyze('energy-analysis', energyData, context);
  };

  const predictMaintenance = async (equipmentData: Record<string, unknown>, context?: string) => {
    return analyze('maintenance-prediction', equipmentData, context);
  };

  const askGeneral = async (question: string) => {
    return analyze('general', { question } as Record<string, unknown>);
  };

  return {
    isLoading,
    error,
    detectFaults,
    analyzeEnergy,
    predictMaintenance,
    askGeneral,
  };
}
