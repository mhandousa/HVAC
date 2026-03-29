import React from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface NotificationLog {
  id: string;
  zone_name: string | null;
  notification_type: 'initial' | 'overdue' | 'urgent';
  recipient_email: string;
  recipient_name: string | null;
  days_pending: number | null;
  sent_at: string;
}

interface NotificationHistoryTableProps {
  notifications: NotificationLog[];
  isLoading?: boolean;
}

export function NotificationHistoryTable({ notifications, isLoading }: NotificationHistoryTableProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Urgent
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Reminder
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading notification history...
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mb-2 opacity-50" />
        <p>No notifications sent yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zone</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Days Pending</TableHead>
            <TableHead>Sent At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow key={notification.id}>
              <TableCell className="font-medium">
                {notification.zone_name || 'Unknown Zone'}
              </TableCell>
              <TableCell>{getTypeBadge(notification.notification_type)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{notification.recipient_name || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">{notification.recipient_email}</span>
                </div>
              </TableCell>
              <TableCell>
                {notification.days_pending !== null ? `${notification.days_pending} days` : '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(notification.sent_at), 'MMM d, yyyy HH:mm')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
