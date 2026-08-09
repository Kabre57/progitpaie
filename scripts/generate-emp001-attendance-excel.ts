import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const outputDir = path.join(process.cwd(), "pointages_EMP-001_2025_2026");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

let totalFiles = 0;

for (const m of months) {
  const daysInMonth = new Date(m.year, m.month, 0).getDate();
  const rows: any[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(m.year, m.month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Dimanche, 6 = Samedi

    // Ne générer que les jours ouvrés (du Lundi au Vendredi)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = m.year;
      const mm = String(m.month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      rows.push({
        Matricule: "EMP-001",
        "Nom & Prénoms": "Kouassi Jean",
        Date: dateStr,
        "Heure Entree": "08:00",
        "Heure Sortie": "17:00",
        Statut: "Présent",
        "Heures Supp (minutes)": 0,
        Notes: "Présence effectuée (8h)",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 15 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pointages");

  const filePath = path.join(outputDir, `pointages_EMP-001_${m.name}.xlsx`);
  XLSX.writeFile(workbook, filePath);
  totalFiles++;
}

console.log(`✅ ${totalFiles} fichiers Excel de pointage générés dans le dossier : ${outputDir}`);
