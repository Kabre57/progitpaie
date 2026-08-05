export type AttendanceApiVersion = "v1" | "v2";

export function getAttendanceApiVersion(): AttendanceApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_ATTENDANCE_API_VERSION?.toLowerCase();
  if (envVersion === "v2" || envVersion === "2") {
    return "v2";
  }
  return "v1";
}

export function getAttendanceEndpoint(path: string = ""): string {
  const version = getAttendanceApiVersion();
  const base = version === "v2" ? "/api/v2/attendance" : "/api/attendance";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
