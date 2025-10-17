import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/lead-form/PhoneInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFormSettings } from '@/hooks/useFormSettings';
import { CRUDLogger } from '@/lib/crudLogger';
import { EmailService } from '@/services/emailService';
import { useIsMobile } from '@/hooks/use-mobile';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead?: any;
  users: Array<{ id: string; name: string }>;
}

export const LeadForm = ({ isOpen, onClose, onSuccess, lead, users }: LeadFormProps) => {
  const { toast } = useToast();
  const { data: formSettings } = useFormSettings();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  // Debug: Log form settings when they load
  console.log('🔍 LeadForm: formSettings loaded:', formSettings);
  console.log('🔍 LeadForm: service_options:', formSettings?.service_options);
  
  const [formData, setFormData] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    service_needed: lead?.service_needed || '',
    street_address: lead?.street_address || '',
    unit: lead?.unit || '',
    city: lead?.city || '',
    state: lead?.state || '',
    zip: lead?.zip || '',
    project_details: lead?.project_details || '',
    is_emergency: lead?.is_emergency || false,
    status: lead?.status || 'new',
    source: lead?.source || 'manual',
    assigned_to: lead?.assigned_to || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Helper to prevent indefinite hangs on awaited calls
    const withTimeout = <T,>(promise: Promise<T> | PromiseLike<T>, ms: number, label: string) =>
      new Promise<T>((resolve, reject) => {
        const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        Promise.resolve(promise)
          .then((res) => {
            clearTimeout(id);
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(id);
            reject(err);
          });
      });

    try {
      console.log('🚀 1. Form submission started');

      // 2) Get user via cached session first (fast), fallback to network
      let user: any = null;
      try {
        const sessionRes = await withTimeout(
          supabase.auth.getSession(),
          3000,
          'Auth session'
        );
        user = sessionRes.data.session?.user ?? null;
      } catch (e) {
        console.warn('Auth session lookup failed or timed out, falling back to getUser()', e);
      }

      if (!user) {
        const userRes = await withTimeout(
          supabase.auth.getUser(),
          15000,
          'Auth check'
        );
        user = userRes.data.user;
      }

      if (!user) throw new Error('Not authenticated');
      console.log('✅ 2. Got user:', user.id);

      if (lead?.id) {
        // Update existing lead
        console.log('📝 3a. Updating lead:', lead.id);
        const changes = CRUDLogger.calculateChanges(lead, formData);

        const updateRes = (await withTimeout(
          supabase.from('leads').update(formData).eq('id', lead.id),
          10000,
          'Lead update'
        )) as { data: any; error: any };
        if (updateRes.error) {
          console.error('❌ 4a. Lead update error:', updateRes.error);
          throw updateRes.error;
        }
        console.log('✅ 4a. Lead updated successfully');

        // Try to log activity - don't fail if logging fails (3s timeout)
        try {
          console.log('📊 5a. Attempting to log update...');
          await withTimeout(
            CRUDLogger.logUpdate({
              userId: user.id,
              entityType: 'lead',
              entityId: lead.id,
              entityName: `${formData.first_name} ${formData.last_name}`,
              changes
            }),
            3000,
            'Activity log (update)'
          );
          console.log('✅ 5a. Update logged successfully');
        } catch (logError) {
          console.error('⚠️ Logging failed or timed out (non-critical):', logError);
        }

        toast({
          title: 'Success',
          description: 'Lead updated successfully'
        });
      } else {
        // Create new lead
        console.log('➕ 3b. Creating new lead with data:', formData);

        const insertRes = (await withTimeout(
          supabase.from('leads').insert(formData).select().single(),
          10000,
          'Lead insert'
        )) as { data: any; error: any };

        if (insertRes.error) {
          console.error('❌ 4b. Lead insert error:', insertRes.error);
          throw insertRes.error;
        }
        const newLead = insertRes.data as any;
        console.log('✅ 4b. Lead created:', newLead?.id);

        // Try to log activity - don't fail if logging fails (3s timeout)
        try {
          console.log('📊 5b. Attempting to log create...');
          await withTimeout(
            CRUDLogger.logCreate({
              userId: user.id,
              entityType: 'lead',
              entityId: newLead.id,
              entityName: `${formData.first_name} ${formData.last_name}`
            }),
            3000,
            'Activity log (create)'
          );
          console.log('✅ 5b. Create logged successfully');
        } catch (logError) {
          console.error('⚠️ Logging failed or timed out (non-critical):', logError);
        }

        toast({
          title: 'Success',
          description: 'Lead created successfully'
        });
      }

      console.log('✅ 6. Calling onSuccess and onClose');
      onSuccess?.();
      onClose?.();
    } catch (error: any) {
      console.error('❌ FINAL ERROR:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save lead',
        variant: 'destructive'
      });
    } finally {
      console.log('🏁 7. Setting loading to false');
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Service Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="service_needed">Service Needed *</Label>
            <Select 
              value={formData.service_needed}
              onValueChange={(value) => setFormData({ ...formData, service_needed: value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {formSettings?.service_options?.map((service: string) => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="project_details">Project Details</Label>
            <Textarea
              id="project_details"
              rows={4}
              value={formData.project_details}
              onChange={(e) => setFormData({ ...formData, project_details: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_emergency"
              checked={formData.is_emergency}
              onCheckedChange={(checked) => setFormData({ ...formData, is_emergency: checked as boolean })}
            />
            <Label htmlFor="is_emergency" className="text-sm font-medium cursor-pointer">
              This is an emergency
            </Label>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Address</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="street_address">Street Address *</Label>
            <Input
              id="street_address"
              required
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div>
            <Label htmlFor="unit">Apartment/Unit/Floor</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <Label htmlFor="zip">Zip Code *</Label>
              <Input
                id="zip"
                required
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lead Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Lead Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="source">Source</Label>
            <Select 
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web_form">Web Form</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select 
              value={formData.assigned_to || 'unassigned'}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value === 'unassigned' ? '' : value })}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row justify-end'} gap-2`}>
        <Button type="button" variant="outline" onClick={onClose} className={isMobile ? 'w-full' : ''}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{lead ? 'Edit Lead' : 'Create New Lead'}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {formContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? 'Update lead details' : 'Enter lead details to create a new lead'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};