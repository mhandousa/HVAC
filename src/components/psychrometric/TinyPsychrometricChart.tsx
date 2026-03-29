import React, { useMemo } from 'react';

interface PresetAirState {
  name: string;
  tempC: number;
  rh: number;
  color?: string;
  humidityType?: 'relative' | 'wetBulb' | 'dewPoint';
}

interface TinyPsychrometricChartProps {
  airStates: PresetAirState[];
  altitudeFt?: number;
  width?: number;
  height?: number;
  showProcessLines?: boolean;
  className?: string;
}

// Atmospheric pressure at altitude (simplified)
const getAtmosphericPressure = (altitudeFt: number): number => {
  const altitudeM = altitudeFt * 0.3048;
  return 101325 * Math.pow((1 - 0.0000225577 * altitudeM), 5.2559);
};

// Saturation pressure (Pa) from temperature (°C)
const calcPws = (tempC: number): number => {
  const T = tempC + 273.15;
  const C1 = -5674.5359;
  const C2 = 6.3925247;
  const C3 = -0.009677843;
  const C4 = 0.00000062215701;
  const C5 = 2.0747825e-9;
  const C6 = -9.484024e-13;
  const C7 = 4.1635019;
  
  if (tempC < 0) {
    return Math.exp(C1/T + C2 + C3*T + C4*T*T + C5*T*T*T + C6*T*T*T*T + C7*Math.log(T));
  } else {
    const C8 = -5800.2206;
    const C9 = 1.3914993;
    const C10 = -0.048640239;
    const C11 = 0.000041764768;
    const C12 = -0.000000014452093;
    const C13 = 6.5459673;
    return Math.exp(C8/T + C9 + C10*T + C11*T*T + C12*T*T*T + C13*Math.log(T));
  }
};

// Humidity ratio from RH and temperature
const calcHumidityRatio = (tempC: number, rh: number, patm: number): number => {
  const pws = calcPws(tempC);
  const pw = (rh / 100) * pws;
  return 0.621945 * pw / (patm - pw);
};

// State point colors
const STATE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const TinyPsychrometricChart: React.FC<TinyPsychrometricChartProps> = React.memo(({
  airStates,
  altitudeFt = 0,
  width = 80,
  height = 50,
  showProcessLines = true,
  className = '',
}) => {
  const patm = useMemo(() => getAtmosphericPressure(altitudeFt), [altitudeFt]);

  // Chart bounds - simplified range
  const tempMin = 0;
  const tempMax = 55;
  const wMax = 0.030;

  // Convert to chart coordinates
  const toX = (tempC: number): number => {
    return ((tempC - tempMin) / (tempMax - tempMin)) * width;
  };

  const toY = (w: number): number => {
    return height - (w / wMax) * height;
  };

  // Calculate saturation curve points (simplified - fewer points)
  const saturationCurve = useMemo(() => {
    const points: string[] = [];
    for (let t = tempMin; t <= tempMax; t += 5) {
      const w = calcHumidityRatio(t, 100, patm);
      if (w <= wMax) {
        points.push(`${toX(t)},${toY(w)}`);
      }
    }
    return `M${points.join(' L')}`;
  }, [patm, width, height]);

  // Single RH reference line at 50%
  const rhLine50 = useMemo(() => {
    const points: string[] = [];
    for (let t = tempMin; t <= tempMax; t += 10) {
      const w = calcHumidityRatio(t, 50, patm);
      if (w <= wMax && w >= 0) {
        points.push(`${toX(t)},${toY(w)}`);
      }
    }
    return points.length >= 2 ? `M${points.join(' L')}` : '';
  }, [patm, width, height]);

  // Calculate state points
  const statePoints = useMemo(() => {
    return airStates.map((state, index) => {
      const w = calcHumidityRatio(state.tempC, state.rh, patm);
      return {
        x: toX(state.tempC),
        y: toY(w),
        color: state.color || STATE_COLORS[index % STATE_COLORS.length],
        w,
      };
    });
  }, [airStates, patm, width, height]);

  // Process lines between consecutive states
  const processLines = useMemo(() => {
    if (!showProcessLines || statePoints.length < 2) return [];
    
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < statePoints.length - 1; i++) {
      lines.push({
        x1: statePoints[i].x,
        y1: statePoints[i].y,
        x2: statePoints[i + 1].x,
        y2: statePoints[i + 1].y,
      });
    }
    return lines;
  }, [statePoints, showProcessLines]);

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        {/* Background */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="hsl(var(--muted) / 0.3)"
          rx="2"
        />

        {/* 50% RH reference line */}
        {rhLine50 && (
          <path
            d={rhLine50}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.3)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        )}

        {/* Saturation curve (100% RH) */}
        <path
          d={saturationCurve}
          fill="none"
          stroke="hsl(var(--primary) / 0.6)"
          strokeWidth="1"
        />

        {/* Process lines */}
        {processLines.map((line, i) => (
          <line
            key={`process-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="hsl(var(--muted-foreground) / 0.5)"
            strokeWidth="0.75"
          />
        ))}

        {/* State points */}
        {statePoints.map((point, i) => (
          <circle
            key={`state-${i}`}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={point.color}
            stroke="hsl(var(--background))"
            strokeWidth="0.5"
          />
        ))}
      </svg>
    </div>
  );
});

TinyPsychrometricChart.displayName = 'TinyPsychrometricChart';

export { TinyPsychrometricChart };
export type { TinyPsychrometricChartProps };
