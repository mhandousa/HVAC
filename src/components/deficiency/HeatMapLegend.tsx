import { cn } from '@/lib/utils';

export function HeatMapLegend() {
  const levels = [
    { label: 'Low', className: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200' },
    { label: 'Medium', className: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300' },
    { label: 'High', className: 'bg-orange-200 dark:bg-orange-900/50 border-orange-400' },
    { label: 'Critical', className: 'bg-red-200 dark:bg-red-900/60 border-red-400' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      <span className="font-medium">Intensity:</span>
      {levels.map((level) => (
        <div key={level.label} className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-4 h-4 rounded border',
              level.className
            )}
          />
          <span>{level.label}</span>
        </div>
      ))}
      <span className="mx-2 text-border">|</span>
      <span className="text-xs">
        Score = Critical×3 + Major×2 + Minor×1
      </span>
    </div>
  );
}
