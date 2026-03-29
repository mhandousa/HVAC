import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Volume2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Filter,
  DollarSign,
  Gauge,
  TrendingUp,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { 
  useAcousticRecommendationsEngine, 
  PriorityLevel,
  ProjectAcousticRecommendation 
} from '@/hooks/useAcousticRecommendationsEngine';

interface AcousticRecommendationsEngineCardProps {
  zones: ZoneAcousticData[];
  onZoneSelect?: (zoneId: string) => void;
  onEstimateCost?: (zoneId: string) => void;
}

const PRIORITY_CONFIG: Record<PriorityLevel, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
}> = {
  critical: { 
    label: 'Critical', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
  high: { 
    label: 'High', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  medium: { 
    label: 'Medium', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  low: { 
    label: 'Low', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
};

const ROI_CONFIG = {
  high: { label: 'High ROI', color: 'text-green-600' },
  medium: { label: 'Med ROI', color: 'text-amber-600' },
  low: { label: 'Low ROI', color: 'text-muted-foreground' },
};

export function AcousticRecommendationsEngineCard({
  zones,
  onZoneSelect,
  onEstimateCost,
}: AcousticRecommendationsEngineCardProps) {
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const { recommendations, summary } = useAcousticRecommendationsEngine(zones);
  
  const filteredRecommendations = useMemo(() => {
    if (priorityFilter === 'all') return recommendations;
    return recommendations.filter(r => r.priority === priorityFilter);
  }, [recommendations, priorityFilter]);
  
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Acoustic Action Items</CardTitle>
          </div>
          <CardDescription>No zones require acoustic treatment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Volume2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              All analyzed zones meet NC targets
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Acoustic Action Items</CardTitle>
              <CardDescription>
                {recommendations.length} zones need treatment • Est. Cost: {summary.estimatedTotalCost}
              </CardDescription>
            </div>
          </div>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityLevel | 'all')}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Priority Summary */}
        <div className="flex gap-2 mt-3">
          {[
            { key: 'critical' as const, count: summary.criticalCount },
            { key: 'high' as const, count: summary.highCount },
            { key: 'medium' as const, count: summary.mediumCount },
            { key: 'low' as const, count: summary.lowCount },
          ].map(({ key, count }) => (
            <button
              key={key}
              onClick={() => setPriorityFilter(priorityFilter === key ? 'all' : key)}
              className={cn(
                'flex-1 rounded-lg border p-2 text-center transition-colors',
                PRIORITY_CONFIG[key].bgColor,
                priorityFilter === key ? PRIORITY_CONFIG[key].borderColor : 'border-transparent',
                'hover:opacity-80'
              )}
            >
              <p className={cn('text-lg font-bold', PRIORITY_CONFIG[key].color)}>{count}</p>
              <p className="text-xs text-muted-foreground">{PRIORITY_CONFIG[key].label}</p>
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-2">
            {filteredRecommendations.map((rec) => (
              <RecommendationItem
                key={rec.id}
                recommendation={rec}
                isExpanded={expandedId === rec.id}
                onToggle={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                onZoneSelect={onZoneSelect}
                onFindSilencer={() => navigate('/design/silencer-selection')}
                onEstimateCost={onEstimateCost ? () => onEstimateCost(rec.zoneId) : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface RecommendationItemProps {
  recommendation: ProjectAcousticRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
  onZoneSelect?: (zoneId: string) => void;
  onFindSilencer: () => void;
  onEstimateCost?: () => void;
}

function RecommendationItem({
  recommendation,
  isExpanded,
  onToggle,
  onZoneSelect,
  onFindSilencer,
  onEstimateCost,
}: RecommendationItemProps) {
  const config = PRIORITY_CONFIG[recommendation.priority];
  const roiConfig = ROI_CONFIG[recommendation.estimatedROI];
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn(
        'rounded-lg border transition-colors',
        config.borderColor,
        config.bgColor
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{recommendation.zoneName}</span>
                  <Badge variant="outline" className={cn('text-xs', config.color)}>
                    {config.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {recommendation.spaceType} • NC-{recommendation.targetNC} target • +{recommendation.ncDelta} dB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  +{recommendation.ncDelta} dB
                </Badge>
                <ChevronDown className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isExpanded && 'rotate-180'
                )} />
              </div>
            </div>
            
            {recommendation.primaryAction && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{recommendation.primaryAction.title}</span>
                <span className="text-muted-foreground">
                  (-{recommendation.primaryAction.expectedAttenuation} dB, {recommendation.primaryAction.costEstimate})
                </span>
              </div>
            )}
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t border-border/50">
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-3 w-3 text-muted-foreground" />
                <span>NC-{recommendation.estimatedNC} est.</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span>{recommendation.primaryAction?.costEstimate || '-'}</span>
              </div>
              <div className={cn('flex items-center gap-1.5 text-xs', roiConfig.color)}>
                <TrendingUp className="h-3 w-3" />
                <span>{roiConfig.label}</span>
              </div>
            </div>
            
            {/* All Recommendations */}
            {recommendation.recommendations.length > 1 && (
              <div className="mb-3">
                <p className="text-xs font-medium mb-1">Alternative Options:</p>
                <ul className="space-y-1">
                  {recommendation.recommendations.slice(1, 3).map((rec, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-muted-foreground/50">•</span>
                      {rec.title} (-{rec.expectedAttenuation} dB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {recommendation.primaryAction?.type === 'silencer' && (
                <Button size="sm" variant="outline" onClick={onFindSilencer}>
                  Find Silencer
                </Button>
              )}
              {onEstimateCost && (
                <Button size="sm" variant="outline" onClick={onEstimateCost}>
                  <Calculator className="h-3 w-3 mr-1" />
                  Estimate Cost
                </Button>
              )}
              {onZoneSelect && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onZoneSelect(recommendation.zoneId)}
                >
                  View Zone
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
