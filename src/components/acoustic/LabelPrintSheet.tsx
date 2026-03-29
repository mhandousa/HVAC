import React, { forwardRef, useMemo } from 'react';
import { AcousticZoneLabel, ZoneLabelData } from './AcousticZoneLabel';
import { AveryZoneLabel } from './AveryZoneLabel';
import { 
  LabelGeneratorConfig, 
  LABEL_SIZES, 
  PAPER_SIZES, 
  AVERY_TEMPLATES,
  calculateLabelsPerPage,
  getAveryLabelPosition,
} from '@/lib/label-templates';

interface LabelPrintSheetProps {
  zones: ZoneLabelData[];
  config: LabelGeneratorConfig;
  projectId: string;
}

export const LabelPrintSheet = forwardRef<HTMLDivElement, LabelPrintSheetProps>(
  ({ zones, config, projectId }, ref) => {
    const isAveryMode = config.templateMode === 'avery';
    const averyTemplate = isAveryMode ? AVERY_TEMPLATES[config.averyTemplate] : null;

    // Calculate layout based on template mode
    const layoutConfig = useMemo(() => {
      if (isAveryMode && averyTemplate) {
        return {
          labelWidth: averyTemplate.labelWidth,
          labelHeight: averyTemplate.labelHeight,
          columns: averyTemplate.columns,
          rows: averyTemplate.rows,
          total: averyTemplate.columns * averyTemplate.rows,
          pageWidth: averyTemplate.pageWidth,
          pageHeight: averyTemplate.pageHeight,
          margins: {
            top: averyTemplate.topMargin,
            left: averyTemplate.leftMargin,
            right: 0,
            bottom: 0,
          },
          gapX: averyTemplate.horizontalGap,
          gapY: averyTemplate.verticalGap,
        };
      }
      
      // Custom label layout
      const labelConfig = LABEL_SIZES[config.labelSize];
      const paperConfig = PAPER_SIZES[config.paperSize];
      const { columns, rows, total } = calculateLabelsPerPage(config.labelSize, config.paperSize);
      const { width: labelWidth, height: labelHeight } = labelConfig.dimensions;
      const { top, right, bottom, left } = paperConfig.margins;
      
      const availableWidth = paperConfig.width - left - right;
      const availableHeight = paperConfig.height - top - bottom;
      const gapX = columns > 1 ? (availableWidth - (columns * labelWidth)) / (columns - 1) : 0;
      const gapY = rows > 1 ? (availableHeight - (rows * labelHeight)) / (rows - 1) : 0;
      
      return {
        labelWidth,
        labelHeight,
        columns,
        rows,
        total,
        pageWidth: paperConfig.width,
        pageHeight: paperConfig.height,
        margins: { top, left, right, bottom },
        gapX,
        gapY,
      };
    }, [isAveryMode, averyTemplate, config.labelSize, config.paperSize]);

    // Calculate starting position offset for Avery mode
    const startOffset = useMemo(() => {
      if (isAveryMode && config.useStartPosition && config.startPosition > 1) {
        return config.startPosition - 1;
      }
      return 0;
    }, [isAveryMode, config.useStartPosition, config.startPosition]);

    // Split zones into pages, accounting for starting position offset
    const pages: (ZoneLabelData | null)[][] = useMemo(() => {
      const result: (ZoneLabelData | null)[][] = [];
      
      if (isAveryMode && startOffset > 0) {
        // First page: add blank slots before actual labels
        const firstPageCapacity = layoutConfig.total - startOffset;
        const firstPageLabels = zones.slice(0, firstPageCapacity);
        const firstPage: (ZoneLabelData | null)[] = [
          ...Array(startOffset).fill(null), // Blank slots
          ...firstPageLabels,
        ];
        result.push(firstPage);
        
        // Remaining pages
        const remainingZones = zones.slice(firstPageCapacity);
        for (let i = 0; i < remainingZones.length; i += layoutConfig.total) {
          result.push(remainingZones.slice(i, i + layoutConfig.total));
        }
      } else {
        // Normal pagination
        for (let i = 0; i < zones.length; i += layoutConfig.total) {
          result.push(zones.slice(i, i + layoutConfig.total));
        }
      }
      
      return result;
    }, [zones, layoutConfig.total, isAveryMode, startOffset]);
    
    return (
      <div ref={ref} className="label-print-container">
        <style>
          {`
            @media print {
              @page {
                size: ${isAveryMode ? '8.5in 11in' : (config.paperSize === 'letter' ? '8.5in 11in' : '210mm 297mm')};
                margin: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
              }
              
              .label-print-container {
                margin: 0;
                padding: 0;
              }
              
              .label-page, .avery-page {
                page-break-after: always;
                page-break-inside: avoid;
              }
              
              .label-page:last-child, .avery-page:last-child {
                page-break-after: auto;
              }
              
              .label-item, .avery-label {
                page-break-inside: avoid;
              }
              
              /* Ensure QR codes print correctly */
              svg {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              /* Hide screen-only elements */
              .no-print {
                display: none !important;
              }
            }
            
            @media screen {
              .label-page, .avery-page {
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
            }
          `}
        </style>
        
        {isAveryMode && averyTemplate ? (
          // Avery template layout with absolute positioning
          pages.map((pageZones, pageIndex) => (
            <div
              key={pageIndex}
              className="avery-page bg-white"
              style={{
                width: `${layoutConfig.pageWidth}mm`,
                height: `${layoutConfig.pageHeight}mm`,
                position: 'relative',
                boxSizing: 'border-box',
              }}
            >
              {pageZones.map((zone, index) => {
                const position = getAveryLabelPosition(index, config.averyTemplate);
                
                // If zone is null, render empty placeholder (for skipped positions)
                if (zone === null) {
                  return (
                    <div
                      key={`blank-${index}`}
                      className="avery-label"
                      style={{
                        position: 'absolute',
                        left: `${position.left}mm`,
                        top: `${position.top}mm`,
                        width: `${layoutConfig.labelWidth}mm`,
                        height: `${layoutConfig.labelHeight}mm`,
                        // Empty - no content
                      }}
                    />
                  );
                }
                
                return (
                  <div
                    key={zone.zoneId}
                    className="avery-label"
                    style={{
                      position: 'absolute',
                      left: `${position.left}mm`,
                      top: `${position.top}mm`,
                      width: `${layoutConfig.labelWidth}mm`,
                      height: `${layoutConfig.labelHeight}mm`,
                      overflow: 'hidden',
                    }}
                  >
                    <AveryZoneLabel
                      zone={zone}
                      templateId={config.averyTemplate}
                      config={config}
                      projectId={projectId}
                    />
                  </div>
                );
              })}
              
              {/* Page number (hidden in print) */}
              <div className="no-print absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                Page {pageIndex + 1} of {pages.length}
              </div>
            </div>
          ))
        ) : (
          // Custom label layout with CSS grid
          pages.map((pageZones, pageIndex) => (
            <div
              key={pageIndex}
              className="label-page bg-white"
              style={{
                width: `${layoutConfig.pageWidth}mm`,
                height: `${layoutConfig.pageHeight}mm`,
                padding: `${layoutConfig.margins.top}mm ${layoutConfig.margins.right}mm ${layoutConfig.margins.bottom}mm ${layoutConfig.margins.left}mm`,
                boxSizing: 'border-box',
              }}
            >
              <div
                className="label-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${layoutConfig.columns}, ${layoutConfig.labelWidth}mm)`,
                  gridTemplateRows: `repeat(${layoutConfig.rows}, ${layoutConfig.labelHeight}mm)`,
                  gap: `${layoutConfig.gapY}mm ${layoutConfig.gapX}mm`,
                  justifyContent: 'start',
                  alignContent: 'start',
                }}
              >
                {pageZones.map((zone) => (
                  <div
                    key={zone.zoneId}
                    className="label-item"
                    style={{
                      width: `${layoutConfig.labelWidth}mm`,
                      height: `${layoutConfig.labelHeight}mm`,
                    }}
                  >
                    <AcousticZoneLabel
                      zone={zone}
                      config={config}
                      projectId={projectId}
                      forPrint={true}
                    />
                  </div>
                ))}
              </div>
              
              {/* Page number (hidden in print) */}
              <div className="no-print text-xs text-muted-foreground text-center mt-2">
                Page {pageIndex + 1} of {pages.length}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
);

LabelPrintSheet.displayName = 'LabelPrintSheet';
