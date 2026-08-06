export type TenantStatusType = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export class TenantStatus {
  private readonly value: TenantStatusType;

  constructor(value: string) {
    const uppercaseValue = value.toUpperCase() as TenantStatusType;
    if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(uppercaseValue)) {
      throw new Error(`Statut d'entreprise invalide: ${value}`);
    }
    this.value = uppercaseValue;
  }

  public getValue(): TenantStatusType {
    return this.value;
  }

  public isActive(): boolean {
    return this.value === "ACTIVE";
  }

  public isSuspended(): boolean {
    return this.value === "SUSPENDED";
  }
}
