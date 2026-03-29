import React from 'react';

export type PipeNodeType = 
  | 'pipe'
  | 'pump'
  | 'coil'
  | 'chiller'
  | 'boiler'
  | 'valve_gate'
  | 'valve_globe'
  | 'valve_ball'
  | 'valve_butterfly'
  | 'valve_check'
  | 'strainer'
  | 'tank'
  | 'air_separator'
  | 'heat_exchanger';

export const PIPE_NODE_TYPE_LABELS: Record<PipeNodeType, string> = {
  pipe: 'Pipe Segment',
  pump: 'Pump',
  coil: 'Coil / AHU',
  chiller: 'Chiller',
  boiler: 'Boiler',
  valve_gate: 'Gate Valve',
  valve_globe: 'Globe Valve',
  valve_ball: 'Ball Valve',
  valve_butterfly: 'Butterfly Valve',
  valve_check: 'Check Valve',
  strainer: 'Strainer',
  tank: 'Expansion Tank',
  air_separator: 'Air Separator',
  heat_exchanger: 'Heat Exchanger',
};

export const PIPE_NODE_CATEGORIES: Record<string, PipeNodeType[]> = {
  'Equipment': ['pump', 'coil', 'chiller', 'boiler', 'heat_exchanger'],
  'Valves': ['valve_gate', 'valve_globe', 'valve_ball', 'valve_butterfly', 'valve_check'],
  'Accessories': ['strainer', 'tank', 'air_separator'],
  'Basic': ['pipe'],
};

interface IconProps {
  className?: string;
  size?: number;
}

export function PumpIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4 L12 8" />
      <path d="M12 16 L12 20" />
      <path d="M8 12 L4 12" />
      <path d="M20 12 L16 12" />
      <path d="M12 12 L15 9" />
    </svg>
  );
}

export function CoilIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M8 6 L8 18" />
      <path d="M12 6 L12 18" />
      <path d="M16 6 L16 18" />
      <path d="M4 10 L20 10" />
      <path d="M4 14 L20 14" />
    </svg>
  );
}

export function ChillerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="8" width="18" height="10" rx="1" />
      <path d="M7 8 L7 4" />
      <path d="M17 8 L17 4" />
      <path d="M7 18 L7 22" />
      <path d="M17 18 L17 22" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function BoilerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 6 L8 2" />
      <path d="M16 6 L16 2" />
      <path d="M8 20 L8 22" />
      <path d="M16 20 L16 22" />
      <path d="M8 13 L10 11 L14 15 L16 13" />
    </svg>
  );
}

export function GateValveIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12 L8 8 L8 16 L4 12" />
      <path d="M20 12 L16 8 L16 16 L20 12" />
      <path d="M12 8 L12 4" />
      <rect x="10" y="2" width="4" height="3" rx="0.5" />
    </svg>
  );
}

export function GlobeValveIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="6" />
      <path d="M6 12 L2 12" />
      <path d="M18 12 L22 12" />
      <path d="M12 6 L12 2" />
      <rect x="10" y="0" width="4" height="3" rx="0.5" />
    </svg>
  );
}

export function BallValveIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12 L8 8 L8 16 L4 12" />
      <path d="M20 12 L16 8 L16 16 L20 12" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8 L12 4" />
    </svg>
  );
}

export function ButterflyValveIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12 L20 12" />
      <path d="M12 4 L12 20" />
      <path d="M12 4 L12 2" />
    </svg>
  );
}

export function CheckValveIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12 L8 8 L8 16 L4 12" />
      <path d="M20 12 L16 8 L16 16 L20 12" />
      <path d="M10 14 L14 10" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function StrainerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12 L20 12" />
      <path d="M12 12 L12 20" />
      <circle cx="12" cy="12" r="4" />
      <path d="M9 9 L15 15" />
      <path d="M9 15 L15 9" />
    </svg>
  );
}

export function TankIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6 L4 18 C4 19.7 7.6 21 12 21 C16.4 21 20 19.7 20 18 L20 6" />
      <path d="M4 12 C4 13.7 7.6 15 12 15 C16.4 15 20 13.7 20 12" />
    </svg>
  );
}

export function AirSeparatorIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M6 12 L2 12" />
      <path d="M22 12 L18 12" />
      <path d="M12 4 L12 0" />
      <circle cx="12" cy="10" r="2" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  );
}

export function HeatExchangerIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M4 8 L20 8" />
      <path d="M4 12 L20 12" />
      <path d="M4 16 L20 16" />
      <path d="M8 4 L8 20" />
      <path d="M16 4 L16 20" />
    </svg>
  );
}

export function PipeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12 L20 12" />
      <path d="M4 8 L4 16" />
      <path d="M20 8 L20 16" />
    </svg>
  );
}

// Icon mapping
export const PIPE_NODE_ICONS: Record<PipeNodeType, React.FC<IconProps>> = {
  pipe: PipeIcon,
  pump: PumpIcon,
  coil: CoilIcon,
  chiller: ChillerIcon,
  boiler: BoilerIcon,
  valve_gate: GateValveIcon,
  valve_globe: GlobeValveIcon,
  valve_ball: BallValveIcon,
  valve_butterfly: ButterflyValveIcon,
  valve_check: CheckValveIcon,
  strainer: StrainerIcon,
  tank: TankIcon,
  air_separator: AirSeparatorIcon,
  heat_exchanger: HeatExchangerIcon,
};

export function getPipeNodeIcon(nodeType: PipeNodeType): React.FC<IconProps> {
  return PIPE_NODE_ICONS[nodeType] || PipeIcon;
}
