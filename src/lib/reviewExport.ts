import { supabase } from '@/integrations/supabase/client';

export async function exportReviewsToCSV() {
  try {
    // Fetch all reviews with related data
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        accounts(account_name),
        services(name)
      `)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    if (!reviews || reviews.length === 0) {
      throw new Error('No reviews to export');
    }

    const headers = [
      'Date Submitted',
      'Customer Name',
      'Account Name',
      'Rating',
      'Status',
      'Service Name',
      'Review Title',
      'Review Text',
      'Admin Response',
      'Featured',
      'Display on Website',
      'Flagged',
      'Flag Reason'
    ];

    // Prepare CSV rows
    const rows = reviews.map(review => [
      new Date(review.submitted_at).toLocaleDateString(),
      review.customer_name,
      review.accounts?.account_name || '',
      review.rating.toString(),
      review.status,
      review.services?.name || '',
      `"${(review.review_title || '').replace(/"/g, '""')}"`,
      `"${(review.review_text || '').replace(/"/g, '""')}"`,
      `"${(review.response_text || '').replace(/"/g, '""')}"`,
      review.featured ? 'Yes' : 'No',
      review.display_on_website ? 'Yes' : 'No',
      review.is_flagged ? 'Yes' : 'No',
      `"${(review.flag_reason || '').replace(/"/g, '""')}"`
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    const fileName = `reviews-export-${reviews.length}-reviews-${today}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, count: reviews.length };
  } catch (error) {
    console.error('Error exporting reviews:', error);
    return { success: false, error };
  }
}
