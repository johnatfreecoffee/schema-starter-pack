// ============================================================================
// Configuration & Constants for AI Edit Page Function
// ============================================================================

// Token limits for each pipeline stage (Grok optimized)
export const TOKEN_LIMITS = {
  PLANNING: 4096,
  CONTENT: 16384,
  HTML: 65536,
  STYLING: 32768,
  SINGLE_SHOT: 8192
} as const;

// Timeout configurations (in milliseconds)
export const TIMEOUTS = {
  REQUEST_MS: 120_000,        // 2 minutes total timeout
  HARD_DEADLINE_MS: 110_000,  // 110 seconds before forcing stop
  CACHE_TTL_SECONDS: 3600     // 1 hour cache TTL
} as const;

// API pricing (Gemini 2.5 Flash)
export const PRICING = {
  INPUT_COST_PER_MILLION: 0.075,
  OUTPUT_COST_PER_MILLION: 0.30,
  CACHED_INPUT_COST_PER_MILLION: 0.01
} as const;

// Temperature settings for different stages (Grok optimized)
export const TEMPERATURES = {
  PLANNING: 0.6,
  CONTENT: 0.8,
  HTML: 0.7,
  STYLING: 0.9,
  VALIDATION: 0.2
} as const;

// Retry configurations
export const RETRIES = {
  MAX_PIPELINE_STAGE: 3,
  MAX_VALIDATION: 2,
  BACKOFF_BASE_MS: 2000,
  BACKOFF_MAX_MS: 16000
} as const;

// History management
export const HISTORY = {
  MAX_TURNS: 5,
  MAX_HTML_PREVIEW_CHARS: 3000
} as const;

// CORS configuration
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict this in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  GEMINI_CACHE: 'https://generativelanguage.googleapis.com/v1beta/cachedContents',
  GEMINI_GENERATE: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent',
  LOVABLE_AI: 'https://ai.gateway.lovable.dev/v1/chat/completions'
} as const;

// Models
export const MODELS = {
  GEMINI_PRO: 'gemini-2.5-pro',
  GEMINI_FLASH: 'google/gemini-2.5-flash',
  GROK: 'grok-4-fast-reasoning' // xAI's fast reasoning model optimized for speed and quality
} as const;

// Validation thresholds
export const THRESHOLDS = {
  SLOW_GENERATION_MS: 40_000,
  CRITICAL_SLOW_MS: 100_000,
  HIGH_COST_USD: 0.05,
  OPTIMAL_COST_USD: 0.02,
  EXCELLENT_GENERATION_MS: 30_000
} as const;

// Database table names
export const TABLES = {
  CACHE_METADATA: 'gemini_cache_metadata',
  RATE_LIMITS: 'rate_limits'
} as const;

// Environment variable keys
export const ENV_KEYS = {
  GEMINI_API_KEY: 'GOOGLE_GEMINI_AI_STUDIO',
  GROK_API_KEY: 'X_AI',
  LOVABLE_API_KEY: 'LOVABLE_API_KEY',
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY'
} as const;
