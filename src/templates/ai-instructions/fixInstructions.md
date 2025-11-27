# FIX MODE INSTRUCTIONS

## 🎯 PRIMARY DIRECTIVE: DESIGN CONSISTENCY

**HIGHEST PRIORITY:** Preserve ALL existing design, layout, CSS, and visual hierarchy. ONLY modify what the user explicitly requests. This is iterative refinement, not a redesign.

## Core Fix Mode Principles

1. **Selective Modification Only**: Change ONLY what the user requests in their prompt
2. **Design Preservation**: Keep all existing CSS styles, colors, spacing, layout structure
3. **Variable Compliance**: Maintain all Handlebars variables and CSS custom properties
4. **Pattern Adherence**: Preserve existing button patterns, phone links, form CTAs, accordions

## Preservation Checklist

Before responding, verify:
- [ ] Existing color scheme unchanged (unless specifically requested)
- [ ] Layout structure preserved (unless specifically requested)
- [ ] Typography hierarchy maintained (unless specifically requested)
- [ ] Spacing and padding consistent with original
- [ ] All working interactive elements still functional
- [ ] All Handlebars variables still present and correct

## Required Variable Syntax

### Company & Contact Variables
- `{{business_name}}` - Company name
- `{{business_slogan}}` - Tagline/slogan
- `{{phone}}` - Phone number (always format with formatPhone helper)
- `{{email}}` - Email address
- `{{address}}` - Full address
- `{{address_street}}`, `{{address_city}}`, `{{address_state}}`, `{{address_zip}}`
- `{{website_url}}` - Website URL
- `{{years_experience}}` - Years in business
- `{{license_numbers}}` - License info

### Service & Area Variables (if applicable)
- `{{service.name}}` - Service name
- `{{service.description}}` - Service description
- `{{service.starting_price}}` - Starting price
- `{{city}}` - Service area city
- `{{state}}` - Service area state

### AI Training & Brand Variables
- `{{mission_statement}}`
- `{{customer_promise}}`
- `{{unique_selling_points}}`
- `{{competitive_advantages}}`
- `{{target_audience}}`
- `{{brand_voice}}`

## CSS Custom Properties (Required)

Always use these CSS variables, never hardcode colors:

```css
/* Primary colors */
--primary-color
--secondary-color
--accent-color

/* Status colors */
--success-color
--warning-color
--info-color
--danger-color

/* Backgrounds */
--background-color
--secondary-background-color
--card-background-color

/* Text */
--text-color
--secondary-text-color
--muted-text-color

/* Borders & UI */
--border-color
--feature-color
--cta-color
```

## Required Patterns (Preserve in Fixes)

### 1. Phone Links Pattern
```html
<a href="tel:{{formatPhone phone}}" class="phone-link">
  {{formatPhone phone}}
</a>
```

### 2. Lead Form CTA Pattern
```html
<button class="cta-button" data-open-form="true">
  Get Free Quote
</button>
```

### 3. Single Accordion Pattern
```html
<div class="accordion-item">
  <div class="accordion-header">
    <h3>Question</h3>
    <svg class="accordion-icon"><!-- chevron --></svg>
  </div>
  <div class="accordion-content">
    <p>Answer</p>
  </div>
</div>
```

### 4. Button Styles Pattern
Use consistent button classes: `.cta-button`, `.secondary-button`, `.outline-button`

## Fix Mode Workflow

1. **Analyze the existing HTML**: Understand current structure, styles, variables
2. **Identify the requested change**: What specifically does the user want modified?
3. **Make surgical edits**: Change ONLY what's requested
4. **Verify preservation**: Run through the checklist - did we keep everything else intact?
5. **Output the complete HTML**: Return the full page with targeted fixes applied

## Output Requirements

- Return complete HTML document (<!DOCTYPE html> through </html>)
- Include ALL original content (don't truncate or summarize)
- Apply fixes surgically without altering unrelated sections
- Maintain all original variables, patterns, and CSS custom properties
- Keep all interactive elements functional

## What NOT To Do in Fix Mode

❌ Don't redesign the page layout
❌ Don't change color schemes unless requested
❌ Don't alter typography unless requested
❌ Don't remove or replace existing sections unless requested
❌ Don't introduce new design patterns inconsistent with the original
❌ Don't hardcode values that should be variables
❌ Don't break existing interactive elements (accordions, buttons, forms)

## Example Fix Scenarios

**User Request**: "Make the hero heading larger"
**Correct Approach**: Increase font-size on the hero h1, preserve all other styles

**User Request**: "Add a new FAQ section"
**Correct Approach**: Append new accordion-item section, using existing accordion pattern and CSS

**User Request**: "Change the CTA button text"
**Correct Approach**: Update button text content only, preserve button classes and data-open-form attribute

---

**REMEMBER**: Fix Mode is about precision and preservation. Make the requested change and nothing more.
