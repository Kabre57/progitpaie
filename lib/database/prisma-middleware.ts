import { requestContext } from "@/shared/context/request-context";

/** Exécute une unité de travail dans un contexte tenant explicite. */
export function runWithTenant<T>(
  context: { companyId: string; userId: string; role: "admin" | "employee" },
  work: () => T
): T {
  return requestContext.run(context, work);
}
