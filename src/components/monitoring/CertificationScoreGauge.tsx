import React from 'react';
import { useTranslation } from 'react-i18next';

interface CertificationScoreGaugeProps {
  achieved: number;
  target: number;
  total: number;
  currentLevel: string;
  targetLevel: string;
}

export function CertificationScoreGauge({
  achieved,
  target,
  total,
  currentLevel,
  targetLevel,
}: CertificationScoreGaugeProps) {
  const { t } = useTranslation();
  
  const percentage = total > 0 ? (achieved / total) * 100 : 0;
  const targetPercentage = total > 0 ? (target / total) * 100 : 0;
  
  // Calculate the arc path
  const radius = 60;
  const strokeWidth = 12;
  const cx = 70;
  const cy = 70;
  const startAngle = -180;
  const endAngle = 0;
  
  const polarToCartesian = (angle: number) => {
    const angleRad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  };
  
  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };
  
  const achievedAngle = startAngle + (percentage / 100) * (endAngle - startAngle);
  const targetAngle = startAngle + (targetPercentage / 100) * (endAngle - startAngle);
  
  const getLevelColor = (level: string) => {
    if (level.includes('Platinum')) return 'hsl(var(--muted-foreground))';
    if (level.includes('Gold')) return 'hsl(45 93% 47%)';
    if (level.includes('Silver')) return 'hsl(var(--muted-foreground))';
    if (level.includes('Bronze')) return 'hsl(25 95% 53%)';
    return 'hsl(var(--primary))';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="85" viewBox="0 0 140 85">
        {/* Background arc */}
        <path
          d={createArc(startAngle, endAngle)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Target marker */}
        {target > 0 && (
          <circle
            cx={polarToCartesian(targetAngle).x}
            cy={polarToCartesian(targetAngle).y}
            r={4}
            fill="hsl(var(--muted-foreground))"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        )}
        
        {/* Achieved arc */}
        {achieved > 0 && (
          <path
            d={createArc(startAngle, achievedAngle)}
            fill="none"
            stroke={getLevelColor(currentLevel)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        
        {/* Level markers */}
        {[40, 50, 60, 80].map((levelPoints) => {
          const levelPercentage = (levelPoints / total) * 100;
          const angle = startAngle + (levelPercentage / 100) * (endAngle - startAngle);
          const pos = polarToCartesian(angle);
          const innerPos = polarToCartesian(angle);
          return (
            <line
              key={levelPoints}
              x1={pos.x}
              y1={pos.y}
              x2={innerPos.x}
              y2={innerPos.y}
              stroke="hsl(var(--background))"
              strokeWidth={2}
              transform={`rotate(${angle + 90} ${pos.x} ${pos.y})`}
            />
          );
        })}
      </svg>
      
      <div className="text-center -mt-4">
        <div className="text-2xl font-bold">{achieved}</div>
        <div className="text-xs text-muted-foreground">{t('of')} {total} {t('points')}</div>
      </div>
    </div>
  );
}
