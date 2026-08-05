export type LeaveApiVersion = "v1" | "v2";

export function getLeaveApiVersion(): LeaveApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_LEAVE_API_VERSION?.toLowerCase();
  if (envVersion === "v1" || envVersion === "1") {
    return "v1";
  }
  return "v2";
}

export function getLeaveEndpoint(path: string = ""): string {
  const version = getLeaveApiVersion();
  const base = version === "v2" ? "/api/v2/leaves" : "/api/leaves";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
