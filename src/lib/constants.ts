export const BUILDING_TYPES = [
  'Office',
  'Retail',
  'Residential',
  'Healthcare',
  'Education',
  'Industrial',
  'Hospitality',
  'Mixed Use',
] as const

export const PROJECT_STATUSES = [
  'active',
  'completed',
  'on_hold',
  'archived',
] as const

export const EQUIPMENT_CATEGORIES = [
  'Chiller',
  'AHU',
  'FCU',
  'VRF',
  'Split Unit',
  'Package Unit',
  'Heat Pump',
  'Boiler',
  'Cooling Tower',
  'Pump',
] as const

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  completed: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  on_hold: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  archived: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}
