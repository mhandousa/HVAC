import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Edit2, GraduationCap } from 'lucide-react';
import { TechnicianSkill, getProficiencyLabel, getSkillLabel, getProficiencyColor } from '@/lib/technician-skills';

interface TechnicianSkillsCardProps {
  skills: TechnicianSkill[];
  onEdit?: () => void;
  compact?: boolean;
}

export function TechnicianSkillsCard({ skills, onEdit, compact = false }: TechnicianSkillsCardProps) {
  const deficiencySkills = skills.filter(s => s.skillType === 'deficiency_category');
  const equipmentSkills = skills.filter(s => s.skillType === 'equipment_type');
  const certifiedCount = skills.filter(s => s.certifiedAt).length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {skills.slice(0, 4).map(skill => (
          <Badge key={skill.id} variant="outline" className="text-xs">
            <span className={getProficiencyColor(skill.proficiencyLevel)}>●</span>
            <span className="ml-1">{getSkillLabel(skill.skillId, skill.skillType)}</span>
          </Badge>
        ))}
        {skills.length > 4 && (
          <Badge variant="secondary" className="text-xs">
            +{skills.length - 4} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Skills & Expertise
          </CardTitle>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 px-2">
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills assigned yet</p>
        ) : (
          <>
            {deficiencySkills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Deficiency Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {deficiencySkills.map(skill => (
                    <SkillBadge key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            )}

            {equipmentSkills.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {equipmentSkills.map(skill => (
                    <SkillBadge key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            )}

            {certifiedCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-2 border-t">
                <Award className="h-4 w-4 text-amber-500" />
                <span>{certifiedCount} certification{certifiedCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SkillBadge({ skill }: { skill: TechnicianSkill }) {
  const label = getSkillLabel(skill.skillId, skill.skillType);
  const proficiency = getProficiencyLabel(skill.proficiencyLevel);
  const color = getProficiencyColor(skill.proficiencyLevel);

  return (
    <Badge variant="outline" className="text-xs gap-1">
      <span className={color}>●</span>
      <span>{label}</span>
      <span className="text-muted-foreground">({proficiency})</span>
      {skill.certifiedAt && <Award className="h-3 w-3 text-amber-500" />}
    </Badge>
  );
}
