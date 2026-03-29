import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CoolingCoilConfig, HeatingCoilConfig, PreheatCoilConfig, FanConfig, FilterConfig } from '@/lib/ahu-calculations';
import { useMemo } from 'react';

interface AHUSchematicProps {
  ahuTag?: string;
  designCfm: number;
  outdoorAirCfm: number;
  returnAirCfm: number;
  coolingCoil: CoolingCoilConfig | null;
  heatingCoil: HeatingCoilConfig | null;
  preheatCoil: PreheatCoilConfig | null;
  supplyFan: FanConfig | null;
  returnFan: FanConfig | null;
  reliefFan: FanConfig | null;
  controlStrategy: 'vav' | 'cav' | 'doas' | string;
  hasEconomizer: boolean;
  filterConfig?: FilterConfig;
}

interface PositionMap {
  oaDamper: { x: number; y: number };
  raDamper: { x: number; y: number };
  mixingBox: { x: number; y: number };
  filter: { x: number; y: number };
  preheatCoil?: { x: number; y: number };
  coolingCoil?: { x: number; y: number };
  heatingCoil?: { x: number; y: number };
  supplyFan: { x: number; y: number };
  supplyOutlet: { x: number; y: number };
  returnInlet: { x: number; y: number };
  returnFan?: { x: number; y: number };
  reliefFan?: { x: number; y: number };
}

// Color constants using CSS variables for theming
const COLORS = {
  outsideAir: 'hsl(200, 80%, 50%)', // Blue
  supplyAir: 'hsl(180, 70%, 45%)',  // Cyan
  returnAir: 'hsl(25, 80%, 55%)',   // Orange
  exhaustAir: 'hsl(0, 0%, 50%)',    // Gray
  coolingCoil: 'hsl(210, 90%, 60%)',
  heatingCoil: 'hsl(15, 90%, 55%)',
  preheatCoil: 'hsl(35, 90%, 55%)',
  filter: 'hsl(120, 30%, 50%)',
  fan: 'hsl(220, 15%, 40%)',
  damper: 'hsl(0, 0%, 45%)',
};

// Animated airflow line component
function AirflowLine({ 
  x1, y1, x2, y2, 
  color, 
  animated = true,
  strokeWidth = 2 
}: { 
  x1: number; y1: number; x2: number; y2: number; 
  color: string; 
  animated?: boolean;
  strokeWidth?: number;
}) {
  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="8,4"
        opacity={0.7}
      >
        {animated && (
          <animate
            attributeName="stroke-dashoffset"
            from="12"
            to="0"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
      </line>
      {/* Arrow head */}
      <polygon
        points={`${x2},${y2} ${x2-8},${y2-4} ${x2-8},${y2+4}`}
        fill={color}
        transform={`rotate(${Math.atan2(y2-y1, x2-x1) * 180 / Math.PI}, ${x2}, ${y2})`}
      />
    </g>
  );
}

// Damper element
function DamperElement({ 
  x, y, 
  width = 30, 
  height = 50,
  label,
  cfm,
  isOpen = true 
}: { 
  x: number; y: number; 
  width?: number; 
  height?: number;
  label: string;
  cfm: number;
  isOpen?: boolean;
}) {
  const louverCount = 4;
  const louverSpacing = height / (louverCount + 1);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Damper frame */}
      <rect
        x={0} y={0}
        width={width} height={height}
        fill="none"
        stroke={COLORS.damper}
        strokeWidth={2}
        rx={2}
      />
      {/* Louver blades */}
      {Array.from({ length: louverCount }).map((_, i) => {
        const yPos = louverSpacing * (i + 1);
        const rotation = isOpen ? 0 : 45;
        return (
          <line
            key={i}
            x1={3}
            y1={yPos}
            x2={width - 3}
            y2={yPos}
            stroke={COLORS.damper}
            strokeWidth={2}
            transform={`rotate(${rotation}, ${width/2}, ${yPos})`}
            style={{ transition: 'transform 0.3s ease' }}
          />
        );
      })}
      {/* Label */}
      <text
        x={width / 2}
        y={-8}
        textAnchor="middle"
        className="fill-foreground text-[10px] font-medium"
      >
        {label}
      </text>
      {/* CFM value */}
      <text
        x={width / 2}
        y={height + 14}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        {cfm.toLocaleString()} CFM
      </text>
    </g>
  );
}

// Filter bank element
function FilterElement({ 
  x, y, 
  width = 35, 
  height = 60,
  mervRating = 13
}: { 
  x: number; y: number; 
  width?: number; 
  height?: number;
  mervRating?: number;
}) {
  const pleats = 6;
  const pleatWidth = width / pleats;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Filter frame */}
      <rect
        x={0} y={0}
        width={width} height={height}
        fill={`${COLORS.filter}20`}
        stroke={COLORS.filter}
        strokeWidth={2}
        rx={2}
      />
      {/* Pleated media */}
      <path
        d={Array.from({ length: pleats }).map((_, i) => {
          const xStart = i * pleatWidth;
          const xMid = xStart + pleatWidth / 2;
          const xEnd = xStart + pleatWidth;
          return `M${xStart + 2},${height - 4} L${xMid},4 L${xEnd - 2},${height - 4}`;
        }).join(' ')}
        fill="none"
        stroke={COLORS.filter}
        strokeWidth={1.5}
      />
      {/* Label */}
      <text
        x={width / 2}
        y={-8}
        textAnchor="middle"
        className="fill-foreground text-[10px] font-medium"
      >
        Filter
      </text>
      <text
        x={width / 2}
        y={height + 14}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        MERV {mervRating}
      </text>
    </g>
  );
}

// Coil element
function CoilElement({ 
  x, y, 
  width = 40, 
  height = 60,
  type,
  rows = 6,
  coilType = 'chw'
}: { 
  x: number; y: number; 
  width?: number; 
  height?: number;
  type: 'cooling' | 'heating' | 'preheat';
  rows?: number;
  coilType?: string;
}) {
  const color = type === 'cooling' ? COLORS.coolingCoil : 
                type === 'preheat' ? COLORS.preheatCoil : COLORS.heatingCoil;
  const label = type === 'cooling' ? 'CC' : type === 'preheat' ? 'PHC' : 'HC';
  const tubeCount = Math.min(rows, 8);
  const tubeSpacing = height / (tubeCount + 1);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Coil frame */}
      <rect
        x={0} y={0}
        width={width} height={height}
        fill={`${color}20`}
        stroke={color}
        strokeWidth={2}
        rx={3}
      />
      {/* Coil tubes (wavy lines) */}
      {Array.from({ length: tubeCount }).map((_, i) => {
        const yPos = tubeSpacing * (i + 1);
        return (
          <path
            key={i}
            d={`M4,${yPos} Q${width/4},${yPos-4} ${width/2},${yPos} Q${width*3/4},${yPos+4} ${width-4},${yPos}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />
        );
      })}
      {/* Label */}
      <text
        x={width / 2}
        y={-8}
        textAnchor="middle"
        className="fill-foreground text-[10px] font-medium"
      >
        {label}
      </text>
      <text
        x={width / 2}
        y={height + 14}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        {rows}-Row {coilType.toUpperCase()}
      </text>
    </g>
  );
}

// Get fan count from arrangement
function getFanCount(arrangement: string): number {
  switch (arrangement) {
    case 'parallel_2': return 2;
    case 'parallel_3': return 3;
    case 'parallel_4': return 4;
    default: return 1;
  }
}

// Fan element with animated blades
function FanElement({ 
  x, y, 
  radius = 28,
  type,
  cfm,
  bhp,
  fanCount = 1
}: { 
  x: number; y: number; 
  radius?: number;
  type: 'supply' | 'return' | 'relief';
  cfm: number;
  bhp?: number;
  fanCount?: number;
}) {
  const bladeCount = 6;
  const label = type === 'supply' ? 'SF' : type === 'return' ? 'RF' : 'EF';
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Fan housing */}
      <circle
        cx={0} cy={0}
        r={radius}
        fill={`${COLORS.fan}15`}
        stroke={COLORS.fan}
        strokeWidth={2}
      />
      {/* Fan hub */}
      <circle
        cx={0} cy={0}
        r={radius * 0.2}
        fill={COLORS.fan}
      />
      {/* Rotating blades */}
      <g style={{ animation: 'spin 2s linear infinite', transformOrigin: 'center' }}>
        {Array.from({ length: bladeCount }).map((_, i) => {
          const angle = (360 / bladeCount) * i;
          return (
            <path
              key={i}
              d={`M0,0 L${radius * 0.85},0 Q${radius * 0.7},-8 0,0`}
              fill={COLORS.fan}
              opacity={0.7}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>
      {/* Labels */}
      <text
        x={0}
        y={-radius - 10}
        textAnchor="middle"
        className="fill-foreground text-[10px] font-medium"
      >
        {label} {fanCount > 1 ? `(${fanCount}x)` : ''}
      </text>
      <text
        x={0}
        y={radius + 16}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        {cfm.toLocaleString()} CFM
      </text>
      {bhp && (
        <text
          x={0}
          y={radius + 28}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px]"
        >
          {bhp.toFixed(1)} BHP
        </text>
      )}
    </g>
  );
}

// Mixing box element
function MixingBoxElement({ 
  x, y, 
  width = 50, 
  height = 80
}: { 
  x: number; y: number; 
  width?: number; 
  height?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={0} y={0}
        width={width} height={height}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray="4,2"
        rx={4}
        className="stroke-muted-foreground"
      />
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px]"
      >
        Mix
      </text>
    </g>
  );
}

// Legend component
function SchematicLegend({ x, y }: { x: number; y: number }) {
  const items = [
    { color: COLORS.outsideAir, label: 'Outside Air' },
    { color: COLORS.supplyAir, label: 'Supply Air' },
    { color: COLORS.returnAir, label: 'Return Air' },
    { color: COLORS.exhaustAir, label: 'Exhaust Air' },
  ];
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-5} y={-5}
        width={110} height={items.length * 16 + 10}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth={1}
        rx={4}
        opacity={0.9}
      />
      {items.map((item, i) => (
        <g key={item.label} transform={`translate(0, ${i * 16})`}>
          <line
            x1={0} y1={8}
            x2={20} y2={8}
            stroke={item.color}
            strokeWidth={2}
            strokeDasharray="4,2"
          />
          <text
            x={26}
            y={11}
            className="fill-foreground text-[9px]"
          >
            {item.label}
          </text>
        </g>
      ))}
    </g>
  );
}

export function AHUSchematic({
  ahuTag = 'AHU-1',
  designCfm,
  outdoorAirCfm,
  returnAirCfm,
  coolingCoil,
  heatingCoil,
  preheatCoil,
  supplyFan,
  returnFan,
  reliefFan,
  controlStrategy,
  hasEconomizer,
  filterConfig,
}: AHUSchematicProps) {
  // Calculate positions based on which components are enabled
  const layout = useMemo(() => {
    const baseY = 120;
    const spacing = 15;
    
    let xPos = 100; // Start position after OA damper
    
    const positions: PositionMap = {
      oaDamper: { x: 30, y: baseY + 5 },
      raDamper: { x: 30, y: baseY - 70 },
      mixingBox: { x: xPos, y: baseY - 10 },
      filter: { x: 0, y: 0 }, // Will be set below
      supplyFan: { x: 0, y: 0 }, // Will be set below
      supplyOutlet: { x: 0, y: 0 },
      returnInlet: { x: 0, y: 0 },
    };
    
    xPos += 60; // After mixing box
    
    // Filter
    positions.filter = { x: xPos, y: baseY };
    xPos += 50;
    
    // Preheat coil (conditional)
    if (preheatCoil?.enabled) {
      positions.preheatCoil = { x: xPos, y: baseY };
      xPos += 55;
    }
    
    // Cooling coil (conditional)
    if (coolingCoil) {
      positions.coolingCoil = { x: xPos, y: baseY };
      xPos += 55;
    }
    
    // Heating coil (conditional)
    if (heatingCoil) {
      positions.heatingCoil = { x: xPos, y: baseY };
      xPos += 55;
    }
    
    // Supply fan
    positions.supplyFan = { x: xPos + 35, y: baseY + 30 };
    xPos += 80;
    
    // Supply outlet
    positions.supplyOutlet = { x: xPos + 20, y: baseY + 30 };
    
    // Return section
    positions.returnInlet = { x: xPos + 20, y: baseY - 60 };
    
    // Return fan (conditional)
    if (returnFan) {
      positions.returnFan = { x: xPos - 60, y: baseY - 60 };
    }
    
    // Relief fan (conditional)
    if (reliefFan) {
      positions.reliefFan = { x: 60, y: baseY - 120 };
    }
    
    return {
      positions,
      width: Math.max(xPos + 80, 700),
      height: reliefFan ? 320 : 260,
    };
  }, [coolingCoil, heatingCoil, preheatCoil, returnFan, reliefFan]);

  const { positions, width, height } = layout;
  const baseY = 120;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          AHU Schematic
        </CardTitle>
        <CardDescription>
          {ahuTag} - {controlStrategy.toUpperCase()} System • {designCfm.toLocaleString()} CFM
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto min-w-[600px]"
          style={{ minHeight: '220px' }}
        >
          {/* CSS for fan animation */}
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
          
          {/* Background grid (subtle) */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path 
                d="M 20 0 L 0 0 0 20" 
                fill="none" 
                stroke="hsl(var(--border))" 
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />
          
          {/* ===== AIRFLOW LINES ===== */}
          
          {/* Outside Air inlet arrow */}
          <AirflowLine
            x1={0} y1={baseY + 30}
            x2={positions.oaDamper.x - 5} y2={baseY + 30}
            color={COLORS.outsideAir}
            strokeWidth={3}
          />
          
          {/* OA Damper to Mixing Box */}
          <AirflowLine
            x1={positions.oaDamper.x + 35} y1={baseY + 30}
            x2={positions.mixingBox.x} y2={baseY + 30}
            color={COLORS.outsideAir}
          />
          
          {/* Return Air to Mixing Box */}
          <AirflowLine
            x1={positions.raDamper.x + 35} y1={baseY - 45}
            x2={positions.mixingBox.x + 25} y2={baseY - 5}
            color={COLORS.returnAir}
          />
          
          {/* Mixed air through components */}
          <AirflowLine
            x1={positions.mixingBox.x + 55} y1={baseY + 30}
            x2={positions.supplyFan.x - 35} y2={baseY + 30}
            color={COLORS.supplyAir}
          />
          
          {/* Supply fan to outlet */}
          <AirflowLine
            x1={positions.supplyFan.x + 35} y1={baseY + 30}
            x2={width - 20} y2={baseY + 30}
            color={COLORS.supplyAir}
            strokeWidth={3}
          />
          
          {/* Supply outlet label */}
          <text
            x={width - 10}
            y={baseY + 35}
            textAnchor="end"
            className="fill-foreground text-[10px] font-medium"
          >
            To Zones →
          </text>
          
          {/* Return air inlet */}
          <text
            x={width - 10}
            y={baseY - 55}
            textAnchor="end"
            className="fill-foreground text-[10px] font-medium"
          >
            From Zones →
          </text>
          
          {/* Return air line */}
          <AirflowLine
            x1={width - 20} y1={baseY - 60}
            x2={positions.returnFan ? positions.returnFan.x + 35 : positions.raDamper.x + 35} y2={baseY - 60}
            color={COLORS.returnAir}
          />
          
          {/* Return fan to RA damper */}
          {returnFan && positions.returnFan && (
            <AirflowLine
              x1={positions.returnFan.x - 35} y1={baseY - 60}
              x2={positions.raDamper.x + 35} y2={baseY - 60}
              color={COLORS.returnAir}
            />
          )}
          
          {/* RA damper to mixing */}
          <line
            x1={positions.raDamper.x + 15} y1={baseY - 60}
            x2={positions.raDamper.x + 15} y2={positions.raDamper.y}
            stroke={COLORS.returnAir}
            strokeWidth={2}
            strokeDasharray="8,4"
          />
          
          {/* Relief/Exhaust line */}
          {(hasEconomizer || reliefFan) && (
            <>
              <line
                x1={positions.raDamper.x + 15} y1={baseY - 85}
                x2={positions.raDamper.x + 15} y2={reliefFan ? baseY - 120 : baseY - 100}
                stroke={COLORS.exhaustAir}
                strokeWidth={2}
                strokeDasharray="8,4"
              />
              <AirflowLine
                x1={positions.raDamper.x + 15} y1={reliefFan ? baseY - 155 : baseY - 100}
                x2={0} y2={reliefFan ? baseY - 155 : baseY - 100}
                color={COLORS.exhaustAir}
              />
              <text
                x={5}
                y={reliefFan ? baseY - 160 : baseY - 105}
                className="fill-muted-foreground text-[9px]"
              >
                ← Exhaust
              </text>
            </>
          )}
          
          {/* ===== COMPONENTS ===== */}
          
          {/* OA Damper */}
          <DamperElement
            x={positions.oaDamper.x}
            y={positions.oaDamper.y}
            label="OA Damper"
            cfm={outdoorAirCfm}
            isOpen={true}
          />
          
          {/* RA Damper */}
          <DamperElement
            x={positions.raDamper.x}
            y={positions.raDamper.y}
            label="RA Damper"
            cfm={returnAirCfm}
            isOpen={true}
          />
          
          {/* Mixing Box */}
          <MixingBoxElement
            x={positions.mixingBox.x}
            y={positions.mixingBox.y}
            height={80}
          />
          
          {/* Filter */}
          <FilterElement
            x={positions.filter.x}
            y={positions.filter.y}
            mervRating={filterConfig?.finalFilterMerv || 13}
          />
          
          {/* Preheat Coil */}
          {preheatCoil?.enabled && positions.preheatCoil && (
            <CoilElement
              x={positions.preheatCoil.x}
              y={positions.preheatCoil.y}
              type="preheat"
              rows={2}
              coilType="HW"
            />
          )}
          
          {/* Cooling Coil */}
          {coolingCoil && positions.coolingCoil && (
            <CoilElement
              x={positions.coolingCoil.x}
              y={positions.coolingCoil.y}
              type="cooling"
              rows={coolingCoil.rows || 6}
              coilType={coolingCoil.coilType === 'chilled_water' ? 'CHW' : 'DX'}
            />
          )}
          
          {/* Heating Coil */}
          {heatingCoil && positions.heatingCoil && (
            <CoilElement
              x={positions.heatingCoil.x}
              y={positions.heatingCoil.y}
              type="heating"
              rows={heatingCoil.rows || 2}
              coilType={heatingCoil.coilType === 'electric' ? 'ELEC' : 'HW'}
            />
          )}
          
          {/* Supply Fan */}
          {supplyFan && (
            <FanElement
              x={positions.supplyFan.x}
              y={positions.supplyFan.y}
              type="supply"
              cfm={designCfm}
              bhp={supplyFan.bhp}
              fanCount={getFanCount(supplyFan.arrangement)}
            />
          )}
          
          {/* Return Fan */}
          {returnFan && positions.returnFan && (
            <FanElement
              x={positions.returnFan.x}
              y={positions.returnFan.y}
              type="return"
              cfm={returnAirCfm}
              bhp={returnFan.bhp}
              fanCount={getFanCount(returnFan.arrangement)}
            />
          )}
          
          {/* Relief Fan */}
          {reliefFan && positions.reliefFan && (
            <FanElement
              x={positions.reliefFan.x}
              y={positions.reliefFan.y}
              type="relief"
              cfm={Math.round(outdoorAirCfm * 0.9)}
              fanCount={getFanCount(reliefFan.arrangement)}
              radius={22}
            />
          )}
          
          {/* Legend */}
          <SchematicLegend x={width - 115} y={height - 80} />
          
          {/* System info badge */}
          <g transform={`translate(10, 10)`}>
            <rect
              x={0} y={0}
              width={140} height={24}
              fill="hsl(var(--primary))"
              rx={4}
              opacity={0.1}
            />
            <text
              x={10}
              y={16}
              className="fill-primary text-[11px] font-semibold"
            >
              {ahuTag} • {controlStrategy.toUpperCase()}
            </text>
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}
