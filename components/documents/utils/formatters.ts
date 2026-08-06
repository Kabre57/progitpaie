/**
 * Utilitaires de formatage de données pour les documents RH
 */

export function fmtNum(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatDateFr(dateStr?: string | Date): string {
  if (!dateStr) return new Date().toLocaleDateString("fr-FR");
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return new Date().toLocaleDateString("fr-FR");
  return date.toLocaleDateString("fr-FR");
}
