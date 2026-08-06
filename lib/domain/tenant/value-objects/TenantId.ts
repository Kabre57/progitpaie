export class TenantId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("L'identifiant d'entreprise ne peut pas être vide");
    }
    this.value = value.trim();
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: TenantId): boolean {
    return this.value === other.getValue();
  }
}
