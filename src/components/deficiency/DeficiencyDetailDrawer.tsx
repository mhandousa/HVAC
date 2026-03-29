import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DeficiencyItem } from '@/hooks/useDeficiencyDashboard';
import { DeficiencyAssignment } from '@/hooks/useDeficiencyAssignments';
import { getTagLabel, getSeverityInfo, getCategoryForTag } from '@/lib/deficiency-types';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image,
  MapPin,
  Tag,
  Wrench,
  UserPlus,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeficiencyDetailDrawerProps {
  deficiency: DeficiencyItem | null;
  assignment?: DeficiencyAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkResolved: (deficiency: DeficiencyItem) => void;
  onAssign: (deficiency: DeficiencyItem) => void;
}

export function DeficiencyDetailDrawer({
  deficiency,
  assignment,
  open,
  onOpenChange,
  onMarkResolved,
  onAssign,
}: DeficiencyDetailDrawerProps) {
  const navigate = useNavigate();

  if (!deficiency) return null;

  const severityInfo = getSeverityInfo(deficiency.severity);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOverdue = assignment?.dueDate && isPast(new Date(assignment.dueDate));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Deficiency Details
            <Badge
              variant="outline"
              className={cn('text-xs', severityInfo.bgColor, severityInfo.color, severityInfo.borderColor)}
            >
              {severityInfo.label}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {deficiency.equipmentTag} · {deficiency.projectName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Photo */}
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={deficiency.photoUrl}
              alt="Deficiency photo"
              className="w-full aspect-video object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              {deficiency.isResolved ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-success">Resolved</p>
                    <p className="text-xs text-muted-foreground">
                      Issue has been addressed
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">Open</p>
                    <p className="text-xs text-muted-foreground">
                      {deficiency.daysOpen} days since reported
                    </p>
                  </div>
                </>
              )}
            </div>
            {!deficiency.isResolved && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => onMarkResolved(deficiency)}
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Resolved
              </Button>
            )}
          </div>

          {/* Assignment Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Assignment
            </h4>
            
            {assignment ? (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={assignment.assignee?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(assignment.assignee?.fullName || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{assignment.assignee?.fullName || 'Unknown'}</p>
                    {assignment.dueDate && (
                      <p className={cn(
                        'text-xs flex items-center gap-1',
                        isOverdue ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        {isOverdue ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
                        {isOverdue && ' (Overdue)'}
                      </p>
                    )}
                    {assignment.priority && assignment.priority !== 'medium' && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs mt-1',
                          assignment.priority === 'urgent' && 'bg-destructive/10 text-destructive border-destructive/20',
                          assignment.priority === 'high' && 'bg-warning/10 text-warning border-warning/20',
                          assignment.priority === 'low' && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {assignment.priority} priority
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onAssign(deficiency)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                {assignment.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border italic">
                    "{assignment.notes}"
                  </p>
                )}
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full gap-2" 
                onClick={() => onAssign(deficiency)}
              >
                <UserPlus className="w-4 h-4" />
                Assign to Technician
              </Button>
            )}
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Deficiency Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {deficiency.deficiencyTags.map((tag) => {
                const category = getCategoryForTag(tag);
                return (
                  <Badge key={tag} variant="secondary">
                    {getTagLabel(tag)}
                    {category && (
                      <span className="ml-1 opacity-60">({category.label})</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Description */}
          {deficiency.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{deficiency.description}</p>
            </div>
          )}

          {/* Remediation Notes */}
          {deficiency.remediationNotes && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Remediation Notes
              </h4>
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border border-border">
                {deficiency.remediationNotes}
              </p>
            </div>
          )}

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Project
              </p>
              <p className="text-sm font-medium">{deficiency.projectName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                Equipment
              </p>
              <p className="text-sm font-mono">{deficiency.equipmentTag}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Captured
              </p>
              <p className="text-sm">
                {format(new Date(deficiency.capturedAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Image className="w-3 h-3" />
                Test
              </p>
              <p className="text-sm">{deficiency.testName}</p>
            </div>
          </div>

          {/* Before/After */}
          {deficiency.hasBeforeAfter && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <Image className="w-4 h-4" />
                Before/After comparison available
              </p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => navigate('/commissioning')}
            >
              <ExternalLink className="w-4 h-4" />
              View in Commissioning
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
