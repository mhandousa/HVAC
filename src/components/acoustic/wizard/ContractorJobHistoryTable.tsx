import React from 'react';
import { ContractorJobHistory, ContractorReview } from '@/types/contractor';
import { formatCurrencySAR } from '@/lib/currency-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Eye,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ContractorJobHistoryTableProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorName: string;
  jobHistory: ContractorJobHistory[];
  reviews: ContractorReview[];
}

export function ContractorJobHistoryTable({
  open,
  onOpenChange,
  contractorName,
  jobHistory,
  reviews,
}: ContractorJobHistoryTableProps) {
  const getStatusConfig = (status: ContractorJobHistory['status']) => {
    switch (status) {
      case 'completed':
        return { 
          icon: CheckCircle2, 
          label: 'Completed', 
          color: 'bg-emerald-500/20 text-emerald-600' 
        };
      case 'in_progress':
        return { 
          icon: Clock, 
          label: 'In Progress', 
          color: 'bg-primary/20 text-primary' 
        };
      case 'cancelled':
        return { 
          icon: XCircle, 
          label: 'Cancelled', 
          color: 'bg-destructive/20 text-destructive' 
        };
    }
  };

  const getOnTimeStatus = (scheduled: number, actual?: number) => {
    if (actual === undefined) return null;
    const diff = actual - scheduled;
    if (diff < 0) return { label: `${Math.abs(diff)}d early`, color: 'text-emerald-600' };
    if (diff > 0) return { label: `${diff}d late`, color: 'text-destructive' };
    return { label: 'On time', color: 'text-muted-foreground' };
  };

  const getCostVariance = (quoted: number, actual?: number) => {
    if (actual === undefined) return null;
    const variance = actual - quoted;
    const percent = (variance / quoted) * 100;
    return { variance, percent };
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < Math.round(rating)
              ? 'fill-chart-4 text-chart-4'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job History - {contractorName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,1fr,80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground sticky top-0 bg-background">
              <div>Project / Phase</div>
              <div>Date</div>
              <div className="text-center">Duration</div>
              <div className="text-right">Quoted</div>
              <div className="text-right">Actual</div>
              <div className="text-center">Status</div>
              <div className="text-center">Rating</div>
            </div>

            {/* Rows */}
            {jobHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No job history available
              </div>
            ) : (
              jobHistory.map((job) => {
                const statusConfig = getStatusConfig(job.status);
                const StatusIcon = statusConfig.icon;
                const onTimeStatus = getOnTimeStatus(job.scheduledDays, job.actualDays);
                const costVar = getCostVariance(job.quotedCost, job.actualCost);
                const review = reviews.find(r => r.phaseId === job.phaseId);

                return (
                  <div 
                    key={job.id}
                    className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,1fr,80px] gap-2 px-3 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm items-center"
                  >
                    {/* Project & Phase */}
                    <div>
                      <div className="font-medium truncate">{job.projectName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {job.phaseName}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-muted-foreground">
                      <div>{format(new Date(job.startDate), 'MMM d, yyyy')}</div>
                      {job.completedDate && (
                        <div className="text-xs">
                          → {format(new Date(job.completedDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="text-center">
                      <div className="tabular-nums">
                        {job.actualDays ?? job.scheduledDays} / {job.scheduledDays}d
                      </div>
                      {onTimeStatus && (
                        <div className={cn('text-xs', onTimeStatus.color)}>
                          {onTimeStatus.label}
                        </div>
                      )}
                    </div>

                    {/* Quoted Cost */}
                    <div className="text-right tabular-nums">
                      {formatCurrencySAR(job.quotedCost)}
                    </div>

                    {/* Actual Cost */}
                    <div className="text-right">
                      {job.actualCost !== undefined ? (
                        <>
                          <div className="tabular-nums">
                            {formatCurrencySAR(job.actualCost)}
                          </div>
                          {costVar && (
                            <div className={cn(
                              'text-xs flex items-center justify-end gap-0.5',
                              costVar.variance < 0 ? 'text-emerald-600' : 
                              costVar.variance > 0 ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                              {costVar.variance < 0 ? <TrendingDown className="h-3 w-3" /> :
                               costVar.variance > 0 ? <TrendingUp className="h-3 w-3" /> :
                               <Minus className="h-3 w-3" />}
                              {costVar.percent.toFixed(1)}%
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                      <Badge className={cn('text-xs gap-1', statusConfig.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Rating */}
                    <div className="flex justify-center">
                      {review ? (
                        renderStars(review.rating)
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Summary Stats */}
        {jobHistory.length > 0 && (
          <div className="pt-3 border-t grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-lg font-bold">{jobHistory.length}</div>
              <div className="text-xs text-muted-foreground">Total Jobs</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {jobHistory.filter(j => j.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {formatCurrencySAR(
                  jobHistory.reduce((sum, j) => sum + j.quotedCost, 0)
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Quoted</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {formatCurrencySAR(
                  jobHistory.reduce((sum, j) => sum + (j.actualCost || 0), 0)
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Actual</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
