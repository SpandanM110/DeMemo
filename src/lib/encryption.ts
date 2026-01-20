/**
 * DeMemo Encryption Utilities
 * Uses Web Crypto API for AES-256-GCM encryption
 * Keys are derived from wallet signatures for true ownership
 */

const SALT = 'memorychain-salt-v1';
const ITERATIONS = 100000;

/**
 * Derive an AES-256-GCM encryption key from a wallet signature
 * This ensures only the wallet owner can decrypt their memories
 */
export async function deriveKeyFromSignature(
  signature: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // Use first 64 characters of signature as key material
  const keyMaterial = encoder.encode(signature.slice(0, 64));

  // Import as raw key material for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt data using AES-256-GCM
 * Returns encrypted data and IV needed for decryption
 */
export async function encryptData(
  data: unknown,
  key: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  // Generate random 12-byte IV (recommended for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Convert data to JSON string then to bytes
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(JSON.stringify(data));

  // Encrypt with AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBytes
  );

  return { encrypted, iv };
}

/**
 * Decrypt AES-256-GCM encrypted data
 * Requires the same IV used during encryption
 */
export async function decryptData(
  encrypted: ArrayBuffer,
  iv: Uint8Array,
  key: CryptoKey
): Promise<unknown> {
  // Decrypt with AES-GCM
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv) as Uint8Array<ArrayBuffer>,
    },
    key,
    encrypted
  );

  // Convert bytes back to string then parse JSON
  const decoder = new TextDecoder();
  const dataString = decoder.decode(decrypted);
  return JSON.parse(dataString);
}

/**
 * Convert ArrayBuffer to Base64 string for storage
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string back to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert Uint8Array to Base64 string
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate the signing message for key derivation
 * This message is signed by the wallet to derive the encryption key
 */
export function getSigningMessage(address: string): string {
  return `DeMemo Authentication\n\nSign this message to encrypt your AI memories.\n\nWallet: ${address}\n\nThis signature will be used to derive your personal encryption key. Your memories can only be decrypted by you.`;
}
