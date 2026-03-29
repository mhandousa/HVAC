import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OctaveBandData, calculateNCFromOctaveBands, calculateImprovement } from '@/lib/nc-reference-curves';
import type { Json } from '@/integrations/supabase/types';

export interface TreatmentApplied {
  type: 'silencer' | 'duct-mod' | 'equipment-change' | 'acoustic-lining' | 'flex-duct';
  productModel?: string;
  manufacturer?: string;
  description: string;
  quantity?: number;
  cost?: number;
}

export interface AcousticMeasurement {
  date: string;
  overallNC: number;
  octaveBands?: OctaveBandData;
  measuredBy?: string;
  position?: string;
  notes?: string;
}

export interface RemediationRecord {
  id: string;
  zoneId: string;
  zoneName: string;
  projectId?: string;
  checklistId?: string;
  remediationDate: string;
  treatmentsApplied: TreatmentApplied[];
  beforeMeasurement: AcousticMeasurement;
  afterMeasurement?: AcousticMeasurement;
  targetNC: number;
  improvement?: number;
  status: 'pending-verification' | 'verified-success' | 'verified-partial' | 'verified-failed';
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  photos?: {
    before?: string[];
    after?: string[];
  };
}

export interface RemediationStats {
  totalRemediations: number;
  pendingVerification: number;
  verifiedSuccess: number;
  verifiedPartial: number;
  verifiedFailed: number;
  averageImprovement: number;
  totalCostSar: number;
}

// Store remediation data in commissioning_checklists installed_data JSONB
interface RemediationDataInChecklist {
  remediationHistory?: RemediationRecord[];
}

export function useZoneRemediationHistory(zoneId?: string, projectId?: string) {
  const queryClient = useQueryClient();

  // Query to fetch remediation history from commissioning checklists
  const {
    data: remediationRecords = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['zone-remediation-history', zoneId, projectId],
    queryFn: async () => {
      let query = supabase
        .from('commissioning_checklists')
        .select('id, equipment_tag, installed_data, commissioning_project_id')
        .eq('checklist_type', 'acoustic');

      if (zoneId) {
        // Filter by equipment_tag containing zone reference
        query = query.ilike('equipment_tag', `%${zoneId}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extract remediation records from installed_data
      const records: RemediationRecord[] = [];
      for (const checklist of data || []) {
        const installedData = checklist.installed_data as RemediationDataInChecklist | null;
        if (installedData?.remediationHistory) {
          records.push(...installedData.remediationHistory);
        }
      }

      // Sort by date, newest first
      return records.sort(
        (a, b) => new Date(b.remediationDate).getTime() - new Date(a.remediationDate).getTime()
      );
    },
    enabled: !!zoneId || !!projectId,
  });

  // Calculate statistics
  const stats: RemediationStats = {
    totalRemediations: remediationRecords.length,
    pendingVerification: remediationRecords.filter((r) => r.status === 'pending-verification').length,
    verifiedSuccess: remediationRecords.filter((r) => r.status === 'verified-success').length,
    verifiedPartial: remediationRecords.filter((r) => r.status === 'verified-partial').length,
    verifiedFailed: remediationRecords.filter((r) => r.status === 'verified-failed').length,
    averageImprovement:
      remediationRecords.filter((r) => r.improvement !== undefined).length > 0
        ? remediationRecords
            .filter((r) => r.improvement !== undefined)
            .reduce((sum, r) => sum + (r.improvement || 0), 0) /
          remediationRecords.filter((r) => r.improvement !== undefined).length
        : 0,
    totalCostSar: remediationRecords.reduce(
      (sum, r) =>
        sum + r.treatmentsApplied.reduce((tSum, t) => tSum + (t.cost || 0), 0),
      0
    ),
  };

  // Mutation to add a new remediation record
  const addRemediationRecord = useMutation({
    mutationFn: async ({
      checklistId,
      record,
    }: {
      checklistId: string;
      record: Omit<RemediationRecord, 'id' | 'createdAt' | 'updatedAt'>;
    }) => {
      // Fetch existing checklist data
      const { data: checklist, error: fetchError } = await supabase
        .from('commissioning_checklists')
        .select('installed_data')
        .eq('id', checklistId)
        .single();

      if (fetchError) throw fetchError;

      const existingData = (checklist.installed_data as RemediationDataInChecklist) || {};
      const existingHistory = existingData.remediationHistory || [];

      const newRecord: RemediationRecord = {
        ...record,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedData: RemediationDataInChecklist = {
        ...existingData,
        remediationHistory: [...existingHistory, newRecord],
      };

      const { error: updateError } = await supabase
        .from('commissioning_checklists')
        .update({ installed_data: updatedData as unknown as Json })
        .eq('id', checklistId);

      if (updateError) throw updateError;

      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zone-remediation-history'] });
      toast.success('Remediation record added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add remediation record');
    },
  });

  // Mutation to add after-measurement and calculate improvement
  const recordAfterMeasurement = useMutation({
    mutationFn: async ({
      checklistId,
      recordId,
      afterMeasurement,
    }: {
      checklistId: string;
      recordId: string;
      afterMeasurement: AcousticMeasurement;
    }) => {
      const { data: checklist, error: fetchError } = await supabase
        .from('commissioning_checklists')
        .select('installed_data')
        .eq('id', checklistId)
        .single();

      if (fetchError) throw fetchError;

      const existingData = (checklist.installed_data as RemediationDataInChecklist) || {};
      const history = existingData.remediationHistory || [];

      const recordIndex = history.findIndex((r) => r.id === recordId);
      if (recordIndex === -1) throw new Error('Remediation record not found');

      const record = history[recordIndex];
      const beforeNC = record.beforeMeasurement.overallNC;
      const afterNC = afterMeasurement.overallNC;
      const targetNC = record.targetNC;
      const improvement = beforeNC - afterNC;

      // Determine status
      let status: RemediationRecord['status'];
      if (afterNC <= targetNC) {
        status = 'verified-success';
      } else if (afterNC < beforeNC) {
        status = 'verified-partial';
      } else {
        status = 'verified-failed';
      }

      const updatedRecord: RemediationRecord = {
        ...record,
        afterMeasurement,
        improvement,
        status,
        updatedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
      };

      history[recordIndex] = updatedRecord;

      const updatedData: RemediationDataInChecklist = {
        ...existingData,
        remediationHistory: history,
      };

      const { error: updateError } = await supabase
        .from('commissioning_checklists')
        .update({ installed_data: updatedData as unknown as Json })
        .eq('id', checklistId);

      if (updateError) throw updateError;

      return updatedRecord;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['zone-remediation-history'] });
      if (record.status === 'verified-success') {
        toast.success('Remediation verified - Target NC achieved!');
      } else if (record.status === 'verified-partial') {
        toast.success(`Remediation improved NC by ${record.improvement} dB`);
      } else {
        toast.warning('Remediation did not improve NC levels');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record after measurement');
    },
  });

  return {
    remediationRecords,
    stats,
    isLoading,
    error,
    addRemediationRecord,
    recordAfterMeasurement,
  };
}

// Helper to calculate remediation status
export function calculateRemediationStatus(
  beforeNC: number,
  afterNC: number,
  targetNC: number
): RemediationRecord['status'] {
  if (afterNC <= targetNC) return 'verified-success';
  if (afterNC < beforeNC) return 'verified-partial';
  return 'verified-failed';
}
