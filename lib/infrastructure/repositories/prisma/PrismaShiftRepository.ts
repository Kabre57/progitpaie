import type {
  CreateShiftInput,
  ShiftRecord,
  ShiftRepository,
  UpdateShiftInput,
} from "@/lib/application/attendance/ports/ShiftRepository";
import { prisma } from "@/lib/db";

function toRecord(shift: ShiftRecord): ShiftRecord {
  return shift;
}

export class PrismaShiftRepository implements ShiftRepository {
  public async list(companyId: string, includeInactive: boolean): Promise<readonly ShiftRecord[]> {
    const shifts = await prisma.shift.findMany({
      where: { companyId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: "asc" },
    });
    return shifts.map(toRecord);
  }

  public async findById(companyId: string, id: string): Promise<ShiftRecord | null> {
    const shift = await prisma.shift.findFirst({ where: { id, companyId } });
    return shift ? toRecord(shift) : null;
  }

  public async findByName(companyId: string, name: string, excludeId?: string): Promise<ShiftRecord | null> {
    const shift = await prisma.shift.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return shift ? toRecord(shift) : null;
  }

  public async create(input: CreateShiftInput): Promise<ShiftRecord> {
    const shift = await prisma.shift.create({
      data: { ...input, isActive: true },
    });
    return toRecord(shift);
  }

  public async update(input: UpdateShiftInput): Promise<ShiftRecord> {
    const shift = await prisma.shift.update({
      where: { id: input.id, companyId: input.companyId },
      data: {
        name: input.name,
        startTime: input.startTime,
        endTime: input.endTime,
        workingHours: input.workingHours,
        lateThresholdMinutes: input.lateThresholdMinutes,
      },
    });
    return toRecord(shift);
  }

  public async deactivate(companyId: string, id: string): Promise<void> {
    await prisma.shift.update({ where: { id, companyId }, data: { isActive: false } });
  }
}
