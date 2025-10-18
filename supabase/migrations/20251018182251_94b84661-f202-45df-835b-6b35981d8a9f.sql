-- Create social media outlet types table
CREATE TABLE public.social_media_outlet_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create company social media table
CREATE TABLE public.company_social_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_type_id TEXT NOT NULL REFERENCES public.social_media_outlet_types(id) ON DELETE CASCADE,
  custom_name TEXT,
  handle TEXT,
  link TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_media_outlet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_social_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_media_outlet_types
CREATE POLICY "Anyone can view outlet types"
ON public.social_media_outlet_types
FOR SELECT
TO public
USING (true);

-- RLS Policies for company_social_media
CREATE POLICY "Anyone can view company social media"
ON public.company_social_media
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can insert company social media"
ON public.company_social_media
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update company social media"
ON public.company_social_media
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete company social media"
ON public.company_social_media
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for updated_at
CREATE TRIGGER update_company_social_media_updated_at
BEFORE UPDATE ON public.company_social_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert social media outlet types from CSV
INSERT INTO public.social_media_outlet_types (id, name, icon_url) VALUES
('other', '(other)', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/pB3BZBtTGJH8CL5JudKc.png'),
('0', 'Discord', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/cMzGropKUYCCeP6i4eX6.png'),
('1', 'Facebook', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/wilNQUniI6vPE4poBQdy.png'),
('2', 'Facebook Messenger', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/xx3p4UJpbXqgmecs6ufj.png'),
('3', 'Instagram', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/E7XSZnsUnWroj5EVE43q.png'),
('4', 'LinkedIn', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/kf1Z51jDgHE52jbmdKTV.png'),
('5', 'Pinterest', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/Xym6OivmHkQmKSx38iAS.png'),
('6', 'Reddit', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/WguvL9h4giI965bs5Utc.png'),
('7', 'Snapchat', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/KGOvMHKkfF71oMhKgK0Q.png'),
('8', 'Telegram', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/NNj3PDz9YJcEZX4YLmhf.png'),
('9', 'Threads', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/LyMKJ1uWp5DtlpjsnrVc.png'),
('10', 'TikTok', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/Jyt8PYWeWFqw5zCLYCIu.png'),
('11', 'Twitch', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/RsJpCSfZ8nGS6lXeRE10.png'),
('12', 'WeChat', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/aOT9sV0YwQedd7P8Hv3G.png'),
('13', 'WhatsApp', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/lfF4NUSVBzyeb8oI2pWE.png'),
('14', 'X', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/7ZU0UGZinKZkduxWaAwJ.png'),
('15', 'YouTube', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/Cs28PZL7zEibe1VngdOR/pub/IGZlacw8bTCgJ4nxuYov.png');