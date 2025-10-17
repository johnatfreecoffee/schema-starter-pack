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
import { CRUDLogger } from '@/lib/crudLogger';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

interface QuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: any;
  onSuccess: () => void;
}

const QuoteForm = ({ open, onOpenChange, quote, onSuccess }: QuoteFormProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    account_id: '',
    project_id: '',
    status: 'draft' as QuoteStatus,
    valid_until: '',
    tax_rate: '8.25',
    discount_type: 'none' as 'none' | 'percentage' | 'fixed',
    discount_value: '0',
    notes: '',
    terms: '',
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    fetchAccounts();
    if (quote) {
      loadQuote();
    }
  }, [quote]);

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

  const loadQuote = async () => {
    if (!quote) return;
    
    setFormData({
      account_id: quote.account_id,
      project_id: quote.project_id || '',
      status: quote.status,
      valid_until: quote.valid_until || '',
      tax_rate: quote.tax_rate?.toString() || '8.25',
      discount_type: quote.discount_type || 'none',
      discount_value: quote.discount_value?.toString() || '0',
      notes: quote.notes || '',
      terms: quote.terms || '',
    });

    const { data: items } = await supabase
      .from('quote_items' as any)
      .select('*')
      .eq('quote_id', quote.id)
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

  const generateQuoteNumber = async () => {
    const { data } = await supabase
      .from('quotes')
      .select('quote_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return 'QUO-2025-0001';
    }

    const lastNumber = parseInt(data[0].quote_number.split('-')[2]);
    const nextNumber = lastNumber + 1;
    const year = new Date().getFullYear();
    return `QUO-${year}-${String(nextNumber).padStart(4, '0')}`;
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

      let quoteNumber = quote?.quote_number;
      if (!quote) {
        quoteNumber = await generateQuoteNumber();
      }

      const quoteData = {
        quote_number: quoteNumber,
        account_id: formData.account_id,
        project_id: formData.project_id || null,
        status: formData.status,
        subtotal,
        tax_rate: parseFloat(formData.tax_rate),
        tax_amount: taxAmount,
        discount_type: formData.discount_type === 'none' ? null : formData.discount_type,
        discount_value: formData.discount_type === 'none' ? null : parseFloat(formData.discount_value),
        discount_amount: discountAmount,
        total_amount: totalAmount,
        valid_until: formData.valid_until || null,
        notes: formData.notes || null,
        terms: formData.terms || null,
        created_by: user.id,
      };

      let quoteId = quote?.id;
      
      if (quote) {
        const { error } = await supabase
          .from('quotes')
          .update(quoteData as any)
          .eq('id', quote.id);
        if (error) throw error;
      } else {
        const { data: newQuote, error } = await supabase
          .from('quotes')
          .insert(quoteData as any)
          .select()
          .single();
        if (error) throw error;
        quoteId = newQuote.id;
      }

      // Delete existing items if editing
      if (quote) {
        await supabase.from('quote_items' as any).delete().eq('quote_id', quote.id);
      }

      // Insert line items
      const itemsToInsert = lineItems.map((item, index) => ({
        quote_id: quoteId,
        item_order: index,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items' as any)
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Log activity
      if (quote) {
        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: 'quote',
          entityId: quoteId!,
          entityName: quoteNumber,
          changes: { total_amount: { old: quote.total_amount, new: totalAmount } }
        });
      } else {
        await CRUDLogger.logCreate({
          userId: user.id,
          entityType: 'quote',
          entityId: quoteId!,
          entityName: quoteNumber
        });
      }

      toast({
        title: 'Success',
        description: `Quote ${quote ? 'updated' : 'created'} successfully`,
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
          <Label>Valid Until</Label>
          <Input
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            className="min-h-[44px]"
          />
        </div>

        {quote && (
          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: QuoteStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
            placeholder="Terms shown on quote PDF"
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
          {loading ? 'Saving...' : quote ? 'Update Quote' : 'Create Quote'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{quote ? 'Edit Quote' : 'Create New Quote'}</SheetTitle>
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
          <DialogTitle>{quote ? 'Edit Quote' : 'Create New Quote'}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default QuoteForm;