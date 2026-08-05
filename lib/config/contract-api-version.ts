export type ContractApiVersion = "v1" | "v2";

export function getContractApiVersion(): ContractApiVersion {
  const envVersion = process.env.NEXT_PUBLIC_CONTRACT_API_VERSION?.toLowerCase();
  if (envVersion === "v2" || envVersion === "2") {
    return "v2";
  }
  return "v1";
}

export function getContractEndpoint(path: string = ""): string {
  const version = getContractApiVersion();
  const base = version === "v2" ? "/api/v2/contracts" : "/api/contracts";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base}${cleanPath}`;
}
