import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type UnpaidInvoice = {
  id: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  status: string;
};

const RecentPayments = () => {
  const [loading, setLoading] = useState(true);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  useEffect(() => {
    fetchUnpaidInvoices();
  }, []);

  const fetchUnpaidInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!account) return;

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, due_date, status')
        .eq('account_id', account.id)
        .in('status', ['pending', 'overdue'] as any)
        .order('due_date', { ascending: true })
        .limit(3);

      if (error) throw error;

      const formattedInvoices = (invoices || []).map(inv => ({
        ...inv,
        total_amount: inv.total_amount / 100, // Convert cents to dollars
      }));

      setUnpaidInvoices(formattedInvoices);

      const total = formattedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      setOutstandingBalance(total);
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return isAfter(new Date(), parseISO(dueDate));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full mb-4" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (unpaidInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No outstanding invoices</p>
            <p className="text-sm text-muted-foreground mt-1">All payments are up to date!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Summary
        </CardTitle>
        <Link to="/customer/invoices">
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outstanding Balance */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-sm">Outstanding Balance</span>
            </div>
            <div className="flex items-center gap-1 text-xl font-bold text-destructive">
              <DollarSign className="h-5 w-5" />
              {outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Recent Unpaid Invoices */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Recent Unpaid Invoices</h4>
          {unpaidInvoices.map((invoice) => (
            <Link
              key={invoice.id}
              to="/customer/invoices"
              className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-mono text-sm font-semibold">{invoice.invoice_number}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Due: {format(parseISO(invoice.due_date), 'MMM d, yyyy')}</span>
                    {isOverdue(invoice.due_date) && (
                      <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-medium">
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 font-bold">
                    <DollarSign className="h-4 w-4" />
                    {invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Action Button */}
        <Button className="w-full" variant="default">
          <DollarSign className="h-4 w-4 mr-2" />
          Pay Outstanding Invoices
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentPayments;
