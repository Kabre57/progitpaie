export type AuthorityType = "CNPS" | "DGI";

export class TaxAuthority {
  private constructor(
    public readonly code: AuthorityType,
    public readonly name: string,
    public readonly formName: string
  ) {}

  public static cnps(): TaxAuthority {
    return new TaxAuthority(
      "CNPS",
      "Caisse Nationale de Prévoyance Sociale (CNPS)",
      "Appel de Cotisation Mensuel & Liste Nominative"
    );
  }

  public static dgi(): TaxAuthority {
    return new TaxAuthority(
      "DGI",
      "Direction Générale des Impôts (DGI)",
      "Déclaration des Impôts sur les Traitements et Salaires (ITS)"
    );
  }
}
