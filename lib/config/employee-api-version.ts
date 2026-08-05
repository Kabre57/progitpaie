export type EmployeeApiVersion = "v1" | "v2";

export function getEmployeeApiVersion(): EmployeeApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_EMPLOYEE_API_VERSION?.toLowerCase();
  if (envVersion === "v1" || envVersion === "1") {
    return "v1";
  }
  return "v2";
}

export function getEmployeeEndpoint(path: string = ""): string {
  const version = getEmployeeApiVersion();
  const base = version === "v2" ? "/api/v2/employees" : "/api/employees";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
