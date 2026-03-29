import React from 'react';

export type DuctNodeType = 
  | 'duct'
  | 'ahu'
  | 'vav'
  | 'diffuser_supply'
  | 'diffuser_return'
  | 'grille'
  | 'damper_volume'
  | 'damper_fire'
  | 'damper_smoke'
  | 'fan'
  | 'filter'
  | 'coil'
  | 'silencer'
  | 'terminal_unit'
  | 'plenum';

export const DUCT_NODE_TYPE_LABELS: Record<DuctNodeType, string> = {
  duct: 'Duct Segment',
  ahu: 'Air Handling Unit',
  vav: 'VAV Box',
  diffuser_supply: 'Supply Diffuser',
  diffuser_return: 'Return Grille',
  grille: 'Transfer Grille',
  damper_volume: 'Volume Damper',
  damper_fire: 'Fire Damper',
  damper_smoke: 'Smoke Damper',
  fan: 'Fan',
  filter: 'Filter Box',
  coil: 'Coil',
  silencer: 'Silencer',
  terminal_unit: 'Terminal Unit',
  plenum: 'Plenum',
};

export const DUCT_NODE_CATEGORIES: Record<string, DuctNodeType[]> = {
  equipment: ['ahu', 'vav', 'fan', 'filter', 'coil', 'silencer', 'terminal_unit'],
  terminals: ['diffuser_supply', 'diffuser_return', 'grille', 'plenum'],
  dampers: ['damper_volume', 'damper_fire', 'damper_smoke'],
  basic: ['duct'],
};

interface IconProps {
  className?: string;
  size?: number;
}

export function DuctIcon({ className, size = 24 }: IconProps) {
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
      <rect x="2" y="8" width="20" height="8" rx="1" />
      <path d="M6 8 L6 16" />
      <path d="M18 8 L18 16" />
    </svg>
  );
}

export function AHUIcon({ className, size = 24 }: IconProps) {
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
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="12" r="3" />
      <path d="M8 9 L8 15" />
      <path d="M5 12 L11 12" />
      <path d="M14 8 L20 8" />
      <path d="M14 12 L20 12" />
      <path d="M14 16 L20 16" />
    </svg>
  );
}

export function VAVIcon({ className, size = 24 }: IconProps) {
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
      <path d="M12 2 L12 6" />
      <path d="M8 10 L16 10" />
      <path d="M12 6 L12 14" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}

export function DiffuserSupplyIcon({ className, size = 24 }: IconProps) {
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
      <rect x="4" y="10" width="16" height="4" rx="1" />
      <path d="M6 14 L6 20" />
      <path d="M10 14 L10 18" />
      <path d="M14 14 L14 18" />
      <path d="M18 14 L18 20" />
      <path d="M12 6 L12 10" />
    </svg>
  );
}

export function DiffuserReturnIcon({ className, size = 24 }: IconProps) {
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
      <rect x="4" y="10" width="16" height="4" rx="1" />
      <path d="M6 4 L6 10" />
      <path d="M10 6 L10 10" />
      <path d="M14 6 L14 10" />
      <path d="M18 4 L18 10" />
      <path d="M12 14 L12 18" />
    </svg>
  );
}

export function GrilleIcon({ className, size = 24 }: IconProps) {
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
      <path d="M4 10 L20 10" />
      <path d="M4 14 L20 14" />
    </svg>
  );
}

export function VolumeDamperIcon({ className, size = 24 }: IconProps) {
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
      <rect x="4" y="8" width="16" height="8" rx="1" />
      <path d="M8 8 L16 16" />
      <path d="M12 4 L12 8" />
      <circle cx="12" cy="3" r="1" fill="currentColor" />
    </svg>
  );
}

export function FireDamperIcon({ className, size = 24 }: IconProps) {
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
      <rect x="4" y="8" width="16" height="8" rx="1" />
      <path d="M8 8 L16 16" />
      <path d="M12 3 C10 5 10 7 12 8 C14 7 14 5 12 3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SmokeDamperIcon({ className, size = 24 }: IconProps) {
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
      <rect x="4" y="8" width="16" height="8" rx="1" />
      <path d="M8 8 L16 16" />
      <path d="M9 3 Q12 4 10 6" />
      <path d="M12 2 Q15 3 13 5" />
      <path d="M15 3 Q18 4 16 6" />
    </svg>
  );
}

export function FanIcon({ className, size = 24 }: IconProps) {
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
      <path d="M4 12 L8 12" />
      <path d="M16 12 L20 12" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10 L14 8" />
      <path d="M14 12 L16 14" />
      <path d="M12 14 L10 16" />
      <path d="M10 12 L8 10" />
    </svg>
  );
}

export function FilterIcon({ className, size = 24 }: IconProps) {
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
      <path d="M12 4 L12 20" />
      <path d="M16 4 L16 20" />
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
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <path d="M6 8 L18 8" />
      <path d="M6 12 L18 12" />
      <path d="M6 16 L18 16" />
      <path d="M9 4 L9 20" />
      <path d="M15 4 L15 20" />
      <circle cx="4" cy="8" r="1" fill="currentColor" />
      <circle cx="4" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

export function SilencerIcon({ className, size = 24 }: IconProps) {
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
      <rect x="2" y="6" width="20" height="12" rx="1" />
      <path d="M6 6 L6 18" />
      <path d="M10 6 L10 18" />
      <path d="M14 6 L14 18" />
      <path d="M18 6 L18 18" />
      <path d="M4 9 L6 9" />
      <path d="M4 12 L6 12" />
      <path d="M4 15 L6 15" />
    </svg>
  );
}

export function TerminalUnitIcon({ className, size = 24 }: IconProps) {
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
      <rect x="4" y="8" width="16" height="8" rx="1" />
      <path d="M2 12 L4 12" />
      <path d="M20 10 L22 10" />
      <path d="M20 14 L22 14" />
      <circle cx="8" cy="12" r="2" />
      <path d="M12 8 L12 16" />
    </svg>
  );
}

export function PlenumIcon({ className, size = 24 }: IconProps) {
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
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M8 2 L8 6" />
      <path d="M16 2 L16 6" />
      <path d="M8 18 L8 22" />
      <path d="M16 18 L16 22" />
    </svg>
  );
}

// Icon mapping
export const DUCT_NODE_ICONS: Record<DuctNodeType, React.FC<IconProps>> = {
  duct: DuctIcon,
  ahu: AHUIcon,
  vav: VAVIcon,
  diffuser_supply: DiffuserSupplyIcon,
  diffuser_return: DiffuserReturnIcon,
  grille: GrilleIcon,
  damper_volume: VolumeDamperIcon,
  damper_fire: FireDamperIcon,
  damper_smoke: SmokeDamperIcon,
  fan: FanIcon,
  filter: FilterIcon,
  coil: CoilIcon,
  silencer: SilencerIcon,
  terminal_unit: TerminalUnitIcon,
  plenum: PlenumIcon,
};

export function getDuctNodeIcon(nodeType: DuctNodeType): React.FC<IconProps> {
  return DUCT_NODE_ICONS[nodeType] || DuctIcon;
}

// Color mapping for canvas visualization
export const DUCT_NODE_COLORS: Record<DuctNodeType, string> = {
  duct: 'hsl(215 15% 50%)',
  ahu: 'hsl(199 89% 48%)',
  vav: 'hsl(262 83% 58%)',
  diffuser_supply: 'hsl(152 76% 40%)',
  diffuser_return: 'hsl(38 92% 50%)',
  grille: 'hsl(45 93% 47%)',
  damper_volume: 'hsl(215 25% 60%)',
  damper_fire: 'hsl(0 72% 51%)',
  damper_smoke: 'hsl(215 15% 40%)',
  fan: 'hsl(199 89% 48%)',
  filter: 'hsl(142 71% 45%)',
  coil: 'hsl(199 89% 60%)',
  silencer: 'hsl(280 60% 50%)',
  terminal_unit: 'hsl(262 83% 58%)',
  plenum: 'hsl(215 25% 70%)',
};
