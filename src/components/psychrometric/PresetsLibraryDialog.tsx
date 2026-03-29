import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Library, 
  Search, 
  Snowflake, 
  Flame, 
  Wind, 
  Waves,
  Loader2,
  Factory
} from 'lucide-react';
import { PresetCard } from './PresetCard';
import { IndustryTemplateCard } from './IndustryTemplateCard';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { IndustryTemplatesGallery } from './IndustryTemplatesGallery';
import { 
  usePsychrometricPresets, 
  useDeletePsychrometricPreset,
  useIncrementPresetUsage,
  SYSTEM_PRESETS,
  PsychrometricPreset,
  PresetAirState,
  PresetCategory
} from '@/hooks/usePsychrometricPresets';
import {
  INDUSTRY_TEMPLATES,
  IndustryTemplate,
} from '@/lib/psychrometric-industry-templates';

interface PresetsLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadPreset: (airStates: PresetAirState[], presetId?: string) => void;
}

export function PresetsLibraryDialog({
  open,
  onOpenChange,
  onLoadPreset,
}: PresetsLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'industry' | 'custom'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PresetCategory | 'all'>('all');
  const [deletePreset, setDeletePreset] = useState<PsychrometricPreset | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<IndustryTemplate | null>(null);
  const [industryGalleryOpen, setIndustryGalleryOpen] = useState(false);

  const { data: customPresets = [], isLoading } = usePsychrometricPresets();
  const deletePresetMutation = useDeletePsychrometricPreset();
  const incrementUsage = useIncrementPresetUsage();

  const handleLoadSystemPreset = (preset: typeof SYSTEM_PRESETS[0]) => {
    onLoadPreset(preset.air_states);
    onOpenChange(false);
  };

  const handleLoadCustomPreset = (preset: PsychrometricPreset) => {
    incrementUsage.mutate(preset.id);
    onLoadPreset(preset.air_states, preset.id);
    onOpenChange(false);
  };

  const handleLoadIndustryTemplate = (template: IndustryTemplate) => {
    onLoadPreset(template.airStates);
    onOpenChange(false);
  };

  const handleDeleteConfirm = async () => {
    if (deletePreset) {
      await deletePresetMutation.mutateAsync(deletePreset.id);
      setDeletePreset(null);
    }
  };

  const filteredSystemPresets = SYSTEM_PRESETS.filter((preset) => {
    const matchesSearch = 
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || preset.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredCustomPresets = customPresets.filter((preset) => {
    const matchesSearch = 
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || preset.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredIndustryTemplates = INDUSTRY_TEMPLATES.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const showSystem = activeTab === 'all' || activeTab === 'system';
  const showIndustry = activeTab === 'all' || activeTab === 'industry';
  const showCustom = activeTab === 'all' || activeTab === 'custom';

  const totalCount = filteredSystemPresets.length + filteredIndustryTemplates.length + filteredCustomPresets.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Presets Library
            </DialogTitle>
            <DialogDescription>
              Load a preset to quickly configure common HVAC processes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search presets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="icon"
                  variant={categoryFilter === 'cooling' ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter('cooling')}
                  title="Cooling"
                >
                  <Snowflake className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={categoryFilter === 'heating' ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter('heating')}
                  title="Heating"
                >
                  <Flame className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={categoryFilter === 'mixing' ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter('mixing')}
                  title="Mixing"
                >
                  <Wind className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={categoryFilter === 'humidification' ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter('humidification')}
                  title="Humidification"
                >
                  <Waves className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="system">
                  System ({filteredSystemPresets.length})
                </TabsTrigger>
                <TabsTrigger value="industry">
                  <Factory className="h-3 w-3 mr-1" />
                  Industry ({filteredIndustryTemplates.length})
                </TabsTrigger>
                <TabsTrigger value="custom">
                  Custom ({filteredCustomPresets.length})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <div className="space-y-3 pr-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {showSystem && filteredSystemPresets.length > 0 && (
                        <>
                          {activeTab === 'all' && (
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                              System Presets
                            </h3>
                          )}
                          {filteredSystemPresets.map((preset, index) => (
                            <PresetCard
                              key={`system-${index}`}
                              preset={preset}
                              onLoad={() => handleLoadSystemPreset(preset)}
                              isSystemPreset
                            />
                          ))}
                        </>
                      )}

                      {showIndustry && filteredIndustryTemplates.length > 0 && (
                        <>
                          {activeTab === 'all' && (
                            <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
                              Industry Templates
                            </h3>
                          )}
                          {filteredIndustryTemplates.slice(0, activeTab === 'all' ? 6 : 12).map((template) => (
                            <IndustryTemplateCard
                              key={template.id}
                              template={template}
                              onLoad={() => handleLoadIndustryTemplate(template)}
                              onPreview={() => setPreviewTemplate(template)}
                              compact
                            />
                          ))}
                          {filteredIndustryTemplates.length > (activeTab === 'all' ? 6 : 12) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setIndustryGalleryOpen(true)}
                            >
                              View all {filteredIndustryTemplates.length} industry templates
                            </Button>
                          )}
                        </>
                      )}

                      {showCustom && filteredCustomPresets.length > 0 && (
                        <>
                          {activeTab === 'all' && (
                            <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
                              Custom Presets
                            </h3>
                          )}
                          {filteredCustomPresets.map((preset) => (
                            <PresetCard
                              key={preset.id}
                              preset={preset}
                              onLoad={() => handleLoadCustomPreset(preset)}
                              onDelete={() => setDeletePreset(preset)}
                            />
                          ))}
                        </>
                      )}

                      {totalCount === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No presets found matching your criteria.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePreset} onOpenChange={(open) => !open && setDeletePreset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onLoad={() => {
          if (previewTemplate) {
            handleLoadIndustryTemplate(previewTemplate);
          }
        }}
      />

      {/* Full Industry Gallery */}
      <IndustryTemplatesGallery
        open={industryGalleryOpen}
        onOpenChange={setIndustryGalleryOpen}
        onLoadTemplate={(airStates) => {
          onLoadPreset(airStates);
          onOpenChange(false);
        }}
      />
    </>
  );
}
