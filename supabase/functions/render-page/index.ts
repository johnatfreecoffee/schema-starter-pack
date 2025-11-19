import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Enhanced Handlebars-like template rendering with array and nested object support
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
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects (like siteSettings.primary_color)
        Object.keys(value).forEach(nestedKey => {
          const nestedValue = value[nestedKey];
          const nestedRegex = new RegExp(`{{${key}\\.${nestedKey}}}`, 'g');
          result = result.replace(nestedRegex, String(nestedValue || ''));
        });
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
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Accept either path params or POST body { urlPath }
    let citySlug: string | undefined;
    let serviceSlug: string | undefined;
    let urlPath: string | undefined;

    if (pathParts.length >= 4) {
      // Expect format: /render-page/services/service-slug/city-slug
      serviceSlug = pathParts[2];
      citySlug = pathParts[3];
      urlPath = `/services/${serviceSlug}/${citySlug}`;
    } else if (pathParts.length >= 3 && pathParts[1] === 'services') {
      // Handle /render-page/services/service-slug (no city)
      serviceSlug = pathParts[2];
      citySlug = undefined;
      urlPath = `/services/${serviceSlug}`;
    } else if (req.method === 'POST') {
      // Fallback: read from JSON body
      let body: any = null;
      try {
        body = await req.json();
      } catch (_) {
        // ignore
      }
      if (typeof body?.urlPath === 'string') {
        const tempUrlPath = body.urlPath as string;
        urlPath = tempUrlPath;
        const parts = tempUrlPath.split('/').filter(Boolean);
        if (parts.length >= 3 && parts[0] === 'services') {
          serviceSlug = parts[1];
          citySlug = parts[2];
        } else if (parts.length >= 2 && parts[0] === 'services') {
          // Handle /services/service-slug (no city)
          serviceSlug = parts[1];
          citySlug = undefined;
        }
      }
    }

    if (!serviceSlug || !urlPath) {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Rendering page: ${urlPath}`);

    let page: any = null;
    let pageError: any = null;
    let localizedContent: any = null;

    if (citySlug) {
      // Look up the specific city+service generated page
      const { data: generatedPage, error: genPageError } = await supabase
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

      if (genPageError || !generatedPage) {
        console.error('Page not found:', genPageError);
        return new Response(
          `<html><body><h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p></body></html>`,
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          }
        );
      }

      page = generatedPage;

      console.log('City-specific page found:', {
        urlPath: page.url_path,
        serviceAreaId: page.service_area_id,
        cityName: page.service_area?.city_name,
        serviceId: page.service_id
      });

      // Fetch localized content from service_area_services
      const { data: locContent } = await supabase
        .from('service_area_services')
        .select('*')
        .eq('service_id', page.service_id)
        .eq('service_area_id', page.service_area_id)
        .single();
      
      localizedContent = locContent;
      console.log('Localized content fetched:', locContent ? 'found' : 'not found');
    } else {
      // No city: fetch service template with New Orleans as default service area
      const { data: serviceData, error: serviceErr } = await supabase
        .from('services')
        .select(`
          *,
          template:templates(*)
        `)
        .eq('slug', serviceSlug)
        .eq('is_active', true)
        .single();

      if (serviceErr || !serviceData) {
        console.error('Service not found:', serviceErr);
        return new Response(
          `<html><body><h1>404 - Service Not Found</h1><p>The service you're looking for doesn't exist.</p></body></html>`,
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          }
        );
      }

      // Fetch New Orleans service area as default
      const { data: defaultArea } = await supabase
        .from('service_areas')
        .select('*')
        .eq('city_name', 'New Orleans')
        .single();

      // Fetch localized content for New Orleans + this service
      if (defaultArea) {
        const { data: locContent } = await supabase
          .from('service_area_services')
          .select('*')
          .eq('service_id', serviceData.id)
          .eq('service_area_id', defaultArea.id)
          .single();
        
        localizedContent = locContent;
      }

      // Create a page object with New Orleans data as defaults
      page = {
        service_id: serviceData.id,
        service: serviceData,
        service_area: defaultArea || {
          city_name: '',
          city_slug: '',
          display_name: '',
          state: '',
          zip_code: ''
        },
        status: true,
        rendered_html: null,
        needs_regeneration: false,
        url_path: urlPath,
        page_title: `${serviceData.name} | Professional Service`,
        meta_description: serviceData.full_description?.substring(0, 160) || ''
      };
    }


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

    // Fetch company settings for rendering
    const { data: company } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    // Fetch site settings for color palette and styling
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('*')
      .maybeSingle();

    // Use safe defaults if company settings are missing
    const companyData = company ?? {
      business_name: 'Company',
      phone: '',
      email: '',
      address: '',
      description: '',
      business_slogan: '',
      years_experience: 0,
      logo_url: '',
      icon_url: '',
    } as any;

    // Use safe defaults if site settings are missing
    const siteSettingsData = siteSettings ?? {
      primary_color: 'hsl(221, 83%, 53%)',
      secondary_color: 'hsl(210, 40%, 96%)',
      accent_color: 'hsl(280, 65%, 60%)',
      success_color: '#10b981',
      warning_color: '#f59e0b',
      info_color: '#3b82f6',
      danger_color: '#ef4444',
      bg_primary_color: 'hsl(0, 0%, 100%)',
      bg_secondary_color: 'hsl(0, 0%, 96%)',
      bg_tertiary_color: 'hsl(0, 0%, 89%)',
      text_primary_color: 'hsl(0, 0%, 13%)',
      text_secondary_color: 'hsl(0, 0%, 45%)',
      text_muted_color: 'hsl(0, 0%, 64%)',
      border_color: 'hsl(0, 0%, 89%)',
      card_bg_color: 'hsl(0, 0%, 100%)',
      feature_color: 'hsl(221, 83%, 53%)',
      cta_color: 'hsl(142, 71%, 45%)',
      button_border_radius: 8,
      card_border_radius: 12,
      icon_stroke_width: 2,
    } as any;

    // Build comprehensive page data with localized content
    const pageData: any = {
      // Service object (full object for frontend)
      service: page.service,
      
      // Service variables
      service_name: page.service.name,
      service_slug: page.service.slug,
      service_description: page.service.full_description || '',
      service_starting_price: formatPrice(page.service.starting_price || 0),
      service_category: page.service.category,

      // Area variables (blank if no city)
      city_name: page.service_area?.city_name || '',
      city_slug: page.service_area?.city_slug || '',
      display_name: page.service_area?.display_name || page.service_area?.city_name || '',
      area_display_name: page.service_area?.display_name || page.service_area?.city_name || '',
      state: page.service_area?.state || '',
      zip_code: page.service_area?.zip_code || '',

      // Localized content from service_area_services (blank if no city)
      local_description: localizedContent?.local_description || '',
      local_benefits: localizedContent?.local_benefits || [],
      response_time: localizedContent?.response_time || '',
      completion_time: localizedContent?.completion_time || '',
      customer_count: localizedContent?.customer_count || 0,
      pricing_notes: localizedContent?.pricing_notes || '',
      local_examples: localizedContent?.local_examples || '',
      special_considerations: localizedContent?.special_considerations || '',

      // Company variables
      company_name: companyData.business_name,
      business_name: companyData.business_name,
      phone: companyData.phone ? formatPhone(companyData.phone) : '',
      company_phone: companyData.phone ? formatPhone(companyData.phone) : '',
      company_email: companyData.email || '',
      company_address: companyData.address || '',
      company_description: companyData.description || '',
      company_slogan: companyData.business_slogan || '',
      years_experience: companyData.years_experience || 0,
      logo_url: companyData.logo_url || '',
      icon_url: companyData.icon_url || '',
      
      // Company address breakdown (use service area city if available, otherwise company address)
      address: companyData.address || '',
      address_street: companyData.address_street || '',
      address_city: page.service_area?.city_name || companyData.address_city || '',
      address_state: page.service_area?.state || companyData.address_state || '',
      address_zip: page.service_area?.zip_code || companyData.address_zip || '',
      address_unit: companyData.address_unit || '',
      
      // Service radius
      service_radius: companyData.service_radius || 0,
      service_radius_unit: companyData.service_radius_unit || 'miles',

      // Site settings for colors and styling
      siteSettings: siteSettingsData,

      // Page meta
      page_title: localizedContent?.meta_title_override || page.page_title,
      meta_description: localizedContent?.meta_description_override || page.meta_description || '',
      url_path: page.url_path,
    };
    
    console.log('Template data being used:', {
      city_name: pageData.city_name,
      address_city: pageData.address_city,
      urlPath: pageData.url_path
    });

    // Compile template content (separate from layout wrapping)
    const template = compileTemplate(page.service.template.template_html);
    const contentHtml = template(pageData);

    // Cache the compiled content if needed (only for actual generated pages with cities)
    if (needsRegeneration && page.id) {
      console.log('Regenerating page content...');
      await supabase
        .from('generated_pages')
        .update({
          rendered_html: contentHtml,
          needs_regeneration: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id);
      console.log('Page content regenerated and cached');
    }

    // Track view (only for actual generated pages with cities)
    if (page.id) {
      await supabase
        .from('generated_pages')
        .update({
          view_count: (page.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', page.id);
    }

    // For POST requests: return just content + data for client-side hydration
    if (req.method === 'POST') {
      return new Response(
        JSON.stringify({
          content: contentHtml,
          pageData: pageData,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
        }
      );
    }

    // For GET requests: wrap in full layout and return complete HTML
    finalHtml = wrapWithLayout(contentHtml, pageData);
    return new Response(finalHtml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
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
