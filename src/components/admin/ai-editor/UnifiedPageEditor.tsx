import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CacheHelper } from '@/lib/cacheService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Loader2, Send, Sparkles, Eye, Code, Trash2, AlertCircle, Copy, Check, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import VariablePicker from './VariablePicker';
import Editor from '@monaco-editor/react';
import TruncatedMessage from './TruncatedMessage';
import PreviewIframe from './PreviewIframe';
import { PipelineProgressIndicator } from './PipelineProgressIndicator';
import { callEdgeFunction } from '@/utils/callEdgeFunction';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { renderTemplate } from '@/lib/templateEngine';
import { useUserPreferences } from '@/hooks/useUserPreferences';

// Import AI instruction markdown files
import systemInstructions from '@/templates/ai-instructions/systemInstructions.md?raw';
import imageGenInstructions from '@/templates/ai-instructions/imageGenInstructions.md?raw';
import builderStageInstructionsWithImages from '@/templates/ai-instructions/builderStageInstructionsWithImages.md?raw';
import builderStageInstructionsWithoutImages from '@/templates/ai-instructions/builderStageInstructionsWithoutImages.md?raw';
import researchPrompt from '@/templates/ai-instructions/researchPrompt.md?raw';
import stage1TaskWithImages from '@/templates/ai-instructions/stage1TaskWithImages.md?raw';
import stage2TaskWithImages from '@/templates/ai-instructions/stage2TaskWithImages.md?raw';
import stage3TaskWithImages from '@/templates/ai-instructions/stage3TaskWithImages.md?raw';
import stage4TaskWithImages from '@/templates/ai-instructions/stage4TaskWithImages.md?raw';
import stage1TaskNoImages from '@/templates/ai-instructions/stage1TaskNoImages.md?raw';
import stage2TaskNoImages from '@/templates/ai-instructions/stage2TaskNoImages.md?raw';
import stage3TaskNoImages from '@/templates/ai-instructions/stage3TaskNoImages.md?raw';
import stage4TaskNoImages from '@/templates/ai-instructions/stage4TaskNoImages.md?raw';
import fixInstructions from '@/templates/ai-instructions/fixInstructions.md?raw';

interface UnifiedPageEditorProps {
  open: boolean;
  onClose: () => void;
  service?: any;
  pageType: 'service' | 'static' | 'generated';
  pageTitle: string;
  onSave: (html: string) => Promise<void>;
  initialHtml?: string; // For static pages
  pageId?: string; // For static pages
  fullScreen?: boolean; // New prop to disable Dialog wrapper
}
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestion?: string;
}
const TOKEN_SOFT_LIMIT = 800000;
const TOKEN_HARD_LIMIT = 1000000;

// Helper functions for localStorage with page-specific keys
const getStorageKey = (base: string, pageType: string, pageId?: string) => {
  const identifier = pageId || 'new';
  return `${base}-${pageType}-${identifier}`;
};

// Token estimation for Gemini 2.5 Pro
// Gemini uses ~4 characters per token on average for English text
const estimateTokens = (charCount: number): number => {
  return Math.ceil(charCount / 4);
};

// System instructions baseline token count
// Based on the edge function's system instructions (~37 lines, ~2500 chars)
const getSystemInstructionsLength = (): number => {
  // System instructions from ai-edit-page edge function
  // Approximately 2500 characters
  return 2500;
};

const generateSettingsHash = (companySettings: any, aiTraining: any, siteSettings: any) => {
  const combined = JSON.stringify({ companySettings, aiTraining, siteSettings });
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Normalize a color value from settings into a valid CSS color string
const normalizeCssColor = (val?: string | null): string | undefined => {
  if (!val) return undefined;
  const v = String(val).trim();
  if (v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl') || v.startsWith('oklch') || v.startsWith('color(')) return v;
  // Match formats like "221, 83%, 53%" or "221 83% 53%"
  const parts = v.split(/[ ,]+/).filter(Boolean);
  if (parts.length === 3 && /%$/.test(parts[1]) && /%$/.test(parts[2])) {
    const [h, s, l] = parts;
    return `hsl(${h} ${s} ${l})`;
  }
  // Fallback: return as-is
  return v;
};

const loadChatHistory = (pageType: string, pageId?: string): ChatMessage[] => {
  try {
    const key = getStorageKey('ai-editor-chat-history', pageType, pageId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveChatHistory = (messages: ChatMessage[], pageType: string, pageId?: string) => {
  try {
    const key = getStorageKey('ai-editor-chat-history', pageType, pageId);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save chat history:', e);
  }
};

const loadDebugData = (pageType: string, pageId?: string) => {
  try {
    const key = getStorageKey('ai-editor-debug-data', pageType, pageId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveDebugData = (data: any, pageType: string, pageId?: string) => {
  try {
    const key = getStorageKey('ai-editor-debug-data', pageType, pageId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save debug data:', e);
  }
};

const clearHistory = (pageType: string, pageId?: string) => {
  const chatKey = getStorageKey('ai-editor-chat-history', pageType, pageId);
  const debugKey = getStorageKey('ai-editor-debug-data', pageType, pageId);
  const settingsKey = getStorageKey('ai-editor-settings-hash', pageType, pageId);
  localStorage.removeItem(chatKey);
  localStorage.removeItem(debugKey);
  localStorage.removeItem(settingsKey);
};

const UnifiedPageEditor = ({
  open,
  onClose,
  service,
  pageType,
  pageTitle,
  onSave,
  initialHtml,
  pageId,
  fullScreen = false
}: UnifiedPageEditorProps) => {
  const [user, setUser] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { aiEditorPreferences, saveAiEditorPreferences } = useUserPreferences();
  const [useTestWebhook, setUseTestWebhook] = useState(true);
  
  // Collapsible panel state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [publishedHtml, setPublishedHtml] = useState('');
  const [renderedPreview, setRenderedPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [includeImages, setIncludeImages] = useState(false);
  const [needsResearch, setNeedsResearch] = useState(false);
  const [fixMode, setFixMode] = useState(false);
  const [fixSource, setFixSource] = useState<'draft' | 'published' | null>(null);
  const [pageUrl, setPageUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [currentHtml, setCurrentHtml] = useState('');
  const [previousHtml, setPreviousHtml] = useState('');
  const [isShowingPrevious, setIsShowingPrevious] = useState(false);
  const [debugData, setDebugData] = useState<{
    stages?: Array<{
      name: string;
      fullPrompt?: string;
      requestPayload?: any;
      responseData?: any;
      generatedHtml?: string;
      completed?: boolean;
      current?: boolean;
      debug?: {
        fullPrompt?: string;
        requestPayload?: any;
        responseData?: any;
        generatedHtml?: string;
      };
    }>;
    fullPrompt?: string;
    requestPayload?: any;
    responseData?: any;
    generatedHtml?: string;
  } | null>(null);
  const [pipelineStages, setPipelineStages] = useState<Array<{
    name: string;
    completed: boolean;
    current: boolean;
  }>>([
    { name: 'Planning', completed: false, current: false },
    { name: 'Building Content', completed: false, current: false },
    { name: 'Creating HTML', completed: false, current: false },
    { name: 'Styling & Polish', completed: false, current: false }
  ]);
  const [inputTokenCount, setInputTokenCount] = useState(0);
  const [debugAccordionValue, setDebugAccordionValue] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai-editor-debug-accordion');
    return saved ? JSON.parse(saved) : [];
  });
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: 'content' | 'header' | null }>({});
  const [sendOnEnter, setSendOnEnter] = useState(() => {
    const saved = localStorage.getItem('ai-editor-send-on-enter');
    return saved !== null ? saved === 'true' : true;
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const selectedModel = 'makecom';
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  // Fetch user webhook preference
  const { data: userPreference } = useQuery({
    queryKey: ['user-webhook-preference'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('user_preferences')
        .select('use_test_webhook')
        .eq('user_id', user.id)
        .single();
      
      return data;
    },
    enabled: open
  });

  // Update local state when preference is loaded
  useEffect(() => {
    if (userPreference !== undefined && userPreference !== null) {
      setUseTestWebhook(userPreference.use_test_webhook ?? true);
    }
  }, [userPreference]);

  // Mutation to update webhook preference
  const updateWebhookPreferenceMutation = useMutation({
    mutationFn: async (useTest: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          use_test_webhook: useTest 
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-webhook-preference'] });
    }
  });

  // Load template for service or static page
  const {
    data: template,
    isLoading
  } = useQuery({
    queryKey: ['service-template', service?.id, 'static-page', pageId, pageType, initialHtml],
    queryFn: async () => {
      // For static pages, load draft content from DB
      if (pageType === 'static') {
        console.log('Loading static page template', {
          pageId,
          hasInitialHtml: !!initialHtml
        });
        if (pageId) {
          const {
            data,
            error
          } = await supabase.from('static_pages').select('id, title, content_html_draft, content_html, published_html, url_path, updated_at').eq('id', pageId).single();
          if (error) {
            console.warn('Static page fetch error, falling back to initialHtml:', error.message);
          }
          if (data) {
            // Set page URL
            setPageUrl(data.url_path || '');
            
            // Use published_html as the actual published version (falls back to content_html for legacy)
            const publishedCandidate = data.published_html || data.content_html || '';
            
            // For draft: use content_html_draft if it exists, otherwise use published as fallback
            const draftRaw = data.content_html_draft ?? '';
            const isDraftBlank = !draftRaw || draftRaw.trim().length === 0;
            const htmlToUse = isDraftBlank ? publishedCandidate : draftRaw;
            
            // Store published version separately
            setPublishedHtml(publishedCandidate);
            
            return {
              id: data.id,
              template_html: htmlToUse,
              published_html: publishedCandidate,
              name: data.title || pageTitle,
              template_type: 'static',
              has_unpublished_changes: htmlToUse !== publishedCandidate,
              was_draft_blank: isDraftBlank && !!publishedCandidate
            };
          }
        }
        // Fallback for new pages without database entry
        return {
          id: pageId || 'static',
          template_html: '',  // Start with empty draft for new pages
          published_html: '',
          name: pageTitle,
          template_type: 'static',
          has_unpublished_changes: false
        };
      }
      if (!service?.id) return null;
      
      // Set page URL for service using service object
      if (service?.slug) {
        setPageUrl(`/services/${service.slug}`);
      }
      
      const {
        data: serviceData
      } = await supabase.from('services').select('template_id, templates(id, name, template_html, template_html_draft, template_type)').eq('id', service.id).single();
      if (serviceData?.template_id && serviceData.templates) {
        // Store published version separately
        setPublishedHtml(serviceData.templates.template_html || '');
        // Return draft version if it exists, otherwise fall back to published
        return {
          ...serviceData.templates,
          template_html: serviceData.templates.template_html_draft || serviceData.templates.template_html,
          published_html: serviceData.templates.template_html || '',
          has_unpublished_changes: (serviceData.templates.template_html_draft || serviceData.templates.template_html) !== serviceData.templates.template_html
        };
      }

      // Create default template
      const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; border-radius: 16px; margin-bottom: 40px; }
    h1 { font-size: 3rem; margin: 0 0 1rem; }
    .lead { font-size: 1.25rem; opacity: 0.9; }
    .section { margin: 40px 0; }
    .cta { background: #667eea; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>{{service_name}} in {{city_name}}</h1>
      <p class="lead">{{service_description}}</p>
    </div>
    
    <div class="section">
      <h2>About Our {{service_name}} Services</h2>
      <p>{{local_description}}</p>
    </div>
    
    <div class="section">
      <h2>Contact {{company_name}}</h2>
      <p>Call us at {{company_phone}} for {{service_name}} in {{area_display_name}}</p>
      <p>Email: {{company_email}}</p>
      <a href="#contact" class="cta">Get Started Today</a>
    </div>
  </div>
</body>
</html>`;
      const {
        data: newTemplate,
        error
      } = await supabase.from('templates').insert({
        name: `${service.name} Template`,
        template_html: defaultHtml,
        template_html_draft: defaultHtml,
        template_type: 'service'
      }).select().single();
      if (error) throw error;
      await supabase.from('services').update({
        template_id: newTemplate.id
      }).eq('id', service.id);
      return newTemplate;
    },
    enabled: (!!service?.id || pageType === 'static') && open
  });

  // Load company settings, AI training, and site settings
  const {
    data: companySettings
  } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const {
        data
      } = await supabase.from('company_settings').select('*').single();
      return data;
    },
    enabled: open
  });
  const {
    data: aiTraining
  } = useQuery({
    queryKey: ['ai-training'],
    queryFn: async () => {
      const {
        data
      } = await supabase.from('ai_training').select('*').single();
      return data;
    },
    enabled: open
  });
  // Load only styling tokens from site settings (needed for CSS variables)
  const {
    data: siteSettings
  } = useQuery({
    queryKey: ['site-settings-tokens'],
    queryFn: async () => {
      const {
        data
      } = await supabase
        .from('site_settings')
        .select('primary_color, secondary_color, accent_color, success_color, warning_color, info_color, danger_color, button_border_radius, card_border_radius, icon_stroke_width, icon_background_style, icon_background_padding')
        .maybeSingle();
      return data;
    },
    enabled: open
  });

  // Load service areas for preview data
  const {
    data: serviceAreas
  } = useQuery({
    queryKey: ['service-areas-preview'],
    queryFn: async () => {
      const {
        data
      } = await supabase.from('service_areas').select('*').eq('status', true).limit(1);
      return data;
    },
    enabled: open
  });

  // Load social media links
  const {
    data: socialMedia
  } = useQuery({
    queryKey: ['company-social-media-editor'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase
        .from('company_social_media')
        .select('*, social_media_outlet_types(name, icon_url)')
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });
  useEffect(() => {
    if (template?.template_html !== undefined) {
      const htmlToLoad = template.template_html;
      const pubHtml = (template as any).published_html || '';
      
      console.log('Setting template HTML', {
        loadedLength: htmlToLoad.length,
        publishedLength: pubHtml.length,
        pageType,
        wasDraftBlank: (template as any).was_draft_blank
      });
      
      setTemplateHtml(htmlToLoad);
      setOriginalHtml(htmlToLoad);
      setCurrentHtml(htmlToLoad);
      setPreviousHtml(htmlToLoad);
      
      if (pubHtml) {
        setPublishedHtml(pubHtml);
      }
      
      // Show toast if we auto-loaded published version
      if ((template as any).was_draft_blank) {
        toast({
          title: 'Published page loaded in draft editor',
          description: 'Draft was empty, so the published version was loaded for editing.'
        });
      }
    }
  }, [template, pageType]);

  // Load chat history and debug data on mount (only once)
  useEffect(() => {
    if (open && !hasLoadedHistory.current) {
      const savedChat = loadChatHistory(pageType, pageId);
      const savedDebug = loadDebugData(pageType, pageId);
      
      if (savedChat.length > 0) {
        setChatMessages(savedChat);
      }
      
      if (savedDebug) {
        const hasStages = Array.isArray((savedDebug as any)?.stages) && (savedDebug as any).stages.length > 0;
        const baseDebug: any = {
          fullPrompt: (savedDebug as any).fullPrompt,
          requestPayload: (savedDebug as any).requestPayload,
          responseData: (savedDebug as any).responseData,
          generatedHtml: (savedDebug as any).generatedHtml,
        };
        const stageNames = ["Planning","Building Content","Creating HTML","Styling & Polish"];
        const normalized = hasStages ? savedDebug : {
          ...(savedDebug as any),
          ...baseDebug,
          stages: stageNames.map((name: string) => ({ name, debug: baseDebug })),
        };
        setDebugData(normalized);
      }
      
      hasLoadedHistory.current = true;
      setIsShowingPrevious(false);
    }
    
    // Reset flag when dialog closes
    if (!open) {
      hasLoadedHistory.current = false;
    }
  }, [open, pageType, pageId]);

  // Check for settings changes
  useEffect(() => {
    if (open && companySettings && aiTraining && siteSettings) {
      const currentHash = generateSettingsHash(companySettings, aiTraining, siteSettings);
      const settingsKey = getStorageKey('ai-editor-settings-hash', pageType, pageId);
      const storedHash = localStorage.getItem(settingsKey);
      
      if (storedHash && storedHash !== currentHash) {
        setSettingsChanged(true);
      } else {
        setSettingsChanged(false);
      }
      
      // Update stored hash
      localStorage.setItem(settingsKey, currentHash);
    }
  }, [open, companySettings, aiTraining, siteSettings, pageType, pageId]);

  // Save chat history whenever it changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      saveChatHistory(chatMessages, pageType, pageId);
    }
  }, [chatMessages, pageType, pageId]);

  // Calculate input token count live (for Gemini 2.5 Pro)
  useEffect(() => {
    const systemTokens = estimateTokens(getSystemInstructionsLength());
    const chatHistoryTokens = estimateTokens(
      chatMessages.reduce((sum, msg) => sum + msg.content.length, 0)
    );
    const currentInputTokens = estimateTokens(aiPrompt.length);
    const contextTokens = estimateTokens(currentHtml.length);
    
    // Total: system + history + current input + context
    const total = systemTokens + chatHistoryTokens + currentInputTokens + contextTokens;
    setInputTokenCount(total);
  }, [chatMessages, aiPrompt, currentHtml]);

  // Real-time updates: Listen for webhook responses updating the draft HTML
  useEffect(() => {
    if (!open || !template?.id) return;

    const tableName = pageType === 'static' ? 'static_pages' : 'templates';
    const fieldName = pageType === 'static' ? 'content_html_draft' : 'template_html_draft';
    
    console.log('Setting up realtime subscription', { tableName, id: template.id });

    const channel = supabase
      .channel(`${tableName}-${template.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `id=eq.${template.id}`
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          const newHtml = (payload.new as any)?.[fieldName];
          if (newHtml && newHtml !== currentHtml) {
            console.log('Updating preview with new HTML from webhook');
            setPreviousHtml(currentHtml);
            setCurrentHtml(newHtml);
            setTemplateHtml(newHtml);
            toast({
              title: 'Page updated',
              description: 'Your AI-generated page is ready',
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [open, template?.id, pageType, currentHtml]);

  // Compute displayed HTML based on version toggle
  const displayedHtml = isShowingPrevious ? previousHtml : currentHtml;

  // Update preview when template changes
  useEffect(() => {
    const htmlToRender = displayedHtml;
    if (!htmlToRender) {
      console.log('No htmlToRender yet');
      return;
    }

    // For static and generated pages, process Handlebars variables with actual data
    if (pageType === 'static' || pageType === 'generated') {
      console.log('Setting preview for', {
        pageType,
        length: htmlToRender.length,
        hasSiteSettings: !!siteSettings,
        hasCompanySettings: !!companySettings,
        siteSettingsSample: siteSettings ? {
          primary_color: siteSettings.primary_color,
          button_border_radius: siteSettings.button_border_radius
        } : 'missing',
        companySettingsSample: companySettings ? {
          business_name: companySettings.business_name,
          phone: companySettings.phone
        } : 'missing'
      });
      
      // Always attempt to process Handlebars variables with available data (use sane fallbacks)
      try {
        const templateData = {
          // Company settings (fallback to empty strings)
          business_name: companySettings?.business_name || '',
          business_slogan: companySettings?.business_slogan || '',
          description: companySettings?.description || '',
          years_experience: companySettings?.years_experience || '',
          website_url: companySettings?.website_url || '',
          phone: companySettings?.phone || '',
          email: companySettings?.email || '',
          address: companySettings?.address || '',
          address_street: companySettings?.address_street || '',
          address_unit: companySettings?.address_unit || '',
          address_city: companySettings?.address_city || '',
          address_state: companySettings?.address_state || '',
          address_zip: companySettings?.address_zip || '',
          license_numbers: companySettings?.license_numbers || '',
          service_radius: companySettings?.service_radius || '',
          service_radius_unit: companySettings?.service_radius_unit || 'miles',
          business_hours: companySettings?.business_hours || '',
          
          // Site settings (colors and styling) with robust defaults
          siteSettings: {
            primary_color: normalizeCssColor(siteSettings?.primary_color) || 'hsl(221 83% 53%)',
            secondary_color: normalizeCssColor(siteSettings?.secondary_color) || 'hsl(210 40% 96%)',
            accent_color: normalizeCssColor(siteSettings?.accent_color) || 'hsl(280 65% 60%)',
            success_color: normalizeCssColor(siteSettings?.success_color) || 'hsl(142 71% 45%)',
            warning_color: normalizeCssColor(siteSettings?.warning_color) || 'hsl(38 92% 50%)',
            info_color: normalizeCssColor(siteSettings?.info_color) || 'hsl(221 83% 53%)',
            danger_color: normalizeCssColor(siteSettings?.danger_color) || 'hsl(0 84% 60%)',
            bg_primary_color: normalizeCssColor((siteSettings as any)?.bg_primary_color) || 'hsl(0 0% 100%)',
            bg_secondary_color: normalizeCssColor((siteSettings as any)?.bg_secondary_color) || 'hsl(210 17% 98%)',
            bg_tertiary_color: normalizeCssColor((siteSettings as any)?.bg_tertiary_color) || 'hsl(214 15% 91%)',
            text_primary_color: normalizeCssColor((siteSettings as any)?.text_primary_color) || 'hsl(222 47% 11%)',
            text_secondary_color: normalizeCssColor((siteSettings as any)?.text_secondary_color) || 'hsl(215 14% 34%)',
            text_muted_color: normalizeCssColor((siteSettings as any)?.text_muted_color) || 'hsl(215 9% 61%)',
            border_color: normalizeCssColor((siteSettings as any)?.border_color) || 'hsl(214 32% 91%)',
            card_bg_color: normalizeCssColor((siteSettings as any)?.card_bg_color) || 'hsl(0 0% 100%)',
            feature_color: normalizeCssColor((siteSettings as any)?.feature_color) || 'hsl(217 91% 60%)',
            cta_color: normalizeCssColor((siteSettings as any)?.cta_color) || 'hsl(142 76% 36%)',
            button_border_radius: siteSettings?.button_border_radius || 8,
            card_border_radius: siteSettings?.card_border_radius || 12,
            icon_stroke_width: siteSettings?.icon_stroke_width || 2,
            icon_background_style: siteSettings?.icon_background_style || 'none',
            icon_background_padding: siteSettings?.icon_background_padding || 8,
          },
          
          // Social media and other data
          socialMedia: socialMedia || [],
          aiTraining: aiTraining || {},
          serviceAreas: serviceAreas || [],
        };
        
        console.log('Rendering template with data:', {
          siteSettingsInData: templateData.siteSettings,
          companyInData: {
            business_name: templateData.business_name,
            phone: templateData.phone
          }
        });
        
        const rendered = renderTemplate(htmlToRender, templateData);
        setRenderedPreview(rendered);
      } catch (error) {
        console.error('Template rendering error:', error);
        // Fallback to raw HTML if rendering fails
        setRenderedPreview(htmlToRender);
      }
      return;
    }

    // For service pages, try variable substitution; fallback to raw HTML
    if (htmlToRender && serviceAreas?.[0] && companySettings && service) {
      try {
        const previewData = {
          service_name: service.name,
          service_description: service.description || '',
          service_starting_price: service.starting_price ? `$${(service.starting_price / 100).toFixed(2)}` : 'Contact for pricing',
          city_name: serviceAreas[0].city_name,
          city_slug: serviceAreas[0].city_slug,
          display_name: serviceAreas[0].display_name || serviceAreas[0].city_name,
          area_display_name: serviceAreas[0].display_name || serviceAreas[0].city_name,
          local_description: serviceAreas[0].local_description || '',
          company_name: companySettings.business_name,
          company_phone: companySettings.phone,
          company_email: companySettings.email,
          company_address: companySettings.address
        };
        let rendered = htmlToRender;
        Object.entries(previewData).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          rendered = rendered.replace(regex, String(value));
        });
        setRenderedPreview(rendered);
      } catch (error) {
        console.error('Preview render error:', error);
        setRenderedPreview(htmlToRender);
      }
    } else {
      // Fallback: show raw template without substitution so preview never stays blank
      setRenderedPreview(htmlToRender);
    }
  }, [displayedHtml, serviceAreas, companySettings, service, pageType, isShowingPrevious, siteSettings, socialMedia, aiTraining]);
  const sendToAi = async () => {
    if (!aiPrompt.trim()) return;

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Your session has expired. Please refresh the page and log in again.',
        variant: 'destructive'
      });
      return;
    }

    // Check token limits based on input tokens
    if (inputTokenCount >= TOKEN_HARD_LIMIT) {
      toast({
        title: 'Token Limit Reached',
        description: 'Please reset the chat to continue.',
        variant: 'destructive'
      });
      return;
    }
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: aiPrompt
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const currentCommand = aiPrompt;
    setAiPrompt('');
    setIsAiLoading(true);

    // Prepare request context for debug display
    const requestBody = {
      command: {
        text: currentCommand,
        mode: 'build',
        model: selectedModel
      },
      pipeline: {
        enabled: true,
        stages: [
          { stage: 1, name: "Planning", description: "Analyze requirements and create content strategy" },
          { stage: 2, name: "Building Content", description: "Generate comprehensive page content" },
          { stage: 3, name: "Creating HTML", description: "Convert content to structured HTML" },
          { stage: 4, name: "Styling & Polish", description: "Apply design system and final refinements" }
        ],
        totalStages: 4
      },
      conversationHistory: chatMessages.length > 0 ? chatMessages : undefined,
      context: {
        currentPage: {
          type: pageType,
          url: service ? `/${service.slug}` : '/',
          html: currentHtml
        },
        serviceInfo: service ? {
          name: service.name,
          slug: service.slug,
          description: service.description || service.full_description || '',
          category: service.category,
          starting_price: service.starting_price,
          is_active: service.is_active
        } : null,
        companyInfo: companySettings || {},
        aiTraining: aiTraining || {},
        siteSettings: siteSettings || {},
        socialMedia: socialMedia || [],
        serviceAreas: serviceAreas || [],
        systemInstructions: '' // Will be set below
      },
      userId: user?.id
    };
    
    // systemInstructions is imported from .md file at top of component
    
    // Add systemInstructions to context
    requestBody.context.systemInstructions = systemInstructions;

    // Capture complete HTTP request details
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tkrcdxkdfjeupbdlbcfz.supabase.co';
    const requestContext = {
      http: {
        method: 'POST',
        endpoint: `${supabaseUrl}/functions/v1/ai-edit-page`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer [REDACTED - Token Present]` : '[NOT PRESENT]',
          'apikey': '[REDACTED - Anon Key Present]'
        },
        timeout: '300000ms (5 minutes)'
      },
      body: requestBody,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
        editorVersion: '4.0 (Multi-stage Pipeline)'
      }
    };

    // Show request data immediately in debug panel and reset pipeline stages
    const modelName = 'AI Builder';
    const baseDebug = {
      fullPrompt: `Preparing prompt with:\n\nCommand: ${currentCommand}\nModel: ${modelName}\nPage Type: ${pageType}`,
      requestPayload: requestContext,
      responseData: { status: 'Waiting for Google Gemini 2.5 Pro response...' },
      generatedHtml: 'Waiting for response...'
    };
    const stageNames = ["Planning","Building Content","Creating HTML","Styling & Polish"];
    const stagedDebug = {
      ...baseDebug,
      stages: stageNames.map((name, idx) => ({ 
        name, 
        debug: baseDebug,
        completed: false,
        current: idx === 0
      }))
    };
    setDebugData(stagedDebug);
    
    // Reset pipeline stages to show first stage as current
    setPipelineStages(stageNames.map((name, idx) => ({
      name,
      completed: false,
      current: idx === 0
    })));
    
    try {
      
      // Generate unique pipeline ID for tracking stages
      const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      console.log(`🆔 Pipeline ID: ${pipelineId}`);
      
      // Send payload externally (for full page builds)
      if (selectedModel === 'makecom') {
        console.log('🌐 Sending request to AI Builder');
        
        setIsAiLoading(true);
        setDebugData({
          fullPrompt: `AI Builder processing\n\nCommand: ${currentCommand}`,
          requestPayload: requestContext,
          responseData: { status: 'Sending to AI Builder...' },
          generatedHtml: 'Processing externally...'
        });
        
        try {
          // Prepare Supabase data object
          const supabaseData: any = {
            pageType,
            pageTitle
          };
          
          // Add page-specific database info
          if (pageType === 'service' && service) {
            // For service templates, we update the templates table, not services
            supabaseData.table = 'templates';
            supabaseData.id = template?.id; // This is what the webhook expects
            supabaseData.field = 'template_html_draft'; // Specify which field to update
            supabaseData.serviceId = service.id;
            supabaseData.serviceName = service.name;
            supabaseData.serviceSlug = service.slug;
            supabaseData.templateId = template?.id;
            if (template?.id) {
              supabaseData.templatesTable = 'templates';
              supabaseData.templateRowId = template.id;
              // Add pageId and pageRowId for consistency with static pages
              supabaseData.pageId = template.id;
              supabaseData.pageRowId = template.id;
            }
          } else if (pageType === 'static' && pageId) {
            supabaseData.table = 'static_pages';
            supabaseData.id = pageId; // This is what the webhook expects
            supabaseData.field = 'content_html_draft'; // Specify which field to update
            supabaseData.pageId = pageId;
            supabaseData.pageRowId = pageId;
          }
          
          // Prepare company data (all settings and context)
          // Include icon settings for AI to use in building pages
          const contextInfo = requestBody.context.companyInfo as any;
          const contextSiteSettings = requestBody.context.siteSettings as any;
          const companyData = {
            ...contextInfo,
            siteSettings: {
              // Brand Colors
              primary_color: contextSiteSettings?.primary_color,
              secondary_color: contextSiteSettings?.secondary_color,
              accent_color: contextSiteSettings?.accent_color,
              success_color: contextSiteSettings?.success_color,
              warning_color: contextSiteSettings?.warning_color,
              info_color: contextSiteSettings?.info_color,
              danger_color: contextSiteSettings?.danger_color,
              
              // Website Palette Colors
              bg_primary_color: contextSiteSettings?.bg_primary_color,
              bg_secondary_color: contextSiteSettings?.bg_secondary_color,
              bg_tertiary_color: contextSiteSettings?.bg_tertiary_color,
              text_primary_color: contextSiteSettings?.text_primary_color,
              text_secondary_color: contextSiteSettings?.text_secondary_color,
              text_muted_color: contextSiteSettings?.text_muted_color,
              border_color: contextSiteSettings?.border_color,
              card_bg_color: contextSiteSettings?.card_bg_color,
              feature_color: contextSiteSettings?.feature_color,
              cta_color: contextSiteSettings?.cta_color,
              
              // Design Tokens
              button_border_radius: contextSiteSettings?.button_border_radius,
              card_border_radius: contextSiteSettings?.card_border_radius,
              icon_stroke_width: contextSiteSettings?.icon_stroke_width || 2,
              icon_background_style: contextSiteSettings?.icon_background_style || 'none',
              icon_background_padding: contextSiteSettings?.icon_background_padding || 8,
            }
          };
          
          // systemInstructions is imported from .md file at top of component
          
          // Validate Fix Mode requirements
          if (fixMode && !fixSource) {
            toast({
              variant: "destructive",
              title: "❌ Selection Required",
              description: "Please select Draft or Published before sending in Fix Mode",
            });
            return;
          }

          // Get existing HTML based on fix source
          const existingHtml = fixMode && fixSource 
            ? (fixSource === 'draft' ? currentHtml : publishedHtml)
            : undefined;

          // Prepare webhook payload
          const webhookPayload: any = {
            companyData,
            socialMedia: socialMedia || [],
            aiTraining: requestBody.context.aiTraining || {},
            systemInstructions,
            userPrompt: currentCommand,
            supabaseData,
            includeImages: fixMode ? false : includeImages,
            needsResearch,
            fixMode,
            htmlSource: fixSource,
            existingHtml,
            // AI instruction files
            instructions: {
              imageGenInstructions,
              builderStageInstructionsWithImages,
              builderStageInstructionsWithoutImages,
              researchPrompt,
              stage1TaskWithImages,
              stage2TaskWithImages,
              stage3TaskWithImages,
              stage4TaskWithImages,
              stage1TaskNoImages,
              stage2TaskNoImages,
              stage3TaskNoImages,
              stage4TaskNoImages,
              fixInstructions,
            }
          };
          
          // Get webhook URL from secrets
          const response = await callEdgeFunction<any>({
            name: 'send-makecom-webhook',
            body: { ...webhookPayload, useTestWebhook },
            timeoutMs: 60000, // 1 minute timeout
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          toast({
            title: "✨ Request sent",
            description: "Your page is being processed",
          });
          
          // Add system message about wait time
          const systemMessage: ChatMessage = {
            role: 'system',
            content: '⏳ **Please wait 15-30 minutes for your page to be built.**\n\nYour page will automatically appear in the preview when ready. You can leave this screen and return later, or stay here and continue working. We\'ll notify you when the build is complete.'
          };
          setChatMessages(prev => [...prev, systemMessage]);
          
          setDebugData({
            fullPrompt: `AI Builder request sent successfully`,
            requestPayload: {
              systemMessage: requestBody.context.companyInfo || {},
              userPrompt: currentCommand,
              supabaseData
            },
            responseData: response,
            generatedHtml: 'Processing your page...'
          });
          
        } catch (error: any) {
          console.error('AI Builder request failed:', error);
          toast({
            variant: "destructive",
            title: "❌ Request failed",
            description: error.message || "Failed to send request",
          });
          setDebugData({
            fullPrompt: `AI Builder request failed`,
            requestPayload: requestContext,
            responseData: { error: error.message },
            generatedHtml: 'Request failed'
          });
        } finally {
          setIsAiLoading(false);
        }
        return;
      }
      
      // Multi-stage pipeline processing
      const stages = ['planning', 'content', 'html', 'styling'];
      const stageNames = ["Planning", "Building Content", "Creating HTML", "Styling & Polish"];
      let allStagesData: any[] = [];
      let finalHtml = '';
      
      // Execute each stage sequentially
      for (let i = 0; i < stages.length; i++) {
        const stageName = stages[i];
        const displayName = stageNames[i];
        
        console.log(`\n🚀 Starting stage ${i + 1}/4: ${displayName}`);
        
        // Update pipeline progress
        setPipelineStages(stageNames.map((name, idx) => ({
          name,
          completed: idx < i,
          current: idx === i
        })));
        
        // Update debug panel to show current stage
        setDebugData(prev => ({
          ...prev,
          stages: prev.stages?.map((stage: any, idx: number) => ({
            ...stage,
            completed: idx < i,
            current: idx === i
          }))
        }));
        
        try {
          // Use selected model for processing
          const stageData = await callEdgeFunction<any>({
            name: 'ai-edit-page',
            body: {
              ...requestBody,
              command: {
                ...requestBody.command,
                model: selectedModel
              },
              stage: stageName,
              pipelineId
            },
            timeoutMs: 900000, // 15 minutes per stage (matches backend timeout)
          });
          
          if (stageData?.error) {
            throw new Error(`Stage ${displayName} failed: ${stageData.error}`);
          }
          
          console.log(`✅ Stage ${displayName} completed:`, {
            duration: stageData.result?.duration,
            tokens: stageData.result?.tokens,
            validationPassed: stageData.result?.validationPassed
          });
          
          allStagesData.push({
            name: displayName,
            stage: stageName,
            ...stageData.result,
            completed: true,
            current: false
          });
          
          // If this is the final stage, store the HTML
          if (stageName === 'styling' && stageData.result?.content) {
            finalHtml = stageData.result.content;
          }
          
        } catch (stageError: any) {
          console.error(`❌ Stage ${displayName} failed:`, stageError);
          
          // Mark this stage as failed in UI
          setPipelineStages(stageNames.map((name, idx) => ({
            name,
            completed: idx < i,
            current: idx === i,
            failed: idx === i
          })));
          
          throw new Error(`Pipeline failed at stage ${displayName}: ${stageError.message}`);
        }
      }
      
      // All stages completed successfully
      console.log('✨ All pipeline stages completed');
      
      // Mark all stages as completed
      setPipelineStages(stageNames.map(name => ({
        name,
        completed: true,
        current: false
      })));
      
      // Create aggregated debug data
      const data = {
        success: true,
        updatedHtml: finalHtml,
        html: finalHtml,
        debug: {
          stages: allStagesData,
          pipelineId,
          totalStages: 4,
          fullPrompt: requestBody.command,
          requestPayload: requestContext,
          responseData: { pipelineComplete: true },
          generatedHtml: finalHtml
        },
        // Optional fields for compatibility
        error: undefined,
        errorDetails: undefined,
        errorType: undefined,
        statusCode: undefined,
        metrics: undefined,
        messages: undefined,
        explanation: 'Page generated successfully through 4-stage pipeline'
      };
      
      const error = null;

      if (error) throw error;
      
      // Check if the response contains an error field (backend error returned as 200)
      if (data?.success === false || data?.error) {
        const backendError = new Error(data.error || 'Backend error occurred');
        (backendError as any).backendError = data.error;
        (backendError as any).backendDetails = data.errorDetails;
        (backendError as any).backendType = data.errorType;
        (backendError as any).statusCode = data.statusCode;
        (backendError as any).backendMetrics = data.metrics;
        throw backendError;
      }

      // Token tracking removed - now using live input token counter

      // Auto-apply changes immediately
      const newHtml = data?.updatedHtml ?? data?.html;
      if (newHtml) {
        setPreviousHtml(currentHtml);
        setCurrentHtml(newHtml);
        setIsShowingPrevious(false);
      }

      // Store debug data - ensure stages for UI with completion tracking
      if (data?.debug) {
        const incoming: any = data.debug;
        const hasStages = Array.isArray(incoming?.stages) && incoming.stages.length > 0;
        const baseDebug = {
          fullPrompt: incoming.fullPrompt ?? incoming?.debug?.fullPrompt,
          requestPayload: incoming.requestPayload ?? incoming?.debug?.requestPayload,
          responseData: incoming.responseData ?? incoming?.debug?.responseData,
          generatedHtml: incoming.generatedHtml ?? incoming?.debug?.generatedHtml,
        };
        const stageNames = ["Planning","Building Content","Creating HTML","Styling & Polish"];
        const normalized = hasStages ? {
          ...incoming,
          stages: incoming.stages.map((stage: any, idx: number) => ({
            ...stage,
            completed: true,
            current: false
          }))
        } : {
          ...incoming,
          ...baseDebug,
          stages: stageNames.map((name: string, idx: number) => {
            const stage = incoming?.stages?.[idx];
            return stage ? { 
              ...stage, 
              completed: true, 
              current: false 
            } : { 
              name, 
              debug: baseDebug,
              completed: false,
              current: false
            };
          }),
        };
        setDebugData(normalized);
        saveDebugData(normalized, pageType, pageId);
        
        // Mark all stages as completed in pipeline tracker
        setPipelineStages(prev => prev.map(s => ({ ...s, completed: true, current: false })));
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.messages?.[0]?.content || data?.explanation || 'AI has updated the page.'
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Editor Error:', error);
      
      // Check for our explicit timeout first
      if (error?.message === 'AI_EDITOR_TIMEOUT') {
        toast({
          title: 'Generation Timeout',
          description: 'AI generation is taking longer than expected. The process may still be running. Please wait a moment and check back.',
          variant: 'destructive'
        });
        
        const assistantError: ChatMessage = {
          role: 'assistant',
          content: `## ⏱️ Generation Timeout\n\n**The AI generation is taking longer than expected (>5 minutes).**\n\nThe multi-stage pipeline typically takes 2-3 minutes but can take up to 5 minutes for complex pages.\n\n**What happened:**\n- The 4-stage AI pipeline (Planning → Content → HTML → Styling) is still processing\n- Your request may still complete successfully in the background\n\n**What to do:**\n1. **Wait 1-2 minutes** and try a simpler command to check status\n2. **Simplify your request** - break it into smaller changes\n3. **Contact support** if timeouts persist\n\n**Note:** This is a known limitation of the multi-stage pipeline. We're working on optimization.`
        };
        setChatMessages(prev => [...prev, assistantError]);
        return;
      }
      
      // Check for network timeout (browser/Supabase client timeout before our timeout)
      const isNetworkTimeout = 
        error?.message?.includes('timeout') ||
        error?.message?.includes('timed out') ||
        (error?.name === 'FunctionsFetchError' && 
         error?.context?.name === 'TypeError' && 
         error?.context?.message === 'Failed to fetch');
      
      if (isNetworkTimeout) {
        // Check for actual browser extension evidence
        const stackTrace = error?.stack || '';
        const contextStack = error?.context?.stack || '';
        const errorMsg = error?.message || '';
        const contextMessage = error?.context?.message || '';
        
        const hasExtensionEvidence = false; // Disabled unreliable extension detection

        // Always treat as network timeout without blaming extensions
        toast({
          title: 'Network Timeout',
          description: 'The AI generation took too long or the network dropped. Retrying often works; we’re improving reliability.',
          variant: 'destructive'
        });
        
        const assistantError: ChatMessage = {
          role: 'assistant',
          content: `## ⏱️ Pipeline Timeout\n\nThe generation likely exceeded the client timeout or the network dropped. Technical details are included below.`
        };
        setChatMessages(prev => [...prev, assistantError]);
        // Note: do NOT return here so we can include full technical details below

      }
      
      // Extract detailed error information
      let errorMessage = 'Unknown error occurred';
      let errorTitle = 'AI Error';
      let statusCode: number | undefined;
      let errorDetails = '';
      
      // Try to extract status code and detailed error info
      if (error?.statusCode) {
        statusCode = error.statusCode;
      } else if (error?.status) {
        statusCode = error.status;
      } else if (error?.context?.status) {
        statusCode = error.context.status;
      }
      
      // Check if we have backend error details
      if (error?.backendError) {
        errorMessage = error.backendError;
        if (error.backendType) {
          errorTitle = `${error.backendType} Error`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
        
        // Check for common error patterns
        if (error.message.includes('JWT') || error.message.includes('auth') || error.message.includes('unauthorized')) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Your session may have expired. Please refresh the page and try again.';
        } else if (error.message.includes('timeout')) {
          errorTitle = 'Timeout Error';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorTitle = 'Network Error';
          errorMessage = 'Unable to reach the server. Please check your connection and try again.';
        } else if (error.message.includes('overloaded')) {
          errorTitle = 'Service Unavailable (503)';
          errorMessage = 'The AI service is currently overloaded. Please try again in a moment.';
        }
      } else if (error?.error) {
        errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Build detailed technical info
      const technicalDetails: string[] = [];
      
      if (statusCode) {
        technicalDetails.push(`**Status Code:** ${statusCode}`);
      }
      
      if (error?.backendDetails) {
        technicalDetails.push(`**Backend Stack Trace:**\n\`\`\`\n${error.backendDetails}\n\`\`\``);
      }
      
      if (error?.backendMetrics) {
        technicalDetails.push(`**Performance Metrics:**\n\`\`\`json\n${JSON.stringify(error.backendMetrics, null, 2)}\n\`\`\``);
      }
      
      if (error?.context) {
        technicalDetails.push(`**Error Context:**\n\`\`\`json\n${JSON.stringify(error.context, null, 2)}\n\`\`\``);
      }
      
      if (error?.name) {
        technicalDetails.push(`**Frontend Error Type:** ${error.name}`);
      }
      
      if (error?.backendType) {
        technicalDetails.push(`**Backend Error Type:** ${error.backendType}`);
      }
      
      if (error?.stack && process.env.NODE_ENV === 'development') {
        technicalDetails.push(`**Frontend Stack Trace:**\n\`\`\`\n${error.stack}\n\`\`\``);
      }
      
      // Include the full error object for debugging (excluding large fields)
      const errorCopy = { ...error };
      // Remove large/circular references
      delete errorCopy.context?.body;
      delete errorCopy.backendDetails; // Already shown above
      delete errorCopy.stack; // Already shown above
      technicalDetails.push(`**Error Summary:**\n\`\`\`json\n${JSON.stringify(errorCopy, null, 2)}\n\`\`\``);
      
      errorDetails = technicalDetails.join('\n\n');
      
      // Show toast with basic error
      toast({
        title: statusCode ? `${errorTitle} (${statusCode})` : errorTitle,
        description: errorMessage,
        variant: 'destructive'
      });
      
      // Append detailed error message to chat
      const assistantError: ChatMessage = {
        role: 'assistant',
        content: `## ❌ Error Occurred\n\n**${errorMessage}**\n\n### Technical Details\n\n${errorDetails}`
      };
      setChatMessages(prev => [...prev, assistantError]);

    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyDebug = async (key: string, content: string, header: string, type: 'content' | 'header') => {
    try {
      const textToCopy = type === 'content' ? content : `${header}\n\n${content}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedStates(prev => ({ ...prev, [key]: type }));
      toast({
        title: 'Copied to clipboard',
        duration: 2000,
      });
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: null }));
      }, 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const resetChat = () => {
    setChatMessages([]);
    setDebugData(null);
    clearHistory(pageType, pageId);
    setSettingsChanged(false);
    toast({
      title: 'History Cleared',
      description: 'Chat and debug data have been cleared.'
    });
  };
  const toggleVersion = () => {
    if (isShowingPrevious) {
      // Switch to current
      setIsShowingPrevious(false);
    } else {
      // Switch to previous
      setIsShowingPrevious(true);
    }
  };
  const toggleSendOnEnter = (checked: boolean) => {
    setSendOnEnter(checked);
    localStorage.setItem('ai-editor-send-on-enter', checked.toString());
  };
  const applyAiSuggestion = (suggestion: string) => {
    setTemplateHtml(suggestion);
    toast({
      title: 'Changes applied',
      description: 'Changes will be saved automatically.'
    });
  };
  const handleInsertVariable = (variable: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newText = aiPrompt.substring(0, start) + variable + aiPrompt.substring(end);
      
      setAiPrompt(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPosition = start + variable.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  // Auto-save function - saves to draft
  const autoSave = async () => {
    if (currentHtml === originalHtml) return;
    setIsSaving(true);
    try {
      // For static pages, save to draft column
      if (pageType === 'static' && pageId) {
        const {
          error
        } = await supabase.from('static_pages').update({
          content_html_draft: currentHtml,
          updated_at: new Date().toISOString()
        }).eq('id', pageId);
        if (error) throw error;
        setOriginalHtml(currentHtml);
        setLastSaved(new Date());
        queryClient.invalidateQueries({
          queryKey: ['static-pages', pageId]
        });
      } else if (template?.id) {
        // For service templates, save to draft column
        const {
          error
        } = await supabase.from('templates').update({
          template_html_draft: currentHtml,
          updated_at: new Date().toISOString()
        }).eq('id', template.id);
        if (error) throw error;
        setOriginalHtml(currentHtml);
        setLastSaved(new Date());
        queryClient.invalidateQueries({
          queryKey: ['service-template', service?.id]
        });
      }
    } catch (error: any) {
      console.error('Auto-save error:', error);
      toast({
        title: 'Auto-save failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load published code into draft
  const handleLoadPublished = async () => {
    if (!publishedHtml) {
      toast({
        title: 'No published version',
        description: 'There is no published version to load.',
        variant: 'destructive'
      });
      return;
    }
    
    setCurrentHtml(publishedHtml);
    setRenderedPreview(publishedHtml);
    toast({
      title: 'Loaded published version',
      description: 'Draft reset to published code.'
    });
  };

  // Publish function - calls new publish-page edge function
  const handlePublish = async () => {
    if (isPublishing) return;
    
    setIsPublishing(true);
    try {
      // Call the publish-page edge function
      console.log('Publishing page...', {
        pageId: template?.id || pageId,
        pageType: pageType === 'service' ? 'service' : 'static'
      });

      const result = await callEdgeFunction({
        name: 'publish-page',
        body: {
          pageId: template?.id || pageId,
          pageType: pageType === 'service' ? 'service' : 'static'
        }
      });

      console.log('Publish result:', result);

      // Update the published HTML state
      setPublishedHtml(currentHtml);

      toast({
        title: '✅ Page Published',
        description: 'Your page is now live with all variables replaced and SEO tags added!',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ai-editor-template'] });
      if (pageType === 'service') {
        queryClient.invalidateQueries({ queryKey: ['service-for-editor'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['static-page'] });
      }

    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Publish Failed',
        description: error instanceof Error ? error.message : 'Failed to publish page',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (currentHtml !== originalHtml) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds after user stops typing)
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 2000);
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentHtml, originalHtml]);

  // Save immediately when dialog closes
  useEffect(() => {
    if (!open && currentHtml !== originalHtml) {
      autoSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-scroll chat to bottom when messages change or AI state updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [chatMessages, isAiLoading]);
  const closeMutation = useMutation({
    mutationFn: async () => {
      // Ensure latest draft is saved when closing
      try {
        if (pageType === 'static' && pageId) {
          await supabase
            .from('static_pages')
            .update({
              content_html_draft: currentHtml,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pageId);
        } else if (template?.id) {
          await supabase
            .from('templates')
            .update({
              template_html_draft: currentHtml,
              updated_at: new Date().toISOString(),
            })
            .eq('id', template.id);
        }
        setLastSaved(new Date());
      } catch (e) {
        console.error('Final save on close failed:', e);
      }
    },
    onSuccess: () => {
      onClose();
    }
  });
  if (isLoading) {
    if (fullScreen) {
      return (
        <div className="w-full h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    return <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Loading editor…</DialogTitle>
            <DialogDescription className="sr-only">Preparing the page editor</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>;
  }
  // Render the main editor content
  const editorContent = (
    <>
      {/* Header - shown in both Dialog and fullScreen modes */}
      <div className={`px-6 py-4 border-b ${fullScreen ? 'bg-background sticky top-0 z-50' : ''}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg font-semibold">Editing: {pageTitle}</h2>
          </div>
            <div className="flex items-center gap-3">
              {/* Status Badge */}
              {currentHtml !== publishedHtml ? (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium">
                  Draft - Unpublished Changes
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 font-medium">
                  Published
                </span>
              )}
              
              <div className="text-xs text-muted-foreground">
                {isSaving ? <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving draft...
                   </span> : lastSaved ? <span>Auto-saved {new Date(lastSaved).toLocaleTimeString()}</span> : currentHtml !== originalHtml ? <span>Unsaved changes</span> : null}
              </div>
              
              {publishedHtml && (
                <Button 
                  onClick={handleLoadPublished} 
                  size="sm" 
                  variant="outline" 
                  className="gap-2"
                  disabled={currentHtml === publishedHtml}
                >
                  Load Published
                </Button>
              )}
              
              <Button onClick={handlePublish} disabled={isPublishing || currentHtml === publishedHtml} size="sm" variant="default" className="gap-2">
                {isPublishing ? <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </> : <>Publish</>}
              </Button>
            </div>
        </div>
      </div>

      <div className={`flex ${fullScreen ? 'flex-1 h-full mb-16' : 'flex-1'} overflow-hidden`} id="editor-container">
          {/* Collapsed Chat Button - Shows when chat is hidden */}
          {isChatCollapsed && (
            <div className="w-12 border-r flex items-center justify-center bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setIsChatCollapsed(false)}
                title="Expand chat panel"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Left Panel - AI Chat */}
          {!isChatCollapsed && (
            <div 
              className="w-96 border-r flex flex-col min-h-0"
            >
              <div className="p-2 border-b flex-shrink-0 space-y-1.5">
              {settingsChanged && (
                <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-start gap-1.5">
                  <AlertCircle className="h-3 w-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-[10px] text-yellow-700 dark:text-yellow-500">
                    <p className="font-medium">Settings updated</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold">AI Assistant</h3>
                {chatMessages.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ({chatMessages.length})
                  </span>
                )}
              </div>
              
            <div className="space-y-2">
              {/* Compact Controls Grid - Images only shows when Fix Mode is OFF, Research and Test/Prod always visible */}
              <div className={`grid ${fixMode ? 'grid-cols-2' : 'grid-cols-3'} gap-1 p-1.5 bg-muted/50 rounded border`}>
                {!fixMode && (
                  <div className="flex flex-col items-center justify-center gap-0.5 p-1">
                    <Label htmlFor="include-images" className="text-[9px] font-medium cursor-pointer text-center">
                      📸 Images
                    </Label>
                    <Switch
                      id="include-images"
                      checked={includeImages}
                      onCheckedChange={setIncludeImages}
                      className="data-[state=checked]:bg-primary scale-75"
                    />
                  </div>
                )}
                
                <div className="flex flex-col items-center justify-center gap-0.5 p-1">
                  <Label htmlFor="needs-research" className="text-[9px] font-medium cursor-pointer text-center">
                    🔍 Research
                  </Label>
                  <Switch
                    id="needs-research"
                    checked={needsResearch}
                    onCheckedChange={setNeedsResearch}
                    className="data-[state=checked]:bg-primary scale-75"
                  />
                </div>
                
                <div className="flex flex-col items-center justify-center gap-0.5 p-1">
                  <Label htmlFor="use-test-webhook" className="text-[9px] font-medium cursor-pointer text-center">
                    {useTestWebhook ? '🧪 Test' : '🚀 Prod'}
                  </Label>
                  <Switch
                    id="use-test-webhook"
                    checked={useTestWebhook}
                    onCheckedChange={(checked) => {
                      setUseTestWebhook(checked);
                      updateWebhookPreferenceMutation.mutate(checked);
                    }}
                    className="data-[state=checked]:bg-primary scale-75"
                  />
                </div>
              </div>
              
              {needsResearch && (
                <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
                  <p className="text-[10px] text-blue-700 dark:text-blue-400">
                    💡 AI will research your topic and build a detailed page
                  </p>
                </div>
              )}

              {/* Fix Mode Toggle */}
              <div className="p-1.5 bg-muted/50 rounded border flex items-center justify-between gap-2">
                <Label htmlFor="fix-mode" className="text-[10px] font-medium cursor-pointer">
                  Fix Mode: {fixMode ? '🔧 On' : '✏️ Off'}
                </Label>
                <Switch
                  id="fix-mode"
                  checked={fixMode}
                  onCheckedChange={(checked) => {
                    setFixMode(checked);
                    if (!checked) setFixSource(null);
                  }}
                  className="data-[state=checked]:bg-primary scale-75"
                />
              </div>

              {fixMode && (
                <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mb-2">
                    🔧 Select version to fix:
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={fixSource === 'draft' ? 'default' : 'outline'}
                      onClick={() => setFixSource('draft')}
                      className="text-[10px] h-6 flex-1"
                    >
                      📝 Draft
                    </Button>
                    <Button
                      size="sm"
                      variant={fixSource === 'published' ? 'default' : 'outline'}
                      onClick={() => setFixSource('published')}
                      className="text-[10px] h-6 flex-1"
                    >
                      📄 Published
                    </Button>
                  </div>
                  {fixSource && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-2">
                      ✓ Using: {fixSource === 'draft' ? 'Draft' : 'Published'}
                    </p>
                  )}
                </div>
              )}
              
              {inputTokenCount >= 150000 && inputTokenCount < TOKEN_SOFT_LIMIT && (
                <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <p className="text-[10px] text-yellow-700 dark:text-yellow-500">
                    ⚠️ {((inputTokenCount / 200000) * 100).toFixed(0)}% capacity
                  </p>
                </div>
              )}
              {inputTokenCount >= TOKEN_SOFT_LIMIT && (
                <div className="p-1.5 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-[10px] text-destructive">
                    {inputTokenCount >= TOKEN_HARD_LIMIT ? 'Limit reached' : 'Near limit'}
                  </p>
                </div>
              )}
            </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-4 p-4 pb-4 min-h-full">
                {chatMessages.length === 0 ? <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-2">Ask AI to modify your page</p>
                    <div className="text-xs space-y-1 max-w-xs mx-auto text-left">
                      <p>Examples:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Make the headline more urgent</li>
                        <li>Add a testimonial section</li>
                        <li>Create a pricing table</li>
                        <li>Build a beautiful hero section</li>
                      </ul>
                    </div>
                  </div> : chatMessages.map((msg, idx) => <div key={idx} className={`p-3 rounded-lg max-w-full overflow-hidden break-words ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 
                      msg.role === 'system' ? 'bg-blue-500/10 border border-blue-500/20 mx-4' : 
                      'bg-muted mr-8'
                    }`}>
                      <TruncatedMessage content={msg.content} isUser={msg.role === 'user'} />
                    </div>)}
                {isAiLoading && (
                  <div className="p-3">
                    <PipelineProgressIndicator isProcessing={isAiLoading} stages={pipelineStages} />
                  </div>
                )}
                <div ref={chatEndRef} className="h-1" />
              </div>
            </ScrollArea>

            <div className={`flex-shrink-0 border-t ${fullScreen ? 'pb-20' : 'pb-6'}`}>
              <div className="p-3 space-y-2 bg-background">
                <div className="flex gap-2 items-center justify-between">
                  <VariablePicker onInsert={handleInsertVariable} includeServiceVars={pageType === 'service'} includeServiceAreaVars={pageType === 'service'} />
                </div>
                <div className="flex gap-2 items-start">
                  <Textarea ref={textareaRef} placeholder="Ask AI to build something..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => {
                  if (sendOnEnter && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    sendToAi();
                  } else if (!sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendToAi();
                  }
                }} disabled={isAiLoading} className="min-h-[80px] resize-none text-sm" />
                </div>
                <div className="flex justify-end items-center gap-2">
                  <div className="flex items-center gap-1.5 scale-75">
                    <Label htmlFor="send-on-enter" className="text-xs text-muted-foreground cursor-pointer w-[180px] text-right whitespace-nowrap">
                      {sendOnEnter ? 'Cmd/Ctrl + Enter' : 'Enter to send'}
                    </Label>
                    <Switch id="send-on-enter" checked={sendOnEnter} onCheckedChange={toggleSendOnEnter} />
                  </div>
                  <Button onClick={sendToAi} disabled={isAiLoading || !aiPrompt.trim()} size="sm">
                    {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divider with Collapse Button - Only show when chat is expanded */}
        {!isChatCollapsed && (
          <div 
            className="w-1 bg-border relative group flex items-center justify-center"
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute z-10 h-10 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-md rounded-md"
              onClick={() => setIsChatCollapsed(true)}
              title="Collapse chat panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Right Panel - Preview/Code */}
        <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b">
              
              {/* Preview/Code Tabs */}
              <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'preview' | 'code')}>
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="preview">
                      <Eye className="mr-2 h-4 w-4" />
                      Draft Preview
                    </TabsTrigger>
                    <TabsTrigger value="code">
                      <Code className="mr-2 h-4 w-4" />
                      Draft Code
                    </TabsTrigger>
                  </TabsList>
                  
                  {pageUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{pageUrl}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={async () => {
                          await navigator.clipboard.writeText(window.location.origin + pageUrl);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                          toast({
                            title: "URL copied",
                            description: "The page URL has been copied to your clipboard."
                          });
                        }}
                      >
                        {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(pageUrl, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>

            <div className="flex-1 min-h-0 relative bg-white">
              {viewMode === 'preview' ? (
                <div className="h-full flex flex-col">
                  <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                      📝 Draft Preview - Changes not yet published
                    </p>
                  </div>
                  <div className="flex-1">
                    <PreviewIframe key={isShowingPrevious ? 'previous' : 'current'} html={renderedPreview} />
                  </div>
                </div>
              ) : viewMode === 'code' ? (
                <div className="h-full flex flex-col">
                  <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 flex items-center justify-between">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                      📝 Draft Code - Editing working copy
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(displayedHtml);
                          toast({
                            title: 'Copied to clipboard',
                            description: 'Draft code copied successfully',
                          });
                        }}
                        className="h-7 px-2 text-xs"
                        title="Copy all code"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to clear all draft code?')) {
                            setCurrentHtml('');
                            setRenderedPreview('');
                            toast({
                              title: 'Draft cleared',
                              description: 'All draft code has been cleared',
                            });
                          }
                        }}
                        className="h-7 px-2 text-xs"
                        title="Clear all code"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([displayedHtml], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}-draft.html`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast({
                            title: 'Downloaded',
                            description: 'Draft code downloaded successfully',
                          });
                        }}
                        className="h-7 px-2 text-xs"
                        title="Download draft code"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Editor
                      key={isShowingPrevious ? 'previous' : 'current'}
                      height="100%"
                      defaultLanguage="html"
                      value={displayedHtml}
                      onChange={value => {
                        if (!isShowingPrevious && value !== undefined) {
                          setCurrentHtml(value);
                          setRenderedPreview(value);
                        }
                      }}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: true },
                        wordWrap: 'on',
                        automaticLayout: true,
                        fontSize: 14,
                        readOnly: isShowingPrevious,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </>
  );

  if (fullScreen) {
    return (
      <div className="w-full h-screen flex flex-col overflow-hidden bg-background">
        {editorContent}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        {editorContent}
      </DialogContent>
    </Dialog>
  );
};
export default UnifiedPageEditor;