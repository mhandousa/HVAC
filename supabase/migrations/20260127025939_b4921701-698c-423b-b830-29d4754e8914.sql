-- Add 8 new boolean columns for remaining specialized tools
ALTER TABLE public.design_completeness_snapshots
ADD COLUMN IF NOT EXISTS has_ahu_configurations boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_fan_selections boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pump_selections boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_insulation_calculations boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sequence_of_operations boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_coil_selections boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_filter_selections boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_cooling_tower_selections boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.design_completeness_snapshots.has_ahu_configurations IS 'AHU Configuration tool completion status';
COMMENT ON COLUMN public.design_completeness_snapshots.has_fan_selections IS 'Fan Selection tool completion status';
COMMENT ON COLUMN public.design_completeness_snapshots.has_pump_selections IS 'Pump Selection tool completion status';
COMMENT ON COLUMN public.design_completeness_snapshots.has_insulation_calculations IS 'Insulation Calculation tool completion status';
COMMENT ON COLUMN public.design_completeness_snapshots.has_sequence_of_operations IS 'Sequence of Operations tool completion status';
COMMENT ON COLUMN public.design_completeness_snapshots.has_coil_selections IS 'Coil Selection tool completion status';
COMMENT ON COLUMN public.design_completeness_snapshots.has_filter_selections IS 'Filter Selection tool completion status';
COMMENT ON COLUMN public.design_completeness_snapshots.has_cooling_tower_selections IS 'Cooling Tower Selection tool completion status';