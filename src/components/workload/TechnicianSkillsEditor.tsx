import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Award, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFICIENCY_SKILLS,
  EQUIPMENT_SKILLS,
  PROFICIENCY_LEVELS,
  ProficiencyLevel,
  SkillType,
  TechnicianSkill,
} from '@/lib/technician-skills';
import { useTechnicianSkills, useBulkUpdateSkills } from '@/hooks/useTechnicianSkills';

interface TechnicianSkillsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicianId: string;
  technicianName: string;
}

interface SkillEntry {
  skillType: SkillType;
  skillId: string;
  proficiencyLevel: ProficiencyLevel;
  certifiedAt: string | null;
  enabled: boolean;
}

export function TechnicianSkillsEditor({
  open,
  onOpenChange,
  technicianId,
  technicianName,
}: TechnicianSkillsEditorProps) {
  const { data: existingSkills, isLoading } = useTechnicianSkills(technicianId);
  const bulkUpdate = useBulkUpdateSkills();
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [showAllEquipment, setShowAllEquipment] = useState(false);

  // Initialize skills when data loads
  useEffect(() => {
    if (!existingSkills) return;

    const allSkills: SkillEntry[] = [];

    // Add deficiency skills
    DEFICIENCY_SKILLS.forEach(skill => {
      const existing = existingSkills.find(
        s => s.skillType === 'deficiency_category' && s.skillId === skill.id
      );
      allSkills.push({
        skillType: 'deficiency_category',
        skillId: skill.id,
        proficiencyLevel: existing?.proficiencyLevel ?? 'intermediate',
        certifiedAt: existing?.certifiedAt ?? null,
        enabled: !!existing,
      });
    });

    // Add equipment skills
    EQUIPMENT_SKILLS.forEach(skill => {
      const existing = existingSkills.find(
        s => s.skillType === 'equipment_type' && s.skillId === skill.id
      );
      allSkills.push({
        skillType: 'equipment_type',
        skillId: skill.id,
        proficiencyLevel: existing?.proficiencyLevel ?? 'intermediate',
        certifiedAt: existing?.certifiedAt ?? null,
        enabled: !!existing,
      });
    });

    setSkills(allSkills);
  }, [existingSkills]);

  const toggleSkill = (skillType: SkillType, skillId: string) => {
    setSkills(prev =>
      prev.map(s =>
        s.skillType === skillType && s.skillId === skillId
          ? { ...s, enabled: !s.enabled }
          : s
      )
    );
  };

  const updateProficiency = (skillType: SkillType, skillId: string, level: ProficiencyLevel) => {
    setSkills(prev =>
      prev.map(s =>
        s.skillType === skillType && s.skillId === skillId
          ? { ...s, proficiencyLevel: level }
          : s
      )
    );
  };

  const toggleCertification = (skillType: SkillType, skillId: string) => {
    setSkills(prev =>
      prev.map(s =>
        s.skillType === skillType && s.skillId === skillId
          ? { ...s, certifiedAt: s.certifiedAt ? null : new Date().toISOString() }
          : s
      )
    );
  };

  const handleSave = async () => {
    const enabledSkills = skills
      .filter(s => s.enabled)
      .map(s => ({
        skillType: s.skillType,
        skillId: s.skillId,
        proficiencyLevel: s.proficiencyLevel,
        certifiedAt: s.certifiedAt,
      }));

    try {
      await bulkUpdate.mutateAsync({
        technicianId,
        skills: enabledSkills,
      });
      toast.success('Skills updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update skills');
    }
  };

  const deficiencySkills = skills.filter(s => s.skillType === 'deficiency_category');
  const equipmentSkills = skills.filter(s => s.skillType === 'equipment_type');
  const visibleEquipmentSkills = showAllEquipment ? equipmentSkills : equipmentSkills.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Skills - {technicianName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Deficiency Categories */}
            <div>
              <h4 className="text-sm font-medium mb-3">Deficiency Categories</h4>
              <div className="space-y-2">
                {deficiencySkills.map(skill => {
                  const skillInfo = DEFICIENCY_SKILLS.find(s => s.id === skill.skillId);
                  return (
                    <SkillRow
                      key={`${skill.skillType}-${skill.skillId}`}
                      label={skillInfo?.label ?? skill.skillId}
                      enabled={skill.enabled}
                      proficiencyLevel={skill.proficiencyLevel}
                      certified={!!skill.certifiedAt}
                      onToggle={() => toggleSkill(skill.skillType, skill.skillId)}
                      onProficiencyChange={(level) => updateProficiency(skill.skillType, skill.skillId, level)}
                      onCertificationToggle={() => toggleCertification(skill.skillType, skill.skillId)}
                    />
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Equipment Types */}
            <div>
              <h4 className="text-sm font-medium mb-3">Equipment Specializations</h4>
              <div className="space-y-2">
                {visibleEquipmentSkills.map(skill => {
                  const skillInfo = EQUIPMENT_SKILLS.find(s => s.id === skill.skillId);
                  return (
                    <SkillRow
                      key={`${skill.skillType}-${skill.skillId}`}
                      label={skillInfo?.label ?? skill.skillId}
                      enabled={skill.enabled}
                      proficiencyLevel={skill.proficiencyLevel}
                      certified={!!skill.certifiedAt}
                      onToggle={() => toggleSkill(skill.skillType, skill.skillId)}
                      onProficiencyChange={(level) => updateProficiency(skill.skillType, skill.skillId, level)}
                      onCertificationToggle={() => toggleCertification(skill.skillType, skill.skillId)}
                    />
                  );
                })}
              </div>
              {equipmentSkills.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setShowAllEquipment(!showAllEquipment)}
                >
                  {showAllEquipment ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show {equipmentSkills.length - 6} more equipment types
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SkillRowProps {
  label: string;
  enabled: boolean;
  proficiencyLevel: ProficiencyLevel;
  certified: boolean;
  onToggle: () => void;
  onProficiencyChange: (level: ProficiencyLevel) => void;
  onCertificationToggle: () => void;
}

function SkillRow({
  label,
  enabled,
  proficiencyLevel,
  certified,
  onToggle,
  onProficiencyChange,
  onCertificationToggle,
}: SkillRowProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
      <Checkbox checked={enabled} onCheckedChange={onToggle} />
      <span className={`flex-1 text-sm ${!enabled ? 'text-muted-foreground' : ''}`}>
        {label}
      </span>
      <Select
        value={proficiencyLevel}
        onValueChange={(v) => onProficiencyChange(v as ProficiencyLevel)}
        disabled={!enabled}
      >
        <SelectTrigger className="w-32 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROFICIENCY_LEVELS.map(level => (
            <SelectItem key={level.id} value={level.id}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant={certified ? 'default' : 'outline'}
        size="sm"
        className={`h-8 px-2 ${certified ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
        onClick={onCertificationToggle}
        disabled={!enabled}
      >
        <Award className="h-4 w-4" />
      </Button>
    </div>
  );
}
