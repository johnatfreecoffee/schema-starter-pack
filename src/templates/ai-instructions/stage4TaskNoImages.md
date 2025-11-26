🧪 # STAGE 4: CSS STYLING

🤖 AUTOMATION MODE: Output COMPLETE production-ready HTML with embedded CSS.

## CSS CUSTOM PROPERTIES (use in :root)

```css
:root {
--color-primary: {{siteSettings.primary_color}};
--color-secondary: {{siteSettings.secondary_color}};
--color-accent: {{siteSettings.accent_color}};
--radius-button: {{siteSettings.button_border_radius}};
--radius-card: {{siteSettings.card_border_radius}};
}
```

## REQUIRED STYLES

### Icon Styling (replace image visual weight)

```css
.icon-wrapper {
display: inline-flex;
align-items: center;
justify-content: center;
width: 3rem;
height: 3rem;
background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
border-radius: 50%;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.icon-wrapper svg {
width: 1.5rem;
height: 1.5rem;
stroke: white;
}
```

### Button Styling

```css
.btn {
display: inline-flex;
align-items: center;
gap: 0.5rem;
padding: 0.75rem 1.5rem;
font-size: 1rem;
font-weight: 600;
border-radius: var(--radius-button);
transition: all 0.3s ease;
}
.btn-primary {
background: var(--color-primary);
color: white;
}
.btn-primary:hover {
transform: translateY(-2px);
box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}
```

### Accordion Styling

```css
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
.accordion-header.active svg {
transform: rotate(180deg);
}
```

## TASK

1. Create responsive, mobile-first CSS
2. Use CSS variables for ALL colors (no hex codes)
3. Style icons prominently (backgrounds, shadows, gradients)
4. Embed CSS in <style> within <head>
5. Ensure visual hierarchy without images

## ANTI-HALLUCINATION CHECK

Scan CSS for and REPLACE:

- ❌ #ffffff, #000000, any hex → var(--color-\*)
- ❌ bg-blue-500, text-red-600 → var(--color-\*)

OUTPUT: Complete styled HTML from <!DOCTYPE html> to </html>. No markdown, no explanations.
