import { useEffect, useState } from 'react'
import { Database, Search, ListFilter as Filter } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { formatNumber } from '@/lib/formatters'
import { EQUIPMENT_CATEGORIES } from '@/lib/constants'
import type { EquipmentCatalog } from '@/types'

export function EquipmentLibraryPage() {
  const [equipment, setEquipment] = useState<EquipmentCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    loadEquipment()
  }, [category])

  async function loadEquipment() {
    setLoading(true)
    let query = supabase
      .from('equipment_catalog')
      .select('*')
      .eq('is_active', true)
      .order('manufacturer')
      .limit(50)

    if (category) {
      query = query.eq('equipment_category', category)
    }

    const { data } = await query
    if (data) setEquipment(data)
    setLoading(false)
  }

  const filtered = search
    ? equipment.filter(
        (e) =>
          e.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
          e.model_number.toLowerCase().includes(search.toLowerCase()) ||
          e.equipment_category.toLowerCase().includes(search.toLowerCase()),
      )
    : equipment

  return (
    <div>
      <Header title="Equipment Library" description="Browse and search the HVAC equipment catalog" />

      <div className="p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by manufacturer, model, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-10 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-sm text-zinc-300 focus:border-sky-500/50 focus:outline-none"
            >
              <option value="">All Categories</option>
              {EQUIPMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Database className="h-12 w-12 text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-500">
              {search ? 'No equipment matches your search' : 'No equipment in catalog'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Card key={item.id} className="transition-all hover:border-zinc-700/80">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        {item.manufacturer}
                      </p>
                      <h3 className="mt-1 font-semibold text-zinc-100">{item.model_number}</h3>
                    </div>
                    <Badge>{item.equipment_category}</Badge>
                  </div>

                  {item.equipment_subcategory && (
                    <p className="mt-1 text-xs text-zinc-500">{item.equipment_subcategory}</p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {item.cooling_capacity_tons != null && (
                      <div className="rounded bg-zinc-800/50 px-2.5 py-1.5">
                        <p className="text-[10px] uppercase text-zinc-500">Cooling</p>
                        <p className="text-sm font-medium text-zinc-200">{item.cooling_capacity_tons} tons</p>
                      </div>
                    )}
                    {item.heating_capacity_kw != null && (
                      <div className="rounded bg-zinc-800/50 px-2.5 py-1.5">
                        <p className="text-[10px] uppercase text-zinc-500">Heating</p>
                        <p className="text-sm font-medium text-zinc-200">{item.heating_capacity_kw} kW</p>
                      </div>
                    )}
                    {item.seer != null && (
                      <div className="rounded bg-zinc-800/50 px-2.5 py-1.5">
                        <p className="text-[10px] uppercase text-zinc-500">SEER</p>
                        <p className="text-sm font-medium text-zinc-200">{item.seer}</p>
                      </div>
                    )}
                    {item.cop != null && (
                      <div className="rounded bg-zinc-800/50 px-2.5 py-1.5">
                        <p className="text-[10px] uppercase text-zinc-500">COP</p>
                        <p className="text-sm font-medium text-zinc-200">{item.cop}</p>
                      </div>
                    )}
                    {item.power_input_kw != null && (
                      <div className="rounded bg-zinc-800/50 px-2.5 py-1.5">
                        <p className="text-[10px] uppercase text-zinc-500">Power</p>
                        <p className="text-sm font-medium text-zinc-200">{item.power_input_kw} kW</p>
                      </div>
                    )}
                    {item.voltage && (
                      <div className="rounded bg-zinc-800/50 px-2.5 py-1.5">
                        <p className="text-[10px] uppercase text-zinc-500">Voltage</p>
                        <p className="text-sm font-medium text-zinc-200">{item.voltage}</p>
                      </div>
                    )}
                  </div>

                  {item.list_price_sar != null && (
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-800/60 pt-3">
                      <span className="text-xs text-zinc-500">List Price</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        SAR {formatNumber(item.list_price_sar)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
