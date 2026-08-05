import { encryptData, decryptData, isEncryptedWithPrimaryKey, resetKeyCache } from "../../crypto";

describe("Multi-Key Encryption and Key Rotation Support", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetKeyCache();
  });

  afterAll(() => {
    process.env = originalEnv;
    resetKeyCache();
  });

  it("should encrypt and decrypt using single key", () => {
    process.env.ENCRYPTION_KEY = "key-v1-initial-secret-key-32bytes";
    resetKeyCache();

    const plainText = "CI1234567890";
    const encrypted = encryptData(plainText);
    expect(encrypted).toContain(":");
    expect(decryptData(encrypted)).toBe(plainText);
  });

  it("should decrypt legacy data encrypted with previous key during key rotation", () => {
    // 1. Data encrypted with old key (v1)
    process.env.ENCRYPTION_KEY = "key-v1-initial-secret-key-32bytes";
    delete process.env.ENCRYPTION_KEY_PREVIOUS;
    resetKeyCache();

    const sensitiveData = "FR7630006000011234567890189";
    const encryptedWithV1 = encryptData(sensitiveData);

    // 2. Rotate to new key (v2) and set old key in ENCRYPTION_KEY_PREVIOUS
    process.env.ENCRYPTION_KEY = "key-v2-new-rotated-secret-key-32b";
    process.env.ENCRYPTION_KEY_PREVIOUS = "key-v1-initial-secret-key-32bytes";
    resetKeyCache();

    // 3. Decrypt should successfully decrypt legacy data with v1 key
    const decrypted = decryptData(encryptedWithV1);
    expect(decrypted).toBe(sensitiveData);

    // 4. Re-encrypting should re-encrypt under the new v2 primary key
    const reEncryptedWithV2 = encryptData(encryptedWithV1);
    expect(reEncryptedWithV2).not.toBe(encryptedWithV1);

    // 5. Now remove the old key — new data encrypted under v2 should still decrypt cleanly
    delete process.env.ENCRYPTION_KEY_PREVIOUS;
    resetKeyCache();

    expect(decryptData(reEncryptedWithV2)).toBe(sensitiveData);
  });

  it("detects whether a value is already encrypted with the primary key", () => {
    process.env.ENCRYPTION_KEY = "key-v1-initial-secret-key-32bytes";
    resetKeyCache();
    const encryptedWithV1 = encryptData("CI1234567890");

    process.env.ENCRYPTION_KEY = "key-v2-new-rotated-secret-key-32b";
    process.env.ENCRYPTION_KEY_PREVIOUS = "key-v1-initial-secret-key-32bytes";
    resetKeyCache();

    expect(isEncryptedWithPrimaryKey(encryptedWithV1)).toBe(false);
    const encryptedWithV2 = encryptData(encryptedWithV1);
    expect(isEncryptedWithPrimaryKey(encryptedWithV2)).toBe(true);
  });
});
