import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Library, 
  Plus,
  Loader2,
  Factory
} from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PresetCard } from './PresetCard';
import { SavePresetDialog } from './SavePresetDialog';
import { PresetsLibraryDialog } from './PresetsLibraryDialog';
import { IndustryTemplatesGallery } from './IndustryTemplatesGallery';
import { IndustryTemplateCard } from './IndustryTemplateCard';
import { 
  usePsychrometricPresets, 
  useIncrementPresetUsage,
  SYSTEM_PRESETS,
  PresetAirState
} from '@/hooks/usePsychrometricPresets';
import { getRecommendedTemplates, ClimateZone, BuildingType } from '@/lib/psychrometric-industry-templates';

interface PresetsPanelProps {
  onLoadPreset: (airStates: PresetAirState[], presetId?: string) => void;
  currentAirStates: PresetAirState[];
  altitudeFt?: number;
  climateZone?: string;
}

export function PresetsPanel({
  onLoadPreset,
  currentAirStates,
  altitudeFt,
  climateZone,
}: PresetsPanelProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [industryGalleryOpen, setIndustryGalleryOpen] = useState(false);

  const { data: customPresets = [], isLoading } = usePsychrometricPresets();
  const incrementUsage = useIncrementPresetUsage();

  // Get recent presets (top 6 by usage)
  const recentPresets = [...customPresets]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 6);

  // Get recommended industry templates
  const recommendedTemplates = getRecommendedTemplates(
    climateZone as ClimateZone | undefined,
    undefined,
    6
  );

  const handleLoadSystemPreset = (preset: typeof SYSTEM_PRESETS[0]) => {
    onLoadPreset(preset.air_states);
  };

  const handleLoadCustomPreset = (preset: typeof customPresets[0]) => {
    incrementUsage.mutate(preset.id);
    onLoadPreset(preset.air_states, preset.id);
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">HVAC Presets</h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => setLibraryDialogOpen(true)}
            >
              <Library className="h-4 w-4 mr-1" />
              Library
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setSaveDialogOpen(true)}
              disabled={currentAirStates.length === 0}
              title="Save current configuration as preset"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
            <TabsTrigger value="industry" className="text-xs">Industry</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-2">
            <div className="grid grid-cols-3 gap-2">
              {SYSTEM_PRESETS.map((preset, index) => (
                <PresetCard
                  key={index}
                  preset={preset}
                  onLoad={() => handleLoadSystemPreset(preset)}
                  isSystemPreset
                  compact
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="industry" className="mt-2">
            <div className="grid grid-cols-3 gap-2">
              {recommendedTemplates.slice(0, 6).map((template) => (
                <IndustryTemplateCard
                  key={template.id}
                  template={template}
                  onLoad={() => onLoadPreset(template.airStates)}
                  onPreview={() => setIndustryGalleryOpen(true)}
                  compact
                />
              ))}
            </div>
            <Button
              variant="link"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => setIndustryGalleryOpen(true)}
            >
              <Factory className="h-3 w-3 mr-1" />
              Browse all industry templates
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="mt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : customPresets.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {customPresets.slice(0, 6).map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onLoad={() => handleLoadCustomPreset(preset)}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No custom presets yet. Click + to save one.
              </div>
            )}
            {customPresets.length > 6 && (
              <Button
                variant="link"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setLibraryDialogOpen(true)}
              >
                View all {customPresets.length} presets
              </Button>
            )}
          </TabsContent>

          <TabsContent value="recent" className="mt-2">
            {recentPresets.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {recentPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onLoad={() => handleLoadCustomPreset(preset)}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted-foreground">
                Load presets to see them here.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <SavePresetDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          airStates={currentAirStates}
          altitudeFt={altitudeFt}
          climateZone={climateZone}
        />

        <PresetsLibraryDialog
          open={libraryDialogOpen}
          onOpenChange={setLibraryDialogOpen}
          onLoadPreset={onLoadPreset}
        />

        <IndustryTemplatesGallery
          open={industryGalleryOpen}
          onOpenChange={setIndustryGalleryOpen}
          onLoadTemplate={onLoadPreset}
          currentClimateZone={climateZone as ClimateZone | undefined}
        />
      </div>
    </TooltipProvider>
  );
}
