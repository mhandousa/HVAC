import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  VolumeX,
  Ruler,
  Wind,
  DollarSign,
  Building2,
  FileText,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  SilencerManufacturer,
  ManufacturerSilencer,
  MANUFACTURER_SILENCER_CATALOG,
} from '@/lib/manufacturer-silencer-catalog';
import { SilencerComparisonTable } from './SilencerComparisonTable';
import { SilencerPerformanceCard } from './SilencerPerformanceCard';
import { FrequencyBandMatchChart } from './FrequencyBandMatchChart';
import {
  FrequencyBandRequirements,
  findMatchingSilencers,
  SilencerMatch,
  FREQUENCY_BANDS,
} from '@/lib/silencer-frequency-matching';
import { OctaveBandData } from '@/lib/nc-reference-curves';

interface SilencerSelectionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAttenuationDb?: number;
  initialDuctSize?: number;
  zoneName?: string;
  onSelectSilencer?: (silencer: ManufacturerSilencer, specification: string) => void;
  // New props for frequency-based selection
  frequencyRequirements?: FrequencyBandRequirements;
  autoMode?: boolean;
  currentNC?: number;
  targetNC?: number;
}

interface WizardRequirements {
  attenuationDb: number;
  ductSizeIn: number;
  maxPressureDropIn: number | null;
  maxLengthIn: number | null;
  application: ('supply' | 'return' | 'exhaust' | 'transfer')[];
}

interface WizardPreferences {
  manufacturers: SilencerManufacturer[];
  availability: ('in-stock' | 'regional' | 'import')[];
  maxCost: '$' | '$$' | '$$$' | '$$$$';
  maxSelfNoiseNC: number | null;
}

const COMMON_DUCT_SIZES = [6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48];
const ALL_MANUFACTURERS: SilencerManufacturer[] = ['Price Industries', 'Vibro-Acoustics', 'McGill AirFlow', 'Ruskin', 'Trane'];

export function SilencerSelectionWizard({
  open,
  onOpenChange,
  initialAttenuationDb = 10,
  initialDuctSize = 12,
  zoneName,
  onSelectSilencer,
  frequencyRequirements,
  autoMode = false,
  currentNC,
  targetNC,
}: SilencerSelectionWizardProps) {
  const [step, setStep] = useState(1);
  const [requirements, setRequirements] = useState<WizardRequirements>({
    attenuationDb: initialAttenuationDb,
    ductSizeIn: initialDuctSize,
    maxPressureDropIn: null,
    maxLengthIn: null,
    application: ['supply'],
  });
  const [preferences, setPreferences] = useState<WizardPreferences>({
    manufacturers: [],
    availability: [],
    maxCost: '$$$$',
    maxSelfNoiseNC: null,
  });
  const [results, setResults] = useState<ManufacturerSilencer[]>([]);
  const [frequencyMatches, setFrequencyMatches] = useState<SilencerMatch[]>([]);
  const [selectedSilencer, setSelectedSilencer] = useState<ManufacturerSilencer | null>(null);

  // Auto-mode initialization
  useEffect(() => {
    if (open && autoMode && frequencyRequirements) {
      // Calculate total required attenuation from frequency requirements
      // Values are numbers directly (not objects with .required)
      const totalRequired = Object.values(frequencyRequirements)
        .reduce((sum, r) => sum + (typeof r === 'number' ? r : 0), 0) / 8;
      
      setRequirements(prev => ({
        ...prev,
        attenuationDb: Math.ceil(totalRequired),
      }));
      
      // Skip to step 2 in auto mode
      setStep(2);
    }
  }, [open, autoMode, frequencyRequirements]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(autoMode && frequencyRequirements ? 2 : 1);
      setSelectedSilencer(null);
      setResults([]);
      setFrequencyMatches([]);
    }
  }, [open, autoMode, frequencyRequirements]);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Filter and score silencers
      const filtered = filterSilencers(requirements, preferences);
      setResults(filtered);
      
      // Also compute frequency-based matches if requirements provided
      if (frequencyRequirements) {
        const matches = findMatchingSilencers(frequencyRequirements, {
          maxLength: requirements.maxLengthIn || undefined,
          maxPressureDrop: requirements.maxPressureDropIn || undefined,
          manufacturers: preferences.manufacturers.length > 0 ? preferences.manufacturers : undefined,
        });
        setFrequencyMatches(matches);
      }
      
      setStep(3);
    } else if (step === 3 && selectedSilencer) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      // In auto mode, don't go back to step 1
      if (autoMode && frequencyRequirements && step === 2) {
        return;
      }
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (selectedSilencer && onSelectSilencer) {
      const spec = generateSpecification(selectedSilencer);
      onSelectSilencer(selectedSilencer, spec);
    }
    onOpenChange(false);
    // Reset for next time
    setStep(autoMode && frequencyRequirements ? 2 : 1);
    setSelectedSilencer(null);
  };

  const filterSilencers = (
    reqs: WizardRequirements,
    prefs: WizardPreferences
  ): ManufacturerSilencer[] => {
    let filtered = [...MANUFACTURER_SILENCER_CATALOG];

    // Filter by duct size (within size range)
    filtered = filtered.filter(
      (s) => reqs.ductSizeIn >= s.sizeRange.minIn && reqs.ductSizeIn <= s.sizeRange.maxIn
    );

    // Filter by minimum attenuation
    filtered = filtered.filter(
      (s) => s.insertionLoss.overall >= reqs.attenuationDb * 0.8
    );

    // Filter by max pressure drop
    if (reqs.maxPressureDropIn !== null) {
      filtered = filtered.filter(
        (s) => s.pressureDropIn <= reqs.maxPressureDropIn!
      );
    }

    // Filter by max length
    if (reqs.maxLengthIn !== null) {
      filtered = filtered.filter(
        (s) => s.dimensions.lengthIn <= reqs.maxLengthIn!
      );
    }

    // Filter by preferred manufacturers
    if (prefs.manufacturers.length > 0) {
      filtered = filtered.filter((s) =>
        prefs.manufacturers.includes(s.manufacturer)
      );
    }

    // Filter by max self-noise
    if (prefs.maxSelfNoiseNC !== null) {
      filtered = filtered.filter(
        (s) => s.selfNoiseNC <= prefs.maxSelfNoiseNC!
      );
    }

    // Score and sort by best match
    const scored = filtered.map((s) => ({
      silencer: s,
      score: scoreSilencer(s, reqs, prefs),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 8).map((s) => s.silencer);
  };

  const scoreSilencer = (
    silencer: ManufacturerSilencer,
    reqs: WizardRequirements,
    prefs: WizardPreferences
  ): number => {
    let score = 0;

    // Attenuation match (higher is better, but don't over-specify)
    const attenuationRatio = silencer.insertionLoss.overall / reqs.attenuationDb;
    if (attenuationRatio >= 1 && attenuationRatio <= 1.3) {
      score += 30;
    } else if (attenuationRatio >= 0.9 && attenuationRatio <= 1.5) {
      score += 20;
    } else if (attenuationRatio >= 0.8) {
      score += 10;
    }

    // Duct size match (check if within range)
    const ductSize = silencer.dimensions.diameterIn || silencer.dimensions.widthIn || 0;
    if (ductSize === reqs.ductSizeIn) {
      score += 20;
    } else if (reqs.ductSizeIn >= silencer.sizeRange.minIn && reqs.ductSizeIn <= silencer.sizeRange.maxIn) {
      score += 10;
    }

    // Lower pressure drop is better
    score += Math.max(0, 15 - silencer.pressureDropIn * 10);

    // Lower self-noise is better
    score += Math.max(0, 15 - (silencer.selfNoiseNC - 20) / 2);

    // Preferred manufacturer bonus
    if (prefs.manufacturers.includes(silencer.manufacturer)) {
      score += 10;
    }

    return score;
  };

  const generateSpecification = (silencer: ManufacturerSilencer): string => {
    const ductSize = silencer.dimensions.diameterIn || silencer.dimensions.widthIn || silencer.sizeRange.minIn;
    return `Sound attenuator shall be ${silencer.manufacturer} Model ${silencer.model}, ${silencer.series} series, or approved equal. Unit shall be rated for ${ductSize}" duct with minimum insertion loss of ${silencer.insertionLoss.overall} dB and maximum pressure drop of ${silencer.pressureDropIn}" w.g. at rated velocity. Self-generated noise shall not exceed NC-${silencer.selfNoiseNC}. Overall length: ${silencer.dimensions.lengthIn}".`;
  };

  const toggleApplication = (app: 'supply' | 'return' | 'exhaust' | 'transfer') => {
    setRequirements((prev) => ({
      ...prev,
      application: prev.application.includes(app)
        ? prev.application.filter((a) => a !== app)
        : [...prev.application, app],
    }));
  };

  const toggleManufacturer = (mfr: SilencerManufacturer) => {
    setPreferences((prev) => ({
      ...prev,
      manufacturers: prev.manufacturers.includes(mfr)
        ? prev.manufacturers.filter((m) => m !== mfr)
        : [...prev.manufacturers, mfr],
    }));
  };

  // Convert frequency requirements to OctaveBandData for chart
  const getRequiredAttenuation = (): OctaveBandData => {
    if (!frequencyRequirements) {
      return { '63Hz': 0, '125Hz': 0, '250Hz': 0, '500Hz': 0, '1kHz': 0, '2kHz': 0, '4kHz': 0, '8kHz': 0 };
    }
    return {
      '63Hz': frequencyRequirements['63Hz'] || 0,
      '125Hz': frequencyRequirements['125Hz'] || 0,
      '250Hz': frequencyRequirements['250Hz'] || 0,
      '500Hz': frequencyRequirements['500Hz'] || 0,
      '1kHz': frequencyRequirements['1kHz'] || 0,
      '2kHz': frequencyRequirements['2kHz'] || 0,
      '4kHz': frequencyRequirements['4kHz'] || 0,
      '8kHz': frequencyRequirements['8kHz'] || 0,
    };
  };

  // Find frequency match data for selected silencer (used in review step)
  const selectedFrequencyMatch = selectedSilencer 
    ? frequencyMatches.find(m => m.silencer.model === selectedSilencer.model)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <VolumeX className="h-5 w-5" />
            Silencer Selection Wizard
            {zoneName && (
              <Badge variant="outline" className="ml-2">
                {zoneName}
              </Badge>
            )}
            {autoMode && (
              <Badge variant="secondary" className="ml-2 gap-1">
                <Sparkles className="h-3 w-3" />
                Auto Mode
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Step {step} of 4 —{' '}
            {step === 1 && 'Define Requirements'}
            {step === 2 && 'Set Preferences'}
            {step === 3 && 'Compare Options'}
            {step === 4 && 'Review Selection'}
            {currentNC !== undefined && targetNC !== undefined && (
              <span className="ml-2 text-muted-foreground">
                (NC-{Math.round(currentNC)} → NC-{targetNC})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <Progress value={(step / 4) * 100} className="h-2" />

        {/* Step 1: Requirements */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Attenuation Required */}
              <div className="space-y-2">
                <Label htmlFor="attenuation" className="flex items-center gap-2">
                  <VolumeX className="h-4 w-4" />
                  Required Attenuation (dB)
                </Label>
                <Input
                  id="attenuation"
                  type="number"
                  min={5}
                  max={40}
                  value={requirements.attenuationDb}
                  onChange={(e) =>
                    setRequirements((prev) => ({
                      ...prev,
                      attenuationDb: parseInt(e.target.value) || 10,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How much noise reduction is needed
                </p>
              </div>

              {/* Duct Size */}
              <div className="space-y-2">
                <Label htmlFor="ductSize" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Duct Size (inches)
                </Label>
                <Select
                  value={requirements.ductSizeIn.toString()}
                  onValueChange={(v) =>
                    setRequirements((prev) => ({
                      ...prev,
                      ductSizeIn: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_DUCT_SIZES.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Pressure Drop */}
              <div className="space-y-2">
                <Label htmlFor="maxPd" className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Max Pressure Drop (" w.g.)
                </Label>
                <Input
                  id="maxPd"
                  type="number"
                  step={0.1}
                  min={0}
                  max={2}
                  placeholder="No limit"
                  value={requirements.maxPressureDropIn ?? ''}
                  onChange={(e) =>
                    setRequirements((prev) => ({
                      ...prev,
                      maxPressureDropIn: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>

              {/* Max Length */}
              <div className="space-y-2">
                <Label htmlFor="maxLength" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Max Length (inches)
                </Label>
                <Input
                  id="maxLength"
                  type="number"
                  min={12}
                  max={120}
                  placeholder="No limit"
                  value={requirements.maxLengthIn ?? ''}
                  onChange={(e) =>
                    setRequirements((prev) => ({
                      ...prev,
                      maxLengthIn: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Application Type */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Application Type
              </Label>
              <div className="flex flex-wrap gap-2">
                {(['supply', 'return', 'exhaust', 'transfer'] as const).map((app) => (
                  <Badge
                    key={app}
                    variant={requirements.application.includes(app) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleApplication(app)}
                  >
                    {app}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            {/* Show frequency requirements summary in auto mode */}
            {autoMode && frequencyRequirements && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Frequency-Based Requirements (Auto-Calculated)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
                    {FREQUENCY_BANDS.map(band => {
                      const req = frequencyRequirements[band];
                      return (
                        <div key={band} className="text-center p-2 bg-background rounded border">
                          <div className="font-medium text-muted-foreground">{band}</div>
                          <div className="text-lg font-bold">{typeof req === 'number' ? req.toFixed(0) : 0}</div>
                          <div className="text-muted-foreground">dB</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferred Manufacturers */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Preferred Manufacturers (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {ALL_MANUFACTURERS.map((mfr) => (
                  <Badge
                    key={mfr}
                    variant={preferences.manufacturers.includes(mfr) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleManufacturer(mfr)}
                  >
                    {mfr}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to consider all manufacturers
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              {/* Budget */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget Range
                </Label>
                <div className="flex gap-2">
                  {(['$', '$$', '$$$', '$$$$'] as const).map((cost) => (
                    <Badge
                      key={cost}
                      variant={preferences.maxCost === cost ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, maxCost: cost }))
                      }
                    >
                      {cost}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Max Self-Noise */}
              <div className="space-y-2">
                <Label htmlFor="maxNoise">
                  Max Self-Noise NC (for critical spaces)
                </Label>
                <Input
                  id="maxNoise"
                  type="number"
                  min={15}
                  max={50}
                  placeholder="No limit"
                  value={preferences.maxSelfNoiseNC ?? ''}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      maxSelfNoiseNC: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Compare Options */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            {results.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Found {results.length} matching silencers. Select one to continue.
                  </div>
                  {frequencyMatches.length > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {frequencyMatches.filter(m => m.meetsAllBands).length} meet all frequency requirements
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((silencer) => {
                    const freqMatch = frequencyMatches.find(m => m.silencer.model === silencer.model);
                    return (
                      <div key={`${silencer.manufacturer}-${silencer.model}`} className="relative">
                        <SilencerPerformanceCard
                          silencer={silencer}
                          isSelected={selectedSilencer?.model === silencer.model}
                          onSelect={() => setSelectedSilencer(silencer)}
                          requiredAttenuation={requirements.attenuationDb}
                        />
                        {freqMatch && (
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant={freqMatch.meetsAllBands ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {freqMatch.overallScore}% freq match
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Frequency Band Match Chart for Selected Silencer */}
                {frequencyRequirements && selectedSilencer && (
                  <FrequencyBandMatchChart
                    requiredAttenuation={getRequiredAttenuation()}
                    silencerAttenuation={selectedSilencer.insertionLoss.octaveBands}
                    title={`${selectedSilencer.model} - Frequency Band Analysis`}
                    height={200}
                  />
                )}

                {results.length > 2 && (
                  <>
                    <Separator className="my-4" />
                    <SilencerComparisonTable
                      silencers={results.slice(0, 4)}
                      requiredAttenuation={requirements.attenuationDb}
                      selectedModel={selectedSilencer?.model}
                      onSelect={setSelectedSilencer}
                    />
                  </>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No silencers found matching your criteria. Try adjusting your
                  requirements or preferences.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Review & Generate Spec */}
        {step === 4 && selectedSilencer && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Sparkles className="h-5 w-5 text-primary" />
              Selected Silencer
            </div>

            <SilencerPerformanceCard
              silencer={selectedSilencer}
              isSelected={true}
              showFullDetails
              requiredAttenuation={requirements.attenuationDb}
            />

            {/* Frequency match visualization in review */}
            {frequencyRequirements && (
              <FrequencyBandMatchChart
                requiredAttenuation={getRequiredAttenuation()}
                silencerAttenuation={selectedSilencer.insertionLoss.octaveBands}
                title="Frequency Band Attenuation Analysis"
                height={180}
              />
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4" />
                Generated Specification
              </div>
              <Card>
                <CardContent className="p-4 text-sm italic bg-muted/30">
                  {generateSpecification(selectedSilencer)}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={step === 1 || (autoMode && frequencyRequirements && step === 2)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={step === 3 && !selectedSilencer}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              <Check className="h-4 w-4 mr-2" />
              Add to Remediation Plan
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}