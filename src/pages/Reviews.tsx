import { useState, useEffect } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { supabase } from '@/integrations/supabase/client';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReviewSchemaMarkup } from '@/components/reviews/ReviewSchemaMarkup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


export default function Reviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [serviceFilter, ratingFilter, sortBy, page]);

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .order('name');
    setServices(data || []);
  }

  async function loadReviews() {
    setLoading(true);
    let query = supabase
      .from('reviews')
      .select(`
        *,
        services(name)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .eq('display_on_website', true);

    if (serviceFilter !== 'all') {
      query = query.eq('service_id', serviceFilter);
    }

    if (ratingFilter !== 'all') {
      query = query.eq('rating', parseInt(ratingFilter));
    }

    // Apply sorting
    if (sortBy === 'featured') {
      query = query.order('featured', { ascending: false });
    } else if (sortBy === 'newest') {
      query = query.order('submitted_at', { ascending: false });
    } else if (sortBy === 'highest') {
      query = query.order('rating', { ascending: false });
    }

    // Always add secondary sort
    query = query.order('submitted_at', { ascending: false });

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

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

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <PublicLayout>
      <ReviewSchemaMarkup
        reviews={reviews}
        aggregateRating={{
          ratingValue: avgRating,
          reviewCount: reviews.length
        }}
      />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Customer Reviews</h1>
            <p className="text-xl text-muted-foreground mb-6">
              See what our customers have to say about their experience
            </p>
            {reviews.length > 0 && (
              <div className="flex items-center justify-center gap-4">
                <StarRating rating={avgRating} size="lg" showNumber />
                <span className="text-muted-foreground">
                  Based on {reviews.length} reviews
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured First</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No reviews found matching your filters
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    serviceName={review.services?.name}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={reviews.length < perPage}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </PublicLayout>
  );
}