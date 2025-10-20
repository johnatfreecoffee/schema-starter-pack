export interface TemplateValidation {
  templateId: string;
  templateName: string;
  isValid: boolean;
  totalVariables: number;
  errors: {
    type: 'syntax' | 'undefined' | 'unclosed' | 'naming';
    line: number;
    column: number;
    message: string;
    variable?: string;
  }[];
  warnings: string[];
}

const VALID_VARIABLES = [
  'company_name',
  'business_name',
  'phone',
  'email',
  'address',
  'city',
  'state',
  'zip',
  'service_name',
  'service_description',
  'service_area_name',
  'service_area_city',
  'logo_url',
  'business_hours',
  'years_experience',
  'license_numbers',
  'recent_reviews',
  'testimonials',
  'service_reviews',
  'average_rating',
  'review_count',
  'facebook_url',
  'twitter_url',
  'instagram_url',
  'linkedin_url'
];

export const validateTemplate = (
  templateId: string,
  templateName: string,
  content: string
): TemplateValidation => {
  const errors: TemplateValidation['errors'] = [];
  const warnings: string[] = [];
  const variables = new Set<string>();

  // Split into lines for line number tracking
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;

    // Find all Handlebars variables
    const variableMatches = line.matchAll(/\{\{([^}]+)\}\}/g);
    
    for (const match of variableMatches) {
      const fullMatch = match[0];
      const variable = match[1].trim();
      const column = match.index || 0;

      // Add to variables set
      variables.add(variable.split(' ')[0]); // Get base variable name (before any helpers)

      // Check for syntax errors
      if (!fullMatch.startsWith('{{') || !fullMatch.endsWith('}}')) {
        errors.push({
          type: 'syntax',
          line: lineNum,
          column,
          message: 'Malformed Handlebars syntax',
          variable: fullMatch
        });
      }

      // Check for undefined variables
      const baseVar = variable.split(' ')[0];
      if (!VALID_VARIABLES.includes(baseVar) && !baseVar.startsWith('#') && !baseVar.startsWith('/')) {
        errors.push({
          type: 'undefined',
          line: lineNum,
          column,
          message: `Undefined variable: ${baseVar}`,
          variable: baseVar
        });
      }

      // Check naming conventions (should be snake_case)
      if (baseVar && /[A-Z]/.test(baseVar) && !baseVar.startsWith('#') && !baseVar.startsWith('/')) {
        warnings.push(`Variable "${baseVar}" at line ${lineNum} uses camelCase instead of snake_case`);
      }
    }

    // Check for unclosed HTML tags
    const openTags = line.match(/<(\w+)[^>]*>/g) || [];
    const closeTags = line.match(/<\/(\w+)>/g) || [];
    
    openTags.forEach(tag => {
      const tagName = tag.match(/<(\w+)/)?.[1];
      if (tagName && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)) {
        const closeTag = `</${tagName}>`;
        if (!line.includes(closeTag) && !closeTags.some(t => t.includes(tagName))) {
          warnings.push(`Potentially unclosed <${tagName}> tag at line ${lineNum}`);
        }
      }
    });

    // Check for triple braces (unescaped HTML)
    if (line.includes('{{{')) {
      warnings.push(`Unescaped HTML at line ${lineNum} - use {{{}}} carefully`);
    }
  });

  return {
    templateId,
    templateName,
    isValid: errors.length === 0,
    totalVariables: variables.size,
    errors,
    warnings
  };
};

export const validateAllTemplates = async (templates: any[]): Promise<TemplateValidation[]> => {
  return templates.map(template => 
    validateTemplate(template.id, template.name, template.content)
  );
};

export const getValidationSummary = (validations: TemplateValidation[]) => {
  const totalTemplates = validations.length;
  const validTemplates = validations.filter(v => v.isValid).length;
  const totalErrors = validations.reduce((sum, v) => sum + v.errors.length, 0);
  const totalWarnings = validations.reduce((sum, v) => sum + v.warnings.length, 0);

  return {
    totalTemplates,
    validTemplates,
    invalidTemplates: totalTemplates - validTemplates,
    totalErrors,
    totalWarnings,
    healthScore: totalTemplates > 0 ? Math.round((validTemplates / totalTemplates) * 100) : 0
  };
};
