-- Insert email templates for review system

INSERT INTO email_templates (name, subject, body, category, variables, is_active) VALUES
(
  'Review Request',
  'We''d love your feedback on {{service_name}}',
  '<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Hi {{customer_name}},</h2>
        
        <p>Thank you for choosing {{company_name}} for your recent {{service_name}} service!</p>
        
        <p>We hope you''re satisfied with our work. Your feedback helps us improve and helps other customers make informed decisions.</p>
        
        <p>Would you mind taking a moment to share your experience?</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{review_link}}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Leave a Review
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Your honest feedback means the world to us. It only takes a minute!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Thank you for your business,<br>
          The {{company_name}} Team
        </p>
      </div>
    </body>
  </html>',
  'reviews',
  '{"customer_name": "Customer''s first name", "company_name": "Your company name", "service_name": "Name of service provided", "review_link": "Direct link to review submission page"}',
  true
),
(
  'New Review Notification',
  'New Review Submitted - {{customer_name}}',
  '<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Review Received</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">{{review_title}}</h3>
          <div style="margin: 10px 0;">
            <strong>Rating:</strong> {{rating}} stars
          </div>
          <div style="margin: 10px 0;">
            <strong>Customer:</strong> {{customer_name}}
          </div>
          <div style="margin: 10px 0;">
            <strong>Service:</strong> {{service_name}}
          </div>
          <div style="margin: 10px 0;">
            <p><strong>Review:</strong></p>
            <p style="font-style: italic;">{{review_excerpt}}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{review_detail_link}}" 
             style="background-color: #10b981; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
            View Details
          </a>
          <a href="{{approve_link}}" 
             style="background-color: #2563eb; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
            Approve Review
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">Review submitted on {{submission_date}}</p>
      </div>
    </body>
  </html>',
  'reviews',
  '{"customer_name": "Customer who left the review", "review_title": "Title of the review", "rating": "Star rating (1-5)", "service_name": "Service the review is for", "review_excerpt": "First 200 characters of review", "submission_date": "Date review was submitted", "review_detail_link": "Link to review detail page", "approve_link": "Direct approve action link"}',
  true
),
(
  'Review Approved',
  'Thank you! Your review is now live',
  '<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Thank You, {{customer_name}}!</h2>
        
        <p>We wanted to let you know that your review has been approved and is now live on our website.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 0; color: #15803d; font-weight: bold;">✓ Your review is helping others!</p>
        </div>
        
        <p>Your feedback is incredibly valuable and helps other customers make informed decisions.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{review_link}}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View Your Review
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">If you ever need to update your review, you can do so from your customer portal.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          Thanks again for choosing {{company_name}},<br>
          We truly appreciate your business!
        </p>
      </div>
    </body>
  </html>',
  'reviews',
  '{"customer_name": "Customer''s first name", "company_name": "Your company name", "review_link": "Link to view the review on the website"}',
  true
);