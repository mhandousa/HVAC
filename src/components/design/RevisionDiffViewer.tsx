import { useRevisionDiff } from '@/hooks/useDesignRevisions';
import { formatValue, groupDiffsByCategory } from '@/lib/revision-diff-utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RevisionDiffViewerProps {
  revisionId: string;
  compareToId?: string;
}

export function RevisionDiffViewer({ revisionId, compareToId }: RevisionDiffViewerProps) {
  const { diff, isLoading } = useRevisionDiff(revisionId, compareToId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!diff || diff.totalChanges === 0) {
    return (
      <div className="text-sm text-muted-foreground p-2 text-center">
        No changes in this revision
      </div>
    );
  }

  const groupedChanges = groupDiffsByCategory(diff.changes);

  return (
    <div className="border rounded-md bg-muted/30 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
          +{diff.added} added
        </Badge>
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
          -{diff.removed} removed
        </Badge>
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
          ~{diff.modified} modified
        </Badge>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedChanges).map(([category, changes]) => (
          <div key={category} className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">{category}</h4>
            <div className="space-y-1">
              {changes.map((change, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2 rounded ${
                    change.changeType === 'added'
                      ? 'bg-green-500/10 border-l-2 border-green-500'
                      : change.changeType === 'removed'
                      ? 'bg-red-500/10 border-l-2 border-red-500'
                      : 'bg-yellow-500/10 border-l-2 border-yellow-500'
                  }`}
                >
                  <span className="font-medium">{change.label}:</span>{' '}
                  {change.changeType === 'modified' ? (
                    <>
                      <span className="line-through text-muted-foreground">
                        {formatValue(change.previousValue)}
                      </span>
                      {' → '}
                      <span className="text-foreground">
                        {formatValue(change.currentValue)}
                      </span>
                    </>
                  ) : change.changeType === 'added' ? (
                    <span className="text-green-600">{formatValue(change.currentValue)}</span>
                  ) : (
                    <span className="text-red-600 line-through">
                      {formatValue(change.previousValue)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
