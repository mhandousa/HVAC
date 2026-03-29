import { usePresence, PresenceUser } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Wifi, WifiOff, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveEditorsIndicatorProps {
  entityType: string;
  entityId: string | null;
  projectId?: string;
  className?: string;
  maxAvatars?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function UserAvatar({ user, index }: { user: PresenceUser; index: number }) {
  return (
    <div
      className={cn(
        'relative',
        index > 0 && '-ml-2'
      )}
      style={{ zIndex: 10 - index }}
    >
      <Avatar className="h-7 w-7 border-2 border-background">
        <AvatarImage src={user.avatarUrl} alt={user.fullName} />
        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
          {getInitials(user.fullName)}
        </AvatarFallback>
      </Avatar>
      {user.isEditing && (
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-warning border border-background flex items-center justify-center">
          <Edit3 className="h-1.5 w-1.5 text-warning-foreground" />
        </div>
      )}
    </div>
  );
}

export function ActiveEditorsIndicator({
  entityType,
  entityId,
  projectId,
  className,
  maxAvatars = 3,
}: ActiveEditorsIndicatorProps) {
  const { activeUsers, isConnected, hasOtherEditors, otherEditorsCount } = usePresence({
    entityType,
    entityId,
    projectId,
  });

  // Build tooltip content
  const getTooltipContent = () => {
    if (activeUsers.length === 0) {
      return 'No other users viewing this design';
    }

    const lines: string[] = [];
    
    if (editingUsers.length > 0) {
      lines.push(`Editing: ${editingUsers.map(u => u.fullName).join(', ')}`);
    }
    
    const viewingUsers = activeUsers.filter(u => !u.isEditing);
    if (viewingUsers.length > 0) {
      lines.push(`Viewing: ${viewingUsers.map(u => u.fullName).join(', ')}`);
    }

    return lines.join('\n');
  };

  // Don't render if no entity selected
  if (!entityId) {
    return null;
  }

  const displayedUsers = activeUsers.slice(0, maxAvatars);
  const remainingCount = activeUsers.length - maxAvatars;
  const editingUsers = activeUsers.filter(u => u.isEditing);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
              hasOtherEditors ? 'bg-warning/10' : 'bg-muted/50',
              className
            )}
          >
            {/* Connection indicator */}
            <div className="flex items-center">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-primary" />
              ) : (
                <WifiOff className="h-3 w-3 text-muted-foreground" />
              )}
            </div>

            {/* User avatars */}
            {activeUsers.length > 0 ? (
              <div className="flex items-center">
                {displayedUsers.map((user, index) => (
                  <UserAvatar key={user.id} user={user} index={index} />
                ))}
                {remainingCount > 0 && (
                  <div
                    className="relative -ml-2 h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                    style={{ zIndex: 10 - maxAvatars }}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}

            {/* Editor count badge */}
            {otherEditorsCount > 0 && (
              <span className="text-xs font-medium text-warning-foreground">
                {otherEditorsCount} editing
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="whitespace-pre-line">
          <p>{getTooltipContent()}</p>
          {!isConnected && (
            <p className="text-muted-foreground text-xs mt-1">
              Reconnecting...
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
