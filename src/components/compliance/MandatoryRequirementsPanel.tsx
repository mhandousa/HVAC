import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import { MANDATORY_REQUIREMENTS } from '@/lib/ashrae-90-1-data';

interface MandatoryRequirementsPanelProps {
  checkedItems: Record<string, boolean>;
  onItemChange: (id: string, checked: boolean) => void;
}

export function MandatoryRequirementsPanel({
  checkedItems,
  onItemChange,
}: MandatoryRequirementsPanelProps) {
  const categories = [...new Set(MANDATORY_REQUIREMENTS.map(r => r.category))];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      ventilation: 'Ventilation',
      controls: 'Controls',
      insulation: 'Insulation',
      construction: 'Construction',
      systems: 'Systems',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ventilation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      controls: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      insulation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      construction: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      systems: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = MANDATORY_REQUIREMENTS.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Mandatory Requirements Checklist
            </CardTitle>
            <CardDescription>
              ASHRAE 90.1-2022 Mandatory Provisions
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {checkedCount} / {totalCount} verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Badge className={getCategoryColor(category)}>
                    {getCategoryLabel(category)}
                  </Badge>
                </h3>
                <div className="space-y-3">
                  {MANDATORY_REQUIREMENTS.filter(r => r.category === category).map((req) => (
                    <div
                      key={req.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        checkedItems[req.id] 
                          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' 
                          : 'bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={req.id}
                          checked={checkedItems[req.id] || false}
                          onCheckedChange={(checked) => onItemChange(req.id, checked === true)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={req.id}
                            className="font-medium text-sm cursor-pointer block"
                          >
                            {req.title}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {req.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {req.reference}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Progress</span>
            <span className="font-medium">
              {Math.round((checkedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
