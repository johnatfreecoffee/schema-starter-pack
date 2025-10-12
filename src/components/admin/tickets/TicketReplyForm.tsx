import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { CannedResponseSelector } from './CannedResponseSelector';
import { FileAttachments } from './FileAttachments';

interface TicketReplyFormProps {
  onSubmit: (message: string, isInternalNote: boolean, attachments: string[]) => Promise<void>;
  isSubmitting: boolean;
  customerName?: string;
  ticketNumber?: string;
}

export const TicketReplyForm = ({ onSubmit, isSubmitting, customerName, ticketNumber }: TicketReplyFormProps) => {
  const [message, setMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    await onSubmit(message, isInternalNote, attachments);
    setMessage('');
    setIsInternalNote(false);
    setAttachments([]);
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
      
      <FileAttachments
        onFilesUploaded={setAttachments}
        existingFiles={attachments}
        maxFiles={5}
      />
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <CannedResponseSelector
            onSelect={(content) => setMessage(message ? message + '\n\n' + content : content)}
            customerName={customerName}
            ticketNumber={ticketNumber}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="internal-note"
              checked={isInternalNote}
              onCheckedChange={(checked) => setIsInternalNote(checked as boolean)}
            />
            <Label htmlFor="internal-note" className="text-sm cursor-pointer">
              Internal note
            </Label>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting || !message.trim()}>
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Sending...' : 'Send Reply'}
        </Button>
      </div>
    </form>
  );
};
