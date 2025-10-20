import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'password_reset_complete'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verified'
  | '2fa_failed'
  | 'account_locked'
  | 'account_unlocked'
  | 'session_created'
  | 'session_expired'
  | 'permission_changed'
  | 'role_changed'
  | 'security_setting_changed';

export type SecurityEventCategory =
  | 'authentication'
  | 'authorization'
  | 'configuration'
  | 'data_access';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

interface SecurityAuditLog {
  userId?: string;
  eventType: SecurityEventType;
  eventCategory: SecurityEventCategory;
  severity: SecuritySeverity;
  details?: Record<string, any>;
}

export async function logSecurityEvent({
  userId,
  eventType,
  eventCategory,
  severity,
  details = {},
}: SecurityAuditLog): Promise<void> {
  try {
    // Get client info
    const ipAddress = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => null);

    const userAgent = navigator.userAgent;

    await supabase.from('security_audit_logs').insert({
      user_id: userId || null,
      event_type: eventType,
      event_category: eventCategory,
      severity,
      ip_address: ipAddress,
      user_agent: userAgent,
      details,
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Helper functions for common security events
export const securityAudit = {
  loginSuccess: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: 'login_success',
      eventCategory: 'authentication',
      severity: 'info',
    }),

  loginFailure: (email: string, reason: string) =>
    logSecurityEvent({
      eventType: 'login_failure',
      eventCategory: 'authentication',
      severity: 'warning',
      details: { email, reason },
    }),

  logout: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: 'logout',
      eventCategory: 'authentication',
      severity: 'info',
    }),

  passwordChange: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: 'password_change',
      eventCategory: 'authentication',
      severity: 'info',
    }),

  passwordResetRequest: (email: string) =>
    logSecurityEvent({
      eventType: 'password_reset_request',
      eventCategory: 'authentication',
      severity: 'info',
      details: { email },
    }),

  passwordResetComplete: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: 'password_reset_complete',
      eventCategory: 'authentication',
      severity: 'info',
    }),

  twoFactorEnabled: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: '2fa_enabled',
      eventCategory: 'authentication',
      severity: 'info',
    }),

  twoFactorDisabled: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: '2fa_disabled',
      eventCategory: 'authentication',
      severity: 'warning',
    }),

  twoFactorVerified: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: '2fa_verified',
      eventCategory: 'authentication',
      severity: 'info',
    }),

  twoFactorFailed: (userId: string) =>
    logSecurityEvent({
      userId,
      eventType: '2fa_failed',
      eventCategory: 'authentication',
      severity: 'warning',
    }),

  accountLocked: (userId: string, email: string) =>
    logSecurityEvent({
      userId,
      eventType: 'account_locked',
      eventCategory: 'authentication',
      severity: 'critical',
      details: { email },
    }),

  accountUnlocked: (userId: string, unlockedBy: string) =>
    logSecurityEvent({
      userId,
      eventType: 'account_unlocked',
      eventCategory: 'authentication',
      severity: 'info',
      details: { unlocked_by: unlockedBy },
    }),

  securitySettingChanged: (userId: string, setting: string, oldValue: any, newValue: any) =>
    logSecurityEvent({
      userId,
      eventType: 'security_setting_changed',
      eventCategory: 'configuration',
      severity: 'warning',
      details: { setting, old_value: oldValue, new_value: newValue },
    }),
};
