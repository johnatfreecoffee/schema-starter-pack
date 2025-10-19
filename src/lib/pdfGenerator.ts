import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface CompanySettings {
  business_name: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  business_slogan?: string;
  document_header_color?: string;
  document_theme_color?: string;
  document_footer_text?: string;
  document_terms?: string;
  document_payment_instructions?: string;
  show_tagline_on_documents?: boolean;
  show_logo_in_documents?: boolean;
  document_logo_position?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface QuoteData {
  quote_number: string;
  created_at: string;
  valid_until?: string;
  status: string;
  total_amount: number;
  discount_rate?: number;
  tax_rate?: number;
  notes?: string;
  terms?: string;
  accounts: {
    account_name: string;
    contacts?: Array<{
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    }>;
  };
}

interface InvoiceData {
  invoice_number: string;
  created_at: string;
  due_date: string;
  status: string;
  total_amount: number;
  discount_rate?: number;
  tax_rate?: number;
  notes?: string;
  terms?: string;
  accounts: {
    account_name: string;
    contacts?: Array<{
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    }>;
  };
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private async loadCompanySettings(): Promise<CompanySettings> {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Load an image from URL and convert to base64 data URL
   * Handles CORS and image loading errors gracefully
   */
  private async loadImage(url: string): Promise<{ data: string; width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.warn('Failed to get canvas context for logo');
            resolve(null);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          
          resolve({
            data: dataUrl,
            width: img.width,
            height: img.height
          });
        } catch (error) {
          console.warn('Failed to convert logo to base64:', error);
          resolve(null);
        }
      };
      
      img.onerror = (error) => {
        console.warn('Failed to load logo image:', error);
        resolve(null);
      };
      
      // Handle Supabase storage URLs and ensure they're accessible
      img.src = url;
    });
  }

  private async addHeader(company: CompanySettings, documentType: string, documentNumber: string) {
    const headerColor = company.document_header_color || '#3b82f6';
    
    // Convert hex to RGB
    const r = parseInt(headerColor.slice(1, 3), 16);
    const g = parseInt(headerColor.slice(3, 5), 16);
    const b = parseInt(headerColor.slice(5, 7), 16);
    
    this.doc.setFillColor(r, g, b);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    let logoWidth = 0;
    let hasLogo = false;

    // Logo rendering (if enabled and logo exists)
    if (company.show_logo_in_documents && company.logo_url) {
      try {
        const logoImage = await this.loadImage(company.logo_url);
        
        if (logoImage) {
          // Calculate logo dimensions maintaining aspect ratio
          const maxLogoHeight = 15;
          const maxLogoWidth = 50;
          
          let renderHeight = maxLogoHeight;
          let renderWidth = (logoImage.width / logoImage.height) * maxLogoHeight;
          
          // If width exceeds max, scale down by width instead
          if (renderWidth > maxLogoWidth) {
            renderWidth = maxLogoWidth;
            renderHeight = (logoImage.height / logoImage.width) * maxLogoWidth;
          }
          
          // Calculate logo X position based on alignment setting
          let logoX = 10; // default left
          const logoY = 12.5; // vertically centered in 40px header
          
          if (company.document_logo_position === 'center') {
            logoX = (this.pageWidth - renderWidth) / 2;
          } else if (company.document_logo_position === 'right') {
            logoX = this.pageWidth - renderWidth - 10;
          }
          
          // Render the logo
          this.doc.addImage(
            logoImage.data,
            'PNG',
            logoX,
            logoY,
            renderWidth,
            renderHeight
          );
          
          logoWidth = renderWidth;
          hasLogo = true;
        }
      } catch (error) {
        console.warn('Failed to render logo in PDF header:', error);
        // Continue without logo - not a critical error
      }
    }

    // Company name and info - position to avoid overlapping logo
    const textStartX = hasLogo && company.document_logo_position === 'left' 
      ? logoWidth + 20 
      : this.margin;
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    
    // Only show company name if logo is not centered (would overlap)
    if (!hasLogo || company.document_logo_position !== 'center') {
      this.doc.text(company.business_name, textStartX, 20);

      if (company.show_tagline_on_documents && company.business_slogan) {
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(company.business_slogan, textStartX, 28);
      }
    }

    // Document type and number (always on the right)
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${documentType} #${documentNumber}`, this.pageWidth - this.margin, 25, { align: 'right' });

    this.currentY = 50;
    this.doc.setTextColor(0, 0, 0);
  }

  private addCompanyInfo(company: CompanySettings) {
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    const lines = [
      company.address || '[Address Not Provided]',
      company.phone || '[Phone Not Provided]',
      company.email || '[Email Not Provided]'
    ];

    lines.forEach((line, index) => {
      this.doc.text(line, this.margin, this.currentY + (index * 5));
    });

    this.currentY += 20;
  }

  private addCustomerInfo(accountName: string, contact?: any) {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bill To:', this.margin, this.currentY);
    
    this.currentY += 7;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(accountName || '[Not Provided]', this.margin, this.currentY);
    
    if (contact) {
      this.currentY += 5;
      this.doc.text(`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '[Not Provided]', this.margin, this.currentY);
      this.currentY += 5;
      this.doc.text(contact.email || '[Not Provided]', this.margin, this.currentY);
      if (contact.phone) {
        this.currentY += 5;
        this.doc.text(contact.phone, this.margin, this.currentY);
      }
    }

    this.currentY += 15;
  }

  private addLineItemsTable(items: LineItem[], company?: CompanySettings) {
    // Table header with theme color
    const themeColor = company?.document_theme_color || '#3b82f6';
    const r = parseInt(themeColor.slice(1, 3), 16);
    const g = parseInt(themeColor.slice(3, 5), 16);
    const b = parseInt(themeColor.slice(5, 7), 16);
    
    this.doc.setFillColor(r, g, b);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 10, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Description', this.margin + 2, this.currentY + 7);
    this.doc.text('Qty', this.pageWidth - 80, this.currentY + 7);
    this.doc.text('Rate', this.pageWidth - 60, this.currentY + 7);
    this.doc.text('Amount', this.pageWidth - this.margin - 2, this.currentY + 7, { align: 'right' });
    this.doc.setTextColor(0, 0, 0);

    this.currentY += 12;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);

    items.forEach((item) => {
      if (this.currentY > this.pageHeight - 60) {
        this.doc.addPage();
        this.currentY = 20;
      }

      // Escape special characters in description
      const description = item.description.replace(/[<>&"']/g, (char) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return escapeMap[char] || char;
      });

      this.doc.text(description, this.margin + 2, this.currentY);
      this.doc.text(item.quantity.toString(), this.pageWidth - 80, this.currentY);
      this.doc.text(`$${(item.unit_price / 100).toFixed(2)}`, this.pageWidth - 60, this.currentY);
      this.doc.text(`$${(item.amount / 100).toFixed(2)}`, this.pageWidth - this.margin - 2, this.currentY, { align: 'right' });

      this.currentY += 8;
    });

    this.currentY += 5;
  }

  private addTotals(subtotal: number, discount: number = 0, tax: number = 0, total: number) {
    const startX = this.pageWidth - 80;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Subtotal:', startX, this.currentY);
    this.doc.text(`$${(subtotal / 100).toFixed(2)}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 6;

    if (discount > 0) {
      this.doc.text(`Discount (${discount}%):`, startX, this.currentY);
      this.doc.text(`-$${((subtotal * discount / 100) / 100).toFixed(2)}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      this.currentY += 6;
    }

    if (tax > 0) {
      this.doc.text(`Tax (${tax}%):`, startX, this.currentY);
      this.doc.text(`$${((subtotal * tax / 100) / 100).toFixed(2)}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
      this.currentY += 6;
    }

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('Total:', startX, this.currentY);
    this.doc.text(`$${(total / 100).toFixed(2)}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    
    this.currentY += 15;
  }

  private addNotes(notes?: string, terms?: string) {
    if (notes) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Notes:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      const splitNotes = this.doc.splitTextToSize(notes, this.pageWidth - (2 * this.margin));
      this.doc.text(splitNotes, this.margin, this.currentY);
      this.currentY += splitNotes.length * 5 + 10;
    }

    if (terms) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Terms & Conditions:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      const splitTerms = this.doc.splitTextToSize(terms, this.pageWidth - (2 * this.margin));
      this.doc.text(splitTerms, this.margin, this.currentY);
      this.currentY += splitTerms.length * 5;
    }
  }

  private addFooter(company: CompanySettings) {
    const footerY = this.pageHeight - 20;
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(128, 128, 128);
    
    const footerText = company.document_footer_text || 'Thank you for your business!';
    this.doc.text(footerText, this.pageWidth / 2, footerY, { align: 'center' });
  }

  async generateQuotePDF(quoteId: string, lineItems: LineItem[]): Promise<Blob> {
    // Validate line items
    if (!lineItems || lineItems.length === 0) {
      throw new Error('Cannot generate PDF: No items in quote');
    }

    const company = await this.loadCompanySettings();
    
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        accounts (
          account_name,
          contacts (
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('id', quoteId)
      .single();

    if (error) throw error;

    const quoteData = quote as unknown as QuoteData;

    await this.addHeader(company, 'QUOTE', quoteData.quote_number);
    this.addCompanyInfo(company);
    
    const contact = quoteData.accounts.contacts?.[0];
    this.addCustomerInfo(quoteData.accounts.account_name, contact);

    // Add dates
    this.doc.setFontSize(9);
    this.doc.text(`Date: ${new Date(quoteData.created_at).toLocaleDateString()}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    if (quoteData.valid_until) {
      this.currentY += 5;
      this.doc.text(`Valid Until: ${new Date(quoteData.valid_until).toLocaleDateString()}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    }
    this.currentY += 10;

    this.addLineItemsTable(lineItems, company);
    
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    this.addTotals(
      subtotal,
      quoteData.discount_rate || 0,
      quoteData.tax_rate || 0,
      quoteData.total_amount
    );

    this.addNotes(quoteData.notes, quoteData.terms || company.document_terms);
    this.addFooter(company);

    return this.doc.output('blob');
  }

  async generateInvoicePDF(invoiceId: string, lineItems: LineItem[]): Promise<Blob> {
    // Validate line items
    if (!lineItems || lineItems.length === 0) {
      throw new Error('Cannot generate PDF: No items in invoice');
    }

    const company = await this.loadCompanySettings();
    
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        accounts (
          account_name,
          contacts (
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    const invoiceData = invoice as unknown as InvoiceData;

    await this.addHeader(company, 'INVOICE', invoiceData.invoice_number);
    this.addCompanyInfo(company);
    
    const contact = invoiceData.accounts.contacts?.[0];
    this.addCustomerInfo(invoiceData.accounts.account_name, contact);

    // Add dates and status
    this.doc.setFontSize(9);
    this.doc.text(`Invoice Date: ${new Date(invoiceData.created_at).toLocaleDateString()}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 5;
    this.doc.text(`Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 5;

    // Payment status
    if (invoiceData.status === 'paid') {
      this.doc.setFontSize(24);
      this.doc.setTextColor(34, 197, 94);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('PAID', this.pageWidth / 2, this.currentY + 10, { 
        align: 'center',
      });
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'normal');
      this.currentY += 20;
    } else {
      this.currentY += 10;
    }

    this.addLineItemsTable(lineItems, company);
    
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    this.addTotals(
      subtotal,
      invoiceData.discount_rate || 0,
      invoiceData.tax_rate || 0,
      invoiceData.total_amount
    );

    // Payment instructions
    if (company.document_payment_instructions) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Payment Instructions:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      const splitInstructions = this.doc.splitTextToSize(
        company.document_payment_instructions,
        this.pageWidth - (2 * this.margin)
      );
      this.doc.text(splitInstructions, this.margin, this.currentY);
      this.currentY += splitInstructions.length * 5 + 10;
    }

    this.addNotes(invoiceData.notes, invoiceData.terms || company.document_terms);
    this.addFooter(company);

    return this.doc.output('blob');
  }

  async generateProjectReportPDF(projectId: string): Promise<Blob> {
    const company = await this.loadCompanySettings();
    
    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        accounts (
          account_name,
          contacts (first_name, last_name, email, phone)
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('related_to_type', 'project')
      .eq('related_to_id', projectId)
      .order('created_at', { ascending: false });

    // Fetch notes
    const { data: notes } = await supabase
      .from('notes')
      .select('*, user_profiles(full_name)')
      .eq('related_to_type', 'project')
      .eq('related_to_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch phases
    const { data: phases } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('phase_order');

    await this.addHeader(company, 'PROJECT REPORT', project.project_name);
    this.addCompanyInfo(company);

    // Project info
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Project Information', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Status: ${project.status}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Start Date: ${project.start_date || 'Not set'}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Est. Completion: ${project.estimated_completion || 'Not set'}`, this.margin, this.currentY);
    this.currentY += 10;

    // Customer info
    const contact = project.accounts?.contacts?.[0];
    this.addCustomerInfo(project.accounts?.account_name, contact);

    // Tasks
    if (tasks && tasks.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Tasks', this.margin, this.currentY);
      this.currentY += 7;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      tasks.forEach((task) => {
        if (this.currentY > this.pageHeight - 40) {
          this.doc.addPage();
          this.currentY = 20;
        }
        const checkbox = task.status === 'completed' ? '☑' : '☐';
        this.doc.text(`${checkbox} ${task.title} (${task.status})`, this.margin + 2, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 5;
    }

    // Phases
    if (phases && phases.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Project Phases', this.margin, this.currentY);
      this.currentY += 7;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      phases.forEach((phase) => {
        if (this.currentY > this.pageHeight - 40) {
          this.doc.addPage();
          this.currentY = 20;
        }
        this.doc.text(`${phase.phase_name} - ${phase.status}`, this.margin + 2, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 5;
    }

    // Notes
    if (notes && notes.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Recent Notes', this.margin, this.currentY);
      this.currentY += 7;

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      notes.forEach((note: any) => {
        if (this.currentY > this.pageHeight - 40) {
          this.doc.addPage();
          this.currentY = 20;
        }
        const noteText = this.doc.splitTextToSize(note.content, this.pageWidth - (2 * this.margin) - 10);
        this.doc.text(noteText, this.margin + 2, this.currentY);
        this.currentY += noteText.length * 5 + 3;
      });
    }

    this.addFooter(company);
    return this.doc.output('blob');
  }
}

export async function uploadDocumentToStorage(
  blob: Blob,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
