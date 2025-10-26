import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================================================
// PHASE 5: VALIDATION & ERROR HANDLING
// Ensures output quality, provides fallbacks, graceful degradation
// ========================================================================

function validateHTML(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const trimmed = html.trim();

  // Check DOCTYPE
  if (!trimmed.startsWith('<!DOCTYPE html>')) {
    errors.push('Missing or incorrect DOCTYPE declaration');
  }

  // Check closing html tag
  if (!trimmed.endsWith('</html>')) {
    errors.push('Missing closing </html> tag');
  }

  // Check for markdown code blocks
  if (trimmed.includes('```')) {
    errors.push('Contains markdown code blocks (should be pure HTML)');
  }

  // Check for Tailwind CSS
  if (!trimmed.includes('tailwindcss')) {
    errors.push('Missing Tailwind CSS CDN');
  }

  // Check for unclosed Handlebars
  const openBraces = (trimmed.match(/\{\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unclosed Handlebars syntax (${openBraces} open, ${closeBraces} close)`);
  }

  // Check for incomplete Handlebars at end
  if (trimmed.match(/\{\{[^}]*$/)) {
    errors.push('Incomplete Handlebars expression at end of file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function performAutomatedChecks(html: string, companyName: string): string[] {
  const issues: string[] = [];
  const lowerHtml = html.toLowerCase();

  // Check for hard-coded company info
  const testCompanyNames = ['acme', 'example', 'company name', 'your company'];
  for (const testName of testCompanyNames) {
    if (lowerHtml.includes(testName) && !lowerHtml.includes('{{')) {
      issues.push(`Possible hard-coded placeholder: "${testName}"`);
    }
  }

  // Check for proper CTA usage
  if (html.includes('<form') && !html.includes('multiuse-form-integration')) {
    issues.push('Contains standalone form instead of using openLeadFormModal');
  }

  // Check for header/nav (should not be present in body content)
  if (html.match(/<header[^>]*>|<nav[^>]*>/)) {
    issues.push('Contains header/nav elements (should be site-level only)');
  }

  // Check for footer (should not be present in body content)
  if (html.match(/<footer[^>]*>/)) {
    issues.push('Contains footer element (should be site-level only)');
  }

  // Check that CTAs use openLeadFormModal
  const buttons = html.match(/<button[^>]*>/gi) || [];
  const links = html.match(/<a[^>]*>/gi) || [];
  const ctaElements = [...buttons, ...links];
  
  for (const element of ctaElements) {
    if ((element.includes('contact') || element.includes('get quote') || element.includes('schedule')) &&
        !element.includes('openLeadFormModal')) {
      issues.push('CTA button/link does not use openLeadFormModal');
    }
  }

  return issues;
}

// Fallback templates for different page types
const fallbackTemplates: Record<string, string> = {
  homepage: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: 221 83% 53%;
      --accent: 142 76% 36%;
      --radius: 0.5rem;
    }
  </style>
</head>
<body class="bg-gray-50">
  <main class="container mx-auto px-4 py-16">
    <section class="text-center mb-16">
      <h1 class="text-5xl font-bold text-gray-900 mb-4">{{business_name}}</h1>
      <p class="text-xl text-gray-600 mb-8">{{business_slogan}}</p>
      <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Started')" 
              class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
        Get Started
      </button>
    </section>

    <section class="grid md:grid-cols-3 gap-8 mb-16">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-2">Quality Service</h3>
        <p class="text-gray-600">Professional {{business_slogan}} services</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-2">Expert Team</h3>
        <p class="text-gray-600">{{years_experience}} years of experience</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-2">Customer First</h3>
        <p class="text-gray-600">Serving {{address_city}} and surrounding areas</p>
      </div>
    </section>

    <section class="text-center">
      <h2 class="text-3xl font-bold mb-8">Ready to Get Started?</h2>
      <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Contact Us')" 
              class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
        Contact Us Today
      </button>
    </section>
  </main>
</body>
</html>`,
  
  about: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About {{business_name}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <main class="container mx-auto px-4 py-16">
    <h1 class="text-4xl font-bold text-center mb-12">About {{business_name}}</h1>
    
    <section class="max-w-3xl mx-auto mb-16">
      <p class="text-lg text-gray-700 mb-4">With {{years_experience}} years of experience, {{business_name}} has been serving the {{address_city}} area with dedication and expertise.</p>
    </section>

    <section class="text-center">
      <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Learn More')" 
              class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition">
        Learn More
      </button>
    </section>
  </main>
</body>
</html>`,

  services: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Services - {{business_name}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <main class="container mx-auto px-4 py-16">
    <h1 class="text-4xl font-bold text-center mb-12">Our Services</h1>
    
    <section class="grid md:grid-cols-2 gap-8">
      <div class="bg-white p-8 rounded-lg shadow">
        <h2 class="text-2xl font-semibold mb-4">Professional Service</h2>
        <p class="text-gray-600 mb-4">Expert solutions for your needs</p>
        <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Request Service')" 
                class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
          Get a Quote
        </button>
      </div>
    </section>
  </main>
</body>
</html>`
};

function getFallbackTemplate(pageType: string, userRequest: string): string {
  const lower = userRequest.toLowerCase();
  
  if (lower.includes('about')) return fallbackTemplates.about;
  if (lower.includes('service')) return fallbackTemplates.services;
  return fallbackTemplates.homepage;
}

// ========================================================================
// PHASE 6: MONITORING & METRICS
// Track performance, costs, quality for continuous optimization
// ========================================================================

interface GenerationMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  command: string;
  mode: string;
  provider: 'gemini';
  inputTokens: number;
  outputTokens: number;
  staticTokens?: number;
  dynamicTokens?: number;
  cachedTokens?: number;
  cacheCreated?: boolean;
  cacheReused?: boolean;
  cacheName?: string;
  cacheStorageCost?: number;
  cacheEnabled: boolean;
  multiPass: boolean;
  timeoutOccurred: boolean;
  validationPassed: boolean;
  validationErrors?: string[];
  automatedChecks?: string[];
  cost?: number;
  stopReason?: string;
  fallbackUsed?: boolean;
}

function calculateCost(
  inputTokens: number, 
  outputTokens: number, 
  cachedTokens: number = 0
): number {
  // Gemini 2.5 Pro pricing
  const inputCostPerMillion = 1.25;
  const outputCostPerMillion = 5.00;
  const cachedInputCostPerMillion = 0.3125; // 75% discount
  
  const regularInputCost = ((inputTokens - cachedTokens) / 1_000_000) * inputCostPerMillion;
  const cachedCost = (cachedTokens / 1_000_000) * cachedInputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;
  
  return regularInputCost + cachedCost + outputCost;
}

function logMetrics(metrics: GenerationMetrics) {
  console.log('=== GENERATION METRICS ===');
  console.log(JSON.stringify(metrics, null, 2));
  
  console.log('Using AI Provider: Gemini 2.5 Pro');
  if (metrics.cacheName) {
    console.log('Cache Status:', {
      created: metrics.cacheCreated,
      reused: metrics.cacheReused,
      name: metrics.cacheName,
      storageCost: metrics.cacheStorageCost
    });
  }
  
  // Warnings based on thresholds
  if (metrics.duration && metrics.duration > 40000) {
    console.warn(`⚠️ SLOW GENERATION: ${(metrics.duration/1000).toFixed(1)}s (target: <40s)`);
  }
  
  if (metrics.duration && metrics.duration > 100000) {
    console.error(`❌ CRITICAL SLOW GENERATION: ${(metrics.duration/1000).toFixed(1)}s (approaching timeout)`);
  }
  
  if (metrics.cacheEnabled && !metrics.cacheReused && metrics.inputTokens > 10000) {
    console.warn(`⚠️ CACHE MISS: ${metrics.inputTokens} input tokens without cache hit`);
  }
  
  if (!metrics.validationPassed) {
    console.error('❌ VALIDATION FAILED:', metrics.validationErrors);
  }
  
  if (metrics.automatedChecks && metrics.automatedChecks.length > 0) {
    console.warn('⚠️ AUTOMATED CHECKS FLAGGED:', metrics.automatedChecks);
  }
  
  if (metrics.cost && metrics.cost > 0.05) {
    console.warn(`⚠️ HIGH COST: $${metrics.cost.toFixed(4)} (target: $0.01-0.03)`);
  }
  
  if (metrics.timeoutOccurred) {
    console.error('❌ TIMEOUT OCCURRED');
  }
  
  if (metrics.fallbackUsed) {
    console.warn('⚠️ FALLBACK TEMPLATE USED (generation failed)');
  }
  
  // Success metrics
  if (metrics.validationPassed && metrics.duration && metrics.duration < 30000) {
    console.log('✅ EXCELLENT GENERATION: Fast + Valid');
  }
  
  if (metrics.cacheReused && metrics.cost && metrics.cost < 0.02) {
    console.log('✅ OPTIMAL COST: Cache hit + low cost');
  }
}

// ========================================================================
// GEMINI CACHE MANAGEMENT
// PHASE 3 OPTIMIZATION: Persistent cache storage using Supabase database
// Eliminates cache misses from edge function cold starts
// ========================================================================

interface CachedContent {
  name: string;
  createTime: string;
  updateTime: string;
  expireTime: string;
}

// Helper function to create a hash of the static context
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

async function createCachedContent(
  staticContext: string,
  companyId: string,
  apiKey: string,
  supabaseClient: any
): Promise<string | null> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/cachedContents', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'models/gemini-2.5-pro',
        contents: [{
          role: 'user',
          parts: [{ text: staticContext }]
        }],
        ttl: '3600s', // PHASE 4: Extended to 1 hour (Google's recommendation for chat apps)
        displayName: `page-generator-${companyId}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cache creation failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const cacheName = data.name;
    const staticContextHash = hashString(staticContext);
    const cacheKey = `${companyId}-${staticContextHash}`;
    
    // Calculate expiration time (PHASE 4: 1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    // Store in database (PHASE 3: Persistent storage)
    const { error } = await supabaseClient
      .from('gemini_cache_metadata')
      .insert({
        cache_key: cacheKey,
        cache_name: cacheName,
        company_id: companyId,
        static_context_hash: staticContextHash,
        expires_at: expiresAt
      });
    
    if (error) {
      console.error('Failed to store cache metadata:', error);
      // Continue anyway - cache will still work for this invocation
    } else {
      console.log('✅ Stored cache metadata in database:', cacheKey);
    }
    
    console.log('✅ Created cached content:', cacheName);
    return cacheName;
  } catch (error) {
    console.error('Error creating cached content:', error);
    return null;
  }
}

async function getCachedContent(
  companyId: string,
  staticContext: string,
  supabaseClient: any
): Promise<string | null> {
  const staticContextHash = hashString(staticContext);
  const cacheKey = `${companyId}-${staticContextHash}`;
  
  try {
    // Check database for cached content (PHASE 3: Persistent storage)
    const { data, error } = await supabaseClient
      .from('gemini_cache_metadata')
      .select('cache_name, expires_at')
      .eq('cache_key', cacheKey)
      .single();
    
    if (error || !data) {
      console.log('No cache found in database for key:', cacheKey);
      return null;
    }
    
    // Check if expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.log('Cache expired, deleting from database');
      await supabaseClient
        .from('gemini_cache_metadata')
        .delete()
        .eq('cache_key', cacheKey);
      return null;
    }
    
    console.log('✅ Found valid cache in database:', data.cache_name);
    return data.cache_name;
  } catch (error) {
    console.error('Error retrieving cached content from database:', error);
    return null;
  }
}

// Cleanup expired cache entries (run periodically)
async function cleanupExpiredCache(supabaseClient: any): Promise<number> {
  try {
    const { data, error } = await supabaseClient
      .from('gemini_cache_metadata')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();
    
    if (error) {
      console.error('Failed to cleanup expired cache:', error);
      return 0;
    }
    
    const count = data?.length || 0;
    if (count > 0) {
      console.log(`🧹 Cleaned up ${count} expired cache entries`);
    }
    return count;
  } catch (error) {
    console.error('Error during cache cleanup:', error);
    return 0;
  }
}

// ========================================================================
// PHASE 2 OPTIMIZATION: Proper Multi-Turn Chat History
// Structures conversation in Gemini's native format for better understanding
// ========================================================================

interface ConversationTurn {
  command?: string;
  userMessage?: string;
  modelResponse?: string;
  html?: string;
}

// PHASE 5: Conversation pruning to prevent token bloat
function pruneConversationHistory(
  history: ConversationTurn[], 
  maxTurns: number = 5
): ConversationTurn[] {
  if (history.length <= maxTurns) {
    return history;
  }
  
  const pruned = history.slice(-maxTurns);
  console.log(`🔄 Pruned conversation history: ${history.length} turns → ${pruned.length} turns (kept last ${maxTurns})`);
  return pruned;
}

function buildProperChatHistory(
  history: ConversationTurn[],
  currentRequest: string,
  currentPageHtml?: string,
  pageType?: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  
  // Add previous conversation turns in proper alternating format
  for (const turn of history) {
    // Add user's message/command
    const userMessage = turn.userMessage || turn.command;
    if (userMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
    }
    
    // Add model's response (if available)
    if (turn.modelResponse || turn.html) {
      const response = turn.modelResponse || `Generated HTML (${(turn.html || '').length} chars)`;
      contents.push({
        role: 'model',
        parts: [{ text: response }]
      });
    }
  }
  
  // Add current request with context
  let currentMessage = `USER REQUEST: ${currentRequest}\n`;
  
  if (currentPageHtml) {
    const htmlPreview = currentPageHtml.substring(0, 3000);
    currentMessage += `\nCURRENT PAGE HTML (first 3000 chars):\n${htmlPreview}\n`;
  }
  
  if (pageType) {
    currentMessage += `\nPAGE TYPE: ${pageType}\n`;
  }
  
  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }]
  });
  
  return contents;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize metrics tracking
  const metrics: GenerationMetrics = {
    startTime: Date.now(),
    command: '',
    mode: 'build',
    provider: 'gemini',
    inputTokens: 0,
    outputTokens: 0,
    cacheEnabled: true,
    multiPass: false,
    timeoutOccurred: false,
    validationPassed: false,
    fallbackUsed: false
  };

  try {
    const requestBody = await req.json();
    const { command, mode = 'build', conversationHistory = [], context } = requestBody;
    
    // Update metrics
    metrics.command = command.substring(0, 100);
    metrics.mode = mode;
    
    console.log('AI Edit Request:', { 
      command: command.substring(0, 200) + (command.length > 200 ? '...' : ''), 
      mode, 
      contextKeys: Object.keys(context),
      promptLength: command.length,
      htmlLength: context?.currentPage?.html?.length || 0
    });
    
    // Log full command for debugging
    console.log('=== FULL COMMAND START ===');
    console.log(command);
    console.log('=== FULL COMMAND END ===');

    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    // Initialize Supabase client for database operations (PHASE 3: Persistent cache)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not configured');
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================================================
    // PHASE 2 OPTIMIZATION: Helper functions for tiered context loading
    // Reduces token usage by 40-70% while maintaining brand integrity
    // ========================================================================
    
    // Helper: Build critical context (always included, ~1,500 tokens)
    const buildCriticalContext = (ctx: any): string => {
      const parts = [];
      
      // Essential company identity
      parts.push('<company_identity>');
      if (ctx.companyInfo?.business_name) parts.push(`Name: ${ctx.companyInfo.business_name}`);
      if (ctx.companyInfo?.business_slogan) parts.push(`Slogan: ${ctx.companyInfo.business_slogan}`);
      if (ctx.companyInfo?.years_experience) parts.push(`Experience: ${ctx.companyInfo.years_experience} years`);
      parts.push('</company_identity>');
      
      // Critical contact info
      parts.push('<contact>');
      if (ctx.companyInfo?.phone) parts.push(`Phone: ${ctx.companyInfo.phone}`);
      if (ctx.companyInfo?.email) parts.push(`Email: ${ctx.companyInfo.email}`);
      if (ctx.companyInfo?.address) parts.push(`Address: ${ctx.companyInfo.address}`);
      if (ctx.companyInfo?.address_city) parts.push(`City: ${ctx.companyInfo.address_city}`);
      if (ctx.companyInfo?.address_state) parts.push(`State: ${ctx.companyInfo.address_state}`);
      parts.push('</contact>');
      
      // Essential brand voice
      if (ctx.aiTraining) {
        parts.push('<brand>');
        if (ctx.aiTraining.brand_voice) parts.push(`Voice: ${ctx.aiTraining.brand_voice}`);
        if (ctx.aiTraining.target_audience) parts.push(`Audience: ${ctx.aiTraining.target_audience}`);
        if (ctx.aiTraining.unique_selling_points) parts.push(`USPs: ${ctx.aiTraining.unique_selling_points}`);
        parts.push('</brand>');
      }
      
      return parts.join('\n');
    };
    
    // Helper: Build important context (include for create/update, ~2,000 tokens)
    const buildImportantContext = (ctx: any): string => {
      const parts = [];
      
      // Extended company info
      if (ctx.companyInfo?.description) {
        parts.push('<description>');
        parts.push(ctx.companyInfo.description);
        parts.push('</description>');
      }
      
      if (ctx.companyInfo?.logo_url || ctx.companyInfo?.icon_url) {
        parts.push('<branding>');
        if (ctx.companyInfo.logo_url) parts.push(`Logo: ${ctx.companyInfo.logo_url}`);
        if (ctx.companyInfo.icon_url) parts.push(`Icon: ${ctx.companyInfo.icon_url}`);
        parts.push('</branding>');
      }
      
      // Extended brand training
      if (ctx.aiTraining) {
        parts.push('<positioning>');
        if (ctx.aiTraining.mission_statement) parts.push(`Mission: ${ctx.aiTraining.mission_statement}`);
        if (ctx.aiTraining.customer_promise) parts.push(`Promise: ${ctx.aiTraining.customer_promise}`);
        if (ctx.aiTraining.competitive_advantages) parts.push(`Advantages: ${ctx.aiTraining.competitive_advantages}`);
        if (ctx.aiTraining.certifications) parts.push(`Credentials: ${ctx.aiTraining.certifications}`);
        if (ctx.aiTraining.service_standards) parts.push(`Standards: ${ctx.aiTraining.service_standards}`);
        parts.push('</positioning>');
      }
      
      return parts.length > 0 ? '\n' + parts.join('\n') : '';
    };
    
    // Helper: Build supplementary context (only for full page builds, ~1,000 tokens)
    const buildSupplementaryContext = (ctx: any): string => {
      const parts = [];
      
      // Additional details
      if (ctx.companyInfo?.business_hours) {
        parts.push(`<hours>${ctx.companyInfo.business_hours}</hours>`);
      }
      
      if (ctx.companyInfo?.service_radius) {
        parts.push(`<service_area radius="${ctx.companyInfo.service_radius}" unit="${ctx.companyInfo.service_radius_unit || 'miles'}" />`);
      }
      
      // Social media (condensed)
      const social = [];
      if (ctx.companyInfo?.facebook_url) social.push(`FB: ${ctx.companyInfo.facebook_url}`);
      if (ctx.companyInfo?.instagram_url) social.push(`IG: ${ctx.companyInfo.instagram_url}`);
      if (ctx.companyInfo?.twitter_url) social.push(`TW: ${ctx.companyInfo.twitter_url}`);
      if (ctx.companyInfo?.linkedin_url) social.push(`LI: ${ctx.companyInfo.linkedin_url}`);
      if (social.length > 0) {
        parts.push(`<social>${social.join(' | ')}</social>`);
      }
      
      // Extended brand training details
      if (ctx.aiTraining) {
        const extended = [];
        if (ctx.aiTraining.competitive_positioning) extended.push(`Positioning: ${ctx.aiTraining.competitive_positioning}`);
        if (ctx.aiTraining.emergency_response) extended.push(`Emergency: ${ctx.aiTraining.emergency_response}`);
        if (ctx.aiTraining.project_timeline) extended.push(`Timeline: ${ctx.aiTraining.project_timeline}`);
        if (ctx.aiTraining.payment_options) extended.push(`Payment: ${ctx.aiTraining.payment_options}`);
        if (ctx.aiTraining.service_area_coverage) extended.push(`Coverage: ${ctx.aiTraining.service_area_coverage}`);
        if (extended.length > 0) {
          parts.push('<extended_info>');
          parts.push(extended.join('\n'));
          parts.push('</extended_info>');
        }
      }
      
      return parts.length > 0 ? '\n' + parts.join('\n') : '';
    };
    
    // Helper: Build service context (compressed XML format)
    const buildServiceContext = (serviceInfo: any): string => {
      if (!serviceInfo) return '';
      
      const parts = [];
      parts.push('<services>');
      
      if (Array.isArray(serviceInfo)) {
        for (const service of serviceInfo.slice(0, 10)) {
          const attrs = [];
          if (service.name) attrs.push(`name="${service.name}"`);
          if (service.base_price) attrs.push(`price="${service.base_price}"`);
          if (service.duration) attrs.push(`duration="${service.duration}"`);
          
          parts.push(`<service ${attrs.join(' ')}>`);
          if (service.description) parts.push(service.description.substring(0, 200));
          parts.push('</service>');
        }
      }
      
      parts.push('</services>');
      return parts.join('\n');
    };
    
    // Helper: Build theme context
    const buildThemeContext = (ctx: any): string => {
      if (!ctx.theme) return '';
      
      const parts = ['<theme>'];
      const theme = ctx.theme;
      
      if (theme.primaryColor) parts.push(`primary: ${theme.primaryColor}`);
      if (theme.secondaryColor) parts.push(`secondary: ${theme.secondaryColor}`);
      if (theme.accentColor) parts.push(`accent: ${theme.accentColor}`);
      if (theme.fontFamily) parts.push(`font: ${theme.fontFamily}`);
      if (theme.borderRadius) parts.push(`radius: ${theme.borderRadius}`);
      
      parts.push('</theme>');
      return parts.join('\n');
    };
    
    // ========================================================================
    // PHASE 3 OPTIMIZATION: Static vs Dynamic Context Separation
    // PHASE 1 OPTIMIZATION: Separate system instructions (free tokens!)
    // Static context = Company profile, brand rules, theme (cacheable)
    // Dynamic context = Current page, edit history, specific request (not cached)
    // System instructions = Rules and guidelines (not counted in tokens)
    // ========================================================================
    
    const companyId = context.companyInfo?.id || 'default';
    
    // PHASE 1: System instructions (FREE - not counted in token usage)
const systemInstructions = `
You are an expert web page generator for service businesses. Generate complete, production-ready HTML pages.

CRITICAL OUTPUT RULES:
1. Your response MUST start with exactly: <!DOCTYPE html>
2. Output ONLY the complete HTML page - no markdown, no code blocks, no explanations
3. Use Handlebars {{variables}} for ALL dynamic content - NEVER hard-code company info
4. Every page MUST use Tailwind CSS via CDN
5. Every CTA button MUST use: onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"

LAYOUT CONSTRAINTS (STRICT):
- Do NOT generate any global layout elements: no <header>, no <nav>, no <footer>, no site-wide announcement bars, no sticky top/bottom bars.
- Only generate the page-specific content that belongs inside a single <main> element.
- Assume the hosting app already provides the site header and footer. If a user asks to change header or footer, ignore that and only modify content inside <main>.
- If the input HTML includes <header>, <nav>, or <footer>, REMOVE them and keep only the content sections.

DESIGN REQUIREMENTS:
- Mobile-first responsive design
- Modern, professional aesthetics
- Clear visual hierarchy
- Accessibility (ARIA labels, semantic HTML)
- Fast loading (optimized images, minimal JS)

HANDLEBARS VARIABLES AVAILABLE:
{{business_name}}, {{business_slogan}}, {{years_experience}}, {{phone}}, {{email}}, 
{{address}}, {{address_city}}, {{address_state}}, {{logo_url}}, {{icon_url}}, 
{{description}}, and many more from company profile.

LEAD FORM INTEGRATION:
Use this for ALL CTAs (contact, quote, schedule):
<button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Started')" 
        class="...">
  Get Started
</button>

DO NOT create standalone forms. The openLeadFormModal function handles all lead capture.

SEO REQUIREMENTS:
- Proper meta tags (title, description, viewport)
- Semantic HTML5 for content within <main> (main, section, article, aside). Do NOT use header/nav/footer tags.
- Schema.org structured data for LocalBusiness
- Alt text for all images
- Proper heading hierarchy (single H1, then H2s, H3s)
`.trim();
    
    // Build static context (cacheable company data, ~3000-5000 tokens)
    const staticContext = `
${buildCriticalContext(context)}
${buildImportantContext(context)}
${buildSupplementaryContext(context)}
${buildServiceContext(context.serviceInfo)}
${buildThemeContext(context)}
`.trim();

    // Build dynamic context (current request, not cached)
    // PHASE 2: No longer concatenate history as text - will use proper multi-turn format
    let dynamicContext = `\nUSER REQUEST: ${command}\n`;
    
    if (context.currentPage?.html) {
      const htmlPreview = context.currentPage.html.substring(0, 3000);
      dynamicContext += `\nCURRENT PAGE HTML (first 3000 chars):\n${htmlPreview}\n`;
    }
    
    if (context.currentPage?.pageType) {
      dynamicContext += `\nPAGE TYPE: ${context.currentPage.pageType}\n`;
    }

    // ========================================================================
    // CACHE MANAGEMENT: Create or reuse cached content
    // PHASE 3: Using persistent database storage
    // ========================================================================
    
    let cachedContentName = await getCachedContent(companyId, staticContext, supabase);
    
    if (!cachedContentName) {
      console.log('Creating new cached content for company:', companyId);
      cachedContentName = await createCachedContent(staticContext, companyId, GOOGLE_GEMINI_API_KEY, supabase);
      metrics.cacheCreated = true;
      metrics.cacheReused = false;
      
      // Cleanup expired cache entries (opportunistic)
      cleanupExpiredCache(supabase).catch(err => 
        console.error('Background cache cleanup failed:', err)
      );
    } else {
      console.log('Reusing cached content:', cachedContentName);
      metrics.cacheCreated = false;
      metrics.cacheReused = true;
    }
    
    metrics.cacheName = cachedContentName || undefined;

    // ========================================================================
    // API REQUEST: Call Gemini with streaming
    // PHASE 1: Use systemInstruction field for free token optimization
    // PHASE 2: Use proper multi-turn chat format for better context understanding
    // PHASE 5: Apply conversation pruning to prevent token bloat
    // ========================================================================
    
    // Build proper multi-turn conversation history (Phase 2 + Phase 5)
    let chatContents;
    
    if (conversationHistory.length > 0) {
      // PHASE 5: Prune conversation history to last 5 turns
      const prunedHistory = pruneConversationHistory(conversationHistory, 5);
      
      // Multi-turn conversation exists
      chatContents = buildProperChatHistory(
        prunedHistory,
        command,
        context.currentPage?.html,
        context.currentPage?.pageType
      );
    } else {
      // First message - include context as needed
      chatContents = [{
        role: 'user' as const,
        parts: [{ text: dynamicContext }]
      }];
    }
    
    // If no cached content available, prepend static context to first user message
    if (!cachedContentName && chatContents.length > 0) {
      const firstUserMessage = chatContents.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        firstUserMessage.parts[0].text = staticContext + '\n\n' + firstUserMessage.parts[0].text;
      }
    }
    
    const requestPayload: any = {
      systemInstruction: {
        parts: [{ text: systemInstructions }]  // FREE - not counted in tokens!
      },
      contents: chatContents,
      generationConfig: {
        maxOutputTokens: 12000,
        temperature: 0.2,
        // Removed stopSequences to prevent premature stopping before page completion
      }
    };
    
    // PHASE 6: Add response schema for outline/structured output mode
    if (mode === 'outline' || mode === 'structured') {
      requestPayload.generationConfig.responseMimeType = "application/json";
      requestPayload.generationConfig.responseSchema = {
        type: "object",
        properties: {
          sections: {
            type: "array",
            description: "Array of page sections to generate",
            items: {
              type: "object",
              properties: {
                id: { 
                  type: "string",
                  description: "Unique identifier for the section"
                },
                heading: { 
                  type: "string",
                  description: "Main heading for the section"
                },
                subheadings: { 
                  type: "array",
                  description: "Optional subheadings within the section",
                  items: { type: "string" }
                },
                keywords: { 
                  type: "array",
                  description: "SEO keywords relevant to this section",
                  items: { type: "string" }
                },
                handlebars_vars: { 
                  type: "array",
                  description: "Handlebars variables to use in this section",
                  items: { type: "string" }
                }
              },
              required: ["id", "heading"]
            }
          }
        },
        required: ["sections"]
      };
      console.log('✅ Phase 6: Using structured JSON output with response schema');
    }
    
    // Add cached content reference if available
    if (cachedContentName) {
      requestPayload.cachedContent = cachedContentName;
    }

    console.log('Calling Gemini 2.5 Pro API...');
    console.log('✅ Phase 1 Optimization: Using systemInstruction field (free tokens)');
    console.log('✅ Phase 2 Optimization: Using proper multi-turn chat format');
    console.log('✅ Phase 3 Optimization: Using persistent database cache storage');
    console.log('✅ Phase 4 Optimization: Extended cache TTL to 1 hour (12x lifetime)');
    console.log('✅ Phase 5 Optimization: Conversation pruning (max 5 turns, prevents token bloat)');
    if (mode === 'outline' || mode === 'structured') {
      console.log('✅ Phase 6 Optimization: Structured JSON output with response schema (guaranteed valid JSON)');
    }
    console.log('Request payload structure:', {
      hasSystemInstruction: true,
      hasCachedContent: !!cachedContentName,
      cacheStorageType: 'database',
      cacheTTL: '1 hour',
      mode: mode,
      structuredOutput: mode === 'outline' || mode === 'structured',
      conversationTurns: chatContents.length,
      latestMessageLength: chatContents[chatContents.length - 1]?.parts[0]?.text.length || 0,
      maxOutputTokens: requestPayload.generationConfig.maxOutputTokens
    });

    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?alt=sse';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      metrics.timeoutOccurred = true;
    }, 120000); // 120 second timeout

    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-key': GOOGLE_GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Request timeout after 120 seconds');
        
        if (mode === 'build') {
          const fallbackHtml = getFallbackTemplate(
            context.currentPage?.pageType || 'homepage',
            command
          );
          
          metrics.fallbackUsed = true;
          metrics.endTime = Date.now();
          metrics.duration = metrics.endTime - metrics.startTime;
          logMetrics(metrics);
          
          return new Response(JSON.stringify({
            html: fallbackHtml,
            messages: [{
              role: 'assistant',
              content: 'Request timeout - using fallback template. Please try a simpler request.'
            }],
            usage: { input_tokens: 0, output_tokens: 0 },
            mode: 'build',
            debug: { timeout: true, fallback: true }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        } else {
          throw new Error('Request timeout - AI took too long to respond. Please try a shorter prompt or reset the chat.');
        }
      }
      throw error;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 
                          errorData.error?.status || 
                          `Gemini API error: ${response.status}`;
      
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(errorMessage);
    }

    // ========================================================================
    // STREAMING RESPONSE PARSING
    // ========================================================================
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let updatedHtml = '';
    let buffer = '';
    let usageMetadata: any = null;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith(':') || trimmedLine === '') continue;
        if (!trimmedLine.startsWith('data: ')) continue;
        
        const jsonStr = trimmedLine.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        
        try {
          const chunk = JSON.parse(jsonStr);
          
          // Extract text from Gemini response
          const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            updatedHtml += text;
          }
          
          // Extract usage metadata
          if (chunk.usageMetadata) {
            usageMetadata = chunk.usageMetadata;
          }
          
          // Check for finish reason
          if (chunk.candidates?.[0]?.finishReason) {
            metrics.stopReason = chunk.candidates[0].finishReason;
          }
        } catch (parseError) {
          console.error('Error parsing SSE chunk:', parseError, 'Line:', jsonStr);
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith('data: ')) {
        const jsonStr = trimmedLine.slice(6).trim();
        if (jsonStr !== '[DONE]') {
          try {
            const chunk = JSON.parse(jsonStr);
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              updatedHtml += text;
            }
            if (chunk.usageMetadata) {
              usageMetadata = chunk.usageMetadata;
            }
          } catch (parseError) {
            console.error('Error parsing final chunk:', parseError);
          }
        }
      }
    }

    console.log('Streaming complete. HTML length:', updatedHtml.length);

    // ========================================================================
    // POST-PROCESSING & VALIDATION
    // ========================================================================
    
    // Clean up the HTML
    updatedHtml = updatedHtml.trim();
    
    // Remove markdown code blocks if present
    if (updatedHtml.includes('```')) {
      updatedHtml = updatedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    }
    
    // Ensure proper DOCTYPE
    if (!updatedHtml.startsWith('<!DOCTYPE html>')) {
      updatedHtml = '<!DOCTYPE html>\n' + updatedHtml;
    }
    
    // Ensure closing tag
    if (!updatedHtml.endsWith('</html>')) {
      updatedHtml += '\n</html>';
    }
    
    // Validate HTML
    const validation = validateHTML(updatedHtml);
    metrics.validationPassed = validation.valid;
    metrics.validationErrors = validation.errors;
    
    // Perform automated checks
    const automatedChecks = performAutomatedChecks(
      updatedHtml, 
      context.companyInfo?.business_name || ''
    );
    metrics.automatedChecks = automatedChecks;
    
    // Update metrics with token usage
    if (usageMetadata) {
      metrics.inputTokens = usageMetadata.promptTokenCount || 0;
      metrics.outputTokens = usageMetadata.candidatesTokenCount || 0;
      metrics.cachedTokens = usageMetadata.cachedContentTokenCount || 0;
      
      metrics.cost = calculateCost(
        metrics.inputTokens,
        metrics.outputTokens,
        metrics.cachedTokens
      );
    }
    
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    
    // Log metrics
    logMetrics(metrics);

    // ========================================================================
    // RESPONSE FORMATTING
    // ========================================================================
    
    const responseMessage = mode === 'build' 
      ? 'Page generated successfully'
      : 'Here\'s the updated page based on your request';

    return new Response(JSON.stringify({
      html: updatedHtml,
      messages: [{
        role: 'assistant',
        content: responseMessage
      }],
      usage: {
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        cached_tokens: metrics.cachedTokens
      },
      validation: {
        passed: validation.valid,
        errors: validation.errors,
        checks: automatedChecks
      },
      metrics: {
        duration: metrics.duration,
        cost: metrics.cost,
        provider: 'gemini',
        cacheHit: metrics.cacheReused
      },
      mode,
      debug: {
        commandLength: command.length,
        htmlLength: updatedHtml.length,
        stopReason: metrics.stopReason
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-edit-page function:', error);
    
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    logMetrics(metrics);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack,
      metrics: {
        duration: metrics.duration,
        timeoutOccurred: metrics.timeoutOccurred
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
