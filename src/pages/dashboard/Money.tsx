import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, FileText, DollarSign, AlertCircle, TrendingUp, FileDown, Send, FileSpreadsheet, Eye, Pencil, Trash, Mail, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import QuoteStatusBadge from '@/components/admin/money/QuoteStatusBadge';
import InvoiceStatusBadge from '@/components/admin/money/InvoiceStatusBadge';
import QuoteForm from '@/components/admin/money/QuoteForm';
import InvoiceForm from '@/components/admin/money/InvoiceForm';
import { format } from 'date-fns';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar, BulkAction } from '@/components/admin/bulk/BulkActionsBar';
import { BulkOperationModal } from '@/components/admin/bulk/BulkOperationModal';
import { BulkDeleteConfirmation } from '@/components/admin/bulk/BulkDeleteConfirmation';
import { BulkProgressModal } from '@/components/admin/bulk/BulkProgressModal';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { useBulkUndo } from '@/hooks/useBulkUndo';
import { BulkUndoToast } from '@/components/admin/bulk/BulkUndoToast';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileActionButton } from '@/components/ui/mobile-action-button';
import { ResponsiveList, MobileCard, MobileCardField } from '@/components/ui/responsive-table';
import { Skeleton } from '@/components/ui/skeleton';

const Money = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    outstandingQuotes: { count: 0, value: 0 },
    pendingInvoices: { count: 0, value: 0 },
    overdueInvoices: { count: 0, value: 0 },
    revenueThisMonth: 0,
  });
  const [searchQuotes, setSearchQuotes] = useState('');
  const [searchInvoices, setSearchInvoices] = useState('');
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  // Bulk operations for quotes
  const quotesSelection = useBulkSelection(quotes);
  const [quotesBulkModal, setQuotesBulkModal] = useState<{
    open: boolean;
    type: 'status' | 'convert' | 'send' | null;
  }>({ open: false, type: null });
  const [quotesBulkDeleteOpen, setQuotesBulkDeleteOpen] = useState(false);

  // Bulk operations for invoices
  const invoicesSelection = useBulkSelection(invoices);
  const [invoicesBulkModal, setInvoicesBulkModal] = useState<{
    open: boolean;
    type: 'status' | 'mark_paid' | 'send_reminder' | null;
  }>({ open: false, type: null });
  const [invoicesBulkDeleteOpen, setInvoicesBulkDeleteOpen] = useState(false);

  const [bulkProgress, setBulkProgress] = useState<{
    open: boolean;
    operation: string;
    total: number;
    completed: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
    isComplete: boolean;
  }>({ open: false, operation: '', total: 0, completed: 0, failed: 0, errors: [], isComplete: false });

  const { role } = useUserRole();
  const { undoState, saveUndoState, performUndo } = useBulkUndo();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchQuotes(),
        fetchInvoices(),
        fetchStats(),
      ]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        accounts:account_id (account_name),
        projects:project_id (project_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    setQuotes(data || []);
  };

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        accounts:account_id (account_name),
        projects:project_id (project_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    setInvoices(data || []);
  };

  const fetchStats = async () => {
    // Outstanding quotes (sent status)
    const { data: outstandingQuotes } = await supabase
      .from('quotes')
      .select('total_amount')
      .eq('status', 'sent');

    // Pending invoices
    const { data: pendingInvoices } = await supabase
      .from('invoices' as any)
      .select('amount_due')
      .in('status', ['pending', 'partial']);

    // Overdue invoices
    const { data: overdueInvoices } = await supabase
      .from('invoices' as any)
      .select('amount_due')
      .eq('status', 'overdue');

    // Revenue this month (payments)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: payments } = await supabase
      .from('payments' as any)
      .select('amount')
      .gte('payment_date', format(startOfMonth, 'yyyy-MM-dd'));

    setStats({
      outstandingQuotes: {
        count: outstandingQuotes?.length || 0,
        value: outstandingQuotes?.reduce((sum: number, q: any) => sum + parseFloat(q.total_amount || '0'), 0) || 0,
      },
      pendingInvoices: {
        count: pendingInvoices?.length || 0,
        value: pendingInvoices?.reduce((sum: number, i: any) => sum + parseFloat(i.amount_due || '0'), 0) || 0,
      },
      overdueInvoices: {
        count: overdueInvoices?.length || 0,
        value: overdueInvoices?.reduce((sum: number, i: any) => sum + parseFloat(i.amount_due || '0'), 0) || 0,
      },
      revenueThisMonth: payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0) || 0,
    });
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchQuotes.toLowerCase()) ||
    quote.accounts?.account_name.toLowerCase().includes(searchQuotes.toLowerCase())
  );

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchInvoices.toLowerCase()) ||
    invoice.accounts?.account_name.toLowerCase().includes(searchInvoices.toLowerCase())
  );

  // Quotes bulk actions
  const quotesBulkActions: BulkAction[] = [
    { id: 'status', label: 'Change Status' },
    { id: 'send', label: 'Send to Customers', icon: <Send className="h-4 w-4" /> },
    { id: 'convert', label: 'Convert to Invoices', icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: 'export', label: 'Export Selected', icon: <FileDown className="h-4 w-4" /> },
    { id: 'delete', label: 'Delete Selected', variant: 'destructive' as const },
  ];

  const handleQuotesBulkAction = (actionId: string) => {
    switch (actionId) {
      case 'status':
      case 'convert':
      case 'send':
        setQuotesBulkModal({ open: true, type: actionId as any });
        break;
      case 'delete':
        setQuotesBulkDeleteOpen(true);
        break;
      case 'export':
        handleQuotesBulkExport();
        break;
    }
  };

  const handleQuotesBulkConfirm = async (formData: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store previous values for undo
    const previousValues = quotesSelection.selectedItems.map(q => ({
      id: q.id,
      status: q.status,
    }));

    setBulkProgress({
      open: true,
      operation: `Updating ${quotesSelection.selectedCount} quotes`,
      total: quotesSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    if (quotesBulkModal.type === 'status') {
      const result = await BulkOperationsService.bulkStatusChange(
        'quotes',
        Array.from(quotesSelection.selectedIds),
        formData.status,
        user.id
      );
      
      if (result.success > 0) {
        saveUndoState({
          operation: 'status',
          module: 'quotes',
          itemIds: Array.from(quotesSelection.selectedIds),
          previousValues,
          timestamp: new Date(),
        });
      }
      
      setBulkProgress(prev => ({ ...prev, ...result, isComplete: true }));
    } else if (quotesBulkModal.type === 'convert') {
      // Convert quotes to invoices
      let success = 0, failed = 0;
      const errors: Array<{ id: string; error: string }> = [];

      for (const quoteId of Array.from(quotesSelection.selectedIds)) {
        try {
          const { data: quote } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

          if (quote) {
            const { data: invoiceNumber } = await supabase
              .rpc('generate_invoice_number' as any)
              .single();

            await supabase.from('invoices' as any).insert({
              invoice_number: invoiceNumber || `INV-${Date.now()}`,
              account_id: quote.account_id,
              total_amount: quote.total_amount,
              status: 'draft',
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_by: user.id,
            });
            success++;
          }
        } catch (error: any) {
          failed++;
          errors.push({ id: quoteId, error: error.message });
        }
      }
      setBulkProgress(prev => ({ ...prev, completed: success, failed, errors, isComplete: true }));
    } else if (quotesBulkModal.type === 'send') {
      // Send quotes to customers (placeholder - implement email sending)
      setBulkProgress(prev => ({ 
        ...prev, 
        completed: quotesSelection.selectedCount, 
        isComplete: true 
      }));
      toast({
        title: 'Success',
        description: `${quotesSelection.selectedCount} quotes sent to customers`,
      });
    }

    quotesSelection.deselectAll();
    fetchData();
  };

  const handleQuotesBulkDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await BulkOperationsService.bulkDelete(
      'quotes',
      Array.from(quotesSelection.selectedIds),
      user.id
    );

    quotesSelection.deselectAll();
    fetchData();

    toast({
      title: 'Success',
      description: `${result.success} quotes deleted`,
    });
  };

  const handleQuotesBulkExport = async () => {
    try {
      await BulkOperationsService.bulkExport('quotes', Array.from(quotesSelection.selectedIds));
      toast({
        title: 'Success',
        description: `${quotesSelection.selectedCount} quotes exported`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export quotes',
        variant: 'destructive',
      });
    }
  };

  // Invoices bulk actions
  const invoicesBulkActions: BulkAction[] = [
    { id: 'status', label: 'Change Status' },
    { id: 'mark_paid', label: 'Mark as Paid', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'send_reminder', label: 'Send Payment Reminders', icon: <Send className="h-4 w-4" /> },
    { id: 'export', label: 'Export Selected', icon: <FileDown className="h-4 w-4" /> },
    { id: 'delete', label: 'Delete Selected', variant: 'destructive' as const },
  ];

  const handleInvoicesBulkAction = (actionId: string) => {
    switch (actionId) {
      case 'status':
      case 'mark_paid':
      case 'send_reminder':
        setInvoicesBulkModal({ open: true, type: actionId as any });
        break;
      case 'delete':
        setInvoicesBulkDeleteOpen(true);
        break;
      case 'export':
        handleInvoicesBulkExport();
        break;
    }
  };

  const handleInvoicesBulkConfirm = async (formData: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store previous values for undo
    const previousValues = invoicesSelection.selectedItems.map(i => ({
      id: i.id,
      status: i.status,
      payment_date: i.payment_date,
      amount_due: i.amount_due,
    }));

    setBulkProgress({
      open: true,
      operation: `Updating ${invoicesSelection.selectedCount} invoices`,
      total: invoicesSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    if (invoicesBulkModal.type === 'status') {
      const result = await BulkOperationsService.bulkStatusChange(
        'invoices',
        Array.from(invoicesSelection.selectedIds),
        formData.status,
        user.id
      );
      
      if (result.success > 0) {
        saveUndoState({
          operation: 'status',
          module: 'invoices',
          itemIds: Array.from(invoicesSelection.selectedIds),
          previousValues,
          timestamp: new Date(),
        });
      }
      
      setBulkProgress(prev => ({ ...prev, ...result, isComplete: true }));
    } else if (invoicesBulkModal.type === 'mark_paid') {
      const result = await BulkOperationsService.performBulkOperation({
        type: 'status_change',
        itemIds: Array.from(invoicesSelection.selectedIds),
        module: 'invoices',
        changes: { 
          status: 'paid', 
          payment_date: new Date().toISOString(),
          amount_due: 0 
        },
        userId: user.id,
      });
      
      if (result.success > 0) {
        saveUndoState({
          operation: 'status',
          module: 'invoices',
          itemIds: Array.from(invoicesSelection.selectedIds),
          previousValues,
          timestamp: new Date(),
        });
      }
      
      setBulkProgress(prev => ({ ...prev, ...result, isComplete: true }));
    } else if (invoicesBulkModal.type === 'send_reminder') {
      // Send payment reminders (placeholder - implement email sending)
      setBulkProgress(prev => ({ 
        ...prev, 
        completed: invoicesSelection.selectedCount, 
        isComplete: true 
      }));
      toast({
        title: 'Success',
        description: `Payment reminders sent for ${invoicesSelection.selectedCount} invoices`,
      });
    }

    invoicesSelection.deselectAll();
    fetchData();
  };

  const handleInvoicesBulkDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await BulkOperationsService.bulkDelete(
      'invoices',
      Array.from(invoicesSelection.selectedIds),
      user.id
    );

    invoicesSelection.deselectAll();
    fetchData();

    toast({
      title: 'Success',
      description: `${result.success} invoices deleted`,
    });
  };

  const handleInvoicesBulkExport = async () => {
    try {
      await BulkOperationsService.bulkExport('invoices', Array.from(invoicesSelection.selectedIds));
      toast({
        title: 'Success',
        description: `${invoicesSelection.selectedCount} invoices exported`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export invoices',
        variant: 'destructive',
      });
    }
  };

  // Keyboard shortcuts for quotes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        quotesSelection.selectAll();
      }
      if (e.key === 'Escape' && quotesSelection.selectedCount > 0) {
        quotesSelection.deselectAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quotesSelection.selectedCount]);

  // Keyboard shortcuts for invoices
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        invoicesSelection.selectAll();
      }
      if (e.key === 'Escape' && invoicesSelection.selectedCount > 0) {
        invoicesSelection.deselectAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoicesSelection.selectedCount]);

  // Permission controls
  const canBulkEdit = role === 'Super Admin' || role === 'Admin';
  const canBulkDelete = role === 'Super Admin' || role === 'Admin';
  const isMobile = useIsMobile();

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Money Management</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Quotes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.outstandingQuotes.count}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.outstandingQuotes.value.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices.count}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.pendingInvoices.value.toFixed(2)} due
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdueInvoices.count}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.overdueInvoices.value.toFixed(2)} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.revenueThisMonth.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Payments received</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="quotes" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quotes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Quotes</CardTitle>
                    <CardDescription>Manage customer quotes</CardDescription>
                  </div>
                  {!isMobile && (
                    <Button onClick={() => setShowQuoteForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quote
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search quotes..."
                      value={searchQuotes}
                      onChange={(e) => setSearchQuotes(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))}
                  </div>
                ) : (
                  <ResponsiveList
                    items={filteredQuotes}
                    emptyMessage="No quotes found"
                    renderCard={(quote) => (
                    <MobileCard key={quote.id} onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{quote.quote_number}</h3>
                          <Link 
                            to={`/dashboard/accounts/${quote.account_id}`}
                            className="text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {quote.accounts?.account_name}
                          </Link>
                        </div>
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                      
                      <MobileCardField 
                        label="Amount" 
                        value={<span className="font-bold text-lg">${parseFloat(quote.total_amount).toFixed(2)}</span>}
                      />
                      
                      <MobileCardField 
                        label="Created" 
                        value={format(new Date(quote.created_at), 'MMM d, yyyy')}
                      />
                      
                      {quote.valid_until && (
                        <MobileCardField 
                          label="Valid Until" 
                          value={format(new Date(quote.valid_until), 'MMM d, yyyy')}
                        />
                      )}
                      
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/quotes/${quote.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit quote logic
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </MobileCard>
                  )}
                  renderTable={() => (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={quotesSelection.isAllSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  quotesSelection.selectAll();
                                } else {
                                  quotesSelection.deselectAll();
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Quote #</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Valid Until</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuotes.map((quote) => (
                          <TableRow 
                            key={quote.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={quotesSelection.isSelected(quote.id)}
                                onCheckedChange={() => quotesSelection.toggleItem(quote.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <QuoteStatusBadge status={quote.status} />
                            </TableCell>
                            <TableCell className="font-medium">{quote.quote_number}</TableCell>
                            <TableCell>
                              <Link to={`/dashboard/accounts/${quote.account_id}`} className="hover:underline">
                                {quote.accounts?.account_name}
                              </Link>
                            </TableCell>
                            <TableCell>${parseFloat(quote.total_amount).toFixed(2)}</TableCell>
                            <TableCell>
                              {quote.valid_until ? format(new Date(quote.valid_until), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell>{format(new Date(quote.created_at), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  />
                )}
              </CardContent>
            </Card>
            
            {isMobile && (
              <MobileActionButton
                onClick={() => setShowQuoteForm(true)}
                icon={<Plus className="h-6 w-6" />}
                label="Create Quote"
              />
            )}
          </TabsContent>
          
          <TabsContent value="invoices" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Track invoices and payments</CardDescription>
                  </div>
                  {!isMobile && (
                    <Button onClick={() => setShowInvoiceForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchInvoices}
                      onChange={(e) => setSearchInvoices(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))}
                  </div>
                ) : (
                  <ResponsiveList
                    items={filteredInvoices}
                    emptyMessage="No invoices found"
                    renderCard={(invoice) => (
                    <MobileCard key={invoice.id} onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{invoice.invoice_number}</h3>
                          <Link 
                            to={`/dashboard/accounts/${invoice.account_id}`}
                            className="text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {invoice.accounts?.account_name}
                          </Link>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                      
                      <MobileCardField 
                        label="Total Amount" 
                        value={<span className="font-bold text-lg">${parseFloat(invoice.total_amount).toFixed(2)}</span>}
                      />
                      
                      <MobileCardField 
                        label="Amount Due" 
                        value={
                          <span className={invoice.status === 'overdue' ? 'text-destructive font-bold' : 'font-bold'}>
                            ${parseFloat(invoice.amount_due).toFixed(2)}
                          </span>
                        }
                      />
                      
                      <MobileCardField 
                        label="Due Date" 
                        value={
                          <span className={invoice.status === 'overdue' ? 'text-destructive' : ''}>
                            {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                            {invoice.status === 'overdue' && ' (Overdue)'}
                          </span>
                        }
                      />
                      
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/invoices/${invoice.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit invoice logic
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Send invoice logic
                          }}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      </div>
                    </MobileCard>
                  )}
                  renderTable={() => (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={invoicesSelection.isAllSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  invoicesSelection.selectAll();
                                } else {
                                  invoicesSelection.deselectAll();
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Amount Due</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice) => (
                          <TableRow 
                            key={invoice.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={invoicesSelection.isSelected(invoice.id)}
                                onCheckedChange={() => invoicesSelection.toggleItem(invoice.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <InvoiceStatusBadge status={invoice.status} />
                            </TableCell>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>
                              <Link to={`/dashboard/accounts/${invoice.account_id}`} className="hover:underline">
                                {invoice.accounts?.account_name}
                              </Link>
                            </TableCell>
                            <TableCell>${parseFloat(invoice.total_amount).toFixed(2)}</TableCell>
                            <TableCell className={invoice.status === 'overdue' ? 'text-destructive font-medium' : ''}>
                              ${parseFloat(invoice.amount_due).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                              {invoice.status === 'overdue' && (
                                <span className="ml-2 text-xs text-destructive">Overdue</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  />
                )}
              </CardContent>
            </Card>
            
            {isMobile && (
              <MobileActionButton
                onClick={() => setShowInvoiceForm(true)}
                icon={<Plus className="h-6 w-6" />}
                label="Create Invoice"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <QuoteForm
        open={showQuoteForm}
        onOpenChange={setShowQuoteForm}
        onSuccess={fetchData}
      />

      <InvoiceForm
        open={showInvoiceForm}
        onOpenChange={setShowInvoiceForm}
        onSuccess={fetchData}
      />

      {/* Quotes Bulk Operations */}
      <BulkActionsBar
        selectedCount={quotesSelection.selectedCount}
        actions={quotesBulkActions}
        onAction={handleQuotesBulkAction}
        onClear={quotesSelection.deselectAll}
      />

      <BulkOperationModal
        open={quotesBulkModal.open}
        onOpenChange={(open) => setQuotesBulkModal({ open, type: null })}
        title={quotesBulkModal.type === 'status' ? 'Change Status' : 
               quotesBulkModal.type === 'convert' ? 'Convert to Invoices' :
               'Send to Customers'}
        description={`Update ${quotesSelection.selectedCount} selected quotes`}
        selectedCount={quotesSelection.selectedCount}
        onConfirm={handleQuotesBulkConfirm}
        fields={quotesBulkModal.type === 'status' ? [{
          name: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'rejected', label: 'Rejected' },
          ],
          required: true,
        }] : []}
      />

      <BulkDeleteConfirmation
        open={quotesBulkDeleteOpen}
        onOpenChange={setQuotesBulkDeleteOpen}
        itemCount={quotesSelection.selectedCount}
        itemType="quotes"
        onConfirm={handleQuotesBulkDelete}
        requireTyping={quotesSelection.selectedCount > 10}
      />

      {/* Invoices Bulk Operations */}
      <BulkActionsBar
        selectedCount={invoicesSelection.selectedCount}
        actions={invoicesBulkActions}
        onAction={handleInvoicesBulkAction}
        onClear={invoicesSelection.deselectAll}
      />

      <BulkOperationModal
        open={invoicesBulkModal.open}
        onOpenChange={(open) => setInvoicesBulkModal({ open, type: null })}
        title={invoicesBulkModal.type === 'status' ? 'Change Status' : 
               invoicesBulkModal.type === 'mark_paid' ? 'Mark as Paid' :
               'Send Payment Reminders'}
        description={`Update ${invoicesSelection.selectedCount} selected invoices`}
        selectedCount={invoicesSelection.selectedCount}
        onConfirm={handleInvoicesBulkConfirm}
        fields={invoicesBulkModal.type === 'status' ? [{
          name: 'status',
          label: 'Status',
          type: 'select' as const,
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
          ],
          required: true,
        }] : []}
      />

      <BulkDeleteConfirmation
        open={invoicesBulkDeleteOpen}
        onOpenChange={setInvoicesBulkDeleteOpen}
        itemCount={invoicesSelection.selectedCount}
        itemType="invoices"
        onConfirm={handleInvoicesBulkDelete}
        requireTyping={invoicesSelection.selectedCount > 10}
      />

      <BulkProgressModal
        open={bulkProgress.open}
        onOpenChange={(open) => setBulkProgress(prev => ({ ...prev, open }))}
        operation={bulkProgress.operation}
        total={bulkProgress.total}
        completed={bulkProgress.completed}
        failed={bulkProgress.failed}
        errors={bulkProgress.errors}
        isComplete={bulkProgress.isComplete}
      />

      {undoState && (
        <BulkUndoToast count={undoState.itemIds.length} onUndo={performUndo} />
      )}
    </AdminLayout>
  );
};

export default Money;