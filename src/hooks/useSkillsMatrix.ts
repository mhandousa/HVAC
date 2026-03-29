import { useMemo } from 'react';
import { useTechnicians, Technician } from './useTechnicians';
import { useAllTechnicianSkillsMap } from './useTechnicianSkills';
import {
  SkillType,
  ProficiencyLevel,
  TechnicianSkill,
  DEFICIENCY_SKILLS,
  EQUIPMENT_SKILLS,
  getProficiencyScore,
  getSkillLabel,
} from '@/lib/technician-skills';

export interface SkillDefinition {
  id: string;
  label: string;
  type: SkillType;
}

export interface MatrixCell {
  level: ProficiencyLevel | null;
  certified: boolean;
  certificationExpiry: string | null;
}

export interface SkillCoverage {
  count: number;
  percentage: number;
  avgProficiency: number;
}

export interface SkillGap {
  skillId: string;
  skillType: SkillType;
  label: string;
  coverage: number;
  technicianCount: number;
  totalTechnicians: number;
}

export interface SkillsMatrixStats {
  totalSkills: number;
  avgCoverage: number;
  criticalGaps: number;
  totalCertifications: number;
  techniciansWithSkills: number;
  totalTechnicians: number;
}

export interface SkillsMatrixData {
  technicians: Technician[];
  skills: SkillDefinition[];
  matrix: Map<string, Map<string, MatrixCell>>;
  coverage: Map<string, SkillCoverage>;
  gaps: SkillGap[];
  stats: SkillsMatrixStats;
  isLoading: boolean;
}

export function useSkillsMatrix(skillType?: SkillType): SkillsMatrixData {
  const { data: technicians = [], isLoading: techLoading } = useTechnicians();
  const { data: skillsMap = new Map(), isLoading: skillsLoading } = useAllTechnicianSkillsMap();

  const skills = useMemo<SkillDefinition[]>(() => {
    if (skillType === 'deficiency_category') {
      return DEFICIENCY_SKILLS.map(s => ({ id: s.id, label: s.label, type: 'deficiency_category' as SkillType }));
    } else if (skillType === 'equipment_type') {
      return EQUIPMENT_SKILLS.map(s => ({ id: s.id, label: s.label, type: 'equipment_type' as SkillType }));
    }
    // Return all skills
    return [
      ...DEFICIENCY_SKILLS.map(s => ({ id: s.id, label: s.label, type: 'deficiency_category' as SkillType })),
      ...EQUIPMENT_SKILLS.map(s => ({ id: s.id, label: s.label, type: 'equipment_type' as SkillType })),
    ];
  }, [skillType]);

  const matrix = useMemo(() => {
    const result = new Map<string, Map<string, MatrixCell>>();

    technicians.forEach(tech => {
      const techSkills = skillsMap.get(tech.id) || [];
      const skillMap = new Map<string, MatrixCell>();

      skills.forEach(skill => {
        const techSkill = techSkills.find(
          ts => ts.skillId === skill.id && ts.skillType === skill.type
        );

        if (techSkill) {
          skillMap.set(`${skill.type}:${skill.id}`, {
            level: techSkill.proficiencyLevel,
            certified: !!techSkill.certifiedAt,
            certificationExpiry: techSkill.certificationExpiry,
          });
        } else {
          skillMap.set(`${skill.type}:${skill.id}`, {
            level: null,
            certified: false,
            certificationExpiry: null,
          });
        }
      });

      result.set(tech.id, skillMap);
    });

    return result;
  }, [technicians, skillsMap, skills]);

  const coverage = useMemo(() => {
    const result = new Map<string, SkillCoverage>();

    skills.forEach(skill => {
      const key = `${skill.type}:${skill.id}`;
      let count = 0;
      let totalProficiency = 0;

      technicians.forEach(tech => {
        const techMatrix = matrix.get(tech.id);
        const cell = techMatrix?.get(key);
        if (cell?.level) {
          count++;
          totalProficiency += getProficiencyScore(cell.level);
        }
      });

      result.set(key, {
        count,
        percentage: technicians.length > 0 ? (count / technicians.length) * 100 : 0,
        avgProficiency: count > 0 ? (totalProficiency / count) * 100 : 0,
      });
    });

    return result;
  }, [skills, technicians, matrix]);

  const gaps = useMemo<SkillGap[]>(() => {
    const gapThreshold = 50; // Less than 50% coverage is a gap
    const result: SkillGap[] = [];

    skills.forEach(skill => {
      const key = `${skill.type}:${skill.id}`;
      const cov = coverage.get(key);
      if (cov && cov.percentage < gapThreshold) {
        result.push({
          skillId: skill.id,
          skillType: skill.type,
          label: skill.label,
          coverage: cov.percentage,
          technicianCount: cov.count,
          totalTechnicians: technicians.length,
        });
      }
    });

    // Sort by coverage (lowest first)
    return result.sort((a, b) => a.coverage - b.coverage);
  }, [skills, coverage, technicians.length]);

  const stats = useMemo<SkillsMatrixStats>(() => {
    let totalCoverage = 0;
    let totalCertifications = 0;
    const techniciansWithSkillsSet = new Set<string>();

    coverage.forEach(cov => {
      totalCoverage += cov.percentage;
    });

    technicians.forEach(tech => {
      const techSkills = skillsMap.get(tech.id) || [];
      if (techSkills.length > 0) {
        techniciansWithSkillsSet.add(tech.id);
      }
      techSkills.forEach(skill => {
        if (skill.certifiedAt) {
          totalCertifications++;
        }
      });
    });

    return {
      totalSkills: skills.length,
      avgCoverage: skills.length > 0 ? totalCoverage / skills.length : 0,
      criticalGaps: gaps.filter(g => g.coverage < 30).length, // Critical if below 30%
      totalCertifications,
      techniciansWithSkills: techniciansWithSkillsSet.size,
      totalTechnicians: technicians.length,
    };
  }, [skills, coverage, gaps, technicians, skillsMap]);

  return {
    technicians,
    skills,
    matrix,
    coverage,
    gaps,
    stats,
    isLoading: techLoading || skillsLoading,
  };
}
