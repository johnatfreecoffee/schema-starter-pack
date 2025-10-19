import { supabase } from '@/integrations/supabase/client';

interface ReviewEmailData {
  reviewId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  reviewTitle: string;
  reviewText: string;
  serviceName?: string;
  adminReviewUrl: string;
}

export async function sendNewReviewNotification(data: ReviewEmailData) {
  try {
    // Get company settings for admin email
    const { data: settings } = await supabase
      .from('company_settings')
      .select('email, business_name')
      .single();

    if (!settings?.email) {
      console.error('No admin email configured');
      return;
    }

    const subject = `New Review Submitted - Requires Approval`;
    const body = `
      <h2>New Review Received</h2>
      <p>A customer has submitted a new review that requires your approval.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Customer:</strong> ${data.customerName}</p>
        <p><strong>Rating:</strong> ${'⭐'.repeat(data.rating)}</p>
        ${data.serviceName ? `<p><strong>Service:</strong> ${data.serviceName}</p>` : ''}
        <p><strong>Review Title:</strong> ${data.reviewTitle}</p>
        <p><strong>Review:</strong></p>
        <p>${data.reviewText}</p>
      </div>
      
      <p>
        <a href="${data.adminReviewUrl}" 
           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Review & Approve
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        This is an automated notification from ${settings.business_name}
      </p>
    `;

    await supabase.from('email_queue').insert({
      to_email: settings.email,
      subject,
      body,
      entity_type: 'review',
      entity_id: data.reviewId
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending new review notification:', error);
    return { success: false, error };
  }
}

export async function sendReviewApprovedNotification(
  customerEmail: string,
  customerName: string,
  reviewTitle: string,
  publicReviewUrl: string
) {
  try {
    const { data: settings } = await supabase
      .from('company_settings')
      .select('business_name')
      .single();

    const subject = `Your Review Has Been Published!`;
    const body = `
      <h2>Thank You for Your Review!</h2>
      <p>Hi ${customerName},</p>
      
      <p>Great news! Your review "${reviewTitle}" has been approved and is now published on our website.</p>
      
      <p>Your feedback helps us improve and helps other customers make informed decisions. We truly appreciate you taking the time to share your experience.</p>
      
      <p>
        <a href="${publicReviewUrl}" 
           style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Your Review
        </a>
      </p>
      
      <p style="margin-top: 30px;">Thank you for being a valued customer!</p>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        Best regards,<br>
        ${settings?.business_name || 'The Team'}
      </p>
    `;

    await supabase.from('email_queue').insert({
      to_email: customerEmail,
      subject,
      body,
      entity_type: 'review'
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending review approved notification:', error);
    return { success: false, error };
  }
}

export async function sendReviewRejectedNotification(
  customerEmail: string,
  customerName: string,
  reviewTitle: string,
  reason?: string
) {
  try {
    const { data: settings } = await supabase
      .from('company_settings')
      .select('business_name, email')
      .single();

    const subject = `Update on Your Review Submission`;
    const body = `
      <h2>Thank You for Your Submission</h2>
      <p>Hi ${customerName},</p>
      
      <p>Thank you for taking the time to submit your review "${reviewTitle}".</p>
      
      <p>After careful consideration, we're unable to publish this review at this time${reason ? `: ${reason}` : '.'}</p>
      
      <p>We value your feedback and would welcome you to submit another review that:</p>
      <ul>
        <li>Focuses on your experience with our service</li>
        <li>Provides constructive feedback</li>
        <li>Follows our community guidelines</li>
      </ul>
      
      <p>If you have any questions or concerns, please don't hesitate to contact us at ${settings?.email || 'our support email'}.</p>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        Best regards,<br>
        ${settings?.business_name || 'The Team'}
      </p>
    `;

    await supabase.from('email_queue').insert({
      to_email: customerEmail,
      subject,
      body,
      entity_type: 'review'
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending review rejected notification:', error);
    return { success: false, error };
  }
}
