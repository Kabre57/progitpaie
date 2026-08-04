import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantRequestContext {
  companyId: string;
  userId: string;
  role: UserRole;
}

import type { UserRole } from "@/types";

export const requestContext = new AsyncLocalStorage<TenantRequestContext>();

export function getTenantRequestContext(): TenantRequestContext {
  const context = requestContext.getStore();
  if (!context) {
    throw new Error("Contexte société absent");
  }
  return context;
}
