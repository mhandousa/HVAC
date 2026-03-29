-- Helper function to get project_id from zone_id through the location hierarchy
CREATE OR REPLACE FUNCTION get_project_id_from_zone(p_zone_id uuid)
RETURNS uuid AS $$
  SELECT p.id 
  FROM zones z
  JOIN floors f ON z.floor_id = f.id
  JOIN buildings b ON f.building_id = b.id
  JOIN projects p ON b.project_id = p.id
  WHERE z.id = p_zone_id;
$$ LANGUAGE sql STABLE;

-- Trigger function to auto-sync equipment.project_id when zone_id is set
CREATE OR REPLACE FUNCTION sync_equipment_project_from_zone()
RETURNS TRIGGER AS $$
BEGIN
  -- If zone_id is set, derive project_id from the zone hierarchy
  IF NEW.zone_id IS NOT NULL THEN
    NEW.project_id := get_project_id_from_zone(NEW.zone_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on equipment table
DROP TRIGGER IF EXISTS equipment_sync_project ON equipment;
CREATE TRIGGER equipment_sync_project
  BEFORE INSERT OR UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION sync_equipment_project_from_zone();

-- Trigger function to validate contract-equipment project consistency
CREATE OR REPLACE FUNCTION validate_contract_equipment_project()
RETURNS TRIGGER AS $$
DECLARE
  v_contract_project_id uuid;
  v_equipment_project_id uuid;
BEGIN
  -- Get contract's project_id
  SELECT project_id INTO v_contract_project_id
  FROM service_contracts WHERE id = NEW.contract_id;
  
  -- Get equipment's project_id
  SELECT project_id INTO v_equipment_project_id
  FROM equipment WHERE id = NEW.equipment_id;
  
  -- If contract is linked to a project, equipment must be in same project
  IF v_contract_project_id IS NOT NULL 
     AND v_equipment_project_id IS DISTINCT FROM v_contract_project_id THEN
    RAISE EXCEPTION 'Equipment must belong to the same project as the contract';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contract_equipment table
DROP TRIGGER IF EXISTS contract_equipment_project_validation ON contract_equipment;
CREATE TRIGGER contract_equipment_project_validation
  BEFORE INSERT OR UPDATE ON contract_equipment
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_equipment_project();

-- Trigger function to validate contract customer-project relationship
CREATE OR REPLACE FUNCTION validate_contract_customer_project()
RETURNS TRIGGER AS $$
BEGIN
  -- If contract has both customer and project, verify the customer is linked to the project
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
$$ LANGUAGE plpgsql;

-- Create trigger on service_contracts table
DROP TRIGGER IF EXISTS contract_customer_project_validation ON service_contracts;
CREATE TRIGGER contract_customer_project_validation
  BEFORE INSERT OR UPDATE ON service_contracts
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_customer_project();

-- Sync existing equipment project_id based on zone_id (data migration)
UPDATE equipment e
SET project_id = get_project_id_from_zone(e.zone_id)
WHERE e.zone_id IS NOT NULL
  AND (e.project_id IS NULL OR e.project_id != get_project_id_from_zone(e.zone_id));