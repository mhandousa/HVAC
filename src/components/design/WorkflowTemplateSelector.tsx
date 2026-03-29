import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useWorkflowTemplates,
  useWorkflowTemplatesByBuildingType,
  BUILDING_TYPE_LABELS,
  STAGE_INFO,
  type WorkflowTemplate,
} from '@/hooks/useWorkflowTemplates';
import { Building2, Check, FileText, Loader2, Search, Star } from 'lucide-react';
import type { WorkflowStageId } from '@/components/design/DesignWorkflowNextStep';

interface WorkflowTemplateSelectorProps {
  onApply: (template: WorkflowTemplate) => void;
  trigger?: React.ReactNode;
}

export function WorkflowTemplateSelector({
  onApply,
  trigger,
}: WorkflowTemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'system' | 'organization'>('all');
  
  const { data: templates, isLoading } = useWorkflowTemplates();
  const { grouped } = useWorkflowTemplatesByBuildingType();

  const filterTemplates = (list: WorkflowTemplate[] | undefined) => {
    if (!list) return [];
    
    let filtered = list;
    
    // Filter by tab
    if (selectedTab === 'system') {
      filtered = filtered.filter(t => t.is_system_default);
    } else if (selectedTab === 'organization') {
      filtered = filtered.filter(t => !t.is_system_default);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.building_type.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredTemplates = filterTemplates(templates);

  const handleApply = (template: WorkflowTemplate) => {
    onApply(template);
    setOpen(false);
  };

  const renderStageChips = (stages: WorkflowStageId[], isRequired: boolean) => {
    return (
      <div className="flex flex-wrap gap-1">
        {stages.map(stageId => {
          const info = STAGE_INFO[stageId];
          return (
            <Badge
              key={stageId}
              variant={isRequired ? 'default' : 'outline'}
              className={`text-xs ${isRequired ? '' : 'opacity-70'}`}
            >
              {info?.label || stageId}
            </Badge>
          );
        })}
      </div>
    );
  };

  const renderTemplateCard = (template: WorkflowTemplate) => (
    <Card
      key={template.id}
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => handleApply(template)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {template.is_system_default ? (
              <Star className="h-4 w-4 text-amber-500" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {BUILDING_TYPE_LABELS[template.building_type] || template.building_type}
          </Badge>
        </div>
        {template.description && (
          <CardDescription className="text-xs mt-1">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Required Stages:</p>
          {renderStageChips(template.required_stages, true)}
        </div>
        {template.optional_stages.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Optional:</p>
            {renderStageChips(template.optional_stages, false)}
          </div>
        )}
        <Button 
          size="sm" 
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            handleApply(template);
          }}
        >
          <Check className="h-3 w-3 mr-1" />
          Apply Template
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Workflow Templates
          </DialogTitle>
          <DialogDescription>
            Choose a pre-configured workflow based on your building type to quickly set up your design process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                All ({templates?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="system" className="flex-1">
                System Defaults ({templates?.filter(t => t.is_system_default).length || 0})
              </TabsTrigger>
              <TabsTrigger value="organization" className="flex-1">
                Organization ({templates?.filter(t => !t.is_system_default).length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No templates found</p>
                    {searchQuery && (
                      <p className="text-xs mt-1">Try adjusting your search</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map(renderTemplateCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
