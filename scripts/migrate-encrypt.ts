import { prisma } from "../lib/db";
import { encryptData, decryptData } from "../lib/crypto";

/**
 * Migration Script: Encrypt Existing Sensitive HR Fields in Database
 * (bankAccount, idCardNumber, cnpsNumber)
 *
 * Usage: npx tsx scripts/migrate-encrypt.ts [--dry-run]
 */

async function runMigration() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`🔒 Starting Sensitive Data Encryption Migration... ${isDryRun ? "(DRY RUN MODE)" : ""}`);

  const users = await prisma.user.findMany();
  console.log(`📋 Found ${users.length} users in database.`);

  let updatedCount = 0;

  for (const user of users) {
    let needsUpdate = false;
    const updates: { bankAccount?: string; idCardNumber?: string; cnpsNumber?: string } = {};

    // 1. Bank Account
    if (user.bankAccount && !user.bankAccount.includes(":")) {
      updates.bankAccount = encryptData(user.bankAccount);
      needsUpdate = true;
    }

    // 2. ID Card Number
    if (user.idCardNumber && !user.idCardNumber.includes(":")) {
      updates.idCardNumber = encryptData(user.idCardNumber);
      needsUpdate = true;
    }

    // 3. CNPS Number
    if (user.cnpsNumber && !user.cnpsNumber.includes(":")) {
      updates.cnpsNumber = encryptData(user.cnpsNumber);
      needsUpdate = true;
    }

    if (needsUpdate) {
      updatedCount++;
      console.log(`  -> Encrypting fields for User ${user.email} (ID: ${user.id})`);
      if (!isDryRun) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    }
  }

  console.log(`\n✅ Migration finished! Total records updated: ${updatedCount}/${users.length}.`);
}

runMigration()
  .catch((e) => {
    console.error("❌ Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
