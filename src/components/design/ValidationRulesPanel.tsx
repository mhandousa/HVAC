import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { 
  VALIDATION_RULES, 
  ValidationRule,
  ValidationCategory,
  getCategoryInfo,
  getSeverityInfo
} from '@/lib/design-validation-rules';
import { RuleExecutionResult } from '@/hooks/useDesignValidationRules';
import { cn } from '@/lib/utils';

interface ValidationRulesPanelProps {
  ruleResults: RuleExecutionResult[];
  executedCount: number;
  totalCount: number;
  onRefresh?: () => void;
}

const STATUS_ICONS = {
  executed: CheckCircle2,
  skipped: Clock,
  error: XCircle
};

const STATUS_COLORS = {
  executed: 'text-green-500',
  skipped: 'text-muted-foreground',
  error: 'text-red-500'
};

export function ValidationRulesPanel({
  ruleResults,
  executedCount,
  totalCount,
  onRefresh
}: ValidationRulesPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group rules by category
  const rulesByCategory = VALIDATION_RULES.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<ValidationCategory, ValidationRule[]>);

  const getResultForRule = (ruleId: string): RuleExecutionResult | undefined => {
    return ruleResults.find(r => r.ruleId === ruleId);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categories = Object.keys(rulesByCategory) as ValidationCategory[];

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Validation Rules Registry
              <Badge variant="secondary" className="ml-2">
                {executedCount}/{totalCount} executed
              </Badge>
            </CardTitle>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {categories.map((category) => {
                  const categoryInfo = getCategoryInfo(category);
                  const rules = rulesByCategory[category];
                  const executedInCategory = rules.filter(r => 
                    getResultForRule(r.id)?.status === 'executed'
                  ).length;
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium text-sm">{categoryInfo.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {executedInCategory}/{rules.length}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {rules.length} rule{rules.length !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="divide-y">
                          {rules.map((rule) => {
                            const result = getResultForRule(rule.id);
                            const StatusIcon = result ? STATUS_ICONS[result.status] : Clock;
                            const statusColor = result ? STATUS_COLORS[result.status] : STATUS_COLORS.skipped;
                            const severityInfo = getSeverityInfo(rule.severity);

                            return (
                              <div
                                key={rule.id}
                                className="p-3 flex items-start gap-3 text-sm"
                              >
                                <StatusIcon className={cn("h-4 w-4 mt-0.5 shrink-0", statusColor)} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{rule.name}</span>
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] px-1 py-0"
                                      style={{ 
                                        backgroundColor: severityInfo.bgColor,
                                        color: severityInfo.color,
                                        borderColor: severityInfo.color
                                      }}
                                    >
                                      {severityInfo.label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {rule.description}
                                  </p>
                                  {result && (
                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                      {result.status === 'executed' && (
                                        <span className="text-green-600">
                                          {result.checks.length} check{result.checks.length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {result.status === 'skipped' && result.skipReason && (
                                        <span className="text-muted-foreground italic">
                                          {result.skipReason}
                                        </span>
                                      )}
                                      {result.status === 'error' && (
                                        <span className="text-red-500">
                                          Error: {result.skipReason}
                                        </span>
                                      )}
                                      {result.executionTimeMs > 0 && (
                                        <span className="text-muted-foreground">
                                          {result.executionTimeMs.toFixed(0)}ms
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {rule.codeReference && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                                      <ExternalLink className="h-3 w-3" />
                                      {rule.codeReference}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {onRefresh && (
              <div className="mt-4 pt-4 border-t">
                <Button onClick={onRefresh} variant="outline" size="sm" className="w-full">
                  Re-run All Validation Rules
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
