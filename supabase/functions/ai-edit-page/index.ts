import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { validateRequest, validateEnvironment, RequestValidationError } from './validators/request-validator.ts';
import { CORS_HEADERS, TIMEOUTS, THRESHOLDS, RETRIES } from './config.ts';

const corsHeaders = CORS_HEADERS;

// Validate environment on startup
validateEnvironment();

const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_AI_STUDIO');

// ========================================================================
// PHASE 5: VALIDATION & ERROR HANDLING
// Ensures output quality, provides fallbacks, graceful degradation
// ========================================================================

function validateHTML(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const trimmed = html.trim();

  // Must be content-only HTML starting with <div id="ai-section-..."> or <main>
  const validStarts = /^<(div\s+id="ai-section-|main[\s>])/i;
  if (!validStarts.test(trimmed)) {
    errors.push('Output must start with <div id="ai-section-..."> or <main> (content-only HTML)');
  }

  // Must NOT include full document or site-level tags
  const forbidden = ['<!DOCTYPE', '<html', '<head', '<body', '<header', '<footer'];
  for (const tag of forbidden) {
    if (trimmed.toLowerCase().includes(tag)) {
      errors.push(`Forbidden tag present: ${tag}`);
    }
  }

  // Check for markdown code blocks
  if (trimmed.includes('```')) {
    errors.push('Contains markdown code blocks (should be pure HTML)');
  }

  // Handlebars balance check
  const openBraces = (trimmed.match(/\{\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unclosed Handlebars syntax (${openBraces} open, ${closeBraces} close)`);
  }

  // Check for incomplete Handlebars at end
  if (/\{\{[^}]*$/.test(trimmed)) {
    errors.push('Incomplete Handlebars expression at end of output');
  }

  return { valid: errors.length === 0, errors };
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
  provider: 'lovable' | 'grok' | 'gemini';
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
  // Lovable AI (Gemini 2.5 Flash) pricing estimation
  // Note: Actual pricing may vary, these are approximate values
  const inputCostPerMillion = 0.075; // Gemini 2.5 Flash input cost
  const outputCostPerMillion = 0.30; // Gemini 2.5 Flash output cost
  const cachedInputCostPerMillion = 0.01; // Estimated cache discount
  
  const regularInputCost = ((inputTokens - cachedTokens) / 1_000_000) * inputCostPerMillion;
  const cachedCost = (cachedTokens / 1_000_000) * cachedInputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;
  
  return regularInputCost + cachedCost + outputCost;
}

function logMetrics(metrics: GenerationMetrics) {
  console.log('=== GENERATION METRICS ===');
  console.log(JSON.stringify(metrics, null, 2));
  
  const providerName = metrics.provider === 'grok' ? 'Grok 4' : 'Lovable AI (Gemini)';
  console.log(`Using AI Provider: ${providerName}`);
  
  // Warnings based on thresholds
  if (metrics.duration && metrics.duration > 40000) {
    console.warn(`⚠️ SLOW GENERATION: ${(metrics.duration/1000).toFixed(1)}s (target: <40s)`);
  }
  
  if (metrics.duration && metrics.duration > 100000) {
    console.error(`❌ CRITICAL SLOW GENERATION: ${(metrics.duration/1000).toFixed(1)}s (approaching timeout)`);
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
  
  if (metrics.cost && metrics.cost < 0.02) {
    console.log('✅ OPTIMAL COST: Low cost generation');
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

// ========================================================================
// MULTI-STAGE PIPELINE: Sequential AI Calls for Better Quality
// ========================================================================

function formatChatHistoryForLLM(
  history: ConversationTurn[],
  currentRequest: string,
  currentPageHtml?: string,
  pageType?: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  for (const turn of history) {
    const userMessage = turn.userMessage || turn.command;
    if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
    }
    
    if (turn.modelResponse || turn.html) {
      const response = turn.modelResponse || `Generated HTML (${(turn.html || '').length} chars)`;
      messages.push({ role: 'assistant', content: response });
    }
  }
  
  let currentMessage = `USER REQUEST: ${currentRequest}\n`;
  if (currentPageHtml) {
    currentMessage += `\nCURRENT PAGE HTML (first 3000 chars):\n${currentPageHtml.substring(0, 3000)}\n`;
  }
  if (pageType) {
    currentMessage += `\nPAGE TYPE: ${pageType}\n`;
  }
  
  messages.push({ role: 'user', content: currentMessage });
  return messages;
}

function pruneConversationHistory(history: ConversationTurn[], maxTurns: number = 5): ConversationTurn[] {
  if (history.length <= maxTurns) return history;
  const pruned = history.slice(-maxTurns);
  console.log(`🔄 Pruned: ${history.length} → ${pruned.length} turns`);
  return pruned;
}

interface PipelineStage {
  name: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
}

interface StageResult {
  content: string;
  tokens: { input: number; output: number };
  duration: number;
  debug: {
    fullPrompt: string;
    requestPayload: any;
    responseData: any;
    generatedHtml: string;
  };
}

// Stage 1: Planning - Create structure and outline
function buildPlanningStage(userRequest: string, context: any): PipelineStage {
  const prompt = `${userRequest}

You are a world-class web design strategist. Using the company context provided above, create a comprehensive plan for a STUNNING, conversion-focused page that showcases this brand's unique value.

Design a page structure that:
- Captivates visitors within 3 seconds with visual impact
- Tells a compelling brand story using the company's voice and positioning
- Guides users naturally toward conversion with strategic CTAs
- Incorporates modern design trends (gradients, micro-interactions, depth)
- Leverages the company's service areas, guarantees, and differentiators

OUTPUT EXACTLY THIS JSON (no markdown):
{
  "pageGoal": "Primary purpose tied to company positioning",
  "targetAudience": "Specific audience based on service areas and customer profile",
  "keyMessage": "Magnetic headline that stops scrollers",
  "sections": [
    { "name": "Hero", "purpose": "Emotional hook + credibility", "content": "Key value props, visual elements" },
    { "name": "Services/Features", "purpose": "Show what we do", "content": "Service highlights with benefits" }
  ],
  "ctaStrategy": "Strategic CTA placement with psychological triggers",
  "visualStyle": "Modern, premium aesthetic aligned with brand (colors, mood, interactions)"
}`;

  return {
    name: 'Planning',
    prompt,
    maxTokens: 4096,
    temperature: 0.6
  };
}

// Stage 2: Content - Generate all copy and text
function buildContentStage(planResult: string, context: any): PipelineStage {
  const prompt = `Based on this PLAN:
${planResult}

You are an award-winning copywriter. Transform the plan into MAGNETIC, brand-aligned content using the company context above.

Create copy that:
- Opens with power words that stop scrollers cold
- Weaves storytelling that builds emotional connection
- Uses AIDA (Attention-Interest-Desire-Action) framework
- Incorporates the company's unique voice, guarantees, and differentiators
- Balances SEO optimization with human appeal
- Creates urgency without being pushy
- Uses Handlebars variables: {{company_name}}, {{phone}}, {{years_experience}}, {{address_city}}, etc.

Make every word earn its place. Write copy that makes visitors think "This company gets me."

OUTPUT EXACTLY THIS JSON:
{
  "hero": { "headline": "Magnetic headline", "subheadline": "Compelling promise", "ctaText": "Action-driven CTA" },
  "sections": [
    { "name": "Section", "headline": "Benefit-focused headline", "body": "Persuasive body copy", "items": ["Specific benefits"] }
  ],
  "ctas": ["Primary CTA", "Secondary CTA"]
}`;

  return {
    name: 'Content',
    prompt,
    maxTokens: 16384,
    temperature: 0.8
  };
}

// Stage 3: HTML Structure - Build semantic HTML with content
function buildHTMLStage(planResult: string, contentResult: string, context: any): PipelineStage {
  const prompt = `Using this PLAN:
${planResult}

And this CONTENT:
${contentResult}

You are an expert front-end developer. Transform the content into SEMANTIC, ACCESSIBLE, content-only HTML with Tailwind CSS.

CRITICAL STRUCTURE REQUIREMENT:
- Output MUST start with <main> (no <!DOCTYPE>, <html>, <head>, <body>, <header>, <footer>, <nav>)
- This is page content only that will be embedded in the site shell

Build HTML that includes:
- Semantic HTML5 structure inside <main> using <section>, <article>, <aside>
- ARIA labels and roles for accessibility
- Tailwind utility classes for responsive, mobile-first design
- Container structure prepared for visual enhancements (data attributes for animations)
- Handlebars variables: {{company_name}}, {{phone}}, {{years_experience}}, {{address_city}}, etc.
- Lucide icons with data-lucide="icon-name"
- CTAs with onclick="if(window.openLeadFormModal) window.openLeadFormModal('...')"
- Optimized heading hierarchy (h1 → h2 → h3)
- Images with descriptive alt text and loading="lazy"
- Rich Tailwind classes: gradients (bg-gradient-to-r), shadows (shadow-xl), rounded corners (rounded-2xl)

OUTPUT: Clean HTML snippet starting with <main>, no markdown.`;

  return {
    name: 'HTML',
    prompt,
    maxTokens: 65536,
    temperature: 0.7
  };
}

// Stage 4: Styling & Polish - Add advanced CSS and visual effects
function buildStylingStage(htmlResult: string, context: any): PipelineStage {
  const prompt = `Given this CONTENT-ONLY HTML (starting with <main>):
${htmlResult.substring(0, 6000)}... (truncated)

You are a CSS artist and visual designer. Transform this HTML into a VISUALLY STUNNING masterpiece that rivals award-winning web designs.

CRITICAL: Keep content-only structure (starts with <main>, NO <!DOCTYPE>/<html>/<head>/<body>/<header>/<footer>)

Enhance with ADVANCED Tailwind classes:
- Sophisticated gradients: bg-gradient-to-br from-primary via-accent to-secondary
- Deep shadows: shadow-2xl, hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]
- Smooth transforms: hover:scale-105 transition-all duration-300 ease-out
- Rich spacing: py-16 md:py-24 lg:py-32 for luxurious vertical rhythm
- Premium borders: rounded-3xl border border-white/10 backdrop-blur-sm
- Micro-interactions: group hover effects, animated underlines
- Glass morphism: bg-white/10 backdrop-blur-lg
- Perfect typography: text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight
- Mobile optimization: responsive breakpoints that shine on all devices
- Accessibility: focus:ring-4 focus:ring-primary/50 focus:outline-none

Create a page that makes visitors say "WOW!" Make every element delightful to interact with.

OUTPUT: Enhanced content-only HTML starting with <main>, no markdown.`;

  return {
    name: 'Styling',
    prompt,
    maxTokens: 32768,
    temperature: 0.9
  };
}

// Helper function for exponential backoff delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute a single pipeline stage with retry logic for 503 errors
async function executePipelineStage(
  stage: PipelineStage,
  staticContext: string,
  apiKey: string,
  model: 'gemini' | 'grok' = 'gemini'
): Promise<StageResult> {
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 STAGE ${stage.name.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Max tokens: ${stage.maxTokens}`);
  console.log(`Temperature: ${stage.temperature}`);
  
  const fullPrompt = staticContext + '\n\n' + stage.prompt;
  const messages = [{
    role: 'user' as const,
    content: fullPrompt
  }];
  
  const requestPayload = {
    model: 'google/gemini-2.5-flash',
    max_tokens: stage.maxTokens,
    temperature: stage.temperature,
    messages: [
      {
        role: 'system',
        content: `You are an expert web designer. Always return content-only HTML starting with <main> (no doctype/html/head/body/header/footer). Use Tailwind utilities, Lucide icons (data-lucide), and Handlebars variables.`
      },
      ...messages
    ],
    stream: false
  };

  // Retry logic for 503 errors with exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;
  let response: Response | null = null;
  let data: any = null;

  // Grok model fallback list - try in order
  const grokModelFallbacks = ['grok-beta', 'grok-3-beta', 'grok-4'];
  let modelIndex = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (model === 'grok') {
        // Use X.AI Grok API
        const X_AI_API_KEY = Deno.env.get('X_AI');
        if (!X_AI_API_KEY) {
          throw new Error('X_AI API key not configured');
        }

        // Select model identifier - use fallback if previous attempts failed with 404
        const grokModel = grokModelFallbacks[modelIndex];
        console.log(`Calling Grok API with model: ${grokModel}...`);

        response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${X_AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: grokModel,
            temperature: requestPayload.temperature || 0.7,
            max_tokens: requestPayload.max_tokens || 2000,
            messages: requestPayload.messages,
            stream: false
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || 'Unknown error';
          const errorType = errorData.error?.type || 'unknown';

          // Log detailed error information
          console.error(`❌ Grok API error (${response.status}):`, JSON.stringify({
            model: grokModel,
            status: response.status,
            type: errorType,
            message: errorMessage,
            attempt,
            maxRetries
          }));

          // Handle 404 errors by trying different model identifiers
          if (response.status === 404 && modelIndex < grokModelFallbacks.length - 1) {
            modelIndex++;
            const nextModel = grokModelFallbacks[modelIndex];
            console.log(`⚠️ Model ${grokModel} not found (404). Trying fallback model: ${nextModel}`);
            continue;
          }

          // Handle 503 errors with exponential backoff
          if (response.status === 503 && attempt < maxRetries) {
            const backoffMs = RETRIES.BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
            const cappedBackoff = Math.min(backoffMs, RETRIES.BACKOFF_MAX_MS);
            console.log(`⚠️ Grok API overloaded (503) on attempt ${attempt}/${maxRetries}. Retrying in ${cappedBackoff}ms...`);
            await sleep(cappedBackoff);
            continue;
          }

          throw new Error(`Stage ${stage.name} failed with Grok (${grokModel}): ${response.status} - ${errorMessage}`);
        }

        data = await response.json();
        console.log(`✅ Successfully called Grok API with model: ${grokModel}`);
        break;
      } else {
        // Use Google Gemini API (default)
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: requestPayload.messages.map((m: any) => m.content).join('\n\n') }]
            }
          ],
          generationConfig: {
            temperature: requestPayload.temperature || 0.7,
            maxOutputTokens: requestPayload.max_tokens || 2000,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Unknown error';

        // Special handling for overloaded API - retry with exponential backoff
        if (response.status === 503) {
          if (attempt < maxRetries) {
            const backoffMs = RETRIES.BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
            const cappedBackoff = Math.min(backoffMs, RETRIES.BACKOFF_MAX_MS);
            console.log(`⚠️ API overloaded (503) on attempt ${attempt}/${maxRetries}. Retrying in ${cappedBackoff}ms...`);
            await sleep(cappedBackoff);
            continue; // Retry
          } else {
            throw new Error(`Stage ${stage.name} failed: API overloaded (503) after ${maxRetries} attempts. Please wait a few minutes and try again. Google's Gemini API is experiencing high traffic.`);
          }
        }

        throw new Error(`Stage ${stage.name} failed: ${response.status} - ${errorMessage}`);
      }

      // Success! Parse response and break out of retry loop
      data = await response.json();
      break;
      }
    } catch (error) {
      lastError = error as Error;

      // If it's a 503 error and we have retries left, continue to next iteration
      if ((error as Error).message?.includes('503') && attempt < maxRetries) {
        continue;
      }

      // For other errors or if we're out of retries, throw
      throw error;
    }
  }

  // If we exhausted all retries without success
  if (!data) {
    throw lastError || new Error(`Stage ${stage.name} failed after ${maxRetries} attempts`);
  }
  
  // Parse response based on model
  let content = '';
  if (model === 'grok') {
    content = data.choices?.[0]?.message?.content || '';
  } else {
    content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  const duration = Date.now() - startTime;

  // Check if we got empty content
  if (!content || content.trim().length === 0) {
    console.warn(`⚠️ Stage ${stage.name} returned empty content`);
    throw new Error(`Stage ${stage.name} failed: API returned empty response. The model may be overloaded.`);
  }
  
  // Estimate tokens (Gemini doesn't always provide exact counts)
  const estimatedInputTokens = Math.ceil(fullPrompt.length / 4);
  const estimatedOutputTokens = Math.ceil(content.length / 4);
  
  console.log(`✅ Stage completed in ${(duration / 1000).toFixed(1)}s`);
  console.log(`📊 Input tokens (estimated): ${estimatedInputTokens}`);
  console.log(`📊 Output tokens (estimated): ${estimatedOutputTokens}`);
  console.log(`📝 Output length: ${content.length} chars`);
  console.log('\n📄 STAGE OUTPUT PREVIEW:');
  console.log('─'.repeat(60));
  console.log(content.substring(0, 800) + (content.length > 800 ? '\n... (truncated, full output is ' + content.length + ' chars)' : ''));
  console.log('─'.repeat(60));
  
  return {
    content,
    tokens: {
      input: estimatedInputTokens,
      output: estimatedOutputTokens
    },
    duration,
    debug: {
      fullPrompt,
      requestPayload,
      responseData: data,
      generatedHtml: content
    }
  };
}

// ========================================================================
// VALIDATION & RETRY SYSTEM
// Uses Lovable AI (Gemini Flash) to validate each stage and retry if needed
// ========================================================================

interface ValidationResult {
  complete: boolean;
  issues: string[];
  needsRetry: boolean;
  missingSection?: string;
  lastCompleteSection?: string;
}

// Build validation prompt based on stage
function buildValidationPrompt(
  stageName: string,
  content: string,
  previousStageResult?: string
): string {
  if (stageName === 'Planning') {
    return `Analyze this JSON planning output and determine if it's complete:

${content.substring(0, 3000)}

Check if it contains:
- All required fields: pageGoal, targetAudience, keyMessage, sections[], ctaStrategy, visualStyle
- At least 3-5 sections defined
- Each section has name, purpose, and content
- No placeholder text like "TODO" or "[fill in]"
- Valid JSON structure (no truncation)

Return ONLY this JSON (no other text):
{
  "complete": true/false,
  "issues": ["list of any issues found"],
  "needsRetry": true/false
}`;
  }
  
  if (stageName === 'Content') {
    return `Analyze this JSON content output and determine if it's complete:

${content.substring(0, 3000)}

Check if it contains:
- Hero section with headline, subheadline, ctaText
- All sections from planning stage are present
- Each section has headline, body, and items array
- No placeholder text or empty strings
- Proper use of Handlebars variables
- Valid JSON structure (no truncation at end)

Return ONLY this JSON (no other text):
{
  "complete": true/false,
  "issues": ["list of any issues found"],
  "needsRetry": true/false,
  "missingSection": "name of missing section if any"
}`;
  }
  
  if (stageName === 'HTML') {
    return `Analyze this HTML output and determine if it's complete:

${content.substring(0, 5000)}
... [end preview]

Check if the HTML:
- Starts with <main> tag
- Contains all sections from content stage
- Has closing </main> tag (not truncated)
- Uses Handlebars variables ({{company_name}}, etc.)
- Contains data-lucide icons
- Has CTA buttons with openLeadFormModal
- No placeholder Lorem Ipsum text
- Valid HTML structure

Return ONLY this JSON (no other text):
{
  "complete": true/false,
  "issues": ["list of any issues found"],
  "needsRetry": true/false,
  "lastCompleteSection": "name of last complete section"
}`;
  }
  
  if (stageName === 'Styling') {
    return `Analyze this styled HTML output and determine if it's complete:

${content.substring(0, 5000)}
... [end preview]

Check if the styled HTML:
- Still starts with <main> and ends with </main>
- Contains advanced Tailwind classes (gradients, shadows, transforms)
- Has hover states and animations
- All sections are still present
- No content was accidentally removed
- Valid HTML structure maintained

Return ONLY this JSON (no other text):
{
  "complete": true/false,
  "issues": ["list of any issues found"],
  "needsRetry": true/false
}`;
  }
  
  return '';
}

// Validate stage output using Lovable AI
async function validateStageOutput(
  stageName: string,
  content: string,
  previousStageResult?: string
): Promise<ValidationResult> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('⚠️ Lovable AI not configured, skipping validation');
    return { complete: true, issues: [], needsRetry: false };
  }
  
  const validationPrompt = buildValidationPrompt(stageName, content, previousStageResult);
  
  if (!validationPrompt) {
    return { complete: true, issues: [], needsRetry: false };
  }
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'You are a quality assurance validator. Analyze the provided output and return a JSON response with validation results.'
          },
          {
            role: 'user',
            content: validationPrompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      console.error('Validation API call failed:', response.status);
      return { complete: true, issues: [], needsRetry: false };
    }
    
    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '{"complete": true, "issues": [], "needsRetry": false}';
    
    // Extract JSON from response (handle cases where there's extra text)
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : resultText;
    
    const validationResult = JSON.parse(jsonStr);
    
    return validationResult;
  } catch (error) {
    console.error('Validation error:', error);
    return { complete: true, issues: [], needsRetry: false };
  }
}

// Build continuation prompt for retries
function buildContinuationPrompt(
  stageName: string,
  validation: ValidationResult,
  partialContent: string,
  previousStageResult?: string
): string {
  if (stageName === 'Planning') {
    return `The previous planning attempt was incomplete. Here's what we have so far:
${partialContent}

Please complete the remaining sections of the JSON plan. Focus on: ${validation.issues.join(', ')}
Make sure to include all required fields.`;
  }
  
  if (stageName === 'Content') {
    return `The previous content generation was incomplete. Here's what we have so far:
${partialContent}

Please complete the missing sections: ${validation.missingSection || validation.issues.join(', ')}
Use the same style and tone as the existing content.`;
  }
  
  if (stageName === 'HTML') {
    return `The previous HTML generation was incomplete or truncated. Here's what we have so far:
${partialContent.substring(0, 5000)}... [truncated for brevity]

Please CONTINUE the HTML from where it left off. The last complete section was: ${validation.lastCompleteSection}
Complete the remaining sections and ensure the HTML ends with </main>`;
  }
  
  if (stageName === 'Styling') {
    return `The previous styling attempt was incomplete. Here's the HTML we're enhancing:
${partialContent.substring(0, 5000)}... [truncated for brevity]

Please complete the styling enhancements for all sections, especially: ${validation.issues.join(', ')}`;
  }
  
  return partialContent;
}

// Execute stage with validation and retry logic
async function executeStageWithValidation(
  stage: PipelineStage,
  staticContext: string,
  apiKey: string,
  previousStageResult?: string,
  maxRetries: number = 3,
  model: 'gemini' | 'grok' = 'gemini'
): Promise<StageResult & { validationAttempts: number; validationPassed: boolean }> {
  let attempt = 0;
  let lastResult: StageResult | null = null;
  let accumulatedContent = '';
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`\n🔄 Stage ${stage.name} - Attempt ${attempt}/${maxRetries}`);
    
    // Execute the stage
    const result = await executePipelineStage(stage, staticContext, apiKey, model);
    lastResult = result;
    
    // For HTML/Styling stages, accumulate content if previous attempt was incomplete
    if (attempt > 1 && (stage.name === 'HTML' || stage.name === 'Styling')) {
      accumulatedContent += result.content;
      result.content = accumulatedContent;
    } else {
      accumulatedContent = result.content;
    }
    
    // Validate the output
    console.log(`🔍 Validating stage ${stage.name} output...`);
    const validation = await validateStageOutput(
      stage.name,
      result.content,
      previousStageResult
    );
    
    console.log(`✅ Validation result:`, validation);
    
    if (validation.complete) {
      console.log(`✨ Stage ${stage.name} completed successfully with validation`);
      return {
        ...result,
        validationAttempts: attempt,
        validationPassed: true
      };
    }
    
    // If validation failed but doesn't need retry, throw error
    if (!validation.needsRetry) {
      console.error(`❌ Stage ${stage.name} failed validation (no retry): ${validation.issues.join(', ')}`);
      return {
        ...result,
        validationAttempts: attempt,
        validationPassed: false
      };
    }
    
    // Prepare for retry with continuation prompt
    if (attempt < maxRetries) {
      console.log(`⚠️ Stage incomplete, retrying with continuation...`);
      console.log(`Issues: ${validation.issues.join(', ')}`);
      
      // Update the stage prompt to continue from where it left off
      stage.prompt = buildContinuationPrompt(
        stage.name,
        validation,
        result.content,
        previousStageResult
      );
    }
  }
  
  // If we exhausted retries, return the last attempt
  console.log(`⚠️ Max retries reached for stage ${stage.name}, using last attempt`);
  return {
    ...lastResult!,
    validationAttempts: attempt,
    validationPassed: false
  };
}

// Main multi-stage pipeline executor
async function executeMultiStagePipeline(
  userRequest: string,
  context: any,
  staticContext: string,
  apiKey: string,
  model: 'gemini' | 'grok' = 'gemini'
): Promise<{ html: string; stages: any[]; totalTokens: any; totalDuration: number }> {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 STARTING MULTI-STAGE PIPELINE');
  console.log('='.repeat(70));
  
  const pipelineStartTime = Date.now();
  const stagesData: any[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  
  try {
    // Stage 1: Planning with validation
    console.log('\n🎯 STAGE 1: Planning');
    const planStage = buildPlanningStage(userRequest, context);
    const planResult = await executeStageWithValidation(
      planStage,
      staticContext,
      apiKey,
      undefined,
      3,
      model
    );
    stagesData.push({ 
      name: 'Planning', 
      stage: 'Planning', 
      ...planResult,
      validationAttempts: planResult.validationAttempts,
      validationPassed: planResult.validationPassed
    });
    totalInputTokens += planResult.tokens.input;
    totalOutputTokens += planResult.tokens.output;
    
    // Stage 2: Content with validation
    console.log('\n📝 STAGE 2: Building Content');
    console.log('📥 INPUT FROM PLANNING STAGE:');
    console.log('─'.repeat(60));
    console.log(planResult.content.substring(0, 600) + (planResult.content.length > 600 ? '...' : ''));
    console.log('─'.repeat(60));
    
    const contentStage = buildContentStage(planResult.content, context);
    const contentResult = await executeStageWithValidation(
      contentStage,
      staticContext,
      apiKey,
      planResult.content,
      3,
      model
    );
    stagesData.push({ 
      name: 'Building Content', 
      stage: 'Content', 
      ...contentResult,
      validationAttempts: contentResult.validationAttempts,
      validationPassed: contentResult.validationPassed
    });
    totalInputTokens += contentResult.tokens.input;
    totalOutputTokens += contentResult.tokens.output;
    
    // Stage 3: HTML Structure with validation
    console.log('\n🏗️ STAGE 3: Creating HTML');
    console.log('📥 INPUT FROM CONTENT STAGE:');
    console.log('─'.repeat(60));
    console.log(contentResult.content.substring(0, 600) + (contentResult.content.length > 600 ? '...' : ''));
    console.log('─'.repeat(60));
    
    const htmlStage = buildHTMLStage(planResult.content, contentResult.content, context);
    const htmlResult = await executeStageWithValidation(
      htmlStage,
      staticContext,
      apiKey,
      contentResult.content,
      3,
      model
    );
    stagesData.push({ 
      name: 'Creating HTML', 
      stage: 'HTML', 
      ...htmlResult,
      validationAttempts: htmlResult.validationAttempts,
      validationPassed: htmlResult.validationPassed
    });
    totalInputTokens += htmlResult.tokens.input;
    totalOutputTokens += htmlResult.tokens.output;
    
    // Stage 4: Styling & Polish with validation
    console.log('\n🎨 STAGE 4: Styling & Polish');
    console.log('📥 INPUT FROM HTML STAGE:');
    console.log('─'.repeat(60));
    console.log(htmlResult.content.substring(0, 600) + (htmlResult.content.length > 600 ? '...' : ''));
    console.log('─'.repeat(60));
    
    const stylingStage = buildStylingStage(htmlResult.content, context);
    const stylingResult = await executeStageWithValidation(
      stylingStage,
      staticContext,
      apiKey,
      htmlResult.content,
      2,
      model
    );
    stagesData.push({ 
      name: 'Styling & Polish', 
      stage: 'Styling', 
      ...stylingResult,
      validationAttempts: stylingResult.validationAttempts,
      validationPassed: stylingResult.validationPassed
    });
    totalInputTokens += stylingResult.tokens.input;
    totalOutputTokens += stylingResult.tokens.output;
    
    const totalDuration = Date.now() - pipelineStartTime;
    
    // Calculate validation metrics
    const totalValidationAttempts = stagesData.reduce((sum, stage) => sum + (stage.validationAttempts || 0), 0);
    const allStagesPassed = stagesData.every(stage => stage.validationPassed !== false);
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ PIPELINE COMPLETE');
    console.log('='.repeat(70));
    console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`📊 Total input tokens: ${totalInputTokens}`);
    console.log(`📊 Total output tokens: ${totalOutputTokens}`);
    console.log(`💰 Estimated cost: $${calculateCost(totalInputTokens, totalOutputTokens).toFixed(4)}`);
    console.log(`🔍 Total validation attempts: ${totalValidationAttempts}`);
    console.log(`✅ All stages passed validation: ${allStagesPassed ? 'Yes' : 'No'}`);
    
    // Log individual stage validation results
    stagesData.forEach(stage => {
      const status = stage.validationPassed ? '✅' : '⚠️';
      console.log(`   ${status} ${stage.name}: ${stage.validationAttempts || 1} attempt(s)`);
    });
    
    console.log('='.repeat(70) + '\n');
    
    return {
      html: stylingResult.content,
      stages: stagesData,
      totalTokens: {
        input: totalInputTokens,
        output: totalOutputTokens
      },
      totalDuration
    };
    
  } catch (error: any) {
    console.error('❌ Pipeline failed:', error.message);
    throw new Error(`Multi-stage pipeline failed at stage: ${error.message}`);
  }
}


serve(async (req) => {
  console.log('=== AI-EDIT-PAGE FUNCTION CALLED ===');
  console.log('Request method:', req.method);
  console.log('Timestamp:', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET request for pipeline configuration
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'get-pipeline-config') {
      // Return pipeline configuration metadata
      const pipelineConfig = {
        version: '1.0.0',
        stages: [
          {
            id: 'stage-1',
            name: 'Planning',
            description: 'Create structure and outline',
            model: 'google/gemini-2.5-pro',
            temperature: 0.4,
            maxTokens: 4096,
            validation: {
              enabled: true,
              model: 'google/gemini-2.5-flash',
              maxRetries: 3,
              checks: [
                'All required JSON fields present',
                'At least 3-5 sections defined',
                'No placeholder text',
                'Valid JSON structure'
              ]
            }
          },
          {
            id: 'stage-2',
            name: 'Content Creation',
            description: 'Generate all copy and text',
            model: 'google/gemini-2.5-pro',
            temperature: 0.8,
            maxTokens: 16384,
            validation: {
              enabled: true,
              model: 'google/gemini-2.5-flash',
              maxRetries: 3,
              checks: [
                'Hero section complete',
                'All planned sections present',
                'No placeholder text',
                'Proper Handlebars usage',
                'Valid JSON structure'
              ]
            }
          },
          {
            id: 'stage-3',
            name: 'HTML Structure',
            description: 'Build semantic HTML with content',
            model: 'google/gemini-2.5-pro',
            temperature: 0.2,
            maxTokens: 32768,
            validation: {
              enabled: true,
              model: 'google/gemini-2.5-flash',
              maxRetries: 3,
              checks: [
                'Starts with <main> tag',
                'All content sections present',
                'Closing </main> tag present',
                'Handlebars variables used',
                'Lucide icons present',
                'CTA modals integrated',
                'No Lorem Ipsum text'
              ],
              features: {
                contentAccumulation: true,
                continueFromLastComplete: true
              }
            }
          },
          {
            id: 'stage-4',
            name: 'Styling & Polish',
            description: 'Add advanced CSS and visual effects',
            model: 'google/gemini-2.5-pro',
            temperature: 0.5,
            maxTokens: 65535,
            validation: {
              enabled: true,
              model: 'google/gemini-2.5-flash',
              maxRetries: 2,
              checks: [
                '<main> tags intact',
                'Advanced Tailwind classes',
                'Hover states present',
                'All sections preserved',
                'Valid HTML structure'
              ]
            }
          }
        ],
        features: {
          selfHealing: true,
          intelligentRetries: true,
          contextPreservation: true,
          tokenLimitHandling: true
        }
      };
      
      return new Response(JSON.stringify(pipelineConfig), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Initialize metrics tracking
  const metrics: GenerationMetrics = {
    startTime: Date.now(),
    command: '',
    mode: 'build',
    provider: 'lovable',
    inputTokens: 0,
    outputTokens: 0,
    cacheEnabled: false,
    multiPass: false,
    timeoutOccurred: false,
    validationPassed: false,
    fallbackUsed: false
  };

  try {
    const requestBody = await req.json();

    // Validate request payload
    let validatedRequest;
    try {
      validatedRequest = validateRequest(requestBody);
    } catch (validationError) {
      if (validationError instanceof RequestValidationError) {
        return new Response(JSON.stringify({
          error: validationError.message,
          errorType: 'ValidationError'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw validationError;
    }

    // Handle new nested command structure with proper fallbacks
    const commandObj = requestBody.command;
    const command = typeof commandObj === 'string'
      ? commandObj
      : (commandObj?.text || '');
    const mode = commandObj?.mode || requestBody.mode || 'build';
    const model = commandObj?.model || requestBody.model || 'lovable';
    const { conversationHistory = [], context = {}, userId, pipeline } = requestBody;
    
    // Log pipeline info if present
    if (pipeline?.enabled) {
      console.log('🔄 Multi-stage Pipeline:', {
        enabled: true,
        totalStages: pipeline.totalStages,
        stages: pipeline.stages?.map((s: any) => `${s.stage}. ${s.name}`)
      });
    }
    
    // Update metrics
    metrics.command = command.substring(0, 100);
    metrics.mode = mode;
    metrics.provider = model === 'grok' ? 'grok' : 'gemini';
    
    console.log('AI Edit Request:', { 
      command: command.substring(0, 200) + (command.length > 200 ? '...' : ''), 
      mode, 
      contextKeys: context ? Object.keys(context) : [],
      promptLength: command.length,
      htmlLength: context?.currentPage?.html?.length || 0
    });
    
    // DEBUG: Log context data
    console.log('\n🔍 CONTEXT DEBUG:');
    console.log('companyInfo received:', context?.companyInfo ? Object.keys(context.companyInfo) : 'MISSING');
    console.log('companyInfo values:', JSON.stringify(context?.companyInfo, null, 2));
    console.log('aiTraining received:', context?.aiTraining ? Object.keys(context.aiTraining) : 'MISSING');
    console.log('siteSettings received:', context?.siteSettings ? Object.keys(context.siteSettings) : 'MISSING');
    
    // Log full command for debugging
    console.log('=== FULL COMMAND START ===');
    console.log(command);
    console.log('=== FULL COMMAND END ===');

    // Environment already validated on startup - safe to use without checks
    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_AI_STUDIO')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    
    // Helper: Build theme context with design system
    const buildThemeContext = (ctx: any): string => {
      const theme = ctx.theme || {};
      
      // Build comprehensive design system object
      const designSystem = {
        colors: {
          primary: theme.primaryColor || '#4A90E2',
          secondary: theme.secondaryColor || '#50E3C2',
          accent: theme.accentColor || '#F5A623',
          text: {
            dark: '#1F2937',
            light: '#F9FAFB'
          },
          background: {
            dark: '#111827',
            light: '#FFFFFF'
          }
        },
        typography: {
          fontFamily: theme.fontFamily || "'Inter', sans-serif"
        }
      };
      
      const parts = ['<theme>'];
      parts.push(JSON.stringify(designSystem, null, 2));
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
    
    const companyId = context?.companyInfo?.id || 'default';
    
    // PHASE 1: System instructions (FREE - not counted in token usage)
const systemInstructions = `
You are an ELITE web designer creating STUNNING, modern websites that look EXPENSIVE and PROFESSIONAL. Every page must be VISUALLY IMPRESSIVE - never plain, never boring, never minimal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN RULES - NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**EVERY PAGE YOU CREATE MUST HAVE:**

✓ Rich gradient backgrounds on hero sections
✓ Deep, professional shadows on ALL cards and buttons  
✓ Rounded corners on EVERY element (minimum 12px border-radius)
✓ Smooth hover effects with transforms
✓ Large, bold typography (48px+ headlines, 18px+ body text)
✓ Generous spacing (80px+ vertical padding between sections)
✓ High-quality images with gradient overlays
✓ Modern font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif

**NEVER CREATE:**

✗ Plain white or gray backgrounds without gradients
✗ Buttons without shadows or gradients
✗ Flat cards with no elevation
✗ Sharp corners (always use border-radius)
✗ Cramped layouts with small padding
✗ Tiny fonts or poor typography hierarchy
✗ Empty image placeholders
✗ Elements without hover states

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 IMAGES - ABSOLUTELY REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CRITICAL: NEVER leave image src empty. ALWAYS use real Unsplash URLs.**

REQUIRED IMAGE FORMAT:
- Hero backgrounds: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
- Service cards: https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop
- Features: https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop
- Backgrounds: https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop

**Search Unsplash for relevant keywords and use REAL photo IDs.**

Examples by industry:
- Construction: photo-1541888946425-d81bb19240f5, photo-1504307651254-35680f356dfd
- Business: photo-1497366216548-37526070297c, photo-1460925895917-afdab827c52f
- Technology: photo-1518770660439-4636190af475, photo-1550751827-4bd374c3f58b
- Healthcare: photo-1505751172876-fa1923c5c528, photo-1576091160550-2173dba999ef
- Real Estate: photo-1560518883-ce09059eeffa, photo-1582407947304-fd86f028f716

EVERY image MUST have:
- Real Unsplash URL (never leave src empty)
- Gradient overlay for hero images: rgba(0,0,0,0.5)
- Border-radius: 16px minimum
- Box-shadow: 0 20px 60px rgba(0,0,0,0.2)
- Alt text describing the image
- loading="lazy" attribute

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 COLOR & CONTRAST - EXACT SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**USE THESE EXACT COLOR COMBINATIONS:**

For dark backgrounds:
- Background: #0f172a, #1e293b, or #111827
- Text: #ffffff or #f8fafc
- Headings: #ffffff

For light backgrounds:
- Background: #ffffff or #f8fafc
- Text: #1e293b or #0f172a
- Headings: #0f172a

For gradients (use liberally):
- Purple: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Blue: linear-gradient(135deg, #667eea 0%, #4299e1 100%)
- Orange: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
- Green: linear-gradient(135deg, #4ade80 0%, #22c55e 100%)

**CRITICAL CONTRAST RULE:**
- White text (#ffffff) ONLY on dark backgrounds (#0f172a or darker)
- Dark text (#0f172a) ONLY on light backgrounds (#ffffff or #f8fafc)
- NEVER use gray text on gray backgrounds

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ OUTPUT FORMAT - CRITICAL TECHNICAL REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**YOUR ENTIRE RESPONSE MUST:**

1. Start with: <div id="ai-section-[8 random characters]">
2. Include scoped <style> block immediately after
3. NO <!DOCTYPE>, <html>, <head>, <body> tags
4. NO external CSS frameworks (Tailwind, Bootstrap)
5. NO CDN links
6. End with closing </div>

**STYLING METHOD:**

Inline styles for base properties:
style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 80px 40px; border-radius: 24px; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"

Scoped <style> for interactions:
<style>
  #ai-section-abc123 .button {
    transition: all 0.3s ease;
  }
  #ai-section-abc123 .button:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  }
</style>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ QUICK-START TEMPLATE - COPY THIS STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<div id="ai-section-xyz789">
<style>
  #ai-section-xyz789 .hero-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    padding: 20px 48px;
    border: none;
    border-radius: 14px;
    font-size: 19px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 15px 40px rgba(102,126,234,0.4);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  #ai-section-xyz789 .hero-button:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 25px 60px rgba(102,126,234,0.6);
  }
  #ai-section-xyz789 .card {
    background: #ffffff;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
  }
  #ai-section-xyz789 .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  @media (max-width: 768px) {
    #ai-section-xyz789 .grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }
</style>

<!-- Hero Section - ALWAYS dramatic and impressive -->
<div style="position: relative; min-height: 600px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 100px 40px; display: flex; align-items: center; justify-content: center; text-align: center;">
  <div style="max-width: 900px; color: #ffffff;">
    <h1 style="font-size: 56px; font-weight: 800; margin-bottom: 24px; line-height: 1.2;">{{headline}}</h1>
    <p style="font-size: 22px; margin-bottom: 40px; opacity: 0.95;">{{subheadline}}</p>
    <button class="hero-button" onclick="openLeadFormModal('Get Started Today')">Get Started Now</button>
  </div>
</div>

<!-- Features Section - Cards with images -->
<div style="padding: 100px 40px; background: #f8fafc;">
  <div style="max-width: 1200px; margin: 0 auto;">
    <h2 style="font-size: 48px; font-weight: 700; text-align: center; color: #0f172a; margin-bottom: 60px;">Our Services</h2>
    <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;">
      
      <div class="card">
        <div style="width: 100%; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop" alt="Service 1" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
        </div>
        <h3 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">{{service1Title}}</h3>
        <p style="font-size: 16px; color: #475569; line-height: 1.6;">{{service1Description}}</p>
      </div>
      
      <div class="card">
        <div style="width: 100%; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop" alt="Service 2" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
        </div>
        <h3 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">{{service2Title}}</h3>
        <p style="font-size: 16px; color: #475569; line-height: 1.6;">{{service2Description}}</p>
      </div>
      
      <div class="card">
        <div style="width: 100%; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop" alt="Service 3" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
        </div>
        <h3 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">{{service3Title}}</h3>
        <p style="font-size: 16px; color: #475569; line-height: 1.6;">{{service3Description}}</p>
      </div>
      
    </div>
  </div>
</div>

<!-- Final CTA Section -->
<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 100px 40px; text-align: center;">
  <h2 style="font-size: 48px; font-weight: 700; color: #ffffff; margin-bottom: 24px;">Ready to Get Started?</h2>
  <p style="font-size: 20px; color: #f8fafc; margin-bottom: 40px; opacity: 0.9;">Contact us today for a free consultation</p>
  <button class="hero-button" onclick="openLeadFormModal('Request Free Consultation')">Contact Us Today</button>
</div>

</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ PAGE STRUCTURE - WHAT TO BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUILD 5-7 SECTIONS IN THIS ORDER:

1. **HERO SECTION** (600px+ height):
   - Full-width gradient background
   - Large headline (56px+)
   - Subheadline (20px+)
   - Primary CTA button with gradient
   - Centered content, 100px vertical padding

2. **FEATURES/SERVICES GRID** (3-4 cards):
   - White background (#f8fafc)
   - Grid layout: repeat(auto-fit, minmax(300px, 1fr))
   - Each card: white, rounded (16px), shadow
   - Images MUST have real Unsplash URLs
   - 40px gap between cards

3. **VALUE PROPOSITION** (alternating sections):
   - Alternate background colors for visual rhythm
   - Large text blocks with images
   - Images with gradient overlays
   - 80px+ vertical padding

4. **TESTIMONIALS/SOCIAL PROOF** (if applicable):
   - Light background (#f8fafc)
   - Card-based layout
   - Profile images (circular, 80px)
   - Star ratings with gradient icons

5. **SECONDARY FEATURES** (detailed info):
   - Dark background with white text OR light with dark text
   - Two-column layout on desktop
   - Images with rounded corners
   - Generous spacing

6. **TRUST INDICATORS** (certifications, badges):
   - Clean white cards
   - Centered layout
   - Logo displays with hover effects

7. **FINAL CTA** (conversion section):
   - Bold gradient background
   - Large headline and CTA
   - 100px+ vertical padding

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔘 BUTTONS - MAKE THEM PERFECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVERY CTA button MUST have:

<button onclick="openLeadFormModal('Custom Header Text')" 
        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
               color: #ffffff; 
               padding: 20px 48px; 
               border: none; 
               border-radius: 14px; 
               font-size: 19px; 
               font-weight: 700; 
               cursor: pointer; 
               box-shadow: 0 15px 40px rgba(102,126,234,0.4); 
               transition: all 0.4s ease; 
               font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  Button Text Here
</button>

Plus hover state in <style> block:
#ai-section-XYZ .hero-button:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 25px 60px rgba(102,126,234,0.6);
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 RESPONSIVE DESIGN - MOBILE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALWAYS include these media queries in your <style> block:

@media (max-width: 768px) {
  #ai-section-XYZ h1 { font-size: 36px !important; }
  #ai-section-XYZ h2 { font-size: 32px !important; }
  #ai-section-XYZ .grid { grid-template-columns: 1fr !important; gap: 24px !important; }
  #ai-section-XYZ section { padding: 60px 24px !important; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  #ai-section-XYZ .grid { grid-template-columns: repeat(2, 1fr) !important; }
}

@media (min-width: 1025px) {
  #ai-section-XYZ .grid { grid-template-columns: repeat(3, 1fr) !important; }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FINAL CHECKLIST - VERIFY BEFORE SUBMITTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STRUCTURE:
□ Starts with <div id="ai-section-[8 random chars]">
□ Scoped <style> block immediately after opening div
□ NO <!DOCTYPE>, <html>, <head>, <body>, or external links
□ Handlebars {{variables}} for dynamic content
□ All buttons use onclick="openLeadFormModal('...')"

VISUAL DESIGN:
□ Rich gradients on hero and CTA sections
□ Deep shadows on all cards (0 10px 40px rgba(0,0,0,0.1))
□ Rounded corners everywhere (12px+ border-radius)
□ Transform hover effects on interactive elements
□ Large typography (56px headlines, 18px body)
□ 80-100px vertical padding on sections
□ Professional color contrast verified

IMAGES:
□ ALL images have REAL Unsplash URLs (never empty src)
□ Hero backgrounds have gradient overlays
□ All images have border-radius and box-shadow
□ Alt text on every image
□ loading="lazy" attribute

RESPONSIVE:
□ Mobile breakpoint @media (max-width: 768px)
□ Tablet breakpoint @media (min-width: 769px)
□ Desktop breakpoint @media (min-width: 1025px)
□ Grid layouts adjust for screen size

QUALITY:
□ Looks expensive and professional
□ NOT minimal or plain
□ Strong visual hierarchy
□ Compelling CTAs with gradients
□ Will render identically in preview and production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Remember: Create STUNNING, IMPRESSIVE pages that look like they cost $10,000 to design. Use real images, rich gradients, deep shadows, and generous spacing. Never create plain or boring designs.
`;
    
    // Build static context (cacheable company data, ~3000-5000 tokens)
    const staticContext = `
${buildCriticalContext(context)}
${buildImportantContext(context)}
${buildSupplementaryContext(context)}
${buildServiceContext(context?.serviceInfo)}
${buildThemeContext(context || {})}
`.trim();

    // Build dynamic context (current request, not cached)
    // PHASE 2: No longer concatenate history as text - will use proper multi-turn format
    let dynamicContext = `\nUSER REQUEST: ${command}\n`;
    
    if (context?.currentPage?.html) {
      const htmlPreview = context.currentPage.html.substring(0, 3000);
      dynamicContext += `\nCURRENT PAGE HTML (first 3000 chars):\n${htmlPreview}\n`;
    }
    
    if (context?.currentPage?.pageType) {
      dynamicContext += `\nPAGE TYPE: ${context.currentPage.pageType}\n`;
    }

    // ========================================================================
    // DECIDE: Multi-stage pipeline or single-shot generation
    // Use multi-stage for 'build' mode (new pages)
    // Use single-shot for 'edit' mode (modifications)
    // ========================================================================

    let useMultiStage = mode === 'build';
    let updatedHtml = '';
    let usageMetadata: any = null;
    let pipelineStages: any[] = [];
    
    if (useMultiStage) {
      console.log('🎯 Using MULTI-STAGE PIPELINE for new page generation');
      
      try {
        const pipelineResult = await executeMultiStagePipeline(
          command,
          context,
          staticContext,
          GOOGLE_GEMINI_API_KEY,
          model
        );
        
        updatedHtml = pipelineResult.html;
        pipelineStages = pipelineResult.stages;
        usageMetadata = {
          input_tokens: pipelineResult.totalTokens.input,
          output_tokens: pipelineResult.totalTokens.output
        };
        
        metrics.multiPass = true;
        
      } catch (pipelineError: any) {
        console.error('❌ Multi-stage pipeline failed, falling back to single-shot:', pipelineError.message);
        useMultiStage = false;
      }
    }
    
    // Single-shot generation (for edits or if multi-stage failed)
    if (!useMultiStage || !updatedHtml) {
      console.log('⚡ Using SINGLE-SHOT generation');
      
      const cachedContentName = null;

      // Build proper multi-turn conversation history
      let chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
      
      if (conversationHistory.length > 0) {
        const prunedHistory = pruneConversationHistory(conversationHistory, 5);
        
        chatMessages = formatChatHistoryForLLM(
          prunedHistory,
          command,
          context.currentPage?.html,
          context.currentPage?.pageType
        );
      } else {
        chatMessages = [{
          role: 'user' as const,
          content: dynamicContext
        }];
      }
      
      // Prepend static context to first user message
      if (!cachedContentName && chatMessages.length > 0) {
        const firstUserMessage = chatMessages.find((msg: { role: 'user' | 'assistant'; content: string }) => msg.role === 'user');
        if (firstUserMessage) {
          firstUserMessage.content = staticContext + '\n\n' + firstUserMessage.content;
        }
      }
      
      // Prepare API call - Google Gemini 2.5 Pro only
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?key=${GOOGLE_GEMINI_API_KEY}`;
      
      const requestPayload = {
        contents: [
          {
            role: 'user',
            parts: [{
              text: systemInstructions + '\n\n' + chatMessages.map((m: any) => 
                `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`
              ).join('\n\n')
            }]
          }
        ],
        generationConfig: {
          temperature: 1,
          maxOutputTokens: 8192,
        }
      };
      
      const apiHeaders = {
        'Content-Type': 'application/json',
      };
      
      console.log('Calling Google Gemini 2.5 Pro API...');

      console.log('Request payload structure:', {
        mode: mode,
        conversationTurns: chatMessages.length,
        maxTokens: 8192
      });

      // Retry logic for 503 errors with exponential backoff
      const maxRetries = 3;
      let response: Response | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller.abort();
          metrics.timeoutOccurred = true;
        }, 120000);

        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify(requestPayload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message ||
                                errorData.message ||
                                `Google Gemini API error: ${response.status}`;

            // Special handling for overloaded API - retry with exponential backoff
            if (response.status === 503) {
              if (attempt < maxRetries) {
                const backoffMs = RETRIES.BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
                const cappedBackoff = Math.min(backoffMs, RETRIES.BACKOFF_MAX_MS);
                console.log(`⚠️ API overloaded (503) on attempt ${attempt}/${maxRetries}. Retrying in ${cappedBackoff}ms...`);
                await sleep(cappedBackoff);
                continue; // Retry
              } else {
                console.error('❌ GOOGLE GEMINI API ERROR:', {
                  status: response.status,
                  statusText: response.statusText,
                  errorData: JSON.stringify(errorData, null, 2),
                  maxTokens: 8192
                });
                throw new Error(`${errorMessage} (after ${maxRetries} attempts)`);
              }
            }

            console.error('❌ GOOGLE GEMINI API ERROR:', {
              status: response.status,
              statusText: response.statusText,
              errorData: JSON.stringify(errorData, null, 2),
              maxTokens: 8192
            });
            throw new Error(errorMessage);
          }

          // Success! Break out of retry loop
          break;

        } catch (error: any) {
          if (timeoutId) clearTimeout(timeoutId);

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

          // If it's a 503 error and we have retries left, continue to next iteration
          if (error.message?.includes('503') && attempt < maxRetries) {
            continue;
          }

          // For other errors or if we're out of retries, throw
          throw error;
        }
      }

      // If we exhausted all retries without success
      if (!response || !response.ok) {
        throw new Error('Failed to get valid response after all retry attempts');
      }

      // Parse response
      if (model === 'grok') {
        const grokResponse = await response.json();
        
        if (grokResponse.choices && grokResponse.choices[0]) {
          updatedHtml = grokResponse.choices[0].message.content;
          
          if (grokResponse.usage) {
            usageMetadata = {
              input_tokens: grokResponse.usage.prompt_tokens || 0,
              output_tokens: grokResponse.usage.completion_tokens || 0
            };
          }
        } else {
          throw new Error('Invalid Grok response format');
        }
        
        console.log('Grok response complete. HTML length:', updatedHtml.length);
      } else {
        // Handle streaming OpenAI-compatible response (Lovable AI / Gemini)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const hardDeadline = Date.now() + 110000;
        let buffer = '';

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
            
            if (jsonStr === '[DONE]') {
              break;
            }
            
            try {
              const chunk = JSON.parse(jsonStr);
              const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (text) {
                updatedHtml += text;

                if (updatedHtml.includes('</html>') || Date.now() > hardDeadline) {
                  console.log('⏹️ Early stop: closing </html> detected or deadline reached');
                  try { await reader.cancel(); } catch {}
                  break;
                }
              }
              
              // Track finish reason
              if (chunk.candidates?.[0]?.finishReason) {
                metrics.stopReason = chunk.candidates[0].finishReason;
              }
            } catch (parseError) {
              console.error('Error parsing SSE chunk:', parseError, 'Line:', jsonStr);
            }
          }
        }
        
        // Process remaining buffer
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
              } catch (parseError) {
                console.error('Error parsing final chunk:', parseError);
              }
            }
          }
        }

        console.log('Lovable AI streaming complete. HTML length:', updatedHtml.length);
      }
    }

    // Check if we got empty HTML from streaming
    if (!updatedHtml || updatedHtml.trim().length === 0) {
      console.error('❌ AI returned empty HTML');
      throw new Error('AI generation failed: No content generated. The API may be overloaded. Please try again in a few minutes.');
    }

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
    
    // Ensure Tailwind CSS is present (for validation + styling)
    if (!updatedHtml.includes('cdn.tailwindcss.com')) {
      updatedHtml = updatedHtml.replace('<head>', '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
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
      metrics.inputTokens = usageMetadata.input_tokens || 0;
      metrics.outputTokens = usageMetadata.output_tokens || 0;
      metrics.cachedTokens = 0; // Lovable AI caching handled differently
      
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
        provider: metrics.provider,
        cacheHit: false,
        multiStage: useMultiStage,
        stages: pipelineStages.length > 0 ? pipelineStages.map(s => ({
          stage: s.stage,
          duration: s.duration,
          tokens: s.tokens,
          validationAttempts: s.validationAttempts,
          validationPassed: s.validationPassed
        })) : undefined
      },
      mode,
      debug: pipelineStages.length > 0 ? {
        stages: pipelineStages.map(s => ({
          name: s.name || s.stage,
          fullPrompt: s.debug.fullPrompt,
          requestPayload: s.debug.requestPayload,
          responseData: s.debug.responseData,
          generatedHtml: s.debug.generatedHtml,
          validationAttempts: s.validationAttempts,
          validationPassed: s.validationPassed
        }))
      } : {
        commandLength: command.length,
        htmlLength: updatedHtml.length,
        stopReason: metrics.stopReason
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ ERROR IN AI-EDIT-PAGE FUNCTION ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    logMetrics(metrics);

    // Determine appropriate HTTP status code
    let statusCode = 500; // Default to internal server error
    let userMessage = error.message || 'Unknown error occurred';

    if (error instanceof RequestValidationError) {
      statusCode = 400; // Bad request
    } else if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      statusCode = 503; // Service unavailable
      userMessage = '🔄 Google\'s AI service is temporarily overloaded. Please wait 2-3 minutes and try again. This is not an error with your request.';
    } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      statusCode = 504; // Gateway timeout
      userMessage = 'Request timed out. The AI took too long to generate content. Please try a simpler request or try again later.';
    } else if (error.message?.includes('API') || error.message?.includes('auth')) {
      statusCode = 502; // Bad gateway (upstream API issue)
      userMessage = 'Upstream API error. ' + error.message;
    } else if (error.message?.includes('empty') || error.message?.includes('No content generated')) {
      statusCode = 502; // Bad gateway
      userMessage = 'AI generated no content. The API may be overloaded. Please try again in a few minutes.';
    }

    return new Response(JSON.stringify({
      error: userMessage,
      errorType: error.constructor.name,
      originalError: error.message, // Keep original for debugging
      metrics: {
        duration: metrics.duration,
        timeoutOccurred: metrics.timeoutOccurred
      }
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
