import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { securityAudit } from '@/lib/securityAudit';

interface LoginAttemptResult {
  isLocked: boolean;
  lockoutUntil: Date | null;
  remainingAttempts: number;
  maxAttempts: number;
}

export function useLoginAttempts() {
  const [settings, setSettings] = useState({
    maxAttempts: 5,
    lockoutDurationMinutes: 30,
  });

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const { data } = await supabase
        .from('security_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['max_login_attempts', 'lockout_duration_minutes']);

      if (data) {
        const maxAttempts = data.find(s => s.setting_key === 'max_login_attempts');
        const lockoutDuration = data.find(s => s.setting_key === 'lockout_duration_minutes');

        setSettings({
          maxAttempts: (maxAttempts?.setting_value as any)?.value || 5,
          lockoutDurationMinutes: (lockoutDuration?.setting_value as any)?.value || 30,
        });
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  };

  const checkLockout = async (email: string): Promise<LoginAttemptResult> => {
    try {
      // Get recent failed attempts (within lockout duration)
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - settings.lockoutDurationMinutes);

      const { data: attempts } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      const failedAttempts = attempts?.length || 0;
      const isLocked = failedAttempts >= settings.maxAttempts;
      
      let lockoutUntil = null;
      if (isLocked && attempts && attempts[0]) {
        lockoutUntil = new Date(attempts[0].created_at);
        lockoutUntil.setMinutes(lockoutUntil.getMinutes() + settings.lockoutDurationMinutes);
      }

      return {
        isLocked,
        lockoutUntil,
        remainingAttempts: Math.max(0, settings.maxAttempts - failedAttempts),
        maxAttempts: settings.maxAttempts,
      };
    } catch (error) {
      console.error('Failed to check lockout:', error);
      return {
        isLocked: false,
        lockoutUntil: null,
        remainingAttempts: settings.maxAttempts,
        maxAttempts: settings.maxAttempts,
      };
    }
  };

  const recordLoginAttempt = async (
    email: string,
    success: boolean,
    userId?: string
  ): Promise<void> => {
    try {
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      const userAgent = navigator.userAgent;

      // Calculate lockout time if this is a failed attempt
      let lockoutUntil = null;
      if (!success) {
        const lockoutStatus = await checkLockout(email);
        if (lockoutStatus.remainingAttempts <= 1) {
          // This is the last attempt before lockout
          lockoutUntil = new Date();
          lockoutUntil.setMinutes(lockoutUntil.getMinutes() + settings.lockoutDurationMinutes);

          // Log account locked event
          if (userId) {
            await securityAudit.accountLocked(userId, email);
          }
        }
      }

      await supabase.from('login_attempts').insert({
        email,
        success,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        lockout_until: lockoutUntil?.toISOString() || null,
      });

      // Log security events
      if (success && userId) {
        await securityAudit.loginSuccess(userId);
      } else if (!success) {
        await securityAudit.loginFailure(email, 'Invalid credentials');
      }
    } catch (error) {
      console.error('Failed to record login attempt:', error);
    }
  };

  return {
    checkLockout,
    recordLoginAttempt,
    settings,
  };
}
