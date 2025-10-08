import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AccountStatusBadge } from '@/components/admin/accounts/AccountStatusBadge';
import { AccountFilters } from '@/components/admin/accounts/AccountFilters';
import { AccountForm } from '@/components/admin/accounts/AccountForm';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Phone, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CRUDLogger } from '@/lib/crudLogger';

const Accounts = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  
  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState({
    active: true,
    inactive: true,
    archived: false
  });
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [fromLeadOnly, setFromLeadOnly] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    archived: 0
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('accounts')
        .select(`
          *,
          contacts!inner(first_name, last_name, email, phone, is_primary),
          addresses!inner(city, state, is_primary),
          projects(count)
        `);

      // Apply filters
      const activeStatuses = Object.entries(statusFilters)
        .filter(([_, value]) => value)
        .map(([key]) => key as 'active' | 'inactive' | 'archived');
      
      if (activeStatuses.length > 0) {
        query = query.in('status', activeStatuses);
      }

      if (search) {
        query = query.or(`account_name.ilike.%${search}%,contacts.first_name.ilike.%${search}%,contacts.last_name.ilike.%${search}%,contacts.email.ilike.%${search}%`);
      }

      if (fromLeadOnly) {
        query = query.not('source_lead_id', 'is', null);
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to get primary contact and address
      const processedData = data?.map(account => ({
        ...account,
        primary_contact: account.contacts?.find((c: any) => c.is_primary) || account.contacts?.[0],
        primary_address: account.addresses?.find((a: any) => a.is_primary) || account.addresses?.[0],
        project_count: account.projects?.length || 0
      }));

      setAccounts(processedData || []);
      
      // Calculate status counts
      const { data: countData } = await supabase
        .from('accounts')
        .select('status');
      
      const counts = { active: 0, inactive: 0, archived: 0 };
      countData?.forEach((account: any) => {
        counts[account.status as keyof typeof counts]++;
      });
      setStatusCounts(counts);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search, statusFilters, dateRange, fromLeadOnly]);

  const handleStatusFilterChange = (status: keyof typeof statusFilters, checked: boolean) => {
    setStatusFilters(prev => ({ ...prev, [status]: checked }));
  };

  const totalAccounts = accounts.length;

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Filters Sidebar */}
        <div className="w-64 flex-shrink-0">
          <AccountFilters
            search={search}
            onSearchChange={setSearch}
            statusFilters={statusFilters}
            onStatusFilterChange={handleStatusFilterChange}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            fromLeadOnly={fromLeadOnly}
            onFromLeadOnlyChange={setFromLeadOnly}
            statusCounts={statusCounts}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-4xl font-bold">Accounts</h1>
                <p className="text-muted-foreground mt-1">
                  Showing {totalAccounts} account{totalAccounts !== 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={() => setShowAccountForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Account
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No accounts found</p>
                <Button onClick={() => setShowAccountForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Account
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id} className="hover:bg-muted/50">
                        <TableCell>
                          <AccountStatusBadge status={account.status} />
                        </TableCell>
                        <TableCell>
                          <Link 
                            to={`/dashboard/accounts/${account.id}`}
                            className="font-medium hover:underline"
                          >
                            {account.account_name}
                          </Link>
                          {account.source_lead_id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              From Lead
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.primary_contact && (
                            <div>
                              <div className="font-medium">
                                {account.primary_contact.first_name} {account.primary_contact.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {account.primary_contact.email}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.primary_contact?.phone && (
                            <a 
                              href={`tel:${account.primary_contact.phone}`}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <Phone className="h-3 w-3" />
                              {account.primary_contact.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.primary_address && (
                            <span>
                              {account.primary_address.city}, {account.primary_address.state}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{account.project_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(account.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AccountForm
        open={showAccountForm}
        onOpenChange={setShowAccountForm}
        onSuccess={fetchAccounts}
      />
    </AdminLayout>
  );
};

export default Accounts;
