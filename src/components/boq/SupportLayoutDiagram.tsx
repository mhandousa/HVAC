import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  generateSupportLayout, 
  generateSVGPaths, 
  getLayoutLegend,
  SupportLayoutData,
  LayoutSegment 
} from '@/lib/support-layout-generator';

interface SupportLayoutDiagramProps {
  segments: Array<{
    id: string;
    name: string;
    lengthFt: number;
    shape: 'round' | 'rectangular';
    diameterIn?: number;
    widthIn?: number;
    heightIn?: number;
    application: 'duct' | 'pipe';
    isRiser?: boolean;
  }>;
  showSeismic?: boolean;
  seismicSpacing?: number;
  showDimensions?: boolean;
}

export function SupportLayoutDiagram({
  segments,
  showSeismic = false,
  seismicSpacing = 30,
  showDimensions = true,
}: SupportLayoutDiagramProps) {
  const layoutData = useMemo(() => {
    if (!segments || segments.length === 0) return null;
    return generateSupportLayout(segments, {
      includeSeismic: showSeismic,
      seismicBraceSpacing: seismicSpacing,
      showDimensions,
      scale: 15,
      maxWidth: 900,
    });
  }, [segments, showSeismic, seismicSpacing, showDimensions]);

  if (!layoutData || layoutData.segments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No segments available for layout diagram
        </CardContent>
      </Card>
    );
  }

  const legendItems = getLayoutLegend(showSeismic);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Support Layout Diagram</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{layoutData.totalHangers} Hangers</Badge>
            {showSeismic && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                {layoutData.totalSeismicBraces} Seismic Braces
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            width={Math.min(layoutData.bounds.width, 900)}
            height={layoutData.bounds.height}
            className="bg-card border rounded"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--muted))" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Segments */}
            {layoutData.segments.map((segment, idx) => {
              const yOffset = idx * 90 + 20;
              const paths = generateSVGPaths(segment, yOffset, layoutData.scale, {
                showDimensions,
                showSeismic,
              });

              return (
                <g key={segment.id}>
                  {/* Duct/Pipe body */}
                  <path
                    d={paths.segmentPath}
                    fill={segment.application === 'duct' ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.3)'}
                    stroke={segment.application === 'duct' ? 'hsl(var(--primary))' : 'hsl(var(--secondary-foreground))'}
                    strokeWidth="2"
                  />

                  {/* Hangers */}
                  {paths.hangerPaths.map((path, i) => (
                    <path
                      key={`hanger-${i}`}
                      d={path}
                      fill="#3b82f6"
                      stroke="#1d4ed8"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Seismic braces */}
                  {paths.seismicPaths.map((path, i) => (
                    <path
                      key={`seismic-${i}`}
                      d={path}
                      fill="#f97316"
                      stroke="#c2410c"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Dimension lines */}
                  {paths.dimensionLines.map((path, i) => (
                    <path
                      key={`dim-${i}`}
                      d={path}
                      fill="none"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1"
                      strokeDasharray="4,2"
                    />
                  ))}

                  {/* Labels */}
                  {paths.labels.map((label, i) => (
                    <text
                      key={`label-${i}`}
                      x={label.x}
                      y={label.y}
                      fontSize="11"
                      fill="hsl(var(--foreground))"
                      textAnchor={i === 0 ? 'end' : 'start'}
                    >
                      {label.text}
                    </text>
                  ))}
                </g>
              );
            })}

            {/* Legend */}
            <g transform={`translate(60, ${layoutData.bounds.height - 40})`}>
              {legendItems.map((item, idx) => (
                <g key={item.type} transform={`translate(${idx * 150}, 0)`}>
                  <text fontSize="14" fill={item.color} y="4">{item.symbol}</text>
                  <text fontSize="11" fill="hsl(var(--muted-foreground))" x="20" y="4">{item.label}</text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Spacing per SMACNA HVAC Duct Construction Standards • Scale: {layoutData.scale.toFixed(1)} px/ft
        </div>
      </CardContent>
    </Card>
  );
}
