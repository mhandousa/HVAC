import { useState } from 'react';
import { format, addYears } from 'date-fns';
import { ServiceContract, useRenewContract } from '@/hooks/useServiceContracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RenewContractDialogProps {
  open: boolean;
  onClose: () => void;
  contract: ServiceContract | null;
}

export function RenewContractDialog({ open, onClose, contract }: RenewContractDialogProps) {
  const renewContract = useRenewContract();

  const [newEndDate, setNewEndDate] = useState(
    contract ? format(addYears(new Date(contract.end_date), 1), 'yyyy-MM-dd') : ''
  );
  const [newValue, setNewValue] = useState(contract?.contract_value_sar || 0);

  const handleRenew = () => {
    if (!contract) return;

    renewContract.mutate(
      {
        contractId: contract.id,
        newEndDate,
        newValue,
      },
      { onSuccess: onClose }
    );
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew Contract</DialogTitle>
          <DialogDescription>
            Extend {contract.contract_name} for {contract.customer?.company_name || contract.customer?.contact_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current End Date</Label>
            <Input value={format(new Date(contract.end_date), 'MMM d, yyyy')} disabled />
          </div>

          <div className="space-y-2">
            <Label>New End Date</Label>
            <Input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              min={contract.end_date}
            />
          </div>

          <div className="space-y-2">
            <Label>New Contract Value (SAR)</Label>
            <Input
              type="number"
              min="0"
              value={newValue}
              onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Previous value: {new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(contract.contract_value_sar)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRenew} disabled={renewContract.isPending}>
            Renew Contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
