import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TerminalUnitBOQItem } from '@/types/boq';

interface BOQTerminalUnitsTableProps {
  terminalUnits: TerminalUnitBOQItem[];
}

export function BOQTerminalUnitsTable({ terminalUnits }: BOQTerminalUnitsTableProps) {
  if (terminalUnits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No terminal units configured for this project
      </div>
    );
  }

  // Group by type
  const grouped = terminalUnits.reduce((acc, tu) => {
    const type = tu.unitType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(tu);
    return acc;
  }, {} as Record<string, TerminalUnitBOQItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, units]) => (
        <div key={type}>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Badge variant="outline">{type}</Badge>
            <span className="text-muted-foreground text-sm">({units.length} units)</span>
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">CFM</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Reheat</TableHead>
                <TableHead>Zone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((tu) => (
                <TableRow key={tu.unitTag}>
                  <TableCell className="font-medium">{tu.unitTag}</TableCell>
                  <TableCell>{tu.manufacturer}</TableCell>
                  <TableCell>{tu.model}</TableCell>
                  <TableCell>{tu.size}</TableCell>
                  <TableCell className="text-right">{tu.airflowCfm.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{tu.quantity}</TableCell>
                  <TableCell>
                    {tu.hasReheat ? (
                      <Badge variant="secondary">{tu.reheatType}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{tu.zoneName || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
