import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: string
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variant || 'bg-zinc-800 text-zinc-300 border-zinc-700',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
