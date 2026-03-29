import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EquipmentBOQItem, AHUComponentBOQItem } from '@/types/boq';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BOQEquipmentTableProps {
  equipment: EquipmentBOQItem[];
  ahuComponents: AHUComponentBOQItem[];
}

export function BOQEquipmentTable({ equipment, ahuComponents }: BOQEquipmentTableProps) {
  const hasEquipment = equipment.length > 0;
  const hasAHUs = ahuComponents.length > 0;

  if (!hasEquipment && !hasAHUs) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No equipment configured for this project
      </div>
    );
  }

  // Group equipment by category
  const groupedEquipment = equipment.reduce((acc, eq) => {
    const cat = eq.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(eq);
    return acc;
  }, {} as Record<string, EquipmentBOQItem[]>);

  return (
    <Tabs defaultValue={hasEquipment ? "equipment" : "ahus"} className="space-y-4">
      <TabsList>
        <TabsTrigger value="equipment" disabled={!hasEquipment}>
          Equipment ({equipment.length})
        </TabsTrigger>
        <TabsTrigger value="ahus" disabled={!hasAHUs}>
          AHU Components ({ahuComponents.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="equipment" className="space-y-6">
        {Object.entries(groupedEquipment).map(([category, items]) => (
          <div key={category}>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Badge variant="outline">{category}</Badge>
              <span className="text-muted-foreground text-sm">({items.length} items)</span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((eq, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell>{eq.manufacturer}</TableCell>
                    <TableCell>{eq.model}</TableCell>
                    <TableCell>{eq.capacity}</TableCell>
                    <TableCell className="text-right">{eq.quantity}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{eq.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="ahus">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">CFM</TableHead>
              <TableHead className="text-right">Cooling (Tons)</TableHead>
              <TableHead className="text-right">Heating (MBH)</TableHead>
              <TableHead className="text-right">Supply Fan (HP)</TableHead>
              <TableHead className="text-right">Return Fan (HP)</TableHead>
              <TableHead>Components</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ahuComponents.map((ahu) => (
              <TableRow key={ahu.ahuTag}>
                <TableCell className="font-medium">{ahu.ahuTag}</TableCell>
                <TableCell>{ahu.ahuName}</TableCell>
                <TableCell className="text-right">{ahu.cfm.toLocaleString()}</TableCell>
                <TableCell className="text-right">{ahu.coolingTons?.toFixed(1) || '—'}</TableCell>
                <TableCell className="text-right">{ahu.heatingMBH?.toFixed(0) || '—'}</TableCell>
                <TableCell className="text-right">{ahu.supplyFanHP?.toFixed(1) || '—'}</TableCell>
                <TableCell className="text-right">{ahu.returnFanHP?.toFixed(1) || '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ahu.hasCoolingCoil && <Badge variant="secondary" className="text-xs">Cooling</Badge>}
                    {ahu.hasHeatingCoil && <Badge variant="secondary" className="text-xs">Heating</Badge>}
                    {ahu.filterType && <Badge variant="secondary" className="text-xs">Filters</Badge>}
                    {ahu.hasERV && <Badge variant="secondary" className="text-xs">ERV</Badge>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
