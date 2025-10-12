import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewStatusBadge } from '@/components/reviews/ReviewStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Reviews() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  useEffect(() => {
    loadReviews();
    loadServices();
  }, [statusFilter, ratingFilter, serviceFilter, dateFrom, dateTo]);

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
        accounts(account_name),
        services(name)
      `)
      .order('submitted_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as 'approved' | 'pending' | 'rejected' | 'archived');
    }

    if (ratingFilter !== 'all') {
      query = query.eq('rating', parseInt(ratingFilter));
    }

    if (serviceFilter !== 'all') {
      query = query.eq('service_id', serviceFilter);
    }

    if (dateFrom) {
      query = query.gte('submitted_at', new Date(dateFrom).toISOString());
    }

    if (dateTo) {
      query = query.lte('submitted_at', new Date(dateTo).toISOString());
    }

    const { data, error } = await query;

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

  const filteredReviews = reviews.filter(review =>
    review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.review_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleQuickApprove(reviewId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('reviews')
      .update({
        status: 'approved' as const,
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', reviewId);

    if (error) {
      toast({
        title: "Error approving review",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Review approved" });
      loadReviews();
    }
  }

  async function handleQuickReject(reviewId: string) {
    const { error } = await supabase
      .from('reviews')
      .update({ status: 'rejected' as const })
      .eq('id', reviewId);

    if (error) {
      toast({
        title: "Error rejecting review",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Review rejected" });
      loadReviews();
    }
  }

  async function handleBulkAction(action: string) {
    if (selectedReviews.length === 0) {
      toast({
        title: "No reviews selected",
        description: "Please select reviews to perform bulk actions",
        variant: "destructive"
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    let updates: any = {};

    switch (action) {
      case 'approve':
        updates = { status: 'approved' as const, approved_at: new Date().toISOString(), approved_by: user?.id };
        break;
      case 'reject':
        updates = { status: 'rejected' as const };
        break;
      case 'archive':
        updates = { status: 'archived' as const };
        break;
      case 'feature':
        updates = { featured: true };
        break;
      case 'unfeature':
        updates = { featured: false };
        break;
      case 'delete':
        const { error: deleteError } = await supabase
          .from('reviews')
          .delete()
          .in('id', selectedReviews);

        if (deleteError) {
          toast({
            title: "Error deleting reviews",
            description: deleteError.message,
            variant: "destructive"
          });
        } else {
          toast({ title: `${selectedReviews.length} reviews deleted` });
          setSelectedReviews([]);
          loadReviews();
        }
        return;
    }

    const { error } = await supabase
      .from('reviews')
      .update(updates)
      .in('id', selectedReviews);

    if (error) {
      toast({
        title: "Error updating reviews",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: `${selectedReviews.length} reviews updated` });
      setSelectedReviews([]);
      loadReviews();
    }
  }

  function toggleSelectAll() {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id));
    }
  }

  function toggleSelectReview(reviewId: string) {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reviews & Testimonials</h1>
            <p className="text-muted-foreground">Manage customer reviews and testimonials</p>
          </div>
          <Button onClick={() => navigate('/dashboard/reviews/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Review
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Rating" />
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
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Service" />
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
          <Input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
          {(statusFilter !== 'all' || ratingFilter !== 'all' || serviceFilter !== 'all' || dateFrom || dateTo) && (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setRatingFilter('all');
                setServiceFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {selectedReviews.length > 0 && (
          <div className="bg-primary/10 border border-primary rounded-lg p-4 flex items-center justify-between">
            <span className="font-medium">{selectedReviews.length} reviews selected</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleBulkAction('approve')}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
                Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                Archive
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('feature')}>
                Feature
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('unfeature')}>
                Un-feature
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedReviews([])}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div>Loading reviews...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow
                    key={review.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review.id)}
                        onChange={() => toggleSelectReview(review.id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                    >
                      <div>
                        <div className="font-medium">{review.customer_name}</div>
                        {review.customer_location && (
                          <div className="text-sm text-muted-foreground">
                            {review.customer_location}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                    >
                      <StarRating rating={review.rating} size="sm" />
                    </TableCell>
                    <TableCell
                      className="max-w-md cursor-pointer"
                      onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                    >
                      <div className="font-medium">{review.review_title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {review.review_text}
                      </div>
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                    >
                      {review.services?.name || '-'}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                    >
                      <ReviewStatusBadge status={review.status} />
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                    >
                      {format(new Date(review.submitted_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {review.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickApprove(review.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickReject(review.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}