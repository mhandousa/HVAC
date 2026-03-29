import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Thermometer, 
  Mountain, 
  BookOpen, 
  Lightbulb,
  ArrowRight,
  CheckCircle,
  LineChart,
} from 'lucide-react';
import {
  IndustryTemplate,
  CLIMATE_ZONE_LABELS,
  CLIMATE_ZONE_COLORS,
  BUILDING_TYPE_LABELS,
  APPLICATION_LABELS,
} from '@/lib/psychrometric-industry-templates';
import { MiniPsychrometricChart } from './MiniPsychrometricChart';

interface TemplatePreviewDialogProps {
  template: IndustryTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: () => void;
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onLoad,
}: TemplatePreviewDialogProps) {
  if (!template) return null;

  const handleLoad = () => {
    onLoad();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-6 pr-4">
            {/* Context Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className={CLIMATE_ZONE_COLORS[template.climateZone]}
              >
                {CLIMATE_ZONE_LABELS[template.climateZone]}
              </Badge>
              <Badge variant="outline">
                {BUILDING_TYPE_LABELS[template.buildingType]}
              </Badge>
              <Badge variant="outline">
                {APPLICATION_LABELS[template.application]}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Mountain className="h-3 w-3" />
                {template.altitudeFt.toLocaleString()} ft
              </Badge>
            </div>

            {/* Air States Table */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Air State Points
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>State Name</TableHead>
                    <TableHead className="text-right">Dry Bulb</TableHead>
                    <TableHead className="text-right">Humidity</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.airStates.map((state, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {state.name}
                          {index < template.airStates.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {state.dryBulb}°C
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {state.humidity}%
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground capitalize">
                        {state.humidityType === 'relative' ? 'RH' : state.humidityType}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mini Psychrometric Chart Visualization */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Process Visualization
              </h4>
              <div className="flex justify-center">
                <MiniPsychrometricChart
                  airStates={template.airStates}
                  altitudeFt={template.altitudeFt}
                  width={420}
                  height={240}
                  showLabels={true}
                  showProcessLines={true}
                />
              </div>
            </div>

            <Separator />

            {/* Design Notes */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Design Notes
              </h4>
              <ul className="space-y-2">
                {template.designNotes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Standards & References */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Standards & References
              </h4>
              <div className="flex flex-wrap gap-2">
                {template.standards.map((standard) => (
                  <Badge key={standard} variant="secondary">
                    {standard}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Source: {template.source}
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleLoad}>
            Load to Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
