import { PrismaClient, AttendanceStatus, ContractType, EmployeeCategory, OvertimeStatus, UserRole, WorkType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL est obligatoire pour le jeu de données fonctionnel.");

const referenceDate = new Date("2026-08-12T12:00:00.000Z");
const password = await bcrypt.hash("TestP@ie2026!Secure", 12);

function dateAt(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 8, 0, 0));
}

function dateLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const company = await prisma.company.findFirst({ where: { isMain: true, isActive: true } });
  if (!company) throw new Error("Aucune société principale active trouvée.");

  await prisma.company.update({
    where: { id: company.id },
    data: { name: "PROGITPAIE Côte d’Ivoire — Environnement Test", maxEmployeesAllowed: 50 },
  });

  const department = await prisma.department.upsert({
    where: { companyId_name: { companyId: company.id, name: "Ressources Humaines" } },
    update: {},
    create: { companyId: company.id, name: "Ressources Humaines", description: "Département de test fonctionnel" },
  });

  const shift = await prisma.shift.upsert({
    where: { companyId_name: { companyId: company.id, name: "Équipe Jour Test" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Équipe Jour Test",
      startTime: "08:00",
      endTime: "17:00",
      workingHours: 8,
      lateThresholdMinutes: 15,
    },
  });

  const employees: Array<{ id: string; employeeId: string; years: number; regular: boolean }> = [];

  for (let years = 1; years <= 15; years += 1) {
    const employeeId = `TEST-${String(years).padStart(2, "0")}`;
    const email = `employe.${years}ans@progitpaie.test`;
    const joiningDate = new Date(Date.UTC(referenceDate.getUTCFullYear() - years, referenceDate.getUTCMonth(), referenceDate.getUTCDate(), 8, 0, 0));
    const regular = years <= 8;
    const contractType = years % 5 === 0 ? ContractType.CDD : ContractType.CDI;
    const salary = 250000 + years * 50000;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: `Employé Test ${years} ans`,
        employeeId,
        salary,
        sursalaire: years % 3 === 0 ? 25000 : 0,
        transportAllowance: 30000,
        housingAllowance: years % 4 === 0 ? 50000 : 0,
        joiningDate,
        contractType,
        contractSignDate: joiningDate,
        departmentId: department.id,
        shiftId: shift.id,
        companyId: company.id,
        jobTitle: years % 2 === 0 ? "Assistant(e) RH" : "Gestionnaire de paie",
        category: years >= 10 ? "cadre" : "employe",
        childrenCount: years % 4,
        partsIGR: 1 + (years % 3) * 0.5,
        phone: `07000000${String(years).padStart(2, "0")}`,
        isActive: true,
        mustChangePassword: false,
        workType: regular ? WorkType.ONSITE : WorkType.HYBRID,
      },
      create: {
        name: `Employé Test ${years} ans`,
        email,
        password,
        role: UserRole.employee,
        employeeId,
        salary,
        sursalaire: years % 3 === 0 ? 25000 : 0,
        transportAllowance: 30000,
        housingAllowance: years % 4 === 0 ? 50000 : 0,
        joiningDate,
        contractType,
        contractSignDate: joiningDate,
        departmentId: department.id,
        shiftId: shift.id,
        companyId: company.id,
        jobTitle: years % 2 === 0 ? "Assistant(e) RH" : "Gestionnaire de paie",
        category: years >= 10 ? EmployeeCategory.cadre : EmployeeCategory.employe,
        childrenCount: years % 4,
        partsIGR: 1 + (years % 3) * 0.5,
        phone: `07000000${String(years).padStart(2, "0")}`,
        isActive: true,
        mustChangePassword: false,
        workType: regular ? WorkType.ONSITE : WorkType.HYBRID,
      },
      select: { id: true },
    });

    const endDate = contractType === ContractType.CDD ? new Date(Date.UTC(2027, 7, 11, 8, 0, 0)) : null;
    await prisma.contract.deleteMany({ where: { userId: user.id, status: "active" } });
    await prisma.contract.create({
      data: {
        companyId: company.id,
        userId: user.id,
        type: contractType,
        category: years >= 10 ? EmployeeCategory.cadre : EmployeeCategory.employe,
        jobTitle: years % 2 === 0 ? "Assistant(e) RH" : "Gestionnaire de paie",
        startDate: joiningDate,
        endDate,
        baseSalary: salary,
        sursalaire: years % 3 === 0 ? 25000 : 0,
        transportAllowance: 30000,
        housingAllowance: years % 4 === 0 ? 50000 : 0,
        childrenCount: years % 4,
        partsIGR: 1 + (years % 3) * 0.5,
        status: "active",
      },
    });

    for (let day = 3; day <= 7; day += 1) {
      const current = dateAt(2026, 8, day);
      const date = dateLabel(current);
      const irregularStatus: AttendanceStatus = day === 4 ? AttendanceStatus.absent : day === 5 || day === 7 ? AttendanceStatus.late : AttendanceStatus.half_day;
      const status = regular ? AttendanceStatus.present : irregularStatus;
      const checkIn = new Date(Date.UTC(2026, 7, day, status === AttendanceStatus.late ? 9 : 8, status === AttendanceStatus.late ? 20 : 0));
      const checkOut = status === AttendanceStatus.absent ? null : new Date(Date.UTC(2026, 7, day, status === AttendanceStatus.half_day ? 12 : 17, 0));
      const workingMinutes = status === AttendanceStatus.absent ? 0 : status === AttendanceStatus.half_day ? 240 : status === AttendanceStatus.late ? 460 : 480;

      const attendance = await prisma.attendance.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: {
          companyId: company.id,
          checkIn,
          checkOut,
          status,
          hoursWorked: workingMinutes / 60,
          workingMinutes,
          overtimeMinutes: regular && day === 7 ? 60 : 0,
          overtimeRate: 1.15,
          notes: regular ? "Présence régulière de test" : "Cas irrégulier de test",
          isWithinFence: regular,
          exceptionStatus: regular ? null : "PENDING",
          exceptionType: regular ? null : "GPS_FAILURE",
          exceptionReason: regular ? null : "Test d’exception RH",
        },
        create: {
          companyId: company.id,
          userId: user.id,
          date,
          checkIn,
          checkOut,
          status,
          hoursWorked: workingMinutes / 60,
          workingMinutes,
          overtimeMinutes: regular && day === 7 ? 60 : 0,
          overtimeRate: 1.15,
          notes: regular ? "Présence régulière de test" : "Cas irrégulier de test",
          isWithinFence: regular,
          exceptionStatus: regular ? null : "PENDING",
          exceptionType: regular ? null : "GPS_FAILURE",
          exceptionReason: regular ? null : "Test d’exception RH",
        },
        select: { id: true },
      });

      if (regular && day === 7) {
        await prisma.overtime.upsert({
          where: { id: `${attendance.id}-overtime` },
          update: { minutes: 60, rate: 1.15, status: OvertimeStatus.pending },
          create: {
            id: `${attendance.id}-overtime`,
            companyId: company.id,
            userId: user.id,
            attendanceId: attendance.id,
            date: current,
            minutes: 60,
            rate: 1.15,
            reason: "Renfort clôture mensuelle — test",
            status: OvertimeStatus.pending,
          },
        });
      }
    }

    employees.push({ id: user.id, employeeId, years, regular });
  }

  console.log(JSON.stringify({ companyId: company.id, departmentId: department.id, shiftId: shift.id, employees }, null, 2));
}

main().finally(async () => prisma.$disconnect());
