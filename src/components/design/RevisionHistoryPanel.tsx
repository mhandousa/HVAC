import { useState } from 'react';
import { format } from 'date-fns';
import { History, ChevronDown, ChevronUp, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDesignRevisions, useRollbackRevision, DesignRevision } from '@/hooks/useDesignRevisions';
import { getEntityTypeLabel } from '@/lib/revision-diff-utils';
import { RevisionDiffViewer } from './RevisionDiffViewer';

interface RevisionHistoryPanelProps {
  entityType: string;
  entityId: string | undefined;
  projectId: string;
  onRollback?: (data: unknown) => void;
}

export function RevisionHistoryPanel({
  entityType,
  entityId,
  projectId,
  onRollback,
}: RevisionHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRevisionId, setExpandedRevisionId] = useState<string | null>(null);
  
  const { data: revisions = [], isLoading } = useDesignRevisions(entityType, entityId);
  const rollbackMutation = useRollbackRevision();

  const handleRollback = async (revision: DesignRevision) => {
    const result = await rollbackMutation.mutateAsync({ revision, projectId });
    onRollback?.(result);
  };

  if (!entityId) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Revision History
                {revisions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {revisions.length}
                  </Badge>
                )}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading history...
              </div>
            ) : revisions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No revision history yet. Changes will be tracked when you save.
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {revisions.map((revision, index) => (
                    <div
                      key={revision.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? 'default' : 'outline'}>
                              v{revision.revision_number}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="secondary">Current</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(revision.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                          {revision.profile && (
                            <p className="text-xs text-muted-foreground">
                              by {revision.profile.full_name || revision.profile.email || 'Unknown'}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedRevisionId(
                              expandedRevisionId === revision.id ? null : revision.id
                            )}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRollback(revision)}
                              disabled={rollbackMutation.isPending}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {revision.change_summary && (
                        <p className="text-sm">{revision.change_summary}</p>
                      )}
                      
                      {expandedRevisionId === revision.id && (
                        <RevisionDiffViewer revisionId={revision.id} />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
