import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map URL paths to database slugs
const slugMap: Record<string, string> = {
  '': 'home',
  '/': 'home',
  'home': 'home',
  'about': 'about',
  'contact': 'contact',
  'services': 'services',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get slug from URL path or request body
    let slug: string | null = null;
    
    const url = new URL(req.url);
    const pathSlug = url.searchParams.get('slug');
    
    if (pathSlug) {
      slug = pathSlug;
    } else if (req.method === 'POST') {
      const body = await req.json();
      slug = body.slug;
    }

    // Normalize slug
    slug = slugMap[slug || ''] || slug || 'home';
    
    console.log(`📄 Rendering static page: ${slug}`);

    // Fetch the static page
    const { data: page, error: pageError } = await supabase
      .from('static_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', true)
      .maybeSingle();

    if (pageError) {
      console.error('❌ Database error:', pageError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!page) {
      console.log(`❌ Page not found: ${slug}`);
      return new Response('Page not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Use published_html if available, fallback to content_html
    const htmlContent = page.published_html || page.content_html;

    if (!htmlContent) {
      console.log(`❌ No HTML content for page: ${slug}`);
      return new Response('Page has no content', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Fetch company settings for pageData
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    // Fetch site settings for pageData
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const pageData = {
      page,
      company: companySettings,
      siteSettings,
    };

    // GET request = return raw HTML for SEO (search engines, direct browser visits)
    if (req.method === 'GET') {
      console.log(`✅ Returning raw HTML for GET request: ${slug}`);
      return new Response(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // POST request = return JSON for React SPA
    console.log(`✅ Returning JSON for POST request: ${slug}`);
    return new Response(JSON.stringify({ 
      content: htmlContent, 
      pageData 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error rendering static page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
