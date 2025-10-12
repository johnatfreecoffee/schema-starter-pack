import { useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  review_title: string;
  review_text: string;
  customer_name: string;
  submitted_at: string;
}

interface ReviewSchemaMarkupProps {
  reviews?: Review[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  businessName?: string;
  type?: 'organization' | 'service';
  serviceName?: string;
}

export function ReviewSchemaMarkup({
  reviews = [],
  aggregateRating,
  businessName = 'Business',
  type = 'organization',
  serviceName
}: ReviewSchemaMarkupProps) {
  useEffect(() => {
    const schemaData: any = {
      '@context': 'https://schema.org',
      '@type': type === 'service' ? 'Service' : 'LocalBusiness',
      name: serviceName || businessName,
    };

    // Add aggregate rating if provided
    if (aggregateRating && aggregateRating.reviewCount > 0) {
      schemaData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toFixed(1),
        reviewCount: aggregateRating.reviewCount,
        bestRating: '5',
        worstRating: '1'
      };
    }

    // Add individual reviews
    if (reviews.length > 0) {
      schemaData.review = reviews.map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.customer_name
        },
        datePublished: new Date(review.submitted_at).toISOString(),
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating.toString(),
          bestRating: '5',
          worstRating: '1'
        },
        name: review.review_title,
        reviewBody: review.review_text
      }));
    }

    // Create or update script tag
    const scriptId = 'review-schema-markup';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(schemaData);

    // Cleanup
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [reviews, aggregateRating, businessName, type, serviceName]);

  return null; // This component doesn't render anything
}
