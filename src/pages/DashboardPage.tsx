import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Calculator, Database, FileBarChart, Plus, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/formatters'
import { STATUS_COLORS } from '@/lib/constants'
import type { Project } from '@/types'

export function DashboardPage() {
  const [stats, setStats] = useState({ projects: 0, calculations: 0, equipment: 0, reports: 0 })
  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  useEffect(() => {
    async function load() {
      const [projects, calculations, equipment] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('load_calculations').select('*', { count: 'exact', head: true }),
        supabase.from('equipment_catalog').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        projects: projects.count ?? 0,
        calculations: calculations.count ?? 0,
        equipment: equipment.count ?? 0,
        reports: 0,
      })

      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) setRecentProjects(data)
    }
    load()
  }, [])

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your HVAC projects and calculations"
        actions={
          <Link to="/projects">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        }
      />

      <div className="space-y-8 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Projects" value={stats.projects} icon={FolderKanban} accent="text-sky-400" />
          <StatsCard title="Calculations" value={stats.calculations} icon={Calculator} accent="text-teal-400" />
          <StatsCard title="Equipment" value={stats.equipment} icon={Database} accent="text-amber-400" />
          <StatsCard title="Reports" value={stats.reports} icon={FileBarChart} accent="text-emerald-400" />
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-100">Recent Projects</h2>
            <Link to="/projects" className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderKanban className="mx-auto h-10 w-10 text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500">No projects yet</p>
              <Link to="/projects">
                <Button variant="outline" size="sm" className="mt-4">
                  Create your first project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects`}
                  className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-zinc-800/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{project.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {project.client_name || 'No client'} &middot; {project.location || 'No location'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_COLORS[project.status]}>{project.status}</Badge>
                    <span className="text-xs text-zinc-600">{formatDate(project.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/calculations"
            className="group flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition-all hover:border-sky-500/30 hover:bg-sky-500/5"
          >
            <div className="rounded-lg bg-sky-500/10 p-3 text-sky-400 transition-colors group-hover:bg-sky-500/20">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">New Calculation</p>
              <p className="text-xs text-zinc-500">Run HVAC load analysis</p>
            </div>
          </Link>
          <Link
            to="/equipment"
            className="group flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition-all hover:border-teal-500/30 hover:bg-teal-500/5"
          >
            <div className="rounded-lg bg-teal-500/10 p-3 text-teal-400 transition-colors group-hover:bg-teal-500/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">Browse Equipment</p>
              <p className="text-xs text-zinc-500">Search the catalog</p>
            </div>
          </Link>
          <Link
            to="/reports"
            className="group flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5"
          >
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
              <FileBarChart className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-zinc-200">Generate Report</p>
              <p className="text-xs text-zinc-500">Export project data</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
