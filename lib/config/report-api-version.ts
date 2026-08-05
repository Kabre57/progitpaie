export type ReportApiVersion = "v1" | "v2";

export function getReportApiVersion(): ReportApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_REPORT_API_VERSION?.toLowerCase();
  if (envVersion === "v1" || envVersion === "1") {
    return "v1";
  }
  return "v2";
}

export function getReportEndpoint(path: string = ""): string {
  const version = getReportApiVersion();
  const base = version === "v2" ? "/api/v2/reports" : "/api/reports";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
