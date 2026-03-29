import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, Layers, MapPin, Box, List } from 'lucide-react';

export type GroupingMode = 'by_zone' | 'by_building' | 'by_floor' | 'by_type' | 'none';

interface TerminalUnitGroupingSelectorProps {
  value: GroupingMode;
  onChange: (value: GroupingMode) => void;
}

const GROUPING_OPTIONS: { value: GroupingMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'by_zone',
    label: 'By Zone',
    description: 'Group units by their assigned zone',
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    value: 'by_building',
    label: 'By Building',
    description: 'Group units by building',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    value: 'by_floor',
    label: 'By Floor',
    description: 'Group by building and floor',
    icon: <Layers className="h-4 w-4" />,
  },
  {
    value: 'by_type',
    label: 'By Type',
    description: 'Group by unit type (VAV, FCU, etc.)',
    icon: <Box className="h-4 w-4" />,
  },
  {
    value: 'none',
    label: 'No Grouping',
    description: 'Flat list sorted by tag',
    icon: <List className="h-4 w-4" />,
  },
];

export function TerminalUnitGroupingSelector({
  value,
  onChange,
}: TerminalUnitGroupingSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Grouping Mode</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <RadioGroup value={value} onValueChange={(v) => onChange(v as GroupingMode)}>
          <div className="space-y-2">
            {GROUPING_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-start gap-3 p-2 rounded-md border cursor-pointer transition-colors ${
                  value === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => onChange(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                <div className="flex-1">
                  <Label 
                    htmlFor={option.value} 
                    className="flex items-center gap-2 cursor-pointer font-medium text-sm"
                  >
                    {option.icon}
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
