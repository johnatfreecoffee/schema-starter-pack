import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { QuoteFilters } from '@/components/admin/money/QuoteFilters';
import { InvoiceFilters } from '@/components/admin/money/InvoiceFilters';
import { ExportButton } from '@/components/admin/ExportButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QuoteStatusBadge from '@/components/admin/money/QuoteStatusBadge';
import InvoiceStatusBadge from '@/components/admin/money/InvoiceStatusBadge';
import { format } from 'date-fns';

const MoneyAdvanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'quotes' | 'invoices'>('quotes');
  const { filters, updateFilter, clearFilters } = useUrlFilters();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const filterCount = Object.keys(filters).filter(
    key => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  useEffect(() => {
    if (activeTab === 'quotes') {
      loadQuotes();
    } else {
      loadInvoices();
    }
  }, [filters, activeTab]);

  const loadQuotes = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("quotes")
        .select(`*, accounts(account_name)`)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.accountId) {
        query = query.eq("account_id", filters.accountId);
      }

      if (filters.amountMin) {
        query = query.gte("total_amount", filters.amountMin);
      }

      if (filters.amountMax) {
        query = query.lte("total_amount", filters.amountMax);
      }

      if (filters.createdFrom) {
        query = query.gte("created_at", filters.createdFrom);
      }

      if (filters.createdTo) {
        query = query.lte("created_at", filters.createdTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      setQuotes(data || []);
    } catch (error: any) {
      console.error("Error loading quotes:", error);
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("invoices")
        .select(`*, accounts(account_name)`)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.accountId) {
        query = query.eq("account_id", filters.accountId);
      }

      if (filters.amountMin) {
        query = query.gte("total_amount", filters.amountMin);
      }

      if (filters.amountMax) {
        query = query.lte("total_amount", filters.amountMax);
      }

      if (filters.issueDateFrom) {
        query = query.gte("created_at", filters.issueDateFrom);
      }

      if (filters.issueDateTo) {
        query = query.lte("created_at", filters.issueDateTo);
      }

      if (filters.dueDateFrom) {
        query = query.gte("due_date", filters.dueDateFrom);
      }

      if (filters.dueDateTo) {
        query = query.lte("due_date", filters.dueDateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      setInvoices(data || []);
    } catch (error: any) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentData = activeTab === 'quotes' ? quotes : invoices;

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Money Management</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilterPanelOpen(true)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {filterCount > 0 && (
                <Badge variant="default">{filterCount}</Badge>
              )}
            </Button>
            <ExportButton
              data={currentData}
              moduleName={activeTab}
              filters={filters}
              isFiltered={filterCount > 0}
              filteredCount={currentData.length}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quotes' | 'invoices')}>
          <TabsList>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="space-y-4">
            <SavedViewsBar
              module="quotes"
              currentFilters={filters}
              onViewSelect={(newFilters) => {
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key, value);
                });
              }}
            />

            <FilterChips
              filters={filters}
              onRemove={(key) => updateFilter(key, null)}
              onClearAll={clearFilters}
            />

            {loading ? (
              <div className="text-center py-8">Loading quotes...</div>
            ) : quotes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {filterCount > 0 ? "No quotes match the current filters" : "No quotes found"}
                </p>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow
                        key={quote.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
                      >
                        <TableCell>
                          <QuoteStatusBadge status={quote.status} />
                        </TableCell>
                        <TableCell className="font-medium">{quote.quote_number}</TableCell>
                        <TableCell>{quote.accounts?.account_name || '-'}</TableCell>
                        <TableCell>${parseFloat(quote.total_amount).toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(quote.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <SavedViewsBar
              module="invoices"
              currentFilters={filters}
              onViewSelect={(newFilters) => {
                Object.entries(newFilters).forEach(([key, value]) => {
                  updateFilter(key, value);
                });
              }}
            />

            <FilterChips
              filters={filters}
              onRemove={(key) => updateFilter(key, null)}
              onClearAll={clearFilters}
            />

            {loading ? (
              <div className="text-center py-8">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {filterCount > 0 ? "No invoices match the current filters" : "No invoices found"}
                </p>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}
                      >
                        <TableCell>
                          <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.accounts?.account_name || '-'}</TableCell>
                        <TableCell>${parseFloat(invoice.total_amount).toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(invoice.due_date), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          title={`Filter ${activeTab === 'quotes' ? 'Quotes' : 'Invoices'}`}
          onClearAll={clearFilters}
        >
          {activeTab === 'quotes' ? (
            <QuoteFilters values={filters} onChange={updateFilter} />
          ) : (
            <InvoiceFilters values={filters} onChange={updateFilter} />
          )}
        </FilterPanel>
      </div>
  );
};

export default MoneyAdvanced;
