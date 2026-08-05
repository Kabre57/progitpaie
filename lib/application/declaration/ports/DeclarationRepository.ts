import { SocialTaxDeclaration } from "@/lib/domain/declaration/entities/SocialTaxDeclaration";

export interface DeclarationRepository {
  getCnpsDeclaration(companyId: string, month: number, year: number): Promise<SocialTaxDeclaration>;
  getItsDeclaration(companyId: string, month: number, year: number): Promise<SocialTaxDeclaration>;
}
