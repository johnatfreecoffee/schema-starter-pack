import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/reviews/StarRating';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ReviewNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    account_id: '',
    service_id: '',
    rating: 5,
    review_title: '',
    review_text: '',
    customer_name: '',
    customer_location: '',
    source: 'manual',
    auto_approve: true,
    featured: false,
    display_on_website: true
  });

  useEffect(() => {
    loadAccounts();
    loadServices();
  }, []);

  async function loadAccounts() {
    const { data } = await supabase
      .from('accounts')
      .select('id, account_name')
      .order('account_name');
    setAccounts(data || []);
  }

  async function loadServices() {
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .order('name');
    setServices(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const reviewData: any = {
      account_id: formData.account_id || null,
      service_id: formData.service_id || null,
      rating: formData.rating,
      review_title: formData.review_title,
      review_text: formData.review_text,
      customer_name: formData.customer_name,
      customer_location: formData.customer_location,
      source: formData.source,
      status: formData.auto_approve ? 'approved' : 'pending',
      featured: formData.featured,
      display_on_website: formData.display_on_website,
      submitted_at: new Date().toISOString()
    };

    if (formData.auto_approve) {
      reviewData.approved_at = new Date().toISOString();
      reviewData.approved_by = user?.id;
    }

    const { error } = await supabase
      .from('reviews')
      .insert(reviewData);

    if (error) {
      toast({
        title: "Error creating review",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Review created successfully" });
      navigate('/dashboard/reviews');
    }
    setSaving(false);
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/reviews')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add Review</h1>
            <p className="text-muted-foreground">Manually add a customer review</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Review Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">Customer Account (Optional)</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No account</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service (Optional)</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
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

              <div className="space-y-2">
                <Label>Rating *</Label>
                <StarRating
                  rating={formData.rating}
                  size="lg"
                  interactive
                  onChange={(rating) => setFormData({ ...formData, rating })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_location">Customer Location</Label>
                <Input
                  id="customer_location"
                  value={formData.customer_location}
                  onChange={(e) => setFormData({ ...formData, customer_location: e.target.value })}
                  placeholder="City, State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_title">Review Title *</Label>
                <Input
                  id="review_title"
                  value={formData.review_title}
                  onChange={(e) => setFormData({ ...formData, review_title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_text">Review Text *</Label>
                <Textarea
                  id="review_text"
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Approve</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve this review
                  </p>
                </div>
                <Switch
                  checked={formData.auto_approve}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_approve: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Display on homepage
                  </p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
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
                  checked={formData.display_on_website}
                  onCheckedChange={(checked) => setFormData({ ...formData, display_on_website: checked })}
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Create Review
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}