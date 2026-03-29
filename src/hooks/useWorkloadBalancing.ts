import { useMemo, useCallback } from 'react';
import { useTechnicianWorkload, TechnicianMetrics, EnrichedAssignment } from './useTechnicianWorkload';
import { useTechnicianAvailability, TechnicianAvailability } from './useTechnicianAvailability';
import { useUpdateAssignment, AssignmentPriority } from './useDeficiencyAssignments';
import { useAllTechnicianSkillsMap } from './useTechnicianSkills';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import {
  TechnicianSkill,
  calculateSkillMatchScore,
  getSkillMatchDetails,
  extractEquipmentTypeFromTag,
} from '@/lib/technician-skills';

export interface WorkloadImbalance {
  overloadedTechnicians: TechnicianMetrics[];
  underutilizedTechnicians: TechnicianAvailability[];
  imbalanceScore: number; // 0-100, higher = more imbalanced
  severity: 'low' | 'medium' | 'high' | 'critical';
  balanceScore: number; // 0-100, higher = more balanced
}

export interface SkillMatchInfo {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ReassignmentSuggestion {
  id: string;
  assignmentId: string;
  fromTechnicianId: string;
  fromTechnicianName: string;
  toTechnicianId: string;
  toTechnicianName: string;
  priority: AssignmentPriority;
  dueDate: string | null;
  reason: string;
  impact: {
    fromUtilizationBefore: number;
    fromUtilizationAfter: number;
    toUtilizationBefore: number;
    toUtilizationAfter: number;
  };
  deficiencyInfo: {
    assignmentId: string;
    status: string;
    equipmentTag?: string;
    categories?: string[];
    equipmentType?: string | null;
  };
  skillMatch: SkillMatchInfo;
}

export interface BalancingResult {
  suggestions: ReassignmentSuggestion[];
  currentImbalance: WorkloadImbalance;
  projectedImbalance: WorkloadImbalance;
}

const CAPACITY_PER_TECHNICIAN = 8; // Default capacity per technician
const OVERLOAD_THRESHOLD = 1.0; // 100% utilization
const UNDERUTILIZED_THRESHOLD = 0.5; // 50% utilization

export function useWorkloadBalancing() {
  const { technicianMetrics, workloadStats, enrichedAssignments } = useTechnicianWorkload();
  
  // Use current month for availability data
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const { technicianAvailability } = useTechnicianAvailability(monthStart, monthEnd);
  const { data: skillsMap } = useAllTechnicianSkillsMap();
  const queryClient = useQueryClient();

  // Calculate utilization rate for a technician
  const getUtilizationRate = useCallback((technician: TechnicianMetrics): number => {
    const activeCount = technician.activeAssignments + technician.inProgressAssignments;
    return activeCount / CAPACITY_PER_TECHNICIAN;
  }, []);

  // Calculate balance score (0-100, higher = more balanced)
  const calculateBalanceScore = useCallback((technicians: TechnicianMetrics[]): number => {
    const activeUtilizations = technicians
      .filter(t => t.totalAssigned > 0)
      .map(t => getUtilizationRate(t));

    if (activeUtilizations.length === 0) return 100;

    // Calculate mean
    const mean = activeUtilizations.reduce((a, b) => a + b, 0) / activeUtilizations.length;

    // Calculate standard deviation
    const variance = activeUtilizations.reduce((sum, u) => sum + Math.pow(u - mean, 2), 0) / activeUtilizations.length;
    const stdDev = Math.sqrt(variance);

    // Calculate overloaded count
    const overloadedCount = technicians.filter(t => getUtilizationRate(t) > OVERLOAD_THRESHOLD).length;

    // Score: 100 - (stdDev * 100) - (overloadedCount * 10)
    const score = Math.max(0, Math.min(100, 100 - (stdDev * 100) - (overloadedCount * 10)));

    return Math.round(score);
  }, [getUtilizationRate]);

  // Analyze current workload imbalance
  const analyzeWorkloadImbalance = useCallback((): WorkloadImbalance => {
    const overloadedTechnicians = technicianMetrics.filter(t => getUtilizationRate(t) > OVERLOAD_THRESHOLD);
    const underutilizedTechnicians = technicianAvailability.filter(t => t.utilizationRate < UNDERUTILIZED_THRESHOLD);
    
    const balanceScore = calculateBalanceScore(technicianMetrics);
    const imbalanceScore = 100 - balanceScore;

    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (imbalanceScore <= 10) severity = 'low';
    else if (imbalanceScore <= 30) severity = 'medium';
    else if (imbalanceScore <= 50) severity = 'high';
    else severity = 'critical';

    return {
      overloadedTechnicians,
      underutilizedTechnicians,
      imbalanceScore,
      severity,
      balanceScore,
    };
  }, [technicianMetrics, technicianAvailability, getUtilizationRate, calculateBalanceScore]);

  // Calculate recipient score based on capacity, skills, and availability
  const calculateRecipientScore = useCallback((
    candidate: TechnicianAvailability,
    categories: string[],
    equipmentType: string | null,
    techSkillsMap: Map<string, TechnicianSkill[]> | undefined
  ): { score: number; skillScore: number } => {
    const skills = techSkillsMap?.get(candidate.id) || [];
    
    // Capacity score (0-50 points) - lower utilization = higher score
    const capacityScore = (1 - candidate.utilizationRate) * 50;
    
    // Skill match score (0-50 points)
    const skillMatchScore = calculateSkillMatchScore(skills, categories, equipmentType);
    const skillScore = skillMatchScore * 0.5;
    
    return {
      score: capacityScore + skillScore,
      skillScore: skillMatchScore,
    };
  }, []);

  // Find best recipient for an assignment
  const findBestRecipient = useCallback((
    assignment: EnrichedAssignment,
    underutilized: TechnicianAvailability[],
    excludeTechnicianId: string,
    categories: string[],
    equipmentType: string | null
  ): { recipient: TechnicianAvailability; skillMatch: SkillMatchInfo } | null => {
    const candidates = underutilized.filter(t => 
      t.id !== excludeTechnicianId && 
      t.isAvailableToday &&
      t.utilizationRate < 0.9 // Less than 90% utilization
    );

    if (candidates.length === 0) return null;

    // Score candidates by capacity + skill match
    const scored = candidates.map(c => {
      const { score, skillScore } = calculateRecipientScore(c, categories, equipmentType, skillsMap);
      const skills = skillsMap?.get(c.id) || [];
      const { matchedSkills, missingSkills } = getSkillMatchDetails(skills, categories, equipmentType);
      
      return {
        candidate: c,
        score,
        skillMatch: {
          score: skillScore,
          matchedSkills,
          missingSkills,
        },
      };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;

    return {
      recipient: scored[0].candidate,
      skillMatch: scored[0].skillMatch,
    };
  }, [skillsMap, calculateRecipientScore]);

  // Generate reassignment reason
  const generateReason = useCallback((fromTech: TechnicianMetrics, toTech: TechnicianAvailability): string => {
    const fromUtil = getUtilizationRate(fromTech);
    const overloadPercent = Math.round((fromUtil - 1) * 100);

    if (overloadPercent > 0) {
      return `Balance workload - ${fromTech.name} is ${overloadPercent}% over capacity`;
    }

    if (fromTech.overdueAssignments > 0) {
      return `Reduce overload - ${fromTech.name} has ${fromTech.overdueAssignments} overdue items`;
    }

    return `Optimize distribution - ${toTech.name} has more availability`;
  }, [getUtilizationRate]);

  // Calculate impact of reassignment
  const calculateImpact = useCallback((
    fromTech: TechnicianMetrics,
    toTech: TechnicianAvailability
  ) => {
    const fromUtilBefore = getUtilizationRate(fromTech);
    const fromUtilAfter = Math.max(0, (fromTech.activeAssignments + fromTech.inProgressAssignments - 1) / CAPACITY_PER_TECHNICIAN);
    
    const toUtilBefore = toTech.utilizationRate;
    const toUtilAfter = Math.min(1.5, (toTech.currentAssignments + 1) / CAPACITY_PER_TECHNICIAN);

    return {
      fromUtilizationBefore: Math.round(fromUtilBefore * 100),
      fromUtilizationAfter: Math.round(fromUtilAfter * 100),
      toUtilizationBefore: Math.round(toUtilBefore * 100),
      toUtilizationAfter: Math.round(toUtilAfter * 100),
    };
  }, [getUtilizationRate]);

  // Generate reassignment suggestions
  const generateReassignmentSuggestions = useCallback((): ReassignmentSuggestion[] => {
    const imbalance = analyzeWorkloadImbalance();
    const suggestions: ReassignmentSuggestion[] = [];

    for (const overloadedTech of imbalance.overloadedTechnicians) {
      // Get reassignable assignments (not in_progress, not urgent)
      const reassignable = overloadedTech.assignments.filter(a =>
        a.status === 'assigned' &&
        a.priority !== 'urgent'
      );

      for (const assignment of reassignable) {
        // Extract skill matching info from assignment
        // In real implementation, these would come from the photo_metadata/deficiency data
        const categories = (assignment as any).deficiencyCategories || ['installation'];
        const equipmentTag = (assignment as any).equipmentTag || null;
        const equipmentType = extractEquipmentTypeFromTag(equipmentTag);

        const result = findBestRecipient(
          assignment, 
          imbalance.underutilizedTechnicians, 
          overloadedTech.id,
          categories,
          equipmentType
        );

        if (result) {
          suggestions.push({
            id: `${assignment.id}-to-${result.recipient.id}`,
            assignmentId: assignment.id,
            fromTechnicianId: overloadedTech.id,
            fromTechnicianName: overloadedTech.name,
            toTechnicianId: result.recipient.id,
            toTechnicianName: result.recipient.name,
            priority: assignment.priority,
            dueDate: assignment.dueDate,
            reason: generateReason(overloadedTech, result.recipient),
            impact: calculateImpact(overloadedTech, result.recipient),
            deficiencyInfo: {
              assignmentId: assignment.id,
              status: assignment.status,
              equipmentTag,
              categories,
              equipmentType,
            },
            skillMatch: result.skillMatch,
          });
        }
      }
    }

    // Sort by combined score (skill match + impact improvement)
    return suggestions.sort((a, b) => {
      const impactA = a.impact.fromUtilizationBefore - a.impact.fromUtilizationAfter;
      const impactB = b.impact.fromUtilizationBefore - b.impact.fromUtilizationAfter;
      const skillA = a.skillMatch.score;
      const skillB = b.skillMatch.score;
      // Weight: 60% impact, 40% skill match
      return (impactB * 0.6 + skillB * 0.4) - (impactA * 0.6 + skillA * 0.4);
    }).slice(0, 10); // Limit to top 10 suggestions
  }, [analyzeWorkloadImbalance, findBestRecipient, generateReason, calculateImpact]);

  // Calculate projected imbalance after applying suggestions
  const calculateProjectedImbalance = useCallback((suggestions: ReassignmentSuggestion[]): WorkloadImbalance => {
    // Create a copy of metrics with projected changes
    const projectedMetrics = technicianMetrics.map(t => ({
      ...t,
      activeAssignments: t.activeAssignments,
    }));

    suggestions.forEach(s => {
      const fromIdx = projectedMetrics.findIndex(t => t.id === s.fromTechnicianId);
      const toIdx = projectedMetrics.findIndex(t => t.id === s.toTechnicianId);

      if (fromIdx !== -1) {
        projectedMetrics[fromIdx] = {
          ...projectedMetrics[fromIdx],
          activeAssignments: Math.max(0, projectedMetrics[fromIdx].activeAssignments - 1),
        };
      }
      if (toIdx !== -1) {
        projectedMetrics[toIdx] = {
          ...projectedMetrics[toIdx],
          activeAssignments: projectedMetrics[toIdx].activeAssignments + 1,
        };
      }
    });

    const projectedOverloaded = projectedMetrics.filter(t => getUtilizationRate(t) > OVERLOAD_THRESHOLD);
    const projectedUnderutilized = technicianAvailability.filter(t => {
      const projectedTech = projectedMetrics.find(pt => pt.id === t.id);
      if (!projectedTech) return t.utilizationRate < UNDERUTILIZED_THRESHOLD;
      const projectedUtil = (projectedTech.activeAssignments + projectedTech.inProgressAssignments) / CAPACITY_PER_TECHNICIAN;
      return projectedUtil < UNDERUTILIZED_THRESHOLD;
    });

    const projectedBalance = calculateBalanceScore(projectedMetrics);

    let severity: 'low' | 'medium' | 'high' | 'critical';
    const imbalanceScore = 100 - projectedBalance;
    if (imbalanceScore <= 10) severity = 'low';
    else if (imbalanceScore <= 30) severity = 'medium';
    else if (imbalanceScore <= 50) severity = 'high';
    else severity = 'critical';

    return {
      overloadedTechnicians: projectedOverloaded,
      underutilizedTechnicians: projectedUnderutilized,
      imbalanceScore,
      severity,
      balanceScore: projectedBalance,
    };
  }, [technicianMetrics, technicianAvailability, getUtilizationRate, calculateBalanceScore]);

  // Get full balancing result
  const balancingResult = useMemo((): BalancingResult => {
    const suggestions = generateReassignmentSuggestions();
    const currentImbalance = analyzeWorkloadImbalance();
    const projectedImbalance = calculateProjectedImbalance(suggestions);

    return {
      suggestions,
      currentImbalance,
      projectedImbalance,
    };
  }, [generateReassignmentSuggestions, analyzeWorkloadImbalance, calculateProjectedImbalance]);

  return {
    balancingResult,
    analyzeWorkloadImbalance,
    generateReassignmentSuggestions,
    calculateBalanceScore: () => calculateBalanceScore(technicianMetrics),
    getOverloadedTechnicians: () => technicianMetrics.filter(t => getUtilizationRate(t) > OVERLOAD_THRESHOLD),
    getUnderutilizedTechnicians: () => technicianAvailability.filter(t => t.utilizationRate < UNDERUTILIZED_THRESHOLD),
  };
}

export function useApplyReassignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestion: ReassignmentSuggestion) => {
      const { data, error } = await supabase
        .from('deficiency_assignments')
        .update({
          assigned_to: suggestion.toTechnicianId,
        })
        .eq('id', suggestion.assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deficiency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['deficiency-dashboard'] });
    },
  });
}

export function useBatchReassignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestions: ReassignmentSuggestion[]) => {
      const results = await Promise.all(
        suggestions.map(async (suggestion) => {
          const { data, error } = await supabase
            .from('deficiency_assignments')
            .update({
              assigned_to: suggestion.toTechnicianId,
            })
            .eq('id', suggestion.assignmentId)
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deficiency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['deficiency-dashboard'] });
    },
  });
}
