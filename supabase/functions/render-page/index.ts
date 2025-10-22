import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Enhanced Handlebars-like template rendering with array support
function compileTemplate(templateHtml: string) {
  return (data: Record<string, any>) => {
    let result = templateHtml;
    
    // Replace each variable
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      // Handle arrays (like local_benefits)
      if (Array.isArray(value)) {
        // Check for list syntax {{#local_benefits}}...{{/local_benefits}}
        const listRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
        result = result.replace(listRegex, (_, template) => {
          return value.map(item => {
            return template.replace(/{{this}}/g, String(item));
          }).join('');
        });
        
        // Also replace simple {{local_benefits}} with joined string
        const simpleRegex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(simpleRegex, value.join(', '));
      } else {
        // Handle regular variables
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value || ''));
      }
    });
    
    return result;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageData {
  service_name: string;
  service_slug: string;
  service_description: string;
  service_starting_price: string;
  service_category: string;
  city_name: string;
  city_slug: string;
  display_name: string;
  local_description: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  company_description: string;
  company_slogan: string;
  years_experience: number;
  logo_url: string;
  icon_url: string;
  page_title: string;
  meta_description: string;
  url_path: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

function renderBreadcrumbs(pageData: PageData): string {
  return `
    <nav aria-label="Breadcrumb" class="breadcrumbs">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/services">Services</a></li>
        <li><a href="/services/${pageData.service_slug}">${pageData.service_name}</a></li>
        <li aria-current="page">${pageData.city_name}</li>
      </ol>
    </nav>
  `;
}

function wrapWithLayout(contentHtml: string, pageData: PageData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${pageData.page_title}</title>
      <meta name="description" content="${pageData.meta_description}">
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="website">
      <meta property="og:url" content="https://yoursite.com${pageData.url_path}">
      <meta property="og:title" content="${pageData.page_title}">
      <meta property="og:description" content="${pageData.meta_description}">
      
      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${pageData.page_title}">
      <meta name="twitter:description" content="${pageData.meta_description}">
      
      <!-- Favicon -->
      <link rel="icon" href="${pageData.icon_url}">
      
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
        .breadcrumbs { padding: 1rem 2rem; background: #f5f5f5; }
        .breadcrumbs ol { list-style: none; padding: 0; margin: 0; display: flex; gap: 0.5rem; }
        .breadcrumbs li::after { content: '›'; margin-left: 0.5rem; color: #666; }
        .breadcrumbs li:last-child::after { content: ''; }
        .breadcrumbs a { color: #0066cc; text-decoration: none; }
        .breadcrumbs a:hover { text-decoration: underline; }
        main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
      </style>
    </head>
    <body>
      ${renderBreadcrumbs(pageData)}
      <main>
        ${contentHtml}
      </main>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);

    // Support both URL path and JSON body with urlPath
    let urlPath: string;

    if (req.method === 'POST') {
      const body = await req.json();
      urlPath = body.urlPath;
    } else {
      const pathParts = url.pathname.split('/').filter(Boolean);
      // Expect format: /render-page/city-slug/service-slug
      if (pathParts.length < 3) {
        return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const citySlug = pathParts[1];
      const serviceSlug = pathParts[2];
      urlPath = `/${citySlug}/${serviceSlug}`;
    }

    console.log(`Rendering page: ${urlPath}`);

    // Look up the generated page with localized content
    const { data: page, error: pageError } = await supabase
      .from('generated_pages')
      .select(`
        *,
        service:services(
          *,
          template:templates(*)
        ),
        service_area:service_areas(*)
      `)
      .eq('url_path', urlPath)
      .single();

    if (pageError || !page) {
      console.error('Page not found:', pageError);
      return new Response(
        `<html><body><h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p></body></html>`,
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Fetch localized content from service_area_services
    const { data: localizedContent } = await supabase
      .from('service_area_services')
      .select('*')
      .eq('service_id', page.service_id)
      .eq('service_area_id', page.service_area_id)
      .single();


    if (!page.status) {
      return new Response(
        `<html><body><h1>404 - Page Unavailable</h1><p>This page is currently unavailable.</p></body></html>`,
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Check if we have cached HTML
    const needsRegeneration = !page.rendered_html || page.needs_regeneration;

    let finalHtml = page.rendered_html;

    if (needsRegeneration) {
      console.log('Regenerating page...');

      // Fetch company settings
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (!company) {
        throw new Error('Company settings not found');
      }

      // Build comprehensive page data with localized content
      const pageData: any = {
        // Service variables
        service_name: page.service.name,
        service_slug: page.service.slug,
        service_description: page.service.full_description || '',
        service_starting_price: formatPrice(page.service.starting_price || 0),
        service_category: page.service.category,
        
        // Area variables
        city_name: page.service_area.city_name,
        city_slug: page.service_area.city_slug,
        display_name: page.service_area.display_name || page.service_area.city_name,
        area_display_name: page.service_area.display_name || page.service_area.city_name,
        state: page.service_area.state || 'LA',
        zip_code: page.service_area.zip_code || '',
        
        // Localized content from service_area_services
        local_description: localizedContent?.local_description || page.service_area.local_description || '',
        local_benefits: localizedContent?.local_benefits || [],
        response_time: localizedContent?.response_time || '',
        completion_time: localizedContent?.completion_time || '',
        customer_count: localizedContent?.customer_count || 0,
        pricing_notes: localizedContent?.pricing_notes || '',
        local_examples: localizedContent?.local_examples || '',
        special_considerations: localizedContent?.special_considerations || '',
        
        // Company variables
        company_name: company.business_name,
        company_phone: formatPhone(company.phone),
        company_email: company.email,
        company_address: company.address,
        company_description: company.description || '',
        company_slogan: company.business_slogan || '',
        years_experience: company.years_experience || 0,
        logo_url: company.logo_url || '',
        icon_url: company.icon_url || '',
        
        // Page meta
        page_title: localizedContent?.meta_title_override || page.page_title,
        meta_description: localizedContent?.meta_description_override || page.meta_description || '',
        url_path: page.url_path,
      };

      // Render template
      const template = compileTemplate(page.service.template.template_html);
      const contentHtml = template(pageData);

      // Wrap with layout
      finalHtml = wrapWithLayout(contentHtml, pageData);

      // Cache the result
      await supabase
        .from('generated_pages')
        .update({
          rendered_html: finalHtml,
          needs_regeneration: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id);

      console.log('Page regenerated and cached');
    }

    // Track view
    await supabase
      .from('generated_pages')
      .update({
        view_count: (page.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', page.id);

    // Return JSON for API calls (POST), HTML for direct access (GET)
    if (req.method === 'POST') {
      // Extract just the content HTML (without layout wrapper) for client-side rendering
      const contentMatch = finalHtml.match(/<main>([\s\S]*)<\/main>/);
      const contentHtml = contentMatch ? contentMatch[1] : finalHtml;

      return new Response(
        JSON.stringify({
          content: contentHtml,
          pageData: {
            service_name: page.service.name,
            service_slug: page.service.slug,
            service_description: page.service.full_description || '',
            service_starting_price: formatPrice(page.service.starting_price || 0),
            service_category: page.service.category,
            city_name: page.service_area.city_name,
            city_slug: page.service_area.city_slug,
            display_name: page.service_area.display_name || page.service_area.city_name,
            page_title: localizedContent?.meta_title_override || page.page_title,
            meta_description: localizedContent?.meta_description_override || page.meta_description || '',
            url_path: page.url_path,
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        }
      );
    } else {
      return new Response(finalHtml, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    }
  } catch (error) {
    console.error('Error rendering page:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
