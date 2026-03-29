import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useDesignApproval,
  useReviewApproval,
  getApprovalStatusInfo,
  getApprovalPriorityInfo,
  formatEntityType,
} from '@/hooks/useDesignApprovals';
import { CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp, Loader2, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ApprovalReviewPanelProps {
  entityType: string;
  entityId: string | undefined;
  className?: string;
}

export function ApprovalReviewPanel({ entityType, entityId, className }: ApprovalReviewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState('');

  const { data: approval, isLoading } = useDesignApproval(entityType, entityId);
  const { mutate: reviewApproval, isPending } = useReviewApproval();

  if (isLoading || !approval) {
    return null;
  }

  // Only show panel if approval is pending review
  if (approval.status !== 'pending_review') {
    return null;
  }

  const handleReview = (status: 'approved' | 'rejected' | 'revision_requested') => {
    reviewApproval(
      {
        approvalId: approval.id,
        status,
        comments: comments.trim() || undefined,
      },
      {
        onSuccess: () => {
          setComments('');
          setIsOpen(false);
        },
      }
    );
  };

  const priorityInfo = getApprovalPriorityInfo(approval.priority);
  const submitterName = approval.submitter?.full_name || 'Unknown';
  const submitterInitials = submitterName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card className="border-amber-200 bg-amber-50/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-amber-100/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <CardTitle className="text-sm font-medium">Review Requested</CardTitle>
                  <CardDescription className="text-xs">
                    {formatEntityType(entityType)} submitted by {submitterName}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={priorityInfo.color}>
                  {priorityInfo.label}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Submission Details */}
            <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={approval.submitter?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{submitterInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{submitterName}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted{' '}
                  {approval.submitted_at
                    ? formatDistanceToNow(new Date(approval.submitted_at), { addSuffix: true })
                    : 'recently'}
                </p>
                {approval.due_date && (
                  <p className="text-xs text-amber-600 mt-1">
                    Due by {format(new Date(approval.due_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>

            {/* Review Comments */}
            <div className="space-y-2">
              <Label htmlFor="review-comments">Review Comments</Label>
              <Textarea
                id="review-comments"
                placeholder="Add your review comments (optional for approval, required for rejection)..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleReview('approved')}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>

              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => handleReview('revision_requested')}
                disabled={isPending || !comments.trim()}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Request Revision
              </Button>

              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => handleReview('rejected')}
                disabled={isPending || !comments.trim()}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
            </div>

            {!comments.trim() && (
              <p className="text-xs text-muted-foreground">
                * Comments are required for rejection or revision requests
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
