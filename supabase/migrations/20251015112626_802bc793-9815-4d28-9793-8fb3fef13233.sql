-- Create knowledge base categories table
CREATE TABLE public.kb_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create knowledge base articles table
CREATE TABLE public.kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category_id uuid REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Admins can manage categories"
ON public.kb_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "CRM users can view categories"
ON public.kb_categories
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'crm_user')
);

-- RLS Policies for articles
CREATE POLICY "Admins can manage articles"
ON public.kb_articles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "CRM users can view articles"
ON public.kb_articles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'crm_user')
);

-- Create trigger for updated_at
CREATE TRIGGER update_kb_articles_updated_at
BEFORE UPDATE ON public.kb_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better search performance
CREATE INDEX idx_kb_articles_category ON public.kb_articles(category_id);
CREATE INDEX idx_kb_articles_tags ON public.kb_articles USING GIN(tags);
CREATE INDEX idx_kb_articles_active ON public.kb_articles(is_active);
CREATE INDEX idx_kb_articles_title ON public.kb_articles(title);

-- Insert some default categories
INSERT INTO public.kb_categories (name, description, icon, sort_order) VALUES
('Company Information', 'General company info, history, mission', 'Building2', 1),
('Services', 'Information about services offered', 'Wrench', 2),
('Processes', 'Internal processes and procedures', 'GitBranch', 3),
('Policies', 'Company policies and guidelines', 'FileText', 4),
('FAQ', 'Frequently asked questions', 'HelpCircle', 5);