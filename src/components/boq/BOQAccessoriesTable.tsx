import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AccessoryBOQItem } from '@/types/boq';

interface BOQAccessoriesTableProps {
  accessories: AccessoryBOQItem[];
}

export function BOQAccessoriesTable({ accessories }: BOQAccessoriesTableProps) {
  if (accessories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No accessories derived. Accessories are automatically extracted from terminal units and AHU configurations.
      </div>
    );
  }

  // Group by category
  const grouped = accessories.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, AccessoryBOQItem[]>);

  // Sort categories
  const sortedCategories = Object.keys(grouped).sort();

  // Calculate totals per category
  const categoryTotals = sortedCategories.map(cat => ({
    category: cat,
    count: grouped[cat].reduce((sum, item) => sum + item.quantity, 0),
  }));

  return (
    <div className="space-y-6">
      {/* Category Summary */}
      <div className="flex flex-wrap gap-2">
        {categoryTotals.map(({ category, count }) => (
          <Badge key={category} variant="outline" className="text-sm">
            {category}: {count}
          </Badge>
        ))}
      </div>

      {/* Detailed Tables */}
      {sortedCategories.map(category => (
        <div key={category}>
          <h4 className="font-medium mb-2">{category}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Source Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped[category].map((acc, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{acc.description}</TableCell>
                  <TableCell>{acc.size || '—'}</TableCell>
                  <TableCell className="text-right">{acc.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{acc.sourceUnit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
