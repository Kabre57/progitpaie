import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

async function testConnections() {
  console.log("Testing PostgreSQL (Prisma) & Redis connections...\n");

  // Test Prisma PostgreSQL
  try {
    console.log("1. Testing PostgreSQL via Prisma...");
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log(`✅ PostgreSQL connection successful! (Total users in DB: ${userCount})`);
  } catch (err: any) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    console.log("   Check your DATABASE_URL in .env");
  } finally {
    await prisma.$disconnect();
  }

  // Test Redis
  try {
    console.log("\n2. Testing Redis connection...");
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
    await redis.set("test_ping", "pong");
    const result = await redis.get("test_ping");
    await redis.del("test_ping");
    console.log(`✅ Redis connection successful! (Ping result: ${result})`);
    await redis.quit();
  } catch (err: any) {
    console.error("❌ Redis connection failed:", err.message);
    console.log("   Check your REDIS_URL in .env");
  }
}

testConnections();
