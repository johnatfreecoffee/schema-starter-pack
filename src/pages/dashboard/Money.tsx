import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, FileText, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import QuoteStatusBadge from '@/components/admin/money/QuoteStatusBadge';
import InvoiceStatusBadge from '@/components/admin/money/InvoiceStatusBadge';
import QuoteForm from '@/components/admin/money/QuoteForm';
import InvoiceForm from '@/components/admin/money/InvoiceForm';
import { format } from 'date-fns';

const Money = () => {
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
                  <Button onClick={() => setShowQuoteForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quote
                  </Button>
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

                <Table>
                  <TableHeader>
                    <TableRow>
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
                      <TableRow key={quote.id}>
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
                    {filteredQuotes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No quotes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoices" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Track invoices and payments</CardDescription>
                  </div>
                  <Button onClick={() => setShowInvoiceForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
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

                <Table>
                  <TableHeader>
                    <TableRow>
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
                      <TableRow key={invoice.id}>
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
                    {filteredInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
    </AdminLayout>
  );
};

export default Money;