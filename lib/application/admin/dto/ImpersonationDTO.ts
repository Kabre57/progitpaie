export interface ImpersonationSessionDTO {
  isImpersonating: boolean;
  superAdminId?: string;
  superAdminName?: string;
  superAdminEmail?: string;
  targetCompanyId?: string;
  targetCompanyName?: string;
  startedAt?: string;
}

export interface StartImpersonationInput {
  superAdminId: string;
  companyId: string;
}
