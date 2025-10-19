import { supabase } from '@/integrations/supabase/client';

interface TemplateContext {
  serviceId?: string;
  serviceName?: string;
  limit?: number;
}

export async function renderRecentReviews(limit: number = 5): Promise<string> {
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      services(name)
    `)
    .eq('status', 'approved')
    .eq('display_on_website', true)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (!reviews || reviews.length === 0) {
    return '<p class="text-muted-foreground">No reviews yet.</p>';
  }

  return `
    <div class="space-y-4">
      ${reviews.map(review => `
        <div class="border rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            ${'⭐'.repeat(review.rating)}
            <span class="text-sm text-muted-foreground">${review.customer_name}</span>
          </div>
          <h4 class="font-semibold mb-2">${review.review_title}</h4>
          <p class="text-muted-foreground">${review.review_text}</p>
          ${review.services?.name ? `<span class="text-sm text-primary mt-2 inline-block">${review.services.name}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export async function renderServiceReviews(serviceId: string, limit: number = 10): Promise<string> {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('service_id', serviceId)
    .eq('status', 'approved')
    .eq('display_on_website', true)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (!reviews || reviews.length === 0) {
    return '<p class="text-muted-foreground">No reviews for this service yet.</p>';
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="text-4xl font-bold">${avgRating.toFixed(1)}</div>
        <div>
          <div>${'⭐'.repeat(Math.round(avgRating))}</div>
          <div class="text-sm text-muted-foreground">${reviews.length} reviews</div>
        </div>
      </div>
      <div class="space-y-4">
        ${reviews.map(review => `
          <div class="border rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              ${'⭐'.repeat(review.rating)}
              <span class="text-sm text-muted-foreground">${review.customer_name}</span>
            </div>
            <h4 class="font-semibold mb-2">${review.review_title}</h4>
            <p class="text-muted-foreground">${review.review_text}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export async function renderTestimonials(limit: number = 3): Promise<string> {
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      services(name)
    `)
    .eq('status', 'approved')
    .eq('featured', true)
    .eq('display_on_website', true)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (!reviews || reviews.length === 0) {
    return '';
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-${Math.min(reviews.length, 3)} gap-6">
      ${reviews.map(review => `
        <div class="bg-card border rounded-lg p-6">
          <div class="mb-4">${'⭐'.repeat(review.rating)}</div>
          <p class="text-lg font-medium mb-4">"${review.review_title}"</p>
          <p class="text-muted-foreground mb-4">${review.review_text}</p>
          <div class="text-sm">
            <div class="font-semibold">${review.customer_name}</div>
            ${review.services?.name ? `<div class="text-muted-foreground">${review.services.name}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export async function getAverageRating(): Promise<string> {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('status', 'approved')
    .eq('display_on_website', true);

  if (!reviews || reviews.length === 0) {
    return '0.0';
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return avg.toFixed(1);
}

export async function getReviewCount(): Promise<string> {
  const { count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    .eq('display_on_website', true);

  return (count || 0).toString();
}

// Main template processor
export async function processReviewTemplateVariables(
  html: string,
  context: TemplateContext = {}
): Promise<string> {
  let processed = html;

  // {{recent_reviews limit=5}}
  const recentReviewsRegex = /\{\{recent_reviews(?:\s+limit=(\d+))?\}\}/g;
  const recentMatches = [...html.matchAll(recentReviewsRegex)];
  for (const match of recentMatches) {
    const limit = match[1] ? parseInt(match[1]) : 5;
    const content = await renderRecentReviews(limit);
    processed = processed.replace(match[0], content);
  }

  // {{service_reviews}}
  if (context.serviceId) {
    const serviceReviewsRegex = /\{\{service_reviews(?:\s+limit=(\d+))?\}\}/g;
    const serviceMatches = [...html.matchAll(serviceReviewsRegex)];
    for (const match of serviceMatches) {
      const limit = match[1] ? parseInt(match[1]) : 10;
      const content = await renderServiceReviews(context.serviceId, limit);
      processed = processed.replace(match[0], content);
    }
  }

  // {{testimonials limit=3}}
  const testimonialsRegex = /\{\{testimonials(?:\s+limit=(\d+))?\}\}/g;
  const testimonialMatches = [...html.matchAll(testimonialsRegex)];
  for (const match of testimonialMatches) {
    const limit = match[1] ? parseInt(match[1]) : 3;
    const content = await renderTestimonials(limit);
    processed = processed.replace(match[0], content);
  }

  // {{average_rating}}
  if (processed.includes('{{average_rating}}')) {
    const avgRating = await getAverageRating();
    processed = processed.replace(/\{\{average_rating\}\}/g, avgRating);
  }

  // {{review_count}}
  if (processed.includes('{{review_count}}')) {
    const count = await getReviewCount();
    processed = processed.replace(/\{\{review_count\}\}/g, count);
  }

  return processed;
}
