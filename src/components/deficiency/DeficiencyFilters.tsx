import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeficiencyFilters as Filters } from '@/hooks/useDeficiencyDashboard';
import { DEFICIENCY_CATEGORIES, DeficiencySeverity } from '@/lib/deficiency-types';
import { X } from 'lucide-react';

interface DeficiencyFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  projects: { id: string; name: string }[];
}

export function DeficiencyFilters({ filters, onFiltersChange, projects }: DeficiencyFiltersProps) {
  const hasActiveFilters =
    filters.projectId ||
    filters.severities.length > 0 ||
    filters.categories.length > 0 ||
    filters.status !== 'all' ||
    filters.dateRange !== '30days' ||
    filters.equipmentType;

  const clearFilters = () => {
    onFiltersChange({
      severities: [],
      categories: [],
      status: 'all',
      dateRange: '30days',
      equipmentType: undefined,
    });
  };

  const equipmentTypes = [
    { id: 'erv', label: 'ERV' },
    { id: 'ahu', label: 'AHU' },
    { id: 'fcu', label: 'FCU' },
    { id: 'vav', label: 'VAV' },
    { id: 'chiller', label: 'Chiller' },
    { id: 'cooling_tower', label: 'Cooling Tower' },
    { id: 'pump', label: 'Pump' },
    { id: 'vrf', label: 'VRF' },
    { id: 'boiler', label: 'Boiler' },
    { id: 'fan', label: 'Fan' },
    { id: 'split', label: 'Split Unit' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
      {/* Project Filter */}
      <Select
        value={filters.projectId || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, projectId: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="All Projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Equipment Type Filter */}
      <Select
        value={filters.equipmentType || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, equipmentType: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[150px] bg-background">
          <SelectValue placeholder="All Equipment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Equipment</SelectItem>
          {equipmentTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Severity Filter */}
      <Select
        value={filters.severities.length === 1 ? filters.severities[0] : 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            severities: value === 'all' ? [] : [value as DeficiencySeverity],
          })
        }
      >
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="All Severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="major">Major</SelectItem>
          <SelectItem value="minor">Minor</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select
        value={filters.categories.length === 1 ? filters.categories[0] : 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            categories: value === 'all' ? [] : [value],
          })
        }
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {DEFICIENCY_CATEGORIES.map((category) => (
            <SelectItem key={category.id} value={category.label}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value: 'all' | 'open' | 'resolved') =>
          onFiltersChange({ ...filters, status: value })
        }
      >
        <SelectTrigger className="w-[130px] bg-background">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range Filter */}
      <Select
        value={filters.dateRange}
        onValueChange={(value: 'all' | '7days' | '30days' | '90days') =>
          onFiltersChange({ ...filters, dateRange: value })
        }
      >
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">Last 7 Days</SelectItem>
          <SelectItem value="30days">Last 30 Days</SelectItem>
          <SelectItem value="90days">Last 90 Days</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
