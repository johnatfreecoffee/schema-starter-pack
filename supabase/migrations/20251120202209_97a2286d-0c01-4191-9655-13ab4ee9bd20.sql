-- Enable realtime for static_pages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.static_pages;

-- Enable realtime for templates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;