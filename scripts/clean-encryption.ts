import { prisma } from "../lib/db";
import { decryptData, encryptData } from "../lib/crypto";

async function main() {
  console.log("🔄 Nettoyage et ré-alignement des champs chiffrés en base de données...");

  const users = await prisma.user.findMany();
  let updatedCount = 0;

  for (const u of users) {
    let needsUpdate = false;
    const updatePayload: any = {};

    if (u.bankAccount) {
      const clean = decryptData(u.bankAccount);
      const reEncrypted = encryptData(clean);
      if (reEncrypted !== u.bankAccount) {
        updatePayload.bankAccount = reEncrypted;
        needsUpdate = true;
      }
    }

    if (u.idCardNumber) {
      const clean = decryptData(u.idCardNumber);
      const reEncrypted = encryptData(clean);
      if (reEncrypted !== u.idCardNumber) {
        updatePayload.idCardNumber = reEncrypted;
        needsUpdate = true;
      }
    }

    if (u.cnpsNumber) {
      const clean = decryptData(u.cnpsNumber);
      const reEncrypted = encryptData(clean);
      if (reEncrypted !== u.cnpsNumber) {
        updatePayload.cnpsNumber = reEncrypted;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await prisma.user.update({
        where: { id: u.id },
        data: updatePayload,
      });
      console.log(`✅ Salarié mis à jour : ${u.name} (${u.email})`);
      updatedCount++;
    }
  }

  console.log(`✨ Terminé ! ${updatedCount} salariés ont eu leurs clés chiffrées ré-alignées.`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur de nettoyage:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
