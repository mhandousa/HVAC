import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Calculator, Volume2, Wind, CornerDownRight, GitBranch, Square, Database, VolumeX } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NoisePath, buildNoisePath, getPathRecommendations, PathElementType } from '@/lib/noise-path-calculations';
import { NoisePathDiagram } from './NoisePathDiagram';
import { OctaveBandData } from '@/lib/nc-reference-curves';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EquipmentSoundPowerSelector } from './EquipmentSoundPowerSelector';
import { SilencerSelectionWizard } from './SilencerSelectionWizard';
import { ncGapToFrequencyRequirements, FrequencyBandRequirements } from '@/lib/silencer-frequency-matching';
import { ManufacturerSilencer } from '@/lib/manufacturer-silencer-catalog';
import { toast } from 'sonner';

interface NoisePathCalculatorProps {
  sourceEquipment?: string;
  sourceLevels?: OctaveBandData;
  destinationZone?: string;
  targetNC?: number;
  onPathCalculated?: (path: NoisePath) => void;
}

type UIElementType = 'duct_straight' | 'duct_elbow' | 'duct_branch' | 'silencer' | 'duct_lining' | 'terminal';

interface PathSegment {
  id: string;
  type: UIElementType;
  name: string;
  config: { lengthFt?: number; sizeIn?: number; lined?: boolean };
}

const ELEMENT_TYPE_OPTIONS: { value: UIElementType; label: string; icon: React.ElementType }[] = [
  { value: 'duct_straight', label: 'Straight Duct', icon: Wind },
  { value: 'duct_elbow', label: 'Elbow/Turn', icon: CornerDownRight },
  { value: 'duct_branch', label: 'Branch Takeoff', icon: GitBranch },
  { value: 'silencer', label: 'Silencer', icon: Square },
  { value: 'duct_lining', label: 'Lined Duct', icon: Wind },
  { value: 'terminal', label: 'Terminal Device', icon: Square },
];

const DEFAULT_SOURCE_LEVELS: OctaveBandData = {
  '63Hz': 75, '125Hz': 72, '250Hz': 68, '500Hz': 65, '1kHz': 62, '2kHz': 58, '4kHz': 54, '8kHz': 50,
};

const SortableSegment: React.FC<{
  segment: PathSegment;
  onUpdate: (id: string, config: Partial<PathSegment['config']>) => void;
  onRemove: (id: string) => void;
}> = ({ segment, onUpdate, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: segment.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const TypeIcon = ELEMENT_TYPE_OPTIONS.find(o => o.value === segment.type)?.icon || Square;

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 p-3 bg-card border rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-1 rounded">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{segment.name}</span>
          <Badge variant="outline" className="text-xs">{segment.type.replace(/_/g, ' ')}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Length (ft)</Label>
            <Input type="number" value={segment.config.lengthFt || ''} onChange={(e) => onUpdate(segment.id, { lengthFt: Number(e.target.value) })} className="h-8" />
          </div>
          <div>
            <Label className="text-xs">Size (in)</Label>
            <Input type="number" value={segment.config.sizeIn || ''} onChange={(e) => onUpdate(segment.id, { sizeIn: Number(e.target.value) })} className="h-8" />
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(segment.id)} className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const NoisePathCalculator: React.FC<NoisePathCalculatorProps> = ({
  sourceEquipment = 'AHU-1',
  sourceLevels = DEFAULT_SOURCE_LEVELS,
  destinationZone = 'Conference Room',
  targetNC = 35,
  onPathCalculated,
}) => {
  const [segments, setSegments] = useState<PathSegment[]>([
    { id: '1', type: 'duct_straight', name: 'Main Supply Duct', config: { lengthFt: 50, sizeIn: 18 } },
    { id: '2', type: 'duct_elbow', name: '90° Turn', config: { sizeIn: 18 } },
    { id: '3', type: 'silencer', name: 'Inline Silencer', config: { lengthFt: 4 } },
  ]);

  const [localTargetNC, setLocalTargetNC] = useState(targetNC);
  const [localSourceLevels, setLocalSourceLevels] = useState(sourceLevels);
  const [calculatedPath, setCalculatedPath] = useState<NoisePath | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showEquipmentSelector, setShowEquipmentSelector] = useState(false);
  
  // Silencer wizard state
  const [showSilencerWizard, setShowSilencerWizard] = useState(false);
  const [calculatedFreqRequirements, setCalculatedFreqRequirements] = useState<FrequencyBandRequirements | null>(null);

  const handleEquipmentSelect = (levels: OctaveBandData, _equipmentName: string) => {
    setLocalSourceLevels(levels);
    setShowEquipmentSelector(false);
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSegments((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addSegment = (type: UIElementType) => {
    const typeLabel = ELEMENT_TYPE_OPTIONS.find(o => o.value === type)?.label || type;
    setSegments([...segments, { id: Date.now().toString(), type, name: `${typeLabel} ${segments.filter(s => s.type === type).length + 1}`, config: {} }]);
  };

  const updateSegment = (id: string, config: Partial<PathSegment['config']>) => {
    setSegments(segments.map(s => s.id === id ? { ...s, config: { ...s.config, ...config } } : s));
  };

  const removeSegment = (id: string) => setSegments(segments.filter(s => s.id !== id));

  const calculatePath = useCallback(() => {
    const elementSpecs = segments.map(seg => ({
      type: seg.type as PathElementType,
      name: seg.name,
      lengthFt: seg.config.lengthFt,
      sizeIn: seg.config.sizeIn,
    }));

    const path = buildNoisePath(sourceEquipment, localSourceLevels, elementSpecs, destinationZone, localTargetNC);
    setCalculatedPath(path);
    setRecommendations(getPathRecommendations(path));
    
    // Notify parent component
    if (onPathCalculated) {
      onPathCalculated(path);
    }
  }, [segments, localSourceLevels, localTargetNC, sourceEquipment, destinationZone, onPathCalculated]);

  // Handler for when a silencer is selected from the wizard
  const handleSilencerSelected = useCallback((silencer: ManufacturerSilencer, spec: string) => {
    // Add silencer to path segments
    const newSegment: PathSegment = {
      id: Date.now().toString(),
      type: 'silencer',
      name: `${silencer.manufacturer} ${silencer.model}`,
      config: {
        lengthFt: Math.round(silencer.dimensions.lengthIn / 12),
        sizeIn: silencer.dimensions.diameterIn || silencer.dimensions.widthIn || 12,
      },
    };
    
    setSegments(prev => [...prev, newSegment]);
    setShowSilencerWizard(false);
    
    toast.success(`Added ${silencer.model} silencer to path`);
    
    // Recalculate path after adding silencer
    setTimeout(() => calculatePath(), 100);
  }, [calculatePath]);

  // Open silencer wizard with auto-calculated requirements
  const handleAutoSelectSilencer = () => {
    if (!calculatedPath) return;
    
    const freqReqs = ncGapToFrequencyRequirements(
      calculatedPath.finalNC,
      localTargetNC
    );
    setCalculatedFreqRequirements(freqReqs);
    setShowSilencerWizard(true);
  };

  const ncExceeded = calculatedPath && calculatedPath.finalNC > localTargetNC;
  const ncDelta = calculatedPath ? Math.round(calculatedPath.finalNC - localTargetNC) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Volume2 className="h-5 w-5 text-primary" />Noise Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2"><Label>Source Equipment</Label><Input value={sourceEquipment} disabled className="bg-muted" /></div>
            <div><Label>Target NC</Label><Input type="number" value={localTargetNC} onChange={(e) => setLocalTargetNC(Number(e.target.value))} /></div>
            <div><Label>Destination</Label><Input value={destinationZone} disabled className="bg-muted" /></div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Source Sound Power Levels (dB)</Label>
              <Dialog open={showEquipmentSelector} onOpenChange={setShowEquipmentSelector}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Select from Database
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Equipment Sound Power Database</DialogTitle>
                  </DialogHeader>
                  <EquipmentSoundPowerSelector onSelect={handleEquipmentSelect} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {(['63Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz'] as const).map(freq => (
                <div key={freq}>
                  <Label className="text-xs text-muted-foreground">{freq}</Label>
                  <Input type="number" value={localSourceLevels[freq]} onChange={(e) => setLocalSourceLevels({ ...localSourceLevels, [freq]: Number(e.target.value) })} className="h-8 text-sm" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-lg">Path Segments</CardTitle><CardDescription>Drag to reorder • Configure each segment</CardDescription></div>
            <div className="flex gap-2">
              {ELEMENT_TYPE_OPTIONS.slice(0, 4).map(option => (
                <Button key={option.value} variant="outline" size="sm" onClick={() => addSegment(option.value)}>
                  <Plus className="h-3 w-3 mr-1" />{option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={segments.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {segments.map(segment => <SortableSegment key={segment.id} segment={segment} onUpdate={updateSegment} onRemove={removeSegment} />)}
              </div>
            </SortableContext>
          </DndContext>
          {segments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Wind className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No path segments added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={calculatePath} size="lg" className="w-full"><Calculator className="h-5 w-5 mr-2" />Calculate Noise Path</Button>

      {calculatedPath && (
        <>
          <NoisePathDiagram path={calculatedPath} targetNC={localTargetNC} />
          
          {/* Auto-Select Silencer Button when NC target is exceeded */}
          {ncExceeded && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <VolumeX className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">NC Target Exceeded</p>
                      <p className="text-xs text-muted-foreground">
                        Calculated NC-{Math.round(calculatedPath.finalNC)} exceeds target NC-{localTargetNC} by {ncDelta} dB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    className="gap-2"
                    onClick={handleAutoSelectSilencer}
                  >
                    <VolumeX className="h-4 w-4" />
                    Auto-Select Silencer
                    <Badge variant="secondary" className="ml-1">
                      +{ncDelta} dB needed
                    </Badge>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => <li key={i} className="flex items-start gap-2 text-sm"><span className="text-primary font-bold">•</span>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Silencer Selection Wizard */}
      <SilencerSelectionWizard
        open={showSilencerWizard}
        onOpenChange={setShowSilencerWizard}
        frequencyRequirements={calculatedFreqRequirements || undefined}
        autoMode={!!calculatedFreqRequirements}
        currentNC={calculatedPath?.finalNC}
        targetNC={localTargetNC}
        initialAttenuationDb={ncDelta > 0 ? ncDelta : 10}
        initialDuctSize={segments[0]?.config.sizeIn || 12}
        zoneName={destinationZone}
        onSelectSilencer={handleSilencerSelected}
      />
    </div>
  );
};

export default NoisePathCalculator;