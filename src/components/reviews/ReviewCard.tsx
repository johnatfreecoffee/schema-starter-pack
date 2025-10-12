import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { format } from 'date-fns';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    review_title: string;
    review_text: string;
    customer_name: string;
    customer_location?: string;
    submitted_at: string;
    service_id?: string;
    response_text?: string;
    response_at?: string;
  };
  serviceName?: string;
  showResponse?: boolean;
}

export function ReviewCard({ review, serviceName, showResponse = true }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <StarRating rating={review.rating} size="sm" />
            <h3 className="font-semibold text-lg">{review.review_title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{review.customer_name}</span>
              {review.customer_location && (
                <>
                  <span>•</span>
                  <span>{review.customer_location}</span>
                </>
              )}
              <span>•</span>
              <span>{format(new Date(review.submitted_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
          {serviceName && (
            <Badge variant="secondary">{serviceName}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          {review.review_text}
        </p>
        
        {showResponse && review.response_text && (
          <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
            <p className="text-sm font-medium mb-2">Response from business:</p>
            <p className="text-sm text-muted-foreground">{review.response_text}</p>
            {review.response_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(review.response_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}