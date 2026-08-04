import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16;

/**
 * Encrypt a plain text string using AES-256-GCM.
 * @param {string} value - The plain text to encrypt.
 * @param {string} keyHex - The 32-byte hex key (64 hex characters).
 * @returns {string} The encrypted representation (iv:tag:ciphertext) or original value if empty.
 */
export function encryptField(value, keyHex) {
  if (!value) return value;
  
  const key = keyHex || process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("[ENCRYPTION] Warning: No encryption key provided. Returning value unencrypted.");
    return value;
  }

  const encryptionKey = Buffer.from(key, "hex");
  if (encryptionKey.length !== 32) {
    throw new Error("Encryption key must be a 32-byte hex string (64 characters).");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string using AES-256-GCM.
 * @param {string} encryptedValue - The encrypted string (iv:tag:ciphertext).
 * @param {string} keyHex - The 32-byte hex key (64 hex characters).
 * @returns {string} The decrypted plain text.
 */
export function decryptField(encryptedValue, keyHex) {
  if (!encryptedValue) return encryptedValue;
  
  // If the value doesn't match our format, return it directly
  const parts = encryptedValue.split(":");
  if (parts.length !== 3) {
    return encryptedValue;
  }

  const key = keyHex || process.env.ENCRYPTION_KEY;
  if (!key) {
    return encryptedValue;
  }

  try {
    const encryptionKey = Buffer.from(key, "hex");
    if (encryptionKey.length !== 32) {
      throw new Error("Encryption key must be a 32-byte hex string (64 characters).");
    }

    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const ciphertext = Buffer.from(parts[2], "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[DECRYPTION ERROR] Failed to decrypt field:", error.message);
    return encryptedValue; // Fallback to raw value on decryption failure
  }
}
