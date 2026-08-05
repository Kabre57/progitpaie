export type SeveranceApiVersion = "v1" | "v2";

export function getSeveranceApiVersion(): SeveranceApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION?.toLowerCase();
  if (envVersion === "v2" || envVersion === "2") {
    return "v2";
  }
  return "v1";
}

export function getSeveranceEndpoint(path: string = ""): string {
  const version = getSeveranceApiVersion();
  const base = version === "v2" ? "/api/v2/severance" : "/api/severance";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
