import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Zap, Activity, Gauge, Wind, Flame, Droplets, Lightbulb, Plug, MoreHorizontal, FileInput } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useEnergyMeters,
  useCreateEnergyMeter,
  useUpdateEnergyMeter,
  useDeleteEnergyMeter,
  EnergyMeter,
  SystemType,
  MeterType,
  MeterStatus,
} from "@/hooks/useEnergyMeters";
import { useCreateEnergyReading } from "@/hooks/useEnergyReadingsMutations";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useOrganization";

const SYSTEM_TYPES: { value: SystemType; label: string; icon: React.ElementType }[] = [
  { value: "chiller", label: "Chiller", icon: Activity },
  { value: "ahu", label: "AHU", icon: Wind },
  { value: "pump", label: "Pump", icon: Gauge },
  { value: "cooling_tower", label: "Cooling Tower", icon: Droplets },
  { value: "boiler", label: "Boiler", icon: Flame },
  { value: "fan", label: "Fan", icon: Wind },
  { value: "lighting", label: "Lighting", icon: Lightbulb },
  { value: "plug_load", label: "Plug Load", icon: Plug },
  { value: "other", label: "Other", icon: Zap },
];

const METER_TYPES: { value: MeterType; label: string }[] = [
  { value: "electric", label: "Electric" },
  { value: "gas", label: "Gas" },
  { value: "water", label: "Water" },
  { value: "steam", label: "Steam" },
  { value: "chilled_water", label: "Chilled Water" },
  { value: "hot_water", label: "Hot Water" },
];

const STATUS_COLORS: Record<MeterStatus, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
  maintenance: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  fault: "bg-destructive/10 text-destructive border-destructive/20",
};

const meterFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  meter_tag: z.string().min(1, "Meter tag is required"),
  serial_number: z.string().optional(),
  system_type: z.enum(["chiller", "ahu", "pump", "cooling_tower", "boiler", "fan", "lighting", "plug_load", "other"]),
  meter_type: z.enum(["electric", "gas", "water", "steam", "chilled_water", "hot_water"]),
  unit: z.string().default("kWh"),
  cost_per_unit: z.coerce.number().min(0).default(0.12),
  demand_cost_per_kw: z.coerce.number().min(0).optional().nullable(),
  is_main_meter: z.boolean().default(false),
});

type MeterFormValues = z.infer<typeof meterFormSchema>;

const readingFormSchema = z.object({
  meter_id: z.string().min(1, "Meter is required"),
  value: z.coerce.number().min(0, "Reading value must be positive"),
  consumption: z.coerce.number().min(0).optional(),
  demand_kw: z.coerce.number().min(0).optional(),
  power_factor: z.coerce.number().min(0).max(1).optional(),
  recorded_at: z.string().min(1, "Timestamp is required"),
});

type ReadingFormValues = z.infer<typeof readingFormSchema>;

const DEFAULT_UNITS: Record<MeterType, string> = {
  electric: "kWh",
  gas: "therms",
  water: "gallons",
  steam: "lbs",
  chilled_water: "ton-hrs",
  hot_water: "BTU",
};

export default function EnergyMeters() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  
  const { data: meters, isLoading } = useEnergyMeters();
  const createMeter = useCreateEnergyMeter();
  const updateMeter = useUpdateEnergyMeter();
  const deleteMeter = useDeleteEnergyMeter();
  const createReading = useCreateEnergyReading();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReadingDialogOpen, setIsReadingDialogOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<EnergyMeter | null>(null);
  const [deletingMeterId, setDeletingMeterId] = useState<string | null>(null);

  const form = useForm<MeterFormValues>({
    resolver: zodResolver(meterFormSchema),
    defaultValues: {
      name: "",
      meter_tag: "",
      serial_number: "",
      system_type: "other",
      meter_type: "electric",
      unit: "kWh",
      cost_per_unit: 0.12,
      demand_cost_per_kw: null,
      is_main_meter: false,
    },
  });

  const readingForm = useForm<ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      meter_id: "",
      value: 0,
      consumption: undefined,
      demand_kw: undefined,
      power_factor: undefined,
      recorded_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const selectedMeterType = form.watch("meter_type");

  const handleOpenAddDialog = () => {
    form.reset({
      name: "",
      meter_tag: "",
      serial_number: "",
      system_type: "other",
      meter_type: "electric",
      unit: "kWh",
      cost_per_unit: 0.12,
      demand_cost_per_kw: null,
      is_main_meter: false,
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (meter: EnergyMeter) => {
    setEditingMeter(meter);
    form.reset({
      name: meter.name,
      meter_tag: meter.meter_tag,
      serial_number: meter.serial_number || "",
      system_type: meter.system_type as SystemType,
      meter_type: meter.meter_type as MeterType,
      unit: meter.unit,
      cost_per_unit: meter.cost_per_unit || 0.12,
      demand_cost_per_kw: meter.demand_cost_per_kw,
      is_main_meter: meter.is_main_meter || false,
    });
  };

  const handleSubmit = async (values: MeterFormValues) => {
    if (!profile?.organization_id) return;

    if (editingMeter) {
      await updateMeter.mutateAsync({
        id: editingMeter.id,
        ...values,
      });
      setEditingMeter(null);
    } else {
      await createMeter.mutateAsync({
        name: values.name,
        meter_tag: values.meter_tag,
        serial_number: values.serial_number || null,
        system_type: values.system_type,
        meter_type: values.meter_type,
        unit: values.unit,
        cost_per_unit: values.cost_per_unit,
        demand_cost_per_kw: values.demand_cost_per_kw ?? null,
        is_main_meter: values.is_main_meter,
        organization_id: profile.organization_id,
        project_id: null,
        equipment_id: null,
        zone_id: null,
        ct_ratio: null,
        pulse_factor: null,
        status: "active",
      });
      setIsAddDialogOpen(false);
    }
    form.reset();
  };

  const handleDelete = async () => {
    if (!deletingMeterId) return;
    await deleteMeter.mutateAsync(deletingMeterId);
    setDeletingMeterId(null);
  };

  const handleOpenReadingDialog = () => {
    readingForm.reset({
      meter_id: meters?.[0]?.id || "",
      value: 0,
      consumption: undefined,
      demand_kw: undefined,
      power_factor: undefined,
      recorded_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    });
    setIsReadingDialogOpen(true);
  };

  const handleSubmitReading = async (values: ReadingFormValues) => {
    await createReading.mutateAsync({
      meter_id: values.meter_id,
      recorded_at: new Date(values.recorded_at).toISOString(),
      value: values.value,
      consumption: values.consumption,
      demand_kw: values.demand_kw,
      power_factor: values.power_factor,
      source: "manual",
      quality: "verified",
    });
    setIsReadingDialogOpen(false);
    readingForm.reset();
  };

  const getSystemIcon = (systemType: string) => {
    const system = SYSTEM_TYPES.find((s) => s.value === systemType);
    const Icon = system?.icon || Zap;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Energy Meters</h1>
          <p className="text-muted-foreground">
            Manage energy meters to track consumption across your facilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meters && meters.length > 0 && (
            <Button variant="outline" onClick={handleOpenReadingDialog}>
              <FileInput className="mr-2 h-4 w-4" />
              Record Reading
            </Button>
          )}
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Meter
          </Button>
        </div>
      </div>

      {/* Meters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Meters</CardTitle>
          <CardDescription>
            {meters?.length || 0} meter{meters?.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : meters?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Energy Meters</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first energy meter to track consumption.
              </p>
              <Button onClick={handleOpenAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Meter
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>System Type</TableHead>
                  <TableHead>Meter Type</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters?.map((meter) => (
                  <TableRow key={meter.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {meter.is_main_meter && (
                          <Badge variant="outline" className="text-xs">
                            Main
                          </Badge>
                        )}
                        {meter.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {meter.meter_tag}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSystemIcon(meter.system_type)}
                        <span className="capitalize">
                          {meter.system_type.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {meter.meter_type.replace("_", " ")}
                    </TableCell>
                    <TableCell>{meter.unit}</TableCell>
                    <TableCell>
                      ${meter.cost_per_unit?.toFixed(3) || "0.000"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[meter.status as MeterStatus] || STATUS_COLORS.inactive}
                      >
                        {meter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(meter)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingMeterId(meter.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || !!editingMeter}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingMeter(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMeter ? "Edit Energy Meter" : "Add Energy Meter"}
            </DialogTitle>
            <DialogDescription>
              {editingMeter
                ? "Update the energy meter configuration."
                : "Configure a new energy meter to track consumption."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Building Meter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meter_tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Tag</FormLabel>
                      <FormControl>
                        <Input placeholder="EM-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="system_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select system type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SYSTEM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meter_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("unit", DEFAULT_UNITS[value as MeterType]);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meter type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {METER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost_per_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost/Unit ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="demand_cost_per_kw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demand $/kW</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Optional"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_main_meter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Main Meter</FormLabel>
                      <FormDescription>
                        This is the primary meter for the building or facility
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingMeter(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMeter.isPending || updateMeter.isPending}
                >
                  {createMeter.isPending || updateMeter.isPending
                    ? "Saving..."
                    : editingMeter
                    ? "Update Meter"
                    : "Add Meter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Record Reading Dialog */}
      <Dialog open={isReadingDialogOpen} onOpenChange={setIsReadingDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Meter Reading</DialogTitle>
            <DialogDescription>
              Enter the current meter value and optional consumption data.
            </DialogDescription>
          </DialogHeader>

          <Form {...readingForm}>
            <form onSubmit={readingForm.handleSubmit(handleSubmitReading)} className="space-y-4">
              <FormField
                control={readingForm.control}
                name="meter_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meter</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a meter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {meters?.map((meter) => (
                          <SelectItem key={meter.id} value={meter.id}>
                            <div className="flex items-center gap-2">
                              {getSystemIcon(meter.system_type)}
                              {meter.name} ({meter.meter_tag})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={readingForm.control}
                name="recorded_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reading Timestamp</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={readingForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cumulative Value</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Total meter reading</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={readingForm.control}
                  name="consumption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumption (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="Period usage"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={readingForm.control}
                  name="demand_kw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demand (kW)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0" 
                          placeholder="Optional"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={readingForm.control}
                  name="power_factor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Power Factor</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          max="1"
                          placeholder="0.00 - 1.00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReadingDialogOpen(false);
                    readingForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createReading.isPending}>
                  {createReading.isPending ? "Saving..." : "Record Reading"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMeterId} onOpenChange={() => setDeletingMeterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Energy Meter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this energy meter and all associated readings.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMeter.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
