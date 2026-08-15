export interface CompanySettingsEntry {
  key: string;
  value: unknown;
}

export interface CompanySettingsCompany {
  name: string;
  taxNumber: string | null;
  cnpsNumber: string | null;
  rccm: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
}

export interface CompanySettingsAdministrator {
  name: string | null;
  role: string;
}

export interface CompanySettingsSnapshot {
  settings: readonly CompanySettingsEntry[];
  company: CompanySettingsCompany | null;
  administrator: CompanySettingsAdministrator | null;
}

export interface CompanyProfileUpdate {
  name?: string;
  taxNumber?: string;
  cnpsNumber?: string;
  rccm?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CompanyLocationUpdate {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface CompanySettingsRepository {
  getSnapshot(companyId: string, administratorId: string): Promise<CompanySettingsSnapshot>;
  saveSetting(companyId: string, key: string, value: unknown): Promise<unknown>;
  updateCompanyProfile(companyId: string, input: CompanyProfileUpdate): Promise<void>;
  updateCompanyLocation(companyId: string, input: CompanyLocationUpdate): Promise<void>;
}
