import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Calendar, 
  User, 
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type CommissioningProject = Tables<'commissioning_projects'>;

interface CommissioningProjectListProps {
  projects: CommissioningProject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CommissioningProjectList({ 
  projects, 
  selectedId, 
  onSelect 
}: CommissioningProjectListProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'Completed', 
          variant: 'default' as const, 
          icon: CheckCircle2,
          color: 'text-green-600'
        };
      case 'in_progress':
        return { 
          label: 'In Progress', 
          variant: 'secondary' as const, 
          icon: Clock,
          color: 'text-yellow-600'
        };
      case 'draft':
        return { 
          label: 'Draft', 
          variant: 'outline' as const, 
          icon: AlertCircle,
          color: 'text-muted-foreground'
        };
      default:
        return { 
          label: status, 
          variant: 'outline' as const, 
          icon: AlertCircle,
          color: 'text-muted-foreground'
        };
    }
  };

  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const statusConfig = getStatusConfig(project.status);
        const StatusIcon = statusConfig.icon;
        const isSelected = project.id === selectedId;

        return (
          <Card 
            key={project.id} 
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50',
              isSelected && 'border-primary ring-1 ring-primary'
            )}
            onClick={() => onSelect(project.id)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'h-12 w-12 rounded-full flex items-center justify-center',
                    project.status === 'completed' ? 'bg-green-100' :
                    project.status === 'in_progress' ? 'bg-yellow-100' :
                    'bg-muted'
                  )}>
                    <StatusIcon className={cn('h-6 w-6', statusConfig.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {project.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Started {format(new Date(project.start_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {project.contractor_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {project.contractor_name}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                  <ChevronRight className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform',
                    isSelected && 'text-primary rotate-90'
                  )} />
                </div>
              </div>

              {project.target_completion_date && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Start: {project.start_date ? format(new Date(project.start_date), 'MMM d') : 'TBD'}</span>
                    <span>Target: {format(new Date(project.target_completion_date), 'MMM d, yyyy')}</span>
                  </div>
                  <Progress 
                    value={project.status === 'completed' ? 100 : 
                           project.status === 'in_progress' ? 50 : 10} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
