export type EmployeeCategoryEnum = "cadre" | "maitrise" | "employe";

export class EmployeeCategory {
  private constructor(public readonly value: EmployeeCategoryEnum) {}

  public static cadre(): EmployeeCategory {
    return new EmployeeCategory("cadre");
  }

  public static maitrise(): EmployeeCategory {
    return new EmployeeCategory("maitrise");
  }

  public static employe(): EmployeeCategory {
    return new EmployeeCategory("employe");
  }

  public static fromString(raw: string): EmployeeCategory {
    const normalized = raw.toLowerCase();
    if (["cadre", "maitrise", "employe"].includes(normalized)) {
      return new EmployeeCategory(normalized as EmployeeCategoryEnum);
    }
    return new EmployeeCategory("employe");
  }
}
