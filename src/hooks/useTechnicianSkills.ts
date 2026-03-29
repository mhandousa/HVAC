import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { TechnicianSkill, SkillType, ProficiencyLevel } from '@/lib/technician-skills';

interface TechnicianSkillRow {
  id: string;
  technician_id: string;
  organization_id: string;
  skill_type: string;
  skill_id: string;
  proficiency_level: string;
  certified_at: string | null;
  certification_expiry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToSkill(row: TechnicianSkillRow): TechnicianSkill {
  return {
    id: row.id,
    technicianId: row.technician_id,
    organizationId: row.organization_id,
    skillType: row.skill_type as SkillType,
    skillId: row.skill_id,
    proficiencyLevel: row.proficiency_level as ProficiencyLevel,
    certifiedAt: row.certified_at,
    certificationExpiry: row.certification_expiry,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useTechnicianSkills(technicianId?: string) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['technician-skills', organization?.id, technicianId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('technician_skills')
        .select('*')
        .eq('organization_id', organization.id);

      if (technicianId) {
        query = query.eq('technician_id', technicianId);
      }

      const { data, error } = await query.order('skill_type').order('skill_id');

      if (error) throw error;
      return (data as TechnicianSkillRow[]).map(mapRowToSkill);
    },
    enabled: !!organization?.id,
  });
}

export function useAllTechnicianSkillsMap() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ['technician-skills-map', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return new Map<string, TechnicianSkill[]>();

      const { data, error } = await supabase
        .from('technician_skills')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) throw error;

      const skillsMap = new Map<string, TechnicianSkill[]>();
      (data as TechnicianSkillRow[]).forEach(row => {
        const skill = mapRowToSkill(row);
        const existing = skillsMap.get(skill.technicianId) || [];
        existing.push(skill);
        skillsMap.set(skill.technicianId, existing);
      });

      return skillsMap;
    },
    enabled: !!organization?.id,
  });
}

export function useAddTechnicianSkill() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (skill: {
      technicianId: string;
      skillType: SkillType;
      skillId: string;
      proficiencyLevel: ProficiencyLevel;
      certifiedAt?: string | null;
      certificationExpiry?: string | null;
      notes?: string | null;
    }) => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('technician_skills')
        .insert({
          technician_id: skill.technicianId,
          organization_id: organization.id,
          skill_type: skill.skillType,
          skill_id: skill.skillId,
          proficiency_level: skill.proficiencyLevel,
          certified_at: skill.certifiedAt,
          certification_expiry: skill.certificationExpiry,
          notes: skill.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToSkill(data as TechnicianSkillRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-skills'] });
      queryClient.invalidateQueries({ queryKey: ['technician-skills-map'] });
    },
  });
}

export function useUpdateTechnicianSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      proficiencyLevel,
      certifiedAt,
      certificationExpiry,
      notes,
    }: {
      id: string;
      proficiencyLevel?: ProficiencyLevel;
      certifiedAt?: string | null;
      certificationExpiry?: string | null;
      notes?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (proficiencyLevel !== undefined) updates.proficiency_level = proficiencyLevel;
      if (certifiedAt !== undefined) updates.certified_at = certifiedAt;
      if (certificationExpiry !== undefined) updates.certification_expiry = certificationExpiry;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await supabase
        .from('technician_skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToSkill(data as TechnicianSkillRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-skills'] });
      queryClient.invalidateQueries({ queryKey: ['technician-skills-map'] });
    },
  });
}

export function useRemoveTechnicianSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('technician_skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-skills'] });
      queryClient.invalidateQueries({ queryKey: ['technician-skills-map'] });
    },
  });
}

export function useBulkUpdateSkills() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async ({
      technicianId,
      skills,
    }: {
      technicianId: string;
      skills: {
        skillType: SkillType;
        skillId: string;
        proficiencyLevel: ProficiencyLevel;
        certifiedAt?: string | null;
      }[];
    }) => {
      if (!organization?.id) throw new Error('No organization');

      // First, delete all existing skills for this technician
      const { error: deleteError } = await supabase
        .from('technician_skills')
        .delete()
        .eq('technician_id', technicianId)
        .eq('organization_id', organization.id);

      if (deleteError) throw deleteError;

      // Then insert new skills
      if (skills.length > 0) {
        const { error: insertError } = await supabase
          .from('technician_skills')
          .insert(
            skills.map(s => ({
              technician_id: technicianId,
              organization_id: organization.id,
              skill_type: s.skillType,
              skill_id: s.skillId,
              proficiency_level: s.proficiencyLevel,
              certified_at: s.certifiedAt,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-skills'] });
      queryClient.invalidateQueries({ queryKey: ['technician-skills-map'] });
    },
  });
}
