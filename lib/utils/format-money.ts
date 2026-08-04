const xofFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return xofFormatter.format(amount);
}
