import { supabase } from '@/integrations/supabase/client';
import { EmailService, TemplateVariables } from './emailService';

/**
 * Automated email trigger service
 * Checks for active email templates with specific triggers and sends emails automatically
 */
export class AutomatedEmailTriggers {
  /**
   * Send email based on trigger type if template exists and is active
   */
  private static async sendTriggeredEmail(
    triggerType: string,
    recipientEmail: string,
    variables: TemplateVariables,
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    try {
      // Check if email notifications are enabled globally
      const { data: settings } = await supabase
        .from('company_settings')
        .select('email_notifications_enabled')
        .single();

      if (settings && !settings.email_notifications_enabled) {
        console.log(`Email notifications disabled globally, skipping ${triggerType}`);
        return;
      }

      // Find active template with matching trigger
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('trigger_type', triggerType)
        .eq('is_active', true)
        .maybeSingle();

      if (!template) {
        console.log(`No active template found for trigger: ${triggerType}`);
        return;
      }

      console.log(`Sending automated email for trigger: ${triggerType}`);
      
      await EmailService.sendTemplateEmail(
        template.id,
        recipientEmail,
        variables,
        {
          entityType,
          entityId
        }
      );
    } catch (error) {
      console.error(`Error in automated email trigger (${triggerType}):`, error);
    }
  }

  /**
   * Trigger: Lead Created
   */
  static async onLeadCreated(lead: any): Promise<void> {
    const variables: TemplateVariables = {
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      service_needed: lead.service_needed || '',
      project_details: lead.project_details || '',
      street_address: lead.street_address || '',
      city: lead.city || '',
      state: lead.state || '',
      zip: lead.zip || '',
    };

    await this.sendTriggeredEmail('lead_created', lead.email, variables, 'lead', lead.id);
  }

  /**
   * Trigger: Lead Status Changed
   */
  static async onLeadStatusChanged(lead: any, oldStatus: string): Promise<void> {
    const variables: TemplateVariables = {
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      old_status: oldStatus,
      new_status: lead.status || '',
    };

    await this.sendTriggeredEmail('lead_status_changed', lead.email, variables, 'lead', lead.id);
  }

  /**
   * Trigger: Appointment Scheduled
   */
  static async onAppointmentScheduled(appointment: any, accountId: string): Promise<void> {
    try {
      // Get account and primary contact
      const { data: account } = await supabase
        .from('accounts')
        .select('account_name, contacts(email, first_name, last_name, is_primary)')
        .eq('id', accountId)
        .single();

      if (!account) return;

      const primaryContact = account.contacts?.find((c: any) => c.is_primary) || account.contacts?.[0];
      if (!primaryContact?.email) return;

      const variables: TemplateVariables = {
        first_name: primaryContact.first_name || '',
        last_name: primaryContact.last_name || '',
        account_name: account.account_name || '',
        appointment_date: new Date(appointment.start_time).toLocaleDateString(),
        appointment_time: new Date(appointment.start_time).toLocaleTimeString(),
        appointment_title: appointment.title || '',
        appointment_location: appointment.location || '',
      };

      await this.sendTriggeredEmail(
        'appointment_scheduled',
        primaryContact.email,
        variables,
        'appointment',
        appointment.id
      );
    } catch (error) {
      console.error('Error in onAppointmentScheduled:', error);
    }
  }

  /**
   * Trigger: Quote Sent
   */
  static async onQuoteSent(quote: any, accountId: string): Promise<void> {
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('account_name, contacts(email, first_name, last_name, is_primary)')
        .eq('id', accountId)
        .single();

      if (!account) return;

      const primaryContact = account.contacts?.find((c: any) => c.is_primary) || account.contacts?.[0];
      if (!primaryContact?.email) return;

      const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(cents / 100);
      };

      const variables: TemplateVariables = {
        first_name: primaryContact.first_name || '',
        last_name: primaryContact.last_name || '',
        account_name: account.account_name || '',
        quote_number: quote.quote_number || '',
        total_amount: formatCurrency(quote.total_amount),
        valid_until: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A',
      };

      await this.sendTriggeredEmail('quote_sent', primaryContact.email, variables, 'quote', quote.id);
    } catch (error) {
      console.error('Error in onQuoteSent:', error);
    }
  }

  /**
   * Trigger: Quote Accepted
   */
  static async onQuoteAccepted(quote: any, accountId: string): Promise<void> {
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('account_name, contacts(email, first_name, last_name, is_primary)')
        .eq('id', accountId)
        .single();

      if (!account) return;

      const primaryContact = account.contacts?.find((c: any) => c.is_primary) || account.contacts?.[0];
      if (!primaryContact?.email) return;

      const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(cents / 100);
      };

      const variables: TemplateVariables = {
        first_name: primaryContact.first_name || '',
        last_name: primaryContact.last_name || '',
        account_name: account.account_name || '',
        quote_number: quote.quote_number || '',
        total_amount: formatCurrency(quote.total_amount),
      };

      await this.sendTriggeredEmail('quote_accepted', primaryContact.email, variables, 'quote', quote.id);
    } catch (error) {
      console.error('Error in onQuoteAccepted:', error);
    }
  }

  /**
   * Trigger: Invoice Sent
   */
  static async onInvoiceSent(invoice: any, accountId: string): Promise<void> {
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('account_name, contacts(email, first_name, last_name, is_primary)')
        .eq('id', accountId)
        .single();

      if (!account) return;

      const primaryContact = account.contacts?.find((c: any) => c.is_primary) || account.contacts?.[0];
      if (!primaryContact?.email) return;

      const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(cents / 100);
      };

      const variables: TemplateVariables = {
        first_name: primaryContact.first_name || '',
        last_name: primaryContact.last_name || '',
        account_name: account.account_name || '',
        invoice_number: invoice.invoice_number || '',
        total_amount: formatCurrency(invoice.total_amount),
        due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A',
        payment_link: `${window.location.origin}/portal/invoices/${invoice.id}`,
      };

      await this.sendTriggeredEmail('invoice_sent', primaryContact.email, variables, 'invoice', invoice.id);
    } catch (error) {
      console.error('Error in onInvoiceSent:', error);
    }
  }

  /**
   * Trigger: Project Status Changed
   */
  static async onProjectStatusChanged(project: any, oldStatus: string, accountId: string): Promise<void> {
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('account_name, contacts(email, first_name, last_name, is_primary)')
        .eq('id', accountId)
        .single();

      if (!account) return;

      const primaryContact = account.contacts?.find((c: any) => c.is_primary) || account.contacts?.[0];
      if (!primaryContact?.email) return;

      const variables: TemplateVariables = {
        first_name: primaryContact.first_name || '',
        last_name: primaryContact.last_name || '',
        account_name: account.account_name || '',
        project_name: project.project_name || '',
        old_status: oldStatus,
        new_status: project.status || '',
        project_description: project.description || '',
      };

      await this.sendTriggeredEmail(
        'project_status_changed',
        primaryContact.email,
        variables,
        'project',
        project.id
      );
    } catch (error) {
      console.error('Error in onProjectStatusChanged:', error);
    }
  }
}
