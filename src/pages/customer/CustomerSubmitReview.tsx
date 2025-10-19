import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewPhotoUpload } from '@/components/reviews/ReviewPhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { checkReviewForSpam, checkForDuplicateReview } from '@/lib/spamFilter';
import { sendNewReviewNotification } from '@/lib/reviewEmailNotifications';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CustomerSubmitReview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    service_id: searchParams.get('service_id') || '',
    rating: 5,
    review_title: '',
    review_text: ''
  });
  const [charCount, setCharCount] = useState(0);
  const minChars = 50;

  useEffect(() => {
    loadServices();
    loadAccount();
    loadSettings();
  }, []);

  useEffect(() => {
    // Pre-select service if provided in URL
    const serviceIdFromUrl = searchParams.get('service_id');
    if (serviceIdFromUrl) {
      setFormData(prev => ({ ...prev, service_id: serviceIdFromUrl }));
    }
  }, [searchParams]);

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .order('name');
    setServices(data || []);
  }

  async function loadAccount() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    setAccount(data);
  }

  async function loadSettings() {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .single();
    setSettings(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.review_text.length < minChars) {
      toast({
        title: "Review too short",
        description: `Please write at least ${minChars} characters`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Check for spam if enabled
      let isFlagged = false;
      let flagReason = '';

      if (settings?.reviews_spam_filter_enabled) {
        // Check for duplicates
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('review_text')
          .eq('account_id', account?.id);

        if (existingReviews && checkForDuplicateReview(formData.review_text, existingReviews)) {
          toast({
            title: "Duplicate review detected",
            description: "You've already submitted a similar review",
            variant: "destructive"
          });
          setSubmitting(false);
          return;
        }

        // Check for spam indicators
        const spamCheck = checkReviewForSpam(formData.review_title, formData.review_text);
        if (spamCheck.isFlagged) {
          isFlagged = true;
          flagReason = spamCheck.reasons.join(', ');
        }
      }

      const reviewData = {
        account_id: account?.id,
        service_id: formData.service_id || null,
        rating: formData.rating,
        review_title: formData.review_title,
        review_text: formData.review_text,
        customer_name: account?.account_name || 'Anonymous',
        customer_location: '',
        source: 'portal' as const,
        status: 'pending' as const,
        submitted_at: new Date().toISOString(),
        photo_url: photoUrl || null,
        is_flagged: isFlagged,
        flag_reason: flagReason || null
      };

      const { data: newReview, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) throw error;

      // Send email notification to admin
      if (newReview) {
        const service = services.find(s => s.id === formData.service_id);
        await sendNewReviewNotification({
          reviewId: newReview.id,
          customerName: reviewData.customer_name,
          customerEmail: account?.email || '',
          rating: formData.rating,
          reviewTitle: formData.review_title,
          reviewText: formData.review_text,
          serviceName: service?.name,
          adminReviewUrl: `${window.location.origin}/dashboard/reviews/${newReview.id}`
        });
      }

      toast({
        title: "Thank you for your review!",
        description: isFlagged 
          ? "Your review has been submitted and is pending review."
          : "Your review will be published after approval."
      });

      // Redirect back to service page if service_id was in URL
      const serviceIdFromUrl = searchParams.get('service_id');
      if (serviceIdFromUrl && newReview.service_id) {
        const service = services.find(s => s.id === serviceIdFromUrl);
        if (service) {
          // Navigate to service page (you'll need to fetch the service slug)
          navigate('/portal/my-reviews');
        }
      } else {
        navigate('/portal/my-reviews');
      }
    } catch (error: any) {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  const handleTextChange = (text: string) => {
    setFormData({ ...formData, review_text: text });
    setCharCount(text.length);
  };

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Submit a Review</h1>
          <p className="text-muted-foreground">Share your experience with us</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>
                Your feedback helps us improve and helps others make informed decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service (Optional)</Label>
                {searchParams.get('service_id') ? (
                  <>
                    <Input
                      value={services.find(s => s.id === formData.service_id)?.name || 'Loading...'}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      You're reviewing: {services.find(s => s.id === formData.service_id)?.name}
                    </p>
                  </>
                ) : (
                  <Select
                    value={formData.service_id}
                    onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General Review</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Your Rating *</Label>
                <div className="flex items-center gap-4">
                  <StarRating
                    rating={formData.rating}
                    size="lg"
                    interactive
                    onChange={(rating) => setFormData({ ...formData, rating })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.rating} out of 5 stars
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_title">Review Title *</Label>
                <Input
                  id="review_title"
                  value={formData.review_title}
                  onChange={(e) => setFormData({ ...formData, review_title: e.target.value })}
                  placeholder="Sum up your experience"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_text">Your Review *</Label>
                <Textarea
                  id="review_text"
                  value={formData.review_text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Share your experience with us..."
                  rows={8}
                  required
                />
                <div className="flex justify-between text-sm">
                  <span className={charCount < minChars ? "text-destructive" : "text-muted-foreground"}>
                    {charCount} / {minChars} characters minimum
                  </span>
                  {charCount < minChars && (
                    <span className="text-destructive">
                      {minChars - charCount} more characters needed
                    </span>
                  )}
                </div>
              </div>

              {settings?.reviews_allow_photos && (
                <ReviewPhotoUpload
                  onPhotoUploaded={(url) => setPhotoUrl(url)}
                  onPhotoRemoved={() => setPhotoUrl('')}
                />
              )}

              <Button
                type="submit"
                disabled={submitting || charCount < minChars}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Your review will be reviewed and published within 1-2 business days
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </CustomerLayout>
  );
}