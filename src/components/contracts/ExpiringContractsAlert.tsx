import { useExpiringContracts } from '@/hooks/useServiceContracts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface ExpiringContractsAlertProps {
  onRenew?: (contractId: string) => void;
}

export function ExpiringContractsAlert({ onRenew }: ExpiringContractsAlertProps) {
  const { data: expiringContracts } = useExpiringContracts(30);

  if (!expiringContracts?.length) {
    return null;
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          Contracts Expiring Soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expiringContracts.map((contract) => {
            const daysRemaining = differenceInDays(new Date(contract.end_date), new Date());
            return (
              <div key={contract.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{contract.contract_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.customer?.company_name || contract.customer?.contact_name} • 
                    Expires {format(new Date(contract.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500/20 text-yellow-700">
                    {daysRemaining} days
                  </Badge>
                  {onRenew && (
                    <Button size="sm" variant="outline" onClick={() => onRenew(contract.id)}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Renew
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
