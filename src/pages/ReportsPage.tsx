import { useEffect, useState } from 'react'
import { ChartBar as FileBarChart, Download, FolderKanban } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { formatDate, formatTons, formatBTU, formatCFM, formatArea } from '@/lib/formatters'
import type { Project, LoadCalculation } from '@/types'

export function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [calculations, setCalculations] = useState<LoadCalculation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setProjects(data)
      setLoading(false)
    }
    load()
  }, [])

  async function selectProject(project: Project) {
    setSelectedProject(project)
    const { data } = await supabase
      .from('load_calculations')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    if (data) setCalculations(data)
  }

  function exportCSV() {
    if (!selectedProject || calculations.length === 0) return
    const headers = ['Name', 'Building Type', 'Area (sq ft)', 'Cooling (tons)', 'Heating (BTU/h)', 'CFM', 'Status']
    const rows = calculations.map((c) => [
      c.calculation_name,
      c.building_type || '',
      c.area_sqft,
      c.cooling_load_tons || '',
      c.cooling_load_btuh || '',
      c.cfm_required || '',
      c.status || '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedProject.name}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Header title="Reports" description="View and export project reports" />

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <h3 className="mb-3 text-sm font-medium text-zinc-400">Select a Project</h3>
              {projects.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <FolderKanban className="h-10 w-10 text-zinc-700" />
                  <p className="mt-3 text-sm text-zinc-500">No projects available</p>
                </div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProject(p)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedProject?.id === p.id
                        ? 'border-sky-500/50 bg-sky-500/5'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {p.client_name || 'No client'} &middot; {formatDate(p.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="lg:col-span-2">
              {selectedProject ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-100">{selectedProject.name}</h2>
                      <p className="text-sm text-zinc-400">
                        {selectedProject.location || 'No location'} &middot; {selectedProject.building_type || 'Unknown type'}
                      </p>
                    </div>
                    {calculations.length > 0 && (
                      <Button variant="outline" size="sm" onClick={exportCSV}>
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    )}
                  </div>

                  {calculations.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileBarChart className="mx-auto h-10 w-10 text-zinc-700" />
                        <p className="mt-3 text-sm text-zinc-500">No calculations linked to this project</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {calculations.map((calc) => (
                        <Card key={calc.id}>
                          <CardHeader>
                            <h3 className="font-medium text-zinc-200">{calc.calculation_name}</h3>
                            <p className="text-xs text-zinc-500">
                              {calc.building_type} &middot; {formatArea(calc.area_sqft)}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-[10px] uppercase text-zinc-500">Cooling</p>
                                <p className="text-sm font-semibold text-zinc-200">{formatTons(calc.cooling_load_tons)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-zinc-500">Cooling BTU/h</p>
                                <p className="text-sm font-semibold text-zinc-200">{formatBTU(calc.cooling_load_btuh)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-zinc-500">Heating</p>
                                <p className="text-sm font-semibold text-zinc-200">{formatBTU(calc.heating_load_btuh)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-zinc-500">Airflow</p>
                                <p className="text-sm font-semibold text-zinc-200">{formatCFM(calc.cfm_required)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileBarChart className="h-12 w-12 text-zinc-700" />
                  <p className="mt-4 text-sm text-zinc-500">Select a project to view its report</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
