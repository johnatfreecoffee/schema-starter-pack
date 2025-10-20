/**
 * Encryption utilities for sensitive data using Web Crypto API
 * Uses AES-GCM encryption with a key derived from the environment
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Derives an encryption key from a passphrase and salt
 */
async function deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt), // Use provided salt
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gets the encryption key (derived from Supabase URL and per-user salt)
 */
async function getEncryptionKey(userSalt: string): Promise<CryptoKey> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'default-key';
  return deriveKey(supabaseUrl, userSalt);
}

/**
 * Generates a random salt for encryption
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Encrypts a string value
 * @param plaintext The string to encrypt
 * @param userSalt The per-user salt for key derivation
 * @returns Base64-encoded encrypted data with IV prepended
 */
export async function encryptSecret(plaintext: string, userSalt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await getEncryptionKey(userSalt);
  
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts an encrypted string value
 * @param ciphertext Base64-encoded encrypted data with IV prepended
 * @param userSalt The per-user salt for key derivation
 * @returns Decrypted plaintext string
 */
export async function decryptSecret(ciphertext: string, userSalt: string): Promise<string> {
  const decoder = new TextDecoder();
  const key = await getEncryptionKey(userSalt);

  // Decode from base64
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}
