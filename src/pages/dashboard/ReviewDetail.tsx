import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewStatusBadge } from '@/components/reviews/ReviewStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, CheckCircle, XCircle, Archive, AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadReview();
    loadServices();
  }, [id]);

  async function loadReview() {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        accounts(id, account_name, email),
        services(id, name),
        projects(id, project_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: "Error loading review",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setReview(data);
      setResponseText(data.response_text || '');
    }
    setLoading(false);
  }

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .order('name');
    setServices(data || []);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('reviews')
      .update({
        customer_name: review.customer_name,
        customer_location: review.customer_location,
        review_title: review.review_title,
        review_text: review.review_text,
        rating: review.rating,
        featured: review.featured,
        display_on_website: review.display_on_website,
        service_id: review.service_id || null
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error saving review",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Review updated successfully" });
      loadReview();
    }
    setSaving(false);
  }

  async function handleStatusChange(newStatus: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updates: any = { status: newStatus };
    
    if (newStatus === 'approved') {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user?.id;
    }

    const { error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: `Review ${newStatus}` });
      loadReview();
    }
  }

  async function handleClearFlag() {
    const { error } = await supabase
      .from('reviews')
      .update({
        is_flagged: false,
        flag_reason: null
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error clearing flag",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Flag cleared successfully" });
      loadReview();
    }
  }

  async function handlePostResponse() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('reviews')
      .update({
        response_text: responseText,
        response_at: new Date().toISOString(),
        response_by: user?.id
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error posting response",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Response posted successfully" });
      loadReview();
    }
  }

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
  if (!review) return <AdminLayout><div>Review not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/reviews')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Review Details</h1>
            <p className="text-muted-foreground">View and manage review</p>
          </div>
          <div className="flex gap-2">
            {review.status === 'pending' && (
              <>
                <Button onClick={() => handleStatusChange('approved')} variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button onClick={() => handleStatusChange('rejected')} variant="destructive">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            {review.status !== 'archived' && (
              <Button onClick={() => handleStatusChange('archived')} variant="outline">
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            )}
          </div>
        </div>

        {review.is_flagged && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>This review has been flagged</AlertTitle>
            <AlertDescription className="flex items-start justify-between">
              <span>{review.flag_reason || 'Flagged by spam filter for manual review'}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFlag}
                className="ml-4"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Flag
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Review Information</CardTitle>
                  <ReviewStatusBadge status={review.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <StarRating
                    rating={review.rating}
                    size="lg"
                    interactive
                    onChange={(rating) => setReview({ ...review, rating })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name (Display)</Label>
                  <Input
                    id="customer_name"
                    value={review.customer_name}
                    onChange={(e) => setReview({ ...review, customer_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_location">Customer Location</Label>
                  <Input
                    id="customer_location"
                    value={review.customer_location || ''}
                    onChange={(e) => setReview({ ...review, customer_location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review_title">Review Title</Label>
                  <Input
                    id="review_title"
                    value={review.review_title}
                    onChange={(e) => setReview({ ...review, review_title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review_text">Review Text</Label>
                  <Textarea
                    id="review_text"
                    value={review.review_text}
                    onChange={(e) => setReview({ ...review, review_text: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={review.service_id || ''}
                    onValueChange={(value) => setReview({ ...review, service_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No service</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Featured Review</Label>
                    <p className="text-sm text-muted-foreground">
                      Display on homepage
                    </p>
                  </div>
                  <Switch
                    checked={review.featured}
                    onCheckedChange={(checked) => setReview({ ...review, featured: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Display on Website</Label>
                    <p className="text-sm text-muted-foreground">
                      Show in public reviews
                    </p>
                  </div>
                  <Switch
                    checked={review.display_on_website}
                    onCheckedChange={(checked) => setReview({ ...review, display_on_website: checked })}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write a response to this review..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                />
                <Button onClick={handlePostResponse} disabled={!responseText.trim()}>
                  Post Response
                </Button>
                {review.response_at && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {format(new Date(review.response_at), 'PPp')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.accounts && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Account</Label>
                      <p className="font-medium">{review.accounts.account_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{review.accounts.email}</p>
                    </div>
                  </>
                )}
                {review.projects && (
                  <div>
                    <Label className="text-muted-foreground">Project</Label>
                    <p className="font-medium">{review.projects.project_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p className="font-medium capitalize">{review.source}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {format(new Date(review.submitted_at), 'PPp')}
                  </p>
                </div>
                {review.approved_at && (
                  <div>
                    <Label className="text-muted-foreground">Approved</Label>
                    <p className="font-medium">
                      {format(new Date(review.approved_at), 'PPp')}
                    </p>
                  </div>
                )}
                {review.external_url && (
                  <div>
                    <Label className="text-muted-foreground">External Link</Label>
                    <a
                      href={review.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View original
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}