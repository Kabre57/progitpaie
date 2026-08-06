import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware-helpers";
import { typeDefs } from "@/lib/graphql/schema/typeDefs";
import { resolvers } from "@/lib/graphql/schema/resolvers";

// Simple robust GraphQL query executor without heavy external dependencies
async function executeGraphQLQuery(queryStr: string, variables: any, context: any) {
  const trimmed = queryStr.trim();

  if (trimmed.startsWith("query") || trimmed.startsWith("{")) {
    if (trimmed.includes("employees")) {
      const searchVar = variables?.search;
      const limitVar = variables?.limit;
      const data = await resolvers.Query.employees(null, { search: searchVar, limit: limitVar }, context);
      return { data: { employees: data } };
    }

    if (trimmed.includes("company")) {
      const companyId = variables?.id || context.companyId || "progitpaie-default-001";
      const data = await resolvers.Query.company(null, { id: companyId }, context);
      return { data: { company: data } };
    }

    if (trimmed.includes("payrolls")) {
      const month = variables?.month;
      const year = variables?.year;
      const data = await resolvers.Query.payrolls(null, { month, year }, context);
      return { data: { payrolls: data } };
    }

    if (trimmed.includes("attendances")) {
      const date = variables?.date;
      const data = await resolvers.Query.attendances(null, { date }, context);
      return { data: { attendances: data } };
    }
  }

  if (trimmed.startsWith("mutation")) {
    if (trimmed.includes("refreshMaterializedViews")) {
      const result = await resolvers.Mutation.refreshMaterializedViews();
      return { data: { refreshMaterializedViews: result } };
    }
  }

  return {
    data: null,
    errors: [{ message: "Requête GraphQL supportée: employees, company, payrolls, attendances, refreshMaterializedViews" }],
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json().catch(() => ({}));
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json({ errors: [{ message: "Le paramètre 'query' est requis" }] }, { status: 400 });
    }

    const context = {
      user,
      companyId: user?.companyId || "progitpaie-default-001",
    };

    const result = await executeGraphQLQuery(query, variables, context);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GraphQL Error:", error);
    return NextResponse.json(
      { errors: [{ message: error.message || "Erreur interne du serveur GraphQL" }] },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: "PROGITPAIE GraphQL Subgraph Gateway API",
    status: "healthy",
    schema: typeDefs,
  });
}
