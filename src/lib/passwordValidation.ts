import { z } from 'zod';

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string;
  isValid: boolean;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export function validatePasswordStrength(
  password: string,
  requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
): PasswordStrength {
  const checks = {
    length: password.length >= requirements.minLength,
    uppercase: requirements.requireUppercase ? /[A-Z]/.test(password) : true,
    lowercase: requirements.requireLowercase ? /[a-z]/.test(password) : true,
    number: requirements.requireNumber ? /[0-9]/.test(password) : true,
    special: requirements.requireSpecial ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) : true,
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.values(checks).length;
  
  // Calculate score based on passed checks
  const score = Math.floor((passedChecks / totalChecks) * 4);
  
  let feedback = '';
  const isValid = passedChecks === totalChecks;

  if (score === 0) {
    feedback = 'Very weak password';
  } else if (score === 1) {
    feedback = 'Weak password';
  } else if (score === 2) {
    feedback = 'Fair password';
  } else if (score === 3) {
    feedback = 'Good password';
  } else {
    feedback = 'Strong password';
  }

  // Add specific feedback for failed checks
  const failedChecks = [];
  if (!checks.length) failedChecks.push(`at least ${requirements.minLength} characters`);
  if (!checks.uppercase && requirements.requireUppercase) failedChecks.push('an uppercase letter');
  if (!checks.lowercase && requirements.requireLowercase) failedChecks.push('a lowercase letter');
  if (!checks.number && requirements.requireNumber) failedChecks.push('a number');
  if (!checks.special && requirements.requireSpecial) failedChecks.push('a special character');

  if (failedChecks.length > 0) {
    feedback += ` - Missing: ${failedChecks.join(', ')}`;
  }

  return {
    score,
    feedback,
    isValid,
    checks,
  };
}

export function createPasswordSchema(requirements: PasswordRequirements = DEFAULT_REQUIREMENTS) {
  let schema = z.string().min(requirements.minLength, {
    message: `Password must be at least ${requirements.minLength} characters`,
  });

  if (requirements.requireUppercase) {
    schema = schema.regex(/[A-Z]/, {
      message: 'Password must contain at least one uppercase letter',
    });
  }

  if (requirements.requireLowercase) {
    schema = schema.regex(/[a-z]/, {
      message: 'Password must contain at least one lowercase letter',
    });
  }

  if (requirements.requireNumber) {
    schema = schema.regex(/[0-9]/, {
      message: 'Password must contain at least one number',
    });
  }

  if (requirements.requireSpecial) {
    schema = schema.regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
      message: 'Password must contain at least one special character',
    });
  }

  return schema;
}
