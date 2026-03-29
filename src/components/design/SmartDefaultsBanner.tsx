import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { type SmartDefault } from '@/lib/smart-defaults';
import { cn } from '@/lib/utils';

interface SmartDefaultsBannerProps {
  defaults: SmartDefault[];
  summary: string;
  onApply: (values: Record<string, number | string>) => void;
  onDismiss?: () => void;
  className?: string;
  filterCategories?: SmartDefault['category'][];
}

export function SmartDefaultsBanner({
  defaults,
  summary,
  onApply,
  onDismiss,
  className,
  filterCategories,
}: SmartDefaultsBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || defaults.length === 0) {
    return null;
  }

  const filteredDefaults = filterCategories 
    ? defaults.filter(d => filterCategories.includes(d.category))
    : defaults;

  if (filteredDefaults.length === 0) {
    return null;
  }

  const handleApply = () => {
    const values: Record<string, number | string> = {};
    filteredDefaults.forEach(d => {
      values[d.key] = d.value;
    });
    onApply(values);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const groupedDefaults = filteredDefaults.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, SmartDefault[]>);

  const categoryLabels: Record<SmartDefault['category'], string> = {
    envelope: 'Envelope',
    loads: 'Internal Loads',
    ventilation: 'Ventilation',
    acoustic: 'Acoustic',
    equipment: 'Equipment',
  };

  const confidenceColors = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  return (
    <Card className={cn('bg-primary/5 border-primary/20', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  Smart Defaults Available
                </h4>
                <p className="text-xs text-muted-foreground">
                  {summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      View ({filteredDefaults.length})
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <Button size="sm" onClick={handleApply} className="h-8">
                <Check className="h-4 w-4 mr-1" />
                Apply All
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {Object.entries(groupedDefaults).map(([category, categoryDefaults]) => (
              <div key={category}>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {categoryLabels[category as SmartDefault['category']]}
                </h5>
                <div className="grid gap-2">
                  {categoryDefaults.map((d) => (
                    <div 
                      key={d.key}
                      className="flex items-center justify-between text-sm bg-background/50 rounded-md px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">
                          {d.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs', confidenceColors[d.confidence])}
                        >
                          {d.confidence}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-mono">
                          {typeof d.value === 'number' ? d.value.toLocaleString() : d.value}
                          {d.unit && ` ${d.unit}`}
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          ({d.source})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
