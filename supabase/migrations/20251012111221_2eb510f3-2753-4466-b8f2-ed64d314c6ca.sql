-- Create enum for review status
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'archived');

-- Create enum for review source
CREATE TYPE review_source AS ENUM ('portal', 'email', 'manual', 'google', 'facebook');

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT NOT NULL,
  review_text TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_location TEXT,
  status review_status NOT NULL DEFAULT 'pending',
  featured BOOLEAN DEFAULT FALSE,
  display_on_website BOOLEAN DEFAULT TRUE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source review_source NOT NULL DEFAULT 'portal',
  external_url TEXT,
  response_text TEXT,
  response_at TIMESTAMP WITH TIME ZONE,
  response_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- CRM users can view all reviews
CREATE POLICY "CRM users can view all reviews"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- CRM users can manage reviews
CREATE POLICY "CRM users can manage reviews"
ON public.reviews
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'crm_user')
  )
);

-- Customers can view their own reviews
CREATE POLICY "Customers can view their own reviews"
ON public.reviews
FOR SELECT
USING (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
);

-- Customers can insert their own reviews
CREATE POLICY "Customers can insert reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Customers can update their own pending reviews
CREATE POLICY "Customers can update pending reviews"
ON public.reviews
FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
USING (
  status = 'approved'
  AND display_on_website = TRUE
);

-- Create indexes for performance
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_featured ON public.reviews(featured);
CREATE INDEX idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX idx_reviews_account_id ON public.reviews(account_id);
CREATE INDEX idx_reviews_submitted_at ON public.reviews(submitted_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();