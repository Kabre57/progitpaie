import { execSync } from "child_process";

console.log("🚀 Génération du client Prisma et application des migrations...");
try {
  // Génération du client Prisma (pnpm exec, pas npx — conforme AGENTS.md)
  execSync("pnpm exec prisma generate --schema=prisma/schema", { stdio: "inherit" });

  // Application des migrations versionnées (migrate deploy, jamais db push)
  // Échec immédiat si une migration échoue (pas de || true)
  execSync("pnpm exec prisma migrate deploy --schema=prisma/schema", { stdio: "inherit" });

  console.log("✅ Client Prisma généré et migrations appliquées avec succès !");
} catch (error) {
  console.error("❌ Échec de la migration Prisma :", error);
  process.exit(1);
}
