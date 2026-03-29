import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  useCrossToolValidation, 
  CrossToolDependency, 
  ToolType,
  getToolTypeFromPath 
} from '@/hooks/useCrossToolValidation';

const DISMISS_STORAGE_KEY = 'cross-tool-validation-dismissed';
const DISMISS_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CrossToolValidationAlertProps {
  projectId: string | null;
  currentTool?: ToolType;
  className?: string;
  variant?: 'alert' | 'card' | 'banner';
  onRefresh?: (dependency: CrossToolDependency) => void;
}

export function CrossToolValidationAlert({
  projectId,
  currentTool: propCurrentTool,
  className,
  variant = 'alert',
  onRefresh,
}: CrossToolValidationAlertProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Detect current tool from pathname if not provided
  const currentTool = propCurrentTool || getToolTypeFromPath(location.pathname);

  const { 
    hasStaleData, 
    criticalAlerts, 
    warningAlerts, 
    isLoading 
  } = useCrossToolValidation(projectId, currentTool || 'load-calculation');

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const validDismissals = new Map<string, number>();
        
        // Filter out expired dismissals
        Object.entries(parsed).forEach(([id, timestamp]) => {
          if (now - (timestamp as number) < DISMISS_TTL) {
            validDismissals.set(id, timestamp as number);
          }
        });
        
        setDismissedIds(new Set(validDismissals.keys()));
        
        // Save cleaned up version
        localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(Object.fromEntries(validDismissals)));
      } catch (e) {
        console.error('Failed to parse dismissed alerts:', e);
      }
    }
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);

    // Save to localStorage
    const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[id] = Date.now();
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(parsed));
  };

  const handleViewUpstream = (dependency: CrossToolDependency) => {
    navigate(dependency.upstream.path);
  };

  const handleRefresh = (dependency: CrossToolDependency) => {
    if (onRefresh) {
      onRefresh(dependency);
    }
  };

  // Filter out dismissed alerts
  const visibleCriticalAlerts = criticalAlerts.filter(a => !dismissedIds.has(a.id));
  const visibleWarningAlerts = warningAlerts.filter(a => !dismissedIds.has(a.id));
  const allVisibleAlerts = [...visibleCriticalAlerts, ...visibleWarningAlerts];

  // Don't render if no alerts or loading
  if (isLoading || allVisibleAlerts.length === 0) {
    return null;
  }

  const hasCritical = visibleCriticalAlerts.length > 0;
  const alertCount = allVisibleAlerts.length;

  // Banner variant - compact for tool headers
  if (variant === 'banner') {
    return (
      <div 
        className={cn(
          'flex items-center gap-3 px-4 py-2 rounded-lg',
          hasCritical 
            ? 'bg-destructive/10 border border-destructive/30' 
            : 'bg-yellow-500/10 border border-yellow-500/30',
          className
        )}
      >
        <AlertTriangle className={cn(
          'h-4 w-4 flex-shrink-0',
          hasCritical ? 'text-destructive' : 'text-yellow-500'
        )} />
        <span className={cn(
          'text-sm flex-1',
          hasCritical ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-300'
        )}>
          {alertCount} upstream {alertCount === 1 ? 'change' : 'changes'} detected
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2"
          onClick={() => handleViewUpstream(allVisibleAlerts[0])}
        >
          View <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    );
  }

  // Card variant - detailed for wizard
  if (variant === 'card') {
    return (
      <Card className={cn(
        'border-2',
        hasCritical ? 'border-destructive/50' : 'border-yellow-500/50',
        className
      )}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn(
                    'h-4 w-4',
                    hasCritical ? 'text-destructive' : 'text-yellow-500'
                  )} />
                  <span className={hasCritical ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-400'}>
                    {alertCount} Upstream {alertCount === 1 ? 'Change' : 'Changes'} Detected
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {allVisibleAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    alert.severity === 'critical' 
                      ? 'bg-destructive/5 border-destructive/30' 
                      : 'bg-yellow-500/5 border-yellow-500/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {alert.upstream.toolName}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {alert.staleDurationText} • {alert.upstream.itemCount} items
                      </p>
                      <p className="text-sm mt-2">
                        {alert.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewUpstream(alert)}
                    >
                      View {alert.upstream.toolName}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                    {onRefresh && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRefresh(alert)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  // Default alert variant
  return (
    <Alert 
      variant={hasCritical ? 'destructive' : 'default'}
      className={cn(
        !hasCritical && 'border-yellow-500/50 bg-yellow-500/10',
        className
      )}
    >
      <AlertTriangle className={cn(
        'h-4 w-4',
        !hasCritical && 'text-yellow-500'
      )} />
      <AlertTitle className={cn(
        !hasCritical && 'text-yellow-700 dark:text-yellow-300'
      )}>
        Upstream Data Changed
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className={cn(
          'mb-3',
          !hasCritical && 'text-yellow-700 dark:text-yellow-300'
        )}>
          {allVisibleAlerts[0].description}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={hasCritical ? 'destructive' : 'outline'} 
            size="sm"
            onClick={() => handleViewUpstream(allVisibleAlerts[0])}
          >
            View {allVisibleAlerts[0].upstream.toolName}
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDismiss(allVisibleAlerts[0].id)}
          >
            Dismiss
          </Button>
        </div>
        {alertCount > 1 && (
          <p className="text-xs text-muted-foreground mt-2">
            +{alertCount - 1} more {alertCount - 1 === 1 ? 'alert' : 'alerts'}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
