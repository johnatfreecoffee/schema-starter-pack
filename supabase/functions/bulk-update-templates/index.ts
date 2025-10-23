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
        const errMsg = (error && typeof error === 'object' && 'message' in (error as any)) 
          ? (error as any).message 
          : String(error)
        results.push({
          fileName: template.fileName,
          success: false,
          error: errMsg
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Bulk update error:', error)
    const errMsg = (error && typeof error === 'object' && 'message' in (error as any)) 
      ? (error as any).message 
      : String(error)
    return new Response(
      JSON.stringify({ error: errMsg }),
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

function isValidUuid(id: string | null): boolean {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
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
    'leak-detection-repair.html': 'Leak Detection and Repair',
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

  // Try exact name
  let { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, template_id, name')
    .eq('name', serviceName)
    .maybeSingle()

  // Fallbacks: replace ampersand with 'and' and trim
  if (!service) {
    const altName = serviceName.replace(/&/g, 'and').replace(/\s+/g, ' ').trim()
    const { data: altService } = await supabase
      .from('services')
      .select('id, template_id, name')
      .eq('name', altName)
      .maybeSingle()
    service = altService
  }

  if (!service) {
    throw new Error(`Service not found: ${serviceName}`)
  }

  // If service has no template, create one and link it
  let templateId = (service as any).template_id as string | null
  if (!templateId || templateId === 'null') {
    // Try to reuse an existing template with the same name
    const { data: existingTpl } = await supabase
      .from('templates')
      .select('id')
      .eq('name', service.name)
      .maybeSingle()

    if (existingTpl?.id) {
      templateId = existingTpl.id
    } else {
      const { data: newTpl, error: tplErr } = await supabase
        .from('templates')
        .insert({
          name: service.name,
          template_type: 'service',
          template_html: html,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (tplErr) throw new Error(`Failed to create template: ${tplErr.message}`)
      templateId = newTpl.id
    }

    // Link template to service
    const { error: linkErr } = await supabase
      .from('services')
      .update({ template_id: templateId, updated_at: new Date().toISOString() })
      .eq('id', service.id)
    if (linkErr) throw new Error(`Failed to link template to service: ${linkErr.message}`)
  }

  // Update the template HTML
  const { error: updateError } = await supabase
    .from('templates')
    .update({
      template_html: html,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)

  if (updateError) {
    throw new Error(`Failed to update template: ${updateError.message}`)
  }

  // Mark related pages for regeneration
  const { error: regenError } = await supabase
    .from('generated_pages')
    .update({ needs_regeneration: true })
    .eq('service_id', service.id)

  console.log(`✅ Updated template for ${service.name}`)

  return {
    fileName,
    serviceName: service.name,
    success: true,
    pagesMarkedForRegen: !regenError
  }
}

async function updateStaticPage(supabase: any, fileName: string, html: string) {
  // Map file names to page slugs and titles
  const pageMap: Record<string, { slug: string; title: string }> = {
    'about.html': { slug: 'about', title: 'About Us' },
    'contact.html': { slug: 'contact', title: 'Contact Us' },
    'home.html': { slug: 'home', title: 'Home' },
    'services.html': { slug: 'services', title: 'Our Services' },
  }

  const pageInfo = pageMap[fileName]
  if (!pageInfo) {
    throw new Error(`Unknown static page mapping for ${fileName}`)
  }

  // Try to find the static page
  const { data: page } = await supabase
    .from('static_pages')
    .select('id')
    .eq('slug', pageInfo.slug)
    .maybeSingle()

  let pageId: string

  if (!page) {
    // Create the static page if it doesn't exist
    const { data: newPage, error: createError } = await supabase
      .from('static_pages')
      .insert({
        slug: pageInfo.slug,
        title: pageInfo.title,
        html_content: html,
        status: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createError) {
      throw new Error(`Failed to create static page: ${createError.message}`)
    }

    pageId = newPage.id
    console.log(`✅ Created new static page: ${pageInfo.slug}`)
  } else {
    pageId = page.id

    // Update the existing page content
    const { error: updateError } = await supabase
      .from('static_pages')
      .update({
        html_content: html,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId)

    if (updateError) {
      throw new Error(`Failed to update static page: ${updateError.message}`)
    }

    console.log(`✅ Updated static page: ${pageInfo.slug}`)
  }

  return {
    fileName,
    slug: pageInfo.slug,
    success: true
  }
}
