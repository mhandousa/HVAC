import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, Wind, AlertTriangle, CheckCircle2 } from "lucide-react";
import { FilterConfig, DamperConfig, calculateFilterPressureDrop, calculateDamperSize } from "@/lib/ahu-calculations";
import { useMemo } from "react";

interface FilterDamperPanelProps {
  designCfm: number;
  outdoorAirCfm: number;
  returnAirCfm: number;
  filterConfig: FilterConfig;
  damperConfig: DamperConfig;
  onFilterChange: (config: FilterConfig) => void;
  onDamperChange: (config: DamperConfig) => void;
}

const MERV_OPTIONS = [
  { value: 8, label: "MERV 8", description: "Residential / Light Commercial" },
  { value: 10, label: "MERV 10", description: "Commercial" },
  { value: 13, label: "MERV 13", description: "Superior Commercial / Hospital" },
  { value: 14, label: "MERV 14", description: "Hospital / General Surgery" },
  { value: 15, label: "MERV 15", description: "Hospital / Superior Surgery" },
  { value: 16, label: "MERV 16", description: "Hospital / Clean Rooms" },
];

const FILTER_TYPE_OPTIONS = [
  { value: "pleated", label: "Pleated Panel", description: "Standard efficiency" },
  { value: "bag", label: "Bag/Pocket", description: "Extended surface, lower ΔP" },
  { value: "rigid", label: "Rigid Box", description: "High capacity, longer life" },
  { value: "hepa", label: "HEPA", description: "99.97% @ 0.3μm" },
];

export function FilterDamperPanel({
  designCfm,
  outdoorAirCfm,
  returnAirCfm,
  filterConfig,
  damperConfig,
  onFilterChange,
  onDamperChange,
}: FilterDamperPanelProps) {
  // Calculate filter sizing
  const preFilterCalc = useMemo(() => {
    if (!filterConfig.preFilterMerv) return null;
    return calculateFilterPressureDrop({
      airflowCfm: designCfm,
      filterMerv: filterConfig.preFilterMerv,
      filterType: "pleated",
      faceVelocityFpm: filterConfig.faceVelocityFpm,
    });
  }, [designCfm, filterConfig.preFilterMerv, filterConfig.faceVelocityFpm]);

  const finalFilterCalc = useMemo(() => {
    return calculateFilterPressureDrop({
      airflowCfm: designCfm,
      filterMerv: filterConfig.finalFilterMerv,
      filterType: filterConfig.filterType,
      faceVelocityFpm: filterConfig.faceVelocityFpm,
    });
  }, [designCfm, filterConfig.finalFilterMerv, filterConfig.filterType, filterConfig.faceVelocityFpm]);

  // Calculate damper sizing
  const oaDamperCalc = useMemo(() => {
    return calculateDamperSize({ airflowCfm: outdoorAirCfm });
  }, [outdoorAirCfm]);

  const raDamperCalc = useMemo(() => {
    return calculateDamperSize({ airflowCfm: returnAirCfm });
  }, [returnAirCfm]);

  const exhaustCfm = outdoorAirCfm; // Typically matches OA for building pressurization
  const exhaustDamperCalc = useMemo(() => {
    return calculateDamperSize({ airflowCfm: exhaustCfm });
  }, [exhaustCfm]);

  // Total filter pressure drop
  const totalFilterClean = (preFilterCalc?.cleanIn || 0) + finalFilterCalc.cleanIn;
  const totalFilterDirty = (preFilterCalc?.dirtyIn || 0) + finalFilterCalc.dirtyIn;

  // Face velocity status
  const velocityStatus = filterConfig.faceVelocityFpm < 350 
    ? "low" 
    : filterConfig.faceVelocityFpm > 500 
      ? "high" 
      : "optimal";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Filter Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Configuration
          </CardTitle>
          <CardDescription>
            Configure pre-filter and final filter stages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pre-Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Pre-Filter Stage</Label>
              <Switch
                checked={filterConfig.preFilterMerv !== null}
                onCheckedChange={(checked) => {
                  onFilterChange({
                    ...filterConfig,
                    preFilterMerv: checked ? 8 : null,
                  });
                }}
              />
            </div>
            
            {filterConfig.preFilterMerv !== null && (
              <div className="ml-4 space-y-3 border-l-2 border-muted pl-4">
                <div className="space-y-2">
                  <Label>Pre-Filter MERV Rating</Label>
                  <Select
                    value={String(filterConfig.preFilterMerv)}
                    onValueChange={(v) => onFilterChange({ ...filterConfig, preFilterMerv: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MERV_OPTIONS.filter(m => m.value <= 13).map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {preFilterCalc && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-muted p-2">
                      <span className="text-muted-foreground">Clean ΔP:</span>
                      <span className="ml-1 font-medium">{preFilterCalc.cleanIn}" WG</span>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <span className="text-muted-foreground">Dirty ΔP:</span>
                      <span className="ml-1 font-medium">{preFilterCalc.dirtyIn}" WG</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Final Filter */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Final Filter Stage</Label>
            
            <div className="space-y-2">
              <Label>Final Filter MERV Rating</Label>
              <Select
                value={String(filterConfig.finalFilterMerv)}
                onValueChange={(v) => onFilterChange({ ...filterConfig, finalFilterMerv: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MERV_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter Type</Label>
              <Select
                value={filterConfig.filterType}
                onValueChange={(v) => onFilterChange({ ...filterConfig, filterType: v as FilterConfig['filterType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Face Velocity (FPM)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={filterConfig.faceVelocityFpm}
                  onChange={(e) => onFilterChange({ ...filterConfig, faceVelocityFpm: Number(e.target.value) })}
                  className="w-24"
                />
                <Badge variant={velocityStatus === "optimal" ? "default" : "secondary"}>
                  {velocityStatus === "low" && "Low"}
                  {velocityStatus === "optimal" && "Optimal"}
                  {velocityStatus === "high" && "High"}
                </Badge>
                <span className="text-xs text-muted-foreground">(Recommended: 350-500 FPM)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-muted p-2">
                <span className="text-muted-foreground">Clean ΔP:</span>
                <span className="ml-1 font-medium">{finalFilterCalc.cleanIn}" WG</span>
              </div>
              <div className="rounded-md bg-muted p-2">
                <span className="text-muted-foreground">Dirty ΔP:</span>
                <span className="ml-1 font-medium">{finalFilterCalc.dirtyIn}" WG</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Filter Summary */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="mb-3 font-medium">Filter Bank Summary</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filter Face Area:</span>
                <span className="font-medium">{finalFilterCalc.filterAreaSqFt} ft²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Clean ΔP:</span>
                <span className="font-medium">{totalFilterClean.toFixed(2)}" WG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Dirty ΔP:</span>
                <span className="font-medium text-warning">{totalFilterDirty.toFixed(2)}" WG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Configuration:</span>
                <span className="font-medium">
                  {filterConfig.preFilterMerv ? `MERV ${filterConfig.preFilterMerv} + ` : ""}
                  MERV {filterConfig.finalFilterMerv}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Damper Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Damper Configuration
          </CardTitle>
          <CardDescription>
            Outside air, return air, and exhaust dampers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OA Damper */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Outside Air Damper</Label>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Width (in)</Label>
                  <Input
                    type="number"
                    value={damperConfig.outsideAir.widthIn || oaDamperCalc.widthIn}
                    onChange={(e) => onDamperChange({
                      ...damperConfig,
                      outsideAir: { ...damperConfig.outsideAir, widthIn: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Height (in)</Label>
                  <Input
                    type="number"
                    value={damperConfig.outsideAir.heightIn || oaDamperCalc.heightIn}
                    onChange={(e) => onDamperChange({
                      ...damperConfig,
                      outsideAir: { ...damperConfig.outsideAir, heightIn: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Actuator Type</Label>
                  <Select
                    value={damperConfig.outsideAir.actuatorType}
                    onValueChange={(v) => onDamperChange({
                      ...damperConfig,
                      outsideAir: { ...damperConfig.outsideAir, actuatorType: v as 'modulating' | 'two_position' }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modulating">Modulating</SelectItem>
                      <SelectItem value="two_position">Two-Position</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Fail Position</Label>
                  <Select
                    value={damperConfig.outsideAir.failPosition}
                    onValueChange={(v) => onDamperChange({
                      ...damperConfig,
                      outsideAir: { ...damperConfig.outsideAir, failPosition: v as 'open' | 'closed' }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Velocity:</span>
                <Badge variant="outline">{oaDamperCalc.velocityFpm} FPM</Badge>
                <span>@ {outdoorAirCfm} CFM</span>
              </div>
            </div>
          </div>

          {/* RA Damper */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Return Air Damper</Label>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Width (in)</Label>
                  <Input
                    type="number"
                    value={damperConfig.returnAir.widthIn || raDamperCalc.widthIn}
                    onChange={(e) => onDamperChange({
                      ...damperConfig,
                      returnAir: { ...damperConfig.returnAir, widthIn: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Height (in)</Label>
                  <Input
                    type="number"
                    value={damperConfig.returnAir.heightIn || raDamperCalc.heightIn}
                    onChange={(e) => onDamperChange({
                      ...damperConfig,
                      returnAir: { ...damperConfig.returnAir, heightIn: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Actuator Type</Label>
                  <Select
                    value={damperConfig.returnAir.actuatorType}
                    onValueChange={(v) => onDamperChange({
                      ...damperConfig,
                      returnAir: { ...damperConfig.returnAir, actuatorType: v as 'modulating' | 'two_position' }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modulating">Modulating</SelectItem>
                      <SelectItem value="two_position">Two-Position</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Fail Position</Label>
                  <Select
                    value={damperConfig.returnAir.failPosition}
                    onValueChange={(v) => onDamperChange({
                      ...damperConfig,
                      returnAir: { ...damperConfig.returnAir, failPosition: v as 'open' | 'closed' }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Velocity:</span>
                <Badge variant="outline">{raDamperCalc.velocityFpm} FPM</Badge>
                <span>@ {returnAirCfm} CFM</span>
              </div>
            </div>
          </div>

          {/* Exhaust Damper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Exhaust/Relief Damper</Label>
              <Switch
                checked={damperConfig.exhaust.enabled}
                onCheckedChange={(checked) => onDamperChange({
                  ...damperConfig,
                  exhaust: { 
                    ...damperConfig.exhaust, 
                    enabled: checked,
                    widthIn: checked ? exhaustDamperCalc.widthIn : undefined,
                    heightIn: checked ? exhaustDamperCalc.heightIn : undefined,
                  }
                })}
              />
            </div>
            
            {damperConfig.exhaust.enabled && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Width (in)</Label>
                    <Input
                      type="number"
                      value={damperConfig.exhaust.widthIn || exhaustDamperCalc.widthIn}
                      onChange={(e) => onDamperChange({
                        ...damperConfig,
                        exhaust: { ...damperConfig.exhaust, widthIn: Number(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Height (in)</Label>
                    <Input
                      type="number"
                      value={damperConfig.exhaust.heightIn || exhaustDamperCalc.heightIn}
                      onChange={(e) => onDamperChange({
                        ...damperConfig,
                        exhaust: { ...damperConfig.exhaust, heightIn: Number(e.target.value) }
                      })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Velocity:</span>
                  <Badge variant="outline">{exhaustDamperCalc.velocityFpm} FPM</Badge>
                  <span>@ {exhaustCfm} CFM</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Isolation Dampers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Isolation Dampers</Label>
                <p className="text-xs text-muted-foreground">For maintenance isolation</p>
              </div>
              <Switch
                checked={damperConfig.isolation.enabled}
                onCheckedChange={(checked) => onDamperChange({
                  ...damperConfig,
                  isolation: { ...damperConfig.isolation, enabled: checked }
                })}
              />
            </div>
            
            {damperConfig.isolation.enabled && (
              <div className="flex items-center gap-3 ml-4">
                <Switch
                  id="motorized-isolation"
                  checked={damperConfig.isolation.motorized}
                  onCheckedChange={(checked) => onDamperChange({
                    ...damperConfig,
                    isolation: { ...damperConfig.isolation, motorized: checked }
                  })}
                />
                <Label htmlFor="motorized-isolation" className="text-sm">
                  Motorized (vs. Manual)
                </Label>
              </div>
            )}
          </div>

          {/* Damper Summary */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="mb-3 font-medium">Damper Schedule Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">OA Damper:</span>
                <span className="font-medium">
                  {damperConfig.outsideAir.widthIn || oaDamperCalc.widthIn}" × {damperConfig.outsideAir.heightIn || oaDamperCalc.heightIn}"
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">RA Damper:</span>
                <span className="font-medium">
                  {damperConfig.returnAir.widthIn || raDamperCalc.widthIn}" × {damperConfig.returnAir.heightIn || raDamperCalc.heightIn}"
                </span>
              </div>
              {damperConfig.exhaust.enabled && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">EA Damper:</span>
                  <span className="font-medium">
                    {damperConfig.exhaust.widthIn || exhaustDamperCalc.widthIn}" × {damperConfig.exhaust.heightIn || exhaustDamperCalc.heightIn}"
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Total Damper ΔP (est):</span>
                <span className="font-medium">0.10" WG</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
