import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  icon: LucideIcon
  accent?: string
}

export function StatsCard({ title, value, change, icon: Icon, accent = 'text-sky-400' }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
          {change && (
            <p className="mt-1 text-xs text-emerald-400">{change}</p>
          )}
        </div>
        <div className={cn('rounded-lg bg-zinc-800/80 p-2.5', accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
