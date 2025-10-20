export interface SEOScore {
  pageId: string;
  pageTitle: string;
  url: string;
  score: number;
  checks: {
    metaTitle: { pass: boolean; score: number; message: string };
    metaDescription: { pass: boolean; score: number; message: string };
    h1Tag: { pass: boolean; score: number; message: string };
    headingStructure: { pass: boolean; score: number; message: string };
    imageAltText: { pass: boolean; score: number; message: string };
    urlStructure: { pass: boolean; score: number; message: string };
    internalLinks: { pass: boolean; score: number; message: string };
    wordCount: { pass: boolean; score: number; message: string };
    schemaMarkup: { pass: boolean; score: number; message: string };
  };
  recommendations: string[];
}

export const auditPageSEO = (html: string, pageData: any): SEOScore => {
  const checks = {
    metaTitle: checkMetaTitle(html, pageData.page_title),
    metaDescription: checkMetaDescription(html, pageData.meta_description),
    h1Tag: checkH1Tag(html),
    headingStructure: checkHeadingStructure(html),
    imageAltText: checkImageAltText(html),
    urlStructure: checkUrlStructure(pageData.url_path),
    internalLinks: checkInternalLinks(html),
    wordCount: checkWordCount(html),
    schemaMarkup: checkSchemaMarkup(html)
  };

  const totalScore = Object.values(checks).reduce((sum, check) => sum + check.score, 0);
  const score = Math.round(totalScore / 9); // Average of 9 checks

  const recommendations = Object.entries(checks)
    .filter(([_, check]) => !check.pass)
    .map(([_, check]) => check.message);

  return {
    pageId: pageData.id,
    pageTitle: pageData.page_title,
    url: pageData.url_path,
    score,
    checks,
    recommendations
  };
};

const checkMetaTitle = (html: string, title: string) => {
  if (!title) {
    return { pass: false, score: 0, message: 'Missing meta title' };
  }
  if (title.length < 30) {
    return { pass: false, score: 5, message: 'Meta title too short (min 30 chars)' };
  }
  if (title.length > 60) {
    return { pass: false, score: 8, message: 'Meta title too long (max 60 chars)' };
  }
  return { pass: true, score: 10, message: 'Meta title is optimal' };
};

const checkMetaDescription = (html: string, description: string) => {
  if (!description) {
    return { pass: false, score: 0, message: 'Missing meta description' };
  }
  if (description.length < 120) {
    return { pass: false, score: 5, message: 'Meta description too short (min 120 chars)' };
  }
  if (description.length > 160) {
    return { pass: false, score: 8, message: 'Meta description too long (max 160 chars)' };
  }
  return { pass: true, score: 10, message: 'Meta description is optimal' };
};

const checkH1Tag = (html: string) => {
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi);
  if (!h1Matches || h1Matches.length === 0) {
    return { pass: false, score: 0, message: 'Missing H1 tag' };
  }
  if (h1Matches.length > 1) {
    return { pass: false, score: 7, message: 'Multiple H1 tags found (should have only one)' };
  }
  return { pass: true, score: 10, message: 'H1 tag is properly used' };
};

const checkHeadingStructure = (html: string) => {
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  
  if (h2Count === 0) {
    return { pass: false, score: 5, message: 'No H2 tags found (should have at least 2)' };
  }
  if (h2Count < 2) {
    return { pass: false, score: 7, message: 'Only one H2 tag (recommended: 2-5)' };
  }
  return { pass: true, score: 10, message: 'Heading structure is good' };
};

const checkImageAltText = (html: string) => {
  const images = html.match(/<img[^>]*>/gi) || [];
  if (images.length === 0) {
    return { pass: true, score: 10, message: 'No images to check' };
  }
  
  const imagesWithoutAlt = images.filter(img => !img.includes('alt='));
  if (imagesWithoutAlt.length > 0) {
    return { 
      pass: false, 
      score: 5, 
      message: `${imagesWithoutAlt.length} images missing alt text` 
    };
  }
  return { pass: true, score: 10, message: 'All images have alt text' };
};

const checkUrlStructure = (url: string) => {
  if (!url) {
    return { pass: false, score: 0, message: 'Invalid URL structure' };
  }
  // Check for special characters, spaces, uppercase
  if (/[A-Z\s]/.test(url)) {
    return { pass: false, score: 7, message: 'URL contains uppercase or spaces' };
  }
  if (url.length > 75) {
    return { pass: false, score: 8, message: 'URL too long (max 75 chars recommended)' };
  }
  return { pass: true, score: 10, message: 'URL structure is clean' };
};

const checkInternalLinks = (html: string) => {
  const internalLinks = (html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [])
    .filter(link => !link.includes('http://') && !link.includes('https://'));
  
  if (internalLinks.length < 3) {
    return { 
      pass: false, 
      score: 6, 
      message: `Only ${internalLinks.length} internal links (min 3 recommended)` 
    };
  }
  return { pass: true, score: 10, message: `${internalLinks.length} internal links found` };
};

const checkWordCount = (html: string) => {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(' ').length;
  
  if (wordCount < 300) {
    return { pass: false, score: 5, message: `Only ${wordCount} words (min 300 recommended)` };
  }
  if (wordCount < 500) {
    return { pass: false, score: 8, message: `${wordCount} words (500+ recommended for better SEO)` };
  }
  return { pass: true, score: 10, message: `${wordCount} words - good content length` };
};

const checkSchemaMarkup = (html: string) => {
  const hasSchema = html.includes('application/ld+json') || html.includes('schema.org');
  if (!hasSchema) {
    return { pass: false, score: 0, message: 'No structured data/schema markup found' };
  }
  return { pass: true, score: 10, message: 'Schema markup present' };
};

export const getScoreCategory = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-600' };
  if (score >= 50) return { label: 'Needs Work', color: 'text-yellow-600' };
  return { label: 'Poor', color: 'text-red-600' };
};
