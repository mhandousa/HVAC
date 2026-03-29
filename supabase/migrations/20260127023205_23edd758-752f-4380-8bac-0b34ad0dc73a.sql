-- Add Phase 18 specialized tools tracking to design_completeness_snapshots
ALTER TABLE public.design_completeness_snapshots
ADD COLUMN IF NOT EXISTS has_economizer_selections BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_control_valve_selections BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_expansion_tank_selections BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_silencer_selections BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_vibration_isolation_selections BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.design_completeness_snapshots.has_economizer_selections IS 'Whether project has economizer selections';
COMMENT ON COLUMN public.design_completeness_snapshots.has_control_valve_selections IS 'Whether project has control valve selections';
COMMENT ON COLUMN public.design_completeness_snapshots.has_expansion_tank_selections IS 'Whether project has expansion tank selections';
COMMENT ON COLUMN public.design_completeness_snapshots.has_silencer_selections IS 'Whether project has silencer selections';
COMMENT ON COLUMN public.design_completeness_snapshots.has_vibration_isolation_selections IS 'Whether project has vibration isolation selections';