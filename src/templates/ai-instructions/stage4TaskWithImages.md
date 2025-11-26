# STAGE 4: CSS STYLING

🤖 AUTOMATION MODE: Output COMPLETE production-ready HTML with embedded CSS.

OUTPUT FORMAT: Full HTML Document with <style> in <head>
NO markdown code fences. NO explanatory text. RAW HTML ONLY.

TASK:

1. Create responsive, mobile-first CSS for the provided HTML
2. Use CSS variables from :root for ALL colors and design tokens
3. Style all images with proper sizing, object-fit, border-radius
4. Embed CSS in <style> tag within <head>
5. Output the complete, final HTML file

═══════════════════════════════════════════════════════════════════════════════
CSS REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

REQUIRED CSS VARIABLES (reference, not redefine):
var(--color-primary) var(--color-secondary) var(--color-accent)
var(--radius-button) var(--radius-card)

ACCORDION CSS (required):
.accordion-content {
max-height: 0;
overflow: hidden;
transition: max-height 0.3s ease;
}
.accordion-content.active {
max-height: 2000px;
}
.accordion-header svg {
transition: transform 0.3s ease;
}

BUTTON CSS (required):
.btn {
display: inline-flex;
align-items: center;
gap: 0.5rem;
font-size: 1rem;
padding: 0.75rem 1.5rem;
border-radius: var(--radius-button);
transition: all 0.3s ease;
text-decoration: none;
cursor: pointer;
}
.btn-primary {
background: var(--color-primary);
color: white;
}
.btn:hover {
transform: translateY(-2px);
box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

IMAGE CSS (required):
img {
max-width: 100%;
height: auto;
object-fit: cover;
border-radius: var(--radius-card);
}

RESPONSIVE BREAKPOINTS:
@media (min-width: 768px) { /_ tablet _/ }
@media (min-width: 1024px) { /_ desktop _/ }
@media (min-width: 1280px) { /_ large _/ }

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

[ ] CSS embedded in <style> within <head>
[ ] All colors use var(--color-\*) (NO hex codes)
[ ] Responsive media queries included
[ ] Button hover/focus states defined
[ ] Accordion CSS included (if accordions used)
[ ] Image styling complete (responsive, object-fit)
[ ] Complete document from <!DOCTYPE html> to </html>
[ ] NO markdown code fences in output
[ ] Ends with proper </html> tag
