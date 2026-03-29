import React from 'react';

interface LegendItem {
  category: string;
  label: string;
  color: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { category: 'isolator', label: 'Vibration Isolators', color: 'bg-purple-500' },
  { category: 'silencer', label: 'Silencers', color: 'bg-blue-500' },
  { category: 'boot', label: 'Plenum Boots', color: 'bg-cyan-500' },
  { category: 'lining', label: 'Duct Lining', color: 'bg-amber-500' },
  { category: 'wrap', label: 'Acoustic Wrap', color: 'bg-orange-500' },
  { category: 'panel', label: 'Acoustic Panels', color: 'bg-emerald-500' },
];

interface TimelineLegendProps {
  visibleCategories?: string[];
}

export function TimelineLegend({ visibleCategories }: TimelineLegendProps) {
  const items = visibleCategories 
    ? LEGEND_ITEMS.filter(item => visibleCategories.includes(item.category))
    : LEGEND_ITEMS;

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 px-4 py-2 bg-muted/30 rounded-lg">
      <span className="text-xs font-medium text-muted-foreground">Treatment Types:</span>
      {items.map(item => (
        <div key={item.category} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-sm ${item.color}`} />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    isolator: 'bg-purple-500',
    silencer: 'bg-blue-500',
    boot: 'bg-cyan-500',
    lining: 'bg-amber-500',
    wrap: 'bg-orange-500',
    panel: 'bg-emerald-500',
    other: 'bg-gray-500',
  };
  return colorMap[category] || colorMap.other;
}

export function getCategoryBorderColor(category: string): string {
  const colorMap: Record<string, string> = {
    isolator: 'border-purple-600',
    silencer: 'border-blue-600',
    boot: 'border-cyan-600',
    lining: 'border-amber-600',
    wrap: 'border-orange-600',
    panel: 'border-emerald-600',
    other: 'border-gray-600',
  };
  return colorMap[category] || colorMap.other;
}
