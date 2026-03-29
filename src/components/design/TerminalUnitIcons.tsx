import { cn } from '@/lib/utils';

interface TerminalUnitIconProps {
  type: string;
  size?: number;
  className?: string;
}

const UNIT_COLORS: Record<string, string> = {
  vav_cooling: 'hsl(210, 80%, 60%)',
  vav_reheat: 'hsl(25, 90%, 55%)',
  fcu_2pipe: 'hsl(190, 70%, 50%)',
  fcu_4pipe: 'hsl(270, 60%, 60%)',
  fcu_electric: 'hsl(45, 90%, 50%)',
};

export function TerminalUnitIcon({ type, size = 12, className }: TerminalUnitIconProps) {
  const color = UNIT_COLORS[type] || 'hsl(0, 0%, 60%)';
  const isVAV = type.startsWith('vav');
  const isReheat = type === 'vav_reheat';
  const is4Pipe = type === 'fcu_4pipe';
  const isElectric = type === 'fcu_electric';

  if (isVAV) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 16 16" 
        className={cn('flex-shrink-0', className)}
      >
        {/* VAV Box body */}
        <rect 
          x="2" y="4" 
          width="12" height="8" 
          rx="1" 
          fill={color} 
          stroke="white" 
          strokeWidth="0.5"
        />
        {/* Airflow arrow */}
        <path 
          d="M4 8 L8 8 M6 6 L8 8 L6 10" 
          stroke="white" 
          strokeWidth="1.5" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Reheat indicator */}
        {isReheat && (
          <g>
            <circle cx="12" cy="8" r="2" fill="hsl(0, 80%, 55%)" />
            <path d="M11 7 L12 9 L13 7" stroke="white" strokeWidth="0.8" fill="none" />
          </g>
        )}
      </svg>
    );
  }

  // FCU icon
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      className={cn('flex-shrink-0', className)}
    >
      {/* FCU body */}
      <rect 
        x="2" y="3" 
        width="12" height="10" 
        rx="2" 
        fill={color} 
        stroke="white" 
        strokeWidth="0.5"
      />
      {/* Fan symbol */}
      <circle cx="6" cy="8" r="2.5" fill="white" opacity="0.9" />
      <path 
        d="M6 5.5 C7 6 7.5 7 6 8 C4.5 7 5 6 6 5.5 M6 10.5 C5 10 4.5 9 6 8 C7.5 9 7 10 6 10.5 M8.5 8 C8 7 7 6.5 6 8 C7 9.5 8 9 8.5 8 M3.5 8 C4 9 5 9.5 6 8 C5 6.5 4 7 3.5 8" 
        fill={color} 
        opacity="0.8"
      />
      {/* Coil indicators */}
      {is4Pipe ? (
        <g>
          <rect x="10" y="5" width="2" height="2.5" rx="0.5" fill="hsl(210, 80%, 60%)" stroke="white" strokeWidth="0.3" />
          <rect x="10" y="8.5" width="2" height="2.5" rx="0.5" fill="hsl(0, 70%, 55%)" stroke="white" strokeWidth="0.3" />
        </g>
      ) : isElectric ? (
        <g>
          <rect x="10" y="5" width="2" height="2.5" rx="0.5" fill="hsl(210, 80%, 60%)" stroke="white" strokeWidth="0.3" />
          <path d="M10.5 9.5 L11.5 9 L10.8 10.5 L11.8 10" stroke="hsl(45, 100%, 50%)" strokeWidth="0.8" fill="none" />
        </g>
      ) : (
        <rect x="10" y="6" width="2" height="4" rx="0.5" fill="hsl(210, 80%, 60%)" stroke="white" strokeWidth="0.3" />
      )}
    </svg>
  );
}

interface TerminalUnitBadgeProps {
  types: string[];
  quantity: number;
  maxIcons?: number;
}

export function TerminalUnitBadge({ types, quantity, maxIcons = 2 }: TerminalUnitBadgeProps) {
  const uniqueTypes = [...new Set(types)].slice(0, maxIcons);
  
  return (
    <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-sm px-1 py-0.5 rounded">
      {uniqueTypes.map((type, idx) => (
        <TerminalUnitIcon key={`${type}-${idx}`} type={type} size={10} />
      ))}
      <span className="text-[9px] font-medium text-foreground ml-0.5">
        ×{quantity}
      </span>
    </div>
  );
}

export function getTerminalUnitLabel(type: string): string {
  const labels: Record<string, string> = {
    vav_cooling: 'VAV Cooling',
    vav_reheat: 'VAV Reheat',
    fcu_2pipe: 'FCU 2-Pipe',
    fcu_4pipe: 'FCU 4-Pipe',
    fcu_electric: 'FCU Electric',
  };
  return labels[type] || type.replace('_', ' ').toUpperCase();
}
