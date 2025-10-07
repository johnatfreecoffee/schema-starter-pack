import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch all active generated pages
    const { data: pages, error } = await supabase
      .from('generated_pages')
      .select('url_path, updated_at')
      .eq('status', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Build URLs array
    const urls = pages.map((page) => ({
      loc: `https://yoursite.com${page.url_path}`,
      lastmod: new Date(page.updated_at).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.8,
    }));

    // Add static pages
    const today = new Date().toISOString().split('T')[0];
    urls.unshift(
      { loc: 'https://yoursite.com/', lastmod: today, changefreq: 'weekly', priority: 1.0 },
      { loc: 'https://yoursite.com/services', lastmod: today, changefreq: 'weekly', priority: 0.9 },
      { loc: 'https://yoursite.com/about-us', lastmod: today, changefreq: 'monthly', priority: 0.7 },
      { loc: 'https://yoursite.com/contact', lastmod: today, changefreq: 'monthly', priority: 0.7 }
    );

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
