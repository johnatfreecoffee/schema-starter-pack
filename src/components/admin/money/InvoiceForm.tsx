import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import LineItemsEditor, { LineItem } from './LineItemsEditor';
import { format, addDays } from 'date-fns';

type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: any;
  onSuccess: () => void;
}

const InvoiceForm = ({ open, onOpenChange, invoice, onSuccess }: InvoiceFormProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    account_id: '',
    project_id: '',
    quote_id: '',
    status: 'pending' as InvoiceStatus,
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    tax_rate: '8.25',
    discount_type: 'none' as 'none' | 'percentage' | 'fixed',
    discount_value: '0',
    notes: '',
    terms: '',
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    fetchAccounts();
    if (invoice) {
      loadInvoice();
    }
  }, [invoice]);

  useEffect(() => {
    if (formData.account_id) {
      fetchProjects(formData.account_id);
    }
  }, [formData.account_id]);

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id, account_name')
      .eq('status', 'active')
      .order('account_name');
    if (data) setAccounts(data);
  };

  const fetchProjects = async (accountId: string) => {
    const { data } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('account_id', accountId)
      .in('status', ['planning', 'active'])
      .order('project_name');
    if (data) setProjects(data);
  };

  const loadInvoice = async () => {
    if (!invoice) return;
    
    setFormData({
      account_id: invoice.account_id,
      project_id: invoice.project_id || '',
      quote_id: invoice.quote_id || '',
      status: invoice.status,
      issue_date: invoice.issue_date || format(new Date(), 'yyyy-MM-dd'),
      due_date: invoice.due_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      tax_rate: invoice.tax_rate?.toString() || '8.25',
      discount_type: invoice.discount_type || 'none',
      discount_value: invoice.discount_value?.toString() || '0',
      notes: invoice.notes || '',
      terms: invoice.terms || '',
    });

    const { data: items } = await supabase
      .from('invoice_items' as any)
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('item_order');
    
    if (items) {
      setLineItems(items.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        line_total: parseFloat(item.line_total),
        item_order: item.item_order,
      })));
    }
  };

  const generateInvoiceNumber = async () => {
    const { data, error } = await supabase
      .from('invoices' as any)
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'INV-2025-0001';
    }

    const invoiceData = data[0] as any;
    const lastNumber = parseInt(invoiceData.invoice_number.split('-')[2]);
    const nextNumber = lastNumber + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    
    let discountAmount = 0;
    if (formData.discount_type === 'percentage') {
      discountAmount = subtotal * (parseFloat(formData.discount_value) / 100);
    } else if (formData.discount_type === 'fixed') {
      discountAmount = parseFloat(formData.discount_value);
    }
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (parseFloat(formData.tax_rate) / 100);
    const totalAmount = taxableAmount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_id) {
      toast({ title: 'Error', description: 'Please select an account', variant: 'destructive' });
      return;
    }

    if (lineItems.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one line item', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { subtotal, discountAmount, taxAmount, totalAmount } = calculateTotals();

      let invoiceNumber = invoice?.invoice_number;
      if (!invoice) {
        invoiceNumber = await generateInvoiceNumber();
      }

      const invoiceData = {
        invoice_number: invoiceNumber,
        account_id: formData.account_id,
        project_id: formData.project_id || null,
        quote_id: formData.quote_id || null,
        status: formData.status,
        subtotal,
        tax_rate: parseFloat(formData.tax_rate),
        tax_amount: taxAmount,
        discount_type: formData.discount_type === 'none' ? null : formData.discount_type,
        discount_value: formData.discount_type === 'none' ? null : parseFloat(formData.discount_value),
        discount_amount: discountAmount,
        total_amount: totalAmount,
        amount_paid: invoice?.amount_paid || 0,
        amount_due: totalAmount - (invoice?.amount_paid || 0),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes || null,
        terms: formData.terms || null,
        created_by: user.id,
      };

      let invoiceId = invoice?.id;
      
      if (invoice) {
        const { error } = await supabase
          .from('invoices' as any)
          .update(invoiceData as any)
          .eq('id', invoice.id);
        if (error) throw error;
      } else {
        const { data: newInvoice, error } = await supabase
          .from('invoices' as any)
          .insert(invoiceData as any)
          .select()
          .single();
        if (error) throw error;
        const invoiceResult = newInvoice as any;
        if (invoiceResult && invoiceResult.id) {
          invoiceId = invoiceResult.id;
        }
      }

      // Delete existing items if editing
      if (invoice) {
        await supabase.from('invoice_items' as any).delete().eq('invoice_id', invoice.id);
      }

      // Insert line items
      const itemsToInsert = lineItems.map((item, index) => ({
        invoice_id: invoiceId,
        item_order: index,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items' as any)
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: invoice ? 'updated' : 'created',
        entity_type: 'invoice',
        entity_id: invoiceId,
        parent_entity_type: 'account',
        parent_entity_id: formData.account_id,
        description: `${invoice ? 'Updated' : 'Created'} invoice ${invoiceNumber}`,
      });

      toast({
        title: 'Success',
        description: `Invoice ${invoice ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label>Account *</Label>
          <Select
            value={formData.account_id}
            onValueChange={(value) => setFormData({ ...formData, account_id: value, project_id: '' })}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Project (Optional)</Label>
          <Select
            value={formData.project_id}
            onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            disabled={!formData.account_id}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Issue Date *</Label>
          <Input
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            required
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label>Due Date *</Label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
            className="min-h-[44px]"
          />
        </div>

        {invoice && (
          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: InvoiceStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <LineItemsEditor items={lineItems} onChange={setLineItems} />

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Calculations</h3>
        
        <div className="space-y-4">
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <div>
              <Label>Discount Type</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: any) => setFormData({ ...formData, discount_type: value })}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.discount_type !== 'none' && (
              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder="0.00"
                  className="min-h-[44px]"
                />
              </div>
            )}

            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount:</span>
                <span>-${totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({formData.tax_rate}%):</span>
              <span className="font-medium">${totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${totals.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div>
          <Label>Internal Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Internal notes (not shown to customer)"
            rows={3}
            className="min-h-[44px]"
          />
        </div>

        <div>
          <Label>Terms & Conditions</Label>
          <Textarea
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            placeholder="Terms shown on invoice PDF"
            rows={3}
            className="min-h-[44px]"
          />
        </div>
      </div>

      <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
          {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{formContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;