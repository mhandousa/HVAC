-- Create pipe_fittings_library table for K-factors
CREATE TABLE public.pipe_fittings_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fitting_code VARCHAR(50) NOT NULL UNIQUE,
  fitting_name VARCHAR(100) NOT NULL,
  fitting_category VARCHAR(50) NOT NULL, -- elbow, tee, valve, reducer, strainer, equipment
  pipe_material VARCHAR(50), -- steel, copper, pvc, cpvc, pex, or null for all
  nominal_size_range VARCHAR(50), -- e.g., "0.5-12" or null for all sizes
  k_factor NUMERIC NOT NULL, -- Loss coefficient
  equivalent_length_factor NUMERIC, -- L/D ratio alternative
  description TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipe_fittings_library ENABLE ROW LEVEL SECURITY;

-- Public read access for fittings library (reference data)
CREATE POLICY "Anyone can view pipe fittings library"
  ON public.pipe_fittings_library FOR SELECT
  USING (true);

-- Add new columns to pipe_segments
ALTER TABLE public.pipe_segments
  ADD COLUMN IF NOT EXISTS from_node VARCHAR(100),
  ADD COLUMN IF NOT EXISTS to_node VARCHAR(100),
  ADD COLUMN IF NOT EXISTS parent_segment_id UUID REFERENCES public.pipe_segments(id),
  ADD COLUMN IF NOT EXISTS material_type VARCHAR(50) DEFAULT 'steel',
  ADD COLUMN IF NOT EXISTS schedule_class VARCHAR(50) DEFAULT 'schedule_40',
  ADD COLUMN IF NOT EXISTS wall_thickness_in NUMERIC,
  ADD COLUMN IF NOT EXISTS is_critical_path BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fluid_type VARCHAR(50) DEFAULT 'chilled_water',
  ADD COLUMN IF NOT EXISTS fluid_temp_f NUMERIC DEFAULT 45,
  ADD COLUMN IF NOT EXISTS elevation_change_ft NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dynamic_loss_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS reynolds_number NUMERIC;

-- Add new columns to pipe_systems
ALTER TABLE public.pipe_systems
  ADD COLUMN IF NOT EXISTS sizing_method VARCHAR(50) DEFAULT 'velocity',
  ADD COLUMN IF NOT EXISTS glycol_percentage NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS design_delta_t_f NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS critical_path_head_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS target_velocity_fps NUMERIC DEFAULT 6;

-- Create pipe_fittings junction table for segment fittings
CREATE TABLE public.pipe_segment_fittings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipe_segment_id UUID NOT NULL REFERENCES public.pipe_segments(id) ON DELETE CASCADE,
  fitting_code VARCHAR(50) NOT NULL,
  fitting_description VARCHAR(200),
  k_factor NUMERIC NOT NULL,
  quantity INTEGER DEFAULT 1,
  head_loss_ft NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on pipe_segment_fittings
ALTER TABLE public.pipe_segment_fittings ENABLE ROW LEVEL SECURITY;

-- RLS policies for pipe_segment_fittings (inherit from pipe_segments via system)
CREATE POLICY "Users can view pipe segment fittings in their org"
  ON public.pipe_segment_fittings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pipe_segments ps
      JOIN pipe_systems p ON ps.pipe_system_id = p.id
      WHERE ps.id = pipe_segment_fittings.pipe_segment_id
        AND p.organization_id = user_org_id()
    )
  );

CREATE POLICY "Users can insert pipe segment fittings in their org"
  ON public.pipe_segment_fittings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pipe_segments ps
      JOIN pipe_systems p ON ps.pipe_system_id = p.id
      WHERE ps.id = pipe_segment_fittings.pipe_segment_id
        AND p.organization_id = user_org_id()
    )
  );

CREATE POLICY "Users can update pipe segment fittings in their org"
  ON public.pipe_segment_fittings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pipe_segments ps
      JOIN pipe_systems p ON ps.pipe_system_id = p.id
      WHERE ps.id = pipe_segment_fittings.pipe_segment_id
        AND p.organization_id = user_org_id()
    )
  );

CREATE POLICY "Users can delete pipe segment fittings in their org"
  ON public.pipe_segment_fittings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pipe_segments ps
      JOIN pipe_systems p ON ps.pipe_system_id = p.id
      WHERE ps.id = pipe_segment_fittings.pipe_segment_id
        AND p.organization_id = user_org_id()
    )
  );

-- Seed pipe fittings library with standard K-factors (ASHRAE/CRANE data)
INSERT INTO public.pipe_fittings_library (fitting_code, fitting_name, fitting_category, k_factor, equivalent_length_factor, description) VALUES
-- Elbows
('EL90-STD', '90° Elbow - Standard', 'elbow', 0.75, 30, 'Standard radius 90° elbow'),
('EL90-LR', '90° Elbow - Long Radius', 'elbow', 0.45, 20, 'Long radius 90° elbow (R/D = 1.5)'),
('EL90-SR', '90° Elbow - Short Radius', 'elbow', 1.50, 50, 'Short radius 90° elbow'),
('EL45-STD', '45° Elbow - Standard', 'elbow', 0.35, 16, 'Standard 45° elbow'),
('EL45-LR', '45° Elbow - Long Radius', 'elbow', 0.20, 10, 'Long radius 45° elbow'),
('EL180', '180° Return Bend', 'elbow', 1.50, 50, 'Close return bend'),

-- Tees
('TEE-THRU', 'Tee - Flow Through Run', 'tee', 0.40, 20, 'Flow through tee run'),
('TEE-BRANCH', 'Tee - Flow Into Branch', 'tee', 1.80, 60, 'Flow dividing into branch'),
('TEE-CONV', 'Tee - Converging Flow', 'tee', 1.20, 40, 'Converging flow from branch'),

-- Reducers
('RED-CON', 'Reducer - Concentric', 'reducer', 0.25, 10, 'Gradual concentric reducer'),
('RED-ECC', 'Reducer - Eccentric', 'reducer', 0.30, 12, 'Eccentric reducer'),
('RED-SUD', 'Sudden Contraction', 'reducer', 0.50, 20, 'Sudden pipe contraction'),
('ENL-SUD', 'Sudden Enlargement', 'reducer', 1.00, 40, 'Sudden pipe enlargement'),

-- Gate Valves
('VLV-GATE-O', 'Gate Valve - Open', 'valve', 0.17, 8, 'Fully open gate valve'),
('VLV-GATE-75', 'Gate Valve - 75% Open', 'valve', 0.90, 35, 'Gate valve 75% open'),
('VLV-GATE-50', 'Gate Valve - 50% Open', 'valve', 4.50, 160, 'Gate valve 50% open'),

-- Globe Valves
('VLV-GLOBE-O', 'Globe Valve - Open', 'valve', 6.00, 340, 'Fully open globe valve'),
('VLV-GLOBE-50', 'Globe Valve - 50% Open', 'valve', 9.50, 500, 'Globe valve 50% open'),

-- Ball Valves
('VLV-BALL-O', 'Ball Valve - Open', 'valve', 0.05, 3, 'Fully open ball valve'),
('VLV-BALL-75', 'Ball Valve - 75% Open', 'valve', 0.50, 20, 'Ball valve 75% open'),

-- Butterfly Valves
('VLV-BTFLY-O', 'Butterfly Valve - Open', 'valve', 0.25, 12, 'Fully open butterfly valve'),
('VLV-BTFLY-75', 'Butterfly Valve - 75% Open', 'valve', 0.80, 30, 'Butterfly valve 75% open'),

-- Check Valves
('VLV-CHK-SWING', 'Check Valve - Swing', 'valve', 2.00, 100, 'Swing check valve'),
('VLV-CHK-LIFT', 'Check Valve - Lift', 'valve', 10.00, 350, 'Lift check valve'),
('VLV-CHK-BALL', 'Check Valve - Ball', 'valve', 4.50, 150, 'Ball check valve'),

-- Strainers
('STR-Y', 'Y-Strainer', 'strainer', 2.00, 80, 'Y-type strainer (clean)'),
('STR-BASKET', 'Basket Strainer', 'strainer', 1.50, 60, 'Basket strainer (clean)'),

-- Equipment
('COIL-CHW', 'Chilled Water Coil', 'equipment', 4.00, NULL, 'Typical AHU chilled water coil'),
('COIL-HW', 'Hot Water Coil', 'equipment', 3.50, NULL, 'Typical AHU hot water coil'),
('FCU-COIL', 'FCU Coil', 'equipment', 2.50, NULL, 'Fan coil unit coil'),
('HX-PLATE', 'Plate Heat Exchanger', 'equipment', 8.00, NULL, 'Plate-type heat exchanger'),
('HX-SHELL', 'Shell & Tube HX', 'equipment', 6.00, NULL, 'Shell and tube heat exchanger'),

-- Entrances and Exits
('ENT-SHARP', 'Pipe Entrance - Sharp', 'entrance', 0.50, 20, 'Sharp-edged entrance'),
('ENT-ROUND', 'Pipe Entrance - Rounded', 'entrance', 0.04, 2, 'Rounded entrance'),
('EXIT-PIPE', 'Pipe Exit', 'exit', 1.00, 40, 'Pipe discharge to tank');

-- Create index for faster queries
CREATE INDEX idx_pipe_fittings_library_category ON public.pipe_fittings_library(fitting_category);
CREATE INDEX idx_pipe_segment_fittings_segment ON public.pipe_segment_fittings(pipe_segment_id);