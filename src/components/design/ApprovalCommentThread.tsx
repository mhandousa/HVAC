import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { MessageSquare, Reply, Trash2, Edit2, Send, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  useApprovalComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  type ApprovalComment,
} from '@/hooks/useApprovalComments';

interface ApprovalCommentThreadProps {
  approvalId: string;
  className?: string;
}

export function ApprovalCommentThread({ approvalId, className }: ApprovalCommentThreadProps) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useApprovalComments(approvalId);
  const addComment = useAddComment();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment.mutate(
      { approvalId, content: newComment.trim() },
      { onSuccess: () => setNewComment('') }
    );
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                approvalId={approvalId}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}

        {/* New comment form */}
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CommentItemProps {
  comment: ApprovalComment;
  approvalId: string;
  currentUserId?: string;
  isReply?: boolean;
}

function CommentItem({ comment, approvalId, currentUserId, isReply = false }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const addComment = useAddComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const isOwner = currentUserId === comment.created_by;
  const authorName = comment.author?.full_name || comment.author?.email || 'Unknown User';
  const initials = authorName.slice(0, 2).toUpperCase();

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { commentId: comment.id, content: editContent.trim(), approvalId },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    addComment.mutate(
      { approvalId, content: replyContent.trim(), parentCommentId: comment.id },
      {
        onSuccess: () => {
          setReplyContent('');
          setIsReplying(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteComment.mutate({ commentId: comment.id, approvalId });
    setShowDeleteConfirm(false);
  };

  return (
    <div className={cn('', isReply && 'ml-8 border-l-2 border-muted pl-4')}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">{authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate} disabled={updateComment.isPending}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Reply button */}
          {!isReply && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 text-xs"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={addComment.isPending}>
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              approvalId={approvalId}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
