import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export function tenantUserWhere(
  companyId: string,
  where?: Prisma.UserWhereInput
): Prisma.UserWhereInput {
  return { AND: [where ?? {}, { companyId }] };
}

/**
 * Client Prisma borné à une société.
 *
 * L'extension couvre le modèle User, qui porte la clé de tenant. Les modèles
 * enfants doivent être atteints par une relation vers un User déjà borné ou par
 * les helpers dédiés. Le client racine ne doit pas être utilisé dans une route
 * multi-tenant après l'établissement du contexte.
 */
export function prismaWithTenant(companyId: string) {
  return prisma.$extends({
    name: "tenant-isolation",
    query: {
      user: {
        async findMany({ args, query }) {
          args.where = tenantUserWhere(companyId, args.where);
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = tenantUserWhere(companyId, args.where);
          return query(args);
        },
        async count({ args, query }) {
          args.where = tenantUserWhere(companyId, args.where);
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = tenantUserWhere(companyId, args.where);
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = tenantUserWhere(companyId, args.where);
          return query(args);
        },
      },
      companySettings: {
        async findMany({ args, query }) {
          args.where = { AND: [args.where ?? {}, { companyId }] };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { AND: [args.where ?? {}, { companyId }] };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { AND: [args.where ?? {}, { companyId }] };
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { AND: [args.where ?? {}, { companyId }] };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { AND: [args.where ?? {}, { companyId }] };
          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof prismaWithTenant>;
