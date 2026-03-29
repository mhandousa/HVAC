import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Download } from 'lucide-react';
import { useLoadCalculations } from '@/hooks/useLoadCalculations';
import { useProjects } from '@/hooks/useProjects';

interface PlantLoadInputProps {
  designLoadTons: number;
  diversityFactor: number;
  futureExpansionPercent: number;
  chwSupplyTempF: number;
  chwReturnTempF: number;
  cwSupplyTempF: number;
  cwReturnTempF: number;
  projectId: string | null;
  onDesignLoadChange: (value: number) => void;
  onDiversityFactorChange: (value: number) => void;
  onFutureExpansionChange: (value: number) => void;
  onChwSupplyTempChange: (value: number) => void;
  onChwReturnTempChange: (value: number) => void;
  onCwSupplyTempChange: (value: number) => void;
  onCwReturnTempChange: (value: number) => void;
  onProjectIdChange: (value: string | null) => void;
}

export function PlantLoadInput({
  designLoadTons,
  diversityFactor,
  futureExpansionPercent,
  chwSupplyTempF,
  chwReturnTempF,
  cwSupplyTempF,
  cwReturnTempF,
  projectId,
  onDesignLoadChange,
  onDiversityFactorChange,
  onFutureExpansionChange,
  onChwSupplyTempChange,
  onChwReturnTempChange,
  onCwSupplyTempChange,
  onCwReturnTempChange,
  onProjectIdChange,
}: PlantLoadInputProps) {
  const { data: projects } = useProjects();
  const { data: loadCalculations } = useLoadCalculations(projectId || undefined);
  const [showLoadImport, setShowLoadImport] = useState(false);
  
  // Calculate derived values
  const chwDeltaT = chwReturnTempF - chwSupplyTempF;
  const cwDeltaT = cwReturnTempF - cwSupplyTempF;
  const diversifiedLoad = designLoadTons * diversityFactor;
  const futureLoad = diversifiedLoad * (1 + futureExpansionPercent / 100);
  
  const handleImportLoad = (loadId: string) => {
    const loadCalc = loadCalculations?.find(lc => lc.id === loadId);
    if (loadCalc) {
      // Convert BTU/h to tons (12,000 BTU/h = 1 ton)
      const coolLoadTons = (loadCalc.cooling_load_btuh || 0) / 12000;
      onDesignLoadChange(Math.round(coolLoadTons));
      setShowLoadImport(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Project & Load Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select
                value={projectId || 'none'}
                onValueChange={(value) => onProjectIdChange(value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Import from Load Calculation</Label>
              <Select
                value=""
                onValueChange={handleImportLoad}
                disabled={!loadCalculations || loadCalculations.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadCalculations?.length ? "Select load calculation" : "No calculations available"} />
                </SelectTrigger>
                <SelectContent>
                  {loadCalculations?.map((lc) => (
                    <SelectItem key={lc.id} value={lc.id}>
                      {lc.calculation_name || lc.id.slice(0, 8)} - {Math.round((lc.cooling_load_btuh || 0) / 12000)} tons
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Design Load */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Design Cooling Load</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="designLoad">Block Load (Tons)</Label>
              <Input
                id="designLoad"
                type="number"
                min={0}
                value={designLoadTons}
                onChange={(e) => onDesignLoadChange(Number(e.target.value))}
                className="text-lg font-medium"
              />
              <p className="text-xs text-muted-foreground">
                Total building cooling load from load calculation
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Diversity Factor: {diversityFactor.toFixed(2)}</Label>
              <Slider
                value={[diversityFactor]}
                onValueChange={([value]) => onDiversityFactorChange(value)}
                min={0.7}
                max={1.0}
                step={0.01}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Accounts for non-simultaneous peak loads (0.7-1.0)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Future Expansion: {futureExpansionPercent}%</Label>
              <Slider
                value={[futureExpansionPercent]}
                onValueChange={([value]) => onFutureExpansionChange(value)}
                min={0}
                max={50}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Additional capacity for future growth
              </p>
            </div>
          </div>
          
          {/* Calculated Values */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Block Load</p>
                <p className="text-2xl font-bold">{designLoadTons}</p>
                <p className="text-xs text-muted-foreground">tons</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diversified Load</p>
                <p className="text-2xl font-bold text-primary">{Math.round(diversifiedLoad)}</p>
                <p className="text-xs text-muted-foreground">tons</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Design Capacity</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(futureLoad)}</p>
                <p className="text-xs text-muted-foreground">tons (with expansion)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Temperature Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Design Temperatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chilled Water */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Chilled Water (CHW)</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chwSupply">Supply Temp (°F)</Label>
                  <Input
                    id="chwSupply"
                    type="number"
                    value={chwSupplyTempF}
                    onChange={(e) => onChwSupplyTempChange(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chwReturn">Return Temp (°F)</Label>
                  <Input
                    id="chwReturn"
                    type="number"
                    value={chwReturnTempF}
                    onChange={(e) => onChwReturnTempChange(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Delta-T</p>
                <p className="text-xl font-bold text-blue-600">{chwDeltaT}°F</p>
              </div>
            </div>
            
            {/* Condenser Water */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="h-5 w-5 text-orange-500" />
                <h4 className="font-medium">Condenser Water (CW)</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cwSupply">Supply Temp (°F)</Label>
                  <Input
                    id="cwSupply"
                    type="number"
                    value={cwSupplyTempF}
                    onChange={(e) => onCwSupplyTempChange(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cwReturn">Return Temp (°F)</Label>
                  <Input
                    id="cwReturn"
                    type="number"
                    value={cwReturnTempF}
                    onChange={(e) => onCwReturnTempChange(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Delta-T</p>
                <p className="text-xl font-bold text-orange-600">{cwDeltaT}°F</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
