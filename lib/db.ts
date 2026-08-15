import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * URL non sensible utilisée exclusivement pendant l’évaluation des routes par
 * `next build`. Aucune connexion n’est ouverte durant cette phase. En exécution,
 * DATABASE_URL reste obligatoire et doit être fournie par l’environnement Docker.
 */
const BUILD_TIME_DATABASE_URL =
  "postgresql://progitpaie_build:progitpaie_build@127.0.0.1:5432/progitpaie_build?schema=public";

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NEXT_PHASE === "phase-production-build"
    ? BUILD_TIME_DATABASE_URL
    : undefined);

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL est obligatoire hors phase de compilation Next.js. Configurez-la dans l’environnement d’exécution."
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Helper to maintain compatibility during migration
export async function connectDB() {
  return prisma;
}

export default connectDB;
