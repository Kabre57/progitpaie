import "dotenv/config";
import { defineConfig } from "prisma/config";

// The application uses a multi-file Prisma schema in prisma/schema. Without an
// explicit migrations path, Prisma resolves migrations relative to that folder
// (prisma/schema/migrations), while this project stores them in prisma/migrations.
export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "pnpm exec tsx prisma/seed.ts",
  },
  datasource: {
      // Prisma Client generation does not connect to the database. The fallback
      // keeps `pnpm prisma:generate` usable before a local .env is configured.
      url: process.env.DATABASE_URL ?? "postgresql://progitpaie:progitpaie_pass_2026@localhost:5433/progitpaie?schema=public",
  },
});
