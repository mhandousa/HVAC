-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Create a simpler policy that avoids self-referencing
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Note: For viewing other profiles in the same organization, 
-- we'll need a different approach using a security definer function
-- For now, users can only see their own profile