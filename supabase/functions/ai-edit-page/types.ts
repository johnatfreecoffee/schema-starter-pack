// ============================================================================
// Type Definitions for AI Edit Page Function
// ============================================================================

export interface CompanyInfo {
  id: string;
  business_name: string;
  business_slogan?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  address_city?: string;
  address_state?: string;
  years_experience?: number;
  logo_url?: string;
  icon_url?: string;
  business_hours?: string;
  service_radius?: number;
  service_radius_unit?: 'miles' | 'km';
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
}

export interface AITraining {
  brand_voice?: string;
  target_audience?: string;
  unique_selling_points?: string;
  mission_statement?: string;
  customer_promise?: string;
  competitive_advantages?: string;
  certifications?: string;
  service_standards?: string;
  competitive_positioning?: string;
  emergency_response?: string;
  project_timeline?: string;
  payment_options?: string;
  service_area_coverage?: string;
}

export interface Theme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

export interface ServiceInfo {
  name: string;
  description?: string;
  base_price?: string;
  duration?: string;
}

export interface CurrentPage {
  html?: string;
  pageType?: string;
}

export interface RequestContext {
  companyInfo: CompanyInfo;
  aiTraining?: AITraining;
  theme?: Theme;
  serviceInfo?: ServiceInfo[];
  currentPage?: CurrentPage;
  siteSettings?: Record<string, unknown>;
}

export interface ConversationTurn {
  command?: string;
  userMessage?: string;
  modelResponse?: string;
  html?: string;
}

export interface GenerationMetrics {
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

export interface ValidationResult {
  complete: boolean;
  issues: string[];
  needsRetry: boolean;
  missingSection?: string;
  lastCompleteSection?: string;
}

export interface PipelineStage {
  name: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
}

export interface StageResult {
  content: string;
  tokens: {
    input: number;
    output: number;
  };
  duration: number;
  debug: {
    fullPrompt: string;
    requestPayload: unknown;
    responseData: unknown;
    generatedHtml: string;
  };
}

export interface CachedContent {
  name: string;
  createTime: string;
  updateTime: string;
  expireTime: string;
}

export interface RequestPayload {
  command: string | {
    text: string;
    mode?: string;
    model?: string;
  };
  mode?: string;
  model?: string;
  conversationHistory?: ConversationTurn[];
  context: RequestContext;
  userId?: string;
  pipeline?: {
    enabled: boolean;
    totalStages: number;
    stages?: Array<{ stage: string; name: string }>;
  };
}

// Constants
export const TOKEN_LIMITS = {
  PLANNING: 4096,
  CONTENT: 16384,
  HTML: 32768,
  STYLING: 65535
} as const;

export const TIMEOUTS = {
  REQUEST_MS: 120_000,
  HARD_DEADLINE_MS: 110_000,
  CACHE_TTL_SECONDS: 3600
} as const;

export const PRICING = {
  INPUT_COST_PER_MILLION: 0.075,
  OUTPUT_COST_PER_MILLION: 0.30,
  CACHED_INPUT_COST_PER_MILLION: 0.01
} as const;
