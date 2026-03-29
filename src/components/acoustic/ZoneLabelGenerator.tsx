import { useState, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer, Tag, Settings2, FileText, TestTube2 } from 'lucide-react';
import { ZoneLabelData } from './AcousticZoneLabel';
import { LabelPreview } from './LabelPreview';
import { LabelPrintSheet } from './LabelPrintSheet';
import { AveryPositionSelector } from './AveryPositionSelector';
import {
  LabelGeneratorConfig,
  LabelSize,
  PaperSize,
  ColorScheme,
  BorderStyle,
  LabelTemplateMode,
  LABEL_SIZES,
  PAPER_SIZES,
  DEFAULT_CONFIG,
  AVERY_TEMPLATES,
  calculateLabelsPerPage,
  getAveryLayoutInfo,
} from '@/lib/label-templates';
import { ZoneAcousticData } from '@/hooks/useZoneAcousticAnalysis';
import { cn } from '@/lib/utils';
import { generateTestPageHTML } from './AveryTestPage';

interface ZoneLabelGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: ZoneAcousticData[];
  projectId: string;
  floorName?: string;
}

export function ZoneLabelGenerator({
  open,
  onOpenChange,
  zones,
  projectId,
  floorName,
}: ZoneLabelGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<LabelGeneratorConfig>(DEFAULT_CONFIG);
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(
    new Set(zones.map(z => z.zoneId))
  );

  // Convert zones to label data
  const allLabelData: ZoneLabelData[] = useMemo(() => {
    return zones.map(zone => ({
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      targetNC: zone.targetNC,
      floorName: floorName || 'Unknown Floor',
      spaceType: zone.spaceType || 'General',
      buildingName: undefined,
    }));
  }, [zones, floorName]);

  // Filter selected zones
  const selectedLabels = useMemo(() => {
    return allLabelData.filter(z => selectedZoneIds.has(z.zoneId));
  }, [allLabelData, selectedZoneIds]);

  // Group zones by floor for selection UI
  const zonesByFloor = useMemo(() => {
    const grouped = new Map<string, ZoneLabelData[]>();
    allLabelData.forEach(zone => {
      const floor = zone.floorName;
      if (!grouped.has(floor)) {
        grouped.set(floor, []);
      }
      grouped.get(floor)!.push(zone);
    });
    return grouped;
  }, [allLabelData]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedZoneIds(new Set(allLabelData.map(z => z.zoneId)));
    } else {
      setSelectedZoneIds(new Set());
    }
  };

  const handleSelectFloor = (floorName: string, checked: boolean) => {
    const floorZones = zonesByFloor.get(floorName) || [];
    const newSelection = new Set(selectedZoneIds);
    
    floorZones.forEach(zone => {
      if (checked) {
        newSelection.add(zone.zoneId);
      } else {
        newSelection.delete(zone.zoneId);
      }
    });
    
    setSelectedZoneIds(newSelection);
  };

  const handleSelectZone = (zoneId: string, checked: boolean) => {
    const newSelection = new Set(selectedZoneIds);
    if (checked) {
      newSelection.add(zoneId);
    } else {
      newSelection.delete(zoneId);
    }
    setSelectedZoneIds(newSelection);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isAvery = config.templateMode === 'avery';
    const averyTemplate = isAvery ? AVERY_TEMPLATES[config.averyTemplate] : null;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Acoustic Zone Labels${isAvery ? ` - ${averyTemplate?.name}` : ''}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
            }
            @page {
              size: ${isAvery ? '8.5in 11in' : (config.paperSize === 'letter' ? '8.5in 11in' : '210mm 297mm')};
              margin: 0;
            }
            .label-page, .avery-page {
              page-break-after: always;
            }
            .label-page:last-child, .avery-page:last-child {
              page-break-after: auto;
            }
            svg {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            ${isAvery ? `
            /* Avery precision styles */
            .avery-page {
              width: 215.9mm;
              height: 279.4mm;
              position: relative;
              overflow: hidden;
            }
            .avery-label {
              position: absolute;
              overflow: hidden;
              background: white;
            }
            ` : ''}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handlePrintTestPage = () => {
    const html = generateTestPageHTML(config.averyTemplate);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const updateConfig = <K extends keyof LabelGeneratorConfig>(
    key: K,
    value: LabelGeneratorConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Calculate labels per page based on template mode
  const labelsPerPage = useMemo(() => {
    if (config.templateMode === 'avery') {
      return getAveryLayoutInfo(config.averyTemplate).total;
    }
    return calculateLabelsPerPage(config.labelSize, config.paperSize).total;
  }, [config.templateMode, config.averyTemplate, config.labelSize, config.paperSize]);

  // Calculate total pages accounting for starting position offset
  const totalPages = useMemo(() => {
    if (selectedLabels.length === 0) return 0;
    
    if (config.templateMode === 'avery' && config.useStartPosition && config.startPosition > 1) {
      const offset = config.startPosition - 1;
      const firstPageCapacity = labelsPerPage - offset;
      
      if (selectedLabels.length <= firstPageCapacity) {
        return 1;
      }
      
      const remainingLabels = selectedLabels.length - firstPageCapacity;
      return 1 + Math.ceil(remainingLabels / labelsPerPage);
    }
    
    return Math.ceil(selectedLabels.length / labelsPerPage);
  }, [selectedLabels.length, labelsPerPage, config.templateMode, config.useStartPosition, config.startPosition]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Acoustic Zone Label Generator
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Settings */}
          <div className="space-y-4 overflow-y-auto pr-2">
            {/* Template Mode Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Template Type
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={config.templateMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig('templateMode', 'custom')}
                  className="flex-1"
                >
                  Custom Sizes
                </Button>
                <Button
                  variant={config.templateMode === 'avery' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig('templateMode', 'avery')}
                  className="flex-1"
                >
                  Avery Templates
                </Button>
              </div>
            </div>

            {/* Avery Template Selector */}
            {config.templateMode === 'avery' && (
              <div className="space-y-2">
                <Label className="text-xs">Select Avery Template</Label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(AVERY_TEMPLATES).map(([id, template]) => (
                    <div
                      key={id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-colors",
                        config.averyTemplate === id
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      )}
                      onClick={() => updateConfig('averyTemplate', id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {template.columns * template.rows}/sheet
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uses precise Avery specifications for perfect alignment
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintTestPage}
                  className="w-full mt-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Test Page
                </Button>
              </div>
            )}

            {/* Starting Position Selector - Only for Avery mode */}
            {config.templateMode === 'avery' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="useStartPosition"
                    checked={config.useStartPosition}
                    onCheckedChange={(checked) => {
                      updateConfig('useStartPosition', !!checked);
                      if (!checked) {
                        updateConfig('startPosition', 1);
                      }
                    }}
                  />
                  <Label htmlFor="useStartPosition" className="text-xs cursor-pointer">
                    Start from specific position (for partial sheets)
                  </Label>
                </div>
                
                {config.useStartPosition && (
                  <AveryPositionSelector
                    templateId={config.averyTemplate}
                    startPosition={config.startPosition}
                    onPositionChange={(pos) => updateConfig('startPosition', pos)}
                    labelsNeeded={selectedLabels.length}
                  />
                )}
              </div>
            )}

            {/* Custom Label Settings - Only show when in custom mode */}
            {config.templateMode === 'custom' && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Label Settings
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label Size</Label>
                    <Select
                      value={config.labelSize}
                      onValueChange={(v) => updateConfig('labelSize', v as LabelSize)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LABEL_SIZES).map(([key, size]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {size.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      {LABEL_SIZES[config.labelSize].description}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Paper Size</Label>
                    <Select
                      value={config.paperSize}
                      onValueChange={(v) => updateConfig('paperSize', v as PaperSize)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAPER_SIZES).map(([key, paper]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {paper.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Border Style</Label>
                    <Select
                      value={config.borderStyle}
                      onValueChange={(v) => updateConfig('borderStyle', v as BorderStyle)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashed" className="text-xs">Dashed (Cut Guide)</SelectItem>
                        <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                        <SelectItem value="none" className="text-xs">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Color Scheme</Label>
                    <Select
                      value={config.colorScheme}
                      onValueChange={(v) => updateConfig('colorScheme', v as ColorScheme)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard" className="text-xs">Standard</SelectItem>
                        <SelectItem value="high-contrast" className="text-xs">High Contrast</SelectItem>
                        <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Content Options */}
            <div className="space-y-2">
              <Label className="text-xs">Include Elements</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'showQRCode', label: 'QR Code' },
                  { key: 'showZoneName', label: 'Zone Name' },
                  { key: 'showTargetNC', label: 'Target NC' },
                  { key: 'showFloorName', label: 'Floor Name' },
                  { key: 'showSpaceType', label: 'Space Type' },
                  { key: 'showInstructions', label: 'Scan Instructions' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={config[key as keyof LabelGeneratorConfig] as boolean}
                      onCheckedChange={(checked) => 
                        updateConfig(key as keyof LabelGeneratorConfig, checked as boolean)
                      }
                    />
                    <Label htmlFor={key} className="text-xs cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Zone Selection</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectedZoneIds.size === allLabelData.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll" className="text-xs cursor-pointer">
                    Select All ({allLabelData.length})
                  </Label>
                </div>
              </div>

              <ScrollArea className="h-40 border rounded-md p-2">
                {Array.from(zonesByFloor.entries()).map(([floor, floorZones]) => (
                  <div key={floor} className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox
                        checked={floorZones.every(z => selectedZoneIds.has(z.zoneId))}
                        onCheckedChange={(checked) => handleSelectFloor(floor, !!checked)}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {floor} ({floorZones.length})
                      </span>
                    </div>
                    <div className="ml-5 space-y-1">
                      {floorZones.map(zone => (
                        <div key={zone.zoneId} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedZoneIds.has(zone.zoneId)}
                            onCheckedChange={(checked) => 
                              handleSelectZone(zone.zoneId, !!checked)
                            }
                          />
                          <span className="text-xs truncate">
                            {zone.zoneName}
                            <span className="text-muted-foreground ml-1">
                              (NC-{zone.targetNC})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Preview</h3>
            <LabelPreview
              zones={selectedLabels}
              config={config}
              projectId={projectId}
            />
          </div>
        </div>

        {/* Hidden print content */}
        <div className="hidden">
          <LabelPrintSheet
            ref={printRef}
            zones={selectedLabels}
            config={config}
            projectId={projectId}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedLabels.length} label{selectedLabels.length !== 1 ? 's' : ''} selected
            {' · '}
            {totalPages} page{totalPages !== 1 ? 's' : ''}
            {config.templateMode === 'avery' && (
              <span className="ml-1">
                ({AVERY_TEMPLATES[config.averyTemplate]?.name})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrint}
              disabled={selectedLabels.length === 0}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
