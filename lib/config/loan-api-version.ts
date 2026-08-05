export type LoanApiVersion = "v1" | "v2";

export function getLoanApiVersion(): LoanApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_LOAN_API_VERSION?.toLowerCase();
  if (envVersion === "v2" || envVersion === "2") {
    return "v2";
  }
  return "v1";
}

export function getLoanEndpoint(path: string = ""): string {
  const version = getLoanApiVersion();
  const base = version === "v2" ? "/api/v2/loans" : "/api/loans";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
