import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.APICLAW_KEY_ENCRYPTION_SECRET;

// Validate key exists and is correct length
function getKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('APICLAW_KEY_ENCRYPTION_SECRET not set');
  }
  // Key should be 32 bytes for AES-256
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) {
    throw new Error('APICLAW_KEY_ENCRYPTION_SECRET must be 64 hex chars (32 bytes)');
  }
  return key;
}

export function encryptKey(plainKey: string): string {
  const key = getKey();
  // 12-byte IV is the AES-GCM standard. Web Crypto on the Convex runtime
  // enforces this; Node's crypto accepts both 12- and 16-byte IVs for
  // backward decryption compatibility.
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptKey(encryptedKey: string): string {
  const key = getKey();
  const [ivHex, tagHex, dataHex] = encryptedKey.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted key format');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

// SSRF Prevention
export function validateBaseUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use HTTPS' };
    }
    
    const host = parsed.hostname.toLowerCase();
    
    const blockedPatterns = [
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^localhost$/,
      /^0\.0\.0\.0$/,
      /^::1$/,
      /\.local$/,
      /\.internal$/,
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(host)) {
        return { valid: false, error: 'Internal/private URLs not allowed' };
      }
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
