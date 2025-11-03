import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface UpdateRequest {
  table: string;
  data: {
    id: string;
    updates: Record<string, any>;
  } | {
    id: string;
    updates: Record<string, any>;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify API key
    const authHeader = req.headers.get('Authorization');
    const apiKey = Deno.env.get('LOCAL_DATABASE_KEY_API');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const providedKey = authHeader.replace('Bearer ', '');
    if (providedKey !== apiKey) {
      console.error('Invalid API key');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse request body with better error handling
    let body: UpdateRequest;
    try {
      body = await req.json();
    } catch (jsonError) {
      const message = jsonError instanceof Error ? jsonError.message : String(jsonError);
      console.error('Invalid JSON in request body:', message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON format. Make sure HTML content is properly escaped. Tip: In Make.com, use the JSON builder and ensure strings are properly encoded.',
          details: message
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    const { table, data } = body;

    if (!table || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: table and data' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle single or multiple updates
    const updates = Array.isArray(data) ? data : [data];
    const results = [];
    const errors = [];

    for (const update of updates) {
      const { id, updates: columnUpdates } = update;

      if (!id || !columnUpdates) {
        errors.push({ id, error: 'Missing id or updates' });
        continue;
      }

      console.log(`Updating ${table} record ${id}:`, columnUpdates);

      const { data: result, error } = await supabaseClient
        .from(table)
        .update(columnUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Error updating ${table} record ${id}:`, error);
        errors.push({ id, error: error.message });
      } else {
        console.log(`Successfully updated ${table} record ${id}`);
        results.push({ id, success: true, data: result });
      }
    }

    const response = {
      success: errors.length === 0,
      updated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: errors.length === 0 ? 200 : 207, // 207 = Multi-Status
        headers: corsHeaders 
      }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Webhook error:', message, error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
