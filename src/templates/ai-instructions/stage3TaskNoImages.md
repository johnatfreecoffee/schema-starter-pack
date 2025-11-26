# STAGE 3: HTML STRUCTURE

🤖 AUTOMATION MODE: Build COMPLETE HTML from <!DOCTYPE html> to </html>.

## CANONICAL VARIABLES (use these EXACTLY)

| Variable             | Purpose             |
| -------------------- | ------------------- |
| {{business_name}}    | Company name        |
| {{phone}}            | Phone number        |
| {{email}}            | Email address       |
| {{address}}          | Full address        |
| {{years_experience}} | Years in business   |
| {{description}}      | Company description |

## CRITICAL REQUIREMENTS

### NO IMAGES

- Zero <img> tags anywhere
- Use inline SVG icons for visual interest
- Focus on typography and spacing

### INLINE SVG ICONS ONLY

❌ FORBIDDEN: data-lucide, Font Awesome, Material Icons, any CDN
✅ REQUIRED pattern:
\`\`\`html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="...complete path data..."/>
</svg>
\`\`\`

### BUTTON STRUCTURE (mandatory)

\`\`\`html
<a href="tel:{{phone}}" class="btn btn-primary inline-flex items-center gap-2 text-base">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
</svg>
Call {{phone}}
</a>
\`\`\`

- ALL buttons: inline-flex, items-center, gap-2, text-base
- Phone numbers MUST be buttons with phone icon
- NO emojis in button text

### FORM HANDLING

- NEVER build custom <form> elements
- ALL form CTAs use: onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"
  \`\`\`html
  <button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Free Quote')" class="btn btn-primary inline-flex items-center gap-2 text-base">
  <svg><!-- clipboard/document icon --></svg>
  Get Free Quote
  </button>
  \`\`\`

### PAGE STRUCTURE

- Start with hero <section> (NO top banners/alerts)
- NO <header> or <footer> (system injects separately)
- Semantic HTML5: <main>, <section>, <article>
- One <h1> only, proper heading hierarchy

## ANTI-HALLUCINATION CHECK

Before outputting, scan for and REPLACE:

- ❌ Any 10-digit phone → {{phone}}
- ❌ Any @email.com → {{email}}
- ❌ Any street address → {{address}}
- ❌ Any company name → {{business_name}}
- ❌ Any hex colors → var(--color-\*)

OUTPUT: Complete HTML document, properly indented, from <!DOCTYPE html> to </html>.
