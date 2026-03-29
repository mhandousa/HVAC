import { format } from 'date-fns';
import { FileText, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DesignTemplate } from '@/hooks/useDesignTemplates';

interface TemplatePreviewCardProps {
  template: DesignTemplate;
  onApply: () => void;
  isApplying?: boolean;
  showActions?: boolean;
}

export function TemplatePreviewCard({
  template,
  onApply,
  isApplying = false,
  showActions = true,
}: TemplatePreviewCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h4 className="font-medium">{template.name}</h4>
              {template.is_public && (
                <Badge variant="secondary" className="text-xs">Public</Badge>
              )}
            </div>
            
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Used {template.usage_count} times
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(template.updated_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
          
          {showActions && (
            <Button
              size="sm"
              onClick={onApply}
              disabled={isApplying}
            >
              Apply
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
