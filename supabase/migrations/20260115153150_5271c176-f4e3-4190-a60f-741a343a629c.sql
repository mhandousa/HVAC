-- Add zone_id column to duct_segments for load calculation traceability
ALTER TABLE public.duct_segments
ADD COLUMN zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL;

-- Add index for efficient zone lookups
CREATE INDEX idx_duct_segments_zone_id ON public.duct_segments(zone_id);

-- Add comment for documentation
COMMENT ON COLUMN public.duct_segments.zone_id IS 'Links duct segment to a zone for load calculation traceability';