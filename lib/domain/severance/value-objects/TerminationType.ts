export type TerminationTypeEnum = "licenciement" | "demission" | "retraite" | "fin_cdd";

export class TerminationType {
  private constructor(public readonly value: TerminationTypeEnum) {}

  public static licenciement(): TerminationType {
    return new TerminationType("licenciement");
  }

  public static demission(): TerminationType {
    return new TerminationType("demission");
  }

  public static retraite(): TerminationType {
    return new TerminationType("retraite");
  }

  public static finCdd(): TerminationType {
    return new TerminationType("fin_cdd");
  }

  public static fromString(raw: string): TerminationType {
    const normalized = raw.toLowerCase();
    if (["licenciement", "demission", "retraite", "fin_cdd"].includes(normalized)) {
      return new TerminationType(normalized as TerminationTypeEnum);
    }
    return new TerminationType("licenciement");
  }

  public isSeveranceEligible(): boolean {
    return this.value === "licenciement" || this.value === "retraite" || this.value === "fin_cdd";
  }
}
