#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL est requis");
  process.exit(1);
}

const accounts = [
  {
    email: "admin-a-2026-r1@validation.invalid",
    companyId: "progitpaie-default-001",
  },
  {
    email: "admin-b-2026-r1@validation.invalid",
    companyId: "validation-tenant-b-2026-r1",
  },
];

const outputPath = process.env.LOCAL_PROVISIONS_E2E_ENV_FILE
  ?? "/tmp/progitpaie-provisions-e2e.env";
const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3500";
const password = process.env.LOCAL_PROVISIONS_E2E_PASSWORD
  ?? randomBytes(24).toString("base64url");

if (password.length < 16) {
  console.error("LOCAL_PROVISIONS_E2E_PASSWORD doit contenir au moins 16 caractères");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    where: { email: { in: accounts.map(({ email }) => email) } },
    select: { id: true, email: true, companyId: true, role: true, isActive: true },
  });

  for (const account of accounts) {
    const user = users.find(({ email }) => email === account.email);
    if (!user
      || user.companyId !== account.companyId
      || user.role !== "admin"
      || !user.isActive) {
      throw new Error(`Compte de validation invalide ou absent : ${account.email}`);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(accounts.map(({ email }) => prisma.user.update({
    where: { email },
    data: { password: passwordHash },
  })));

  const content = [
    `E2E_BASE_URL=${baseUrl}`,
    `E2E_ADMIN_EMAIL=${accounts[0].email}`,
    `E2E_ADMIN_PASSWORD=${password}`,
    `E2E_TENANT_B_ADMIN_EMAIL=${accounts[1].email}`,
    `E2E_TENANT_B_ADMIN_PASSWORD=${password}`,
    "NEXT_PUBLIC_PROVISIONS_API_VERSION=v2",
    "",
  ].join("\n");
  await writeFile(outputPath, content, { encoding: "utf8", mode: 0o600 });
  console.log(`Comptes E2E locaux préparés ; variables protégées : ${outputPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Préparation E2E impossible");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
