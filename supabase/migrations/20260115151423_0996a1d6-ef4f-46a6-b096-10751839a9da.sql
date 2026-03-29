-- Add zone_id column to pipe_segments for load calculation traceability
ALTER TABLE public.pipe_segments
ADD COLUMN zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL;

-- Add index for efficient zone lookups
CREATE INDEX idx_pipe_segments_zone_id ON public.pipe_segments(zone_id);

-- Add comment for documentation
COMMENT ON COLUMN public.pipe_segments.zone_id IS 'Links pipe segment to a zone for load calculation traceability';