/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Builder PDF Abstrait (Pattern Builder)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Interface commune pour la construction modulaire de documents PDF jsPDF.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { jsPDF } from "jspdf";

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

export interface IPDFDocumentBuilder {
  buildHeader(): IPDFDocumentBuilder;
  buildCompanyInfo(): IPDFDocumentBuilder;
  buildBody(): IPDFDocumentBuilder;
  buildFooter(): IPDFDocumentBuilder;
  getBuffer(): Buffer;
}

export abstract class AbstractPDFDocumentBuilder implements IPDFDocumentBuilder {
  protected doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  public abstract buildHeader(): this;
  public abstract buildCompanyInfo(): this;
  public abstract buildBody(): this;
  public abstract buildFooter(): this;

  protected getLastAutoTableY(fallback: number): number {
    return (this.doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? fallback;
  }

  public getBuffer(): Buffer {
    return Buffer.from(this.doc.output("arraybuffer"));
  }
}
