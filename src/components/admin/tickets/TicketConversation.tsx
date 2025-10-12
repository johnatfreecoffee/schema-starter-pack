import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  message: string;
  created_at: string;
  is_internal_note: boolean;
  sender_email?: string;
  sender_name?: string;
}

interface TicketConversationProps {
  messages: Message[];
  currentUserEmail?: string;
}

export const TicketConversation = ({ messages, currentUserEmail }: TicketConversationProps) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.sender_email === currentUserEmail;
        const initials = (message.sender_name || message.sender_email || '?')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase();

        return (
          <Card
            key={message.id}
            className={`p-4 ${isCurrentUser ? 'ml-8' : 'mr-8'} ${
              message.is_internal_note ? 'bg-yellow-50 border-yellow-200' : ''
            }`}
          >
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    {message.sender_name || message.sender_email}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                  {message.is_internal_note && (
                    <Badge variant="outline" className="bg-yellow-100">
                      Internal Note
                    </Badge>
                  )}
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {message.message}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
