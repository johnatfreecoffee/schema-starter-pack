import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'text/plain',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Use production domain for sitemap reference
    const baseUrl = 'https://clearhome.pro';

    // Fetch robots.txt content from settings
    const { data: settings } = await supabaseClient
      .from('seo_settings')
      .select('robots_txt')
      .maybeSingle();
    
    const defaultRobotsTxt = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml`;
    
    const robotsTxt = settings?.robots_txt || defaultRobotsTxt;
    
    return new Response(robotsTxt, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching robots.txt:', error);
    const fallback = `User-agent: *
Allow: /`;
    
    return new Response(fallback, {
      headers: corsHeaders,
    });
  }
});
