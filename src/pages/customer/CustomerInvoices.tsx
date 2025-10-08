import { useState, useEffect } from 'react';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Search, Filter, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { toast } from 'sonner';
import PaymentDetailModal from '@/components/customer/PaymentDetailModal';
import InvoiceStatusBadge from '@/components/admin/money/InvoiceStatusBadge';
import QuoteStatusBadge from '@/components/admin/money/QuoteStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';

type PaymentDocument = {
  id: string;
  number: string;
  type: 'quote' | 'invoice';
  date: string;
  due_date?: string;
  amount: number;
  status: string;
  account_id: string;
};

const CustomerInvoices = () => {
  const [documents, setDocuments] = useState<PaymentDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<PaymentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<'all' | 'quote' | 'invoice'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [selectedDocument, setSelectedDocument] = useState<PaymentDocument | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPaymentDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchTerm, documentTypeFilter, statusFilter, sortBy]);

  const fetchPaymentDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!account) return;

      // Fetch quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      // Fetch invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Combine and format documents
      const allDocuments: PaymentDocument[] = [
        ...(quotes || []).map(q => ({
          id: q.id,
          number: q.quote_number,
          type: 'quote' as const,
          date: q.created_at,
          amount: q.total_amount / 100, // Convert cents to dollars
          status: q.status,
          account_id: q.account_id,
        })),
        ...(invoices || []).map(i => ({
          id: i.id,
          number: i.invoice_number,
          type: 'invoice' as const,
          date: i.created_at,
          due_date: i.due_date,
          amount: i.total_amount / 100, // Convert cents to dollars
          status: i.status,
          account_id: i.account_id,
        }))
      ];

      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error fetching payment documents:', error);
      toast.error('Failed to load payment documents');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Filter by document type
    if (documentTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === documentTypeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.amount.toString().includes(searchTerm)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    setFilteredDocuments(filtered);
  };

  const isOverdue = (doc: PaymentDocument) => {
    if (doc.type !== 'invoice' || !doc.due_date || doc.status === 'paid') return false;
    return isAfter(new Date(), parseISO(doc.due_date));
  };

  const handleDocumentClick = (doc: PaymentDocument) => {
    setSelectedDocument(doc);
    setShowDetailModal(true);
  };

  const getStatusBadge = (doc: PaymentDocument) => {
    if (doc.type === 'quote') {
      return <QuoteStatusBadge status={doc.status as any} />;
    } else {
      return <InvoiceStatusBadge status={doc.status as any} />;
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const totalOutstanding = filteredDocuments
    .filter(doc => doc.type === 'invoice' && doc.status !== 'paid')
    .reduce((sum, doc) => sum + doc.amount, 0);

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-1">View and manage your quotes and invoices</p>
        </div>

        {/* Outstanding Balance Card */}
        {totalOutstanding > 0 && (
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-destructive">
                      ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <Button variant="destructive">Pay Now</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by number or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Document Type Filter */}
              <Select value={documentTypeFilter} onValueChange={(value: any) => setDocumentTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="quote">Quotes Only</SelectItem>
                  <SelectItem value="invoice">Invoices Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('sent')}
              >
                Sent
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('paid')}
              >
                Paid
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Documents ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No payment documents found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold">{doc.number}</span>
                        <span className="text-xs uppercase text-muted-foreground border px-2 py-0.5 rounded">
                          {doc.type}
                        </span>
                        {getStatusBadge(doc)}
                        {isOverdue(doc) && (
                          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(doc.date), 'MMM d, yyyy')}
                        </div>
                        {doc.due_date && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Due:</span>
                            {format(parseISO(doc.due_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold">
                        <DollarSign className="h-4 w-4" />
                        {doc.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {doc.type === 'invoice' && doc.status !== 'paid' && (
                        <p className="text-xs text-muted-foreground">Balance Due</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Detail Modal */}
      {selectedDocument && (
        <PaymentDetailModal
          document={selectedDocument}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerInvoices;
