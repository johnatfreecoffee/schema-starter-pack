import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple Handlebars-like variable replacement
function replaceVariables(html: string, data: Record<string, any>): string {
  let result = html;
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (Array.isArray(value)) {
      // Handle arrays with {{#key}}...{{/key}} syntax
      const listRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
      result = result.replace(listRegex, (_, template) => {
        return value.map(item => template.replace(/{{this}}/g, String(item))).join('');
      });
      
      // Simple {{key}} replacement
      const simpleRegex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(simpleRegex, value.join(', '));
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects like {{brand.colors.primary}}
      Object.keys(value).forEach(nestedKey => {
        const nestedValue = value[nestedKey];
        const nestedRegex = new RegExp(`{{${key}\\.${nestedKey}}}`, 'g');
        result = result.replace(nestedRegex, String(nestedValue || ''));
      });
    } else {
      // Handle simple variables
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    }
  });
  
  return result;
}

// Generate the form popup script (injected into every published page)
function getFormPopupScript(): string {
  return `
<script>
(function() {
  // Handle lead form popup clicks
  document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-open-form]');
    if (target) {
      e.preventDefault();
      const formType = target.getAttribute('data-open-form') || 'General Inquiry';
      const popup = window.open('/contact-popup?popup=true&type=' + encodeURIComponent(formType), 'leadForm', 'width=600,height=800');
      if (popup) popup.focus();
    }
  });

  // Handle accordion clicks
  document.addEventListener('click', function(e) {
    const header = e.target.closest('.accordion-header');
    if (header) {
      e.preventDefault();
      const parent = header.parentElement;
      const content = parent.querySelector('.accordion-content');
      const icon = header.querySelector('svg');
      
      if (content) {
        const isActive = parent.classList.contains('active');
        parent.classList.toggle('active');
        content.style.maxHeight = isActive ? '0' : content.scrollHeight + 'px';
        if (icon) icon.style.transform = isActive ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    }
  });

  // Handle tab clicks
  document.addEventListener('click', function(e) {
    const button = e.target.closest('.tab-button');
    if (button) {
      e.preventDefault();
      const tabContainer = button.closest('.tab-container');
      if (!tabContainer) return;
      
      const tabId = button.getAttribute('data-tab');
      tabContainer.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      tabContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      button.classList.add('active');
      const targetContent = tabContainer.querySelector('[data-tab-content="' + tabId + '"]');
      if (targetContent) targetContent.classList.add('active');
    }
  });
})();
</script>`;
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

    const { pageId, pageType } = await req.json();

    if (!pageId || !pageType) {
      return new Response(JSON.stringify({ error: 'pageId and pageType required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Publishing page: ${pageType} - ${pageId}`);

    // Fetch company settings
    const { data: company } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    // Fetch site settings
    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('*')
      .maybeSingle();

    // Fetch AI training data
    const { data: aiTraining } = await supabase
      .from('ai_training')
      .select('*')
      .maybeSingle();

    const companyData = company ?? {};
    const siteData = siteSettings ?? {};
    const brandData = aiTraining ?? {};

    // Prepare variable data for replacement
    const variableData = {
      business_name: companyData.business_name || '',
      business_slogan: companyData.business_slogan || '',
      phone: companyData.phone || '',
      email: companyData.email || '',
      address_street: companyData.address_street || '',
      address_city: companyData.address_city || '',
      address_state: companyData.address_state || '',
      address_zip: companyData.address_zip || '',
      address: companyData.address || '',
      website_url: companyData.website_url || '',
      years_experience: companyData.years_experience || 0,
      description: companyData.description || '',
      logo_url: companyData.logo_url || '',
      icon_url: companyData.icon_url || '',
      brand_voice: brandData.brand_voice || '',
      mission_statement: brandData.mission_statement || '',
      customer_promise: brandData.customer_promise || '',
      competitive_positioning: brandData.competitive_positioning || '',
      unique_selling_points: brandData.unique_selling_points || '',
      competitive_advantages: brandData.competitive_advantages || '',
      target_audience: brandData.target_audience || '',
      service_standards: brandData.service_standards || '',
      certifications: brandData.certifications || '',
      emergency_response: brandData.emergency_response || '',
      service_area_coverage: brandData.service_area_coverage || '',
      project_timeline: brandData.project_timeline || '',
      payment_options: brandData.payment_options || '',
      brand: {
        colors: {
          primary: siteData.primary_color || '#0066cc',
          secondary: siteData.secondary_color || '#003366',
          accent: siteData.accent_color || '#ff6600',
        }
      }
    };

    let draftHtml = '';
    let pageTitle = '';
    let metaDescription = '';
    let canonicalUrl = '';
    let table = '';
    let field = '';

    // Fetch draft HTML based on page type
    if (pageType === 'static') {
      const { data: page } = await supabase
        .from('static_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (!page) {
        return new Response(JSON.stringify({ error: 'Page not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      draftHtml = page.content_html_draft || page.content_html || '';
      pageTitle = page.title || '';
      metaDescription = page.meta_description || '';
      canonicalUrl = `https://clearhome.pro${page.slug}`;
      table = 'static_pages';
      field = 'published_html';
    } else if (pageType === 'service') {
      const { data: template } = await supabase
        .from('templates')
        .select('*, services(*)')
        .eq('id', pageId)
        .single();

      if (!template) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      draftHtml = template.template_html_draft || template.template_html || '';
      
      // Fetch service info for meta data
      const service = template.services?.[0];
      pageTitle = service ? `${service.name} | ${companyData.business_name || 'Professional Service'}` : 'Service';
      metaDescription = template.meta_description || service?.short_description || '';
      canonicalUrl = service ? `https://clearhome.pro/services/${service.slug}` : '';
      table = 'templates';
      field = 'published_html';
    }

    // Replace all variables in draft HTML
    const processedHtml = replaceVariables(draftHtml, variableData);

    // Wrap with full HTML document including SEO tags
    const domain = 'https://clearhome.pro';
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : ''}
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDescription}">
  ${canonicalUrl ? `<meta property="og:url" content="${canonicalUrl}">` : ''}
  <meta property="og:site_name" content="${variableData.business_name}">
  ${variableData.logo_url ? `<meta property="og:image" content="${variableData.logo_url}">` : ''}
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${metaDescription}">
  ${variableData.logo_url ? `<meta name="twitter:image" content="${variableData.logo_url}">` : ''}
  
  <!-- Favicon -->
  ${variableData.icon_url ? `<link rel="icon" href="${variableData.icon_url}">` : ''}
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "${variableData.business_name}",
    "description": "${variableData.description || metaDescription}",
    "url": "${domain}",
    "logo": "${variableData.logo_url}",
    "telephone": "${variableData.phone}",
    "email": "${variableData.email}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "${variableData.address_street}",
      "addressLocality": "${variableData.address_city}",
      "addressRegion": "${variableData.address_state}",
      "postalCode": "${variableData.address_zip}",
      "addressCountry": "US"
    }
  }
  </script>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  ${getFormPopupScript()}
</head>
<body>
  ${processedHtml}
</body>
</html>`;

    // Save published HTML to database
    const updateData: any = {};
    updateData[field] = fullHtml;
    updateData.published_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', pageId);

    if (updateError) {
      console.error('Error saving published HTML:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save published page' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Page published successfully: ${pageType} - ${pageId}`);

    return new Response(JSON.stringify({ 
      success: true,
      pageId,
      pageType,
      publishedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in publish-page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});