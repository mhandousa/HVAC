import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProjects } from '@/hooks/useProjects';
import { useGlobalPresence } from '@/hooks/useGlobalPresence';
import { useRecentDesignActivity } from '@/hooks/useRecentDesignActivity';
import { ActiveUsersPanel } from '@/components/collaboration/ActiveUsersPanel';
import { ActivityTimeline } from '@/components/collaboration/ActivityTimeline';
import { ConflictCenter } from '@/components/collaboration/ConflictCenter';
import { ToolActivityCard } from '@/components/collaboration/ToolActivityCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CollaborationDashboard() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { activeUsers, isConnected, usersByTool, editingUsersCount } = useGlobalPresence({
    projectId: selectedProjectId,
  });

  const { activities, isLoading: activitiesLoading, refetch: refetchActivity } = useRecentDesignActivity({
    projectId: selectedProjectId || undefined,
    limit: 50,
  });

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value === 'all' ? null : value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Collaboration Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time visibility into team activity across design tools
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  {selectedProjectId ? 'Connecting...' : 'Select a project'}
                </>
              )}
            </Badge>

            {/* Refresh Button */}
            <Button variant="outline" size="sm" onClick={() => refetchActivity()}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Project Selector */}
            <Select
              value={selectedProjectId || 'all'}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{activeUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Currently Editing</p>
                  <p className="text-2xl font-bold">{editingUsersCount}</p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  ✏️
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tools in Use</p>
                  <p className="text-2xl font-bold">{usersByTool.size}</p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  🛠️
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conflict Center (only shows if conflicts exist) */}
        <ConflictCenter usersByTool={usersByTool} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Users Panel */}
          <div className="lg:col-span-1">
            <ActiveUsersPanel users={activeUsers} isConnected={isConnected} />
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-2">
            <ActivityTimeline activities={activities} isLoading={activitiesLoading} />
          </div>
        </div>

        {/* Tool Activity Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tool Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ToolActivityCard usersByTool={usersByTool} />
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/design/approvals">Approval Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/design/health">Design Health</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/design/completeness">Completeness Tracker</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/design">All Design Tools</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
