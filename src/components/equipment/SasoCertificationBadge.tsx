import { Shield, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, differenceInDays, isPast } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SasoCertificationBadgeProps {
  certified: boolean;
  certificateNumber?: string;
  expiryDate?: string;
  className?: string;
  showDetails?: boolean;
}

export function SasoCertificationBadge({
  certified,
  certificateNumber,
  expiryDate,
  className,
  showDetails = true,
}: SasoCertificationBadgeProps) {
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();

  const getExpiryStatus = () => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, new Date());
    
    if (isPast(expiry)) {
      return { status: 'expired', label: language === 'ar' ? 'منتهية' : 'Expired', color: 'destructive' };
    }
    if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: language === 'ar' ? 'تنتهي قريباً' : 'Expiring Soon', color: 'warning' };
    }
    return { status: 'valid', label: language === 'ar' ? 'صالحة' : 'Valid', color: 'success' };
  };

  const expiryStatus = getExpiryStatus();

  if (!certified) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-muted text-muted-foreground border border-border',
          isRTL && 'flex-row-reverse',
          className
        )}
      >
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">
          {t('equipment.compliance.notCertified')}
        </span>
      </div>
    );
  }

  const BadgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'bg-success/10 text-success border border-success/30',
        expiryStatus?.status === 'expired' && 'bg-destructive/10 text-destructive border-destructive/30',
        expiryStatus?.status === 'expiring' && 'bg-warning/10 text-warning border-warning/30',
        isRTL && 'flex-row-reverse',
        className
      )}
    >
      {expiryStatus?.status === 'expired' ? (
        <ShieldAlert className="h-4 w-4" />
      ) : expiryStatus?.status === 'expiring' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <ShieldCheck className="h-4 w-4" />
      )}
      <div className={cn('flex flex-col', isRTL && 'items-end')}>
        <span className="text-sm font-semibold">
          {t('equipment.compliance.sasoTitle')}
        </span>
        {showDetails && certificateNumber && (
          <span className="text-xs opacity-75">
            {certificateNumber}
          </span>
        )}
      </div>
      {expiryStatus && (
        <Badge 
          variant={expiryStatus.color === 'success' ? 'default' : 'destructive'}
          className={cn(
            'text-xs',
            expiryStatus.color === 'warning' && 'bg-warning text-warning-foreground'
          )}
        >
          {expiryStatus.label}
        </Badge>
      )}
    </div>
  );

  if (showDetails && (certificateNumber || expiryDate)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {BadgeContent}
          </TooltipTrigger>
          <TooltipContent className={cn(isRTL && 'text-right')}>
            <div className="space-y-1">
              {certificateNumber && (
                <p>
                  <span className="font-medium">{t('equipment.compliance.sasoCert')}: </span>
                  {certificateNumber}
                </p>
              )}
              {expiryDate && (
                <p>
                  <span className="font-medium">{t('equipment.compliance.sasoExpiry')}: </span>
                  {format(new Date(expiryDate), 'PP')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return BadgeContent;
}

// Compact icon-only version
export function SasoIcon({ 
  certified, 
  className 
}: { 
  certified: boolean; 
  className?: string;
}) {
  return certified ? (
    <ShieldCheck className={cn('h-4 w-4 text-success', className)} />
  ) : (
    <Shield className={cn('h-4 w-4 text-muted-foreground', className)} />
  );
}
