import { PrismaClient, UserRole, LeaveType, LeaveStatus, PayrollStatus, AttendanceStatus, EmployeeCategory, OvertimeStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LAST_NAMES = [
  "KOUASSI", "YAO", "KOFFI", "KONÉ", "DIALLO", "OUATTARA", "BAMBA", "N'GUESSAN", 
  "COULIBALY", "TOURÉ", "DIABATÉ", "BAKAYOKO", "AKA", "DIARRASSOUBA", "KOUAMÉ", 
  "KITA", "DOUBIA", "GNAHORÉ", "ZAHUI", "SÉKA", "BONY", "BOHOUSSOU", "AMANI", 
  "TRAORÉ", "CISSÉ", "SANOGO", "FADIGA", "SYLLA", "TIEBI", "ZOKOU", "KABRE"
];

const FIRST_NAMES_M = [
  "Theodore", "Joseph Eric", "Jean-Marc", "Kouadio Michel", "Yves", "Ibrahim", 
  "Abdoulaye", "Ousmane", "Seydou", "Yao Kan", "Sery", "Desire", "Emmanuel", 
  "Frederic", "Stephane", "Pascal", "Armand", "Serge", "Mamadou", "Adama"
];

const FIRST_NAMES_F = [
  "Awa", "Fatim", "Ahou Marie", "Clarisse", "Salimata", "Bintou", "Adjoua", 
  "Grace", "Patricia", "Veronique", "Nadine", "Mariam", "Djeneba", "Khadija", 
  "Aminata", "Affoue", "Amenan", "Christelle", "Edwige", "Solange"
];

const CITIES = [
  "Abidjan", "Bouaké", "Yamoussoukro", "Korhogo", "Daloa", "San-Pédro", 
  "Man", "Gagnoa", "Grand-Bassam", "Abengourou"
];

const ADDRESSES = [
  "Cocody, Riviera Palmeraie", "Yopougon Selmer", "Marcory Zone 4", 
  "Treichville Avenue 16", "Abobo PK18", "Port-Bouët Gonzagueville", 
  "Koumassi Remblais", "Bingerville Quartier Résidentiel", "Angré 8ème Tranche"
];

const DEPARTMENTS = [
  { name: "ADMINISTRATION", desc: "Direction Générale & Secrétariat" },
  { name: "INFORMATIQUE", desc: "Études & Développement Systèmes" },
  { name: "COMPTABILITE ET FINANCE", desc: "Gestion Financière & Fiscale" },
  { name: "COMMERCIAL ET MARKETING", desc: "Ventes & Relation Client" },
  { name: "RESSOURCES HUMAINES", desc: "Gestion du Personnel & Paie" },
  { name: "EXPLOITATION ET TECHNIQUE", desc: "Maintenance & Logistique" },
];

const SHIFTS = [
  { name: "Équipe Jour Standard", startTime: "07:30", endTime: "16:30", workingHours: 8.0, lateThresholdMinutes: 15 },
  { name: "Équipe Maintenance & Tech", startTime: "06:00", endTime: "15:00", workingHours: 8.0, lateThresholdMinutes: 15 },
  { name: "Équipe Support AST", startTime: "12:00", endTime: "21:00", workingHours: 8.0, lateThresholdMinutes: 15 },
  { name: "Équipe Sécurité Nuit", startTime: "20:00", endTime: "05:00", workingHours: 8.0, lateThresholdMinutes: 15 },
];

const JOBS = [
  { title: "Analyste Programmeur", category: "10A", enumCategory: EmployeeCategory.cadre, salary: 250000, sursalaire: 150000, dept: "INFORMATIQUE" },
  { title: "Développeur Fullstack", category: "10B", enumCategory: EmployeeCategory.cadre, salary: 300000, sursalaire: 200000, dept: "INFORMATIQUE" },
  { title: "Comptable Senior", category: "9A", enumCategory: EmployeeCategory.cadre, salary: 200000, sursalaire: 120000, dept: "COMPTABILITE ET FINANCE" },
  { title: "Assistant Comptable", category: "5", enumCategory: EmployeeCategory.employe, salary: 110000, sursalaire: 40000, dept: "COMPTABILITE ET FINANCE" },
  { title: "Responsable RH", category: "11", enumCategory: EmployeeCategory.cadre, salary: 400000, sursalaire: 350000, dept: "RESSOURCES HUMAINES" },
  { title: "Assistant RH", category: "6", enumCategory: EmployeeCategory.employe, salary: 120000, sursalaire: 50000, dept: "RESSOURCES HUMAINES" },
  { title: "Commercial Terrain", category: "4", enumCategory: EmployeeCategory.employe, salary: 90000, sursalaire: 60000, dept: "COMMERCIAL ET MARKETING" },
  { title: "Chef de Ventes", category: "10C", enumCategory: EmployeeCategory.maitrise, salary: 350000, sursalaire: 250000, dept: "COMMERCIAL ET MARKETING" },
  { title: "Technicien Réseau", category: "7A", enumCategory: EmployeeCategory.maitrise, salary: 130000, sursalaire: 70000, dept: "EXPLOITATION ET TECHNIQUE" },
  { title: "Secrétaire de Direction", category: "6", enumCategory: EmployeeCategory.employe, salary: 120000, sursalaire: 60000, dept: "ADMINISTRATION" },
  { title: "Chauffeur de Direction", category: "2", enumCategory: EmployeeCategory.ouvrier, salary: 85000, sursalaire: 35000, dept: "ADMINISTRATION" },
  { title: "Agent de Sécurité", category: "1B", enumCategory: EmployeeCategory.ouvrier, salary: 75000, sursalaire: 25000, dept: "ADMINISTRATION" },
];

const BANKS = [
  "SOCIETE GENERALE CI", "BICICI", "NSIA BANQUE", "SIB", 
  "BACI", "ECOBANK", "BOA", "UBA"
];

async function main() {
  console.log("🚀 Démarrage de la génération complète des 111 Salariés Ivoiriens...");

  // 0. Créer ou récupérer l'entreprise par défaut
  let defaultCompany = await prisma.company.findFirst();
  if (!defaultCompany) {
    defaultCompany = await prisma.company.create({
      data: {
        name: "PROGITPAIE SA",
        sigle: "PROGITPAIE",
        ccNumber: "CC-2026-CI-998877",
        cnpsNumber: "CNPS-88776655",
        address: "Abidjan Plateau, Boulevard Botreau Roussel",
        city: "Abidjan",
        phone: "+225 07 00 00 00 00",
        email: "contact@progitpaie.ci",
      },
    });
  }

  // 1. Créer les départements
  const deptMap = new Map<string, string>();
  for (const d of DEPARTMENTS) {
    const existing = await prisma.department.findFirst({ where: { name: d.name, companyId: defaultCompany.id } });
    if (existing) {
      deptMap.set(d.name, existing.id);
    } else {
      const created = await prisma.department.create({
        data: {
          name: d.name,
          description: d.desc,
          companyId: defaultCompany.id,
        },
      });
      deptMap.set(d.name, created.id);
    }
  }

  // 2. Créer les Horaires / Shifts de travail
  const shiftList = [];
  for (const s of SHIFTS) {
    const existing = await prisma.shift.findFirst({ where: { name: s.name, companyId: defaultCompany.id } });
    if (existing) {
      shiftList.push(existing);
    } else {
      const created = await prisma.shift.create({
        data: {
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          workingHours: s.workingHours,
          lateThresholdMinutes: s.lateThresholdMinutes,
          companyId: defaultCompany.id,
        },
      });
      shiftList.push(created);
    }
  }

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 3. Génération des 111 Salariés Ivoiriens rattachés aux Shifts
  const createdUsers = [];

  for (let i = 1; i <= 111; i++) {
    const isFemale = i % 3 === 0;
    const civility = isFemale ? (i % 2 === 0 ? "Mme" : "Mlle") : "M.";
    const gender = isFemale ? "F" : "M";

    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const firstNameList = isFemale ? FIRST_NAMES_F : FIRST_NAMES_M;
    const firstName = firstNameList[i % firstNameList.length];
    const fullName = `${lastName} ${firstName}`;

    const empCode = `EMP-${(100 + i).toString()}`;
    const email = `${firstName.toLowerCase().replace(/[^a-z]/g, "")}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}${i}@progitpaie.ci`;

    const job = JOBS[i % JOBS.length];
    const deptId = deptMap.get(job.dept);
    const assignedShift = shiftList[i % shiftList.length];

    const startYear = 2020 + (i % 6);
    const startMonth = (i % 12);
    const joiningDate = new Date(startYear, startMonth, 1);

    const birthYear = 1975 + (i % 25);
    const birthDate = new Date(birthYear, (i * 2) % 12, (i * 3) % 28 + 1);

    const baseSalary = job.salary + (i % 10) * 10000;
    const sursalaire = job.sursalaire + (i % 5) * 15000;
    const partsIGR = 1.0 + (i % 8) * 0.5;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        shiftId: assignedShift.id,
      },
      create: {
        name: fullName,
        email,
        password: hashedPassword,
        role: UserRole.employee,
        employeeId: empCode,
        companyId: defaultCompany.id,
        departmentId: deptId,
        shiftId: assignedShift.id,
        salary: baseSalary,
        sursalaire,
        partsIGR,
        transportAllowance: 30000,
        joiningDate,
        civility,
        gender,
        birthDate,
        birthPlace: CITIES[i % CITIES.length],
        idCardType: "CNI",
        idCardNumber: `C${(10000000 + i * 1234).toString()}`,
        nationality: "IVOIRIENNE",
        maritalStatus: isFemale ? "Mariée" : "Célibataire",
        childrenCount: i % 5,
        address: ADDRESSES[i % ADDRESSES.length],
        phone: `07${(10000000 + i * 8888).toString().substring(0, 8)}`,
        contractType: i % 10 === 0 ? "CDD" : "CDI",
        direction: job.dept,
        service: job.dept === "INFORMATIQUE" ? "DÉVELOPPEMENT" : "EXÉCUTIF",
        jobTitle: job.title,
        category: job.category,
        cnpsNumber: `CNPS${(9000000 + i * 5555).toString()}`,
        paymentMethod: "Virement",
        bankName: BANKS[i % BANKS.length],
        bankAccount: `CI092 01001 ${(10000000000 + i * 999).toString()} 01`,
        leaveBalanceAnnual: 22,
        leaveBalanceSick: 10,
        leaveBalanceCasual: 5,
      },
    });

    createdUsers.push(user);
  }

  console.log(`✅ ${createdUsers.length} salariés enregistrés et rattachés aux plannings.`);

  // 4. Génération des demandes d'Heures Supplémentaires (Overtime)
  console.log("⏱️ Génération des demandes d'heures supplémentaires (Overtime)...");
  let overtimeCount = 0;

  for (let idx = 0; idx < createdUsers.length; idx++) {
    const emp = createdUsers[idx];
    if (idx % 3 === 0) {
      await prisma.overtime.create({
        data: {
          companyId: defaultCompany.id,
          userId: emp.id,
          date: new Date(2026, 6, 15),
          minutes: 120, // 2 heures supp (+15%)
          rate: 1.15,
          reason: "Clôture fiscale du mois et arrêtés des comptes",
          status: OvertimeStatus.approved,
        },
      });
      overtimeCount++;
    }
    if (idx % 5 === 0) {
      await prisma.overtime.create({
        data: {
          companyId: defaultCompany.id,
          userId: emp.id,
          date: new Date(2026, 6, 20),
          minutes: 240, // 4 heures supp (+50%)
          rate: 1.50,
          reason: "Intervention technique réseau et serveur un samedi",
          status: OvertimeStatus.approved,
        },
      });
      overtimeCount++;
    }
    if (idx % 7 === 0) {
      await prisma.overtime.create({
        data: {
          companyId: defaultCompany.id,
          userId: emp.id,
          date: new Date(2026, 6, 26),
          minutes: 180, // 3 heures supp (+100%)
          rate: 2.00,
          reason: "Urgence paie et assistance dimanche",
          status: OvertimeStatus.pending,
        },
      });
      overtimeCount++;
    }
  }

  console.log(`✅ ${overtimeCount} demandes d'heures supplémentaires créées.`);
  console.log("🎉 Génération complète du Planning & Heures Supp exécutée avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant le seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
