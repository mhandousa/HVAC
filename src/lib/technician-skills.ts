// Skill type definitions
export type SkillType = 'deficiency_category' | 'equipment_type';
export type ProficiencyLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface TechnicianSkill {
  id: string;
  technicianId: string;
  organizationId: string;
  skillType: SkillType;
  skillId: string;
  proficiencyLevel: ProficiencyLevel;
  certifiedAt: string | null;
  certificationExpiry: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Deficiency category skills (matching deficiency-types.ts categories)
export const DEFICIENCY_SKILLS = [
  { id: 'installation', label: 'Installation Errors', icon: 'Wrench' },
  { id: 'missing_component', label: 'Missing Components', icon: 'Package' },
  { id: 'damage', label: 'Damage Repair', icon: 'AlertTriangle' },
  { id: 'performance', label: 'Performance Issues', icon: 'Activity' },
  { id: 'documentation', label: 'Documentation', icon: 'FileText' },
  { id: 'safety', label: 'Safety Issues', icon: 'ShieldAlert' },
  { id: 'code_violation', label: 'Code Violations', icon: 'Scale' },
  { id: 'commissioning', label: 'Commissioning', icon: 'CheckSquare' },
] as const;

// Equipment type skills
export const EQUIPMENT_SKILLS = [
  { id: 'ahu', label: 'Air Handling Units (AHU)', icon: 'Wind' },
  { id: 'fcu', label: 'Fan Coil Units (FCU)', icon: 'Fan' },
  { id: 'erv', label: 'Energy Recovery (ERV/HRV)', icon: 'Recycle' },
  { id: 'vav', label: 'VAV Systems', icon: 'Gauge' },
  { id: 'chiller', label: 'Chillers', icon: 'Thermometer' },
  { id: 'cooling_tower', label: 'Cooling Towers', icon: 'Droplets' },
  { id: 'pump', label: 'Pumps', icon: 'Zap' },
  { id: 'vrf', label: 'VRF/VRV Systems', icon: 'Network' },
  { id: 'boiler', label: 'Boilers', icon: 'Flame' },
  { id: 'fan', label: 'Fans & Blowers', icon: 'Wind' },
  { id: 'split', label: 'Split/DX Systems', icon: 'Snowflake' },
  { id: 'controls', label: 'BAS/Controls', icon: 'Cpu' },
  { id: 'ductwork', label: 'Ductwork', icon: 'ArrowRightLeft' },
  { id: 'piping', label: 'Piping Systems', icon: 'GitBranch' },
  { id: 'insulation', label: 'Insulation', icon: 'Layers' },
] as const;

export const PROFICIENCY_LEVELS: { id: ProficiencyLevel; label: string; score: number; color: string }[] = [
  { id: 'basic', label: 'Basic', score: 0.25, color: 'text-muted-foreground' },
  { id: 'intermediate', label: 'Intermediate', score: 0.5, color: 'text-yellow-600' },
  { id: 'advanced', label: 'Advanced', score: 0.75, color: 'text-blue-600' },
  { id: 'expert', label: 'Expert', score: 1.0, color: 'text-green-600' },
];

export function getProficiencyScore(level: ProficiencyLevel): number {
  const found = PROFICIENCY_LEVELS.find(p => p.id === level);
  return found?.score ?? 0.5;
}

export function getProficiencyLabel(level: ProficiencyLevel): string {
  const found = PROFICIENCY_LEVELS.find(p => p.id === level);
  return found?.label ?? 'Unknown';
}

export function getProficiencyColor(level: ProficiencyLevel): string {
  const found = PROFICIENCY_LEVELS.find(p => p.id === level);
  return found?.color ?? 'text-muted-foreground';
}

export function getSkillLabel(skillId: string, skillType: SkillType): string {
  if (skillType === 'deficiency_category') {
    const skill = DEFICIENCY_SKILLS.find(s => s.id === skillId);
    return skill?.label ?? skillId;
  } else {
    const skill = EQUIPMENT_SKILLS.find(s => s.id === skillId);
    return skill?.label ?? skillId;
  }
}

// Calculate skill match score (0-100)
export function calculateSkillMatchScore(
  technicianSkills: TechnicianSkill[],
  deficiencyCategories: string[],
  equipmentType: string | null
): number {
  let totalScore = 0;
  let maxPossible = 0;

  // Check deficiency category matches
  deficiencyCategories.forEach(category => {
    maxPossible += 1;
    const skill = technicianSkills.find(
      s => s.skillType === 'deficiency_category' && s.skillId === category
    );
    if (skill) {
      totalScore += getProficiencyScore(skill.proficiencyLevel);
    }
  });

  // Check equipment type match
  if (equipmentType) {
    maxPossible += 1;
    const skill = technicianSkills.find(
      s => s.skillType === 'equipment_type' && s.skillId === equipmentType
    );
    if (skill) {
      totalScore += getProficiencyScore(skill.proficiencyLevel);
    }
  }

  // If no specific requirements, return neutral score
  if (maxPossible === 0) return 50;

  return Math.round((totalScore / maxPossible) * 100);
}

// Extract equipment type from equipment tag (e.g., "AHU-01" -> "ahu")
export function extractEquipmentTypeFromTag(tag: string | null): string | null {
  if (!tag) return null;
  
  const prefix = tag.split('-')[0]?.toLowerCase();
  
  const mappings: Record<string, string> = {
    'ahu': 'ahu',
    'fcu': 'fcu',
    'erv': 'erv',
    'hrv': 'erv',
    'vav': 'vav',
    'ch': 'chiller',
    'chl': 'chiller',
    'ct': 'cooling_tower',
    'cwp': 'pump',
    'chwp': 'pump',
    'pump': 'pump',
    'vrf': 'vrf',
    'vrv': 'vrf',
    'blr': 'boiler',
    'ef': 'fan',
    'sf': 'fan',
    'rf': 'fan',
    'fan': 'fan',
    'split': 'split',
    'dx': 'split',
    'bas': 'controls',
    'ddc': 'controls',
  };

  return mappings[prefix] ?? null;
}

// Get matched and missing skills for a deficiency assignment
export function getSkillMatchDetails(
  technicianSkills: TechnicianSkill[],
  deficiencyCategories: string[],
  equipmentType: string | null
): { matchedSkills: string[]; missingSkills: string[] } {
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  deficiencyCategories.forEach(category => {
    const skill = technicianSkills.find(
      s => s.skillType === 'deficiency_category' && s.skillId === category
    );
    const label = getSkillLabel(category, 'deficiency_category');
    if (skill) {
      matchedSkills.push(label);
    } else {
      missingSkills.push(label);
    }
  });

  if (equipmentType) {
    const skill = technicianSkills.find(
      s => s.skillType === 'equipment_type' && s.skillId === equipmentType
    );
    const label = getSkillLabel(equipmentType, 'equipment_type');
    if (skill) {
      matchedSkills.push(label);
    } else {
      missingSkills.push(label);
    }
  }

  return { matchedSkills, missingSkills };
}
