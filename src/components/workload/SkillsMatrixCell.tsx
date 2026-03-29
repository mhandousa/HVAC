import { cn } from '@/lib/utils';
import { ProficiencyLevel } from '@/lib/technician-skills';
import { Award } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SkillsMatrixCellProps {
  level: ProficiencyLevel | null;
  certified: boolean;
  certificationExpiry: string | null;
  onClick?: () => void;
  editable?: boolean;
}

const LEVEL_CONFIG: Record<ProficiencyLevel, { label: string; abbrev: string; bg: string; text: string }> = {
  basic: { label: 'Basic', abbrev: 'BAS', bg: 'bg-muted', text: 'text-muted-foreground' },
  intermediate: { label: 'Intermediate', abbrev: 'INT', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  advanced: { label: 'Advanced', abbrev: 'ADV', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  expert: { label: 'Expert', abbrev: 'EXP', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
};

export function SkillsMatrixCell({
  level,
  certified,
  certificationExpiry,
  onClick,
  editable = false,
}: SkillsMatrixCellProps) {
  const config = level ? LEVEL_CONFIG[level] : null;
  
  const isExpired = certificationExpiry && new Date(certificationExpiry) < new Date();
  const isExpiringSoon = certificationExpiry && !isExpired && 
    new Date(certificationExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const cellContent = (
    <div
      className={cn(
        'relative w-14 h-10 flex items-center justify-center rounded-md text-xs font-medium transition-all',
        config ? config.bg : 'bg-muted/30 border border-dashed border-muted-foreground/20',
        config ? config.text : 'text-muted-foreground/40',
        editable && 'cursor-pointer hover:ring-2 hover:ring-primary/50',
      )}
      onClick={onClick}
    >
      {config ? config.abbrev : '—'}
      {certified && (
        <Award
          className={cn(
            'absolute -top-1 -right-1 w-3.5 h-3.5',
            isExpired ? 'text-destructive' : isExpiringSoon ? 'text-amber-500' : 'text-amber-500'
          )}
        />
      )}
    </div>
  );

  if (!level && !certified) {
    return cellContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {cellContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{config?.label ?? 'No skill'}</p>
            {certified && (
              <p className={cn(
                'text-xs',
                isExpired ? 'text-destructive' : isExpiringSoon ? 'text-amber-500' : 'text-muted-foreground'
              )}>
                {isExpired 
                  ? 'Certification expired'
                  : isExpiringSoon
                  ? 'Certification expiring soon'
                  : 'Certified'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
