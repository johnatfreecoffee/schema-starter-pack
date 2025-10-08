import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (lead?.id) {
        // Update existing lead
        const changes = CRUDLogger.calculateChanges(lead, formData);
        
        const { error } = await supabase
          .from('leads')
          .update(formData)
          .eq('id', lead.id);

        if (error) throw error;

        // Log activity
        await CRUDLogger.logUpdate({
          userId: user.id,
          entityType: 'lead',
          entityId: lead.id,
          entityName: `${formData.first_name} ${formData.last_name}`,
          changes
        });

        toast({
          title: 'Success',
          description: 'Lead updated successfully'
        });
      } else {
        // Create new lead
        const { data: newLead, error } = await supabase
          .from('leads')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await CRUDLogger.logCreate({
          userId: user.id,
          entityType: 'lead',
          entityId: newLead.id,
          entityName: `${formData.first_name} ${formData.last_name}`
        });

        toast({
          title: 'Success',
          description: 'Lead created successfully'
        });
      }

      onSuccess();
      onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                  <SelectTrigger>
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
                />
              </div>
              <div>
                <Label htmlFor="unit">Apartment/Unit/Floor</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="zip">Zip Code *</Label>
                  <Input
                    id="zip"
                    required
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lead Management */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Lead Management</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  <SelectTrigger>
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
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};