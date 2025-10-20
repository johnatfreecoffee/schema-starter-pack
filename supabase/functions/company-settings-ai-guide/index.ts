import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Field configurations for each section
const SECTIONS = {
  basic: {
    name: 'Basic Information',
    fields: [
      { name: 'business_name', question: "What's your company name?", type: 'text', required: true },
      { name: 'business_slogan', question: "Do you have a company slogan or tagline?", type: 'text', required: false },
      { name: 'years_experience', question: "How many years has your business been operating?", type: 'number', required: false },
      { name: 'description', question: "How would you describe what your company does?", type: 'text', required: false },
      { name: 'website_url', question: "Do you have a company website?", type: 'url', required: false },
    ]
  },
  contact: {
    name: 'Contact Information',
    fields: [
      { name: 'phone', question: "What's your business phone number?", type: 'phone', required: true },
      { name: 'email', question: "What's your business email address?", type: 'email', required: true },
      { name: 'address_street', question: "What's your street address?", type: 'text', required: false },
      { name: 'address_city', question: "What city are you located in?", type: 'text', required: false },
      { name: 'address_state', question: "What state?", type: 'text', required: false },
      { name: 'address_zip', question: "What's your ZIP code?", type: 'text', required: false },
      { name: 'service_radius', question: "How far do you service from your location (in miles)?", type: 'number', required: false },
    ]
  },
  business: {
    name: 'Business Details',
    fields: [
      { name: 'license_numbers', question: "Do you have any license numbers to add?", type: 'text', required: false },
      { name: 'business_hours', question: "What are your business hours?", type: 'text', required: false },
    ]
  },
  social: {
    name: 'Social Media',
    fields: [
      { name: 'facebook_url', question: "Do you have a Facebook page?", type: 'url', required: false },
      { name: 'instagram_url', question: "Do you have an Instagram account?", type: 'url', required: false },
      { name: 'twitter_url', question: "Do you have a Twitter/X account?", type: 'url', required: false },
      { name: 'linkedin_url', question: "Do you have a LinkedIn page?", type: 'url', required: false },
    ]
  }
};

// Smart extractors for parsing user responses
function extractFieldValue(text: string, fieldType: string) {
  const lowerText = text.toLowerCase();
  
  // Check for negative responses
  if (/^(no|none|nope|n\/a|don't have|skip|not applicable|pass)$/i.test(text.trim())) {
    return 'SKIP';
  }
  
  switch (fieldType) {
    case 'number':
      const numMatch = text.match(/(\d+)/);
      return numMatch ? parseInt(numMatch[1]) : null;
    
    case 'email':
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
      return emailMatch ? emailMatch[0] : null;
    
    case 'phone':
      const cleaned = text.replace(/\D/g, '');
      return cleaned.length >= 10 ? cleaned.slice(-10) : null;
    
    case 'url':
      if (/^(no|none|don't have)/i.test(lowerText)) return 'SKIP';
      const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return urlMatch ? (text.includes('http') ? urlMatch[0] : `https://${urlMatch[1]}`) : null;
    
    case 'text':
    default:
      return text.trim();
  }
}

// Extract all possible fields from a message
function extractAllFields(text: string, allFields: any[]) {
  const extracted: Record<string, any> = {};
  
  for (const field of allFields) {
    const value = extractFieldValue(text, field.type);
    if (value && value !== 'SKIP') {
      extracted[field.name] = value;
    }
  }
  
  return extracted;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { message, sessionId, currentSettings, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get or create session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('ai_guide_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session && action === 'start') {
      // Create new session - get first accessible company_settings row
      const { data: companyData, error: companyError } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (companyError) {
        console.error('Error fetching company settings:', companyError);
        throw new Error('Failed to access company settings');
      }
      
      if (!companyData) {
        throw new Error('No company settings found. Please ensure your company profile is set up.');
      }

      const { data: newSession } = await supabase
        .from('ai_guide_sessions')
        .insert({
          company_id: companyData.id,
          current_section: 'basic',
          current_field_index: 0,
          collected_fields: currentSettings || {},
          skipped_fields: [],
        })
        .select()
        .single();
      
      session = newSession;

      return new Response(
        JSON.stringify({
          sessionId: session.id,
          guidance: `Hey there! I'm your AI guide, and I'm going to help you set up your company profile completely. I'll walk you through everything step by step.

We'll cover:
✓ Basic Information (5 fields)
✓ Contact Information (7 fields)
✓ Business Details (2 fields)
✓ Social Media (4 fields)

I'll ask you one question at a time, and I'll save your answers as we go. You can say "no", "skip", or "I don't have that" for any field.

Ready? Let's start with the basics!

**${SECTIONS.basic.fields[0].question}**`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!session) {
      throw new Error('Session not found');
    }

    // Get current section and field
    const sectionKey = session.current_section;
    const section = SECTIONS[sectionKey as keyof typeof SECTIONS];
    const currentFieldIndex = session.current_field_index;
    const currentField = section.fields[currentFieldIndex];
    
    // Get all fields from all sections for extraction
    const allFields = Object.values(SECTIONS).flatMap(s => s.fields);
    
    // Extract any data from the user's message
    const extractedData = extractAllFields(message, allFields);
    const collectedFields = { ...session.collected_fields };
    const skippedFields = [...session.skipped_fields];
    
    // Update collected fields
    let newFieldsCount = 0;
    for (const [fieldName, value] of Object.entries(extractedData)) {
      if (!collectedFields[fieldName]) {
        collectedFields[fieldName] = value;
        newFieldsCount++;
      }
    }
    
    // Check if current field was answered or skipped
    const currentFieldValue = extractFieldValue(message, currentField.type);
    if (currentFieldValue === 'SKIP' && !skippedFields.includes(currentField.name)) {
      skippedFields.push(currentField.name);
    } else if (currentFieldValue && currentFieldValue !== 'SKIP' && !collectedFields[currentField.name]) {
      collectedFields[currentField.name] = currentFieldValue;
      newFieldsCount++;
    }

    // Update company settings with new data
    const fieldsToUpdate: Record<string, any> = {};
    for (const [key, value] of Object.entries(collectedFields)) {
      if (value && value !== 'SKIP') {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await supabase
        .from('company_settings')
        .update(fieldsToUpdate)
        .eq('id', session.company_id);
    }

    // Find next unanswered field
    let nextSectionKey = sectionKey;
    let nextFieldIndex = currentFieldIndex + 1;
    let nextField = null;
    
    // Search for next unanswered field
    const sectionOrder = ['basic', 'contact', 'business', 'social'];
    let searchingSectionIndex = sectionOrder.indexOf(sectionKey);
    
    while (searchingSectionIndex < sectionOrder.length) {
      const searchSection = SECTIONS[sectionOrder[searchingSectionIndex] as keyof typeof SECTIONS];
      
      for (let i = (searchingSectionIndex === sectionOrder.indexOf(sectionKey) ? nextFieldIndex : 0); i < searchSection.fields.length; i++) {
        const field = searchSection.fields[i];
        if (!collectedFields[field.name] && !skippedFields.includes(field.name)) {
          nextField = field;
          nextSectionKey = sectionOrder[searchingSectionIndex];
          nextFieldIndex = i;
          break;
        }
      }
      
      if (nextField) break;
      searchingSectionIndex++;
    }

    // Update session
    await supabase
      .from('ai_guide_sessions')
      .update({
        current_section: nextSectionKey,
        current_field_index: nextFieldIndex,
        collected_fields: collectedFields,
        skipped_fields: skippedFields,
        conversation_history: [
          ...session.conversation_history,
          { question: currentField.question, answer: message, timestamp: new Date() }
        ],
        completed_at: nextField ? null : new Date(),
      })
      .eq('id', session.id);

    // Build response
    let guidance = '';
    
    // Acknowledge saved data
    if (newFieldsCount > 0) {
      guidance += '✓ **Saved!**\n\n';
    }
    
    if (nextField) {
      // Calculate progress
      const totalFields = Object.values(SECTIONS).reduce((sum, s) => sum + s.fields.length, 0);
      const completedFields = Object.keys(collectedFields).length + skippedFields.length;
      const currentSectionFields = section.fields;
      const currentSectionCompleted = currentSectionFields.filter(f => 
        collectedFields[f.name] || skippedFields.includes(f.name)
      ).length;
      
      // Check if we're starting a new section
      if (nextSectionKey !== sectionKey) {
        const nextSectionInfo = SECTIONS[nextSectionKey as keyof typeof SECTIONS];
        guidance += `\n**${section.name} Complete!** (${currentSectionCompleted}/${currentSectionFields.length} fields)\n\n`;
        guidance += `Now let's move to **${nextSectionInfo.name}**.\n\n`;
      }
      
      guidance += `**Progress:** ${completedFields}/${totalFields} fields complete\n\n`;
      guidance += `**${nextField.question}**`;
      
      if (!nextField.required) {
        guidance += '\n\n(You can say "no" or "skip" if you don\'t have this)';
      }
    } else {
      // All done!
      const totalFields = Object.values(SECTIONS).reduce((sum, s) => sum + s.fields.length, 0);
      guidance = `🎉 **All Done!**\n\nYour company profile is complete! Here's what we set up:\n\n`;
      
      for (const [sKey, sValue] of Object.entries(SECTIONS)) {
        const sFields = sValue.fields;
        const completed = sFields.filter(f => collectedFields[f.name]).length;
        guidance += `**${sValue.name}**: ${completed}/${sFields.length} fields\n`;
      }
      
      guidance += `\n**Total**: ${Object.keys(collectedFields).length}/${totalFields} fields completed\n\n`;
      guidance += `Your company settings have been saved. You can close this guide or update any information by using the form directly.`;
    }

    return new Response(
      JSON.stringify({ guidance, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in company-settings-ai-guide:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
