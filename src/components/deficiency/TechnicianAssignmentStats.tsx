import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDeficiencyAssignments } from '@/hooks/useDeficiencyAssignments';
import { Users, AlertCircle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

interface TechnicianAssignmentStatsProps {
  totalUnassigned: number;
  onTechnicianClick?: (technicianId: string) => void;
  selectedTechnicianId?: string;
}

export function TechnicianAssignmentStats({
  totalUnassigned,
  onTechnicianClick,
  selectedTechnicianId,
}: TechnicianAssignmentStatsProps) {
  const { getAssignmentStats } = useDeficiencyAssignments();
  const stats = getAssignmentStats();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalAssigned = stats.reduce((sum, s) => sum + s.assigned, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Assignments by Technician
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Unassigned */}
        <div
          className="flex items-center gap-3 p-2 rounded-md bg-muted/50 border border-border cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={() => onTechnicianClick?.('unassigned')}
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Unassigned</p>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </div>
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            {totalUnassigned}
          </Badge>
        </div>

        {/* Technicians */}
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No assignments yet
          </p>
        ) : (
          stats.slice(0, 5).map((tech) => {
            const resolvedPercent = tech.assigned > 0
              ? Math.round((tech.resolved / tech.assigned) * 100)
              : 0;

            return (
              <div
                key={tech.id}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  selectedTechnicianId === tech.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onTechnicianClick?.(tech.id)}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={tech.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(tech.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tech.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={resolvedPercent} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">
                      {resolvedPercent}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium">{tech.assigned - tech.resolved}</span>
                  </div>
                  {tech.overdue > 0 && (
                    <Badge variant="outline" className="text-xs h-5 bg-destructive/10 text-destructive border-destructive/20">
                      {tech.overdue} overdue
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Summary */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {stats.reduce((sum, s) => sum + s.resolved, 0)} resolved
          </span>
          <span>
            {totalAssigned} total assigned
          </span>
        </div>

        {/* View Full Dashboard Link */}
        <Button variant="outline" size="sm" className="w-full gap-2" asChild>
          <Link to="/technician-workload">
            <ExternalLink className="w-3 h-3" />
            View Full Dashboard
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
