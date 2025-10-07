import Handlebars from 'handlebars';

/**
 * Renders a Handlebars template with provided data
 * @param templateHtml - The HTML template with {{variables}}
 * @param data - Object containing values for variables
 * @returns Rendered HTML string
 */
export function renderTemplate(templateHtml: string, data: Record<string, any>): string {
  try {
    // Compile the Handlebars template
    const template = Handlebars.compile(templateHtml);
    
    // Render with data
    const renderedHtml = template(data);
    
    return renderedHtml;
  } catch (error) {
    console.error('Template rendering error:', error);
    throw new Error(`Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Formats a price in cents to dollar string
 * @param cents - Price in cents
 * @returns Formatted price string like "$1,500"
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

/**
 * Formats a phone number to (XXX) XXX-XXXX format
 * @param phone - Raw phone number string
 * @returns Formatted phone string
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Marks pages for regeneration when data changes
 */
export async function markPagesForRegeneration(
  type: 'template' | 'company' | 'service' | 'service_area',
  id?: string
) {
  // This will be called from mutation handlers
  // Implementation depends on the specific use case
  console.log(`Marking pages for regeneration: ${type}`, id);
}

/**
 * Gathers all data needed to render a generated page
 * @param generatedPageId - ID of the generated page
 * @returns Object with all template variables
 */
export async function getPageData(generatedPageId: string): Promise<Record<string, any>> {
  // This will be implemented when we create the public page rendering
  // For now, this is a placeholder that shows the structure
  throw new Error('getPageData not yet implemented - will be added in public page rendering');
}
