import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewCard } from './ReviewCard';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceReviewsProps {
  serviceId: string;
  serviceName: string;
}

export function ServiceReviews({ serviceId, serviceName }: ServiceReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    breakdown: [] as { rating: number; count: number; percentage: number }[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServiceReviews();
  }, [serviceId]);

  async function loadServiceReviews() {
    setLoading(true);
    
    // Load all reviews for this service (for stats)
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('service_id', serviceId)
      .eq('status', 'approved')
      .eq('display_on_website', true);

    // Load recent reviews to display
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'approved')
      .eq('display_on_website', true)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (allReviews && allReviews.length > 0) {
      // Calculate stats
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      // Calculate breakdown
      const breakdown = [5, 4, 3, 2, 1].map(rating => {
        const count = allReviews.filter(r => r.rating === rating).length;
        return {
          rating,
          count,
          percentage: (count / allReviews.length) * 100
        };
      });

      setStats({
        avgRating,
        totalReviews: allReviews.length,
        breakdown
      });
    }

    setReviews(recentReviews || []);
    setLoading(false);
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading reviews...</div>;
  }

  if (stats.totalReviews === 0) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-center">Customer Reviews</h2>
          <p className="text-center text-muted-foreground">
            No reviews yet for this service. Be the first to leave a review!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Customer Reviews for {serviceName}</h2>

        {/* Aggregate Rating */}
        <Card className="mb-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Overall Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="text-5xl font-bold">{stats.avgRating.toFixed(1)}</div>
              <StarRating rating={stats.avgRating} size="lg" />
              <p className="text-muted-foreground">Based on {stats.totalReviews} reviews</p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {stats.breakdown.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">{rating} star</span>
                  <div className="flex-1 bg-muted rounded-full h-3">
                    <div
                      className="bg-primary rounded-full h-3 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <>
            <h3 className="text-2xl font-semibold mb-6 text-center">Recent Reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            <div className="text-center">
              <Button asChild>
                <Link to={`/portal/submit-review?service_id=${serviceId}`}>
                  Write a Review
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
