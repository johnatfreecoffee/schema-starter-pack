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

    console.log('Starting republish all pages...');

    const results = {
      static_pages: { total: 0, success: 0, failed: 0 },
      service_templates: { total: 0, success: 0, failed: 0 },
      errors: [] as string[]
    };

    // Republish all static pages
    const { data: staticPages, error: staticPagesError } = await supabase
      .from('static_pages')
      .select('id, title')
      .not('content_html_draft', 'is', null);

    if (staticPagesError) {
      console.error('Error fetching static pages:', staticPagesError);
      results.errors.push(`Failed to fetch static pages: ${staticPagesError.message}`);
    } else if (staticPages) {
      results.static_pages.total = staticPages.length;
      console.log(`Found ${staticPages.length} static pages to republish`);

      for (const page of staticPages) {
        try {
          // Call publish-page function for each static page
          const publishResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/publish-page`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              pageId: page.id,
              pageType: 'static'
            })
          });

          if (publishResponse.ok) {
            results.static_pages.success++;
            console.log(`✅ Published static page: ${page.title}`);
          } else {
            results.static_pages.failed++;
            const errorText = await publishResponse.text();
            results.errors.push(`Static page "${page.title}": ${errorText}`);
            console.error(`❌ Failed to publish static page: ${page.title}`, errorText);
          }
        } catch (error) {
          results.static_pages.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Static page "${page.title}": ${errorMessage}`);
          console.error(`❌ Error publishing static page: ${page.title}`, error);
        }
      }
    }

    // Republish all service templates
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('id, name')
      .not('template_html_draft', 'is', null);

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      results.errors.push(`Failed to fetch templates: ${templatesError.message}`);
    } else if (templates) {
      results.service_templates.total = templates.length;
      console.log(`Found ${templates.length} service templates to republish`);

      for (const template of templates) {
        try {
          // Call publish-page function for each service template
          const publishResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/publish-page`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              pageId: template.id,
              pageType: 'service'
            })
          });

          if (publishResponse.ok) {
            results.service_templates.success++;
            console.log(`✅ Published service template: ${template.name}`);
          } else {
            results.service_templates.failed++;
            const errorText = await publishResponse.text();
            results.errors.push(`Service template "${template.name}": ${errorText}`);
            console.error(`❌ Failed to publish service template: ${template.name}`, errorText);
          }
        } catch (error) {
          results.service_templates.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Service template "${template.name}": ${errorMessage}`);
          console.error(`❌ Error publishing service template: ${template.name}`, error);
        }
      }
    }

    console.log('Republish completed:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total_pages: results.static_pages.total + results.service_templates.total,
        total_success: results.static_pages.success + results.service_templates.success,
        total_failed: results.static_pages.failed + results.service_templates.failed
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in republish-all-pages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});