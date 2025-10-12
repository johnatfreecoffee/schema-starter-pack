import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export function ReviewsAnalyticsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    pending: 0,
    thisMonth: 0,
    breakdown: [] as { rating: number; count: number }[]
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    // Get all approved reviews
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating, submitted_at');

    // Get pending reviews
    const { data: pendingReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('status', 'pending');

    // Get this month's reviews
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthReviews } = await supabase
      .from('reviews')
      .select('id')
      .gte('submitted_at', startOfMonth.toISOString());

    if (allReviews) {
      // Calculate average rating
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      // Calculate rating breakdown
      const breakdown = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: allReviews.filter(r => r.rating === rating).length
      }));

      setStats({
        total: allReviews.length,
        avgRating,
        pending: pendingReviews?.length || 0,
        thisMonth: monthReviews?.length || 0,
        breakdown
      });
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Reviews & Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
            <StarRating rating={stats.avgRating} size="sm" showNumber />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div
            className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
            onClick={() => navigate('/dashboard/reviews?status=pending')}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
            <p className="text-2xl font-bold">{stats.thisMonth}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Rating Breakdown</p>
          {stats.breakdown.reverse().map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-8">{rating}★</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}