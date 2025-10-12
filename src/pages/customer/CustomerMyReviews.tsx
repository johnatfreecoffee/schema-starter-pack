import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewStatusBadge } from '@/components/reviews/ReviewStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CustomerMyReviews() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (!account) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        services(name)
      `)
      .eq('account_id', account.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading reviews",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Reviews</h1>
            <p className="text-muted-foreground">View and manage your submitted reviews</p>
          </div>
          <Button onClick={() => navigate('/portal/submit-review')}>
            <Plus className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        </div>

        {loading ? (
          <div>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't submitted any reviews yet
              </p>
              <Button onClick={() => navigate('/portal/submit-review')}>
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <StarRating rating={review.rating} size="sm" />
                        <ReviewStatusBadge status={review.status} />
                      </div>
                      <h3 className="font-semibold text-lg">{review.review_title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(review.submitted_at), 'MMM d, yyyy')}</span>
                        {review.services && (
                          <>
                            <span>•</span>
                            <span>{review.services.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{review.review_text}</p>
                  
                  {review.status === 'approved' && (
                    <div className="text-sm text-green-600">
                      ✓ This review is published on our website
                    </div>
                  )}
                  
                  {review.status === 'pending' && (
                    <div className="text-sm text-yellow-600">
                      ⏳ Your review is pending approval
                    </div>
                  )}
                  
                  {review.response_text && (
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
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}