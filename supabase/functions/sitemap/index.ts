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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the base URL from the request
    const baseUrl = new URL(req.url).origin;

    // Fetch all published static pages
    const { data: staticPages } = await supabase
      .from('static_pages')
      .select('id, slug, updated_at')
      .eq('status', true);

    // Fetch all active generated pages
    const { data: generatedPages } = await supabase
      .from('generated_pages')
      .select('id, url_path, updated_at')
      .eq('status', true);

    // Fetch SEO settings for priorities
    const { data: seoPages } = await supabase
      .from('page_seo')
      .select('page_id, page_type, priority, change_frequency');

    // Build XML sitemap with proper formatting
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
    xml += 'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 ';
    xml += 'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';
    
    // Add homepage with highest priority
    xml += `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;
    
    // Add static pages with proper formatting
    if (staticPages && staticPages.length > 0) {
      for (const page of staticPages) {
        const seoData = seoPages?.find(
          (s: any) => s.page_type === 'static' && s.page_id === page.id
        );
        const priority = seoData?.priority || 0.8;
        const changefreq = seoData?.change_frequency || 'monthly';
        const lastmod = page.updated_at ? new Date(page.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        xml += `  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
      }
    }
    
    // Add generated service pages with proper formatting
    if (generatedPages && generatedPages.length > 0) {
      for (const page of generatedPages) {
        const seoData = seoPages?.find(
          (s: any) => s.page_type === 'generated' && s.page_id === page.id
        );
        const priority = seoData?.priority || 0.7;
        const changefreq = seoData?.change_frequency || 'monthly';
        const lastmod = page.updated_at ? new Date(page.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        xml += `  <url>
    <loc>${baseUrl}${page.url_path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
      }
    }
    
    console.log(`Generated sitemap with ${(staticPages?.length || 0) + (generatedPages?.length || 0) + 1} URLs`);
    
    xml += '</urlset>';
    
    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
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
