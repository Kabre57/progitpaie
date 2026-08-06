import { PrismaClient } from "@prisma/client";

export async function seedCompany(prisma: PrismaClient) {
  const company = await prisma.company.upsert({
    where: { id: "progitpaie-default-001" },
    update: { name: "PROGITPAIE", isMain: true, isActive: true },
    create: { id: "progitpaie-default-001", name: "PROGITPAIE", isMain: true, isActive: true },
  });
  return company;
}
