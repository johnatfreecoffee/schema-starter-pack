import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewCard } from './ReviewCard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function FeaturedReviewsWidget() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadFeaturedReviews();
  }, []);

  async function loadFeaturedReviews() {
    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        services(name)
      `)
      .eq('status', 'approved')
      .eq('featured', true)
      .eq('display_on_website', true)
      .order('submitted_at', { ascending: false })
      .limit(3);

    if (data) {
      setReviews(data);
    }
  }

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-muted-foreground">
            Real reviews from satisfied customers
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              serviceName={review.services?.name}
            />
          ))}
        </div>
        <div className="text-center">
          <Button onClick={() => navigate('/reviews')} variant="outline">
            View All Reviews
          </Button>
        </div>
      </div>
    </section>
  );
}