/**
 * Value Object représentant un matricule d'employé.
 */
export class EmployeeId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("Le matricule ne peut pas être vide");
    }
  }

  public static create(raw: string): EmployeeId {
    return new EmployeeId(raw.trim().toUpperCase());
  }

  public toString(): string {
    return this.value;
  }
}
