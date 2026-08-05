import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SALT = "progitpaie_encryption_salt";

let keyCache: { keysRaw: string; derivedKeys: Buffer[] } | undefined;

/**
 * Derive a 32-byte key buffer from a key string using scrypt.
 */
function deriveKey(rawKey: string): Buffer {
  return crypto.scryptSync(rawKey, SALT, 32);
}

/**
 * Returns all active secret keys derived from environment variables.
 * Key 0 is always the primary key used for new encryptions.
 * Subsequent keys are fallbacks used for decrypting legacy data during key rotation.
 */
export function getSecretKeys(): Buffer[] {
  const primary = process.env.ENCRYPTION_KEY;
  const previous = process.env.ENCRYPTION_KEY_PREVIOUS;
  const keysList = process.env.ENCRYPTION_KEYS;

  const rawKeyString = `${primary || ""}|${previous || ""}|${keysList || ""}`;
  if (keyCache && keyCache.keysRaw === rawKeyString) {
    return keyCache.derivedKeys;
  }

  if (process.env.NODE_ENV === "production" && !primary && !keysList) {
    throw new Error("ENCRYPTION_KEY must be set at runtime in production");
  }

  const rawKeys: string[] = [];

  if (keysList) {
    keysList.split(",").map(k => k.trim()).filter(Boolean).forEach(k => rawKeys.push(k));
  }
  if (primary && !rawKeys.includes(primary)) {
    rawKeys.unshift(primary);
  }
  if (previous && !rawKeys.includes(previous)) {
    rawKeys.push(previous);
  }

  if (rawKeys.length === 0) {
    rawKeys.push("development-only-key-not-for-production");
  }

  const derivedKeys = rawKeys.map(deriveKey);
  keyCache = { keysRaw: rawKeyString, derivedKeys };
  return derivedKeys;
}

/**
 * Clears the derived key cache (useful for tests or runtime key reload).
 */
export function resetKeyCache(): void {
  keyCache = undefined;
}

export function isEncryptedWithPrimaryKey(encryptedData: string): boolean {
  if (!encryptedData || !encryptedData.includes(":")) return false;

  const parts = encryptedData.split(":");
  if (parts.length !== 3) return false;

  try {
    decryptSingleLayerWithKey(parts[0], parts[1], parts[2], getSecretKeys()[0]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decrypts a single layer of AES-256-GCM cipher text using a specific key buffer.
 */
function decryptSingleLayerWithKey(ivHex: string, authTagHex: string, encryptedText: string, key: Buffer): string {
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Supports multi-key fallback: attempts decryption with primary key first,
 * then falls back to previous keys if primary fails.
 * Handles multiple nested encryption layers.
 */
export function decryptData(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  let current = encryptedData;
  let attempts = 0;
  const keys = getSecretKeys();

  while (current && current.includes(":") && attempts < 5) {
    const parts = current.split(":");
    if (parts.length !== 3) break;
    const [ivHex, authTagHex, encryptedText] = parts;
    
    let decrypted = false;
    for (const key of keys) {
      try {
        current = decryptSingleLayerWithKey(ivHex, authTagHex, encryptedText, key);
        decrypted = true;
        break;
      } catch {
        // Try next key in chain
      }
    }

    if (!decrypted) {
      break;
    }
    attempts++;
  }
  return current;
}

/**
 * Encrypts a sensitive string using AES-256-GCM with the primary key.
 * Unwraps any existing encryption first.
 */
export function encryptData(text: string): string {
  if (!text) return text;
  const plainText = decryptData(text);
  if (!plainText || plainText.trim() === "") return plainText;
  try {
    const primaryKey = getSecretKeys()[0];
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, primaryKey, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return plainText;
  }
}
