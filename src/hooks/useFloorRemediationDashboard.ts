import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { RemediationRecord, TreatmentApplied } from '@/hooks/useZoneRemediationHistory';

interface RemediationDataInChecklist {
  remediationHistory?: RemediationRecord[];
}

export interface FloorRemediationDashboard {
  // Overview stats
  totalZones: number;
  zonesWithRemediation: number;
  totalRemediations: number;

  // Verification breakdown
  verificationStatus: {
    success: number;
    partial: number;
    failed: number;
    pending: number;
  };
  verificationPercent: number;

  // Improvement metrics
  averageImprovement: number;
  totalImprovementDb: number;

  // Treatment breakdown
  treatmentBreakdown: {
    type: TreatmentApplied['type'];
    label: string;
    count: number;
    totalCost: number;
  }[];

  // Cost summary
  totalEstimatedCost: number;
  totalActualCost: number;

  // Zones pending verification
  pendingZones: {
    zoneId: string;
    zoneName: string;
    treatmentSummary: string;
    installDate: string;
    daysSinceInstall: number;
  }[];

  // Chart data
  zoneComparisonData: {
    zoneId: string;
    zoneName: string;
    beforeNC: number;
    afterNC: number | null;
    targetNC: number;
    status: RemediationRecord['status'] | 'no-remediation';
    improvement: number;
  }[];

  // All remediation records
  allRecords: RemediationRecord[];
}

const treatmentLabels: Record<TreatmentApplied['type'], string> = {
  silencer: 'Silencers',
  'duct-mod': 'Duct Modifications',
  'equipment-change': 'Equipment Changes',
  'acoustic-lining': 'Acoustic Lining',
  'flex-duct': 'Flex Duct Extensions',
};

export function useFloorRemediationDashboard(
  zones: ZoneAcousticData[],
  projectId?: string
) {
  // Fetch all remediation records for the floor's zones
  const zoneIds = zones.map((z) => z.zoneId);

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['floor-remediation-dashboard', projectId, zoneIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissioning_checklists')
        .select('id, equipment_tag, installed_data, commissioning_project_id')
        .eq('checklist_type', 'acoustic');

      if (error) throw error;

      const records: RemediationRecord[] = [];
      for (const checklist of data || []) {
        const installedData = checklist.installed_data as RemediationDataInChecklist | null;
        if (installedData?.remediationHistory) {
          // Filter to zones on this floor
          const floorRecords = installedData.remediationHistory.filter((r) =>
            zoneIds.includes(r.zoneId)
          );
          records.push(...floorRecords);
        }
      }

      return records;
    },
    enabled: zoneIds.length > 0,
  });

  const dashboard = useMemo<FloorRemediationDashboard>(() => {
    // Group records by zone
    const recordsByZone = new Map<string, RemediationRecord[]>();
    for (const record of allRecords) {
      const existing = recordsByZone.get(record.zoneId) || [];
      recordsByZone.set(record.zoneId, [...existing, record]);
    }

    // Calculate verification status
    const verificationStatus = {
      success: allRecords.filter((r) => r.status === 'verified-success').length,
      partial: allRecords.filter((r) => r.status === 'verified-partial').length,
      failed: allRecords.filter((r) => r.status === 'verified-failed').length,
      pending: allRecords.filter((r) => r.status === 'pending-verification').length,
    };

    const verifiedCount =
      verificationStatus.success + verificationStatus.partial + verificationStatus.failed;
    const verificationPercent =
      allRecords.length > 0 ? Math.round((verifiedCount / allRecords.length) * 100) : 0;

    // Calculate improvements
    const recordsWithImprovement = allRecords.filter(
      (r) => r.improvement !== undefined && r.improvement > 0
    );
    const totalImprovementDb = recordsWithImprovement.reduce(
      (sum, r) => sum + (r.improvement || 0),
      0
    );
    const averageImprovement =
      recordsWithImprovement.length > 0
        ? Math.round((totalImprovementDb / recordsWithImprovement.length) * 10) / 10
        : 0;

    // Treatment breakdown
    const treatmentCounts = new Map<TreatmentApplied['type'], { count: number; cost: number }>();
    for (const record of allRecords) {
      for (const treatment of record.treatmentsApplied) {
        const existing = treatmentCounts.get(treatment.type) || { count: 0, cost: 0 };
        treatmentCounts.set(treatment.type, {
          count: existing.count + (treatment.quantity || 1),
          cost: existing.cost + (treatment.cost || 0),
        });
      }
    }

    const treatmentBreakdown = Array.from(treatmentCounts.entries()).map(([type, data]) => ({
      type,
      label: treatmentLabels[type],
      count: data.count,
      totalCost: data.cost,
    }));

    // Costs
    const totalActualCost = allRecords.reduce(
      (sum, r) => sum + r.treatmentsApplied.reduce((tSum, t) => tSum + (t.cost || 0), 0),
      0
    );

    // Pending zones
    const pendingZones = allRecords
      .filter((r) => r.status === 'pending-verification')
      .map((r) => {
        const installDate = new Date(r.remediationDate);
        const now = new Date();
        const daysSinceInstall = Math.floor(
          (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          zoneId: r.zoneId,
          zoneName: r.zoneName,
          treatmentSummary: r.treatmentsApplied.map((t) => t.description).join(', '),
          installDate: r.remediationDate,
          daysSinceInstall,
        };
      })
      .sort((a, b) => b.daysSinceInstall - a.daysSinceInstall);

    // Zone comparison chart data
    const zoneComparisonData = zones.map((zone) => {
      const zoneRecords = recordsByZone.get(zone.zoneId) || [];
      const latestRecord = zoneRecords.sort(
        (a, b) => new Date(b.remediationDate).getTime() - new Date(a.remediationDate).getTime()
      )[0];

      if (!latestRecord) {
        return {
          zoneId: zone.zoneId,
          zoneName: zone.zoneName,
          beforeNC: zone.estimatedNC || zone.targetNC,
          afterNC: null,
          targetNC: zone.targetNC,
          status: 'no-remediation' as const,
          improvement: 0,
        };
      }

      return {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        beforeNC: latestRecord.beforeMeasurement.overallNC,
        afterNC: latestRecord.afterMeasurement?.overallNC || null,
        targetNC: zone.targetNC,
        status: latestRecord.status,
        improvement: latestRecord.improvement || 0,
      };
    });

    return {
      totalZones: zones.length,
      zonesWithRemediation: recordsByZone.size,
      totalRemediations: allRecords.length,
      verificationStatus,
      verificationPercent,
      averageImprovement,
      totalImprovementDb,
      treatmentBreakdown,
      totalEstimatedCost: totalActualCost, // Could be enhanced with estimates
      totalActualCost,
      pendingZones,
      zoneComparisonData,
      allRecords,
    };
  }, [zones, allRecords]);

  return {
    dashboard,
    isLoading,
  };
}
