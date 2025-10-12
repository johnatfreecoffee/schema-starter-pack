import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CustomerSubmitReview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    service_id: '',
    rating: 5,
    review_title: '',
    review_text: ''
  });
  const [charCount, setCharCount] = useState(0);
  const minChars = 50;

  useEffect(() => {
    loadServices();
    loadAccount();
  }, []);

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
      submitted_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('reviews')
      .insert([reviewData]);

    if (error) {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Thank you for your review!",
        description: "Your review will be published after approval."
      });
      navigate('/portal/my-reviews');
    }
    setSubmitting(false);
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