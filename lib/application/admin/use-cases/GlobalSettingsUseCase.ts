import { prisma } from "@/lib/db";
import {
  GlobalSettingsDTO,
  GlobalCNPSRates,
  GlobalLeavePolicy,
  GlobalSecurityPolicy,
} from "../dto/GlobalSettingsDTO";
import { DEFAULT_PAYROLL_RATES } from "@/lib/rates-config";

// ─── Storage Keys in Settings table ──────────────────────────────────────────
const KEY_CNPS = "global_cnps_rates";
const KEY_LEAVE = "global_leave_policy";
const KEY_SECURITY = "global_security_policy";

// ─── Default values ───────────────────────────────────────────────────────────
const DEFAULT_CNPS: GlobalCNPSRates = {
  cnpsEmployeeRetraite: DEFAULT_PAYROLL_RATES.cnpsEmployeeRetraite,
  cnpsEmployerRetraite: DEFAULT_PAYROLL_RATES.cnpsEmployerRetraite,
  cnpsEmployerAT: DEFAULT_PAYROLL_RATES.cnpsEmployerAT,
  cnpsEmployerPF: DEFAULT_PAYROLL_RATES.cnpsEmployerPF,
  cnpsCeilingRetraite: DEFAULT_PAYROLL_RATES.cnpsCeilingRetraite,
  cnpsCeilingPF_AT: DEFAULT_PAYROLL_RATES.cnpsCeilingPF_AT,
  fdfpTA: DEFAULT_PAYROLL_RATES.fdfpTA,
  fdfpFPC: DEFAULT_PAYROLL_RATES.fdfpFPC,
  itsRate: DEFAULT_PAYROLL_RATES.itsRate,
  cmuBase: DEFAULT_PAYROLL_RATES.cmuBase,
  cmuEmployeeRate: DEFAULT_PAYROLL_RATES.cmuEmployeeRate,
  cmuEmployerRate: DEFAULT_PAYROLL_RATES.cmuEmployerRate,
  transportExemptAmount: DEFAULT_PAYROLL_RATES.transportExemptAmount,
  defaultHourlyBase: DEFAULT_PAYROLL_RATES.defaultHourlyBase,
};

const DEFAULT_LEAVE: GlobalLeavePolicy = {
  annualLeaveDays: 25,
  sickLeaveDays: 15,
  maternityLeaveDays: 98,
  paternityLeaveDays: 10,
};

const DEFAULT_SECURITY: GlobalSecurityPolicy = {
  jwtExpiresInMinutes: 120,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  requireMFA: false,
  minPasswordLength: 8,
};

export class GlobalSettingsUseCase {
  /** Read all global settings from DB, falling back to defaults if not set */
  public async get(): Promise<GlobalSettingsDTO> {
    const rows = await prisma.settings.findMany({
      where: { key: { in: [KEY_CNPS, KEY_LEAVE, KEY_SECURITY] } },
    });

    const rowMap = new Map(rows.map((r) => [r.key, r]));

    const cnpsRates: GlobalCNPSRates = {
      ...DEFAULT_CNPS,
      ...(rowMap.get(KEY_CNPS)?.value as Partial<GlobalCNPSRates> | undefined ?? {}),
    };
    const leavePolicy: GlobalLeavePolicy = {
      ...DEFAULT_LEAVE,
      ...(rowMap.get(KEY_LEAVE)?.value as Partial<GlobalLeavePolicy> | undefined ?? {}),
    };
    const securityPolicy: GlobalSecurityPolicy = {
      ...DEFAULT_SECURITY,
      ...(rowMap.get(KEY_SECURITY)?.value as Partial<GlobalSecurityPolicy> | undefined ?? {}),
    };

    const lastRow = rows.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];

    return {
      cnpsRates,
      leavePolicy,
      securityPolicy,
      lastUpdatedAt: lastRow?.updatedAt?.toISOString() ?? null,
    };
  }

  /** Persist one or more sections via upsert */
  public async update(input: {
    cnpsRates?: Partial<GlobalCNPSRates>;
    leavePolicy?: Partial<GlobalLeavePolicy>;
    securityPolicy?: Partial<GlobalSecurityPolicy>;
  }): Promise<GlobalSettingsDTO> {
    const current = await this.get();

    const ops: Array<Promise<unknown>> = [];

    if (input.cnpsRates) {
      const merged = { ...current.cnpsRates, ...input.cnpsRates };
      ops.push(
        prisma.settings.upsert({
          where: { key: KEY_CNPS },
          create: { key: KEY_CNPS, value: merged as any },
          update: { value: merged as any },
        })
      );
    }

    if (input.leavePolicy) {
      const merged = { ...current.leavePolicy, ...input.leavePolicy };
      ops.push(
        prisma.settings.upsert({
          where: { key: KEY_LEAVE },
          create: { key: KEY_LEAVE, value: merged as any },
          update: { value: merged as any },
        })
      );
    }

    if (input.securityPolicy) {
      const merged = { ...current.securityPolicy, ...input.securityPolicy };
      ops.push(
        prisma.settings.upsert({
          where: { key: KEY_SECURITY },
          create: { key: KEY_SECURITY, value: merged as any },
          update: { value: merged as any },
        })
      );
    }

    await Promise.all(ops);
    return this.get();
  }

  /** Reset one section to defaults */
  public async reset(section: "cnpsRates" | "leavePolicy" | "securityPolicy"): Promise<GlobalSettingsDTO> {
    const keyMap = {
      cnpsRates: KEY_CNPS,
      leavePolicy: KEY_LEAVE,
      securityPolicy: KEY_SECURITY,
    };
    const defaultMap = {
      cnpsRates: DEFAULT_CNPS,
      leavePolicy: DEFAULT_LEAVE,
      securityPolicy: DEFAULT_SECURITY,
    };

    await prisma.settings.upsert({
      where: { key: keyMap[section] },
      create: { key: keyMap[section], value: defaultMap[section] as any },
      update: { value: defaultMap[section] as any },
    });

    return this.get();
  }
}
