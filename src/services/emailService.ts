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
   * Send email immediately using SendGrid
   */
  static async sendEmail(
    to: string,
    subject: string,
    body: string,
    options: EmailOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get company settings for "from" email
      const { data: company } = await supabase
        .from('company_settings')
        .select('email')
        .single();

      // Call SendGrid edge function
      const { data, error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html: body,
          from: company?.email || options.cc || 'noreply@yourdomain.com'
        }
      });

      const status = data?.success ? 'sent' : 'failed';
      const errorMessage = data?.success ? null : (sendError?.message || 'Unknown error');

      // Log to email_queue for tracking
      await supabase
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
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          error_message: errorMessage
        });

      if (!data?.success) {
        throw new Error(errorMessage || 'Failed to send email');
      }

      console.log('✅ Email sent successfully:', { to, subject });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email using a template (by ID or name)
   */
  static async sendTemplateEmail(
    templateIdOrName: string,
    to: string,
    variables: TemplateVariables,
    options: EmailOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to fetch template by ID first, then by name
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      // Check if it looks like a UUID
      if (templateIdOrName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        query = query.eq('id', templateIdOrName);
      } else {
        query = query.eq('name', templateIdOrName);
      }

      const { data: template, error: templateError } = await query.single();

      if (templateError || !template) {
        throw new Error(`Template "${templateIdOrName}" not found or inactive`);
      }

      // Merge with default variables
      const defaultVars = await this.getDefaultVariables();
      const allVariables = { ...defaultVars, ...variables };

      // Replace variables in subject and body
      const subject = this.replaceVariables(template.subject, allVariables);
      const body = this.replaceVariables(template.body, allVariables);

      // Send email
      return await this.sendEmail(to, subject, body, {
        ...options,
        templateId: template.id
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
