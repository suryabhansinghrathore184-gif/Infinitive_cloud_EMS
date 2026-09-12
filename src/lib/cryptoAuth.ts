import crypto from 'crypto';

/**
 * Hash a password using PBKDF2 with SHA-256 and a random 16-byte salt
 */
export function hashPassword(password: string): { hash: string; salt: string; formatted: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  const formatted = `pbkdf2$sha256$10000$${salt}$${hash}`;
  return { hash, salt, formatted };
}

/**
 * Verify a password against a stored formatted hash, salt, or plain text legacy fallback
 */
export function verifyPassword(password: string, storedHash: string, salt?: string): boolean {
  if (!password || !storedHash) return false;

  // Case 1: Formatted hash pbkdf2$sha256$iterations$salt$hash
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length === 5) {
      const iterations = parseInt(parts[2], 10) || 10000;
      const extractedSalt = parts[3];
      const expectedHash = parts[4];
      const computedHash = crypto.pbkdf2Sync(password, extractedSalt, iterations, 64, 'sha256').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(expectedHash, 'hex'));
    }
  }

  // Case 2: Separate hash and salt provided
  if (salt) {
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch {
      return computedHash === storedHash;
    }
  }

  // Case 3: Plain text matching for legacy initial seed data (auto-upgraded upon login)
  return password === storedHash;
}

/**
 * Generate a cryptographically secure random hexadecimal token
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateNumericOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % digits.length];
  }
  return otp;
}

/**
 * Create a SHA-256 hash of a token for indexing/lookup without storing raw tokens
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
