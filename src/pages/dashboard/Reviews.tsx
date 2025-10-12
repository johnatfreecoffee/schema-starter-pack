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

  useEffect(() => {
    loadReviews();
  }, [statusFilter, ratingFilter]);

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

        <div className="flex gap-4">
          <div className="flex-1 relative">
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
        </div>

        {loading ? (
          <div>Loading reviews...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
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
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/reviews/${review.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.customer_name}</div>
                        {review.customer_location && (
                          <div className="text-sm text-muted-foreground">
                            {review.customer_location}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={review.rating} size="sm" />
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="font-medium">{review.review_title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {review.review_text}
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.services?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <ReviewStatusBadge status={review.status} />
                    </TableCell>
                    <TableCell>
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