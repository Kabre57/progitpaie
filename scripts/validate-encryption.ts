import { prisma } from "../lib/db";
import { decryptData, encryptData } from "../lib/crypto";

/**
 * Script de validation post-migration
 * Vérifie que toutes les données sensibles en base sont correctement chiffrées
 *
 * Usage:
 *   npx tsx scripts/validate-encryption.ts
 *   npx tsx scripts/validate-encryption.ts --fix
 *   npx tsx scripts/validate-encryption.ts --verbose
 */

interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  errors: Array<{
    id: string;
    field: string;
    error: string;
    value: string;
  }>;
  details: {
    bankAccounts: { total: number; valid: number; invalid: number };
    cnpsNumbers: { total: number; valid: number; invalid: number };
    idCardNumbers: { total: number; valid: number; invalid: number };
  };
}

async function validateEncryption(): Promise<ValidationResult> {
  console.log("🔍 Validation du chiffrement des données sensibles...\n");

  const result: ValidationResult = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: [],
    details: {
      bankAccounts: { total: 0, valid: 0, invalid: 0 },
      cnpsNumbers: { total: 0, valid: 0, invalid: 0 },
      idCardNumbers: { total: 0, valid: 0, invalid: 0 },
    },
  };

  const employees = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      bankAccount: true,
      cnpsNumber: true,
      idCardNumber: true,
    },
  });

  console.log(`📊 ${employees.length} employés trouvés en base de données.\n`);

  for (const employee of employees) {
    const employeeName = `${employee.name} (${employee.email})`;

    // 1. Bank Account
    if (employee.bankAccount) {
      result.details.bankAccounts.total++;
      try {
        if (!employee.bankAccount.includes(":")) {
          throw new Error("Compte bancaire non chiffré (pas de séparateur :)");
        }
        const decrypted = decryptData(employee.bankAccount);
        if (!decrypted) throw new Error("Erreur de déchiffrement");
        result.details.bankAccounts.valid++;
        result.valid++;
      } catch (error: any) {
        result.details.bankAccounts.invalid++;
        result.invalid++;
        result.errors.push({
          id: employee.id,
          field: "bankAccount",
          error: error.message,
          value: employee.bankAccount.substring(0, 20) + "...",
        });
        console.log(`❌ ${employeeName} - Compte bancaire non conforme`);
      }
    }

    // 2. CNPS Number
    if (employee.cnpsNumber) {
      result.details.cnpsNumbers.total++;
      try {
        if (!employee.cnpsNumber.includes(":")) {
          throw new Error("N° CNPS non chiffré");
        }
        const decrypted = decryptData(employee.cnpsNumber);
        if (!decrypted) throw new Error("Erreur de déchiffrement CNPS");
        result.details.cnpsNumbers.valid++;
        result.valid++;
      } catch (error: any) {
        result.details.cnpsNumbers.invalid++;
        result.invalid++;
        result.errors.push({
          id: employee.id,
          field: "cnpsNumber",
          error: error.message,
          value: employee.cnpsNumber.substring(0, 20) + "...",
        });
        console.log(`❌ ${employeeName} - N° CNPS non conforme`);
      }
    }

    // 3. ID Card Number
    if (employee.idCardNumber) {
      result.details.idCardNumbers.total++;
      try {
        if (!employee.idCardNumber.includes(":")) {
          throw new Error("N° CNI non chiffré");
        }
        const decrypted = decryptData(employee.idCardNumber);
        if (!decrypted) throw new Error("Erreur de déchiffrement CNI");
        result.details.idCardNumbers.valid++;
        result.valid++;
      } catch (error: any) {
        result.details.idCardNumbers.invalid++;
        result.invalid++;
        result.errors.push({
          id: employee.id,
          field: "idCardNumber",
          error: error.message,
          value: employee.idCardNumber.substring(0, 20) + "...",
        });
        console.log(`❌ ${employeeName} - N° CNI non conforme`);
      }
    }
  }

  result.total = result.valid + result.invalid;
  return result;
}

async function run() {
  try {
    const args = process.argv.slice(2);
    const isVerbose = args.includes("--verbose");
    const shouldFix = args.includes("--fix");

    console.log("========================================");
    console.log("🔐 VALIDATION DU CHIFFREMENT DES DONNÉES");
    console.log("========================================\n");

    const result = await validateEncryption();

    console.log("\n========================================");
    console.log("📊 RÉSULTATS DE LA VALIDATION");
    console.log("========================================\n");

    console.log(`✅ Données valides       : ${result.valid}`);
    console.log(`❌ Données invalides     : ${result.invalid}`);
    console.log(`📊 Total vérifié         : ${result.total}`);

    console.log("\nDétails par champ :");
    console.log(`  • Comptes bancaires : ${result.details.bankAccounts.valid}/${result.details.bankAccounts.total} valides`);
    console.log(`  • Numéros CNPS      : ${result.details.cnpsNumbers.valid}/${result.details.cnpsNumbers.total} valides`);
    console.log(`  • Numéros CNI       : ${result.details.idCardNumbers.valid}/${result.details.idCardNumbers.total} valides`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️ ${result.errors.length} erreurs détectées :`);

      if (isVerbose) {
        result.errors.forEach((error) => {
          console.log(`  • Employé ${error.id} - ${error.field} : ${error.error}`);
        });
      } else {
        console.log("  (Utilisez --verbose pour voir les détails)");
      }

      if (shouldFix) {
        console.log("\n🔧 Correction automatique des enregistrements non chiffrés...");
        for (const err of result.errors) {
          const emp = await prisma.user.findUnique({ where: { id: err.id } });
          if (emp) {
            const updates: Record<string, string> = {};
            if (err.field === "bankAccount" && emp.bankAccount && !emp.bankAccount.includes(":")) {
              updates.bankAccount = encryptData(emp.bankAccount);
            }
            if (err.field === "cnpsNumber" && emp.cnpsNumber && !emp.cnpsNumber.includes(":")) {
              updates.cnpsNumber = encryptData(emp.cnpsNumber);
            }
            if (err.field === "idCardNumber" && emp.idCardNumber && !emp.idCardNumber.includes(":")) {
              updates.idCardNumber = encryptData(emp.idCardNumber);
            }
            if (Object.keys(updates).length > 0) {
              await prisma.user.update({ where: { id: emp.id }, data: updates });
              console.log(`  -> Chiffrement corrigé pour l'employé ${emp.id}`);
            }
          }
        }
      }
    } else {
      console.log("\n🎉 Toutes les données sont correctement chiffrées !");
      console.log("✅ Migration RGPD validée avec succès.");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la validation :", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
