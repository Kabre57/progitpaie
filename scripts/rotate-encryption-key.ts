import { prisma } from "../lib/db";
import { decryptData, encryptData } from "../lib/crypto";

/**
 * Migration Script: Transactional ENCRYPTION_KEY Rotation
 * Decrypts sensitive fields using multi-key fallback and re-encrypts under the current primary key.
 *
 * Usage:
 *   npx tsx scripts/rotate-encryption-key.ts [--dry-run]
 */

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`🔒 Starting ENCRYPTION_KEY Rotation Migration... ${isDryRun ? "(DRY RUN MODE)" : ""}\n`);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      bankAccount: true,
      idCardNumber: true,
      cnpsNumber: true,
    },
  });

  console.log(`📋 Found ${users.length} users in database.`);
  let updatedCount = 0;

  for (const u of users) {
    const updates: Record<string, string> = {};

    if (u.bankAccount) {
      const decrypted = decryptData(u.bankAccount);
      const reEncrypted = encryptData(decrypted);
      if (reEncrypted !== u.bankAccount) {
        updates.bankAccount = reEncrypted;
      }
    }

    if (u.idCardNumber) {
      const decrypted = decryptData(u.idCardNumber);
      const reEncrypted = encryptData(decrypted);
      if (reEncrypted !== u.idCardNumber) {
        updates.idCardNumber = reEncrypted;
      }
    }

    if (u.cnpsNumber) {
      const decrypted = decryptData(u.cnpsNumber);
      const reEncrypted = encryptData(decrypted);
      if (reEncrypted !== u.cnpsNumber) {
        updates.cnpsNumber = reEncrypted;
      }
    }

    if (Object.keys(updates).length > 0) {
      updatedCount++;
      console.log(`  -> Re-encrypting ${Object.keys(updates).join(", ")} for ${u.name} (${u.email})`);
      if (!isDryRun) {
        await prisma.user.update({
          where: { id: u.id },
          data: updates,
        });
      }
    }
  }

  console.log(`\n✨ Rotation finished! ${updatedCount}/${users.length} records re-encrypted under primary ENCRYPTION_KEY.`);
}

main()
  .catch((e) => {
    console.error("❌ Key rotation migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
