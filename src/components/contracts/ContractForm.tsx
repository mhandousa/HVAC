import { useState, useEffect } from 'react';
import { format, addYears } from 'date-fns';
import { useCustomers } from '@/hooks/useCustomers';
import { 
  useCreateServiceContract, 
  useUpdateServiceContract, 
  useNextContractNumber,
  ServiceContract, 
  CreateContractInput 
} from '@/hooks/useServiceContracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ContractFormProps {
  open: boolean;
  onClose: () => void;
  contract?: ServiceContract | null;
  customerId?: string;
}

export function ContractForm({ open, onClose, contract, customerId }: ContractFormProps) {
  const { data: customers } = useCustomers();
  const { data: nextNumber } = useNextContractNumber();
  const createContract = useCreateServiceContract();
  const updateContract = useUpdateServiceContract();

  const [formData, setFormData] = useState<CreateContractInput>({
    customer_id: customerId || '',
    contract_number: '',
    contract_name: '',
    contract_type: 'standard',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
    coverage_type: 'full',
    coverage_description: '',
    response_time_hours: 24,
    resolution_time_hours: 72,
    sla_priority: 'standard',
    after_hours_support: false,
    weekend_support: false,
    contract_value_sar: 0,
    billing_frequency: 'annual',
    payment_terms: 'net_30',
    pm_visits_per_year: 4,
    notes: '',
    special_terms: '',
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        customer_id: contract.customer_id,
        contract_number: contract.contract_number,
        contract_name: contract.contract_name,
        contract_type: contract.contract_type,
        start_date: contract.start_date,
        end_date: contract.end_date,
        coverage_type: contract.coverage_type,
        coverage_description: contract.coverage_description || '',
        response_time_hours: contract.response_time_hours,
        resolution_time_hours: contract.resolution_time_hours,
        sla_priority: contract.sla_priority,
        after_hours_support: contract.after_hours_support,
        weekend_support: contract.weekend_support,
        contract_value_sar: contract.contract_value_sar,
        billing_frequency: contract.billing_frequency,
        payment_terms: contract.payment_terms,
        pm_visits_per_year: contract.pm_visits_per_year,
        notes: contract.notes || '',
        special_terms: contract.special_terms || '',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        contract_number: nextNumber || 'SC-0001',
        customer_id: customerId || '',
      }));
    }
  }, [contract, nextNumber, customerId]);

  const handleSubmit = () => {
    if (contract) {
      updateContract.mutate({ id: contract.id, ...formData }, { onSuccess: onClose });
    } else {
      createContract.mutate(formData, { onSuccess: onClose });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contract ? 'Edit Contract' : 'New Service Contract'}</SheetTitle>
          <SheetDescription>
            {contract ? 'Update contract details' : 'Create a new service contract for your customer'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contract Number</Label>
              <Input
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contract Type</Label>
              <Select
                value={formData.contract_type}
                onValueChange={(v) => setFormData({ ...formData, contract_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contract Name</Label>
            <Input
              placeholder="e.g., Annual HVAC Maintenance"
              value={formData.contract_name}
              onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
            />
          </div>

          {!customerId && (
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(v) => setFormData({ ...formData, customer_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name || c.contact_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* SLA Settings */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">SLA Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Response Time (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.response_time_hours}
                    onChange={(e) => setFormData({ ...formData, response_time_hours: parseInt(e.target.value) || 24 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resolution Time (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.resolution_time_hours}
                    onChange={(e) => setFormData({ ...formData, resolution_time_hours: parseInt(e.target.value) || 72 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select
                  value={formData.sla_priority}
                  onValueChange={(v) => setFormData({ ...formData, sla_priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>After Hours Support</Label>
                <Switch
                  checked={formData.after_hours_support}
                  onCheckedChange={(v) => setFormData({ ...formData, after_hours_support: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Weekend Support</Label>
                <Switch
                  checked={formData.weekend_support}
                  onCheckedChange={(v) => setFormData({ ...formData, weekend_support: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Coverage & PM */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Coverage & Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coverage Type</Label>
                  <Select
                    value={formData.coverage_type}
                    onValueChange={(v) => setFormData({ ...formData, coverage_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Coverage</SelectItem>
                      <SelectItem value="parts_only">Parts Only</SelectItem>
                      <SelectItem value="labor_only">Labor Only</SelectItem>
                      <SelectItem value="preventive_only">Preventive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>PM Visits/Year</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.pm_visits_per_year}
                    onChange={(e) => setFormData({ ...formData, pm_visits_per_year: parseInt(e.target.value) || 4 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Coverage Description</Label>
                <Textarea
                  placeholder="Describe what's covered..."
                  value={formData.coverage_description}
                  onChange={(e) => setFormData({ ...formData, coverage_description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contract Value (SAR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.contract_value_sar}
                  onChange={(e) => setFormData({ ...formData, contract_value_sar: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Billing Frequency</Label>
                  <Select
                    value={formData.billing_frequency}
                    onValueChange={(v) => setFormData({ ...formData, billing_frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select
                    value={formData.payment_terms}
                    onValueChange={(v) => setFormData({ ...formData, payment_terms: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net_15">Net 15</SelectItem>
                      <SelectItem value="net_30">Net 30</SelectItem>
                      <SelectItem value="net_45">Net 45</SelectItem>
                      <SelectItem value="net_60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Internal notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Special Terms</Label>
              <Textarea
                placeholder="Special terms and conditions..."
                value={formData.special_terms}
                onChange={(e) => setFormData({ ...formData, special_terms: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={createContract.isPending || updateContract.isPending || !formData.customer_id || !formData.contract_name}
            >
              {contract ? 'Update Contract' : 'Create Contract'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
