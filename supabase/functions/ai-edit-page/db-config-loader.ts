// Database configuration loader for AI model settings
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

export interface AIModelConfig {
  id: string;
  provider: 'claude' | 'grok' | 'gemini';
  stage: 'planning' | 'content' | 'html' | 'styling';
  model_name: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
}

// In-memory cache for configs (lasts lifetime of function instance)
let configCache: Map<string, AIModelConfig> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Fetch AI model configuration from database with caching
 */
export async function getModelConfig(
  provider: 'gemini' | 'grok' | 'claude' | 'openrouter',
  stage: string
): Promise<AIModelConfig | null> {
  const cacheKey = `${provider}-${stage}`;
  const now = Date.now();

  // Check if cache is valid
  if (configCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    const cached = configCache.get(cacheKey);
    if (cached) {
      console.log(`📦 Using cached config for ${provider}/${stage}`);
      return cached;
    }
  }

  // Fetch from database
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials for config fetch');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('provider', provider)
      .eq('stage', stage.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error) {
      console.error(`❌ Error fetching config for ${provider}/${stage}:`, error);
      return null;
    }

    // Update cache
    if (!configCache) {
      configCache = new Map();
    }
    configCache.set(cacheKey, data);
    cacheTimestamp = now;

    console.log(`✅ Fetched config from DB for ${provider}/${stage}:`, {
      model: data.model_name,
      temp: data.temperature,
      tokens: data.max_tokens
    });

    return data;
  } catch (err) {
    console.error(`❌ Exception fetching config:`, err);
    return null;
  }
}

/**
 * Get all configs for a provider (used for WorkflowVisualizer)
 */
export async function getAllConfigsForProvider(provider: 'gemini' | 'grok' | 'claude' | 'openrouter'): Promise<AIModelConfig[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials for config fetch');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true)
      .order('stage');

    if (error) {
      console.error(`❌ Error fetching all configs for ${provider}:`, error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`❌ Exception fetching all configs:`, err);
    return [];
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearConfigCache() {
  configCache = null;
  cacheTimestamp = 0;
  console.log('🗑️ Config cache cleared');
}
