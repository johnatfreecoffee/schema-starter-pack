import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemplateUpdate {
  fileName: string
  htmlContent: string
  type: 'service' | 'static'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { templates } = await req.json() as { templates: TemplateUpdate[] }

    console.log(`Processing ${templates.length} templates...`)

    const results = []

    for (const template of templates) {
      try {
        // Strip headers, footers, nav from HTML
        const cleanedHtml = stripUnwantedSections(template.htmlContent)

        if (template.type === 'service') {
          // Update service template
          const result = await updateServiceTemplate(supabase, template.fileName, cleanedHtml)
          results.push(result)
        } else if (template.type === 'static') {
          // Update static page
          const result = await updateStaticPage(supabase, template.fileName, cleanedHtml)
          results.push(result)
        }
      } catch (error) {
        console.error(`Error processing ${template.fileName}:`, error)
        results.push({
          fileName: template.fileName,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Bulk update error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function stripUnwantedSections(html: string): string {
  // Remove DOCTYPE, html, head tags entirely
  let cleaned = html.replace(/<!\s*DOCTYPE[^>]*>/gi, '')
  cleaned = cleaned.replace(/<html[^>]*>/gi, '')
  cleaned = cleaned.replace(/<\/html>/gi, '')
  cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
  
  // Remove header, nav, footer elements
  cleaned = cleaned.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  cleaned = cleaned.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  cleaned = cleaned.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
  
  // Remove body tags but keep content
  cleaned = cleaned.replace(/<body[^>]*>/gi, '')
  cleaned = cleaned.replace(/<\/body>/gi, '')
  
  // Remove style blocks (we'll use our design system)
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  
  // Remove script tags except JSON-LD schema
  cleaned = cleaned.replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, '')
  
  // Trim whitespace
  cleaned = cleaned.trim()
  
  return cleaned
}

async function updateServiceTemplate(supabase: any, fileName: string, html: string) {
  // Map file names to service names
  const serviceMap: Record<string, string> = {
    'emergency-roof-repair.html': 'Emergency Roof Repair',
    'general-contracting.html': 'General Contracting',
    'insurance-claims-assistance.html': 'Insurance Claims Assistance',
    'residential-roofing.html': 'Residential Roofing',
    'storm-damage-restoration.html': 'Storm Damage Restoration',
    'hail-damage-repair.html': 'Hail Damage Repair',
    'leak-detection-repair.html': 'Leak Detection & Repair',
    'wind-damage-restoration.html': 'Wind Damage Restoration',
    'asphalt-shingle-roofing-3.html': 'Asphalt Shingle Roofing',
    'attic-ventilation.html': 'Attic Ventilation',
    'chimney-repair.html': 'Chimney Repair',
    'flat-roof-systems.html': 'Flat Roof Systems',
    'green-roof-systems.html': 'Green Roof Systems',
    'gutter-installation.html': 'Gutter Installation',
    'hurricane-preparation.html': 'Hurricane Preparation',
    'metal-roofing.html': 'Metal Roofing',
    'pressure-washing.html': 'Pressure Washing',
    'roof-coatings.html': 'Roof Coatings',
    'roof-inspection.html': 'Roof Inspection',
    'routine-maintenance.html': 'Routine Maintenance',
    'siding-installation.html': 'Siding Installation',
    'skylight-installation.html': 'Skylight Installation',
    'slate-roofing.html': 'Slate Roofing',
    'solar-roofing.html': 'Solar Roofing',
    'tile-roofing.html': 'Tile Roofing',
    'waterproofing-services.html': 'Waterproofing Services',
    'window-installation.html': 'Window Installation',
  }

  const serviceName = serviceMap[fileName]
  if (!serviceName) {
    throw new Error(`Unknown service mapping for ${fileName}`)
  }

  // Find the service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, template_id')
    .eq('name', serviceName)
    .single()

  if (serviceError || !service) {
    throw new Error(`Service not found: ${serviceName}`)
  }

  // Update the template
  const { error: updateError } = await supabase
    .from('templates')
    .update({
      template_html: html,
      updated_at: new Date().toISOString()
    })
    .eq('id', service.template_id)

  if (updateError) {
    throw new Error(`Failed to update template: ${updateError.message}`)
  }

  // Mark related pages for regeneration
  const { error: regenError } = await supabase
    .from('generated_pages')
    .update({ needs_regeneration: true })
    .eq('service_id', service.id)

  console.log(`✅ Updated template for ${serviceName}`)

  return {
    fileName,
    serviceName,
    success: true,
    pagesMarkedForRegen: !regenError
  }
}

async function updateStaticPage(supabase: any, fileName: string, html: string) {
  // Map file names to page slugs
  const pageMap: Record<string, string> = {
    'about.html': 'about',
    'contact.html': 'contact',
    'home.html': 'home',
    'services.html': 'services',
  }

  const slug = pageMap[fileName]
  if (!slug) {
    throw new Error(`Unknown static page mapping for ${fileName}`)
  }

  // Find the static page
  const { data: page, error: pageError } = await supabase
    .from('static_pages')
    .select('id')
    .eq('slug', slug)
    .single()

  if (pageError || !page) {
    throw new Error(`Static page not found: ${slug}`)
  }

  // Update the page content
  const { error: updateError } = await supabase
    .from('static_pages')
    .update({
      html_content: html,
      updated_at: new Date().toISOString()
    })
    .eq('id', page.id)

  if (updateError) {
    throw new Error(`Failed to update static page: ${updateError.message}`)
  }

  console.log(`✅ Updated static page: ${slug}`)

  return {
    fileName,
    slug,
    success: true
  }
}
