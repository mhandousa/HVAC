-- Add Chilled Water Plant column to design completeness snapshots
ALTER TABLE design_completeness_snapshots 
ADD COLUMN IF NOT EXISTS has_chw_plant boolean DEFAULT false;