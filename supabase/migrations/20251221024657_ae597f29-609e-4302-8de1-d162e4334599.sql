-- ============================================================
-- Fix all RLS policies that use profiles.role to use user_org_id()
-- ============================================================

-- EQUIPMENT
DROP POLICY IF EXISTS "Technicians+ can manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Users can view equipment in their org" ON public.equipment;

CREATE POLICY "Users can view equipment in their org"
ON public.equipment FOR SELECT TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can create equipment in their org"
ON public.equipment FOR INSERT TO authenticated
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update equipment in their org"
ON public.equipment FOR UPDATE TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Admins can delete equipment"
ON public.equipment FOR DELETE TO authenticated
USING (public.has_org_role(organization_id, 'admin'));

-- CUSTOMERS
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Technicians+ can create customers" ON public.customers;
DROP POLICY IF EXISTS "Technicians+ can update customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view customers in their org" ON public.customers;

CREATE POLICY "Users can view customers in their org"
ON public.customers FOR SELECT TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can create customers in their org"
ON public.customers FOR INSERT TO authenticated
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update customers in their org"
ON public.customers FOR UPDATE TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Admins can delete customers"
ON public.customers FOR DELETE TO authenticated
USING (public.has_org_role(organization_id, 'admin'));

-- WORK ORDERS
DROP POLICY IF EXISTS "Admins can delete work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Technicians+ can create work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Technicians+ can update work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Users can view work orders in their org" ON public.work_orders;

CREATE POLICY "Users can view work orders in their org"
ON public.work_orders FOR SELECT TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can create work orders in their org"
ON public.work_orders FOR INSERT TO authenticated
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update work orders in their org"
ON public.work_orders FOR UPDATE TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Admins can delete work orders"
ON public.work_orders FOR DELETE TO authenticated
USING (public.has_org_role(organization_id, 'admin'));

-- PM SCHEDULES
DROP POLICY IF EXISTS "Admins can delete PM schedules" ON public.pm_schedules;
DROP POLICY IF EXISTS "Engineers+ can create PM schedules" ON public.pm_schedules;
DROP POLICY IF EXISTS "Engineers+ can update PM schedules" ON public.pm_schedules;
DROP POLICY IF EXISTS "Users can view PM schedules in their org" ON public.pm_schedules;

CREATE POLICY "Users can view PM schedules in their org"
ON public.pm_schedules FOR SELECT TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can create PM schedules in their org"
ON public.pm_schedules FOR INSERT TO authenticated
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update PM schedules in their org"
ON public.pm_schedules FOR UPDATE TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Admins can delete PM schedules"
ON public.pm_schedules FOR DELETE TO authenticated
USING (public.has_org_role(organization_id, 'admin'));

-- INVOICES
DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Technicians+ can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Technicians+ can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoices in their org" ON public.invoices;

CREATE POLICY "Users can view invoices in their org"
ON public.invoices FOR SELECT TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can create invoices in their org"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update invoices in their org"
ON public.invoices FOR UPDATE TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Admins can delete invoices"
ON public.invoices FOR DELETE TO authenticated
USING (public.has_org_role(organization_id, 'admin'));

-- SERVICE CONTRACTS
DROP POLICY IF EXISTS "Admins can delete service contracts" ON public.service_contracts;
DROP POLICY IF EXISTS "Engineers+ can create service contracts" ON public.service_contracts;
DROP POLICY IF EXISTS "Engineers+ can update service contracts" ON public.service_contracts;
DROP POLICY IF EXISTS "Users can view service contracts in their org" ON public.service_contracts;

CREATE POLICY "Users can view service contracts in their org"
ON public.service_contracts FOR SELECT TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Users can create service contracts in their org"
ON public.service_contracts FOR INSERT TO authenticated
WITH CHECK (organization_id = public.user_org_id());

CREATE POLICY "Users can update service contracts in their org"
ON public.service_contracts FOR UPDATE TO authenticated
USING (organization_id = public.user_org_id());

CREATE POLICY "Admins can delete service contracts"
ON public.service_contracts FOR DELETE TO authenticated
USING (public.has_org_role(organization_id, 'admin'));