-- Fix search_path for all new functions to address security warnings

-- Fix get_project_id_from_zone function
CREATE OR REPLACE FUNCTION get_project_id_from_zone(p_zone_id uuid)
RETURNS uuid AS $$
  SELECT p.id 
  FROM zones z
  JOIN floors f ON z.floor_id = f.id
  JOIN buildings b ON f.building_id = b.id
  JOIN projects p ON b.project_id = p.id
  WHERE z.id = p_zone_id;
$$ LANGUAGE sql STABLE SET search_path = public;

-- Fix sync_equipment_project_from_zone function
CREATE OR REPLACE FUNCTION sync_equipment_project_from_zone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.zone_id IS NOT NULL THEN
    NEW.project_id := get_project_id_from_zone(NEW.zone_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix validate_contract_equipment_project function
CREATE OR REPLACE FUNCTION validate_contract_equipment_project()
RETURNS TRIGGER AS $$
DECLARE
  v_contract_project_id uuid;
  v_equipment_project_id uuid;
BEGIN
  SELECT project_id INTO v_contract_project_id
  FROM service_contracts WHERE id = NEW.contract_id;
  
  SELECT project_id INTO v_equipment_project_id
  FROM equipment WHERE id = NEW.equipment_id;
  
  IF v_contract_project_id IS NOT NULL 
     AND v_equipment_project_id IS DISTINCT FROM v_contract_project_id THEN
    RAISE EXCEPTION 'Equipment must belong to the same project as the contract';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix validate_contract_customer_project function
CREATE OR REPLACE FUNCTION validate_contract_customer_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM project_customers 
      WHERE customer_id = NEW.customer_id 
        AND project_id = NEW.project_id
    ) THEN
      RAISE EXCEPTION 'Customer must be linked to the project before creating a contract for that project';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;