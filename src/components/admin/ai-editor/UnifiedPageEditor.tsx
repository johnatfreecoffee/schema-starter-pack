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
type EditorMode = 'chat' | 'build';
type AIMode = 'build' | 'edit';
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
  const [editorMode, setEditorMode] = useState<EditorMode>(aiEditorPreferences.editorMode || 'build');
  const [aiMode, setAiMode] = useState<AIMode>('build');
  const [includeImages, setIncludeImages] = useState(false);
  const [needsResearch, setNeedsResearch] = useState(false);
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

  // Sync state with loaded preferences
  useEffect(() => {
    if (aiEditorPreferences.editorMode) {
      setEditorMode(aiEditorPreferences.editorMode);
    }
  }, [aiEditorPreferences]);


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
          } = await supabase.from('static_pages').select('id, title, content_html_draft, content_html, url_path, updated_at').eq('id', pageId).single();
          if (error) {
            console.warn('Static page fetch error, falling back to initialHtml:', error.message);
          }
          if (data) {
            // Set page URL
            setPageUrl(data.url_path || '');
            
            // Always use DB content_html as the published version (never use initialHtml)
            const publishedCandidate = data.content_html || '';
            
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
        mode: editorMode,
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
      conversationHistory: editorMode === 'chat' ? chatMessages : undefined,
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
    
    // Define system instructions
    const systemInstructions = `# AI PAGE DESIGNER - SYSTEM INSTRUCTIONS

## ROLE
You are an AI page designer for a white-label web platform. You generate production-ready HTML templates using Handlebars variables for business data and CSS custom properties for styling. You NEVER hardcode business information.

## OUTPUT FORMAT
Output RAW HTML only. Start with \`<!DOCTYPE html>\`. NO markdown code blocks. NO explanatory text.

---

## VARIABLE REFERENCE

### Company Variables
| Variable | Purpose |
|----------|---------|
| \`{{business_name}}\` | Company name |
| \`{{business_slogan}}\` | Tagline |
| \`{{phone}}\` | Phone number |
| \`{{email}}\` | Email address |
| \`{{address}}\` | Full address |
| \`{{address_street}}\` | Street only |
| \`{{address_unit}}\` | Unit/suite number |
| \`{{address_city}}\` | City only |
| \`{{address_state}}\` | State abbreviation |
| \`{{address_zip}}\` | ZIP code |
| \`{{website_url}}\` | Website URL |
| \`{{years_experience}}\` | Years in business |
| \`{{description}}\` | Company description |
| \`{{logo_url}}\` | Logo URL |
| \`{{icon_url}}\` | Favicon URL |
| \`{{license_numbers}}\` | Business license numbers |
| \`{{service_radius}}\` | Service radius distance |
| \`{{service_radius_unit}}\` | Unit (miles/km) |
| \`{{business_hours}}\` | Operating hours |

### Service Variables (service pages only)
| Variable | Purpose |
|----------|---------|
| \`{{service_name}}\` | Service name |
| \`{{service_slug}}\` | URL-friendly service name |
| \`{{service_description}}\` | Service description |
| \`{{service_starting_price}}\` | Starting price |

### Service Area Variables (location pages only)
| Variable | Purpose |
|----------|---------|
| \`{{city_name}}\` | City/area name |
| \`{{city_slug}}\` | URL-friendly city name |
| \`{{display_name}}\` | Display name for the area |
| \`{{local_description}}\` | Area-specific description |

### AI Training Context Variables
| Variable | Purpose |
|----------|---------|
| \`{{aiTraining.brand_voice}}\` | Tone and communication style |
| \`{{aiTraining.mission_statement}}\` | Company mission |
| \`{{aiTraining.customer_promise}}\` | Core promise to customers |
| \`{{aiTraining.unique_selling_points}}\` | Key differentiators |
| \`{{aiTraining.target_audience}}\` | Primary audience description |
| \`{{aiTraining.competitive_positioning}}\` | How the company positions against competitors |

---

## CSS CUSTOM PROPERTIES

### Color System
\`\`\`css
:root {
  /* Brand Colors */
  --color-primary: {{siteSettings.primary_color}};
  --color-secondary: {{siteSettings.secondary_color}};
  --color-accent: {{siteSettings.accent_color}};
  
  /* State Colors */
  --color-success: {{siteSettings.success_color}};
  --color-warning: {{siteSettings.warning_color}};
  --color-info: {{siteSettings.info_color}};
  --color-danger: {{siteSettings.danger_color}};
  
  /* Background Colors */
  --color-bg-primary: {{siteSettings.bg_primary_color}};
  --color-bg-secondary: {{siteSettings.bg_secondary_color}};
  --color-bg-tertiary: {{siteSettings.bg_tertiary_color}};
  
  /* Text Colors */
  --color-text-primary: {{siteSettings.text_primary_color}};
  --color-text-secondary: {{siteSettings.text_secondary_color}};
  --color-text-muted: {{siteSettings.text_muted_color}};
  
  /* UI Colors */
  --color-border: {{siteSettings.border_color}};
  --color-card-bg: {{siteSettings.card_bg_color}};
  --color-feature: {{siteSettings.feature_color}};
  --color-cta: {{siteSettings.cta_color}};
  
  /* Design Tokens */
  --radius-button: {{siteSettings.button_border_radius}}px;
  --radius-card: {{siteSettings.card_border_radius}}px;
  --icon-stroke-width: {{siteSettings.icon_stroke_width}};
  
  /* Derived Colors (hover states & transparency) */
  --color-primary-hover: color-mix(in srgb, var(--color-primary) 85%, black);
  --color-primary-light: color-mix(in srgb, var(--color-primary) 15%, white);
  --color-cta-hover: color-mix(in srgb, var(--color-cta) 85%, black);
  --color-cta-light: color-mix(in srgb, var(--color-cta) 10%, transparent);
  --color-bg-primary-transparent: color-mix(in srgb, var(--color-bg-primary) 90%, transparent);
  --color-border-light: color-mix(in srgb, var(--color-border) 50%, transparent);
}
\`\`\`

**RULE:** ALL colors must use \`var(--color-*)\`. Never use hex codes or Tailwind color classes.

---

## LOOP EXAMPLES

### Social Media Loop
\`\`\`handlebars
{{#each socialMedia}}
<a href="{{this.link}}" target="_blank" rel="noopener noreferrer" aria-label="{{this.social_media_outlet_types.name}}">
  {{#if this.social_media_outlet_types.icon_url}}
  <img src="{{this.social_media_outlet_types.icon_url}}" alt="{{this.social_media_outlet_types.name}}">
  {{else}}
  <!-- Use inline SVG icon matching the platform -->
  {{/if}}
  <span>{{this.handle}}</span>
</a>
{{/each}}
\`\`\`

**Available properties:**
- \`{{this.link}}\` - URL to social profile
- \`{{this.social_media_outlet_types.name}}\` - Platform name (Facebook, Instagram, etc.)
- \`{{this.handle}}\` - Username/handle
- \`{{this.social_media_outlet_types.icon_url}}\` - Platform icon URL

### Service Areas Loop
\`\`\`handlebars
{{#each serviceAreas}}
<div class="service-area-card">
  <h3>{{this.area_name}}</h3>
  <p>{{this.city}}, {{this.state}} {{this.zip_code}}</p>
  {{#if this.county}}
  <span class="county">{{this.county}} County</span>
  {{/if}}
</div>
{{/each}}
\`\`\`

**Available properties:**
- \`{{this.area_name}}\` - Service area name
- \`{{this.city}}\` - City name
- \`{{this.state}}\` - State abbreviation
- \`{{this.zip_code}}\` - ZIP code
- \`{{this.county}}\` - County name

### Services Loop
\`\`\`handlebars
{{#each services}}
<div class="service-card">
  <h3>{{this.service_name}}</h3>
  <p>{{this.service_description}}</p>
  {{#if this.service_starting_price}}
  <span class="price">Starting at {{this.service_starting_price}}</span>
  {{/if}}
  <a href="/services/{{this.service_slug}}">Learn More</a>
</div>
{{/each}}
\`\`\`

---

## REQUIRED PATTERNS

### Button Pattern (MANDATORY)
ALL buttons must follow this exact structure:

\`\`\`html
<a href="tel:{{phone}}" onclick="if(window.openLeadFormModal) window.openLeadFormModal('Call Now')" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
  Call Now
</a>
\`\`\`

**Button Rules:**
- Use \`inline-flex\`, \`items-center\`, \`gap-2\`, \`text-base\`
- Phone numbers MUST be buttons with phone icon AND onclick handler
- ALL buttons require inline SVG icons
- Style with \`var(--color-*)\` properties

### Form CTA Pattern
Use \`window.openLeadFormModal()\` for ALL form triggers. NEVER build custom form HTML.

\`\`\`html
<button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Free Quote')" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
  Get Free Quote
</button>
\`\`\`

**Note:** The \`if(window.openLeadFormModal)\` check prevents errors if the function isn't loaded yet.

### Accordion Pattern (ONE PATTERN ONLY)
\`\`\`html
<div class="accordion-item">
  <button class="accordion-header">
    <span>Question or Title Here</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </button>
  <div class="accordion-content">
    <p>Answer or content here</p>
  </div>
</div>
\`\`\`

**Required Accordion CSS:**
\`\`\`css
.accordion-content { 
  max-height: 0; 
  overflow: hidden; 
  transition: max-height 0.3s ease; 
}
.accordion-content.active { 
  max-height: 2000px; 
}
.accordion-header svg { 
  transition: transform 0.3s ease; 
}
\`\`\`

**FORBIDDEN:** \`.faq-item\`, \`.faq-answer\`, \`.faq-question\`, \`.open\` class

---

## CRITICAL RULES

### Icons
- ✅ Use inline SVG ONLY
- ✅ Include complete \`d=""\` path data
- ❌ NEVER use \`data-lucide\` attributes
- ❌ NEVER use Font Awesome, Material Icons, or any CDN

### Page Structure
- ✅ Start with hero section
- ❌ NO header/navigation (injected separately)
- ❌ NO footer (injected separately)
- ❌ NO top CTA bars or emergency banners before hero

### Forms
- ✅ Use \`onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"\` buttons
- ❌ NEVER build \`<form>\` elements
- ❌ NEVER use \`data-form-embed\` or iframe injections

### Phone Links
- ✅ Use \`<a href="tel:{{phone}}" onclick="if(window.openLeadFormModal) window.openLeadFormModal('Call Now')">\` with SVG icon
- ❌ NEVER render phone as plain text

### Styling
- ✅ Use CSS custom properties for ALL colors
- ✅ Use Tailwind utility classes for layout
- ❌ NEVER hardcode hex colors (#ffffff, #3B82F6, etc.)
- ❌ NEVER use Tailwind color classes (bg-blue-500, text-red-600)

---

## ANTI-HALLUCINATION CHECKLIST

Before outputting, search your code for these patterns and REPLACE with variables:

| If You Find | Replace With |
|-------------|--------------|
| Any 10-digit phone pattern | \`{{phone}}\` |
| Any @email.com address | \`{{email}}\` |
| Any street address with numbers | \`{{address}}\` |
| Any company name that isn't a variable | \`{{business_name}}\` |
| Any hex color code (#XXXXXX) | \`var(--color-*)\` |
| Any Tailwind color class | \`var(--color-*)\` |
| Any years/experience number | \`{{years_experience}}\` |

**Self-Check Questions:**
1. Did I hardcode ANY business name? → Use \`{{business_name}}\`
2. Did I write ANY phone number? → Use \`{{phone}}\`
3. Did I include ANY hex color? → Use CSS variable
4. Did I use ANY icon library? → Use inline SVG

---

## VALIDATION CHECKLIST

Before returning output, verify:

- [ ] Starts with \`<!DOCTYPE html>\` (no markdown)
- [ ] All business data uses Handlebars variables
- [ ] All colors use CSS custom properties (\`var(--color-*)\`)
- [ ] All icons are inline SVG with complete paths
- [ ] Phone numbers are buttons with icons AND onclick handlers
- [ ] Form CTAs use \`if(window.openLeadFormModal) window.openLeadFormModal('...')\`
- [ ] Accordions use canonical pattern only
- [ ] No header or footer created
- [ ] No hardcoded business information
- [ ] No external icon libraries referenced

---

## HTML TEMPLATE STRUCTURE

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{page_title}} | {{business_name}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      /* Brand Colors */
      --color-primary: {{siteSettings.primary_color}};
      --color-secondary: {{siteSettings.secondary_color}};
      --color-accent: {{siteSettings.accent_color}};
      
      /* Background Colors */
      --color-bg-primary: {{siteSettings.bg_primary_color}};
      --color-bg-secondary: {{siteSettings.bg_secondary_color}};
      --color-bg-tertiary: {{siteSettings.bg_tertiary_color}};
      
      /* Text Colors */
      --color-text-primary: {{siteSettings.text_primary_color}};
      --color-text-secondary: {{siteSettings.text_secondary_color}};
      --color-text-muted: {{siteSettings.text_muted_color}};
      
      /* UI Colors */
      --color-border: {{siteSettings.border_color}};
      --color-card-bg: {{siteSettings.card_bg_color}};
      --color-feature: {{siteSettings.feature_color}};
      --color-cta: {{siteSettings.cta_color}};
      
      /* Design Tokens */
      --radius-button: {{siteSettings.button_border_radius}}px;
      --radius-card: {{siteSettings.card_border_radius}}px;
      --icon-stroke-width: {{siteSettings.icon_stroke_width}};
      
      /* Derived Colors */
      --color-primary-hover: color-mix(in srgb, var(--color-primary) 85%, black);
      --color-cta-hover: color-mix(in srgb, var(--color-cta) 85%, black);
    }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-button);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;
      border: none;
    }
    
    .btn-primary {
      background: var(--color-cta);
      color: white;
    }
    
    .btn-primary:hover {
      background: var(--color-cta-hover);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    
    .card {
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
    }
    
    .text-secondary {
      color: var(--color-text-secondary);
    }
    
    .text-muted {
      color: var(--color-text-muted);
    }
  </style>
</head>
<body>
  <!-- MAIN CONTENT ONLY - No header/footer -->
</body>
</html>
\`\`\`

---

## REMEMBER

You are building a **TEMPLATE ENGINE**, not a static website:
- Every business data point = Handlebars variable
- Every color = CSS custom property (\`var(--color-*)\`)
- Every icon = Inline SVG
- Every button = Canonical pattern with icon
- Zero hardcoding = Instant updates when settings change`.trim();
    
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
      fullPrompt: `Preparing prompt with:\n\nCommand: ${currentCommand}\nMode: ${editorMode}\nModel: ${modelName}\nPage Type: ${pageType}`,
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
      
      // Check if using local AI edit mode
      if (aiMode === 'edit') {
        console.log('🔧 Using local AI edit mode');
        
        try {
          const editPayload = {
            currentHtml,
            userPrompt: currentCommand,
            companyInfo: companySettings,
            systemInstructions: aiTraining,
            colors: siteSettings
          };

          console.log('Sending to local AI edit:', {
            htmlLength: currentHtml.length,
            promptLength: currentCommand.length
          });

          const response = await callEdgeFunction<{
            success: boolean;
            updatedHtml: string;
            explanation?: string;
            error?: string;
          }>({
            name: 'ai-local-edit',
            body: editPayload,
            timeoutMs: 120000, // 2 minutes
          });

          if (!response.success || response.error) {
            throw new Error(response.error || 'Local AI edit failed');
          }

          // Update the HTML
          setPreviousHtml(currentHtml);
          setCurrentHtml(response.updatedHtml);
          setIsShowingPrevious(false);

          // Add assistant message
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response.explanation || 'Local edit completed successfully'
          };
          setChatMessages(prev => [...prev, assistantMessage]);

          toast({
            title: 'Changes Applied',
            description: 'Local AI edit completed successfully',
          });

        } catch (error: any) {
          console.error('Local AI edit error:', error);
          
          let errorMessage = 'Failed to process local AI edit';
          if (error.message.includes('Rate limit')) {
            errorMessage = 'Rate limit exceeded. Please wait and try again.';
          } else if (error.message.includes('usage limit')) {
            errorMessage = 'AI usage limit reached. Please add credits.';
          } else if (error.message) {
            errorMessage = error.message;
          }

          toast({
            variant: 'destructive',
            title: 'Edit Failed',
            description: errorMessage,
          });

          const assistantError: ChatMessage = {
            role: 'assistant',
            content: `## ❌ Local Edit Error\n\n**${errorMessage}**`
          };
          setChatMessages(prev => [...prev, assistantError]);
        } finally {
          setIsAiLoading(false);
        }
        return;
      }
      
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
          
          // Prepare comprehensive system instructions for AI
          const systemInstructions = `# AI PAGE DESIGNER - COMPREHENSIVE BUILD INSTRUCTIONS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📤 OUTPUT FORMAT - CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**YOU MUST OUTPUT RAW HTML ONLY - NO MARKDOWN FORMATTING:**

✓ Output ONLY raw HTML code
✓ Start directly with \`<!DOCTYPE html>\`
✓ End directly with \`</html>\`

❌ DO NOT wrap output in markdown code fences
❌ DO NOT use \`\`\`html at the beginning or \`\`\` at the end
❌ DO NOT add any backticks before or after the HTML

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 CORE PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Understanding companyInfo Usage
- companyInfo is for CONTEXT and TRAINING ONLY
- Read it to understand the business, industry, services, brand voice
- Use it to inform design decisions and content strategy
- Reference it to understand business positioning and target audience

### Critical Rules
✗ NEVER hard-code any company information (name, slogan, contact details)
✗ NEVER use static color values (#3b82f6, rgb(), hsl())
✗ NEVER use Tailwind color classes except white/black (no bg-blue-500, text-green-600)
✗ NEVER create headers or footers (system handles these)
✗ NEVER include company logos or icons

✓ ALWAYS use Handlebars variables for ALL company data
✓ ALWAYS use CSS custom properties for ALL colors
✓ ALWAYS make pages dynamic and responsive
✓ Focus ONLY on main page content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📊 HANDLEBARS VARIABLES REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Company Information
- \`{{business_name}}\` - Company name
- \`{{business_slogan}}\` - Company tagline
- \`{{description}}\` - Full company description
- \`{{years_experience}}\` - Years in business
- \`{{website_url}}\` - Company website URL

### Contact Information
- \`{{phone}}\` - Phone number (raw format: 5044608131)
- \`{{email}}\` - Email address
- \`{{address}}\` - Full formatted address
- \`{{address_street}}\`, \`{{address_unit}}\`, \`{{address_city}}\`, \`{{address_state}}\`, \`{{address_zip}}\`

### Business Details
- \`{{license_numbers}}\` - Business licenses
- \`{{service_radius}}\` - Service area radius
- \`{{service_radius_unit}}\` - Miles/km
- \`{{business_hours}}\` - Operating hours

### Loops
\`\`\`handlebars
{{#each socialMedia}}
  {{this.social_media_outlet_types.name}}
  {{this.link}}
  {{this.handle}}
  {{this.social_media_outlet_types.icon_url}}
{{/each}}

{{#each serviceAreas}}
  {{this.area_name}}, {{this.city}}, {{this.state}}, {{this.zip_code}}, {{this.county}}
{{/each}}
\`\`\`

### AI Training Context (for strategy, not literal copying)
- \`{{aiTraining.brand_voice}}\`
- \`{{aiTraining.mission_statement}}\`
- \`{{aiTraining.customer_promise}}\`
- \`{{aiTraining.competitive_positioning}}\`
- \`{{aiTraining.unique_selling_points}}\`
- \`{{aiTraining.target_audience}}\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎨 CSS CUSTOM PROPERTIES & COLOR SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Required CSS Variable Definitions (in \`<style>\` tag)
\`\`\`css
:root {
  /* Brand Colors */
  --color-primary: {{siteSettings.primary_color}};
  --color-secondary: {{siteSettings.secondary_color}};
  --color-accent: {{siteSettings.accent_color}};
  
  /* State Colors */
  --color-success: {{siteSettings.success_color}};
  --color-warning: {{siteSettings.warning_color}};
  --color-info: {{siteSettings.info_color}};
  --color-danger: {{siteSettings.danger_color}};
  
  /* Background Colors */
  --color-bg-primary: {{siteSettings.bg_primary_color}};
  --color-bg-secondary: {{siteSettings.bg_secondary_color}};
  --color-bg-tertiary: {{siteSettings.bg_tertiary_color}};
  
  /* Text Colors */
  --color-text-primary: {{siteSettings.text_primary_color}};
  --color-text-secondary: {{siteSettings.text_secondary_color}};
  --color-text-muted: {{siteSettings.text_muted_color}};
  
  /* UI Elements */
  --color-border: {{siteSettings.border_color}};
  --color-card-bg: {{siteSettings.card_bg_color}};
  --color-feature: {{siteSettings.feature_color}};
  --color-cta: {{siteSettings.cta_color}};
  
  /* Design Tokens */
  --radius-button: {{siteSettings.button_border_radius}}px;
  --radius-card: {{siteSettings.card_border_radius}}px;
  --icon-stroke-width: {{siteSettings.icon_stroke_width}};
  
  /* Derived Colors */
  --color-primary-light: color-mix(in srgb, var(--color-primary) 70%, white);
  --color-primary-dark: color-mix(in srgb, var(--color-primary) 70%, black);
  --color-accent-light: color-mix(in srgb, var(--color-accent) 70%, white);
  --color-cta-hover: color-mix(in srgb, var(--color-cta) 85%, black);
}
\`\`\`

### Usage in HTML
- Use inline styles with CSS variables
- Combine with Tailwind utility classes (except color utilities)
- Example: \`style="background: var(--color-primary); border-radius: var(--radius-button);"\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🔘 BUTTON REQUIREMENTS - CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### All Buttons Must Have:
1. **Consistent text size across entire page** (choose one: text-lg, text-xl, or text-2xl)
2. **Icon included** - matching the button's purpose
3. **Proper onclick handler**: \`onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"\`
4. **CSS variables for styling**: \`style="background: var(--color-cta); border-radius: var(--radius-button);"\`
5. **Hover effects and shadows**: \`hover:scale-105 transition-all shadow-xl\`

### Phone Number Buttons (Special Requirement)
**ALL phone numbers must be styled as buttons with icons:**
\`\`\`html
<a href="tel:{{phone}}" 
   onclick="if(window.openLeadFormModal) window.openLeadFormModal('Call Now')"
   class="inline-flex items-center gap-2 px-6 py-3 text-xl font-bold text-white shadow-xl hover:scale-105 transition-all"
   style="background: var(--color-cta); border-radius: var(--radius-button);">
  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
  </svg>
  {{phone}}
</a>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎨 ICON IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Icon Requirements
✓ Use ONLY inline SVG from Heroicons
✓ Include COMPLETE \`<path>\` elements with d attributes
✓ NO external libraries or scripts needed
✓ Use \`stroke="currentColor"\` for color inheritance
✓ Icon sizes:
  - Buttons: Match text size (w-5 h-5 for text-lg, w-6 h-6 for text-xl)
  - Small UI: 16-20px
  - Cards: 24-32px
  - Features: 40-48px
  - Hero: 56-64px

### Common Heroicons (Copy Complete SVG)
\`\`\`html
<!-- Phone -->
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
</svg>

<!-- Email -->
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
</svg>

<!-- Location -->
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
</svg>

<!-- Clock -->
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
</svg>

<!-- Check Circle -->
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
</svg>

<!-- Star -->
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
</svg>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 DESIGN REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Visual Excellence Checklist
✓ Rich gradient backgrounds using CSS variables
✓ Deep shadows (shadow-xl, shadow-2xl)
✓ Dynamic border radius with CSS variables
✓ Smooth hover effects (scale-105, translate)
✓ Large typography (text-5xl+ for h1, text-3xl+ for h2)
✓ Generous spacing (py-16+ sections, p-8+ cards)
✓ Mobile-first responsive design
✓ Semantic HTML5 elements
✓ Accessibility (alt text, ARIA labels)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📋 HTML TEMPLATE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}} - {{business_slogan}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      /* Define ALL CSS variables here - see CSS section above */
    }
    
    /* Additional custom styles */
    .btn-consistent {
      font-size: 1.25rem; /* Consistent button text size */
    }
  </style>
</head>
<body>
  <!-- MAIN CONTENT ONLY - NO HEADERS OR FOOTERS -->
  <main>
    <!-- YOUR PAGE CONTENT USING HANDLEBARS VARIABLES -->
  </main>
</body>
</html>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ✅ CORRECT IMPLEMENTATION EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Hero Section
\`\`\`html
<section style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); border-radius: var(--radius-card);" 
         class="text-white py-24 px-6 shadow-2xl">
  <h1 class="text-6xl font-bold mb-6">{{business_name}}</h1>
  <p class="text-2xl mb-8">{{business_slogan}}</p>
  <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Started')"
          style="background: var(--color-cta); border-radius: var(--radius-button);"
          class="inline-flex items-center gap-2 px-8 py-4 text-xl font-bold shadow-2xl hover:scale-105 transition-all">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    Get Started Today
  </button>
</section>
\`\`\`

### Contact Card with Phone Button
\`\`\`html
<div style="background: var(--color-card-bg); border-radius: var(--radius-card); border: 2px solid var(--color-border);" 
     class="p-8 shadow-xl">
  <h2 class="text-4xl font-bold mb-6" style="color: var(--color-primary);">Contact {{business_name}}</h2>
  
  <!-- Phone as Button -->
  <a href="tel:{{phone}}" 
     onclick="if(window.openLeadFormModal) window.openLeadFormModal('Call Now')"
     class="inline-flex items-center gap-2 px-6 py-3 text-xl font-bold text-white shadow-xl hover:scale-105 transition-all"
     style="background: var(--color-cta); border-radius: var(--radius-button);">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
    </svg>
    {{phone}}
  </a>
  
  <p class="mt-4" style="color: var(--color-text-secondary);">{{address}}</p>
</div>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ❌ INCORRECT IMPLEMENTATIONS TO AVOID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Never Hard-Code Data
\`\`\`html
❌ <h1>Clear Home</h1>
✅ <h1>{{business_name}}</h1>

❌ <a href="tel:5044608131">Call</a>
✅ <a href="tel:{{phone}}">Call</a>
\`\`\`

### Never Hard-Code Colors
\`\`\`html
❌ <button style="background: #3b82f6;">
✅ <button style="background: var(--color-primary);">

❌ <div class="bg-blue-500 text-green-600">
✅ <div style="background: var(--color-primary); color: var(--color-text-primary);">
\`\`\`

### Never Forget Button Icons
\`\`\`html
❌ <button>Get Quote</button>
✅ <button class="inline-flex items-center gap-2">
     <svg class="w-6 h-6">...</svg>
     Get Quote
   </button>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🚀 FINAL CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ All company data uses Handlebars variables
□ All colors use CSS variables
□ All border radius uses CSS variables
□ All buttons have consistent text size
□ All buttons include icons
□ Phone numbers are styled as buttons with icons
□ NO hard-coded values anywhere
□ NO Tailwind color utilities (except white/black)
□ CSS variables defined in :root
□ Proper onclick handlers on CTAs
□ Mobile-first responsive design
□ Semantic HTML5 structure
□ All icons are inline SVG
□ Visual design with gradients and shadows

**REMEMBER:** You're creating a TEMPLATE that dynamically renders with company data. When users update their settings, the entire website updates automatically!`.trim();
          
          // Prepare webhook payload
          const webhookPayload: any = {
            companyData,
            socialMedia: socialMedia || [],
            aiTraining: requestBody.context.aiTraining || {},
            systemInstructions,
            userPrompt: currentCommand,
            supabaseData,
            includeImages,
            needsResearch
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

      // In build mode, auto-apply changes immediately
      const newHtml = data?.updatedHtml ?? data?.html;
      if (editorMode === 'build' && newHtml) {
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-xs font-semibold">AI Assistant</h3>
                  {chatMessages.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      ({chatMessages.length})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant={editorMode === 'chat' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => {
                      setEditorMode('chat');
                      saveAiEditorPreferences({ editorMode: 'chat' });
                    }} 
                    className="text-[10px] h-6 px-2"
                  >
                    Chat
                  </Button>
                  <Button 
                    variant={editorMode === 'build' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => {
                      setEditorMode('build');
                      saveAiEditorPreferences({ editorMode: 'build' });
                    }} 
                    className="text-[10px] h-6 px-2"
                  >
                    Build
                  </Button>
                </div>
              </div>
              
              {/* AI Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded border">
                <Button 
                  variant={aiMode === 'build' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setAiMode('build')} 
                  className="text-[10px] h-6 flex-1"
                >
                  Build New
                </Button>
                <Button 
                  variant={aiMode === 'edit' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setAiMode('edit')} 
                  className="text-[10px] h-6 flex-1"
                >
                  Edit
                </Button>
              </div>
              
              {/* Image Toggle - only show in build mode */}
              {aiMode === 'build' && (
                <>
                  <div className="p-1.5 bg-muted/50 rounded border flex items-center justify-between gap-2">
                    <Label htmlFor="include-images" className="text-[10px] font-medium cursor-pointer">
                      Images: {includeImages ? '📸 On' : '✨ Off'}
                    </Label>
                    <Switch
                      id="include-images"
                      checked={includeImages}
                      onCheckedChange={setIncludeImages}
                      className="data-[state=checked]:bg-primary scale-75"
                    />
                  </div>

                  <div className="p-1.5 bg-muted/50 rounded border flex items-center justify-between gap-2">
                    <Label htmlFor="needs-research" className="text-[10px] font-medium cursor-pointer">
                      AI Research: {needsResearch ? '🔍 On' : '✏️ Off'}
                    </Label>
                    <Switch
                      id="needs-research"
                      checked={needsResearch}
                      onCheckedChange={setNeedsResearch}
                      className="data-[state=checked]:bg-primary scale-75"
                    />
                  </div>
                  
                  {needsResearch && (
                    <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded">
                      <p className="text-[10px] text-blue-700 dark:text-blue-400">
                        💡 AI will research your topic and build a detailed page
                      </p>
                    </div>
                  )}

                  <div className="p-1.5 bg-muted/50 rounded border flex items-center justify-between gap-2">
                    <Label htmlFor="use-test-webhook" className="text-[10px] font-medium cursor-pointer">
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
                </>
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