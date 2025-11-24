#!/usr/bin/env node

/**
 * Generate static sitemap.xml for SEO
 * This ensures search engines can access the sitemap without JavaScript execution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://clearhome.pro';
const OUTPUT_DIR = path.join(__dirname, '../public');
const CSV_FILE = path.join(__dirname, '../public/service-urls.csv');

// Read and parse the CSV file
function parseCSV() {
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Skip header and fix the typo (cleahome -> clearhome)
  const urls = lines
    .slice(1)
    .map(url => url.trim().replace('cleahome.pro', 'clearhome.pro'))
    .filter(url => url.startsWith('http'));

  return urls;
}

// Generate sitemap XML
function generateSitemap() {
  const urls = parseCSV();
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add homepage
  xml += `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

  // Add main pages
  const mainPages = [
    { path: '/services', priority: 0.9, changefreq: 'weekly' },
    { path: '/about-us', priority: 0.8, changefreq: 'monthly' },
    { path: '/contact', priority: 0.8, changefreq: 'monthly' },
    { path: '/reviews', priority: 0.7, changefreq: 'weekly' }
  ];

  mainPages.forEach(page => {
    xml += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
  });

  // Add all service pages
  urls.forEach(url => {
    // Determine priority based on URL depth
    // Service overview pages (/services/slug): higher priority
    // Service+location pages (/services/slug/city): slightly lower priority
    const pathParts = new URL(url).pathname.split('/').filter(p => p);
    const isOverview = pathParts.length === 2; // /services/slug
    const priority = isOverview ? 0.8 : 0.75;

    xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
  });

  xml += '</urlset>';

  return xml;
}

// Generate robots.txt
function generateRobotsTxt() {
  const robotsTxt = `# Robots.txt for ClearHome.pro
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml

# Disallow admin areas
Disallow: /dashboard/
Disallow: /admin/
Disallow: /customer/login
Disallow: /auth

# Crawl-delay for polite crawling
Crawl-delay: 1
`;

  return robotsTxt;
}

// Main execution
try {
  console.log('🔨 Generating static SEO files...\n');

  // Generate sitemap.xml
  console.log('📄 Generating sitemap.xml...');
  const sitemap = generateSitemap();
  const sitemapPath = path.join(OUTPUT_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`✅ Sitemap generated: ${sitemapPath}`);
  console.log(`   Total URLs: ${sitemap.match(/<loc>/g).length}\n`);

  // Generate robots.txt
  console.log('🤖 Generating robots.txt...');
  const robotsTxt = generateRobotsTxt();
  const robotsPath = path.join(OUTPUT_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt);
  console.log(`✅ Robots.txt generated: ${robotsPath}\n`);

  console.log('✨ SEO files generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Deploy these static files');
  console.log('2. Verify https://clearhome.pro/sitemap.xml works without JavaScript');
  console.log('3. Submit sitemap to Google Search Console');

} catch (error) {
  console.error('❌ Error generating SEO files:', error);
  process.exit(1);
}
