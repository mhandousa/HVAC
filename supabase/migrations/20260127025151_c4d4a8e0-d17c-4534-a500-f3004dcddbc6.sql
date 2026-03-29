-- Insert test data for capacity validation banners
WITH chw_plant AS (
  INSERT INTO chilled_water_plants (
    organization_id, project_id, plant_name, plant_tag,
    design_cooling_load_tons, chw_supply_temp_f, chw_return_temp_f,
    pumping_config, redundancy_mode, status
  ) VALUES (
    '05e90a24-50ef-44a7-bf1e-c0a33ddabb09',
    '52de7a2b-20d0-46f0-982a-495ce16ef595',
    'Main CHW Plant - Test', 'CHWP-001',
    500, 44, 56, 'primary-secondary', 'n+1', 'issued'
  )
  RETURNING id
),
chiller_1 AS (
  INSERT INTO chiller_selections (
    organization_id, project_id, chw_plant_id,
    name, chiller_tag, chiller_type, rated_capacity_tons,
    manufacturer, model_number, rated_iplv, rated_eer, status
  ) 
  SELECT 
    '05e90a24-50ef-44a7-bf1e-c0a33ddabb09',
    '52de7a2b-20d0-46f0-982a-495ce16ef595',
    id,
    'CH-1 Centrifugal', 'CH-1', 'water-cooled-centrifugal', 200,
    'Carrier', '19XRV-200', 0.45, 12.5, 'active'
  FROM chw_plant
  RETURNING id
),
chiller_2 AS (
  INSERT INTO chiller_selections (
    organization_id, project_id, chw_plant_id,
    name, chiller_tag, chiller_type, rated_capacity_tons,
    manufacturer, model_number, rated_iplv, rated_eer, status
  ) 
  SELECT 
    '05e90a24-50ef-44a7-bf1e-c0a33ddabb09',
    '52de7a2b-20d0-46f0-982a-495ce16ef595',
    id,
    'CH-2 Screw', 'CH-2', 'water-cooled-screw', 150,
    'Trane', 'RTWD-150', 0.52, 11.8, 'active'
  FROM chw_plant
  RETURNING id
),
hw_plant AS (
  INSERT INTO hot_water_plants (
    organization_id, project_id, plant_name, plant_tag,
    boiler_type, heating_load_btuh, supply_temp_f, return_temp_f,
    pumping_config, redundancy_mode, status
  ) VALUES (
    '05e90a24-50ef-44a7-bf1e-c0a33ddabb09',
    '52de7a2b-20d0-46f0-982a-495ce16ef595',
    'Main HW Plant - Test', 'HWP-001',
    'condensing', 2000000, 140, 120,
    'variable-primary', 'n+1', 'issued'
  )
  RETURNING id
),
boiler_1 AS (
  INSERT INTO boiler_selections (
    organization_id, project_id, hot_water_plant_id,
    selection_name, boiler_tag, boiler_type, selected_capacity_btuh,
    manufacturer, model_number, afue, fuel_type, status
  ) 
  SELECT 
    '05e90a24-50ef-44a7-bf1e-c0a33ddabb09',
    '52de7a2b-20d0-46f0-982a-495ce16ef595',
    id,
    'BLR-1 Condensing', 'BLR-1', 'condensing', 750000,
    'Lochinvar', 'CREST-750', 95.0, 'natural-gas', 'active'
  FROM hw_plant
  RETURNING id
),
boiler_2 AS (
  INSERT INTO boiler_selections (
    organization_id, project_id, hot_water_plant_id,
    selection_name, boiler_tag, boiler_type, selected_capacity_btuh,
    manufacturer, model_number, afue, fuel_type, status
  ) 
  SELECT 
    '05e90a24-50ef-44a7-bf1e-c0a33ddabb09',
    '52de7a2b-20d0-46f0-982a-495ce16ef595',
    id,
    'BLR-2 Atmospheric', 'BLR-2', 'atmospheric', 500000,
    'Weil-McLain', 'SVF-500', 82.0, 'natural-gas', 'active'
  FROM hw_plant
  RETURNING id
)
SELECT 1;