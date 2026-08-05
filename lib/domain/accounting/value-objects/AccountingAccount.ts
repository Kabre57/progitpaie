export class AccountingAccount {
  constructor(
    public readonly number: string,
    public readonly name: string
  ) {}

  public static salairesBaseSursalaire(): AccountingAccount {
    return new AccountingAccount("661100", "Appointements, Salaires & Sursalaire");
  }

  public static primesHeuresSupp(): AccountingAccount {
    return new AccountingAccount("661200", "Primes & Heures Supplémentaires");
  }

  public static indemnitesTransport(): AccountingAccount {
    return new AccountingAccount("663400", "Indemnités de transport");
  }

  public static cnpsPatronale(): AccountingAccount {
    return new AccountingAccount("664100", "Charges sociales patronales (CNPS)");
  }

  public static fdfpPatronale(): AccountingAccount {
    return new AccountingAccount("664800", "Taxes sur salaires patronales (FDFP)");
  }

  public static impotsSalaires(): AccountingAccount {
    return new AccountingAccount("447200", "Impôts sur Salaires (ITS & IGR)");
  }

  public static cnpsSalariePart(): AccountingAccount {
    return new AccountingAccount("431310", "CNPS Part Salariée");
  }

  public static cnpsPatronalePart(): AccountingAccount {
    return new AccountingAccount("431320", "CNPS Part Patronale");
  }

  public static fdfpAPayer(): AccountingAccount {
    return new AccountingAccount("447800", "Taxes FDFP à payer");
  }

  public static remuneraionsDuesNet(): AccountingAccount {
    return new AccountingAccount("422000", "Personnel, Rémunérations dues (Nets à payer)");
  }
}
