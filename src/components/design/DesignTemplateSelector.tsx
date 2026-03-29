import { useState } from 'react';
import { Search, FileText, Globe, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrganizationTemplates, usePublicTemplates, useApplyTemplate, DesignTemplate, TEMPLATE_TYPES } from '@/hooks/useDesignTemplates';
import { TemplatePreviewCard } from './TemplatePreviewCard';

interface DesignTemplateSelectorProps {
  templateType: string;
  onApply: (templateData: Record<string, unknown>) => void;
  trigger?: React.ReactNode;
}

export function DesignTemplateSelector({
  templateType,
  onApply,
  trigger,
}: DesignTemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: orgTemplates = [], isLoading: loadingOrg } = useOrganizationTemplates(templateType);
  const { data: publicTemplates = [], isLoading: loadingPublic } = usePublicTemplates(templateType);
  const applyTemplate = useApplyTemplate();

  const typeInfo = TEMPLATE_TYPES[templateType as keyof typeof TEMPLATE_TYPES];

  const filterTemplates = (templates: DesignTemplate[]) => {
    if (!searchQuery) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(
      t => t.name.toLowerCase().includes(query) || 
           t.description?.toLowerCase().includes(query)
    );
  };

  const handleApply = async (template: DesignTemplate) => {
    await applyTemplate.mutateAsync(template.id);
    onApply(template.template_data as Record<string, unknown>);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Apply Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Apply {typeInfo?.label || 'Design'} Template
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization ({orgTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Public Library ({publicTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <ScrollArea className="h-[400px]">
              {loadingOrg ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading templates...
                </div>
              ) : filterTemplates(orgTemplates).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No organization templates found.
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {filterTemplates(orgTemplates).map((template) => (
                    <TemplatePreviewCard
                      key={template.id}
                      template={template}
                      onApply={() => handleApply(template)}
                      isApplying={applyTemplate.isPending}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="public">
            <ScrollArea className="h-[400px]">
              {loadingPublic ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading templates...
                </div>
              ) : filterTemplates(publicTemplates).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No public templates available.
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {filterTemplates(publicTemplates).map((template) => (
                    <TemplatePreviewCard
                      key={template.id}
                      template={template}
                      onApply={() => handleApply(template)}
                      isApplying={applyTemplate.isPending}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
