import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SatisfactionRatingProps {
  ticketId: string;
  ticketNumber: string;
  onSubmitted?: () => void;
}

export const SatisfactionRating = ({ ticketId, ticketNumber, onSubmitted }: SatisfactionRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const submitRating = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tickets')
        .update({
          satisfaction_rating: rating,
          satisfaction_comment: comment || null,
          satisfaction_rated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['customer-tickets'] });
      toast({
        title: 'Thank you for your feedback!',
        description: 'Your rating has been submitted.'
      });
      if (onSubmitted) onSubmitted();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive'
      });
      console.error('Error submitting rating:', error);
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: 'Please select a rating',
        description: 'Choose a star rating before submitting.',
        variant: 'destructive'
      });
      return;
    }
    submitRating.mutate();
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">How was your experience?</h3>
        <p className="text-sm text-muted-foreground">
          Please rate your experience with ticket #{ticketNumber}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating} {rating === 1 ? 'star' : 'stars'}
          </span>
        )}
      </div>

      <div>
        <Textarea
          placeholder="Additional comments (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitRating.isPending || rating === 0}
        className="w-full"
      >
        {submitRating.isPending ? 'Submitting...' : 'Submit Rating'}
      </Button>
    </Card>
  );
};
