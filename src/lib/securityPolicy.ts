import { NextRequest } from 'next/server';
import { Db } from 'mongodb';
import { logAuditEvent } from '@/lib/audit';

export interface SecurityPolicyConfig {
  mfaEnforced: boolean;
  mfaForSuperAdminsOnly: boolean;
  passwordPolicyMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  concurrentSessionsAllowed: boolean;
  ipWhitelistEnabled: boolean;
  allowedIpRanges: string[];
}

export const DEFAULT_SECURITY_CONFIG: SecurityPolicyConfig = {
  mfaEnforced: false,
  mfaForSuperAdminsOnly: true,
  passwordPolicyMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  maxLoginAttempts: 5,
  sessionTimeoutMinutes: 60,
  concurrentSessionsAllowed: true,
  ipWhitelistEnabled: false,
  allowedIpRanges: ['0.0.0.0/0'],
};

export async function getSecurityConfig(db: Db): Promise<SecurityPolicyConfig> {
  try {
    const doc = await db.collection('system_settings').findOne({ _id: 'security_config' as any });
    if (doc?.config) {
      return { ...DEFAULT_SECURITY_CONFIG, ...doc.config };
    }
  } catch (err) {
    console.warn('Could not read security config from DB, using defaults:', err);
  }
  return DEFAULT_SECURITY_CONFIG;
}

export function validatePasswordPolicy(password: string, config: SecurityPolicyConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || password.length < config.passwordPolicyMinLength) {
    errors.push(`Password must be at least ${config.passwordPolicyMinLength} characters long.`);
  }

  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...).');
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one numeric digit (0-9).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function checkAccountLockout(
  db: Db,
  email: string
): Promise<{ isLocked: boolean; lockoutUntil?: Date; remainingMinutes?: number }> {
  try {
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    if (!user) return { isLocked: false };

    if (user.status === 'Suspended') {
      return { isLocked: true, remainingMinutes: 999 };
    }

    if (user.lockoutUntil) {
      const lockoutDate = new Date(user.lockoutUntil);
      if (lockoutDate > new Date()) {
        const remainingMinutes = Math.ceil((lockoutDate.getTime() - Date.now()) / (60 * 1000));
        return { isLocked: true, lockoutUntil: lockoutDate, remainingMinutes };
      }
    }
  } catch (err) {
    console.error('Error checking account lockout:', err);
  }
  return { isLocked: false };
}

export async function recordFailedLogin(req: NextRequest, db: Db, email: string): Promise<{ isLockedNow: boolean; remainingAttempts: number }> {
  const config = await getSecurityConfig(db);
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await db.collection('users').findOne({ email: cleanEmail });
    if (!user) {
      return { isLockedNow: false, remainingAttempts: config.maxLoginAttempts - 1 };
    }

    const currentAttempts = (user.failedLoginAttempts || 0) + 1;
    const isLockedNow = currentAttempts >= config.maxLoginAttempts;
    const lockoutUntil = isLockedNow ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: isLockedNow ? 0 : currentAttempts,
          lockoutUntil: lockoutUntil,
          updatedAt: new Date(),
        },
      }
    );

    if (isLockedNow) {
      await logAuditEvent(req, 'ACCOUNT_LOCKED', {
        details: { email: cleanEmail, attempts: currentAttempts, lockedUntil: lockoutUntil },
      });
    } else {
      await logAuditEvent(req, 'LOGIN_FAILED', {
        details: { email: cleanEmail, attemptCount: currentAttempts },
      });
    }

    return {
      isLockedNow,
      remainingAttempts: Math.max(0, config.maxLoginAttempts - currentAttempts),
    };
  } catch (err) {
    console.error('Error recording failed login:', err);
    return { isLockedNow: false, remainingAttempts: config.maxLoginAttempts - 1 };
  }
}

export async function recordSuccessfulLogin(req: NextRequest, db: Db, user: any): Promise<void> {
  try {
    const now = new Date();
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
          lastLogin: now.toISOString(),
          updatedAt: now,
        },
      }
    );

    await logAuditEvent(req, 'LOGIN_SUCCESS', {
      details: { email: user.email, role: user.role, organizationId: user.organizationId },
    });
  } catch (err) {
    console.error('Error recording successful login:', err);
  }
}
