import { useState, useEffect } from 'react';
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
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import AIHTMLRenderer from '@/components/ai/AIHTMLRenderer';
import { SEOHead } from '@/components/seo/SEOHead';
import { renderTemplate } from '@/lib/templateEngine';


export default function Reviews() {
  const { toast } = useToast();
  const { data: company } = useCompanySettings();
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // Check if a Static Page exists for the reviews slug
  const { data: staticReviews, isLoading: staticLoading } = useCachedQuery({
    queryKey: ['static-page', 'reviews'],
    cacheKey: 'pages:static:reviews',
    cacheTTL: 60 * 60 * 1000, // 1 hour
    bypassCache: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', 'reviews')
        .eq('status', true)
        .single();
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    loadSettings();
    loadServices();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [serviceFilter, ratingFilter, sortBy, page, settings]);

  async function loadSettings() {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .single();
    
    if (data) {
      setSettings(data);
      setPerPage(data.reviews_per_page || 12);
      setSortBy(data.reviews_default_sort || 'featured');
    }
  }

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .order('name');
    setServices(data || []);
  }

  async function loadReviews() {
    setLoading(true);

    // Check if reviews are enabled
    if (settings && !settings.reviews_enabled) {
      setReviews([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('reviews')
      .select(`
        *,
        services(name)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .eq('display_on_website', true);

    // Apply minimum rating filter from settings
    if (settings?.reviews_min_rating) {
      query = query.gte('rating', settings.reviews_min_rating);
    }

    if (serviceFilter !== 'all') {
      query = query.eq('service_id', serviceFilter);
    }

    if (ratingFilter !== 'all') {
      query = query.eq('rating', parseInt(ratingFilter));
    }

    // Apply sorting based on settings or user selection
    const currentSort = sortBy || settings?.reviews_default_sort || 'featured';
    if (currentSort === 'featured') {
      query = query.order('featured', { ascending: false });
    } else if (currentSort === 'newest') {
      query = query.order('submitted_at', { ascending: false });
    } else if (currentSort === 'highest') {
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

  if (staticLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (staticReviews) {
    let renderedContent = staticReviews.content_html as string;
    if (company) {
      try {
        const templateData = {
          company_name: company.business_name || '',
          company_phone: company.phone || '',
          company_email: company.email || '',
          company_address: company.address || '',
          company_website: company.website_url || '',
          years_experience: company.years_experience || 0,
          license_number: company.license_numbers || '',
          business_slogan: company.business_slogan || '',
          logo_url: company.logo_url || '',
          icon_url: company.icon_url || '',
          business_hours: company.business_hours || '',
          address_street: company.address_street || '',
          address_unit: company.address_unit || '',
          address_city: company.address_city || '',
          address_state: company.address_state || '',
          address_zip: company.address_zip || '',
          service_radius: company.service_radius || '',
          service_radius_unit: company.service_radius_unit || 'miles',
          email_from_name: company.email_from_name || '',
          email_signature: company.email_signature || '',
          description: company.description || '',
          license_numbers: company.license_numbers || '',
        };
        renderedContent = renderTemplate(staticReviews.content_html, templateData);
      } catch (e) {
        console.error('Reviews page template render error:', e);
      }
    }

    renderedContent = renderedContent.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');

    const canonicalUrl = `${window.location.origin}/reviews`;
    const isRichLandingPage = renderedContent.includes('class="min-h-screen"') || renderedContent.includes('className="min-h-screen"');

    return (
      <>
        <SEOHead
          title={staticReviews.title}
          description={staticReviews.meta_description || company?.description || ''}
          canonical={canonicalUrl}
          ogImage={company?.logo_url}
        />
        {isRichLandingPage ? (
          <AIHTMLRenderer html={renderedContent} />
        ) : (
          <div className="container mx-auto px-4 py-8">
            <AIHTMLRenderer html={renderedContent} />
          </div>
        )}
      </>
    );
  }

  // Fallback: legacy reviews page with filtering
  return (
    <>
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

          {settings && !settings.reviews_enabled ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Reviews are currently disabled.</p>
              <p className="text-sm mt-2">Please check back later.</p>
            </div>
          ) : (
            <>
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
                        settings={settings}
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
            </>
          )}
        </div>
      </main>
    </>
  );
}