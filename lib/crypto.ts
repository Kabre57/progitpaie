import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
let secretKey: Buffer | undefined;

function getSecretKey(): Buffer {
  if (secretKey) return secretKey;

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (process.env.NODE_ENV === "production" && !encryptionKey) {
    throw new Error("ENCRYPTION_KEY must be set at runtime in production");
  }

  // This fallback is solely for local development. Production reaches the
  // guard above before any encryption/decryption is attempted.
  secretKey = crypto.scryptSync(
    encryptionKey || "development-only-key-not-for-production",
    "progitpaie_encryption_salt",
    32
  );
  return secretKey;
}

/**
 * Decrypts an AES-256-GCM encrypted string. Handles multiple encryption layers.
 */
export function decryptData(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  let current = encryptedData;
  let attempts = 0;
  while (current && current.includes(":") && attempts < 5) {
    const parts = current.split(":");
    if (parts.length !== 3) break;
    try {
      const [ivHex, authTagHex, encryptedText] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      current = decrypted;
      attempts++;
    } catch {
      break;
    }
  }
  return current;
}

/**
 * Encrypts a sensitive string using AES-256-GCM. Unwraps any existing encryption first.
 */
export function encryptData(text: string): string {
  if (!text) return text;
  const plainText = decryptData(text);
  if (!plainText || plainText.trim() === "") return plainText;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return plainText;
  }
}
