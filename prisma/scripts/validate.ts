import { execSync } from "child_process";

console.log("🔍 Validating Prisma Schema Architecture...");
try {
  execSync("npx prisma validate --schema=prisma/schema", { stdio: "inherit" });
  console.log("✅ Schema validation successful!");
} catch (error) {
  console.error("❌ Schema validation failed:", error);
  process.exit(1);
}
