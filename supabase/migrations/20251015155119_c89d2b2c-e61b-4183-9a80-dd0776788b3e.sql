-- Add is_active field to services table
ALTER TABLE public.services 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add unique constraint on slug
ALTER TABLE public.services 
ADD CONSTRAINT services_slug_unique UNIQUE (slug);

-- Add check constraint for starting_price
ALTER TABLE public.services 
ADD CONSTRAINT services_starting_price_check 
CHECK (starting_price >= 0);

-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all services"
ON public.services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

-- Policy: Authenticated users can view all services
CREATE POLICY "Authenticated users can view all services"
ON public.services
FOR SELECT
TO authenticated
USING (true);

-- Policy: Public users can view only active services
CREATE POLICY "Public can view active services"
ON public.services
FOR SELECT
TO anon
USING (is_active = true);