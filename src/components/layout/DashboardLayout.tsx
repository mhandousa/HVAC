import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Thermometer,
  LayoutDashboard,
  FolderKanban,
  Box,
  Activity,
  Calculator,
  Wrench,
  CalendarClock,
  ClipboardCheck,
  Zap,
  FileText,
  FileBarChart,
  FileSignature,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Building2,
  Users,
  Receipt,
  AlertTriangle,
  BarChart3,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Equipment', href: '/equipment', icon: Box },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Invoicing', href: '/invoicing', icon: Receipt },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Design Tools', href: '/design', icon: Calculator },
  { name: 'Field Service', href: '/service', icon: Wrench },
  { name: 'Service Contracts', href: '/service/contracts', icon: FileSignature },
  { name: 'Maintenance', href: '/maintenance', icon: CalendarClock },
  { name: 'Commissioning', href: '/commissioning', icon: ClipboardCheck },
  { name: 'Deficiencies', href: '/deficiencies', icon: AlertTriangle },
  { name: 'Tech Workload', href: '/technician-workload', icon: BarChart3 },
  { name: 'Energy', href: '/energy', icon: Zap },
  { name: 'Energy Meters', href: '/monitoring/meters', icon: Gauge },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
];

function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-14 items-center gap-3 px-4">
          <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center shadow-glow shrink-0">
            <Thermometer className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className={cn(
            "text-lg font-semibold text-sidebar-foreground transition-opacity duration-200",
            isCollapsed && "opacity-0"
          )}>
            HVACPro AI
          </span>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                    >
                      <Link to={item.href}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Organization selector */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="My Organization">
              <Building2 className="w-5 h-5" />
              <span className="flex-1 truncate">My Organization</span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail for drag-to-resize */}
      <SidebarRail />
    </Sidebar>
  );
}

function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Sidebar trigger - visible on all screens */}
        <SidebarTrigger aria-label="Toggle sidebar" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" aria-label="View notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" aria-hidden="true" />
            <span className="sr-only">You have unread notifications</span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" asChild aria-label="Open settings">
            <Link to="/settings">
              <Settings className="w-5 h-5" />
            </Link>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          
          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
