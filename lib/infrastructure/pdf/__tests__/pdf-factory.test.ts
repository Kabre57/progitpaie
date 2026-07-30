/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Tests des Builders PDF & Factory
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { PDFDocumentFactory } from "../pdf-document-factory";

describe("PDF Document Factory", () => {
  const baseOptions = {
    month: 7,
    year: 2026,
    companyName: "LOGIPAIE RH TEST",
    companyAddress: "ABIDJAN COTE D'IVOIRE",
    taxNumber: "1234567 A",
    cnpsNumber: "123456",
  };

  it("devrait générer un PDF pour la déclaration ITS", () => {
    const buffer = PDFDocumentFactory.createDocument({
      ...baseOptions,
      docType: "declaration_its",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    // Vérifier les 4 premiers octets du header PDF (%PDF)
    expect(buffer.toString("utf8", 0, 4)).toBe("%PDF");
  });

  it("devrait générer un PDF pour la déclaration CNPS", () => {
    const buffer = PDFDocumentFactory.createDocument({
      ...baseOptions,
      docType: "declaration_cnps",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.toString("utf8", 0, 4)).toBe("%PDF");
  });

  it("devrait générer un PDF pour la déclaration FDFP", () => {
    const buffer = PDFDocumentFactory.createDocument({
      ...baseOptions,
      docType: "declaration_fdfp",
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.toString("utf8", 0, 4)).toBe("%PDF");
  });

  it("devrait lever une erreur pour un type de document inconnu", () => {
    expect(() => {
      PDFDocumentFactory.createDocument({
        ...baseOptions,
        docType: "invalide_type",
      });
    }).toThrow("Type de document non supporté par la PDFDocumentFactory");
  });
});
