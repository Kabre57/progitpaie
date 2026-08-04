import type { ProvisionV2Query } from "@/shared/validation/provision.schema";

export function resolveProvisionReferenceDate(
  query: ProvisionV2Query,
  now: Date = new Date()
): Date {
  if (query.asOf) {
    const referenceDate = new Date(`${query.asOf}T23:59:59.999Z`);
    const todayEnd = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    ));
    if (referenceDate > todayEnd) throw new RangeError("La date de référence ne peut pas être future");
    return referenceDate;
  }

  const year = query.year ?? now.getUTCFullYear();
  if (year > now.getUTCFullYear()) throw new RangeError("L'année de référence ne peut pas être future");
  if (year === now.getUTCFullYear()) {
    return new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  }
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
}
