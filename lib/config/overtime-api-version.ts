export type OvertimeApiVersion = "v1" | "v2";

export function getOvertimeApiVersion(): OvertimeApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_OVERTIME_API_VERSION?.toLowerCase();
  if (envVersion === "v2" || envVersion === "2") {
    return "v2";
  }
  return "v1";
}

export function getOvertimeEndpoint(path: string = ""): string {
  const version = getOvertimeApiVersion();
  const base = version === "v2" ? "/api/v2/overtime" : "/api/overtime";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
