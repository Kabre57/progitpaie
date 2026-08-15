import * as fs from "node:fs";
import * as path from "node:path";
import ExcelJS from "exceljs";

const { Workbook } = ExcelJS;

interface LeaveExportRow {
  Matricule: string;
  "Nom & Prénoms": string;
  "Type de Congé": string;
  "Date de Début": string;
  "Date de Fin": string;
  Motif: string;
  Statut: string;
}

const outputDirs = [
  path.join(process.cwd(), "conges"),
  path.join(process.cwd(), "conges_EMP-001_EMP-002_EMP-003"),
] as const;

const leaveRows: LeaveExportRow[] = [
  { Matricule: "EMP-001", "Nom & Prénoms": "Kouassi Jean", "Type de Congé": "Congé Payé", "Date de Début": "2025-02-10", "Date de Fin": "2025-02-21", Motif: "Congé annuel légal première tranche 2025", Statut: "Validé" },
  { Matricule: "EMP-001", "Nom & Prénoms": "Kouassi Jean", "Type de Congé": "Congé Maladie", "Date de Début": "2025-06-02", "Date de Fin": "2025-06-04", Motif: "Repos médical sur certificat d'arrêt de travail", Statut: "Validé" },
  { Matricule: "EMP-001", "Nom & Prénoms": "Kouassi Jean", "Type de Congé": "Congé Payé", "Date de Début": "2026-03-09", "Date de Fin": "2026-03-20", Motif: "Congé annuel principal 2026", Statut: "Validé" },
  { Matricule: "EMP-002", "Nom & Prénoms": "KOUADIO Michel", "Type de Congé": "Permission Exceptionnelle", "Date de Début": "2025-04-14", "Date de Fin": "2025-04-16", Motif: "Événement familial grave (mariage)", Statut: "Validé" },
  { Matricule: "EMP-002", "Nom & Prénoms": "KOUADIO Michel", "Type de Congé": "Congé Payé", "Date de Début": "2025-08-04", "Date de Fin": "2025-08-22", Motif: "Congé payé annuel d'été 2025 (15 jours)", Statut: "Validé" },
  { Matricule: "EMP-002", "Nom & Prénoms": "KOUADIO Michel", "Type de Congé": "Congé Sans Solde", "Date de Début": "2026-01-12", "Date de Fin": "2026-01-16", Motif: "Convenance personnelle", Statut: "En attente" },
  { Matricule: "EMP-003", "Nom & Prénoms": "KOUAME Marc", "Type de Congé": "Congé Payé", "Date de Début": "2025-07-07", "Date de Fin": "2025-07-25", Motif: "Congé annuel d'été 2025", Statut: "Validé" },
  { Matricule: "EMP-003", "Nom & Prénoms": "KOUAME Marc", "Type de Congé": "Congé Maladie", "Date de Début": "2025-11-10", "Date de Fin": "2025-11-12", Motif: "Grippe saisonnière sous certificat", Statut: "Validé" },
  { Matricule: "EMP-003", "Nom & Prénoms": "KOUAME Marc", "Type de Congé": "Congé Payé", "Date de Début": "2026-07-06", "Date de Fin": "2026-07-24", Motif: "Demande de congé annuel principal 2026", Statut: "En attente" },
];

async function generateLeaveFiles(): Promise<void> {
  outputDirs.forEach((directory) => fs.mkdirSync(directory, { recursive: true }));

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Demandes de Congés", { views: [{ state: "frozen", ySplit: 1 }] });
  worksheet.columns = [
    { header: "Matricule", key: "Matricule", width: 15 },
    { header: "Nom & Prénoms", key: "Nom & Prénoms", width: 22 },
    { header: "Type de Congé", key: "Type de Congé", width: 26 },
    { header: "Date de Début", key: "Date de Début", width: 16 },
    { header: "Date de Fin", key: "Date de Fin", width: 16 },
    { header: "Motif", key: "Motif", width: 45 },
    { header: "Statut", key: "Statut", width: 15 },
  ];
  leaveRows.forEach((row) => worksheet.addRow(row));

  await Promise.all(outputDirs.map(async (directory) => {
    await workbook.xlsx.writeFile(path.join(directory, "demandes_conges_EMP-001_EMP-002_EMP-003.xlsx"));
  }));

  console.log("✅ Fichiers de demandes de congés générés avec succès pour EMP-001, EMP-002 et EMP-003 dans :");
  outputDirs.forEach((directory) => console.log(` - ${directory}`));
}

generateLeaveFiles().catch((error: unknown) => {
  console.error("Échec de génération des demandes de congé :", error);
  process.exitCode = 1;
});
