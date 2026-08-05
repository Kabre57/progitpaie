export type PayrollApiVersion = "v1" | "v2";

export function getPayrollApiVersion(): PayrollApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_PAYROLL_API_VERSION?.toLowerCase();
  if (envVersion === "v2" || envVersion === "2") {
    return "v2";
  }
  return "v1";
}

export function getPayrollEndpoint(path: string = ""): string {
  const version = getPayrollApiVersion();
  const base = version === "v2" ? "/api/v2/payroll" : "/api/payroll";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
