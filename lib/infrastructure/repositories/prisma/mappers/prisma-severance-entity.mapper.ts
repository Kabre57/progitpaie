import { Severance as PrismaSeverance } from "@prisma/client";
import { SeveranceCalculation } from "@/lib/domain/severance/entities/SeveranceCalculation";
import { TerminationType } from "@/lib/domain/severance/value-objects/TerminationType";
import { SeveranceBreakdown } from "@/lib/domain/severance/value-objects/SeveranceBreakdown";
import { Money } from "@/lib/domain/payroll/money";

export function mapPrismaToDomainSeverance(record: PrismaSeverance): SeveranceCalculation {
  const breakdown = new SeveranceBreakdown(
    Money.of(record.noticeIndemnity),
    Money.of(record.severanceIndemnity),
    Money.of(record.leaveCompensation),
    Money.of(record.gratification13th)
  );

  return new SeveranceCalculation({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    contractId: record.contractId,
    terminationType: TerminationType.fromString(record.terminationType),
    exitDate: record.exitDate,
    seniorityYears: record.seniorityYears,
    breakdown,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
