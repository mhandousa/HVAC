-- Add boiler selection tracking columns
ALTER TABLE design_completeness_snapshots 
ADD COLUMN IF NOT EXISTS boiler_selection_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS boiler_total_capacity_mbh numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS boiler_avg_afue numeric DEFAULT 0;

-- Add chiller selection tracking columns
ALTER TABLE design_completeness_snapshots 
ADD COLUMN IF NOT EXISTS chiller_selection_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS chiller_total_capacity_tons numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS chiller_avg_iplv numeric DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN design_completeness_snapshots.boiler_selection_count IS 'Number of boiler selections in project';
COMMENT ON COLUMN design_completeness_snapshots.boiler_total_capacity_mbh IS 'Total boiler capacity in MBH';
COMMENT ON COLUMN design_completeness_snapshots.boiler_avg_afue IS 'Average AFUE across all boilers';
COMMENT ON COLUMN design_completeness_snapshots.chiller_selection_count IS 'Number of chiller selections in project';
COMMENT ON COLUMN design_completeness_snapshots.chiller_total_capacity_tons IS 'Total chiller capacity in tons';
COMMENT ON COLUMN design_completeness_snapshots.chiller_avg_iplv IS 'Average IPLV across all chillers';