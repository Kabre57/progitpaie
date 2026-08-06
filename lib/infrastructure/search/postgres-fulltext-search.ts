import { prisma } from "@/lib/db";

export interface SearchEmployeeResult {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  jobTitle: string | null;
  departmentId: string | null;
  similarityScore?: number;
}

export class PostgresFullTextSearchRepository {
  /**
   * Fast fuzzy search over employees using PostgreSQL pg_trgm similarity
   */
  public async searchEmployees(companyId: string, queryTerm: string, limit = 20): Promise<SearchEmployeeResult[]> {
    if (!queryTerm || queryTerm.trim().length === 0) {
      const defaultUsers = await prisma.user.findMany({
        where: { companyId, isActive: true },
        take: limit,
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true, employeeId: true, jobTitle: true, departmentId: true },
      });
      return defaultUsers.map((u) => ({ ...u, similarityScore: 1 }));
    }

    const sanitizedQuery = queryTerm.trim();

    const results = await prisma.$queryRaw<SearchEmployeeResult[]>`
      SELECT 
        id, 
        name, 
        email, 
        "employeeId", 
        "jobTitle", 
        "departmentId",
        similarity(
          COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE("employeeId", '') || ' ' || COALESCE("jobTitle", ''),
          ${sanitizedQuery}
        ) AS "similarityScore"
      FROM users
      WHERE "companyId" = ${companyId}
        AND "isActive" = true
        AND (
          similarity(
            COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE("employeeId", '') || ' ' || COALESCE("jobTitle", ''),
            ${sanitizedQuery}
          ) > 0.1
          OR name ILIKE ${'%' + sanitizedQuery + '%'}
          OR email ILIKE ${'%' + sanitizedQuery + '%'}
          OR "employeeId" ILIKE ${'%' + sanitizedQuery + '%'}
        )
      ORDER BY "similarityScore" DESC, name ASC
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Trigger refreshment of materialized reporting views
   */
  public async refreshMaterializedViews(): Promise<void> {
    await prisma.$executeRawUnsafe(`SELECT refresh_payroll_materialized_views();`);
  }
}
