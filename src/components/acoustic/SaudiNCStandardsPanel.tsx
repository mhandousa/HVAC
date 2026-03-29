import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Volume2, VolumeX, Info } from 'lucide-react';
import { useState } from 'react';
import { SAUDI_NC_STANDARDS } from '@/hooks/useAcousticCalculator';

// Group standards by noise level category
const NC_CATEGORIES = {
  'Very Quiet (NC 25-30)': ['mosque-prayer-hall', 'hospital-patient-room', 'library-reading'],
  'Quiet (NC 35-40)': ['hotel-bedroom', 'conference-room', 'private-office'],
  'Moderate (NC 45-50)': ['open-office', 'restaurant', 'retail-store'],
  'Active (NC 55-70)': ['sports-arena', 'factory-light', 'factory-heavy'],
};

// Velocity limits for maintaining NC levels
const VELOCITY_GUIDELINES = {
  duct: [
    { ncMax: 25, mainFpm: 600, branchFpm: 400, label: 'Critical spaces' },
    { ncMax: 35, mainFpm: 800, branchFpm: 600, label: 'Quiet spaces' },
    { ncMax: 45, mainFpm: 1200, branchFpm: 800, label: 'General offices' },
    { ncMax: 55, mainFpm: 1800, branchFpm: 1200, label: 'Active areas' },
  ],
  pipe: [
    { ncMax: 30, velocityFps: 4, label: 'Near-silent' },
    { ncMax: 40, velocityFps: 6, label: 'Quiet areas' },
    { ncMax: 50, velocityFps: 8, label: 'General areas' },
    { ncMax: 60, velocityFps: 12, label: 'Mechanical rooms' },
  ],
};

interface SaudiNCStandardsPanelProps {
  currentSpaceType?: string;
  highlightNC?: number;
}

export function SaudiNCStandardsPanel({ 
  currentSpaceType, 
  highlightNC 
}: SaudiNCStandardsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getNCColor = (nc: number) => {
    if (nc <= 30) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (nc <= 40) return 'bg-green-100 text-green-800 border-green-200';
    if (nc <= 50) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getNCIcon = (nc: number) => {
    if (nc <= 35) return <VolumeX className="h-3 w-3" />;
    return <Volume2 className="h-3 w-3" />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Saudi NC Standards Reference
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* NC Standards by Category */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Indoor Noise Criteria by Space Type</h4>
              
              {Object.entries(NC_CATEGORIES).map(([category, spaceTypes]) => (
                <div key={category} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{category}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {spaceTypes.map(spaceType => {
                      const standard = SAUDI_NC_STANDARDS[spaceType];
                      if (!standard) return null;
                      
                      const isSelected = currentSpaceType === spaceType;
                      const isHighlighted = highlightNC === standard.nc;
                      
                      return (
                        <div
                          key={spaceType}
                          className={`
                            flex items-center justify-between p-2 rounded-md border
                            ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'bg-muted/30'}
                            ${isHighlighted ? 'animate-pulse' : ''}
                          `}
                        >
                          <span className="text-sm truncate flex-1">
                            {standard.description}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${getNCColor(standard.nc)} flex items-center gap-1`}
                          >
                            {getNCIcon(standard.nc)}
                            NC-{standard.nc}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Velocity Guidelines */}
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
              {/* Duct Velocities */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Duct Velocity Guidelines (FPM)</h4>
                <div className="space-y-1">
                  {VELOCITY_GUIDELINES.duct.map(guide => (
                    <div 
                      key={guide.ncMax}
                      className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"
                    >
                      <span className="text-muted-foreground">{guide.label}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          Main: {guide.mainFpm}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Branch: {guide.branchFpm}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipe Velocities */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Pipe Velocity Guidelines (FPS)</h4>
                <div className="space-y-1">
                  {VELOCITY_GUIDELINES.pipe.map(guide => (
                    <div 
                      key={guide.ncMax}
                      className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"
                    >
                      <span className="text-muted-foreground">{guide.label}</span>
                      <Badge variant="outline" className="text-xs">
                        Max: {guide.velocityFps} FPS
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reference Note */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <p className="font-medium mb-1">Reference Standards:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>SASO GSO/IEC 61672-1 - Sound level meters</li>
                <li>ASHRAE Handbook - HVAC Applications, Chapter 48</li>
                <li>Saudi Building Code (SBC) - Mechanical Requirements</li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
