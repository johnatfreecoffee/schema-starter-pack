import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  metaRobots?: string;
  keywords?: string;
}

export const SEOHead = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
  metaRobots = 'index,follow',
  keywords,
}: SEOHeadProps) => {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper function to set or update meta tag
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      if (!content) return;

      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }

      element.content = content;
    };

    // Set canonical link
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'canonical';
        document.head.appendChild(linkElement);
      }
      linkElement.href = canonical;
    }

    // Basic meta tags
    setMetaTag('description', description);
    setMetaTag('robots', metaRobots);
    if (keywords) setMetaTag('keywords', keywords);

    // Open Graph tags
    setMetaTag('og:title', ogTitle || title, true);
    setMetaTag('og:description', ogDescription || description, true);
    setMetaTag('og:type', 'website', true);
    if (ogUrl) setMetaTag('og:url', ogUrl, true);
    if (ogImage) setMetaTag('og:image', ogImage, true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', twitterTitle || ogTitle || title);
    setMetaTag('twitter:description', twitterDescription || ogDescription || description);
    if (twitterImage || ogImage) setMetaTag('twitter:image', twitterImage || ogImage || '');
  }, [
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    twitterTitle,
    twitterDescription,
    twitterImage,
    metaRobots,
    keywords,
  ]);

  return null;
};
