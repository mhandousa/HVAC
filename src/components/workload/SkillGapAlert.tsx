import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillGap } from '@/hooks/useSkillsMatrix';
import { cn } from '@/lib/utils';

interface SkillGapAlertProps {
  gaps: SkillGap[];
  maxVisible?: number;
}

export function SkillGapAlert({ gaps, maxVisible = 3 }: SkillGapAlertProps) {
  const [expanded, setExpanded] = useState(false);

  if (gaps.length === 0) return null;

  const criticalGaps = gaps.filter(g => g.coverage < 30);
  const warningGaps = gaps.filter(g => g.coverage >= 30 && g.coverage < 50);

  const visibleGaps = expanded ? gaps : gaps.slice(0, maxVisible);
  const hasMore = gaps.length > maxVisible;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Skill Gaps Detected
        <Badge variant="destructive" className="text-xs">
          {gaps.length} {gaps.length === 1 ? 'skill' : 'skills'}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">
          The following skills have less than 50% team coverage:
        </p>
        <ul className="space-y-2">
          {visibleGaps.map((gap) => (
            <li key={`${gap.skillType}:${gap.skillId}`} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  gap.coverage < 30 ? 'bg-destructive' : 'bg-amber-500'
                )}
              />
              <span className="font-medium">{gap.label}</span>
              <span className="text-muted-foreground">
                ({Math.round(gap.coverage)}% coverage — {gap.technicianCount} of {gap.totalTechnicians} technicians)
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  gap.skillType === 'deficiency_category' 
                    ? 'border-purple-500/30 text-purple-600 dark:text-purple-400' 
                    : 'border-blue-500/30 text-blue-600 dark:text-blue-400'
                )}
              >
                {gap.skillType === 'deficiency_category' ? 'Deficiency' : 'Equipment'}
              </Badge>
            </li>
          ))}
        </ul>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Show {gaps.length - maxVisible} more
              </>
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
