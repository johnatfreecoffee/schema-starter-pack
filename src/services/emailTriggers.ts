import { EmailService } from './emailService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Email trigger functions for CRM events
 */
export class EmailTriggers {
  /**
   * Trigger email when a lead is submitted
   */
  static async onLeadSubmission(leadData: any): Promise<void> {
    try {
      // Get company settings
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      // Use service_needed as service name
      const serviceName = leadData.service_needed || 'General Inquiry';

      const variables = {
        customer_name: `${leadData.first_name} ${leadData.last_name}`,
        customer_email: leadData.email,
        customer_phone: leadData.phone || 'Not provided',
        service_name: serviceName,
        lead_message: leadData.project_details || 'No additional details provided',
        lead_source: leadData.source || 'Website',
        company_name: company?.business_name || 'Your Company',
        company_phone: company?.phone || '',
        company_email: company?.email || '',
        company_address: company?.address || '',
        current_date: new Date().toLocaleDateString(),
        current_year: new Date().getFullYear().toString()
      };

      // Send confirmation email to customer
      await EmailService.sendTemplateEmail(
        'lead-submission-confirmation',
        leadData.email,
        variables
      );

      console.log('✅ Lead submission confirmation sent to:', leadData.email);
    } catch (error) {
      console.error('Error triggering lead submission email:', error);
    }
  }

  /**
   * Trigger email when a quote is created/sent
   */
  static async onQuoteCreated(quoteData: any, accountData: any): Promise<void> {
    try {
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      // Format currency
      const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(cents / 100);
      };

      const variables = {
        customer_name: accountData.account_name,
        quote_number: quoteData.quote_number,
        total_amount: formatCurrency(quoteData.total_amount),
        quote_date: new Date(quoteData.created_at).toLocaleDateString(),
        valid_until: quoteData.valid_until ? new Date(quoteData.valid_until).toLocaleDateString() : 'N/A',
        company_name: company?.business_name || 'Your Company',
        company_phone: company?.phone || '',
        company_email: company?.email || '',
        current_date: new Date().toLocaleDateString()
      };

      // Get primary contact email
      const { data: contacts } = await supabase
        .from('contacts')
        .select('email')
        .eq('account_id', accountData.id)
        .eq('is_primary', true)
        .limit(1);

      const recipientEmail = contacts?.[0]?.email || accountData.email;

      if (recipientEmail) {
        await EmailService.sendTemplateEmail(
          'quote-created',
          recipientEmail,
          variables,
          {
            entityType: 'quote',
            entityId: quoteData.id
          }
        );

        console.log('✅ Quote created email sent to:', recipientEmail);
      }
    } catch (error) {
      console.error('Error triggering quote created email:', error);
    }
  }

  /**
   * Trigger email when an invoice is created/sent
   */
  static async onInvoiceCreated(invoiceData: any, accountData: any): Promise<void> {
    try {
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(cents / 100);
      };

      const variables = {
        customer_name: accountData.account_name,
        invoice_number: invoiceData.invoice_number,
        total_amount: formatCurrency(invoiceData.total_amount),
        invoice_date: new Date(invoiceData.created_at).toLocaleDateString(),
        due_date: new Date(invoiceData.due_date).toLocaleDateString(),
        payment_link: `${window.location.origin}/portal/invoices/${invoiceData.id}`,
        company_name: company?.business_name || 'Your Company',
        company_phone: company?.phone || '',
        company_email: company?.email || '',
        current_date: new Date().toLocaleDateString()
      };

      const { data: contacts } = await supabase
        .from('contacts')
        .select('email')
        .eq('account_id', accountData.id)
        .eq('is_primary', true)
        .limit(1);

      const recipientEmail = contacts?.[0]?.email || accountData.email;

      if (recipientEmail) {
        await EmailService.sendTemplateEmail(
          'invoice-created',
          recipientEmail,
          variables,
          {
            entityType: 'invoice',
            entityId: invoiceData.id
          }
        );

        console.log('✅ Invoice created email sent to:', recipientEmail);
      }
    } catch (error) {
      console.error('Error triggering invoice created email:', error);
    }
  }

  /**
   * Trigger email when an appointment is scheduled
   */
  static async onAppointmentScheduled(eventData: any, accountData: any): Promise<void> {
    try {
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      const formatTime = (dateTime: string) => {
        return new Date(dateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };

      const variables = {
        customer_name: accountData.account_name,
        appointment_date: new Date(eventData.start_time).toLocaleDateString(),
        appointment_time: formatTime(eventData.start_time),
        service_name: eventData.title || 'Appointment',
        service_address: eventData.location || accountData.address || 'TBD',
        company_name: company?.business_name || 'Your Company',
        company_phone: company?.phone || '',
        current_date: new Date().toLocaleDateString()
      };

      const { data: contacts } = await supabase
        .from('contacts')
        .select('email')
        .eq('account_id', accountData.id)
        .eq('is_primary', true)
        .limit(1);

      const recipientEmail = contacts?.[0]?.email || accountData.email;

      if (recipientEmail) {
        await EmailService.sendTemplateEmail(
          'appointment-scheduled',
          recipientEmail,
          variables,
          {
            entityType: 'appointment',
            entityId: eventData.id
          }
        );

        console.log('✅ Appointment scheduled email sent to:', recipientEmail);
      }
    } catch (error) {
      console.error('Error triggering appointment scheduled email:', error);
    }
  }

  /**
   * Trigger email when a project status changes
   */
  static async onProjectUpdate(projectData: any, accountData: any, oldStatus?: string): Promise<void> {
    try {
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      const variables = {
        customer_name: accountData.account_name,
        project_name: projectData.project_name,
        project_status: projectData.status,
        status_note: projectData.description || '',
        company_name: company?.business_name || 'Your Company',
        company_phone: company?.phone || '',
        current_date: new Date().toLocaleDateString()
      };

      const { data: contacts } = await supabase
        .from('contacts')
        .select('email')
        .eq('account_id', accountData.id)
        .eq('is_primary', true)
        .limit(1);

      const recipientEmail = contacts?.[0]?.email || accountData.email;

      if (recipientEmail && oldStatus && oldStatus !== projectData.status) {
        await EmailService.sendTemplateEmail(
          'project-update',
          recipientEmail,
          variables,
          {
            entityType: 'project',
            entityId: projectData.id
          }
        );

        console.log('✅ Project update email sent to:', recipientEmail);
      }
    } catch (error) {
      console.error('Error triggering project update email:', error);
    }
  }
}
