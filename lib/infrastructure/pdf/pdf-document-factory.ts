/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — PDF Document Factory (Factory Pattern)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Instancie et orchestre la construction du document PDF en fonction du `docType`.
 *
 * ADR-001 : Remplace les conditions géantes de `generate/route.ts` par une
 *           factory modulaire et extensible.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { IPDFDocumentBuilder } from "./builders/abstract-pdf-builder";
import { ITSDeclarationBuilder } from "./builders/its-declaration-builder";
import { CNPSDeclarationBuilder } from "./builders/cnps-declaration-builder";
import { FDFPDeclarationBuilder } from "./builders/fdfp-declaration-builder";

export interface PDFDocumentFactoryOptions {
  docType: string;
  month: number;
  year: number;
  companyName: string;
  companyAddress: string;
  taxNumber: string;
  cnpsNumber: string;
  dgiLogoBase64?: string;
  cnpsLogoBase64?: string;
  itsData?: any;
  cnpsData?: any;
  fdfpData?: any;
}

export class PDFDocumentFactory {
  /**
   * Crée et construit un document PDF selon son type
   *
   * @param options - Les données et métadonnées du document
   * @returns Un Buffer contenant les octets du fichier PDF
   */
  public static createDocument(options: PDFDocumentFactoryOptions): Buffer {
    let builder: IPDFDocumentBuilder;

    switch (options.docType) {
      case "declaration_its":
        builder = new ITSDeclarationBuilder({
          month: options.month,
          year: options.year,
          companyName: options.companyName,
          companyAddress: options.companyAddress,
          taxNumber: options.taxNumber,
          cnpsNumber: options.cnpsNumber,
          dgiLogoBase64: options.dgiLogoBase64,
          itsData: options.itsData,
        });
        break;

      case "declaration_cnps":
      case "rns":
        builder = new CNPSDeclarationBuilder({
          month: options.month,
          year: options.year,
          companyName: options.companyName,
          companyAddress: options.companyAddress,
          taxNumber: options.taxNumber,
          cnpsNumber: options.cnpsNumber,
          cnpsLogoBase64: options.cnpsLogoBase64,
          cnpsData: options.cnpsData,
        });
        break;

      case "declaration_fdfp":
        builder = new FDFPDeclarationBuilder({
          month: options.month,
          year: options.year,
          companyName: options.companyName,
          companyAddress: options.companyAddress,
          taxNumber: options.taxNumber,
          cnpsNumber: options.cnpsNumber,
          dgiLogoBase64: options.dgiLogoBase64,
          fdfpData: options.fdfpData,
        });
        break;

      default:
        throw new Error(`Type de document non supporté par la PDFDocumentFactory : ${options.docType}`);
    }

    return builder
      .buildHeader()
      .buildCompanyInfo()
      .buildBody()
      .buildFooter()
      .getBuffer();
  }
}
