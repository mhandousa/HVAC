import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  History, 
  Settings, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { useVerificationReminders } from '@/hooks/useVerificationReminders';
import { NotificationHistoryTable } from './NotificationHistoryTable';

interface VerificationNotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export function VerificationNotificationSettings({
  open,
  onOpenChange,
  projectId,
}: VerificationNotificationSettingsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    sendReminders, 
    isSending, 
    notificationHistory, 
    isLoadingHistory,
    refetchHistory,
    stats 
  } = useVerificationReminders(projectId);

  const handleSendReminders = async (forceResend = false) => {
    await sendReminders({ forceResend });
    refetchHistory();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verification Reminder Notifications
          </DialogTitle>
          <DialogDescription>
            Manage email notifications for zones pending acoustic verification after remediation treatments.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2">
              <Send className="h-4 w-4" />
              Send Now
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4 overflow-auto flex-1">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Initial Reminders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.byType.initial}</div>
                  <p className="text-xs text-muted-foreground">3+ days pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Overdue Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{stats.byType.overdue}</div>
                  <p className="text-xs text-muted-foreground">7+ days pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Urgent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.byType.urgent}</div>
                  <p className="text-xs text-muted-foreground">14+ days pending</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notification Schedule</CardTitle>
                <CardDescription>
                  Automated email reminders are sent based on how long zones have been pending verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      3 Days
                    </Badge>
                    <span className="text-sm">Initial reminder sent to assigned technicians</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                      <AlertTriangle className="h-3 w-3" />
                      7 Days
                    </Badge>
                    <span className="text-sm">Overdue warning sent to managers and engineers</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      14 Days
                    </Badge>
                    <span className="text-sm">Urgent escalation sent to all stakeholders including admins</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send" className="mt-4 space-y-4 overflow-auto flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Send Verification Reminders</CardTitle>
                <CardDescription>
                  Manually trigger reminder emails for all pending zones. The system will automatically 
                  skip zones that have already received notifications in the last 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => handleSendReminders(false)} 
                    disabled={isSending}
                    className="flex-1"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reminders (Skip Recent)
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleSendReminders(true)} 
                    disabled={isSending}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Force Resend All
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">What happens when you click send:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All zones pending verification for 3+ days will be included</li>
                    <li>Recipients are determined by the notification urgency level</li>
                    <li>Emails are grouped by organization to reduce inbox clutter</li>
                    <li>A log entry is created for each notification sent</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4 overflow-auto flex-1">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notification History</CardTitle>
                  <CardDescription>
                    Recent verification reminder emails sent from this project.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <NotificationHistoryTable 
                  notifications={notificationHistory || []} 
                  isLoading={isLoadingHistory}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
