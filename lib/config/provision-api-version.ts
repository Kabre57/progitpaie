export type ProvisionApiVersion = "v2" | "legacy";

export function resolveProvisionApiVersion(value: string | undefined): ProvisionApiVersion {
  return value === "v2" ? "v2" : "legacy";
}

export function getProvisionApiVersion(): ProvisionApiVersion {
  return resolveProvisionApiVersion(process.env.NEXT_PUBLIC_PROVISIONS_API_VERSION);
}
