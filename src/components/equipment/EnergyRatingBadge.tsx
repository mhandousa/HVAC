import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnergyRatingBadgeProps {
  rating: number; // 1-6 stars
  secApproved?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EnergyRatingBadge({ 
  rating, 
  secApproved = false, 
  className,
  size = 'md'
}: EnergyRatingBadgeProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const maxStars = 6;
  const validRating = Math.min(Math.max(rating, 0), maxStars);
  
  const sizeClasses = {
    sm: { star: 'h-3 w-3', text: 'text-xs', padding: 'px-2 py-1' },
    md: { star: 'h-4 w-4', text: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { star: 'h-5 w-5', text: 'text-base', padding: 'px-4 py-2' },
  };

  const getRatingColor = (stars: number) => {
    if (stars >= 5) return 'bg-success/10 border-success/30 text-success';
    if (stars >= 4) return 'bg-success/10 border-success/30 text-success';
    if (stars >= 3) return 'bg-warning/10 border-warning/30 text-warning';
    return 'bg-destructive/10 border-destructive/30 text-destructive';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border',
        sizeClasses[size].padding,
        getRatingColor(validRating),
        isRTL && 'flex-row-reverse',
        className
      )}
    >
      <div className={cn('flex items-center gap-0.5', isRTL && 'flex-row-reverse')}>
        {Array.from({ length: maxStars }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              sizeClasses[size].star,
              index < validRating ? 'fill-current' : 'opacity-30'
            )}
          />
        ))}
      </div>
      <div className={cn('flex flex-col', isRTL && 'items-end')}>
        <span className={cn('font-semibold', sizeClasses[size].text)}>
          {t('equipment.compliance.secRating')}
        </span>
        {secApproved && (
          <span className="text-xs opacity-75">SEC</span>
        )}
      </div>
    </div>
  );
}

// Compact version for tables/lists
export function EnergyRatingStars({ 
  rating, 
  className 
}: { 
  rating: number; 
  className?: string;
}) {
  const maxStars = 6;
  const validRating = Math.min(Math.max(rating, 0), maxStars);
  
  const getStarColor = (stars: number) => {
    if (stars >= 5) return 'text-success';
    if (stars >= 4) return 'text-success';
    if (stars >= 3) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxStars }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'h-3.5 w-3.5',
            index < validRating 
              ? cn('fill-current', getStarColor(validRating))
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}
