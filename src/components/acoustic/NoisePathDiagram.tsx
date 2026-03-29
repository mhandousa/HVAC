import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Volume2, ArrowRight, Wind, CornerDownRight, GitBranch, Square, Home, AlertTriangle, CheckCircle } from 'lucide-react';
import { NoisePath, NoisePathElement } from '@/lib/noise-path-calculations';
import { OctaveBandData } from '@/lib/nc-reference-curves';

interface NoisePathDiagramProps {
  path: NoisePath;
  targetNC: number;
  onElementClick?: (element: NoisePathElement) => void;
}

const ELEMENT_ICONS: Record<string, React.ElementType> = {
  source: Volume2,
  duct_straight: Wind,
  duct_elbow: CornerDownRight,
  duct_branch: GitBranch,
  silencer: Square,
  duct_lining: Wind,
  terminal: Square,
  room_effect: Home,
  plenum: Square,
  end_reflection: Square,
  diffuser: Square,
};

const getStatusColor = (nc: number, targetNC: number): string => {
  const diff = nc - targetNC;
  if (diff <= -5) return 'bg-green-500';
  if (diff <= 0) return 'bg-green-400';
  if (diff <= 3) return 'bg-yellow-500';
  if (diff <= 5) return 'bg-orange-500';
  return 'bg-destructive';
};

export const NoisePathDiagram: React.FC<NoisePathDiagramProps> = ({
  path,
  targetNC,
  onElementClick,
}) => {
  const isCompliant = path.finalNC <= targetNC;

  const OctaveBandPopover: React.FC<{ levels: OctaveBandData; elementName: string }> = ({ levels, elementName }) => (
    <div className="space-y-2">
      <p className="font-medium text-sm">{elementName}</p>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {(['63Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz'] as const).map(freq => (
          <div key={freq} className="text-center">
            <p className="text-muted-foreground">{freq}</p>
            <p className="font-medium">{(levels[freq] || 0).toFixed(0)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Noise Path Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {path.elements.length} elements • Total attenuation: {path.totalAttenuation.toFixed(1)} dB
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isCompliant ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />NC-{path.finalNC} ≤ NC-{targetNC}
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />NC-{path.finalNC} &gt; NC-{targetNC}
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex items-center gap-2 min-w-max">
            {path.elements.map((element, index) => {
              const Icon = ELEMENT_ICONS[element.type] || Square;
              const isSource = index === 0;
              const isDestination = index === path.elements.length - 1;
              const statusColor = getStatusColor(element.outputNC, targetNC);

              return (
                <React.Fragment key={element.id}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div 
                        className={`relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md min-w-[100px] ${
                          isSource ? 'border-primary bg-primary/5' : 
                          isDestination ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                          'border-border bg-card hover:border-primary/50'
                        }`}
                        onClick={() => onElementClick?.(element)}
                      >
                        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${statusColor} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                          {element.outputNC}
                        </div>
                        <Icon className={`h-6 w-6 mb-1 ${isSource ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-medium text-center line-clamp-2">{element.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{element.type.replace(/_/g, ' ')}</span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <OctaveBandPopover levels={element.outputLevel} elementName={element.name} />
                    </PopoverContent>
                  </Popover>

                  {index < path.elements.length - 1 && (
                    <div className="flex flex-col items-center px-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /><span>≤ Target NC</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span>Marginal</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-destructive" /><span>&gt; Target NC</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoisePathDiagram;
