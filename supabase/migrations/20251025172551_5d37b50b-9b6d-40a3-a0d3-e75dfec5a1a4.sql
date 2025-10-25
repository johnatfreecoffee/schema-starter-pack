-- Phase 3: Persistent Cache Storage for Gemini API
-- Create table to store Gemini cache metadata across edge function restarts

CREATE TABLE IF NOT EXISTS public.gemini_cache_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_name TEXT NOT NULL,
  company_id UUID,
  static_context_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_gemini_cache_key ON public.gemini_cache_metadata(cache_key);
CREATE INDEX IF NOT EXISTS idx_gemini_cache_company ON public.gemini_cache_metadata(company_id);
CREATE INDEX IF NOT EXISTS idx_gemini_cache_expires ON public.gemini_cache_metadata(expires_at);

-- Enable RLS
ALTER TABLE public.gemini_cache_metadata ENABLE ROW LEVEL SECURITY;

-- Admin policies for cache management
CREATE POLICY "Admins can manage cache metadata"
  ON public.gemini_cache_metadata
  FOR ALL
  USING (auth_has_role(ARRAY['Admin', 'Super Admin']));

-- Comment for documentation
COMMENT ON TABLE public.gemini_cache_metadata IS 'Stores Google Gemini API cache metadata for persistent cache across edge function cold starts. Part of Phase 3 optimization.';
COMMENT ON COLUMN public.gemini_cache_metadata.cache_key IS 'Unique key combining company_id and context hash';
COMMENT ON COLUMN public.gemini_cache_metadata.cache_name IS 'Reference name from Gemini API (cachedContents/xxx)';
COMMENT ON COLUMN public.gemini_cache_metadata.static_context_hash IS 'Hash of static context to detect changes';
COMMENT ON COLUMN public.gemini_cache_metadata.expires_at IS 'When this cache entry expires (based on Gemini TTL)';