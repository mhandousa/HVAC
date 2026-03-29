import React, { useMemo } from 'react';
import { AcousticZoneLabel, ZoneLabelData } from './AcousticZoneLabel';
import { AveryZoneLabel } from './AveryZoneLabel';
import { 
  LabelGeneratorConfig, 
  LABEL_SIZES, 
  AVERY_TEMPLATES,
  calculateLabelsPerPage,
  getAveryLayoutInfo,
} from '@/lib/label-templates';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LabelPreviewProps {
  zones: ZoneLabelData[];
  config: LabelGeneratorConfig;
  projectId: string;
  maxPreviewLabels?: number;
}

export function LabelPreview({
  zones,
  config,
  projectId,
  maxPreviewLabels = 6,
}: LabelPreviewProps) {
  const isAveryMode = config.templateMode === 'avery';
  const averyTemplate = isAveryMode ? AVERY_TEMPLATES[config.averyTemplate] : null;
  
  // Calculate layout info based on mode
  const layoutInfo = useMemo(() => {
    if (isAveryMode && averyTemplate) {
      const info = getAveryLayoutInfo(config.averyTemplate);
      return {
        columns: info.columns,
        rows: info.rows,
        total: info.total,
        labelWidth: averyTemplate.labelWidth,
        labelHeight: averyTemplate.labelHeight,
        templateName: averyTemplate.name,
      };
    }
    
    const { columns, rows, total } = calculateLabelsPerPage(config.labelSize, config.paperSize);
    const labelConfig = LABEL_SIZES[config.labelSize];
    return {
      columns,
      rows,
      total,
      labelWidth: labelConfig.dimensions.width,
      labelHeight: labelConfig.dimensions.height,
      templateName: labelConfig.name,
    };
  }, [isAveryMode, averyTemplate, config.averyTemplate, config.labelSize, config.paperSize]);

  const previewZones = zones.slice(0, maxPreviewLabels);
  
  // Calculate total pages accounting for starting position
  const totalPages = useMemo(() => {
    if (zones.length === 0) return 0;
    
    if (isAveryMode && config.useStartPosition && config.startPosition > 1) {
      const offset = config.startPosition - 1;
      const firstPageCapacity = layoutInfo.total - offset;
      
      if (zones.length <= firstPageCapacity) {
        return 1;
      }
      
      const remainingLabels = zones.length - firstPageCapacity;
      return 1 + Math.ceil(remainingLabels / layoutInfo.total);
    }
    
    return Math.ceil(zones.length / layoutInfo.total);
  }, [zones.length, layoutInfo.total, isAveryMode, config.useStartPosition, config.startPosition]);
  
  if (zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted/30 rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">
          Select zones to preview labels
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Preview ({previewZones.length} of {zones.length} labels)
        </span>
        <span className="text-muted-foreground">
          {layoutInfo.columns}×{layoutInfo.rows} = {layoutInfo.total} per page
        </span>
      </div>
      
      {/* Starting position info */}
      {isAveryMode && config.useStartPosition && config.startPosition > 1 && (
        <div className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-md px-2 py-1">
          Starting at position {config.startPosition} — first {config.startPosition - 1} slot{config.startPosition > 2 ? 's' : ''} will be empty
        </div>
      )}
      
      <ScrollArea className="h-64 rounded-lg border bg-muted/20 p-4">
        <div 
          className="flex flex-wrap gap-3 justify-center"
          style={{
            maxWidth: '100%',
          }}
        >
          {previewZones.map((zone) => (
            <div key={zone.zoneId} className="flex-shrink-0">
              {isAveryMode ? (
                <div 
                  className="border border-dashed border-muted-foreground/30 rounded"
                  style={{
                    transform: 'scale(0.8)',
                    transformOrigin: 'top left',
                  }}
                >
                  <AveryZoneLabel
                    zone={zone}
                    templateId={config.averyTemplate}
                    config={config}
                    projectId={projectId}
                  />
                </div>
              ) : (
                <AcousticZoneLabel
                  zone={zone}
                  config={config}
                  projectId={projectId}
                  forPrint={false}
                />
              )}
            </div>
          ))}
        </div>
        
        {zones.length > maxPreviewLabels && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            +{zones.length - maxPreviewLabels} more labels...
          </div>
        )}
      </ScrollArea>
      
      <div className="text-xs text-muted-foreground text-center">
        {isAveryMode ? (
          <>
            Template: {layoutInfo.templateName} ({layoutInfo.labelWidth}×{layoutInfo.labelHeight}mm)
          </>
        ) : (
          <>
            Label size: {layoutInfo.templateName} ({layoutInfo.labelWidth}×{layoutInfo.labelHeight}mm)
          </>
        )}
        {' · '}
        {totalPages} page{totalPages !== 1 ? 's' : ''} required
      </div>
    </div>
  );
}