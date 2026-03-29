import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, ChevronUp, ChevronDown, Check, X, Database, FileText, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BOILER_CATALOG,
  getBoilerTypeDisplayName,
  getFuelTypeDisplayName,
  getBoilerManufacturers,
  ASHRAE_90_1_BOILER_MINIMUMS,
  calculateAdjustedBoilerEfficiency,
  type BoilerCatalogItem,
  type BoilerType,
  type FuelType,
  type BoilerRequirements,
  type AdjustedBoilerEfficiencyResult,
} from '@/lib/boiler-selection-calculations';
import { useBoilerCatalog, adaptDbToBoiler } from '@/hooks/useBoilerCatalog';

interface BoilerCatalogTableProps {
  requiredCapacityBtuh?: number;
  onSelectBoiler: (boiler: BoilerCatalogItem) => void;
  selectedBoilerId?: string;
  filterType?: BoilerType;
  onFilterTypeChange?: (type: BoilerType | undefined) => void;
  filterFuel?: FuelType;
  onFilterFuelChange?: (fuel: FuelType | undefined) => void;
  requirements?: BoilerRequirements;
}

type SortKey = 'manufacturer' | 'model' | 'capacityBtuh' | 'afue' | 'turndownRatio' | 'listPriceSar';
type SortDir = 'asc' | 'desc';

export function BoilerCatalogTable({
  requiredCapacityBtuh,
  onSelectBoiler,
  selectedBoilerId,
  filterType,
  onFilterTypeChange,
  filterFuel,
  onFilterFuelChange,
  requirements,
}: BoilerCatalogTableProps) {
  const [search, setSearch] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [minAfue, setMinAfue] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('capacityBtuh');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Fetch from database
  const { data: dbBoilers, isLoading } = useBoilerCatalog({
    boilerType: filterType,
    fuelType: filterFuel,
    manufacturer: filterManufacturer !== 'all' ? filterManufacturer : undefined,
    minAfue: minAfue > 0 ? minAfue : undefined,
  });

  const manufacturers = useMemo(() => getBoilerManufacturers(), []);

  // Use database data when available, fallback to static catalog
  const sourceData = useMemo(() => {
    if (dbBoilers && dbBoilers.length > 0) {
      return dbBoilers.map(adaptDbToBoiler);
    }
    return BOILER_CATALOG;
  }, [dbBoilers]);

  const isUsingDatabase = dbBoilers && dbBoilers.length > 0;
  
  // Determine if we should show adjusted AFUE (when temps differ from standard)
  const showAdjustedAfue = useMemo(() => {
    if (!requirements?.hwReturnTempF) return false;
    // Show if return temp differs from typical
    const standardReturn = 160;
    return Math.abs((requirements.hwReturnTempF || standardReturn) - standardReturn) > 5;
  }, [requirements?.hwReturnTempF]);

  // Calculate adjusted efficiency for a boiler
  const getAdjustedAfue = (boiler: BoilerCatalogItem): AdjustedBoilerEfficiencyResult | null => {
    if (!requirements?.hwReturnTempF) return null;
    return calculateAdjustedBoilerEfficiency(
      boiler.afue,
      boiler.boilerType,
      requirements.hwReturnTempF,
      requirements.hwSupplyTempF,
      requirements.combustionAirTempF
    );
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...sourceData];

    // Filter by type (only for static data, DB already filtered)
    if (!isUsingDatabase && filterType) {
      result = result.filter(b => b.boilerType === filterType);
    }

    // Filter by fuel type (only for static data, DB already filtered)
    if (!isUsingDatabase && filterFuel) {
      result = result.filter(b => b.fuelType === filterFuel);
    }

    // Filter by manufacturer (only for static data, DB already filtered)
    if (!isUsingDatabase && filterManufacturer && filterManufacturer !== 'all') {
      result = result.filter(b => b.manufacturer === filterManufacturer);
    }

    // Filter by search (always apply locally for text matching)
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        b =>
          b.manufacturer.toLowerCase().includes(lower) ||
          b.model.toLowerCase().includes(lower)
      );
    }

    // Filter by min AFUE (only for static data, DB already filtered)
    if (!isUsingDatabase && minAfue > 0) {
      result = result.filter(b => b.afue >= minAfue);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [sourceData, isUsingDatabase, filterType, filterFuel, filterManufacturer, search, minAfue, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  const getCapacityMatch = (capacity: number): 'undersized' | 'optimal' | 'oversized' | 'none' => {
    if (!requiredCapacityBtuh) return 'none';
    const ratio = capacity / requiredCapacityBtuh;
    if (ratio < 0.95) return 'undersized';
    if (ratio >= 0.95 && ratio <= 1.25) return 'optimal';
    return 'oversized';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search manufacturer, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select
          value={filterType || 'all'}
          onValueChange={(v) => onFilterTypeChange?.(v === 'all' ? undefined : v as BoilerType)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="condensing-gas">Condensing Gas</SelectItem>
            <SelectItem value="non-condensing-gas">Non-Condensing Gas</SelectItem>
            <SelectItem value="oil-fired">Oil-Fired</SelectItem>
            <SelectItem value="electric">Electric</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterFuel || 'all'}
          onValueChange={(v) => onFilterFuelChange?.(v === 'all' ? undefined : v as FuelType)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuels</SelectItem>
            <SelectItem value="natural-gas">Natural Gas</SelectItem>
            <SelectItem value="propane">Propane</SelectItem>
            <SelectItem value="fuel-oil">Fuel Oil</SelectItem>
            <SelectItem value="electric">Electric</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={filterManufacturer}
          onValueChange={setFilterManufacturer}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {manufacturers.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2 min-w-[160px]">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Min AFUE:</span>
          <Slider
            value={[minAfue]}
            onValueChange={([v]) => setMinAfue(v)}
            min={0}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8">{minAfue}%</span>
        </div>
      </div>
      
      {/* Results count and data source */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Badge variant="outline" className="text-xs gap-1">
              {isUsingDatabase ? (
                <>
                  <Database className="h-3 w-3" />
                  Database ({dbBoilers?.length})
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3" />
                  Static Catalog
                </>
              )}
            </Badge>
          )}
          <span>{filteredAndSorted.length} boilers found</span>
        </div>
        {requiredCapacityBtuh && (
          <span>Required: {(requiredCapacityBtuh / 1000).toFixed(0)} MBH</span>
        )}
      </div>
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('manufacturer')}
              >
                <div className="flex items-center">
                  Manufacturer <SortIcon column="manufacturer" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('model')}
              >
                <div className="flex items-center">
                  Model <SortIcon column="model" />
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Fuel</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('capacityBtuh')}
              >
                <div className="flex items-center justify-end">
                  Capacity <SortIcon column="capacityBtuh" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('afue')}
              >
                <div className="flex items-center justify-end">
                  AFUE <SortIcon column="afue" />
                </div>
              </TableHead>
              {showAdjustedAfue && (
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-end gap-1 cursor-help">
                        Adj. AFUE
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p className="text-xs">
                        Temperature-corrected AFUE per AHRI 1500. 
                        Badge shows % vs ASHRAE 90.1-2019 baseline.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              )}
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('turndownRatio')}
              >
                <div className="flex items-center justify-end">
                  Turndown <SortIcon column="turndownRatio" />
                </div>
              </TableHead>
              <TableHead className="text-center">ASME</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('listPriceSar')}
              >
                <div className="flex items-center justify-end">
                  Price (SAR) <SortIcon column="listPriceSar" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((boiler) => {
              const isSelected = boiler.id === selectedBoilerId;
              const capacityMatch = getCapacityMatch(boiler.capacityBtuh);
              const baseline = ASHRAE_90_1_BOILER_MINIMUMS[boiler.boilerType];
              const meetsAfue = boiler.afue >= baseline.afue;
              const adjustedResult = showAdjustedAfue ? getAdjustedAfue(boiler) : null;
              
              // Calculate ASHRAE 90.1 compliance based on effective AFUE
              const effectiveAfue = adjustedResult ? adjustedResult.adjustedAfue : boiler.afue;
              const ashraeExceedsPercent = ((effectiveAfue / baseline.afue) - 1) * 100;
              const meetsAshraeAdjusted = effectiveAfue >= baseline.afue;
              
              return (
                <TableRow
                  key={boiler.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'bg-primary/10 hover:bg-primary/15',
                    showAdjustedAfue && ashraeExceedsPercent > 10 && !isSelected && 'bg-green-50/50 dark:bg-green-950/20'
                  )}
                  onClick={() => onSelectBoiler(boiler)}
                >
                  <TableCell>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{boiler.manufacturer}</TableCell>
                  <TableCell>{boiler.model}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {getBoilerTypeDisplayName(boiler.boilerType)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {getFuelTypeDisplayName(boiler.fuelType)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(boiler.capacityBtuh / 1000).toFixed(0)} MBH
                      {capacityMatch !== 'none' && (
                        <Badge
                          variant={
                            capacityMatch === 'optimal'
                              ? 'default'
                              : capacityMatch === 'undersized'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {capacityMatch === 'optimal'
                            ? 'Match'
                            : capacityMatch === 'undersized'
                            ? 'Under'
                            : 'Over'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(!meetsAfue && 'text-destructive')}>
                      {boiler.afue}%
                    </span>
                  </TableCell>
                  {showAdjustedAfue && adjustedResult && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={cn(
                          'font-medium',
                          !meetsAshraeAdjusted && 'text-destructive'
                        )}>
                          {adjustedResult.adjustedAfue.toFixed(1)}%
                        </span>
                        <Badge
                          variant={
                            ashraeExceedsPercent >= 5 
                              ? 'default' 
                              : ashraeExceedsPercent >= 0 
                                ? 'secondary' 
                                : 'destructive'
                          }
                          className={cn(
                            'text-xs px-1.5 py-0',
                            ashraeExceedsPercent >= 5 && 'bg-green-600 hover:bg-green-600'
                          )}
                        >
                          {ashraeExceedsPercent >= 0 ? '+' : ''}
                          {ashraeExceedsPercent.toFixed(0)}%
                        </Badge>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right">{boiler.turndownRatio}:1</TableCell>
                  <TableCell className="text-center">
                    {boiler.asmeCompliant ? (
                      <Check className="mx-auto h-4 w-4 text-green-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {boiler.listPriceSar.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={showAdjustedAfue ? 11 : 10} className="h-24 text-center text-muted-foreground">
                  No boilers match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}