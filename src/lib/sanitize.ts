import DOMPurify from 'dompurify';

// Extend Window interface to include DOMPurify types
declare global {
  interface Window {
    trustedTypes?: {
      createPolicy: (name: string, rules: unknown) => unknown;
    };
  }
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify to remove malicious scripts, event handlers, and unsafe content
 * 
 * @param dirty - The potentially unsafe HTML string
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML safe for rendering
 */
export const sanitizeHtml = (
  dirty: string,
  options?: Parameters<typeof DOMPurify.sanitize>[1]
): string => {
  // Default configuration - removes scripts, event handlers, and unsafe tags
  const defaultConfig: Parameters<typeof DOMPurify.sanitize>[1] = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span',
      'hr', 'sup', 'sub', 'del', 'ins', 'mark', 'small', 'abbr',
      'address', 'article', 'aside', 'footer', 'header', 'nav', 'section',
      'figure', 'figcaption', 'main', 'time', 'details', 'summary'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height', 'loading', 'datetime',
      'type', 'start', 'reversed', 'colspan', 'rowspan'
    ],
    ALLOW_DATA_ATTR: false, // Prevent data-* attributes that could be used for attacks
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    RETURN_TRUSTED_TYPE: false, // Return string instead of TrustedHTML
    ...options
  };

  const sanitized = DOMPurify.sanitize(dirty, defaultConfig);
  return typeof sanitized === 'string' ? sanitized : String(sanitized);
};

/**
 * Sanitizes HTML content for email templates
 * More permissive for email styling but still removes XSS vectors
 */
export const sanitizeEmailHtml = (dirty: string): string => {
  return sanitizeHtml(dirty, {
    ADD_TAGS: ['style'],
    ADD_ATTR: ['bgcolor', 'cellpadding', 'cellspacing', 'border', 'align', 'valign'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
};

/**
 * Sanitizes HTML but preserves more formatting for rich text editors
 * Use with caution - only for admin-controlled content
 */
export const sanitizeRichText = (dirty: string): string => {
  return sanitizeHtml(dirty, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['frameborder', 'allowfullscreen'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
};
