export type ContractTypeEnum = "CDI" | "CDD" | "STAGE" | "FREELANCE";

export class ContractType {
  private constructor(public readonly value: ContractTypeEnum) {}

  public static cdi(): ContractType {
    return new ContractType("CDI");
  }

  public static cdd(): ContractType {
    return new ContractType("CDD");
  }

  public static stage(): ContractType {
    return new ContractType("STAGE");
  }

  public static freelance(): ContractType {
    return new ContractType("FREELANCE");
  }

  public static fromString(raw: string): ContractType {
    const normalized = raw.toUpperCase();
    if (["CDI", "CDD", "STAGE", "FREELANCE"].includes(normalized)) {
      return new ContractType(normalized as ContractTypeEnum);
    }
    return new ContractType("CDI");
  }

  public isFixedTerm(): boolean {
    return this.value === "CDD" || this.value === "STAGE";
  }
}
