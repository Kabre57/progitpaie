import { execSync } from "child_process";

console.log("🚀 Generating Prisma Client & Deploying Schema...");
try {
  execSync("npx prisma generate --schema=prisma/schema", { stdio: "inherit" });
  execSync("npx prisma db push --schema=prisma/schema", { stdio: "inherit" });
  console.log("✅ Prisma deployment complete!");
} catch (error) {
  console.error("❌ Prisma deployment failed:", error);
  process.exit(1);
}
