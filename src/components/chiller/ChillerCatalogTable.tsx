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
import { Search, ChevronUp, ChevronDown, Check, X, Database, FileText, Loader2, TrendingUp, TrendingDown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CHILLER_CATALOG,
  getChillerTypeDisplayName,
  getManufacturers,
  ASHRAE_90_1_MINIMUMS,
  calculateAdjustedIplv,
  AHRI_STANDARD_CONDITIONS,
  type ChillerCatalogItem,
  type ChillerType,
  type CompressorType,
  type PartLoadCurve,
} from '@/lib/chiller-selection-calculations';
import { useChillerCatalog, type EquipmentCatalogItem, type ChillerSubcategory } from '@/hooks/useEquipmentCatalog';

interface ChillerCatalogTableProps {
  requiredCapacityTons?: number;
  onSelectChiller: (chiller: ChillerCatalogItem) => void;
  selectedChillerId?: string;
  filterType?: ChillerType;
  onFilterTypeChange?: (type: ChillerType | undefined) => void;
  chwSupplyF?: number;
  cwSupplyF?: number;
  ambientDesignF?: number;
}

type SortKey = 'manufacturer' | 'model' | 'capacityTons' | 'eer' | 'iplv' | 'adjustedIplv' | 'listPriceSar';
type SortDir = 'asc' | 'desc';

export function ChillerCatalogTable({
  requiredCapacityTons,
  onSelectChiller,
  selectedChillerId,
  filterType,
  onFilterTypeChange,
  chwSupplyF = 44,
  cwSupplyF = 85,
  ambientDesignF = 95,
}: ChillerCatalogTableProps) {
  const [search, setSearch] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [minIplv, setMinIplv] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('capacityTons');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Fetch from database
  const { data: dbChillers, isLoading } = useChillerCatalog({
    subcategory: filterType as ChillerSubcategory | undefined,
    manufacturer: filterManufacturer !== 'all' ? filterManufacturer : undefined,
    minIplv: minIplv > 0 ? minIplv : undefined,
  });

  const manufacturers = useMemo(() => getManufacturers(), []);

  // Adapter function to convert database items to local interface
  const adaptDbToLocal = (item: EquipmentCatalogItem): ChillerCatalogItem => ({
    id: item.id,
    manufacturer: item.manufacturer || '',
    model: item.model_number || '',
    chillerType: (item.equipment_subcategory || 'water-cooled-centrifugal') as ChillerType,
    compressorType: (item.compressor_type || 'centrifugal') as CompressorType,
    refrigerant: item.refrigerant_type || 'R-134a',
    capacityTons: item.cooling_capacity_tons || 0,
    capacityKw: item.cooling_capacity_kw || 0,
    eer: item.eer || 0,
    cop: item.cop || 0,
    iplv: item.iplv || 0,
    partLoad: (item.part_load_curve as unknown as PartLoadCurve) || { pct100: 0, pct75: 0, pct50: 0, pct25: 0 },
    chwDeltaT: (item as any).chw_delta_t_f || 10,
    cwDeltaT: (item as any).cw_delta_t_f || 10,
    evapPressureDropFt: (item as any).evap_pressure_drop_ft || 0,
    condPressureDropFt: (item as any).cond_pressure_drop_ft || 0,
    voltage: item.voltage || '380V',
    fla: item.full_load_amps || 0,
    lra: (item as any).lra || 0,
    powerInputKw: item.power_input_kw || 0,
    soundDb: item.sound_power_level_db || 0,
    weightOperatingLbs: Math.round((item.weight_kg || 0) * 2.205),
    sasoCompliant: item.saso_certified || false,
    ahriCertified: (item as any).ahri_certified || false,
    ahriCertNumber: (item as any).ahri_cert_number,
    listPriceSar: item.list_price_sar || 0,
  });

  // Use database data when available, fallback to static catalog
  const sourceData = useMemo(() => {
    if (dbChillers && dbChillers.length > 0) {
      return dbChillers.map(adaptDbToLocal);
    }
    return CHILLER_CATALOG;
  }, [dbChillers]);

  const isUsingDatabase = dbChillers && dbChillers.length > 0;

  const filteredAndSorted = useMemo(() => {
    let result = [...sourceData];

    // Filter by type (only for static data, DB already filtered)
    if (!isUsingDatabase && filterType) {
      result = result.filter(c => c.chillerType === filterType);
    }

    // Filter by manufacturer (only for static data, DB already filtered)
    if (!isUsingDatabase && filterManufacturer && filterManufacturer !== 'all') {
      result = result.filter(c => c.manufacturer === filterManufacturer);
    }

    // Filter by search (always apply locally for text matching)
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        c =>
          c.manufacturer.toLowerCase().includes(lower) ||
          c.model.toLowerCase().includes(lower) ||
          c.refrigerant.toLowerCase().includes(lower)
      );
    }

    // Filter by min IPLV (only for static data, DB already filtered)
    if (!isUsingDatabase && minIplv > 0) {
      result = result.filter(c => c.iplv >= minIplv);
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
  }, [sourceData, isUsingDatabase, filterType, filterManufacturer, search, minIplv, sortKey, sortDir]);

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
    if (!requiredCapacityTons) return 'none';
    const ratio = capacity / requiredCapacityTons;
    if (ratio < 0.95) return 'undersized';
    if (ratio >= 0.95 && ratio <= 1.25) return 'optimal';
    return 'oversized';
  };

  // Check if we need to show adjusted IPLV column
  const showAdjustedIplv = chwSupplyF !== 44 || cwSupplyF !== 85 || ambientDesignF !== 95;

  // Helper to calculate adjusted IPLV for a chiller
  const getAdjustedIplv = (chiller: ChillerCatalogItem) => {
    const isWaterCooled = chiller.chillerType.startsWith('water-cooled');
    return calculateAdjustedIplv(
      chiller.iplv,
      chiller.chillerType,
      chwSupplyF,
      isWaterCooled ? cwSupplyF : undefined,
      !isWaterCooled ? ambientDesignF : undefined
    );
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
          onValueChange={(v) => onFilterTypeChange?.(v === 'all' ? undefined : v as ChillerType)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="water-cooled-centrifugal">Water-Cooled Centrifugal</SelectItem>
            <SelectItem value="water-cooled-screw">Water-Cooled Screw</SelectItem>
            <SelectItem value="air-cooled-screw">Air-Cooled Screw</SelectItem>
            <SelectItem value="air-cooled-scroll">Air-Cooled Scroll</SelectItem>
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
        
        <div className="flex items-center gap-2 min-w-[180px]">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Min IPLV:</span>
          <Slider
            value={[minIplv]}
            onValueChange={([v]) => setMinIplv(v)}
            min={0}
            max={12}
            step={0.5}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8">{minIplv}</span>
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
                  Database ({dbChillers?.length})
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3" />
                  Static Catalog
                </>
              )}
            </Badge>
          )}
          <span>{filteredAndSorted.length} chillers found</span>
        </div>
        {requiredCapacityTons && (
          <span>Required: {requiredCapacityTons} tons</span>
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
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('capacityTons')}
              >
                <div className="flex items-center justify-end">
                  Capacity <SortIcon column="capacityTons" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('eer')}
              >
                <div className="flex items-center justify-end">
                  EER <SortIcon column="eer" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort('iplv')}
              >
                <div className="flex items-center justify-end">
                  IPLV <SortIcon column="iplv" />
                </div>
              </TableHead>
              {showAdjustedIplv && (
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-end gap-1 cursor-help">
                        Adj. IPLV
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p className="text-xs">
                        Temperature-corrected IPLV per AHRI 551/591. 
                        Badge shows % vs ASHRAE 90.1-2019 Path B baseline.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
              )}
              <TableHead className="text-center">SASO</TableHead>
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
            {filteredAndSorted.map((chiller) => {
              const isSelected = chiller.id === selectedChillerId;
              const capacityMatch = getCapacityMatch(chiller.capacityTons);
              const baseline = ASHRAE_90_1_MINIMUMS[chiller.chillerType];
              const meetsIplv = chiller.iplv >= baseline.iplv;
              const adjustedResult = showAdjustedIplv ? getAdjustedIplv(chiller) : null;
              
              // Calculate ASHRAE 90.1 compliance based on effective IPLV
              const effectiveIplv = adjustedResult ? adjustedResult.adjustedIplv : chiller.iplv;
              const ashraeExceedsPercent = ((effectiveIplv / baseline.iplv) - 1) * 100;
              const meetsAshraeAdjusted = effectiveIplv >= baseline.iplv;
              
              return (
                <TableRow
                  key={chiller.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'bg-primary/10 hover:bg-primary/15',
                    showAdjustedIplv && ashraeExceedsPercent > 10 && !isSelected && 'bg-green-50/50 dark:bg-green-950/20'
                  )}
                  onClick={() => onSelectChiller(chiller)}
                >
                  <TableCell>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{chiller.manufacturer}</TableCell>
                  <TableCell>{chiller.model}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {getChillerTypeDisplayName(chiller.chillerType)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {chiller.capacityTons}
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
                  <TableCell className="text-right">{chiller.eer.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(!meetsIplv && 'text-destructive')}>
                      {chiller.iplv.toFixed(2)}
                    </span>
                  </TableCell>
                  {showAdjustedIplv && adjustedResult && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={cn(
                          'font-medium',
                          !meetsAshraeAdjusted && 'text-destructive'
                        )}>
                          {adjustedResult.adjustedIplv.toFixed(2)}
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
                  <TableCell className="text-center">
                    {chiller.sasoCompliant ? (
                      <Check className="mx-auto h-4 w-4 text-green-600" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {chiller.listPriceSar.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={showAdjustedIplv ? 10 : 9} className="h-24 text-center text-muted-foreground">
                  No chillers match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
