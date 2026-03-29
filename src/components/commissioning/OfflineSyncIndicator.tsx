import { useOfflinePhotoQueue } from "@/hooks/useOfflinePhotoQueue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineSyncIndicatorProps {
  className?: string;
}

export function OfflineSyncIndicator({ className }: OfflineSyncIndicatorProps) {
  const {
    isOnline,
    pendingCount,
    isSyncing,
    syncProgress,
    syncPendingPhotos,
  } = useOfflinePhotoQueue();

  // Don't show anything if online and no pending
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (!isOnline) {
      return <CloudOff className="h-4 w-4" />;
    }
    if (pendingCount > 0) {
      return <Upload className="h-4 w-4" />;
    }
    return <Check className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isSyncing) {
      return `Syncing ${syncProgress.current}/${syncProgress.total}`;
    }
    if (!isOnline) {
      return `Offline (${pendingCount} pending)`;
    }
    if (pendingCount > 0) {
      return `${pendingCount} to sync`;
    }
    return "Synced";
  };

  const getStatusColor = () => {
    if (isSyncing) return "bg-blue-100 text-blue-800 border-blue-300";
    if (!isOnline) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (pendingCount > 0) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "cursor-pointer gap-1.5 px-2 py-1",
            getStatusColor(),
            className
          )}
        >
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Cloud className="h-5 w-5 text-green-600" />
            ) : (
              <CloudOff className="h-5 w-5 text-yellow-600" />
            )}
            <div>
              <p className="font-medium">
                {isOnline ? "Online" : "Offline"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? "Connected to network"
                  : "Photos will sync when online"}
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pending Photos
                </span>
                <Badge variant="secondary">{pendingCount}</Badge>
              </div>

              {isSyncing && (
                <div className="space-y-1">
                  <Progress
                    value={(syncProgress.current / syncProgress.total) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Uploading {syncProgress.current} of {syncProgress.total}
                  </p>
                </div>
              )}

              {!isSyncing && isOnline && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => syncPendingPhotos()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              )}

              {!isOnline && (
                <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Photos are stored locally and will upload when you're back online.</span>
                </div>
              )}
            </div>
          )}

          {pendingCount === 0 && !isSyncing && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              <Check className="h-4 w-4" />
              <span>All photos are synced</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
