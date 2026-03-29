import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  usePendingApprovals,
  useMySubmissions,
  useAllApprovals,
  useReviewApproval,
  getApprovalStatusInfo,
  getApprovalPriorityInfo,
  formatEntityType,
  type DesignApproval,
  type ApprovalStatus,
} from '@/hooks/useDesignApprovals';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Search,
  Filter,
  FileCheck,
  Send,
  ClipboardList,
  Loader2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function DesignApprovalsDashboard() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');

  const { data: pendingApprovals = [], isLoading: pendingLoading } = usePendingApprovals();
  const { data: mySubmissions = [], isLoading: submissionsLoading } = useMySubmissions();
  const { data: allApprovals = [], isLoading: allLoading } = useAllApprovals(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const navigate = useNavigate();

  const filterApprovals = (approvals: DesignApproval[]) => {
    if (!searchQuery.trim()) return approvals;
    const query = searchQuery.toLowerCase();
    return approvals.filter(
      (a) =>
        formatEntityType(a.entity_type).toLowerCase().includes(query) ||
        a.project?.name?.toLowerCase().includes(query) ||
        a.submitter?.full_name?.toLowerCase().includes(query)
    );
  };

  const getEntityRoute = (entityType: string, entityId: string, projectId: string) => {
    const routes: Record<string, string> = {
      load_calculation: `/projects/${projectId}?tab=loads`,
      equipment_selection: `/projects/${projectId}?tab=equipment`,
      duct_sizing: `/design/duct-sizing`,
      pipe_sizing: `/design/pipe-sizing`,
      diffuser_selection: `/design/diffuser-selection`,
      terminal_unit: `/design/terminal-unit-sizing`,
      economizer: `/design/economizer-sizing`,
      control_valve: `/design/control-valve-sizing`,
    };
    return routes[entityType] || `/projects/${projectId}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Design Approvals</h1>
          <p className="text-muted-foreground">Review and manage design submissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Submissions</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mySubmissions.length}</div>
            <p className="text-xs text-muted-foreground">Designs you submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allApprovals.filter((a) => a.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Total approved designs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allApprovals.filter((a) => a.status === 'revision_requested').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
              {pendingApprovals.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <Send className="h-4 w-4" />
              My Submissions
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              All Approvals
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search approvals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>

            {activeTab === 'all' && (
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ApprovalStatus | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revision_requested">Revision Requested</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <TabsContent value="pending" className="mt-6">
          <ApprovalsList
            approvals={filterApprovals(pendingApprovals)}
            isLoading={pendingLoading}
            emptyMessage="No pending reviews"
            emptyDescription="You don't have any designs waiting for your review."
            showReviewActions
            onNavigate={(a) => navigate(getEntityRoute(a.entity_type, a.entity_id, a.project_id))}
          />
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <ApprovalsList
            approvals={filterApprovals(mySubmissions)}
            isLoading={submissionsLoading}
            emptyMessage="No submissions"
            emptyDescription="You haven't submitted any designs for approval yet."
            onNavigate={(a) => navigate(getEntityRoute(a.entity_type, a.entity_id, a.project_id))}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <ApprovalsList
            approvals={filterApprovals(allApprovals)}
            isLoading={allLoading}
            emptyMessage="No approvals found"
            emptyDescription="No design approvals match your current filters."
            onNavigate={(a) => navigate(getEntityRoute(a.entity_type, a.entity_id, a.project_id))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ApprovalsListProps {
  approvals: DesignApproval[];
  isLoading: boolean;
  emptyMessage: string;
  emptyDescription: string;
  showReviewActions?: boolean;
  onNavigate: (approval: DesignApproval) => void;
}

function ApprovalsList({
  approvals,
  isLoading,
  emptyMessage,
  emptyDescription,
  showReviewActions,
  onNavigate,
}: ApprovalsListProps) {
  const { mutate: reviewApproval, isPending } = useReviewApproval();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-medium">{emptyMessage}</h3>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  const handleQuickReview = (approvalId: string, status: 'approved' | 'rejected') => {
    setReviewingId(approvalId);
    reviewApproval(
      { approvalId, status },
      {
        onSettled: () => setReviewingId(null),
      }
    );
  };

  return (
    <div className="space-y-3">
      {approvals.map((approval) => {
        const statusInfo = getApprovalStatusInfo(approval.status);
        const priorityInfo = getApprovalPriorityInfo(approval.priority);
        const submitterName = approval.submitter?.full_name || 'Unknown';
        const submitterInitials = submitterName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <Card key={approval.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={approval.submitter?.avatar_url || undefined} />
                    <AvatarFallback>{submitterInitials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {formatEntityType(approval.entity_type)}
                      </span>
                      <Badge variant="outline" className={`${statusInfo.bgColor} ${statusInfo.color} border-transparent`}>
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="outline" className={priorityInfo.color}>
                        {priorityInfo.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                      <span>{approval.project?.name || 'Unknown Project'}</span>
                      <span>•</span>
                      <span>by {submitterName}</span>
                      {approval.submitted_at && (
                        <>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(approval.submitted_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </>
                      )}
                    </div>

                    {approval.due_date && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <Calendar className="h-3 w-3" />
                        Due {format(new Date(approval.due_date), 'MMM d, yyyy')}
                      </div>
                    )}

                    {approval.review_comments && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{approval.review_comments}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {showReviewActions && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        onClick={() => handleQuickReview(approval.id, 'approved')}
                        disabled={isPending && reviewingId === approval.id}
                      >
                        {isPending && reviewingId === approval.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        onClick={() => handleQuickReview(approval.id, 'rejected')}
                        disabled={isPending && reviewingId === approval.id}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <Button size="sm" variant="ghost" onClick={() => onNavigate(approval)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
