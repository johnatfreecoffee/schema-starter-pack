import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Track recent errors to prevent spam
const recentErrors = new Map<string, number>();
const ERROR_COOLDOWN = 5000; // 5 seconds

export const handleDatabaseError = (error: PostgrestError | null, context?: string) => {
  if (!error) return;

  const errorKey = `${error.code}-${error.message}`;
  const lastShown = recentErrors.get(errorKey);
  
  // Don't show same error within cooldown period
  if (lastShown && Date.now() - lastShown < ERROR_COOLDOWN) {
    return;
  }

  // Special handling for common errors
  if (error.message?.includes('infinite recursion')) {
    console.error('RLS recursion error - this should not happen with new architecture');
    return; // Silently fail, don't show to user
  }

  if (error.code === 'PGRST301') {
    // RLS violation - check context
    if (context === 'role_check') {
      // Expected when checking roles, ignore
      return;
    }
  }

  // Show error to user
  recentErrors.set(errorKey, Date.now());
  toast.error(context ? `${context}: ${error.message}` : error.message);
};

// Clean up old errors periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentErrors.entries()) {
    if (now - timestamp > ERROR_COOLDOWN * 2) {
      recentErrors.delete(key);
    }
  }
}, 60000); // Every minute
