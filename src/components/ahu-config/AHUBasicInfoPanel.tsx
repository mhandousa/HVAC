import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Wind, Thermometer } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BasicInfo {
  ahuTag: string;
  ahuName: string;
  description: string;
  location: string;
  designCfm: number;
  designStaticPressureIn: number;
  outdoorAirCfm: number;
  returnAirCfm: number;
  minOaPercent: number;
  controlStrategy: string;
}

interface AHUBasicInfoPanelProps {
  data: BasicInfo;
  onChange: (updates: Partial<BasicInfo>) => void;
}

export function AHUBasicInfoPanel({ data, onChange }: AHUBasicInfoPanelProps) {
  const calculatedReturnAir = data.designCfm - data.outdoorAirCfm;
  const actualOaPercent = data.designCfm > 0 
    ? Math.round((data.outdoorAirCfm / data.designCfm) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Unit Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unit Identification</CardTitle>
          <CardDescription>Basic AHU identification and naming</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ahuTag">AHU Tag *</Label>
            <Input
              id="ahuTag"
              value={data.ahuTag}
              onChange={(e) => onChange({ ahuTag: e.target.value })}
              placeholder="AHU-01"
            />
            <p className="text-xs text-muted-foreground">
              Unique equipment identifier (e.g., AHU-B1-01)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ahuName">AHU Name *</Label>
            <Input
              id="ahuName"
              value={data.ahuName}
              onChange={(e) => onChange({ ahuName: e.target.value })}
              placeholder="Office Building Main AHU"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / Area Served</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="Mechanical Room B1, serves Floors 1-5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="controlStrategy">Control Strategy</Label>
            <Select
              value={data.controlStrategy}
              onValueChange={(value) => onChange({ controlStrategy: value })}
            >
              <SelectTrigger id="controlStrategy">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vav">VAV - Variable Air Volume</SelectItem>
                <SelectItem value="cav">CAV - Constant Air Volume</SelectItem>
                <SelectItem value="doas">DOAS - Dedicated Outdoor Air</SelectItem>
                <SelectItem value="dual_duct">Dual Duct</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Enter unit description and notes..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Design Airflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wind className="h-5 w-5" />
            Design Airflow
          </CardTitle>
          <CardDescription>Supply and outdoor air requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designCfm" className="flex items-center gap-1">
                Design Supply CFM *
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Total supply airflow at design conditions
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="designCfm"
                type="number"
                value={data.designCfm || ''}
                onChange={(e) => onChange({ designCfm: Number(e.target.value) })}
                placeholder="10000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outdoorAirCfm" className="flex items-center gap-1">
                Outdoor Air CFM
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    From ASHRAE 62.1 ventilation calculation
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="outdoorAirCfm"
                type="number"
                value={data.outdoorAirCfm || ''}
                onChange={(e) => onChange({ outdoorAirCfm: Number(e.target.value) })}
                placeholder="2000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOaPercent">Minimum OA %</Label>
              <Input
                id="minOaPercent"
                type="number"
                min={0}
                max={100}
                value={data.minOaPercent || ''}
                onChange={(e) => onChange({ minOaPercent: Number(e.target.value) })}
                placeholder="15"
              />
            </div>
          </div>

          <Separator />

          {/* Calculated Values */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Return Air CFM</p>
              <p className="text-lg font-semibold">{calculatedReturnAir.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Actual OA %</p>
              <p className="text-lg font-semibold flex items-center gap-2">
                {actualOaPercent}%
                {actualOaPercent >= data.minOaPercent ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    OK
                  </Badge>
                ) : (
                  <Badge variant="destructive">Low</Badge>
                )}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Mix Ratio (OA:RA)</p>
              <p className="text-lg font-semibold">
                {actualOaPercent}:{100 - actualOaPercent}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">CFM/Ton (Est.)</p>
              <p className="text-lg font-semibold">
                {data.designCfm > 0 ? Math.round(data.designCfm / (data.designCfm / 400)) : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Pressures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Thermometer className="h-5 w-5" />
            Design Static Pressure
          </CardTitle>
          <CardDescription>Total external static pressure requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designStaticPressureIn">
                Total External Static Pressure (in. w.g.)
              </Label>
              <Input
                id="designStaticPressureIn"
                type="number"
                step={0.1}
                value={data.designStaticPressureIn || ''}
                onChange={(e) => onChange({ designStaticPressureIn: Number(e.target.value) })}
                placeholder="2.5"
              />
              <p className="text-xs text-muted-foreground">
                Sum of supply duct, return duct, and component pressure drops
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <p className="text-sm font-medium">Typical Ranges:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Small systems (&lt;5,000 CFM): 1.5 - 2.0 in.</li>
                <li>• Medium systems: 2.0 - 3.0 in.</li>
                <li>• Large systems (&gt;20,000 CFM): 3.0 - 5.0 in.</li>
                <li>• High-efficiency filtration: Add 0.5 - 1.0 in.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
