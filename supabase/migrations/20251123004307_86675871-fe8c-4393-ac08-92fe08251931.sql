
-- Enable users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Enable users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable users to insert their own profile (in case it doesn't exist)
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
