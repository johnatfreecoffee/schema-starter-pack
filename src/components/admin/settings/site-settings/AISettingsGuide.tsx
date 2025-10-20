import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, Sparkles, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AISettingsGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTab: string;
  currentSettings: any;
  onApplyUpdates: (updates: any) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AISettingsGuide = ({
  open,
  onOpenChange,
  currentTab,
  currentSettings,
  onApplyUpdates,
}: AISettingsGuideProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI guide for setting up company settings. I'm currently helping you with the "${currentTab}" section. 

You can either:
1. Tell me about your business in your own words, and I'll fill out the fields for you
2. Give me specific information to enter (e.g., "Our phone number is 555-123-4567")
3. Ask me what information you need to provide

What would you like to do?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('company-settings-ai-guide', {
        body: {
          prompt: userMessage,
          currentTab,
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
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error}`
        }]);
        return;
      }

      // Extract guidance and updates
      const { guidance, ...updates } = data;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: guidance
      }]);

      // Apply updates if any fields were provided
      const fieldsToUpdate = Object.keys(updates).filter(key => updates[key] !== undefined && updates[key] !== null && updates[key] !== '');
      
      if (fieldsToUpdate.length > 0) {
        onApplyUpdates(updates);
        toast({
          title: 'Settings Updated',
          description: `Updated ${fieldsToUpdate.length} field${fieldsToUpdate.length > 1 ? 's' : ''} based on your input.`,
        });
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

  const getTabExamples = () => {
    const examples: Record<string, string[]> = {
      'basic': [
        "We're a roofing company with 22 years of experience",
        "Our slogan is 'Your Trusted Roofing Experts'",
        "Write a description about storm restoration services"
      ],
      'contact': [
        "Our office is at 123 Main St, New Orleans, LA 70112",
        "Phone number is 504-555-1234, email is info@company.com",
        "We service within 50 miles"
      ],
      'business': [
        "We're open Monday-Friday 8am-6pm, Saturday 9am-4pm",
        "Our license number is LA-12345",
        "Generate typical contractor business hours"
      ],
      'social': [
        "Our Facebook is facebook.com/ourcompany",
        "We're on Instagram @ourcompany",
        "Add all our social media: facebook.com/company, instagram.com/company"
      ]
    };

    return examples[currentTab] || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Settings Guide - {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Tell me about your business and I'll help fill out the form
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
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {getTabExamples().length > 0 && messages.length <= 2 && (
          <div className="space-y-2 py-2 border-t">
            <p className="text-xs text-muted-foreground">Try saying:</p>
            <div className="flex flex-wrap gap-2">
              {getTabExamples().map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(example)}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your business or ask what you need to provide..."
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
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
      </DialogContent>
    </Dialog>
  );
};
