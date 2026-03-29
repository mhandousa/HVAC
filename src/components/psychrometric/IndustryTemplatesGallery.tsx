import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Factory,
  Star,
  X,
} from 'lucide-react';
import { IndustryTemplateCard } from './IndustryTemplateCard';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import {
  IndustryTemplate,
  ClimateZone,
  BuildingType,
  ApplicationType,
  CLIMATE_ZONE_LABELS,
  BUILDING_TYPE_LABELS,
  APPLICATION_LABELS,
  INDUSTRY_TEMPLATES,
  filterIndustryTemplates,
  getRecommendedTemplates,
} from '@/lib/psychrometric-industry-templates';
import { PresetAirState } from '@/hooks/usePsychrometricPresets';

interface IndustryTemplatesGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadTemplate: (airStates: PresetAirState[]) => void;
  currentClimateZone?: ClimateZone;
  currentBuildingType?: BuildingType;
}

export function IndustryTemplatesGallery({
  open,
  onOpenChange,
  onLoadTemplate,
  currentClimateZone,
  currentBuildingType,
}: IndustryTemplatesGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClimateTab, setActiveClimateTab] = useState<ClimateZone | 'all'>('all');
  const [buildingFilter, setBuildingFilter] = useState<BuildingType | 'all'>('all');
  const [applicationFilter, setApplicationFilter] = useState<ApplicationType | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<IndustryTemplate | null>(null);

  // Get recommended templates based on context
  const recommendedTemplates = useMemo(() => {
    return getRecommendedTemplates(currentClimateZone, currentBuildingType, 6);
  }, [currentClimateZone, currentBuildingType]);

  // Filter templates based on current filters
  const filteredTemplates = useMemo(() => {
    return filterIndustryTemplates({
      climateZone: activeClimateTab,
      buildingType: buildingFilter,
      application: applicationFilter === 'all' ? undefined : applicationFilter,
      searchQuery: searchQuery || undefined,
    });
  }, [activeClimateTab, buildingFilter, applicationFilter, searchQuery]);

  // Count templates by climate zone for tabs
  const climateCounts = useMemo(() => {
    const counts: Record<ClimateZone | 'all', number> = {
      all: INDUSTRY_TEMPLATES.length,
      hot_dry: INDUSTRY_TEMPLATES.filter(t => t.climateZone === 'hot_dry').length,
      hot_humid: INDUSTRY_TEMPLATES.filter(t => t.climateZone === 'hot_humid').length,
      moderate: INDUSTRY_TEMPLATES.filter(t => t.climateZone === 'moderate').length,
      cold: INDUSTRY_TEMPLATES.filter(t => t.climateZone === 'cold').length,
      mixed: INDUSTRY_TEMPLATES.filter(t => t.climateZone === 'mixed').length,
    };
    return counts;
  }, []);

  const handleLoadTemplate = (template: IndustryTemplate) => {
    onLoadTemplate(template.airStates);
    onOpenChange(false);
  };

  const handlePreviewTemplate = (template: IndustryTemplate) => {
    setPreviewTemplate(template);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveClimateTab('all');
    setBuildingFilter('all');
    setApplicationFilter('all');
  };

  const hasActiveFilters = searchQuery || activeClimateTab !== 'all' || buildingFilter !== 'all' || applicationFilter !== 'all';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Industry Templates Gallery
            </DialogTitle>
            <DialogDescription>
              Browse {INDUSTRY_TEMPLATES.length} industry-standard HVAC configurations organized by climate zone and building type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filters Row */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={buildingFilter} onValueChange={(v) => setBuildingFilter(v as BuildingType | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Building Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buildings</SelectItem>
                  {(Object.keys(BUILDING_TYPE_LABELS) as BuildingType[])
                    .filter(k => k !== 'all')
                    .map(key => (
                      <SelectItem key={key} value={key}>
                        {BUILDING_TYPE_LABELS[key]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={applicationFilter} onValueChange={(v) => setApplicationFilter(v as ApplicationType | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  {(Object.keys(APPLICATION_LABELS) as ApplicationType[]).map(key => (
                    <SelectItem key={key} value={key}>
                      {APPLICATION_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Climate Zone Tabs */}
            <Tabs value={activeClimateTab} onValueChange={(v) => setActiveClimateTab(v as ClimateZone | 'all')}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all" className="text-xs">
                  All ({climateCounts.all})
                </TabsTrigger>
                <TabsTrigger value="hot_dry" className="text-xs">
                  Hot-Dry ({climateCounts.hot_dry})
                </TabsTrigger>
                <TabsTrigger value="hot_humid" className="text-xs">
                  Hot-Humid ({climateCounts.hot_humid})
                </TabsTrigger>
                <TabsTrigger value="moderate" className="text-xs">
                  Moderate ({climateCounts.moderate})
                </TabsTrigger>
                <TabsTrigger value="cold" className="text-xs">
                  Cold ({climateCounts.cold})
                </TabsTrigger>
                <TabsTrigger value="mixed" className="text-xs">
                  Mixed ({climateCounts.mixed})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[450px] mt-4">
                <div className="space-y-4 pr-4">
                  {/* Recommended Section (only show when no filters active) */}
                  {!hasActiveFilters && activeClimateTab === 'all' && recommendedTemplates.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Recommended for Your Project
                        {currentClimateZone && (
                          <Badge variant="outline" className="text-xs">
                            {CLIMATE_ZONE_LABELS[currentClimateZone]}
                          </Badge>
                        )}
                        {currentBuildingType && (
                          <Badge variant="outline" className="text-xs">
                            {BUILDING_TYPE_LABELS[currentBuildingType]}
                          </Badge>
                        )}
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {recommendedTemplates.slice(0, 3).map((template) => (
                          <IndustryTemplateCard
                            key={template.id}
                            template={template}
                            onLoad={() => handleLoadTemplate(template)}
                            onPreview={() => handlePreviewTemplate(template)}
                            isRecommended
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filtered Results */}
                  <div className="space-y-2">
                    {(!hasActiveFilters && activeClimateTab === 'all') && (
                      <h3 className="text-sm font-medium text-muted-foreground">
                        All Templates
                      </h3>
                    )}
                    
                    {filteredTemplates.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {filteredTemplates.map((template) => (
                          <IndustryTemplateCard
                            key={template.id}
                            template={template}
                            onLoad={() => handleLoadTemplate(template)}
                            onPreview={() => handlePreviewTemplate(template)}
                            isRecommended={recommendedTemplates.some(r => r.id === template.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Factory className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No templates match your current filters.</p>
                        <Button variant="link" onClick={clearFilters}>
                          Clear all filters
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onLoad={() => previewTemplate && handleLoadTemplate(previewTemplate)}
      />
    </>
  );
}
