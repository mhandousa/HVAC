import { useMemo } from 'react';
import { AVERY_TEMPLATES } from '@/lib/label-templates';

interface AveryTestPageProps {
  templateId: string;
}

export function AveryTestPage({ templateId }: AveryTestPageProps) {
  const template = AVERY_TEMPLATES[templateId];
  
  const pageStyle = useMemo(() => ({
    width: '215.9mm',
    height: '279.4mm',
    position: 'relative' as const,
    background: 'white',
    overflow: 'hidden',
    pageBreakAfter: 'always' as const,
  }), []);

  const labels = useMemo(() => {
    const result = [];
    const total = template.columns * template.rows;
    
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / template.columns);
      const col = i % template.columns;
      
      const x = template.leftMargin + col * (template.labelWidth + template.horizontalGap);
      const y = template.topMargin + row * (template.labelHeight + template.verticalGap);
      
      // Only show TEST in corner labels
      const isCorner = (
        (row === 0 && col === 0) ||
        (row === 0 && col === template.columns - 1) ||
        (row === template.rows - 1 && col === 0) ||
        (row === template.rows - 1 && col === template.columns - 1)
      );
      
      result.push({
        position: i + 1,
        x,
        y,
        width: template.labelWidth,
        height: template.labelHeight,
        isCorner,
      });
    }
    
    return result;
  }, [template]);

  return (
    <div className="avery-test-page" style={pageStyle}>
      {/* Corner Registration Marks */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Top-left corner mark */}
        <line x1="5mm" y1="10mm" x2="15mm" y2="10mm" stroke="black" strokeWidth="0.5" />
        <line x1="10mm" y1="5mm" x2="10mm" y2="15mm" stroke="black" strokeWidth="0.5" />
        
        {/* Top-right corner mark */}
        <line x1="200.9mm" y1="10mm" x2="210.9mm" y2="10mm" stroke="black" strokeWidth="0.5" />
        <line x1="205.9mm" y1="5mm" x2="205.9mm" y2="15mm" stroke="black" strokeWidth="0.5" />
        
        {/* Bottom-left corner mark */}
        <line x1="5mm" y1="269.4mm" x2="15mm" y2="269.4mm" stroke="black" strokeWidth="0.5" />
        <line x1="10mm" y1="264.4mm" x2="10mm" y2="274.4mm" stroke="black" strokeWidth="0.5" />
        
        {/* Bottom-right corner mark */}
        <line x1="200.9mm" y1="269.4mm" x2="210.9mm" y2="269.4mm" stroke="black" strokeWidth="0.5" />
        <line x1="205.9mm" y1="264.4mm" x2="205.9mm" y2="274.4mm" stroke="black" strokeWidth="0.5" />
        
        {/* Corner labels */}
        <text x="3mm" y="7mm" fontSize="6" fill="black">TEST</text>
        <text x="195mm" y="7mm" fontSize="6" fill="black" textAnchor="end">TEST</text>
        <text x="3mm" y="277mm" fontSize="6" fill="black">TEST</text>
        <text x="195mm" y="277mm" fontSize="6" fill="black" textAnchor="end">TEST</text>
      </svg>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '3mm',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10pt',
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {template.name} ALIGNMENT TEST
      </div>
      <div
        style={{
          position: 'absolute',
          top: '8mm',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '8pt',
          color: '#666',
          textAlign: 'center',
        }}
      >
        {template.columns * template.rows} Labels Per Sheet ({template.columns}×{template.rows})
      </div>

      {/* Label Outlines */}
      {labels.map((label) => (
        <div
          key={label.position}
          style={{
            position: 'absolute',
            left: `${label.x}mm`,
            top: `${label.y}mm`,
            width: `${label.width}mm`,
            height: `${label.height}mm`,
            border: '1px dashed #999',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10pt',
            color: '#666',
          }}
        >
          <span style={{ fontSize: '12pt', fontWeight: 'bold', color: '#333' }}>
            {label.position}
          </span>
          {label.isCorner && (
            <span style={{ 
              fontSize: '8pt', 
              fontWeight: 'bold',
              color: '#000',
              background: '#fff',
              padding: '1mm 2mm',
              border: '1px solid #000',
              marginTop: '2mm',
            }}>
              TEST
            </span>
          )}
        </div>
      ))}

      {/* Ruler markings - left edge */}
      <svg
        style={{
          position: 'absolute',
          top: `${template.topMargin}mm`,
          left: '2mm',
          width: '5mm',
          height: `${template.rows * template.labelHeight + (template.rows - 1) * template.verticalGap}mm`,
        }}
      >
        {Array.from({ length: Math.ceil(template.rows * template.labelHeight / 10) + 1 }).map((_, i) => (
          <g key={i}>
            <line
              x1="3mm"
              y1={`${i * 10}mm`}
              x2="5mm"
              y2={`${i * 10}mm`}
              stroke="black"
              strokeWidth="0.3"
            />
            <text x="0" y={`${i * 10 + 1}mm`} fontSize="5" fill="black">
              {i * 10}
            </text>
          </g>
        ))}
      </svg>

      {/* Ruler markings - top edge */}
      <svg
        style={{
          position: 'absolute',
          top: '15mm',
          left: `${template.leftMargin}mm`,
          width: `${template.columns * template.labelWidth + (template.columns - 1) * template.horizontalGap}mm`,
          height: '5mm',
        }}
      >
        {Array.from({ length: Math.ceil(template.columns * template.labelWidth / 10) + 1 }).map((_, i) => (
          <g key={i}>
            <line
              x1={`${i * 10}mm`}
              y1="0"
              x2={`${i * 10}mm`}
              y2="2mm"
              stroke="black"
              strokeWidth="0.3"
            />
            <text x={`${i * 10 - 1}mm`} y="5mm" fontSize="5" fill="black">
              {i * 10}
            </text>
          </g>
        ))}
      </svg>

      {/* Instructions at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '5mm',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180mm',
          fontSize: '7pt',
          color: '#333',
          textAlign: 'center',
          padding: '3mm',
          border: '1px solid #ccc',
          background: '#f9f9f9',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>VERIFICATION INSTRUCTIONS</div>
        <div>1. Print this page on plain paper</div>
        <div>2. Place an unused {template.name} sheet on top</div>
        <div>3. Hold up to light to verify alignment</div>
        <div>4. Dashed boxes should align with label edges</div>
      </div>
    </div>
  );
}

export function generateTestPageHTML(templateId: string): string {
  const template = AVERY_TEMPLATES[templateId];
  const total = template.columns * template.rows;
  
  let labelsHTML = '';
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / template.columns);
    const col = i % template.columns;
    
    const x = template.leftMargin + col * (template.labelWidth + template.horizontalGap);
    const y = template.topMargin + row * (template.labelHeight + template.verticalGap);
    
    const isCorner = (
      (row === 0 && col === 0) ||
      (row === 0 && col === template.columns - 1) ||
      (row === template.rows - 1 && col === 0) ||
      (row === template.rows - 1 && col === template.columns - 1)
    );
    
    labelsHTML += `
      <div style="
        position: absolute;
        left: ${x}mm;
        top: ${y}mm;
        width: ${template.labelWidth}mm;
        height: ${template.labelHeight}mm;
        border: 1px dashed #999;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 10pt;
        color: #666;
      ">
        <span style="font-size: 12pt; font-weight: bold; color: #333;">${i + 1}</span>
        ${isCorner ? `
          <span style="
            font-size: 8pt;
            font-weight: bold;
            color: #000;
            background: #fff;
            padding: 1mm 2mm;
            border: 1px solid #000;
            margin-top: 2mm;
          ">TEST</span>
        ` : ''}
      </div>
    `;
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${template.name} Alignment Test</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; }
          @page { size: 8.5in 11in; margin: 0; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="
          width: 215.9mm;
          height: 279.4mm;
          position: relative;
          background: white;
          overflow: hidden;
        ">
          <!-- Corner Registration Marks -->
          <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
            <line x1="5mm" y1="10mm" x2="15mm" y2="10mm" stroke="black" stroke-width="0.5" />
            <line x1="10mm" y1="5mm" x2="10mm" y2="15mm" stroke="black" stroke-width="0.5" />
            <line x1="200.9mm" y1="10mm" x2="210.9mm" y2="10mm" stroke="black" stroke-width="0.5" />
            <line x1="205.9mm" y1="5mm" x2="205.9mm" y2="15mm" stroke="black" stroke-width="0.5" />
            <line x1="5mm" y1="269.4mm" x2="15mm" y2="269.4mm" stroke="black" stroke-width="0.5" />
            <line x1="10mm" y1="264.4mm" x2="10mm" y2="274.4mm" stroke="black" stroke-width="0.5" />
            <line x1="200.9mm" y1="269.4mm" x2="210.9mm" y2="269.4mm" stroke="black" stroke-width="0.5" />
            <line x1="205.9mm" y1="264.4mm" x2="205.9mm" y2="274.4mm" stroke="black" stroke-width="0.5" />
            <text x="3mm" y="7mm" font-size="6" fill="black">TEST</text>
            <text x="195mm" y="7mm" font-size="6" fill="black" text-anchor="end">TEST</text>
            <text x="3mm" y="277mm" font-size="6" fill="black">TEST</text>
            <text x="195mm" y="277mm" font-size="6" fill="black" text-anchor="end">TEST</text>
          </svg>
          
          <!-- Title -->
          <div style="
            position: absolute;
            top: 3mm;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
          ">${template.name} ALIGNMENT TEST</div>
          <div style="
            position: absolute;
            top: 8mm;
            left: 50%;
            transform: translateX(-50%);
            font-size: 8pt;
            color: #666;
            text-align: center;
          ">${total} Labels Per Sheet (${template.columns}×${template.rows})</div>
          
          <!-- Label Outlines -->
          ${labelsHTML}
          
          <!-- Instructions -->
          <div style="
            position: absolute;
            bottom: 5mm;
            left: 50%;
            transform: translateX(-50%);
            width: 180mm;
            font-size: 7pt;
            color: #333;
            text-align: center;
            padding: 3mm;
            border: 1px solid #ccc;
            background: #f9f9f9;
          ">
            <div style="font-weight: bold; margin-bottom: 2mm;">VERIFICATION INSTRUCTIONS</div>
            <div>1. Print this page on plain paper</div>
            <div>2. Place an unused ${template.name} sheet on top</div>
            <div>3. Hold up to light to verify alignment</div>
            <div>4. Dashed boxes should align with label edges</div>
          </div>
        </div>
      </body>
    </html>
  `;
}
