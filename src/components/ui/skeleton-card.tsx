import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  showHeader?: boolean;
  headerHeight?: string;
  lines?: number;
}

export const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, showHeader = true, headerHeight = 'h-4', lines = 2 }, ref) => {
    return (
      <Card ref={ref} className={cn('overflow-hidden', className)}>
        {showHeader && (
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className={cn('w-3/4', headerHeight)} />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
            />
          ))}
        </CardContent>
      </Card>
    );
  }
);
SkeletonCard.displayName = 'SkeletonCard';

interface SkeletonStatCardProps {
  className?: string;
}

export const SkeletonStatCard = React.forwardRef<HTMLDivElement, SkeletonStatCardProps>(
  ({ className }, ref) => {
    return (
      <Card ref={ref} className={cn('overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }
);
SkeletonStatCard.displayName = 'SkeletonStatCard';

interface SkeletonListItemProps {
  className?: string;
  showAvatar?: boolean;
}

export const SkeletonListItem = React.forwardRef<HTMLDivElement, SkeletonListItemProps>(
  ({ className, showAvatar = true }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center gap-3 p-3 rounded-lg bg-muted/50', className)}>
        {showAvatar && <Skeleton className="w-10 h-10 rounded-lg" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    );
  }
);
SkeletonListItem.displayName = 'SkeletonListItem';
