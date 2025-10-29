import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Loader2, Send, Sparkles, Eye, Code, Trash2, AlertCircle, Copy, Check } from 'lucide-react';
import VariablePicker from './VariablePicker';
import Editor from '@monaco-editor/react';
import TruncatedMessage from './TruncatedMessage';
import PreviewIframe from './PreviewIframe';
import { PipelineProgressIndicator } from './PipelineProgressIndicator';
interface UnifiedPageEditorProps {
  open: boolean;
  onClose: () => void;
  service?: any;
  pageType: 'service' | 'static' | 'generated';
  pageTitle: string;
  onSave: (html: string) => Promise<void>;
  initialHtml?: string; // For static pages
  pageId?: string; // For static pages
}
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestion?: string;
}
type EditorMode = 'chat' | 'build';
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
  pageId
}: UnifiedPageEditorProps) => {
  const [templateHtml, setTemplateHtml] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'published' | 'debug'>('preview');
  const [publishedHtml, setPublishedHtml] = useState('');
  const [renderedPreview, setRenderedPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('build');
  const [aiModel, setAiModel] = useState<'claude' | 'grok'>('claude');
  const [tokenCount, setTokenCount] = useState(0);
  const [currentHtml, setCurrentHtml] = useState('');
  const [previousHtml, setPreviousHtml] = useState('');
  const [isShowingPrevious, setIsShowingPrevious] = useState(false);
  const [debugData, setDebugData] = useState<{
    fullPrompt: string;
    requestPayload: any;
    responseData: any;
    generatedHtml: string;
  } | null>(null);
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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

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
  const {
    data: siteSettings
  } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const {
        data
      } = await supabase.from('site_settings').select('*').maybeSingle();
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
        setDebugData(savedDebug);
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

  // Compute displayed HTML based on version toggle
  const displayedHtml = isShowingPrevious ? previousHtml : currentHtml;

  // Update preview when template changes
  useEffect(() => {
    const htmlToRender = displayedHtml;
    if (!htmlToRender) {
      console.log('No htmlToRender yet');
      return;
    }

    // For static and generated pages, render without variable substitution
    if (pageType === 'static' || pageType === 'generated') {
      console.log('Setting preview for', {
        pageType,
        length: htmlToRender.length
      });
      setRenderedPreview(htmlToRender);
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
  }, [displayedHtml, serviceAreas, companySettings, service, pageType, isShowingPrevious]);
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
    const requestContext = {
      command: currentCommand,
      mode: editorMode,
      model: aiModel,
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
        companyInfo: companySettings,
        aiTraining: aiTraining,
        siteSettings: siteSettings
      }
    };

    // Show request data immediately in debug panel
    setDebugData({
      fullPrompt: `Preparing prompt with:\n\nCommand: ${currentCommand}\nMode: ${editorMode}\nModel: ${aiModel}\nPage Type: ${pageType}`,
      requestPayload: requestContext,
      responseData: { status: `Waiting for ${aiModel === 'grok' ? 'Grok' : 'Claude'} response...` },
      generatedHtml: 'Waiting for response...'
    });
    
    try {
      
      // Add timeout to the edge function call (180 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - AI took too long to respond. Please try a shorter prompt or reset the chat.')), 180000)
      );

      const invokePromise = supabase.functions.invoke('ai-edit-page', {
        body: requestContext
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

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
      const newHtml = data?.updatedHtml ?? data?.html ?? data?.updated_html;
      if (editorMode === 'build' && newHtml) {
        setPreviousHtml(currentHtml);
        setCurrentHtml(newHtml);
        setIsShowingPrevious(false);
      }

      // Store debug data
      if (data?.debug) {
        setDebugData(data.debug);
        saveDebugData(data.debug, pageType, pageId);
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.messages?.[0]?.content || data?.explanation || 'AI has updated the page.'
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsAiLoading(false);
    } catch (error: any) {
      console.error('AI Editor Error:', error);
      
      // Check for browser extension blocking the request
      if (
        error?.name === 'FunctionsFetchError' && 
        error?.context?.name === 'TypeError' && 
        error?.context?.message === 'Failed to fetch'
      ) {
        // This is likely a browser extension/ad-blocker interfering
        toast({
          title: 'Request Blocked by Browser Extension',
          description: 'An ad-blocker or privacy extension is blocking this request. Please disable extensions for this site or try Incognito mode, then resend your message.',
          variant: 'destructive'
        });
        
        const assistantError: ChatMessage = {
          role: 'assistant',
          content: `## 🚫 Request Blocked by Browser Extension\n\n**A browser extension is blocking the AI request.**\n\nThis usually happens when:\n- Ad-blockers are interfering with network requests\n- Privacy extensions are blocking third-party requests\n- Security extensions are filtering connections\n\n**Quick fixes:**\n1. **Disable browser extensions** for this site temporarily\n2. Try using **Incognito/Private mode**\n3. Whitelist this domain in your extension settings\n4. **Resend your message** after adjusting settings\n\nThe backend service is healthy—this is a client-side browser extension issue.`
        };
        setChatMessages(prev => [...prev, assistantError]);
        setIsAiLoading(false);
        return;
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

  // Publish function - copies draft to live
  const handlePublish = async () => {
    if (isPublishing) return;
    if (!currentHtml || currentHtml.trim() === '') {
      console.warn('Publish blocked: empty currentHtml');
      toast({
        title: 'Publish blocked',
        description: 'Draft is empty. Please add content before publishing.',
        variant: 'destructive'
      });
      return;
    }
    
    console.log('Publishing...', { currentHtml: currentHtml?.substring(0, 100), pageType, pageId, templateId: template?.id });
    setIsPublishing(true);
    try {
      if (pageType === 'static' && pageId) {
        const {
          error
        } = await supabase.from('static_pages').update({
          content_html: currentHtml,
          content_html_draft: currentHtml,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', pageId);
        if (error) throw error;
        setPublishedHtml(currentHtml);
        queryClient.invalidateQueries({
          queryKey: ['static-pages', pageId]
        });
        toast({
          title: 'Published successfully',
          description: 'Your changes are now live.'
        });
      } else if (template?.id) {
        const {
          error
        } = await supabase.from('templates').update({
          template_html: currentHtml,
          template_html_draft: currentHtml,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', template.id);
        if (error) throw error;
        setPublishedHtml(currentHtml);
        if (service) {
          await supabase.from('generated_pages').update({
            needs_regeneration: true
          }).eq('service_id', service.id);
        }
        queryClient.invalidateQueries({
          queryKey: ['service-template', service?.id]
        });
        toast({
          title: 'Published successfully',
          description: 'Your changes are now live.'
        });
      }
      setOriginalHtml(currentHtml);
    } catch (error: any) {
      console.error('Publish error:', error);
      toast({
        title: 'Publish failed',
        description: error.message,
        variant: 'destructive'
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
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <DialogTitle>Editing: {pageTitle}</DialogTitle>
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
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - AI Chat */}
          <div className="w-2/5 border-r flex flex-col min-h-0">
            <div className="p-4 border-b flex-shrink-0 overflow-y-auto max-h-[40vh]">
              {settingsChanged && (
                <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs text-yellow-700 dark:text-yellow-500">
                    <p className="font-medium">Company settings updated</p>
                    <p className="mt-0.5">Consider clearing history for best results with updated information.</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">AI Assistant</h3>
                  {chatMessages.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({chatMessages.length} messages)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={editorMode === 'chat' ? 'default' : 'outline'} size="sm" onClick={() => setEditorMode('chat')} className="text-xs h-7">
                    Chat
                  </Button>
                  <Button variant={editorMode === 'build' ? 'default' : 'outline'} size="sm" onClick={() => setEditorMode('build')} className="text-xs h-7">
                    Build
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  {editorMode === 'chat' ? 'Chat about your page and get feedback' : 'Describe changes to build your page'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Context: <span className={inputTokenCount >= TOKEN_SOFT_LIMIT ? 'text-destructive font-semibold' : inputTokenCount >= 150000 ? 'text-yellow-600 font-semibold' : ''}>
                      {(inputTokenCount / 1000).toFixed(1)}K
                    </span> / 200K
                  </span>
                  {(chatMessages.length > 0 || debugData) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetChat} 
                      className="text-xs h-6 px-2 gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear History
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Live Input Token Visualizer */}
              <div className="mb-2 p-2 bg-muted/50 rounded-md border border-border/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Input Tokens</span>
                  <span className="font-mono font-semibold text-primary">
                    {inputTokenCount.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>System Instructions:</span>
                    <span className="font-mono">{estimateTokens(getSystemInstructionsLength()).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chat History:</span>
                    <span className="font-mono">{estimateTokens(chatMessages.reduce((sum, msg) => sum + msg.content.length, 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Input:</span>
                    <span className="font-mono">{estimateTokens(aiPrompt.length).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {inputTokenCount >= 150000 && inputTokenCount < TOKEN_SOFT_LIMIT && (
                <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <p className="text-xs text-yellow-700 dark:text-yellow-500">
                    ⚠️ Context is at {((inputTokenCount / 200000) * 100).toFixed(0)}% capacity. Consider clearing history soon to prevent truncation.
                  </p>
                </div>
              )}
              {inputTokenCount >= TOKEN_SOFT_LIMIT && <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive">
                    {inputTokenCount >= TOKEN_HARD_LIMIT ? 'Token limit reached. Please reset the chat to continue.' : 'Approaching token limit. Consider resetting the chat soon.'}
                  </p>
                </div>}
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
                  </div> : chatMessages.map((msg, idx) => <div key={idx} className={`p-3 rounded-lg max-w-full overflow-hidden break-words ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}`}>
                      <TruncatedMessage content={msg.content} isUser={msg.role === 'user'} />
                    </div>)}
                {isAiLoading && (
                  <div className="p-3">
                    <PipelineProgressIndicator isProcessing={isAiLoading} />
                  </div>
                )}
                <div ref={chatEndRef} className="h-1" />
              </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-2 flex-shrink-0 bg-background pb-2">
              <div className="flex gap-2 mb-2">
                <VariablePicker onInsert={handleInsertVariable} includeServiceVars={pageType === 'service'} includeServiceAreaVars={pageType === 'service'} />
              </div>
              <div className="flex gap-2 items-start">
                <Select value={aiModel} onValueChange={(value: 'claude' | 'grok') => setAiModel(value)}>
                  <SelectTrigger className="w-[110px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude" className="text-xs">Claude</SelectItem>
                    <SelectItem value="grok" className="text-xs">Grok</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea ref={textareaRef} placeholder="Ask AI to build something..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => {
                if (sendOnEnter && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  sendToAi();
                } else if (!sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendToAi();
                }
              }} disabled={isAiLoading} className="min-h-[80px] resize-none" />
              </div>
              <div className="flex justify-end items-center gap-2">
                <div className="flex items-center gap-1.5 scale-75">
                  <Label htmlFor="send-on-enter" className="text-xs text-muted-foreground cursor-pointer w-[180px] text-right whitespace-nowrap">
                    {sendOnEnter ? 'Cmd/Ctrl + Enter to send' : 'Enter to send'}
                  </Label>
                  <Switch id="send-on-enter" checked={sendOnEnter} onCheckedChange={toggleSendOnEnter} />
                </div>
                <Button onClick={sendToAi} disabled={isAiLoading || !aiPrompt.trim()} size="sm">
                  {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview/Code */}
          <div className="w-3/5 flex flex-col min-h-0">
            <div className="p-4 border-b">
              {/* Preview/Code/Published/Debug Tabs */}
              <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'preview' | 'code' | 'published' | 'debug')}>
                <TabsList>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Draft Preview
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <Code className="mr-2 h-4 w-4" />
                    Draft Code
                  </TabsTrigger>
                  <TabsTrigger value="published">
                    <Eye className="mr-2 h-4 w-4" />
                    Published Page
                  </TabsTrigger>
                  <TabsTrigger value="debug">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Debug
                  </TabsTrigger>
                </TabsList>
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
                  <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                      📝 Draft Code - Editing working copy
                    </p>
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
                          if (pageType === 'static' || pageType === 'generated') {
                            setRenderedPreview(value);
                          }
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
              ) : viewMode === 'published' ? (
                <div className="h-full flex flex-col">
                  <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center justify-between">
                    <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                      ✅ Published Version - Live on website
                    </p>
                    {!publishedHtml && (
                      <span className="text-xs text-muted-foreground italic">No published version yet</span>
                    )}
                  </div>
                  <div className="flex-1">
                    {publishedHtml ? (
                      <PreviewIframe key="published" html={publishedHtml} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No published version available</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto max-h-[80vh] max-w-full">
                  <div className="flex-1 min-h-0">
                    <div className="p-6 bg-muted/20 max-w-full">
                      {!debugData ? (
                        <div className="text-center text-muted-foreground py-12">
                          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No Debug Data Yet</p>
                          <p className="text-sm mt-2">Send a command to the AI to see the full request and response</p>
                        </div>
                      ) : Array.isArray((debugData as any)?.stages) && (debugData as any).stages.length > 0 ? (
                        <div className="space-y-4">
                          <Tabs defaultValue={"0"}>
                            <TabsList className="flex flex-wrap gap-2">
                              {(debugData as any).stages.map((stage: any, idx: number) => (
                                <TabsTrigger key={idx} value={String(idx)}>
                                  {stage?.name || stage?.title || `Stage ${idx + 1}`}
                                </TabsTrigger>
                              ))}
                            </TabsList>

                            {(debugData as any).stages.map((stage: any, idx: number) => (
                              <TabsContent key={idx} value={String(idx)}>
                                <Accordion type="multiple" className="space-y-4 max-w-full">
                                  <AccordionItem value={`prompt-${idx}`} className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                                    <AccordionTrigger className="px-4 hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-primary rounded-full" />
                                        <h3 className="font-semibold">Full Prompt ({stage?.name || `Stage ${idx + 1}`})</h3>
                                        {isAiLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
{stage?.fullPrompt || stage?.prompt || ''}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>

                                  <AccordionItem value={`request-${idx}`} className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                                    <AccordionTrigger className="px-4 hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-blue-500 rounded-full" />
                                        <h3 className="font-semibold">Request Context</h3>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
{JSON.stringify(stage?.requestPayload ?? stage?.request ?? {}, null, 2)}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>

                                  <AccordionItem value={`response-${idx}`} className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                                    <AccordionTrigger className="px-4 hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-green-500 rounded-full" />
                                        <h3 className="font-semibold">Raw Response</h3>
                                        {isAiLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
{typeof stage?.responseData === 'string' ? stage?.responseData : JSON.stringify(stage?.responseData ?? stage?.response ?? {}, null, 2)}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>

                                  <AccordionItem value={`html-${idx}`} className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                                    <AccordionTrigger className="px-4 hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-orange-500 rounded-full" />
                                        <h3 className="font-semibold">Generated HTML</h3>
                                        {isAiLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
{stage?.generatedHtml || stage?.html || ''}
                                      </pre>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </TabsContent>
                            ))}
                          </Tabs>
                        </div>
                      ) : (
                        <Accordion 
                          type="multiple" 
                          value={debugAccordionValue}
                          onValueChange={(value) => {
                            setDebugAccordionValue(value);
                            localStorage.setItem('ai-editor-debug-accordion', JSON.stringify(value));
                          }}
                          className="space-y-4 max-w-full"
                        >
                          <AccordionItem value="prompt" className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-1 bg-primary rounded-full" />
                                  <h3 className="font-semibold">Full Prompt Sent to Claude</h3>
                                  {isAiLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('prompt', debugData?.fullPrompt || '', 'Full Prompt Sent to Claude', 'content')}
                                    className="h-7 px-2"
                                    title="Copy content only"
                                  >
                                    {copiedStates['prompt'] === 'content' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('prompt', debugData?.fullPrompt || '', 'Full Prompt Sent to Claude', 'header')}
                                    className="h-7 px-2 gap-1"
                                    title="Copy header + content (all)"
                                  >
                                    {copiedStates['prompt'] === 'header' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    <span className="text-[10px] font-medium">ALL</span>
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="overflow-hidden max-w-full">
                                <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
                                {debugData.fullPrompt}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="request" className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-1 bg-blue-500 rounded-full" />
                                  <h3 className="font-semibold">Request Context</h3>
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('request', JSON.stringify(debugData?.requestPayload, null, 2) || '', 'Request Context', 'content')}
                                    className="h-7 px-2"
                                    title="Copy content only"
                                  >
                                    {copiedStates['request'] === 'content' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('request', JSON.stringify(debugData?.requestPayload, null, 2) || '', 'Request Context', 'header')}
                                    className="h-7 px-2 gap-1"
                                    title="Copy header + content (all)"
                                  >
                                    {copiedStates['request'] === 'header' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    <span className="text-[10px] font-medium">ALL</span>
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="overflow-hidden max-w-full">
                                <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
                                {JSON.stringify(debugData.requestPayload, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="response" className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-1 bg-green-500 rounded-full" />
                                  <h3 className="font-semibold">Claude's Raw Response</h3>
                                  {isAiLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('response', typeof debugData?.responseData === 'string' ? debugData.responseData : JSON.stringify(debugData?.responseData, null, 2), "Claude's Raw Response", 'content')}
                                    className="h-7 px-2"
                                    title="Copy content only"
                                  >
                                    {copiedStates['response'] === 'content' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('response', typeof debugData?.responseData === 'string' ? debugData.responseData : JSON.stringify(debugData?.responseData, null, 2), "Claude's Raw Response", 'header')}
                                    className="h-7 px-2 gap-1"
                                    title="Copy header + content (all)"
                                  >
                                    {copiedStates['response'] === 'header' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    <span className="text-[10px] font-medium">ALL</span>
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="overflow-hidden max-w-full">
                                <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
                                {typeof debugData.responseData === 'string' 
                                  ? debugData.responseData 
                                  : JSON.stringify(debugData.responseData, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="html" className="bg-background rounded-lg border shadow-sm overflow-hidden max-w-full">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-1 bg-orange-500 rounded-full" />
                                  <h3 className="font-semibold">Generated HTML</h3>
                                  {isAiLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('html', debugData?.generatedHtml || '', 'Generated HTML', 'content')}
                                    className="h-7 px-2"
                                    title="Copy content only"
                                  >
                                    {copiedStates['html'] === 'content' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyDebug('html', debugData?.generatedHtml || '', 'Generated HTML', 'header')}
                                    className="h-7 px-2 gap-1"
                                    title="Copy header + content (all)"
                                  >
                                    {copiedStates['html'] === 'header' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    <span className="text-[10px] font-medium">ALL</span>
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="overflow-hidden max-w-full">
                              <pre className="p-4 overflow-x-auto max-w-full text-xs font-mono whitespace-pre-wrap break-all max-h-[400px] bg-muted/30 rounded">
                                {debugData.generatedHtml}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default UnifiedPageEditor;