🧪 # STAGE 3: HTML STRUCTURE

🤖 AUTOMATION MODE: Build COMPLETE HTML from <!DOCTYPE html> to </html>.

OUTPUT FORMAT: Full HTML Document starting with <!DOCTYPE html>
NO markdown code fences. NO explanatory text. RAW HTML ONLY.

═══════════════════════════════════════════════════════════════════════════════
CANONICAL VARIABLES - USE EXACTLY AS SHOWN
═══════════════════════════════════════════════════════════════════════════════

Company Data:
{{business_name}} {{phone}} {{email}}
{{address}} {{address_city}} {{address_state}}
{{business_slogan}} {{years_experience}} {{description}}
{{logo_url}} {{website_url}}

Service Pages Only:
{{service_name}} {{service_slug}} {{service_description}}

Location Pages Only:
{{city_name}} {{city_slug}} {{state}}
{{zip_code}} {{display_name}}

═══════════════════════════════════════════════════════════════════════════════
CSS CUSTOM PROPERTIES - DEFINE IN :root
═══════════════════════════════════════════════════════════════════════════════

:root {
--color-primary: {{siteSettings.primary_color}};
--color-secondary: {{siteSettings.secondary_color}};
--color-accent: {{siteSettings.accent_color}};
--radius-button: {{siteSettings.button_border_radius}};
--radius-card: {{siteSettings.card_border_radius}};
}

═══════════════════════════════════════════════════════════════════════════════
REQUIRED PATTERNS
═══════════════════════════════════════════════════════════════════════════════

BUTTON PATTERN (all buttons must follow):
<a href="tel:{{phone}}" class="btn btn-primary inline-flex items-center gap-2 text-base">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
</svg>
Call {{phone}}
</a>

FORM CTA PATTERN (no custom forms - modal only):
<button onclick="if(window.openLeadFormModal) window.openLeadFormModal('Get Free Quote')" class="btn btn-primary inline-flex items-center gap-2 text-base">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
</svg>
Get Free Quote
</button>

IMAGE PLACEHOLDER PATTERN:
<img src="placeholder-hero.jpg" alt="Professional roofer inspecting shingles on residential home under clear blue sky" style="width: 100%; height: auto; object-fit: cover; border-radius: var(--radius-card);">

File extensions:

- .jpg = photos (people, buildings, scenes)
- .png = graphics, icons, illustrations
- .svg = logos only

═══════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════════════════════════

✓ Page starts with hero section (NO top bars, NO emergency banners)
✓ NO <header> or <footer> tags (system injects these)
✓ NO custom <form> elements (use window.openLeadFormModal() only)
✓ ALL icons must be inline SVG (NO data-lucide, NO Font Awesome, NO CDNs)
✓ ALL buttons use: inline-flex items-center gap-2 text-base
✓ Phone links: href="tel:{{phone}}" with NO onclick
✓ Form CTAs: onclick="if(window.openLeadFormModal) window.openLeadFormModal('Button Text')"
✓ ALL colors use CSS variables (NO hex codes, NO Tailwind colors)

═══════════════════════════════════════════════════════════════════════════════
ANTI-HALLUCINATION SELF-CHECK
═══════════════════════════════════════════════════════════════════════════════

Before output, search for and REPLACE any:
❌ 10-digit phone patterns → {{phone}}
❌ @email.com addresses → {{email}}
❌ Street addresses with numbers → {{address}}
❌ Hex color codes (#fff, #000) → var(--color-_)
❌ Tailwind colors (bg-blue-500) → var(--color-_)
❌ Hardcoded company names → {{business_name}}
❌ "XX years" claims → {{years_experience}} years

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

[ ] Starts with <!DOCTYPE html> (no markdown)
[ ] Page begins with hero <section> (no top bars)
[ ] NO <header> or <footer> tags
[ ] All business data uses Handlebars variables
[ ] All colors use CSS custom properties
[ ] All icons are inline SVG (complete path data)
[ ] Phone buttons have tel: href, NO onclick
[ ] Form CTAs use window.openLeadFormModal()
[ ] All images have descriptive alt text (50-100 chars)
[ ] Proper heading hierarchy (one H1, then H2s, H3s)
[ ] Complete document from <!DOCTYPE html> to </html>
