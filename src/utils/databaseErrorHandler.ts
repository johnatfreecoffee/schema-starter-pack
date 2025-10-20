import { PostgrestError } from '@supabase/supabase-js';

/**
 * Sanitizes database errors to prevent information leakage
 * Maps PostgreSQL error codes to user-friendly messages
 */
export const getUserFriendlyError = (error: any): string => {
  // Map PostgreSQL error codes to safe messages
  const errorMap: Record<string, string> = {
    '23505': 'This record already exists',
    '23503': 'Invalid reference to related record',
    '23502': 'Required field is missing',
    '23514': 'Invalid data provided',
    '23P01': 'Cannot complete operation due to data conflict',
    '42P01': 'System configuration error',
    '42703': 'Invalid field specified',
    '42501': 'Permission denied',
    'PGRST116': 'No records found',
    'PGRST301': 'Access denied',
  };
  
  // Handle PostgrestError
  if (error?.code) {
    const code = error.code;
    if (errorMap[code]) {
      return errorMap[code];
    }
  }
  
  // Handle generic error messages
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Check for common error patterns
    if (message.includes('duplicate') || message.includes('unique')) {
      return 'This record already exists';
    }
    if (message.includes('foreign key') || message.includes('violates')) {
      return 'Invalid reference to related record';
    }
    if (message.includes('null value')) {
      return 'Required field is missing';
    }
    if (message.includes('permission') || message.includes('denied')) {
      return 'You do not have permission to perform this action';
    }
    if (message.includes('not found')) {
      return 'The requested record was not found';
    }
  }
  
  // Log full error server-side for debugging (console.error is safe)
  console.error('Database error:', {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint
  });
  
  // Return generic message
  return 'An error occurred. Please try again or contact support.';
};

/**
 * Handles database errors with sanitized user feedback
 */
export const handleDatabaseError = (
  error: PostgrestError | Error | null,
  context?: string
): string => {
  if (!error) return '';
  
  const friendlyMessage = getUserFriendlyError(error);
  return context ? `${context}: ${friendlyMessage}` : friendlyMessage;
};
