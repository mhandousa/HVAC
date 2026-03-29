import { useEffect, useState, type FormEvent } from 'react'
import { Plus, FolderKanban, MapPin, Building2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/formatters'
import { STATUS_COLORS, BUILDING_TYPES } from '@/lib/constants'
import type { Project } from '@/types'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', client_name: '', location: '', building_type: '', description: '' })

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProjects(data)
    setLoading(false)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('projects').insert({
      name: form.name,
      client_name: form.client_name || null,
      location: form.location || null,
      building_type: form.building_type || null,
      description: form.description || null,
    })
    setShowCreate(false)
    setForm({ name: '', client_name: '', location: '', building_type: '', description: '' })
    setSaving(false)
    loadProjects()
  }

  return (
    <div>
      <Header
        title="Projects"
        description="Manage your HVAC design projects"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderKanban className="h-12 w-12 text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-500">No projects yet</p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition-all hover:border-zinc-700/80"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-zinc-100 group-hover:text-sky-400 transition-colors">
                    {project.name}
                  </h3>
                  <Badge variant={STATUS_COLORS[project.status]}>{project.status}</Badge>
                </div>
                {project.description && (
                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{project.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  {project.client_name && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {project.client_name}
                    </span>
                  )}
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-3">
                  <span className="text-xs text-zinc-600">{formatDate(project.created_at)}</span>
                  {project.building_type && (
                    <span className="text-xs text-zinc-500">{project.building_type}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Project name"
            placeholder="Office Tower HVAC Design"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="client"
            label="Client name"
            placeholder="Acme Corp"
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          />
          <Input
            id="location"
            label="Location"
            placeholder="Riyadh, Saudi Arabia"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Select
            id="building_type"
            label="Building type"
            value={form.building_type}
            onChange={(e) => setForm({ ...form, building_type: e.target.value })}
            options={[
              { value: '', label: 'Select type...' },
              ...BUILDING_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
