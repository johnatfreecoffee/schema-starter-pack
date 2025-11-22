import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an email template generator. Create professional, responsive HTML email templates with proper structure.

IMPORTANT: ALL email templates MUST include a header section with the company logo/icon and a divider line. Use this structure:

<div style="text-align: center; padding: 30px 20px; background-color: #f9fafb; border-bottom: 3px solid #e5e7eb;">
  <img src="{{company_icon_url}}" alt="{{company_name}} Logo" style="max-width: 120px; height: auto; margin-bottom: 10px;" />
</div>

Then add your email content below the header.
            
Available template variables:
- {{first_name}}, {{last_name}}, {{email}}, {{phone}}
- {{company_name}}, {{company_email}}, {{company_phone}}, {{company_address}}, {{company_icon_url}}, {{company_logo_url}}
- {{current_date}}, {{current_year}}
- {{account_name}}, {{invoice_number}}, {{amount_due}}, {{due_date}}
- {{task_title}}, {{task_due_date}}, {{task_priority}}
- {{project_name}}, {{project_status}}, {{user_name}}

Use these variables where appropriate in the template.

Return ONLY valid JSON in this exact format:
{
  "name": "template name",
  "subject": "email subject with {{variables}}",
  "body": "full HTML email body with proper tags and {{variables}}",
  "category": "system|marketing|transactional|custom"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_email_template",
              description: "Generate a professional email template",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Short descriptive name for the template"
                  },
                  subject: {
                    type: "string",
                    description: "Email subject line with variables like {{first_name}}"
                  },
                  body: {
                    type: "string",
                    description: "Complete HTML email body with inline styles, proper structure, and variables"
                  },
                  category: {
                    type: "string",
                    enum: ["system", "marketing", "transactional", "custom"],
                    description: "Template category"
                  }
                },
                required: ["name", "subject", "body", "category"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_email_template" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No template generated');
    }

    const template = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(template), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-email-template:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate template' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
