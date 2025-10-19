import { useEffect } from 'react';

interface LocalBusinessSchemaProps {
  businessName: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  url?: string;
  logo?: string;
  serviceArea?: string[];
  priceRange?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  services?: string[];
}

export const LocalBusinessSchema = ({
  businessName,
  description,
  address,
  city,
  state,
  zip,
  phone,
  email,
  url,
  logo,
  serviceArea,
  priceRange = '$$',
  aggregateRating,
  services,
}: LocalBusinessSchemaProps) => {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: businessName,
      ...(description && { description }),
      ...(url && { url }),
      ...(logo && { logo }),
      ...(priceRange && { priceRange }),
      ...(address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressLocality: city,
          addressRegion: state,
          postalCode: zip,
          addressCountry: 'US',
        },
      }),
      ...(phone && { telephone: phone }),
      ...(email && { email }),
      ...(serviceArea && serviceArea.length > 0 && {
        areaServed: serviceArea.map((area) => ({
          '@type': 'City',
          name: area,
        })),
      }),
      ...(aggregateRating && aggregateRating.reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: aggregateRating.ratingValue.toFixed(1),
          reviewCount: aggregateRating.reviewCount,
          bestRating: '5',
          worstRating: '1',
        },
      }),
      ...(services && services.length > 0 && {
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: services.map((service, index) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service,
            },
            position: index + 1,
          })),
        },
      }),
    };

    const scriptId = 'local-business-schema';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement;

    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    scriptElement.textContent = JSON.stringify(schema);

    return () => {
      const element = document.getElementById(scriptId);
      if (element) {
        element.remove();
      }
    };
  }, [
    businessName,
    description,
    address,
    city,
    state,
    zip,
    phone,
    email,
    url,
    logo,
    serviceArea,
    priceRange,
    aggregateRating,
    services,
  ]);

  return null;
};
