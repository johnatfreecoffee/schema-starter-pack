import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PhoneInput } from './PhoneInput';
import { useFormSettings } from '@/hooks/useFormSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { callEdgeFunction } from '@/utils/callEdgeFunction';

const leadFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone must be 10 digits').max(10, 'Phone must be 10 digits'),
  service_needed: z.string().min(1, 'Please select a service'),
  street_address: z.string().min(1, 'Street address is required').max(255),
  unit: z.string().max(50).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(50),
  zip: z.string().min(5, 'Zip code is required').max(10),
  project_details: z.string().max(1000).optional(),
  is_emergency: z.boolean().default(false),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormContext {
  serviceId?: string;
  serviceName?: string;
  city?: string;
  originatingUrl?: string;
}

interface UniversalLeadFormProps {
  mode: 'modal' | 'embed';
  modalHeader?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showHeader?: boolean;
  context?: LeadFormContext | null;
}

export const UniversalLeadForm = ({ 
  mode, 
  modalHeader, 
  onSuccess, 
  onCancel,
  showHeader = true,
  context 
}: UniversalLeadFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: formSettings } = useFormSettings();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      service_needed: context?.serviceName || '',
      street_address: '',
      unit: '',
      city: context?.city || '',
      state: '',
      zip: '',
      project_details: '',
      is_emergency: false,
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const leadData = await callEdgeFunction<any>({
        name: 'submit-lead',
        body: {
          ...data,
          service_id: context?.serviceId,
          originating_url: context?.originatingUrl || window.location.href,
          lead_source: mode === 'modal' ? 'service_page' : 'homepage',
        },
        timeoutMs: 60000,
      });

      setShowSuccess(true);
      form.reset();
      toast.success('Thank you! We received your request.');
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-green-900 mb-2">
            Thank you! We received your request.
          </h3>
          <p className="text-green-800">
            {formSettings?.success_message || "We'll get back to you within 24 hours. Check your email for login credentials to track your project status."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'modal' && modalHeader ? modalHeader : formSettings?.form_heading || 'Get Your Free Quote'}
          </h2>
          <p className="text-muted-foreground">
            {formSettings?.form_subheading || "Fill out the form below and we'll get back to you within 24 hours"}
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., John" 
                      className="placeholder:italic placeholder:font-light"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Smith" 
                      className="placeholder:italic placeholder:font-light"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="e.g., john.smith@email.com" 
                      className="placeholder:italic placeholder:font-light"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <PhoneInput 
                      placeholder="e.g., (555) 555-5555" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Service Selection */}
          <FormField
            control={form.control}
            name="service_needed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Needed *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="placeholder:italic placeholder:font-light">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formSettings?.service_options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="street_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 123 Main Street" 
                    className="placeholder:italic placeholder:font-light"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apartment/Unit/Floor (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Apt 4B (optional)" 
                    className="placeholder:italic placeholder:font-light"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., New Orleans" 
                      className="placeholder:italic placeholder:font-light"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., LA" 
                      className="placeholder:italic placeholder:font-light"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 70119" 
                      className="placeholder:italic placeholder:font-light"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Project Details */}
          <FormField
            control={form.control}
            name="project_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Details (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g., I need a roof inspection after recent storm damage" 
                    className="placeholder:italic placeholder:font-light resize-none"
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Emergency Checkbox */}
          <FormField
            control={form.control}
            name="is_emergency"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-destructive/30 p-4 bg-destructive/5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base font-semibold text-destructive">
                    This is an emergency
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex gap-4">
            {mode === 'modal' && onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={mode === 'modal' && onCancel ? 'flex-1' : 'w-full'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                formSettings?.submit_button_text || 'Submit'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
