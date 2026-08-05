export type DeclarationApiVersion = "v1" | "v2";

export function getDeclarationApiVersion(): DeclarationApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_DECLARATION_API_VERSION?.toLowerCase();
  if (envVersion === "v1" || envVersion === "1") {
    return "v1";
  }
  return "v2";
}

export function getDeclarationEndpoint(path: string = ""): string {
  const version = getDeclarationApiVersion();
  const base = version === "v2" ? "/api/v2/declarations" : "/api/declarations";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
