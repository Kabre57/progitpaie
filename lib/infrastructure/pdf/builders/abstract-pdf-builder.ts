/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Builder PDF Abstrait (Pattern Builder)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Interface commune pour la construction modulaire de documents PDF jsPDF.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { jsPDF } from "jspdf";

export interface IPDFDocumentBuilder {
  buildHeader(): IPDFDocumentBuilder;
  buildCompanyInfo(): IPDFDocumentBuilder;
  buildBody(): IPDFDocumentBuilder;
  buildFooter(): IPDFDocumentBuilder;
  getBuffer(): Buffer;
}

export abstract class AbstractPDFDocumentBuilder implements IPDFDocumentBuilder {
  protected doc: any;

  constructor() {
    this.doc = new jsPDF();
  }

  public abstract buildHeader(): this;
  public abstract buildCompanyInfo(): this;
  public abstract buildBody(): this;
  public abstract buildFooter(): this;

  public getBuffer(): Buffer {
    return Buffer.from(this.doc.output("arraybuffer"));
  }
}
