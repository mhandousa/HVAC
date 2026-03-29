-- Add enhanced columns to duct_segments table
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS from_node varchar(100);
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS to_node varchar(100);
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS equivalent_diameter_mm numeric;
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS dynamic_loss_pa numeric;
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS material_type varchar(50) DEFAULT 'galvanized_steel';
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS gauge_thickness_mm numeric;
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS sealing_class varchar(20) DEFAULT 'A';
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS has_damper boolean DEFAULT false;
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS damper_pressure_drop_pa numeric;
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS parent_segment_id uuid REFERENCES duct_segments(id);
ALTER TABLE duct_segments ADD COLUMN IF NOT EXISTS is_critical_path boolean DEFAULT false;

-- Add enhanced columns to duct_systems table
ALTER TABLE duct_systems ADD COLUMN IF NOT EXISTS friction_rate_pa_per_m numeric;
ALTER TABLE duct_systems ADD COLUMN IF NOT EXISTS critical_path_pressure_pa numeric;
ALTER TABLE duct_systems ADD COLUMN IF NOT EXISTS total_duct_area_m2 numeric;
ALTER TABLE duct_systems ADD COLUMN IF NOT EXISTS total_duct_weight_kg numeric;
ALTER TABLE duct_systems ADD COLUMN IF NOT EXISTS sizing_method varchar(50) DEFAULT 'equal_friction';

-- Create duct fittings library table with ASHRAE coefficients
CREATE TABLE IF NOT EXISTS duct_fittings_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fitting_code varchar(50) NOT NULL UNIQUE,
  fitting_name varchar(255) NOT NULL,
  fitting_category varchar(100) NOT NULL,
  duct_shape varchar(50) NOT NULL CHECK (duct_shape IN ('round', 'rectangular', 'both')),
  loss_coefficient numeric NOT NULL,
  description text,
  radius_ratio numeric,
  angle_degrees numeric,
  ashrae_reference varchar(100),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on fittings library (read-only for all authenticated users)
ALTER TABLE duct_fittings_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fittings library is viewable by authenticated users"
ON duct_fittings_library FOR SELECT
TO authenticated
USING (true);

-- Seed ASHRAE duct fitting loss coefficients
INSERT INTO duct_fittings_library (fitting_code, fitting_name, fitting_category, duct_shape, loss_coefficient, description, radius_ratio, angle_degrees, ashrae_reference) VALUES
-- Round Elbows
('RND-E90-R1.0', '90° Round Elbow R/D=1.0', 'elbow', 'round', 0.21, 'Smooth 90° round elbow with radius/diameter ratio of 1.0', 1.0, 90, 'ASHRAE CD3-9'),
('RND-E90-R1.5', '90° Round Elbow R/D=1.5', 'elbow', 'round', 0.16, 'Smooth 90° round elbow with radius/diameter ratio of 1.5', 1.5, 90, 'ASHRAE CD3-9'),
('RND-E90-R2.0', '90° Round Elbow R/D=2.0', 'elbow', 'round', 0.13, 'Smooth 90° round elbow with radius/diameter ratio of 2.0', 2.0, 90, 'ASHRAE CD3-9'),
('RND-E45-R1.5', '45° Round Elbow R/D=1.5', 'elbow', 'round', 0.08, 'Smooth 45° round elbow with radius/diameter ratio of 1.5', 1.5, 45, 'ASHRAE CD3-9'),
('RND-E30-R1.5', '30° Round Elbow R/D=1.5', 'elbow', 'round', 0.04, 'Smooth 30° round elbow with radius/diameter ratio of 1.5', 1.5, 30, 'ASHRAE CD3-9'),

-- Rectangular Elbows
('REC-E90-R1.0', '90° Rectangular Elbow R/W=1.0', 'elbow', 'rectangular', 0.22, 'Smooth 90° rectangular elbow with radius/width ratio of 1.0', 1.0, 90, 'ASHRAE CR3-1'),
('REC-E90-R1.5', '90° Rectangular Elbow R/W=1.5', 'elbow', 'rectangular', 0.18, 'Smooth 90° rectangular elbow with radius/width ratio of 1.5', 1.5, 90, 'ASHRAE CR3-1'),
('REC-E90-MIT', '90° Mitered Elbow No Vanes', 'elbow', 'rectangular', 1.30, 'Sharp 90° mitered elbow without turning vanes', NULL, 90, 'ASHRAE CR3-6'),
('REC-E90-MIT-V', '90° Mitered Elbow with Vanes', 'elbow', 'rectangular', 0.40, 'Sharp 90° mitered elbow with single thickness turning vanes', NULL, 90, 'ASHRAE CR3-6'),
('REC-E45', '45° Rectangular Elbow', 'elbow', 'rectangular', 0.10, 'Smooth 45° rectangular elbow', NULL, 45, 'ASHRAE CR3-1'),

-- Tees (Supply)
('TEE-RND-90-S', 'Round Tee 90° Branch (Supply)', 'tee', 'round', 0.90, 'Round tee with 90° branch takeoff, supply configuration', NULL, 90, 'ASHRAE SD5-1'),
('TEE-RND-45-S', 'Round Tee 45° Branch (Supply)', 'tee', 'round', 0.45, 'Round tee with 45° conical branch takeoff', NULL, 45, 'ASHRAE SD5-10'),
('TEE-REC-90-S', 'Rectangular Tee 90° Branch (Supply)', 'tee', 'rectangular', 1.10, 'Rectangular tee with 90° branch takeoff, supply configuration', NULL, 90, 'ASHRAE SR5-1'),
('TEE-REC-45-S', 'Rectangular Wye 45° Branch', 'tee', 'rectangular', 0.55, 'Rectangular wye with 45° branch takeoff', NULL, 45, 'ASHRAE SR5-13'),

-- Transitions
('TRANS-RND-GRAD', 'Gradual Round Transition', 'transition', 'round', 0.05, 'Round transition with gradual taper (7° included angle)', NULL, NULL, 'ASHRAE CD4-1'),
('TRANS-RND-ABRUPT', 'Abrupt Round Contraction', 'transition', 'round', 0.25, 'Abrupt round contraction', NULL, NULL, 'ASHRAE CD4-2'),
('TRANS-REC-GRAD', 'Gradual Rectangular Transition', 'transition', 'rectangular', 0.06, 'Rectangular transition with gradual taper', NULL, NULL, 'ASHRAE CR4-1'),
('TRANS-RND-REC', 'Round to Rectangular Transition', 'transition', 'both', 0.12, 'Transition from round to rectangular duct', NULL, NULL, 'ASHRAE CD4-7'),

-- Dampers
('DAMP-VCD-OPEN', 'Volume Control Damper - Open', 'damper', 'both', 0.20, 'Opposed blade volume control damper, fully open position', NULL, NULL, 'ASHRAE CD9-1'),
('DAMP-VCD-25', 'Volume Control Damper - 25% Closed', 'damper', 'both', 0.52, 'Opposed blade volume control damper, 25% closed', NULL, NULL, 'ASHRAE CD9-1'),
('DAMP-VCD-50', 'Volume Control Damper - 50% Closed', 'damper', 'both', 2.00, 'Opposed blade volume control damper, 50% closed', NULL, NULL, 'ASHRAE CD9-1'),
('DAMP-FIRE', 'Fire Damper (Open)', 'damper', 'both', 0.35, 'Fire damper in open position', NULL, NULL, 'ASHRAE CD9-4'),
('DAMP-SMOKE', 'Smoke Damper (Open)', 'damper', 'both', 0.25, 'Smoke damper in open position', NULL, NULL, 'ASHRAE CD9-4'),

-- Entry/Exit
('ENTRY-PLENUM', 'Duct Entry from Plenum', 'entry', 'both', 0.50, 'Duct entrance from plenum, square edge', NULL, NULL, 'ASHRAE CD1-1'),
('ENTRY-BELL', 'Bellmouth Entry', 'entry', 'both', 0.03, 'Bellmouth duct entry, smooth transition', NULL, NULL, 'ASHRAE CD1-1'),
('EXIT-ABRUPT', 'Abrupt Exit to Plenum', 'exit', 'both', 1.00, 'Abrupt duct exit to open space, all velocity pressure lost', NULL, NULL, 'ASHRAE CD2-1'),
('EXIT-DIFF', 'Exit to Diffuser', 'exit', 'both', 0.10, 'Duct connection to supply diffuser', NULL, NULL, 'ASHRAE CD2-1'),

-- Takeoffs
('TAKEOFF-RND-90', 'Round 90° Takeoff', 'takeoff', 'round', 0.85, 'Round 90° branch takeoff from main duct', NULL, 90, 'ASHRAE SD5-2'),
('TAKEOFF-RND-45', 'Round 45° Takeoff', 'takeoff', 'round', 0.40, 'Round 45° branch takeoff from main duct', NULL, 45, 'ASHRAE SD5-10'),
('TAKEOFF-REC-90', 'Rectangular 90° Takeoff', 'takeoff', 'rectangular', 0.95, 'Rectangular 90° branch takeoff from main duct', NULL, 90, 'ASHRAE SR5-1'),

-- Flex Duct
('FLEX-STD', 'Flexible Duct (Standard)', 'flex', 'round', 0.02, 'Flexible duct per foot of equivalent length, extended straight', NULL, NULL, 'ASHRAE CD3-17'),
('FLEX-COMP-30', 'Flexible Duct 30% Compressed', 'flex', 'round', 0.06, 'Flexible duct per foot, 30% compression', NULL, NULL, 'ASHRAE CD3-17')
ON CONFLICT (fitting_code) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fittings_category ON duct_fittings_library(fitting_category);
CREATE INDEX IF NOT EXISTS idx_fittings_shape ON duct_fittings_library(duct_shape);
CREATE INDEX IF NOT EXISTS idx_segments_parent ON duct_segments(parent_segment_id);
CREATE INDEX IF NOT EXISTS idx_segments_critical ON duct_segments(is_critical_path) WHERE is_critical_path = true;