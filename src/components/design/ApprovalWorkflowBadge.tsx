import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDesignApproval, getApprovalStatusInfo, type ApprovalStatus } from '@/hooks/useDesignApprovals';
import { CheckCircle2, Clock, XCircle, AlertCircle, FileEdit, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalWorkflowBadgeProps {
  entityType: string;
  entityId: string | undefined;
  className?: string;
  showDetails?: boolean;
}

const statusIcons: Record<ApprovalStatus, React.ReactNode> = {
  draft: <FileEdit className="h-3 w-3" />,
  pending_review: <Clock className="h-3 w-3" />,
  approved: <CheckCircle2 className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
  revision_requested: <AlertCircle className="h-3 w-3" />,
};

export function ApprovalWorkflowBadge({ 
  entityType, 
  entityId, 
  className,
  showDetails = true 
}: ApprovalWorkflowBadgeProps) {
  const { data: approval, isLoading } = useDesignApproval(entityType, entityId);

  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
        Loading...
      </Badge>
    );
  }

  // No approval record means it's a new/unsaved design
  if (!approval) {
    return (
      <Badge variant="outline" className={`bg-muted text-muted-foreground ${className}`}>
        <FileEdit className="h-3 w-3 mr-1" />
        Not Submitted
      </Badge>
    );
  }

  const statusInfo = getApprovalStatusInfo(approval.status);
  const icon = statusIcons[approval.status];

  const getTooltipContent = () => {
    if (!showDetails) return null;

    const lines: string[] = [];
    
    if (approval.submitted_by && approval.submitted_at) {
      const submitterName = approval.submitter?.full_name || 'Unknown';
      const timeAgo = formatDistanceToNow(new Date(approval.submitted_at), { addSuffix: true });
      lines.push(`Submitted by ${submitterName} ${timeAgo}`);
    }

    if (approval.reviewed_by && approval.reviewed_at) {
      const reviewerName = approval.reviewer?.full_name || 'Unknown';
      const timeAgo = formatDistanceToNow(new Date(approval.reviewed_at), { addSuffix: true });
      lines.push(`Reviewed by ${reviewerName} ${timeAgo}`);
    }

    if (approval.review_comments) {
      lines.push(`"${approval.review_comments}"`);
    }

    return lines.length > 0 ? lines.join('\n') : 'No additional details';
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={`${statusInfo.bgColor} ${statusInfo.color} border-transparent ${className}`}
    >
      {icon}
      <span className="ml-1">{statusInfo.label}</span>
    </Badge>
  );

  if (!showDetails) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-line">
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
}
