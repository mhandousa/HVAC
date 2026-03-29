-- Add acoustic tracking columns to design_completeness_snapshots
ALTER TABLE public.design_completeness_snapshots
ADD COLUMN IF NOT EXISTS zones_with_acoustic integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS acoustic_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS zones_passing_nc integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS nc_compliance_percent integer DEFAULT 0;

-- Add acoustic to building snapshots
ALTER TABLE public.design_completeness_building_snapshots
ADD COLUMN IF NOT EXISTS zones_with_acoustic integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS zones_passing_nc integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.design_completeness_snapshots.zones_with_acoustic IS 'Number of zones with acoustic calculations';
COMMENT ON COLUMN public.design_completeness_snapshots.acoustic_percent IS 'Percentage of zones with acoustic analysis (0-100)';
COMMENT ON COLUMN public.design_completeness_snapshots.zones_passing_nc IS 'Number of zones meeting NC targets';
COMMENT ON COLUMN public.design_completeness_snapshots.nc_compliance_percent IS 'Percentage of analyzed zones meeting NC targets (0-100)';