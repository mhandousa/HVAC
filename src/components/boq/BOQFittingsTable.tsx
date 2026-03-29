import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActualDuctFitting, ActualPipeFitting } from '@/types/boq';

interface BOQFittingsTableProps {
  ductFittings: ActualDuctFitting[];
  pipeFittings: ActualPipeFitting[];
}

export function BOQFittingsTable({ ductFittings, pipeFittings }: BOQFittingsTableProps) {
  const hasDuctFittings = ductFittings.length > 0;
  const hasPipeFittings = pipeFittings.length > 0;

  if (!hasDuctFittings && !hasPipeFittings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No fittings configured for this project
      </div>
    );
  }

  // Group duct fittings by type
  const groupedDuct = ductFittings.reduce((acc, f) => {
    const type = f.fittingType;
    if (!acc[type]) acc[type] = { items: [], totalQty: 0 };
    acc[type].items.push(f);
    acc[type].totalQty += f.quantity;
    return acc;
  }, {} as Record<string, { items: ActualDuctFitting[]; totalQty: number }>);

  // Group pipe fittings by type
  const groupedPipe = pipeFittings.reduce((acc, f) => {
    const type = f.fittingType;
    if (!acc[type]) acc[type] = { items: [], totalQty: 0 };
    acc[type].items.push(f);
    acc[type].totalQty += f.quantity;
    return acc;
  }, {} as Record<string, { items: ActualPipeFitting[]; totalQty: number }>);

  return (
    <Tabs defaultValue={hasDuctFittings ? "duct" : "pipe"} className="space-y-4">
      <TabsList>
        <TabsTrigger value="duct" disabled={!hasDuctFittings}>
          Duct Fittings ({ductFittings.reduce((s, f) => s + f.quantity, 0)})
        </TabsTrigger>
        <TabsTrigger value="pipe" disabled={!hasPipeFittings}>
          Pipe Fittings ({pipeFittings.reduce((s, f) => s + f.quantity, 0)})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="duct" className="space-y-6">
        {Object.entries(groupedDuct).map(([type, { items, totalQty }]) => (
          <div key={type}>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Badge variant="outline">{type}</Badge>
              <span className="text-muted-foreground text-sm">({totalQty} total)</span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Equiv. Length (ft)</TableHead>
                  <TableHead className="text-right">Loss Coeff.</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((f, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{f.fittingDescription || type}</TableCell>
                    <TableCell>{f.segmentName}</TableCell>
                    <TableCell className="text-right">{f.equivalentLengthFt?.toFixed(1) || '—'}</TableCell>
                    <TableCell className="text-right">{f.lossCoefficient?.toFixed(2) || '—'}</TableCell>
                    <TableCell className="text-right">{f.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="pipe" className="space-y-6">
        {Object.entries(groupedPipe).map(([type, { items, totalQty }]) => (
          <div key={type}>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Badge variant="outline">{type}</Badge>
              <span className="text-muted-foreground text-sm">({totalQty} total)</span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">K-Factor</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((f, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{f.fittingDescription || type}</TableCell>
                    <TableCell>{f.segmentName}</TableCell>
                    <TableCell>{f.size || '—'}</TableCell>
                    <TableCell className="text-right">{f.kFactor?.toFixed(2) || '—'}</TableCell>
                    <TableCell className="text-right">{f.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
