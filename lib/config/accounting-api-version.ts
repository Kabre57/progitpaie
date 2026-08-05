export type AccountingApiVersion = "v1" | "v2";

export function getAccountingApiVersion(): AccountingApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_ACCOUNTING_API_VERSION?.toLowerCase();
  if (envVersion === "v1" || envVersion === "1") {
    return "v1";
  }
  return "v2";
}

export function getAccountingEndpoint(path: string = ""): string {
  const version = getAccountingApiVersion();
  const base = version === "v2" ? "/api/v2/accounting" : "/api/accounting";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
