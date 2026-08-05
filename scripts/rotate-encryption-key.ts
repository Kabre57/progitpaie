import { prisma } from "../lib/db";
import { decryptData, encryptData, isEncryptedWithPrimaryKey } from "../lib/crypto";

const SENSITIVE_FIELDS = ["bankAccount", "idCardNumber", "cnpsNumber"] as const;
type SensitiveField = (typeof SENSITIVE_FIELDS)[number];
type UpdateData = Partial<Record<SensitiveField, string>>;

function rotateField(value: string): string | undefined {
  if (isEncryptedWithPrimaryKey(value)) return undefined;

  const decrypted = decryptData(value);
  if (value.includes(":") && decrypted === value) {
    throw new Error("Unable to decrypt an encrypted field with the configured keys");
  }

  const reEncrypted = encryptData(decrypted);
  if (!isEncryptedWithPrimaryKey(reEncrypted)) {
    throw new Error("Encryption did not produce a value under the primary key");
  }

  return reEncrypted;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`Starting ENCRYPTION_KEY rotation${isDryRun ? " (dry run)" : ""}.`);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      bankAccount: true,
      idCardNumber: true,
      cnpsNumber: true,
    },
  });

  const pendingUpdates: Array<{ id: string; data: UpdateData }> = [];

  for (const u of users) {
    const updates: UpdateData = {};

    for (const field of SENSITIVE_FIELDS) {
      const value = u[field];
      if (!value) continue;

      const rotatedValue = rotateField(value);
      if (rotatedValue) updates[field] = rotatedValue;
    }

    if (Object.keys(updates).length > 0) {
      pendingUpdates.push({ id: u.id, data: updates });
    }
  }

  const fieldCount = pendingUpdates.reduce((count, update) => count + Object.keys(update.data).length, 0);
  console.log(`Found ${users.length} users; ${pendingUpdates.length} records and ${fieldCount} fields require rotation.`);

  if (!isDryRun && pendingUpdates.length > 0) {
    await prisma.$transaction(
      pendingUpdates.map(({ id, data }) => prisma.user.update({ where: { id }, data }))
    );
  }

  console.log(isDryRun ? "Dry run completed; no database changes were made." : "Rotation completed.");
}

main()
  .catch((error: unknown) => {
    console.error("Key rotation failed; no changes were committed.", error instanceof Error ? error.name : "UnknownError");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
