import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  X,
  CheckCircle2
} from 'lucide-react';
import { useDesignWarnings, DesignWarning } from '@/hooks/useDesignWarnings';
import { cn } from '@/lib/utils';

interface DesignWarningsBannerProps {
  projectId: string | null;
  zoneId?: string | null;
  currentTool?: string;
  className?: string;
  showAllWarnings?: boolean;
}

export function DesignWarningsBanner({
  projectId,
  zoneId,
  currentTool,
  className,
  showAllWarnings = false,
}: DesignWarningsBannerProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { 
    warnings, 
    filteredWarnings, 
    criticalCount, 
    warningCount, 
    infoCount,
    isLoading 
  } = useDesignWarnings({ projectId, zoneId, currentTool });

  const displayWarnings = showAllWarnings ? warnings : filteredWarnings;

  if (isLoading || isDismissed || displayWarnings.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: DesignWarning['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: DesignWarning['severity']) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const handleNavigateToTool = (warning: DesignWarning) => {
    const params = new URLSearchParams();
    if (projectId) params.set('project', projectId);
    if (warning.zoneId) params.set('zone', warning.zoneId);
    navigate(`${warning.affectedToolPath}?${params.toString()}`);
  };

  // Determine banner variant based on most severe warning
  const hasCritical = criticalCount > 0;
  const hasWarning = warningCount > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Alert 
        className={cn(
          "relative",
          hasCritical ? "border-destructive/50 bg-destructive/5" :
          hasWarning ? "border-yellow-500/50 bg-yellow-500/5" :
          "border-blue-500/50 bg-blue-500/5",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {hasCritical ? (
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            ) : hasWarning ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                Design Validation
                <div className="flex gap-1.5">
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {criticalCount} Critical
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">
                      {warningCount} Warning{warningCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {infoCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {infoCount} Info
                    </Badge>
                  )}
                </div>
              </AlertTitle>
              <AlertDescription className="mt-1">
                {displayWarnings.length === 1 ? (
                  <span>{displayWarnings[0].message}</span>
                ) : (
                  <span>{displayWarnings.length} design issues detected that may affect your project</span>
                )}
              </AlertDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Details
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CollapsibleContent className="mt-4">
          <div className="space-y-3 border-t pt-3">
            {displayWarnings.map((warning) => (
              <div 
                key={warning.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background/50 border"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(warning.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(warning.severity)}
                      <Badge variant="outline" className="text-xs">
                        {warning.affectedTool}
                      </Badge>
                      {warning.zoneName && (
                        <span className="text-xs text-muted-foreground">
                          Zone: {warning.zoneName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 font-medium">{warning.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {warning.recommendation}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => handleNavigateToTool(warning)}
                >
                  Fix
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Alert>
    </Collapsible>
  );
}

// Compact version for inline use in tool headers
export function DesignWarningsIndicator({
  projectId,
  zoneId,
  currentTool,
}: Pick<DesignWarningsBannerProps, 'projectId' | 'zoneId' | 'currentTool'>) {
  const { criticalCount, warningCount, totalCount, isLoading } = useDesignWarnings({ 
    projectId, 
    zoneId, 
    currentTool 
  });

  if (isLoading || totalCount === 0) {
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
        <CheckCircle2 className="h-3 w-3" />
        No Issues
      </Badge>
    );
  }

  if (criticalCount > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        {criticalCount} Critical
      </Badge>
    );
  }

  if (warningCount > 0) {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
        <AlertTriangle className="h-3 w-3" />
        {warningCount} Warning{warningCount > 1 ? 's' : ''}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Info className="h-3 w-3" />
      {totalCount} Info
    </Badge>
  );
}
