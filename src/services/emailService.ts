import { supabase } from '@/integrations/supabase/client';

export interface EmailOptions {
  cc?: string;
  bcc?: string;
  entityType?: string;
  entityId?: string;
  templateId?: string;
}

export interface TemplateVariables {
  [key: string]: string | number | undefined;
}

export class EmailService {
  /**
   * Queue an email to be sent
   */
  static async sendEmail(
    to: string,
    subject: string,
    body: string,
    options: EmailOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('email_queue')
        .insert({
          to_email: to,
          cc_email: options.cc,
          bcc_email: options.bcc,
          subject,
          body,
          template_id: options.templateId,
          entity_type: options.entityType,
          entity_id: options.entityId,
          created_by: user?.id,
          status: 'pending'
        });

      if (error) throw error;

      // Mock sending - in production, this would trigger an email service
      console.log('📧 Email queued:', { to, subject, body: body.substring(0, 100) + '...' });

      return { success: true };
    } catch (error: any) {
      console.error('Error queuing email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email using a template
   */
  static async sendTemplateEmail(
    templateId: string,
    to: string,
    variables: TemplateVariables,
    options: EmailOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        throw new Error('Template not found or inactive');
      }

      // Replace variables in subject and body
      const subject = this.replaceVariables(template.subject, variables);
      const body = this.replaceVariables(template.body, variables);

      // Queue email
      return await this.sendEmail(to, subject, body, {
        ...options,
        templateId
      });
    } catch (error: any) {
      console.error('Error sending template email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Replace template variables with actual values
   */
  static replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content;

    Object.keys(variables).forEach(key => {
      const value = variables[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Preview template with sample data
   */
  static async previewTemplate(
    templateId: string,
    sampleData: TemplateVariables
  ): Promise<{ subject: string; body: string } | null> {
    try {
      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) return null;

      return {
        subject: this.replaceVariables(template.subject, sampleData),
        body: this.replaceVariables(template.body, sampleData)
      };
    } catch (error) {
      console.error('Error previewing template:', error);
      return null;
    }
  }

  /**
   * Process email queue (mock for now)
   */
  static async processEmailQueue(): Promise<void> {
    try {
      const { data: pendingEmails, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(10);

      if (error || !pendingEmails) return;

      for (const email of pendingEmails) {
        // Mock sending
        console.log('📧 Sending email:', {
          to: email.to_email,
          subject: email.subject,
          body: email.body.substring(0, 100) + '...'
        });

        // Update status to sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  /**
   * Get default template variables with company settings
   */
  static async getDefaultVariables(): Promise<TemplateVariables> {
    try {
      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      const currentDate = new Date();

      return {
        company_name: company?.business_name || 'Company Name',
        company_email: company?.email || 'company@example.com',
        company_phone: company?.phone || '(555) 555-5555',
        company_address: company?.address || '123 Main St',
        current_date: currentDate.toLocaleDateString(),
        current_year: currentDate.getFullYear().toString()
      };
    } catch (error) {
      console.error('Error getting default variables:', error);
      return {
        company_name: 'Company Name',
        company_email: 'company@example.com',
        company_phone: '(555) 555-5555',
        current_date: new Date().toLocaleDateString(),
        current_year: new Date().getFullYear().toString()
      };
    }
  }

  /**
   * Retry failed email
   */
  static async retryEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({
          status: 'pending',
          error_message: null
        })
        .eq('id', emailId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
