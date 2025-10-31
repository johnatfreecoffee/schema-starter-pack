// Helper functions for stage configuration

export function getStageDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    planning: 'Create strategic structure and outline',
    content: 'Generate all copy and text',
    html: 'Build semantic HTML with content',
    styling: 'Add advanced CSS and visual effects'
  };
  return descriptions[stage] || 'Unknown stage';
}

export function getStageValidation(stage: string) {
  const validations: Record<string, any> = {
    planning: {
      enabled: true,
      model: 'google/gemini-2.5-flash',
      maxRetries: 3,
      checks: ['All required JSON fields present', 'At least 3-5 sections defined', 'No placeholder text', 'Valid JSON structure']
    },
    content: {
      enabled: true,
      model: 'google/gemini-2.5-flash',
      maxRetries: 3,
      checks: ['Hero section complete', 'All planned sections present', 'No placeholder text', 'Proper Handlebars usage']
    },
    html: {
      enabled: true,
      model: 'google/gemini-2.5-flash',
      maxRetries: 3,
      checks: ['Starts with <main> tag', 'All content sections present', 'Handlebars variables used', 'CTA modals integrated']
    },
    styling: {
      enabled: true,
      model: 'google/gemini-2.5-flash',
      maxRetries: 2,
      checks: ['<main> tags intact', 'Advanced Tailwind classes', 'Hover states present', 'All sections preserved']
    }
  };
  return validations[stage] || validations.planning;
}
