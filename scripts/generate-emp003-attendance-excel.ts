import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const outputDirs = [
  path.join(process.cwd(), "pointages", "EMP-003_2025_2026"),
  path.join(process.cwd(), "pointages_EMP-003_2025_2026"),
];

outputDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const months = [
  { year: 2025, month: 1, name: "01_janvier_2025" },
  { year: 2025, month: 2, name: "02_fevrier_2025" },
  { year: 2025, month: 3, name: "03_mars_2025" },
  { year: 2025, month: 4, name: "04_avril_2025" },
  { year: 2025, month: 5, name: "05_mai_2025" },
  { year: 2025, month: 6, name: "06_juin_2025" },
  { year: 2025, month: 7, name: "07_juillet_2025" },
  { year: 2025, month: 8, name: "08_aout_2025" },
  { year: 2025, month: 9, name: "09_septembre_2025" },
  { year: 2025, month: 10, name: "10_octobre_2025" },
  { year: 2025, month: 11, name: "11_novembre_2025" },
  { year: 2025, month: 12, name: "12_decembre_2025" },
  { year: 2026, month: 1, name: "01_janvier_2026" },
  { year: 2026, month: 2, name: "02_fevrier_2026" },
  { year: 2026, month: 3, name: "03_mars_2026" },
  { year: 2026, month: 4, name: "04_avril_2026" },
  { year: 2026, month: 5, name: "05_mai_2026" },
  { year: 2026, month: 6, name: "06_juin_2026" },
  { year: 2026, month: 7, name: "07_juillet_2026" },
  { year: 2026, month: 8, name: "08_aout_2026" },
];

let totalGenerated = 0;

for (const m of months) {
  const daysInMonth = new Date(m.year, m.month, 0).getDate();
  const rows: any[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(m.year, m.month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Dimanche, 6 = Samedi
    const yyyy = m.year;
    const mm = String(m.month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Test des 5 tranches légales d'heures supplémentaires
    if (day === 5 && dayOfWeek !== 0) {
      // Tranche 1: +15% (Heures supp de jour 41h-46h)
      rows.push({
        Matricule: "EMP-003",
        "Nom & Prénoms": "KOUAME Marc",
        Date: dateStr,
        "Heure Entree": "08:00",
        "Heure Sortie": "19:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 120,
        "Taux Majoration": "15%",
        "Motif Heures Supp": "Prolongation de journée (+15%)",
        Notes: "Présence 8h + 2h Supp 15%",
      });
    } else if (day === 12 && dayOfWeek !== 0) {
      // Tranche 2: +50% (Heures supp de jour au-delà de 46h)
      rows.push({
        Matricule: "EMP-003",
        "Nom & Prénoms": "KOUAME Marc",
        Date: dateStr,
        "Heure Entree": "08:00",
        "Heure Sortie": "20:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 180,
        "Taux Majoration": "50%",
        "Motif Heures Supp": "Travail intensif fin de projet (+50%)",
        Notes: "Présence 8h + 3h Supp 50%",
      });
    } else if (day === 18 && dayOfWeek !== 0) {
      // Tranche 3: +75% Nuit (Heures de nuit jour ouvrable 21h-05h)
      rows.push({
        Matricule: "EMP-003",
        "Nom & Prénoms": "KOUAME Marc",
        Date: dateStr,
        "Heure Entree": "08:00",
        "Heure Sortie": "23:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 120,
        "Taux Majoration": "75% Nuit",
        "Motif Heures Supp": "Maintenance système de nuit (+75% Nuit)",
        Notes: "Présence 8h + 2h Supp Nuit 75%",
      });
    } else if (dayOfWeek === 0 && day === 15) {
      // Tranche 4: +75% Dimanche/Férié (Jour Dimanche ou Férié)
      rows.push({
        Matricule: "EMP-003",
        "Nom & Prénoms": "KOUAME Marc",
        Date: dateStr,
        "Heure Entree": "09:00",
        "Heure Sortie": "13:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 240,
        "Taux Majoration": "75% Dimanche",
        "Motif Heures Supp": "Permanence dominicale (+75% Dimanche)",
        Notes: "Travail dimanche jour 4h Supp 75%",
      });
    } else if (dayOfWeek === 0 && day === 22) {
      // Tranche 5: +100% Nuit Férié (Nuit Dimanche ou Férié)
      rows.push({
        Matricule: "EMP-003",
        "Nom & Prénoms": "KOUAME Marc",
        Date: dateStr,
        "Heure Entree": "21:00",
        "Heure Sortie": "00:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 180,
        "Taux Majoration": "100% Nuit Férié",
        "Motif Heures Supp": "Urgence paie et assistance dimanche nuit (+100%)",
        Notes: "Intervention nuit dimanche 3h Supp 100%",
      });
    } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Jour ouvrable standard (Lundi à Vendredi)
      rows.push({
        Matricule: "EMP-003",
        "Nom & Prénoms": "KOUAME Marc",
        Date: dateStr,
        "Heure Entree": "08:00",
        "Heure Sortie": "17:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 0,
        "Taux Majoration": "",
        "Motif Heures Supp": "",
        Notes: "Présence effectuée (8h)",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 15 }, // Matricule
    { wch: 22 }, // Nom & Prénoms
    { wch: 14 }, // Date
    { wch: 14 }, // Heure Entree
    { wch: 14 }, // Heure Sortie
    { wch: 14 }, // Statut
    { wch: 22 }, // Heures Supp (minutes)
    { wch: 20 }, // Taux Majoration
    { wch: 35 }, // Motif Heures Supp
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pointages");

  outputDirs.forEach((dir) => {
    const filePath = path.join(dir, `pointages_EMP-003_${m.name}.xlsx`);
    XLSX.writeFile(workbook, filePath);
  });

  totalGenerated++;
}

console.log(`✅ ${totalGenerated} fichiers Excel générés pour EMP-003 dans :`);
outputDirs.forEach((dir) => console.log(` - ${dir}`));
