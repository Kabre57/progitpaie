import { defineConfig, env } from "prisma/config";

// The application uses a multi-file Prisma schema in prisma/schema. Without an
// explicit migrations path, Prisma resolves migrations relative to that folder
// (prisma/schema/migrations), while this project stores them in prisma/migrations.
export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "npx -y tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
