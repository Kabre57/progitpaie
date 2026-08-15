import { Workbook, type CellValue } from "exceljs";

export type SpreadsheetValue = string | number | boolean | Date | null;
export type SpreadsheetRow = Readonly<Record<string, SpreadsheetValue>>;

function normalizeCellValue(value: CellValue | undefined): SpreadsheetValue {
  if (value === undefined || value === null) return null;
  if (value instanceof Date || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "object") {
    if ("result" in value) {
      return normalizeCellValue(value.result as CellValue | undefined);
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
  }

  return String(value);
}

/**
 * Lit la première feuille d’un fichier XLSX et retourne des objets indexés par les titres de colonnes.
 * Le format historique .xls n’est volontairement pas accepté : les modèles générés par PROGITPAIE
 * sont en .xlsx et ce format permet une lecture maintenue et typée avec ExcelJS.
 */
type ExcelJsLoadInput = Parameters<Workbook["xlsx"]["load"]>[0];

export async function readFirstWorksheetRecords(buffer: Uint8Array): Promise<readonly SpreadsheetRow[]> {
  const workbook = new Workbook();
  // ExcelJS expose encore un type Buffer historique incompatible avec le Buffer générique
  // de Node 24 ; les octets ont déjà été normalisés au niveau de la route.
  await workbook.xlsx.load(buffer as unknown as ExcelJsLoadInput);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers = new Map<number, string>();
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = normalizeCellValue(cell.value);
    if (header !== null && String(header).trim()) {
      headers.set(columnNumber, String(header).trim());
    }
  });

  if (headers.size === 0) return [];

  const rows: SpreadsheetRow[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const record: Record<string, SpreadsheetValue> = {};
    let hasValue = false;
    for (const [columnNumber, header] of headers) {
      const value = normalizeCellValue(row.getCell(columnNumber).value);
      record[header] = value;
      hasValue ||= value !== null && value !== "";
    }

    if (hasValue) rows.push(record);
  });

  return rows;
}

export function excelSerialDateToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  const milliseconds = Math.round((serial - 25569) * 86_400_000);
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}
