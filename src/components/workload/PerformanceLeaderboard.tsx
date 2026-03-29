import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TechnicianMetrics } from '@/hooks/useTechnicianWorkload';
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceLeaderboardProps {
  technicians: TechnicianMetrics[];
  teamAverage: number;
}

export function PerformanceLeaderboard({ technicians, teamAverage }: PerformanceLeaderboardProps) {
  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  const trendIcon = {
    up: <TrendingUp className="w-3 h-3 text-green-500" />,
    down: <TrendingDown className="w-3 h-3 text-destructive" />,
    stable: <Minus className="w-3 h-3 text-muted-foreground" />,
  };

  const activeTechnicians = technicians.filter(t => t.totalAssigned > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-warning" />
          Performance Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTechnicians.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No technicians with assignments yet
          </p>
        ) : (
          <>
            {activeTechnicians.slice(0, 5).map((tech, index) => {
              const initials = tech.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={tech.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    index < 3 && "bg-muted/50"
                  )}
                >
                  <span className="w-6 text-center font-medium">
                    {getMedalEmoji(index)}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={tech.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tech.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-sm font-bold",
                      tech.resolutionRate >= 80 ? "text-green-600" :
                      tech.resolutionRate >= 60 ? "text-warning" : "text-destructive"
                    )}>
                      {tech.resolutionRate.toFixed(0)}%
                    </span>
                    {trendIcon[tech.trend]}
                  </div>
                </div>
              );
            })}

            {/* Team Average */}
            <div className="pt-3 mt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Team Average</span>
                <span className="font-bold">{teamAverage.toFixed(0)}%</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
