import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, 
  VolumeX,
  Wrench,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Search,
  ExternalLink,
} from 'lucide-react';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { 
  AcousticRecommendation, 
  generateAcousticRecommendations 
} from '@/lib/acoustic-remediation';
import { cn } from '@/lib/utils';
import { SilencerSelectionWizard } from './SilencerSelectionWizard';
import { ManufacturerSilencer } from '@/lib/manufacturer-silencer-catalog';

interface AcousticRemediationPanelProps {
  zone: ZoneAcousticData;
  onClose?: () => void;
}

function CostIndicator({ cost }: { cost: '$' | '$$' | '$$$' }) {
  const filled = cost.length;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <DollarSign 
          key={i} 
          className={cn(
            "h-3 w-3",
            i <= filled ? "text-amber-500" : "text-muted-foreground/30"
          )} 
        />
      ))}
    </div>
  );
}

function RecommendationCard({ 
  recommendation, 
  index,
  isExpanded,
  onToggle,
  onFindSilencer,
  onFrequencyAnalysis,
}: { 
  recommendation: AcousticRecommendation;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onFindSilencer?: () => void;
  onFrequencyAnalysis?: () => void;
}) {
  const priorityColors = {
    1: 'border-primary bg-primary/5',
    2: 'border-secondary bg-secondary/5',
    3: 'border-muted bg-muted/30',
  };
  
  const priorityLabels = {
    1: 'Recommended',
    2: 'Alternative',
    3: 'Optional',
  };
  
  const typeIcons = {
    'silencer': VolumeX,
    'duct-mod': Wrench,
    'equipment-change': FileText,
  };
  
  const TypeIcon = typeIcons[recommendation.type];
  
  return (
    <div 
      className={cn(
        "rounded-lg border p-3 transition-all cursor-pointer hover:shadow-sm",
        priorityColors[recommendation.priority]
      )}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <TypeIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{recommendation.title}</span>
              <Badge variant="outline" className="text-xs">
                {priorityLabels[recommendation.priority]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {recommendation.description}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          {/* Performance Specs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-background">
              <span className="text-muted-foreground">Insertion Loss</span>
              <span className="font-medium text-green-600">-{recommendation.expectedAttenuation} dB</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-background">
              <span className="text-muted-foreground">Pressure Drop</span>
              <span className={cn(
                "font-medium",
                recommendation.additionalPressureDrop > 0 
                  ? "text-amber-600" 
                  : recommendation.additionalPressureDrop < 0 
                    ? "text-green-600" 
                    : ""
              )}>
                {recommendation.additionalPressureDrop > 0 ? '+' : ''}
                {recommendation.additionalPressureDrop}" w.g.
              </span>
            </div>
          </div>
          
          {/* Silencer Specific Info */}
          {recommendation.specificProduct && (
            <div className="p-2 rounded bg-background text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">{recommendation.specificProduct.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Length</span>
                <span>{recommendation.specificProduct.lengthFt} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Self Noise</span>
                <span>NC-{recommendation.specificProduct.selfNoise}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Velocity</span>
                <span>{recommendation.specificProduct.maxVelocityFpm} FPM</span>
              </div>
            </div>
          )}
          
          {/* Cost & Applicability */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Est. Cost:</span>
              <CostIndicator cost={recommendation.costEstimate} />
            </div>
            <div className="text-muted-foreground">
              Apply to: {recommendation.applicableUnits.slice(0, 2).join(', ')}
              {recommendation.applicableUnits.length > 2 && ` +${recommendation.applicableUnits.length - 2}`}
            </div>
          </div>
          
          {/* Find Silencer Buttons for silencer-type recommendations */}
          {recommendation.type === 'silencer' && (
            <div className="flex gap-2 mt-2">
              {onFindSilencer && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFindSilencer();
                  }}
                >
                  <Search className="h-3 w-3 mr-2" />
                  Quick Wizard
                </Button>
              )}
              {onFrequencyAnalysis && (
                <Button 
                  size="sm" 
                  variant="default" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFrequencyAnalysis();
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Frequency Tool
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AcousticRemediationPanel({ zone, onClose }: AcousticRemediationPanelProps) {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [showSilencerWizard, setShowSilencerWizard] = useState(false);
  const [wizardAttenuation, setWizardAttenuation] = useState(zone.ncDelta);
  const recommendations = generateAcousticRecommendations(zone);
  
  const handleFindSilencer = (attenuation: number) => {
    setWizardAttenuation(attenuation);
    setShowSilencerWizard(true);
  };
  
  const handleFrequencyAnalysis = (attenuation: number) => {
    const params = new URLSearchParams({
      attenuation: attenuation.toString(),
      currentNC: zone.estimatedNC?.toString() || '',
      targetNC: zone.targetNC.toString(),
      zoneName: zone.zoneName || '',
    });
    navigate(`/design/silencer-selection?${params.toString()}`);
  };
  
  const handleSilencerSelected = (silencer: ManufacturerSilencer, spec: string) => {
    console.log('Selected silencer:', silencer.model, spec);
    // Could update the recommendation or show a toast here
  };
  
  // Calculate combined effect if all recommendations applied
  const combinedAttenuation = recommendations.reduce(
    (sum, r) => sum + r.expectedAttenuation, 
    0
  );
  const combinedPressureDrop = recommendations.reduce(
    (sum, r) => sum + r.additionalPressureDrop, 
    0
  );
  
  if (zone.status === 'acceptable' || zone.status === 'no-data') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm">
              {zone.status === 'acceptable' 
                ? 'Zone meets NC requirements. No remediation needed.'
                : 'Add terminal units to analyze acoustic performance.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="h-4 w-4" />
            Remediation Options
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            NC-{zone.estimatedNC} → NC-{zone.targetNC}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          Attenuation Required: <span className="font-medium">{zone.ncDelta} dB</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No specific recommendations available for this zone.
          </p>
        ) : (
          <>
            {/* Recommendation Cards */}
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  index={index}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  onFrequencyAnalysis={rec.type === 'silencer' ? () => handleFrequencyAnalysis(rec.expectedAttenuation) : undefined}
                  onFindSilencer={rec.type === 'silencer' ? () => handleFindSilencer(rec.expectedAttenuation) : undefined}
                />
              ))}
            </div>
            
            <Separator />
            
            {/* Combined Effect Summary */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                If All Applied:
              </p>
              <div className="flex items-center justify-between text-sm">
                <span>Combined Attenuation</span>
                <span className="font-medium text-green-600">-{combinedAttenuation} dB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Total Pressure Impact</span>
                <span className={cn(
                  "font-medium",
                  combinedPressureDrop > 0.3 ? "text-amber-600" : ""
                )}>
                  {combinedPressureDrop > 0 ? '+' : ''}{combinedPressureDrop.toFixed(2)}" w.g.
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Expected Result</span>
                <span className={cn(
                  "font-medium",
                  (zone.estimatedNC! - combinedAttenuation) <= zone.targetNC 
                    ? "text-green-600" 
                    : "text-amber-600"
                )}>
                  NC-{Math.max(20, zone.estimatedNC! - combinedAttenuation)}
                </span>
              </div>
            </div>
          </>
        )}
        
        {onClose && (
          <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
            Close
          </Button>
        )}
      </CardContent>
      
      {/* Silencer Selection Wizard */}
      <SilencerSelectionWizard
        open={showSilencerWizard}
        onOpenChange={setShowSilencerWizard}
        initialAttenuationDb={wizardAttenuation}
        zoneName={zone.zoneName}
        onSelectSilencer={handleSilencerSelected}
      />
    </Card>
  );
}
