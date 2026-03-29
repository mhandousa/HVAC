import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, MinusCircle, XCircle } from 'lucide-react';

interface SkillMatchBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function SkillMatchBadge({ score, showLabel = true, size = 'md' }: SkillMatchBadgeProps) {
  const getMatchInfo = () => {
    if (score >= 90) {
      return {
        label: 'Excellent Match',
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
        icon: CheckCircle2,
      };
    } else if (score >= 70) {
      return {
        label: 'Good Match',
        variant: 'default' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
        icon: CheckCircle2,
      };
    } else if (score >= 50) {
      return {
        label: 'Fair Match',
        variant: 'default' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
        icon: MinusCircle,
      };
    } else {
      return {
        label: 'Poor Match',
        variant: 'default' as const,
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
        icon: AlertCircle,
      };
    }
  };

  const matchInfo = getMatchInfo();
  const Icon = matchInfo.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <Badge
      variant={matchInfo.variant}
      className={`${matchInfo.className} ${size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}
    >
      <Icon className={`${size === 'sm' ? 'mr-0.5' : 'mr-1'}`} size={iconSize} />
      {showLabel ? matchInfo.label : `${score}%`}
    </Badge>
  );
}

export function SkillMatchIndicator({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIcon = () => {
    if (score >= 70) return CheckCircle2;
    if (score >= 50) return MinusCircle;
    return XCircle;
  };

  const Icon = getIcon();

  return (
    <div className={`flex items-center gap-1 ${getColor()}`}>
      <Icon size={14} />
      <span className="text-xs font-medium">{score}%</span>
    </div>
  );
}
