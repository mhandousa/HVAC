import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Target,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { CertificationCredit } from '@/hooks/useCertificationTracking';
import { useTranslation } from 'react-i18next';

interface CertificationCreditCardProps {
  credit: CertificationCredit;
  certificationType: string;
  showAlert?: boolean;
  onViewDetails?: () => void;
}

const STATUS_CONFIG = {
  not_pursuing: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Not Pursuing' },
  pursuing: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20', label: 'Pursuing' },
  documented: { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'Documented' },
  achieved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20', label: 'Achieved' },
  denied: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Denied' },
};

export function CertificationCreditCard({ 
  credit, 
  certificationType,
  showAlert = false,
  onViewDetails 
}: CertificationCreditCardProps) {
  const { t } = useTranslation();
  const statusConfig = STATUS_CONFIG[credit.status];
  const StatusIcon = statusConfig.icon;

  const isPrerequisite = credit.max_points === 0;
  const compliancePercentage = credit.compliance_percentage || 0;
  const isAtRisk = credit.status === 'pursuing' && compliancePercentage < 90;

  return (
    <Card className={`${statusConfig.bg} border ${isAtRisk && showAlert ? 'border-amber-500' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono">
                {credit.credit_id}
              </Badge>
              {isPrerequisite && (
                <Badge variant="secondary" className="text-xs">
                  {t('Prerequisite')}
                </Badge>
              )}
            </div>
            <CardTitle className="text-sm font-medium line-clamp-2">
              {credit.credit_name}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            {!isPrerequisite && (
              <span className="text-xs text-muted-foreground">
                {credit.achieved_points || 0}/{credit.max_points} pts
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {credit.status !== 'not_pursuing' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{t('Compliance')}</span>
              <span className={`text-xs font-medium ${
                compliancePercentage >= 95 ? 'text-green-600' :
                compliancePercentage >= 80 ? 'text-amber-600' :
                'text-destructive'
              }`}>
                {compliancePercentage}%
              </span>
            </div>
            <Progress 
              value={compliancePercentage} 
              className="h-2"
            />
          </div>
        )}

        {isAtRisk && showAlert && (
          <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-950/40 rounded text-xs">
            <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">
              {t('Compliance below target threshold')}
            </span>
          </div>
        )}

        {credit.credit_category && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            {credit.credit_category}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            {statusConfig.label}
          </Badge>
          {onViewDetails && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onViewDetails}>
              {t('Details')}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        {credit.last_assessed_at && (
          <div className="text-xs text-muted-foreground">
            {t('Last assessed')}: {new Date(credit.last_assessed_at).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
