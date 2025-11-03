-- Create test table
CREATE TABLE public.test_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_one TEXT NOT NULL,
  test_two TEXT NOT NULL,
  test_three TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_table ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view test data" 
ON public.test_table 
FOR SELECT 
USING (true);

-- Insert sample data
INSERT INTO public.test_table (test_one, test_two, test_three) VALUES
  ('A', 'B', 'C'),
  ('Alpha', 'Beta', 'Gamma'),
  ('Apple', 'Banana', 'Cherry');