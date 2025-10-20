import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AISettingsGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: any;
  onSettingsUpdate: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AISettingsGuide = ({
  open,
  onOpenChange,
  currentSettings,
  onSettingsUpdate,
}: AISettingsGuideProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session when dialog opens
  useEffect(() => {
    if (open && messages.length === 0) {
      initializeSession();
    }
  }, [open]);

  const initializeSession = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('company-settings-ai-guide', {
        body: {
          action: 'start',
          currentSettings,
        }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      setMessages([{
        role: 'assistant',
        content: data.guidance
      }]);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start AI guide. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (messageOverride?: string) => {
    const userMessage = messageOverride || input.trim();
    if (!userMessage || isLoading || !sessionId) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('company-settings-ai-guide', {
        body: {
          message: userMessage,
          sessionId,
          currentSettings,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.guidance
      }]);

      // Check if guide is complete
      if (data.guidance.includes('🎉 **All Done!**')) {
        setIsComplete(true);
        // Trigger settings refresh
        onSettingsUpdate();
        toast({
          title: 'Profile Complete!',
          description: 'Your company settings have been saved.',
        });
      } else {
        // Trigger settings refresh for incremental saves
        onSettingsUpdate();
      }

    } catch (error) {
      console.error('AI guide error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive',
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try rephrasing?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    if (isComplete || messages.length === 0) {
      // Safe to close
      onOpenChange(false);
      // Reset state
      setTimeout(() => {
        setMessages([]);
        setSessionId(null);
        setIsComplete(false);
      }, 300);
    } else {
      // Warn about incomplete session
      if (confirm('Your progress is saved, but the guide is not complete. Close anyway?')) {
        onOpenChange(false);
        setTimeout(() => {
          setMessages([]);
          setSessionId(null);
          setIsComplete(false);
        }, 300);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Company Setup Guide
            {isComplete && (
              <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
            )}
          </DialogTitle>
          <DialogDescription>
            I'll guide you through setting up your complete company profile
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div 
                    className="text-sm whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?\?)\*\*/g, '<h2 class="text-lg font-semibold mt-2 mb-1">$1</h2>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/_(.*?)_/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {!isComplete && (
          <div className="space-y-2 pt-2 border-t">
            {/* Quick action buttons */}
            {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && 
             messages[messages.length - 1]?.content.includes('**Current value:**') && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSend('keep current')}
                  disabled={isLoading || !sessionId}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Keep Current
                </Button>
                <Button
                  onClick={() => handleSend('skip')}
                  disabled={isLoading || !sessionId}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Clear Field
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here..."
                className="min-h-[80px] resize-none"
                disabled={isLoading || !sessionId}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || !sessionId}
                size="icon"
                className="h-[80px] w-[80px]"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="pt-2 border-t">
            <Button 
              onClick={() => handleClose()} 
              className="w-full"
            >
              Close Guide
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
