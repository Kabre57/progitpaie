export class ContractDistribution {
  constructor(
    public readonly cdi: number,
    public readonly cdd: number,
    public readonly stage: number,
    public readonly freelance: number
  ) {}

  public get total(): number {
    return this.cdi + this.cdd + this.stage + this.freelance;
  }
}
