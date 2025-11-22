/**
 * Shared email template helper for consistent branding across all system emails
 */

export interface EmailTemplateOptions {
  companyName: string;
  logoUrl?: string;
  iconUrl?: string;
}

/**
 * Generates the email header with company logo/icon and divider
 */
export function getEmailHeader(options: EmailTemplateOptions): string {
  const { companyName, logoUrl, iconUrl } = options;
  const imageUrl = logoUrl || iconUrl; // Prefer logo for email header
  
  return `
    <div style="text-align: center; padding: 30px 20px; background-color: #f9fafb; border-bottom: 3px solid #e5e7eb;">
      ${imageUrl ? `
        <img 
          src="${imageUrl}" 
          alt="${companyName} Logo" 
          style="max-width: 120px; height: auto; margin-bottom: 10px;"
        />
      ` : `
        <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${companyName}
        </h1>
      `}
    </div>
  `;
}

/**
 * Wraps email content with consistent header and footer
 */
export function wrapEmailContent(
  content: string,
  options: EmailTemplateOptions
): string {
  const { companyName } = options;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .email-content {
            padding: 30px 40px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          @media only screen and (max-width: 600px) {
            .email-content {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          ${getEmailHeader(options)}
          <div class="email-content">
            ${content}
            <div class="footer">
              <p>This email was sent by ${companyName}</p>
              <p style="margin-top: 10px; font-size: 11px;">
                If you have any questions, please contact us.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
