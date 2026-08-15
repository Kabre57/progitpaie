import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/middleware-helpers";
import { typeDefs } from "@/lib/graphql/schema/typeDefs";
import { resolvers } from "@/lib/graphql/schema/resolvers";
import type { JWTPayload } from "@/types";

const requestSchema = z.object({
  query: z.string().trim().min(1).max(20_000),
  variables: z.record(z.string(), z.unknown()).optional().default({}),
});

const queryInputSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  date: z.string().trim().max(30).optional(),
});

type GraphQLContext = {
  user: JWTPayload;
  companyId: string;
};

type GraphQLVariables = z.infer<typeof queryInputSchema>;

async function executeGraphQLQuery(
  queryStr: string,
  variables: GraphQLVariables,
  context: GraphQLContext,
) {
  const trimmed = queryStr.trim();

  if (trimmed.startsWith("query") || trimmed.startsWith("{")) {
    if (trimmed.includes("employees")) {
      const data = await resolvers.Query.employees(null, variables, context);
      return { data: { employees: data } };
    }
    if (trimmed.includes("company")) {
      const data = await resolvers.Query.company(null, variables, context);
      return { data: { company: data } };
    }
    if (trimmed.includes("employee")) {
      const data = await resolvers.Query.employee(null, variables, context);
      return { data: { employee: data } };
    }
    if (trimmed.includes("payrolls")) {
      const data = await resolvers.Query.payrolls(null, variables, context);
      return { data: { payrolls: data } };
    }
    if (trimmed.includes("attendances")) {
      const data = await resolvers.Query.attendances(null, variables, context);
      return { data: { attendances: data } };
    }
  }

  if (trimmed.startsWith("mutation") && trimmed.includes("refreshMaterializedViews")) {
    const result = await resolvers.Mutation.refreshMaterializedViews(null, {}, context);
    return { data: { refreshMaterializedViews: result } };
  }

  return {
    data: null,
    errors: [{ message: "Requête GraphQL non supportée" }],
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user?.companyId) {
      return NextResponse.json(
        { errors: [{ message: "Authentification et entreprise requises" }] },
        { status: 401 },
      );
    }

    const body = requestSchema.parse(await request.json());
    const variables = queryInputSchema.parse(body.variables);
    const context: GraphQLContext = { user, companyId: user.companyId };
    const result = await executeGraphQLQuery(body.query, variables, context);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof z.ZodError
      ? "Requête GraphQL invalide"
      : error instanceof Error
        ? error.message
        : "Erreur interne du serveur GraphQL";
    const status = error instanceof z.ZodError ? 400 : message.includes("requis") || message.includes("administrateur") ? 403 : 500;
    console.error("GraphQL Error:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ errors: [{ message }] }, { status });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { name: "PROGITPAIE GraphQL API", status: "healthy", schema: typeDefs },
    { headers: { "Cache-Control": "no-store" } },
  );
}
