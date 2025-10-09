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
  document_footer_text?: string;
  document_terms?: string;
  document_payment_instructions?: string;
  show_tagline_on_documents?: boolean;
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

  private addHeader(company: CompanySettings, documentType: string, documentNumber: string) {
    const headerColor = company.document_header_color || '#3b82f6';
    
    // Convert hex to RGB
    const r = parseInt(headerColor.slice(1, 3), 16);
    const g = parseInt(headerColor.slice(3, 5), 16);
    const b = parseInt(headerColor.slice(5, 7), 16);
    
    this.doc.setFillColor(r, g, b);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    // Company name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(company.business_name, this.margin, 20);

    if (company.show_tagline_on_documents && company.business_slogan) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(company.business_slogan, this.margin, 28);
    }

    // Document type and number
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
      company.address,
      company.phone,
      company.email
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
    this.doc.text(accountName, this.margin, this.currentY);
    
    if (contact) {
      this.currentY += 5;
      this.doc.text(`${contact.first_name} ${contact.last_name}`, this.margin, this.currentY);
      this.currentY += 5;
      this.doc.text(contact.email, this.margin, this.currentY);
      if (contact.phone) {
        this.currentY += 5;
        this.doc.text(contact.phone, this.margin, this.currentY);
      }
    }

    this.currentY += 15;
  }

  private addLineItemsTable(items: LineItem[]) {
    // Table header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 10, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Description', this.margin + 2, this.currentY + 7);
    this.doc.text('Qty', this.pageWidth - 80, this.currentY + 7);
    this.doc.text('Rate', this.pageWidth - 60, this.currentY + 7);
    this.doc.text('Amount', this.pageWidth - this.margin - 2, this.currentY + 7, { align: 'right' });

    this.currentY += 12;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);

    items.forEach((item) => {
      if (this.currentY > this.pageHeight - 60) {
        this.doc.addPage();
        this.currentY = 20;
      }

      this.doc.text(item.description, this.margin + 2, this.currentY);
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

    this.addHeader(company, 'QUOTE', quoteData.quote_number);
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

    this.addLineItemsTable(lineItems);
    
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

    this.addHeader(company, 'INVOICE', invoiceData.invoice_number);
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

    this.addLineItemsTable(lineItems);
    
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
