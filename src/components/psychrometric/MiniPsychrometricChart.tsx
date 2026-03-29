import React, { useMemo, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PresetAirState {
  name: string;
  dryBulb: number;
  humidity: number;
  humidityType: 'rh' | 'wb' | 'dp' | 'relative' | 'wetBulb' | 'dewPoint';
}

interface MiniPsychrometricChartProps {
  airStates: PresetAirState[];
  altitudeFt?: number;
  width?: number;
  height?: number;
  showLabels?: boolean;
  showProcessLines?: boolean;
  className?: string;
}

// Chart constants
const PADDING = { top: 20, right: 20, bottom: 35, left: 45 };
const T_MIN = -5;
const T_MAX = 55;
const W_MIN = 0;
const W_MAX = 30;

// Color palette for state points
const STATE_COLORS = [
  'hsl(199, 89%, 48%)', // Blue - outdoor/entering
  'hsl(38, 92%, 50%)',  // Amber - return/mixed
  'hsl(152, 76%, 40%)', // Green - process
  'hsl(280, 70%, 50%)', // Purple - supply
  'hsl(340, 82%, 52%)', // Rose - additional
  'hsl(174, 72%, 40%)', // Teal - additional
];

// Calculate saturation pressure (Pa) using Magnus formula
const calcSaturationPressure = (tempC: number): number => {
  if (tempC >= 0) {
    return 610.94 * Math.exp((17.625 * tempC) / (tempC + 243.04));
  } else {
    return 610.94 * Math.exp((21.875 * tempC) / (tempC + 265.5));
  }
};

// Calculate humidity ratio from RH
const calcHumidityRatioFromRH = (tempC: number, rhPercent: number, pAtm: number): number => {
  const pvs = calcSaturationPressure(tempC);
  const pv = (rhPercent / 100) * pvs;
  const w = 0.622 * pv / (pAtm - pv);
  return w * 1000; // Convert to g/kg
};

// Calculate humidity ratio from wet bulb temperature
const calcHumidityRatioFromWB = (dryBulb: number, wetBulb: number, pAtm: number): number => {
  const pvsWb = calcSaturationPressure(wetBulb);
  const wsWb = 0.622 * pvsWb / (pAtm - pvsWb);
  const w = ((2501 - 2.326 * wetBulb) * wsWb - 1.006 * (dryBulb - wetBulb)) /
            (2501 + 1.86 * dryBulb - 4.186 * wetBulb);
  return Math.max(0, w * 1000); // g/kg
};

// Calculate humidity ratio from dew point
const calcHumidityRatioFromDP = (dewPoint: number, pAtm: number): number => {
  const pv = calcSaturationPressure(dewPoint);
  const w = 0.622 * pv / (pAtm - pv);
  return w * 1000; // g/kg
};

// Get humidity ratio based on humidity type
const getHumidityRatio = (state: PresetAirState, pAtm: number): number => {
  switch (state.humidityType) {
    case 'wb':
    case 'wetBulb':
      return calcHumidityRatioFromWB(state.dryBulb, state.humidity, pAtm);
    case 'dp':
    case 'dewPoint':
      return calcHumidityRatioFromDP(state.humidity, pAtm);
    case 'rh':
    case 'relative':
    default:
      return calcHumidityRatioFromRH(state.dryBulb, state.humidity, pAtm);
  }
};

// Calculate atmospheric pressure from altitude
const calcAtmosphericPressure = (altitudeFt: number): number => {
  const altitudeM = altitudeFt * 0.3048;
  return 101325 * Math.pow(1 - 0.0000225577 * altitudeM, 5.2559);
};

// Calculate RH from humidity ratio
const calcRHFromW = (tempC: number, w: number, pAtm: number): number => {
  const pvs = calcSaturationPressure(tempC);
  const pv = (w / 1000) * pAtm / (0.622 + w / 1000);
  return Math.min(100, Math.max(0, (pv / pvs) * 100));
};

// Calculate wet bulb from dry bulb and humidity ratio (iterative)
const calcWetBulbFromW = (dryBulb: number, w: number, pAtm: number): number => {
  let twb = dryBulb - 5;
  for (let i = 0; i < 30; i++) {
    const pvsWb = calcSaturationPressure(twb);
    const wsWb = 0.622 * pvsWb / (pAtm - pvsWb);
    const wCalc = ((2501 - 2.326 * twb) * wsWb - 1.006 * (dryBulb - twb)) /
                  (2501 + 1.86 * dryBulb - 4.186 * twb);
    if (Math.abs(w / 1000 - wCalc) < 0.00001) break;
    twb = twb - (wCalc * 1000 - w) * 0.5;
  }
  return twb;
};

// Calculate dew point from humidity ratio
const calcDewPointFromW = (w: number, pAtm: number): number => {
  const pv = (w / 1000) * pAtm / (0.622 + w / 1000);
  // Inverse of saturation pressure - approximate with Magnus formula
  const alpha = Math.log(pv / 610.94);
  return (243.04 * alpha) / (17.625 - alpha);
};

// Calculate enthalpy (kJ/kg dry air)
const calcEnthalpyMetric = (dryBulb: number, w: number): number => {
  return 1.006 * dryBulb + (w / 1000) * (2501 + 1.86 * dryBulb);
};

interface StatePointData {
  x: number;
  y: number;
  color: string;
  label: string;
  index: number;
  tempC: number;
  humidityRatio: number;
  rh: number;
  wetBulb: number;
  dewPoint: number;
  enthalpy: number;
}

export const MiniPsychrometricChart: React.FC<MiniPsychrometricChartProps> = ({
  airStates,
  altitudeFt = 0,
  width = 400,
  height = 220,
  showLabels = true,
  showProcessLines = true,
  className,
}) => {
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;
  const pAtm = calcAtmosphericPressure(altitudeFt);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [hoveredState, setHoveredState] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Coordinate conversion functions
  const toX = (tempC: number) => PADDING.left + ((tempC - T_MIN) / (T_MAX - T_MIN)) * chartWidth;
  const toY = (w: number) => height - PADDING.bottom - ((w - W_MIN) / (W_MAX - W_MIN)) * chartHeight;

  // Generate saturation curve (100% RH)
  const saturationCurve = useMemo(() => {
    const points: string[] = [];
    for (let t = 0; t <= 50; t += 1) {
      const pvs = calcSaturationPressure(t);
      const w = 0.622 * pvs / (pAtm - pvs) * 1000;
      if (w <= W_MAX) {
        points.push(`${toX(t)},${toY(w)}`);
      }
    }
    return points.join(' ');
  }, [pAtm, chartWidth, chartHeight]);

  // Generate RH lines (20%, 40%, 60%, 80%)
  const rhLines = useMemo(() => {
    const lines: { rh: number; path: string }[] = [];
    [20, 40, 60, 80].forEach(rh => {
      const points: string[] = [];
      for (let t = 0; t <= 50; t += 2) {
        const w = calcHumidityRatioFromRH(t, rh, pAtm);
        if (w <= W_MAX && w >= W_MIN) {
          points.push(`${toX(t)},${toY(w)}`);
        }
      }
      if (points.length > 1) {
        lines.push({ rh, path: points.join(' ') });
      }
    });
    return lines;
  }, [pAtm, chartWidth, chartHeight]);

  // Calculate state point positions with all psychrometric properties
  const statePoints = useMemo<StatePointData[]>(() => {
    return airStates.map((state, i) => {
      const w = getHumidityRatio(state, pAtm);
      const rh = calcRHFromW(state.dryBulb, w, pAtm);
      const wetBulb = calcWetBulbFromW(state.dryBulb, w, pAtm);
      const dewPoint = calcDewPointFromW(w, pAtm);
      const enthalpy = calcEnthalpyMetric(state.dryBulb, w);
      
      return {
        x: toX(state.dryBulb),
        y: toY(w),
        color: STATE_COLORS[i % STATE_COLORS.length],
        label: state.name,
        index: i + 1,
        tempC: state.dryBulb,
        humidityRatio: w,
        rh,
        wetBulb,
        dewPoint,
        enthalpy,
      };
    });
  }, [airStates, pAtm, chartWidth, chartHeight]);

  // Handle mouse events for tooltips
  const handleMouseEnter = (index: number, e: React.MouseEvent) => {
    setHoveredState(index);
    updateTooltipPosition(e);
  };

  const handleMouseMove = (index: number, e: React.MouseEvent) => {
    if (hoveredState === index) {
      updateTooltipPosition(e);
    }
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
  };

  const updateTooltipPosition = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Generate axis tick marks
  const tempTicks = [0, 10, 20, 30, 40, 50];
  const humidityTicks = [0, 10, 20, 30];

  const hoveredPoint = hoveredState !== null ? statePoints[hoveredState] : null;
  const tooltipFlipX = tooltipPosition.x > width * 0.6;
  const tooltipFlipY = tooltipPosition.y < 80;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Background */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={chartWidth}
          height={chartHeight}
          className="fill-muted/20"
          rx={4}
        />

        {/* Grid lines - horizontal (humidity ratio) */}
        {humidityTicks.map(w => (
          <line
            key={`h-${w}`}
            x1={PADDING.left}
            y1={toY(w)}
            x2={width - PADDING.right}
            y2={toY(w)}
            className="stroke-muted-foreground/10"
            strokeWidth={1}
          />
        ))}

        {/* Grid lines - vertical (temperature) */}
        {tempTicks.map(t => (
          <line
            key={`v-${t}`}
            x1={toX(t)}
            y1={PADDING.top}
            x2={toX(t)}
            y2={height - PADDING.bottom}
            className="stroke-muted-foreground/10"
            strokeWidth={1}
          />
        ))}

        {/* RH lines */}
        {rhLines.map(({ rh, path }) => (
          <g key={`rh-${rh}`}>
            <polyline
              points={path}
              fill="none"
              className="stroke-muted-foreground/30"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            {/* RH label at end of line */}
            <text
              x={toX(50) + 3}
              y={toY(calcHumidityRatioFromRH(50, rh, pAtm))}
              className="fill-muted-foreground/50 text-[8px]"
              dominantBaseline="middle"
            >
              {rh}%
            </text>
          </g>
        ))}

        {/* Saturation curve (100% RH) */}
        <polyline
          points={saturationCurve}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
        />
        <text
          x={toX(35)}
          y={toY(calcHumidityRatioFromRH(35, 100, pAtm)) - 6}
          className="fill-primary text-[9px] font-medium"
          textAnchor="middle"
        >
          100% RH
        </text>

        {/* Process lines with arrows */}
        {showProcessLines && statePoints.length > 1 && (
          <g>
            <defs>
              <marker
                id="mini-arrowhead"
                markerWidth="6"
                markerHeight="4"
                refX="5"
                refY="2"
                orient="auto"
              >
                <polygon
                  points="0 0, 6 2, 0 4"
                  className="fill-foreground/60"
                />
              </marker>
            </defs>
            {statePoints.slice(0, -1).map((point, i) => {
              const next = statePoints[i + 1];
              return (
                <line
                  key={`process-${i}`}
                  x1={point.x}
                  y1={point.y}
                  x2={next.x}
                  y2={next.y}
                  className="stroke-foreground/40"
                  strokeWidth={1.5}
                  markerEnd="url(#mini-arrowhead)"
                />
              );
            })}
          </g>
        )}

        {/* State points with hover interaction */}
        {statePoints.map((point, i) => (
          <g 
            key={`state-${i}`}
            onMouseEnter={(e) => handleMouseEnter(i, e)}
            onMouseMove={(e) => handleMouseMove(i, e)}
            onMouseLeave={handleMouseLeave}
            className="cursor-pointer"
          >
            {/* Invisible larger hit area for easier hovering */}
            <circle
              cx={point.x}
              cy={point.y}
              r={14}
              fill="transparent"
            />
            {/* Outer glow - enhanced on hover */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredState === i ? 12 : 10}
              fill={point.color}
              opacity={hoveredState === i ? 0.35 : 0.2}
              className="transition-all duration-150"
            />
            {/* Main circle */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredState === i ? 8 : 7}
              fill={point.color}
              className="stroke-background transition-all duration-150"
              strokeWidth={2}
            />
            {/* Index number */}
            <text
              x={point.x}
              y={point.y}
              className="fill-white text-[9px] font-bold pointer-events-none"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {point.index}
            </text>
          </g>
        ))}

        {/* X-axis labels (Temperature) */}
        {tempTicks.map(t => (
          <text
            key={`x-label-${t}`}
            x={toX(t)}
            y={height - PADDING.bottom + 15}
            className="fill-muted-foreground text-[10px]"
            textAnchor="middle"
          >
            {t}
          </text>
        ))}
        <text
          x={PADDING.left + chartWidth / 2}
          y={height - 5}
          className="fill-muted-foreground text-[10px]"
          textAnchor="middle"
        >
          Dry Bulb Temperature (°C)
        </text>

        {/* Y-axis labels (Humidity Ratio) */}
        {humidityTicks.map(w => (
          <text
            key={`y-label-${w}`}
            x={PADDING.left - 8}
            y={toY(w)}
            className="fill-muted-foreground text-[10px]"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {w}
          </text>
        ))}
        <text
          x={12}
          y={PADDING.top + chartHeight / 2}
          className="fill-muted-foreground text-[10px]"
          textAnchor="middle"
          transform={`rotate(-90, 12, ${PADDING.top + chartHeight / 2})`}
        >
          Humidity (g/kg)
        </text>
      </svg>

      {/* Tooltip overlay */}
      {hoveredPoint && (
        <div
          className="absolute z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            left: tooltipFlipX ? tooltipPosition.x - 195 : tooltipPosition.x + 15,
            top: tooltipFlipY ? tooltipPosition.y + 10 : tooltipPosition.y - 10,
          }}
        >
          <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
            {/* Header with state name and color */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: hoveredPoint.color }}
              >
                {hoveredPoint.index}
              </div>
              <span className="font-medium text-sm text-foreground">
                {hoveredPoint.label}
              </span>
            </div>
            
            {/* Properties table */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dry Bulb:</span>
                <span className="font-medium text-foreground">{hoveredPoint.tempC.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relative Humidity:</span>
                <span className="font-medium text-foreground">{hoveredPoint.rh.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Humidity Ratio:</span>
                <span className="font-medium text-foreground">{hoveredPoint.humidityRatio.toFixed(2)} g/kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wet Bulb:</span>
                <span className="font-medium text-foreground">{hoveredPoint.wetBulb.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dew Point:</span>
                <span className="font-medium text-foreground">{hoveredPoint.dewPoint.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Enthalpy:</span>
                <span className="font-medium text-foreground">{hoveredPoint.enthalpy.toFixed(1)} kJ/kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {showLabels && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center px-2">
          {statePoints.map((point, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: point.color }}
              >
                {point.index}
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
