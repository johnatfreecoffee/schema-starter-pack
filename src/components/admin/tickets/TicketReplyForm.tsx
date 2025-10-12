import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';

interface TicketReplyFormProps {
  onSubmit: (message: string, isInternalNote: boolean) => Promise<void>;
  isSubmitting: boolean;
}

export const TicketReplyForm = ({ onSubmit, isSubmitting }: TicketReplyFormProps) => {
  const [message, setMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    await onSubmit(message, isInternalNote);
    setMessage('');
    setIsInternalNote(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your reply..."
          rows={4}
          required
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="internal-note"
            checked={isInternalNote}
            onCheckedChange={(checked) => setIsInternalNote(checked as boolean)}
          />
          <Label htmlFor="internal-note" className="text-sm cursor-pointer">
            Internal note (hidden from customer)
          </Label>
        </div>

        <Button type="submit" disabled={isSubmitting || !message.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </form>
  );
};
