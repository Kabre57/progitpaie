/**
 * ═══════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Script de Vérification d'Environnement 🔍
 * Vérifie que l'environnement local est correctement configuré
 * avant toute commande de build, test ou déploiement.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import "dotenv/config";

const ROOT = resolve(__dirname, "..");

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(label: string, fn: () => string): void {
  try {
    const detail = fn();
    results.push({ label, ok: true, detail });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ label, ok: false, detail: message });
  }
}

// ─── 1. Node.js ───────────────────────────────────────────────────────

check("Node.js ≥ 20", () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split(".")[0], 10);
  if (major < 20) {
    throw new Error(`Node ${version} détecté, 20+ requis`);
  }
  return `Node ${version}`;
});

// ─── 2. pnpm ──────────────────────────────────────────────────────────

check("pnpm installé", () => {
  const version = execSync("pnpm --version", { encoding: "utf-8" }).trim();
  return `pnpm ${version}`;
});

// ─── 3. Fichier .env ─────────────────────────────────────────────────

check("Fichier .env présent", () => {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) {
    throw new Error(".env manquant — copiez .env.example puis renseignez les variables");
  }
  return ".env trouvé";
});

// ─── 4. DATABASE_URL ──────────────────────────────────────────────────

check("DATABASE_URL définie", () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL non définie dans l'environnement ou .env");
  }
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(`DATABASE_URL invalide (doit commencer par postgresql://)`);
  }
  // Masquer le mot de passe pour le log
  const masked = url.replace(/:([^@]+)@/, ":***@");
  return masked;
});

// ─── 5. Client Prisma généré ──────────────────────────────────────────

check("Client Prisma généré", () => {
  // Cherche le répertoire .prisma/client dans node_modules
  const candidates = [
    resolve(ROOT, "node_modules", ".prisma", "client"),
    resolve(ROOT, "node_modules", "@prisma", "client"),
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "Client Prisma non trouvé — exécutez `pnpm prisma:generate`"
    );
  }
  return `Trouvé dans ${found.replace(ROOT, ".")}`;
});

// ─── 6. Schéma Prisma valide ──────────────────────────────────────────

check("Schéma Prisma valide", () => {
  const schemaDir = resolve(ROOT, "prisma", "schema");
  if (!existsSync(schemaDir)) {
    throw new Error("Dossier prisma/schema introuvable");
  }
  // Vérifie les fichiers critiques
  const criticalFiles = [
    "core/base.prisma",
    "core/enums.prisma",
    "modules/company/company.prisma",
    "modules/employee/employee.prisma",
    "modules/payroll/payroll.prisma",
  ];
  for (const file of criticalFiles) {
    if (!existsSync(resolve(schemaDir, file))) {
      throw new Error(`Fichier de schéma manquant : prisma/schema/${file}`);
    }
  }
  return `${criticalFiles.length} fichiers critiques présents`;
});

// ─── 7. Variables de sécurité ─────────────────────────────────────────

check("JWT_SECRET défini", () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET non défini — requis pour l'authentification");
  }
  if (secret.length < 32) {
    throw new Error(`JWT_SECRET trop court (${secret.length} chars, 32+ requis)`);
  }
  return `${secret.length} caractères`;
});

check("ENCRYPTION_KEY défini", () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY non défini — requis pour le chiffrement des données sensibles");
  }
  return `${key.length} caractères`;
});

// ─── 8. Dossier des migrations ────────────────────────────────────────

check("Migrations Prisma présentes", () => {
  const migrationsDir = resolve(ROOT, "prisma", "migrations");
  if (!existsSync(migrationsDir)) {
    throw new Error("Dossier prisma/migrations introuvable");
  }
  const { readdirSync } = require("fs");
  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d: { isDirectory: () => boolean }) => d.isDirectory())
    .length;
  return `${dirs} migrations trouvées`;
});

// ─── Rapport ──────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════════════");
console.log("  PROGITPAIE — Vérification d'Environnement 🔍");
console.log("═══════════════════════════════════════════════════════════\n");

let failures = 0;

for (const r of results) {
  const icon = r.ok ? "✅" : "❌";
  console.log(`  ${icon}  ${r.label}`);
  console.log(`      ${r.detail}\n`);
  if (!r.ok) failures++;
}

console.log("═══════════════════════════════════════════════════════════");
if (failures === 0) {
  console.log("  ✅ Environnement OK — prêt pour build/test/déploiement");
} else {
  console.log(`  ❌ ${failures} problème(s) détecté(s) — corrigez avant de continuer`);
}
console.log("═══════════════════════════════════════════════════════════\n");

process.exit(failures > 0 ? 1 : 0);
