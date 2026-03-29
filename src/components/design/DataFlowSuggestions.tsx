import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignDataFlow, DataFlowRecommendation } from '@/hooks/useDesignDataFlow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  ArrowRight, 
  X,
  Wind,
  Gauge,
  Droplets,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataFlowSuggestionsProps {
  projectId: string | null;
  zoneId?: string | null;
  currentTool: string;
  className?: string;
  variant?: 'card' | 'alert' | 'inline';
  onImport?: (recommendation: DataFlowRecommendation) => void;
}

const DISMISSED_KEY = 'lovable-data-flow-dismissed';

function getDismissedRecommendations(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Clear old dismissals after 24 hours
      const now = Date.now();
      const valid = Object.entries(parsed)
        .filter(([_, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000)
        .map(([id]) => id);
      return new Set(valid);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function dismissRecommendation(id: string) {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[id] = Date.now();
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

export function DataFlowSuggestions({
  projectId,
  zoneId,
  currentTool,
  className,
  variant = 'card',
  onImport,
}: DataFlowSuggestionsProps) {
  const navigate = useNavigate();
  const { getRecommendations, isLoading } = useDesignDataFlow(projectId, zoneId);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getDismissedRecommendations());
  
  const recommendations = getRecommendations(currentTool)
    .filter(r => !dismissedIds.has(r.id));

  const handleDismiss = (id: string) => {
    dismissRecommendation(id);
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleAction = (recommendation: DataFlowRecommendation) => {
    if (onImport) {
      onImport(recommendation);
    } else {
      navigate(recommendation.actionPath);
    }
  };

  const getIcon = (type: DataFlowRecommendation['type']) => {
    switch (type) {
      case 'terminal-to-diffuser':
        return Wind;
      case 'duct-to-fan':
        return Wind;
      case 'pipe-to-pump':
        return Droplets;
      default:
        return Lightbulb;
    }
  };

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {recommendations.map(rec => (
          <Badge
            key={rec.id}
            variant="secondary"
            className="gap-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => handleAction(rec)}
          >
            <Lightbulb className="h-3 w-3 text-chart-4" />
            {rec.title}
            <ArrowRight className="h-3 w-3" />
          </Badge>
        ))}
      </div>
    );
  }

  if (variant === 'alert') {
    return (
      <div className={cn('space-y-2', className)}>
        {recommendations.map(rec => {
          const Icon = getIcon(rec.type);
          return (
            <Alert key={rec.id} className="relative pr-8">
              <Icon className="h-4 w-4" />
              <AlertTitle className="text-sm">{rec.title}</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-xs">{rec.description}</span>
                <Button size="sm" variant="outline" onClick={() => handleAction(rec)}>
                  {rec.actionLabel}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </AlertDescription>
              <button
                onClick={() => handleDismiss(rec.id)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Alert>
          );
        })}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={cn('space-y-3', className)}>
      {recommendations.map(rec => {
        const Icon = getIcon(rec.type);
        return (
          <Card key={rec.id} className="border-chart-4/30 bg-chart-4/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <Icon className="h-4 w-4 text-chart-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      Auto-populate
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rec.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => handleAction(rec)}
                      className="h-7 text-xs"
                    >
                      {rec.actionLabel}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDismiss(rec.id)}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
