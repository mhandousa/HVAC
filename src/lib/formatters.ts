export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '--'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatBTU(value: number | null | undefined): string {
  if (value == null) return '--'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k BTU/h`
  return `${value.toFixed(0)} BTU/h`
}

export function formatTons(value: number | null | undefined): string {
  if (value == null) return '--'
  return `${value.toFixed(1)} tons`
}

export function formatCFM(value: number | null | undefined): string {
  if (value == null) return '--'
  return `${formatNumber(Math.round(value))} CFM`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatArea(value: number | null | undefined): string {
  if (value == null) return '--'
  return `${formatNumber(value)} sq ft`
}
