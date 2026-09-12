import crypto from 'crypto';

/**
 * Server-side AES-256-GCM Encryption Utility for Integrations.
 *
 * Mandatory: INTEGRATION_ENCRYPTION_KEY must be set in server environment variables.
 * If missing, throws an error and refuses to derive fallback keys from predictable values.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const PAYLOAD_PREFIX = 'v1:';

export function isEncryptionConfigured(): boolean {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;
  return Boolean(key && key.trim().length >= 32);
}

function getMasterKey(): Buffer {
  const rawKey = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!rawKey || rawKey.trim().length < 32) {
    throw new Error(
      'INTEGRATION_ENCRYPTION_KEY is missing or invalid in server environment. Minimum 32-character key required.'
    );
  }
  // Use SHA-256 of the provided key string to ensure exactly 32 bytes
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts sensitive string payload using AES-256-GCM.
 * Output format: "v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>"
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PAYLOAD_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts AES-256-GCM encrypted string payload.
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  if (!encryptedPayload.startsWith(PAYLOAD_PREFIX)) {
    // If not encrypted with v1 prefix (e.g. legacy plain value), return empty or handle safely
    return encryptedPayload;
  }

  const key = getMasterKey();
  const parts = encryptedPayload.slice(PAYLOAD_PREFIX.length).split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload structure.');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Masks a secret string for safe browser display (e.g., "••••••••1234").
 * Never exposes raw secret values in API GET responses.
 */
export function maskSecret(secret?: string): string {
  if (!secret) return '';
  const str = secret.trim();
  if (str.length <= 4) {
    return '••••••••';
  }
  const lastFour = str.slice(-4);
  return `••••••••${lastFour}`;
}
