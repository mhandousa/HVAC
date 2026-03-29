import { useEffect, useState, type FormEvent } from 'react'
import { Calculator, Plus, Thermometer, Wind, Zap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { formatBTU, formatTons, formatCFM, formatArea, formatDate } from '@/lib/formatters'
import { BUILDING_TYPES, STATUS_COLORS } from '@/lib/constants'
import type { LoadCalculation } from '@/types'

const defaultForm = {
  calculation_name: '',
  building_type: 'Office',
  area_sqft: '',
  ceiling_height_ft: '10',
  occupant_count: '',
  lighting_power_density: '1.0',
  equipment_power_density: '1.5',
  wall_r_value: '13',
  roof_r_value: '30',
  window_u_factor: '0.35',
  window_shgc: '0.25',
  window_to_wall_ratio: '0.4',
  outdoor_temp_summer_f: '115',
  outdoor_temp_winter_f: '45',
  indoor_temp_summer_f: '75',
  indoor_temp_winter_f: '70',
}

function computeLoads(f: typeof defaultForm) {
  const area = parseFloat(f.area_sqft) || 0
  const height = parseFloat(f.ceiling_height_ft) || 10
  const volume = area * height
  const occupants = parseInt(f.occupant_count) || Math.ceil(area / 150)
  const lpd = parseFloat(f.lighting_power_density) || 1.0
  const epd = parseFloat(f.equipment_power_density) || 1.5
  const wallR = parseFloat(f.wall_r_value) || 13
  const roofR = parseFloat(f.roof_r_value) || 30
  const winU = parseFloat(f.window_u_factor) || 0.35
  const wwr = parseFloat(f.window_to_wall_ratio) || 0.4
  const shgc = parseFloat(f.window_shgc) || 0.25
  const outdoorSummer = parseFloat(f.outdoor_temp_summer_f) || 115
  const indoorSummer = parseFloat(f.indoor_temp_summer_f) || 75
  const outdoorWinter = parseFloat(f.outdoor_temp_winter_f) || 45
  const indoorWinter = parseFloat(f.indoor_temp_winter_f) || 70
  const dtCool = outdoorSummer - indoorSummer
  const dtHeat = indoorWinter - outdoorWinter

  const perimeter = 4 * Math.sqrt(area)
  const wallArea = perimeter * height
  const windowArea = wallArea * wwr
  const opaqueWallArea = wallArea - windowArea

  const wallLoad = (opaqueWallArea / wallR) * dtCool
  const roofLoad = (area / roofR) * dtCool
  const windowConduction = windowArea * winU * dtCool
  const solarGain = windowArea * shgc * 200
  const peopleLoad = occupants * 450
  const lightingLoad = area * lpd * 3.412
  const equipLoad = area * epd * 3.412
  const ventilationLoad = occupants * 20 * 1.08 * dtCool

  const coolingBtuh = Math.round(wallLoad + roofLoad + windowConduction + solarGain + peopleLoad + lightingLoad + equipLoad + ventilationLoad)
  const heatingBtuh = Math.round(((opaqueWallArea / wallR) + (area / roofR) + (windowArea * winU)) * dtHeat + occupants * 20 * 1.08 * dtHeat)
  const coolingTons = +(coolingBtuh / 12000).toFixed(2)
  const cfm = Math.round(coolingBtuh / (1.08 * 20))

  return { coolingBtuh, heatingBtuh, coolingTons, cfm, volume, occupants }
}

export function LoadCalculationsPage() {
  const [calcs, setCalcs] = useState<LoadCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const results = computeLoads(form)

  useEffect(() => {
    loadCalcs()
  }, [])

  async function loadCalcs() {
    setLoading(true)
    const { data } = await supabase
      .from('load_calculations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setCalcs(data)
    setLoading(false)
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = computeLoads(form)
    await supabase.from('load_calculations').insert({
      calculation_name: form.calculation_name,
      building_type: form.building_type,
      area_sqft: parseFloat(form.area_sqft) || 0,
      ceiling_height_ft: parseFloat(form.ceiling_height_ft) || 10,
      occupant_count: r.occupants,
      lighting_power_density: parseFloat(form.lighting_power_density),
      equipment_power_density: parseFloat(form.equipment_power_density),
      wall_r_value: parseFloat(form.wall_r_value),
      roof_r_value: parseFloat(form.roof_r_value),
      window_u_factor: parseFloat(form.window_u_factor),
      window_shgc: parseFloat(form.window_shgc),
      window_to_wall_ratio: parseFloat(form.window_to_wall_ratio),
      outdoor_temp_summer_f: parseFloat(form.outdoor_temp_summer_f),
      outdoor_temp_winter_f: parseFloat(form.outdoor_temp_winter_f),
      indoor_temp_summer_f: parseFloat(form.indoor_temp_summer_f),
      indoor_temp_winter_f: parseFloat(form.indoor_temp_winter_f),
      cooling_load_btuh: r.coolingBtuh,
      heating_load_btuh: r.heatingBtuh,
      cooling_load_tons: r.coolingTons,
      cfm_required: r.cfm,
      status: 'completed',
    })
    setShowCreate(false)
    setForm(defaultForm)
    setSaving(false)
    loadCalcs()
  }

  return (
    <div>
      <Header
        title="Load Calculations"
        description="HVAC heating and cooling load analysis"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Calculation
          </Button>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-500" />
          </div>
        ) : calcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Calculator className="h-12 w-12 text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-500">No calculations yet</p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Run your first calculation
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {calcs.map((calc) => (
              <Card key={calc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-zinc-100">{calc.calculation_name}</h3>
                    <Badge variant={STATUS_COLORS[calc.status || 'draft']}>{calc.status || 'draft'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {calc.building_type} &middot; {formatArea(calc.area_sqft)} &middot; {formatDate(calc.created_at)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-zinc-800/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Thermometer className="h-3 w-3 text-orange-400" />
                        Cooling
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-200">{formatTons(calc.cooling_load_tons)}</p>
                      <p className="text-xs text-zinc-500">{formatBTU(calc.cooling_load_btuh)}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Zap className="h-3 w-3 text-sky-400" />
                        Heating
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-200">{formatBTU(calc.heating_load_btuh)}</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-zinc-800/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Wind className="h-3 w-3 text-teal-400" />
                        Airflow Required
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-200">{formatCFM(calc.cfm_required)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Load Calculation" className="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                id="calc_name"
                label="Calculation name"
                placeholder="Main Office Floor 3"
                value={form.calculation_name}
                onChange={(e) => updateForm('calculation_name', e.target.value)}
                required
              />
            </div>
            <Select
              id="building_type"
              label="Building type"
              value={form.building_type}
              onChange={(e) => updateForm('building_type', e.target.value)}
              options={BUILDING_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <Input id="area" label="Area (sq ft)" type="number" value={form.area_sqft} onChange={(e) => updateForm('area_sqft', e.target.value)} required />
            <Input id="height" label="Ceiling height (ft)" type="number" value={form.ceiling_height_ft} onChange={(e) => updateForm('ceiling_height_ft', e.target.value)} />
            <Input id="occupants" label="Occupants" type="number" placeholder="Auto-calculated" value={form.occupant_count} onChange={(e) => updateForm('occupant_count', e.target.value)} />
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-zinc-300">Building Envelope</h4>
            <div className="grid grid-cols-3 gap-3">
              <Input id="wallR" label="Wall R-value" type="number" step="0.1" value={form.wall_r_value} onChange={(e) => updateForm('wall_r_value', e.target.value)} />
              <Input id="roofR" label="Roof R-value" type="number" step="0.1" value={form.roof_r_value} onChange={(e) => updateForm('roof_r_value', e.target.value)} />
              <Input id="winU" label="Window U-factor" type="number" step="0.01" value={form.window_u_factor} onChange={(e) => updateForm('window_u_factor', e.target.value)} />
              <Input id="shgc" label="Window SHGC" type="number" step="0.01" value={form.window_shgc} onChange={(e) => updateForm('window_shgc', e.target.value)} />
              <Input id="wwr" label="Window-wall ratio" type="number" step="0.01" value={form.window_to_wall_ratio} onChange={(e) => updateForm('window_to_wall_ratio', e.target.value)} />
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-zinc-300">Design Conditions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Input id="outdoorS" label="Outdoor summer (F)" type="number" value={form.outdoor_temp_summer_f} onChange={(e) => updateForm('outdoor_temp_summer_f', e.target.value)} />
              <Input id="outdoorW" label="Outdoor winter (F)" type="number" value={form.outdoor_temp_winter_f} onChange={(e) => updateForm('outdoor_temp_winter_f', e.target.value)} />
              <Input id="indoorS" label="Indoor summer (F)" type="number" value={form.indoor_temp_summer_f} onChange={(e) => updateForm('indoor_temp_summer_f', e.target.value)} />
              <Input id="indoorW" label="Indoor winter (F)" type="number" value={form.indoor_temp_winter_f} onChange={(e) => updateForm('indoor_temp_winter_f', e.target.value)} />
            </div>
          </div>

          {parseFloat(form.area_sqft) > 0 && (
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
              <h4 className="text-sm font-medium text-sky-300">Live Results</h4>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-400">Cooling Load:</span>
                  <span className="ml-2 font-semibold text-zinc-100">{formatTons(results.coolingTons)}</span>
                  <span className="ml-1 text-xs text-zinc-500">({formatBTU(results.coolingBtuh)})</span>
                </div>
                <div>
                  <span className="text-zinc-400">Heating Load:</span>
                  <span className="ml-2 font-semibold text-zinc-100">{formatBTU(results.heatingBtuh)}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Airflow:</span>
                  <span className="ml-2 font-semibold text-zinc-100">{formatCFM(results.cfm)}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Occupants:</span>
                  <span className="ml-2 font-semibold text-zinc-100">{results.occupants}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Calculation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
