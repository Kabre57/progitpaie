import type {
  CompanyLocationUpdate,
  CompanyProfileUpdate,
  CompanySettingsRepository,
} from "../ports/CompanySettingsRepository";

export interface CompanySettingsView {
  readonly settings: Record<string, unknown>;
}

export interface UpdateCompanySettingInput {
  companyId: string;
  key: string;
  value: unknown;
  companyProfile?: CompanyProfileUpdate;
  companyLocation?: CompanyLocationUpdate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class GetCompanySettingsUseCase {
  public constructor(
    private readonly repository: CompanySettingsRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  public async execute(companyId: string, administratorId: string): Promise<CompanySettingsView> {
    const snapshot = await this.repository.getSnapshot(companyId, administratorId);
    const settings = Object.fromEntries(snapshot.settings.map((setting) => [setting.key, setting.value]));
    const now = this.now();
    const monthNames = [
      "JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN",
      "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE",
    ];
    const company = snapshot.company;
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const defaultCompanyInfo = {
      name: company?.name ?? "",
      taxNumber: company?.taxNumber ?? "",
      cnpsNumber: company?.cnpsNumber ?? "",
      rccm: company?.rccm ?? "",
      address: company?.address ?? "",
      phone: company?.phone ?? "",
      email: company?.email ?? "",
      periodMonth: monthNames[now.getMonth()],
      periodYear: now.getFullYear(),
      payDate: `${String(lastDayOfMonth.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
      sigle: "",
      activity: "",
      legalForm: "SARL",
      commune: company?.city ?? "Abidjan",
      quartier: "",
      rue: "",
      lot: "",
      taxCenter: "",
      establishmentCode: "",
      activityCode: "",
      bankName: "",
      bankAgency: "",
      bankAccount: "",
      accountManagerCivility: "M.",
      accountManagerName: snapshot.administrator?.name ?? "",
    };

    settings.company_info = isRecord(settings.company_info)
      ? { ...defaultCompanyInfo, ...settings.company_info }
      : defaultCompanyInfo;

    if (!settings.location && company) {
      settings.location = {
        officeLat: company.latitude ?? 5.3484,
        officeLng: company.longitude ?? -4.0305,
        radiusMeters: company.radiusMeters ?? 150,
        strictGeofence: false,
      };
    }

    const otherParameters = isRecord(settings.other_params) ? { ...settings.other_params } : {};
    if (!otherParameters.signatoryName) {
      otherParameters.signatoryName = snapshot.administrator?.name ?? company?.name ?? "";
      otherParameters.signatoryRole = "Directeur Général";
      settings.other_params = otherParameters;
    }

    return { settings };
  }
}

export class UpdateCompanySettingUseCase {
  public constructor(private readonly repository: CompanySettingsRepository) {}

  public async execute(input: UpdateCompanySettingInput): Promise<unknown> {
    const value = await this.repository.saveSetting(input.companyId, input.key, input.value);

    if (input.companyProfile) {
      await this.repository.updateCompanyProfile(input.companyId, input.companyProfile);
    }
    if (input.companyLocation) {
      await this.repository.updateCompanyLocation(input.companyId, input.companyLocation);
    }

    return value;
  }
}
