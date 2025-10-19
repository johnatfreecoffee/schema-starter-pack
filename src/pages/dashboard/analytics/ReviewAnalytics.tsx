import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Star, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import { exportReviewsToCSV } from '@/lib/reviewExport';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewStatusBadge } from '@/components/reviews/ReviewStatusBadge';
import { format } from 'date-fns';

export default function ReviewAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: 0,
    avgRating: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    responseRate: 0
  });
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [reviewsOverTime, setReviewsOverTime] = useState<any[]>([]);
  const [reviewsByService, setReviewsByService] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      // Fetch all reviews
      const { data: allReviews } = await supabase
        .from('reviews')
        .select(`
          *,
          accounts(account_name),
          services(name)
        `)
        .order('submitted_at', { ascending: false });

      if (!allReviews) return;

      // Calculate metrics
      const approved = allReviews.filter(r => r.status === 'approved');
      const avgRating = approved.length > 0
        ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
        : 0;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonth = allReviews.filter(
        r => new Date(r.submitted_at) >= thisMonthStart
      ).length;

      const lastMonth = allReviews.filter(
        r => new Date(r.submitted_at) >= lastMonthStart &&
           new Date(r.submitted_at) <= lastMonthEnd
      ).length;

      const pending = allReviews.filter(r => r.status === 'pending').length;

      const withResponse = allReviews.filter(r => r.response_text).length;
      const responseRate = allReviews.length > 0
        ? (withResponse / allReviews.length) * 100
        : 0;

      setMetrics({
        total: allReviews.length,
        avgRating,
        thisMonth,
        lastMonth,
        pending,
        responseRate
      });

      // Rating distribution
      const distribution = [5, 4, 3, 2, 1].map(rating => ({
        rating: `${rating} Stars`,
        count: allReviews.filter(r => r.rating === rating).length
      }));
      setRatingDistribution(distribution);

      // Reviews over time (last 12 months)
      const monthlyData: any = {};
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = format(date, 'MMM yyyy');
        monthlyData[key] = 0;
      }

      allReviews.forEach(review => {
        const key = format(new Date(review.submitted_at), 'MMM yyyy');
        if (monthlyData[key] !== undefined) {
          monthlyData[key]++;
        }
      });

      const timelineData = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        reviews: count
      }));
      setReviewsOverTime(timelineData);

      // Reviews by service
      const serviceMap: any = {};
      allReviews.forEach(review => {
        if (review.services?.name) {
          serviceMap[review.services.name] = (serviceMap[review.services.name] || 0) + 1;
        }
      });

      const serviceData = Object.entries(serviceMap)
        .map(([name, count]) => ({ service: name, reviews: count }))
        .sort((a: any, b: any) => b.reviews - a.reviews)
        .slice(0, 10);
      setReviewsByService(serviceData);

      // Recent reviews
      setRecentReviews(allReviews.slice(0, 20));

    } catch (error: any) {
      toast({
        title: 'Error loading analytics',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    const result = await exportReviewsToCSV();
    if (result.success) {
      toast({
        title: 'Export successful',
        description: `Exported ${result.count} reviews to CSV`
      });
    } else {
      toast({
        title: 'Export failed',
        description: 'Unable to export reviews',
        variant: 'destructive'
      });
    }
  }

  const monthChange = metrics.lastMonth > 0
    ? ((metrics.thisMonth - metrics.lastMonth) / metrics.lastMonth) * 100
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div>Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Review Analytics</h1>
            <p className="text-muted-foreground">
              Insights into your customer reviews and feedback
            </p>
          </div>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgRating.toFixed(1)}</div>
              <div className="flex items-center mt-1">
                <StarRating rating={Math.round(metrics.avgRating)} size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className={`h-4 w-4 ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(0)}% vs last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.responseRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Reviews with response</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reviewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="reviews" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Reviews by Service */}
        {reviewsByService.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reviews by Service (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reviewsByService} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="service" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="reviews" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="font-medium">{review.customer_name}</span>
                      <ReviewStatusBadge status={review.status} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.review_text}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{format(new Date(review.submitted_at), 'MMM d, yyyy')}</span>
                      {review.services?.name && (
                        <>
                          <span>•</span>
                          <span>{review.services.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
