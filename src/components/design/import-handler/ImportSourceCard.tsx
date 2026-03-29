import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ImportMetricBadge } from './ImportMetricBadge';
import type { ImportSource, ImportMetric } from './importSourceConfig';
import type { UpstreamData } from '@/hooks/useDesignDataFlow';

interface ImportSourceCardProps {
  source: ImportSource;
  data: UpstreamData;
  onImport: () => void;
  onViewDetails?: () => void;
  isImporting?: boolean;
  lastUpdated?: string;
  detailItems?: { id: string; name: string; value?: string }[];
}

const statusConfig = {
  ready: { label: 'Ready', variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  partial: { label: 'Partial', variant: 'secondary' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  empty: { label: 'No Data', variant: 'outline' as const, className: 'bg-muted text-muted-foreground' },
};

export function ImportSourceCard({
  source,
  data,
  onImport,
  onViewDetails,
  isImporting = false,
  lastUpdated,
  detailItems,
}: ImportSourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const status = source.getStatus(data);
  const metrics = source.getMetrics(data);
  const isAvailable = source.isAvailable(data);
  const statusInfo = statusConfig[status];
  const Icon = source.icon;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      !isAvailable && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{source.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {source.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className={cn("text-xs", statusInfo.className)}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric, idx) => (
            <ImportMetricBadge key={idx} metric={metric} />
          ))}
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Updated {lastUpdated}</span>
          </div>
        )}

        {/* Expandable Details */}
        {detailItems && detailItems.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
                <span>View {detailItems.length} items</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="max-h-32 overflow-y-auto space-y-1 bg-muted/30 rounded-lg p-2">
                {detailItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50">
                    <span className="text-foreground">{item.name}</span>
                    {item.value && <span className="text-muted-foreground">{item.value}</span>}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1"
            onClick={onImport}
            disabled={!isAvailable || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                Import Data
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
