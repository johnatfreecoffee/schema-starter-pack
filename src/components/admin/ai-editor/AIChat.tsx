import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AIChatProps {
  onSendCommand: (command: string) => void;
  isLoading: boolean;
}

const QUICK_COMMANDS = [
  { label: 'Improve headline', command: 'Make the main headline more compelling and attention-grabbing' },
  { label: 'Make CTA compelling', command: 'Rewrite the call-to-action button text to be more persuasive' },
  { label: 'Add testimonials', command: 'Add a testimonials section with placeholder content after the main service description' },
  { label: 'Optimize for SEO', command: 'Optimize this page for search engines by improving headers, meta description, and keyword placement' },
  { label: 'More conversational', command: 'Rewrite the content in a more conversational, friendly tone' },
];

const AIChat = ({ onSendCommand, isLoading }: AIChatProps) => {
  const [command, setCommand] = useState('');

  const handleSend = () => {
    if (command.trim() && !isLoading) {
      onSendCommand(command.trim());
      setCommand('');
    }
  };

  const handleQuickCommand = (quickCommand: string) => {
    setCommand(quickCommand);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">AI Page Editor</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Quick Commands</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((qc) => (
            <Button
              key={qc.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickCommand(qc.command)}
              disabled={isLoading}
            >
              {qc.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Describe your changes</label>
        <Textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Example: Make the headline more urgent, Add a FAQ section at the bottom, Change all 'call us' to 'contact us today'"
          rows={4}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSend();
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Press Ctrl+Enter to send
        </p>
      </div>

      <Button
        onClick={handleSend}
        disabled={!command.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>Processing...</>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Command
          </>
        )}
      </Button>

      <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
        <p className="font-medium">Example commands:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Make the headline more urgent</li>
          <li>Add a testimonial section after the intro</li>
          <li>Rewrite in a more conversational tone</li>
          <li>Add more white space between sections</li>
          <li>Create a compelling call-to-action</li>
        </ul>
      </div>
    </div>
  );
};

export default AIChat;