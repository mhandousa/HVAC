import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeficiencyItem } from '@/hooks/useDeficiencyDashboard';
import { DeficiencyAssignment } from '@/hooks/useDeficiencyAssignments';
import { getTagLabel, getSeverityInfo } from '@/lib/deficiency-types';
import { cn } from '@/lib/utils';
import { Eye, CheckCircle2, ImageIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { AssignedTechnicianBadge } from './AssignedTechnicianBadge';

interface DeficiencyTableProps {
  deficiencies: DeficiencyItem[];
  getAssignmentForDeficiency: (id: string) => DeficiencyAssignment | undefined;
  onViewDeficiency: (deficiency: DeficiencyItem) => void;
  onMarkResolved: (deficiency: DeficiencyItem) => void;
  onAssign: (deficiency: DeficiencyItem) => void;
}

export function DeficiencyTable({
  deficiencies,
  getAssignmentForDeficiency,
  onViewDeficiency,
  onMarkResolved,
  onAssign,
}: DeficiencyTableProps) {
  const [showCount, setShowCount] = useState(20);

  const visibleDeficiencies = deficiencies.slice(0, showCount);
  const hasMore = deficiencies.length > showCount;

  if (deficiencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No deficiencies found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[60px]">Photo</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Days Open</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDeficiencies.map((deficiency) => {
              const severityInfo = getSeverityInfo(deficiency.severity);
              const assignment = getAssignmentForDeficiency(deficiency.id);
              return (
                <TableRow
                  key={deficiency.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDeficiency(deficiency)}
                >
                  <TableCell>
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                      <img
                        src={deficiency.photoUrl}
                        alt="Deficiency"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">{deficiency.projectName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{deficiency.equipmentTag}</span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <AssignedTechnicianBadge
                      assignment={assignment}
                      onAssign={() => onAssign(deficiency)}
                      compact
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', severityInfo.bgColor, severityInfo.color, severityInfo.borderColor)}
                    >
                      {severityInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deficiency.isResolved ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Open
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {deficiency.isResolved ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={cn(
                        'font-medium',
                        deficiency.daysOpen > 7 ? 'text-warning' : 'text-muted-foreground',
                        deficiency.daysOpen > 14 && 'text-destructive'
                      )}>
                        {deficiency.daysOpen}d
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewDeficiency(deficiency)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!deficiency.isResolved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success hover:text-success"
                          onClick={() => onMarkResolved(deficiency)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          Showing {visibleDeficiencies.length} of {deficiencies.length} deficiencies
        </p>
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCount((prev) => prev + 20)}
            className="gap-1"
          >
            Load More
            <ChevronDown className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
