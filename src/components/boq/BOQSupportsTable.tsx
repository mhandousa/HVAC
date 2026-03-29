import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SupportBOQItem } from '@/types/boq';
import { Info, ArrowUpDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo, useState } from 'react';

interface BOQSupportsTableProps {
  supports: SupportBOQItem[];
}

type SortField = 'type' | 'size' | 'quantity';
type SortDirection = 'asc' | 'desc';

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  trapeze: 'Trapeze Hanger',
  clevis: 'Clevis Hanger',
  strap: 'Strap Hanger',
  riser_clamp: 'Riser Clamp',
  pipe_guide: 'Pipe Guide',
  anchor: 'Pipe Anchor',
  beam_clamp: 'Beam Clamp',
  seismic_brace: 'Seismic Brace',
};

const SUPPORT_TYPE_ICONS: Record<string, string> = {
  trapeze: '⊏⊐',
  clevis: '∪',
  strap: '⌒',
  riser_clamp: '⊕',
  pipe_guide: '↔',
  anchor: '⚓',
  beam_clamp: '🔩',
  seismic_brace: '⛓',
};

export function BOQSupportsTable({ supports }: BOQSupportsTableProps) {
  const [sortField, setSortField] = useState<SortField>('type');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Group by application (duct vs pipe) and horizontal vs riser
  const groupedSupports = useMemo(() => {
    const groups = {
      ductHorizontal: supports.filter(s => s.application === 'duct' && !s.isRiser && s.supportType !== 'beam_clamp' && s.supportType !== 'seismic_brace'),
      ductRiser: supports.filter(s => s.application === 'duct' && s.isRiser),
      ductAccessories: supports.filter(s => s.application === 'duct' && (s.supportType === 'beam_clamp' || s.supportType === 'seismic_brace')),
      pipeHorizontal: supports.filter(s => s.application === 'pipe' && !s.isRiser && s.supportType !== 'pipe_guide' && s.supportType !== 'anchor'),
      pipeRiser: supports.filter(s => s.application === 'pipe' && s.isRiser),
      pipeAccessories: supports.filter(s => s.application === 'pipe' && (s.supportType === 'pipe_guide' || s.supportType === 'anchor')),
    };
    return groups;
  }, [supports]);

  // Calculate totals
  const totals = useMemo(() => ({
    ductHangers: groupedSupports.ductHorizontal.reduce((sum, s) => sum + s.estimatedQuantity, 0) +
                 groupedSupports.ductRiser.reduce((sum, s) => sum + s.estimatedQuantity, 0),
    ductAccessories: groupedSupports.ductAccessories.reduce((sum, s) => sum + s.estimatedQuantity, 0),
    pipeHangers: groupedSupports.pipeHorizontal.reduce((sum, s) => sum + s.estimatedQuantity, 0) +
                 groupedSupports.pipeRiser.reduce((sum, s) => sum + s.estimatedQuantity, 0),
    pipeAccessories: groupedSupports.pipeAccessories.reduce((sum, s) => sum + s.estimatedQuantity, 0),
    total: supports.reduce((sum, s) => sum + s.estimatedQuantity, 0),
  }), [supports, groupedSupports]);

  if (supports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No supports estimated. Supports are calculated from duct and pipe segment lengths using SMACNA and MSS SP-58 spacing guidelines.
      </div>
    );
  }

  const renderSupportTable = (items: SupportBOQItem[], title: string) => {
    if (items.length === 0) return null;

    const subtotal = items.reduce((sum, s) => sum + s.estimatedQuantity, 0);

    return (
      <div className="mb-6">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          {title}
          <Badge variant="outline" className="ml-2">
            {subtotal} total
          </Badge>
        </h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size Range</TableHead>
              <TableHead className="text-right">Rod Dia.</TableHead>
              <TableHead className="text-right">Spacing</TableHead>
              <TableHead className="text-right">Est. Qty</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((sup, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-center text-lg">
                  {SUPPORT_TYPE_ICONS[sup.supportType] || '•'}
                </TableCell>
                <TableCell className="font-medium">
                  {sup.description}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {sup.size}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {sup.rodDiameter || '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {sup.spacingFt ? `${sup.spacingFt} ft` : '—'}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {sup.estimatedQuantity}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-muted-foreground text-sm underline decoration-dotted cursor-help">
                        {sup.basis.split(' - ')[0]}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium">{sup.basis}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Includes 10% allowance for transitions and field conditions.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="default" className="text-sm">
          Total: {totals.total} supports
        </Badge>
        <Badge variant="outline" className="text-sm">
          Duct: {totals.ductHangers} hangers
        </Badge>
        <Badge variant="outline" className="text-sm">
          Pipe: {totals.pipeHangers} hangers
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-1">Estimation Basis</p>
              <ul className="text-xs space-y-1">
                <li>• Duct: SMACNA HVAC Duct Construction Standards</li>
                <li>• Pipe: MSS SP-58 Pipe Hangers and Supports</li>
                <li>• Includes 10% allowance for field conditions</li>
                <li>• Risers detected from segment names (RISER, VERTICAL)</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Duct Supports Section */}
      {(groupedSupports.ductHorizontal.length > 0 || groupedSupports.ductRiser.length > 0) && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">D</span>
            Duct Supports
          </h3>
          {renderSupportTable(groupedSupports.ductHorizontal, 'Horizontal Duct Hangers')}
          {renderSupportTable(groupedSupports.ductRiser, 'Duct Riser Supports')}
          {renderSupportTable(groupedSupports.ductAccessories, 'Duct Support Accessories')}
        </div>
      )}

      {/* Pipe Supports Section */}
      {(groupedSupports.pipeHorizontal.length > 0 || groupedSupports.pipeRiser.length > 0 || groupedSupports.pipeAccessories.length > 0) && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-chart-2/10 flex items-center justify-center text-chart-2">P</span>
            Pipe Supports
          </h3>
          {renderSupportTable(groupedSupports.pipeHorizontal, 'Horizontal Pipe Hangers')}
          {renderSupportTable(groupedSupports.pipeRiser, 'Pipe Riser Supports')}
          {renderSupportTable(groupedSupports.pipeAccessories, 'Pipe Guides & Anchors')}
        </div>
      )}
    </div>
  );
}
