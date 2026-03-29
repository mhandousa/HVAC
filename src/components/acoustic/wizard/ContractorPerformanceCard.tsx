import React from 'react';
import { Contractor, ContractorPerformanceMetrics, ContractorReview } from '@/types/contractor';
import { formatCurrencySAR } from '@/lib/currency-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  TrendingDown,
  TrendingUp,
  Minus,
  Clock,
  CheckCircle2,
  Briefcase,
  Award,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ContractorPerformanceCardProps {
  contractor: Contractor;
  metrics: ContractorPerformanceMetrics;
  recentReviews: ContractorReview[];
  onViewAllReviews?: () => void;
  onViewJobHistory?: () => void;
}

export function ContractorPerformanceCard({
  contractor,
  metrics,
  recentReviews,
  onViewAllReviews,
  onViewJobHistory,
}: ContractorPerformanceCardProps) {
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i < Math.round(rating)
                ? 'fill-chart-4 text-chart-4'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  const getVarianceColor = (variance: number) => {
    if (variance < 0) return 'text-emerald-600';
    if (variance > 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance < 0) return <TrendingDown className="h-3 w-3" />;
    if (variance > 0) return <TrendingUp className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {contractor.name}
              {contractor.isPreferred && (
                <Award className="h-4 w-4 text-chart-4" />
              )}
            </CardTitle>
            {contractor.companyName && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {contractor.companyName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {renderStars(metrics.averageRating, 'md')}
            <span className="font-semibold">{metrics.averageRating.toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl font-bold">{metrics.totalJobs}</div>
            <div className="text-xs text-muted-foreground">Total Jobs</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-xl font-bold">{metrics.onTimeRate.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">On-Time</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {getVarianceIcon(metrics.costVariancePercent)}
            </div>
            <div className={cn('text-xl font-bold', getVarianceColor(metrics.costVariancePercent))}>
              {metrics.costVariancePercent > 0 ? '+' : ''}{metrics.costVariancePercent.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Cost Var</div>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Rating Breakdown</h4>
          <div className="space-y-2">
            {[
              { label: 'Quality', value: metrics.qualityAvg },
              { label: 'Timeliness', value: metrics.timelinessAvg },
              { label: 'Communication', value: metrics.communicationAvg },
              { label: 'Cost Accuracy', value: metrics.costAccuracyAvg },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24">{item.label}</span>
                <div className="flex-1">
                  <Progress 
                    value={(item.value / 5) * 100} 
                    className="h-1.5"
                  />
                </div>
                <div className="w-16 flex items-center gap-1">
                  {renderStars(item.value)}
                  <span className="text-xs text-muted-foreground ml-1">
                    {item.value.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        {recentReviews.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Recent Reviews</h4>
              {onViewAllReviews && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={onViewAllReviews}
                >
                  View All
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {recentReviews.slice(0, 2).map((review) => (
                <div 
                  key={review.id}
                  className="p-2.5 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {review.projectName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {review.reviewText && (
                    <p className="text-muted-foreground line-clamp-2">
                      "{review.reviewText}"
                    </p>
                  )}
                  <div className="mt-1.5">
                    {renderStars(review.rating)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onViewJobHistory && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewJobHistory}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            View Job History
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
