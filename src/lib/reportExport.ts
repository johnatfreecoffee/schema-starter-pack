import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface CompanyInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
}

export async function exportReportToPDF(
  reportData: any[],
  reportName: string,
  companyInfo?: CompanyInfo
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add company logo if available
  let yPosition = 20;
  if (companyInfo?.logo) {
    try {
      // Add logo (assuming it's a URL or base64)
      doc.addImage(companyInfo.logo, 'PNG', 15, 10, 30, 30);
      yPosition = 45;
    } catch (error) {
      console.error('Failed to add logo:', error);
    }
  }
  
  // Add company name and info
  if (companyInfo?.name) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, companyInfo?.logo ? 50 : 15, yPosition);
    yPosition += 8;
  }
  
  // Add report title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(reportName, 15, yPosition);
  yPosition += 10;
  
  // Add generation timestamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPosition);
  yPosition += 15;
  
  // Reset text color
  doc.setTextColor(0);
  
  if (reportData && reportData.length > 0) {
    // Extract headers and data
    const headers = Object.keys(reportData[0]);
    const rows = reportData.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return String(value || '');
      })
    );
    
    // Add table
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Primary blue
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { top: 10, bottom: 30 },
      didDrawPage: (data) => {
        // Add page numbers
        const pageNumber = doc.getCurrentPageInfo().pageNumber;
        const totalPages = (doc as any).internal.pages.length - 1;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });
  } else {
    doc.text('No data available', 15, yPosition);
  }
  
  // Save the PDF
  const fileName = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function exportReportToExcel(reportData: any[], reportName: string) {
  if (!reportData || reportData.length === 0) {
    throw new Error('No data to export');
  }
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  
  // Auto-size columns
  const columnWidths = Object.keys(reportData[0]).map(key => {
    const maxLength = Math.max(
      key.length,
      ...reportData.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');
  
  // Add metadata sheet
  const metadata = [
    { Property: 'Report Name', Value: reportName },
    { Property: 'Generated', Value: new Date().toLocaleString() },
    { Property: 'Total Records', Value: reportData.length },
  ];
  const metadataSheet = XLSX.utils.json_to_sheet(metadata);
  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
  
  // Generate filename and download
  const fileName = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportReportToCSV(reportData: any[], reportName: string) {
  if (!reportData || reportData.length === 0) {
    throw new Error('No data to export');
  }
  
  const headers = Object.keys(reportData[0]);
  const csv = [
    headers.join(','),
    ...reportData.map(row =>
      headers.map(h => {
        const value = row[h];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
