import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Calculator,
  Database,
  FileBarChart,
  Settings,
  Wind,
  LogOut,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/calculations', label: 'Load Calculations', icon: Calculator },
  { to: '/equipment', label: 'Equipment Library', icon: Database },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { signOut, profile } = useAuth()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-zinc-800/80 bg-zinc-950">
      <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800/80 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
          <Wind className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-zinc-100">
          HVACPro <span className="text-sky-400">AI</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sky-600/10 text-sky-400'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-800/80 p-3">
        <div className="mb-3 flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">
              {profile?.full_name || 'User'}
            </p>
            <p className="truncate text-xs text-zinc-500">{profile?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
