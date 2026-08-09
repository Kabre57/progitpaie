import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const outputDirs = [
  path.join(process.cwd(), "conges"),
  path.join(process.cwd(), "conges_EMP-001_EMP-002_EMP-003"),
];

outputDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const leaveRows = [
  // EMP-001
  {
    Matricule: "EMP-001",
    "Nom & Prénoms": "Kouassi Jean",
    "Type de Congé": "Congé Payé",
    "Date de Début": "2025-02-10",
    "Date de Fin": "2025-02-21",
    Motif: "Congé annuel légal première tranche 2025",
    Statut: "Validé",
  },
  {
    Matricule: "EMP-001",
    "Nom & Prénoms": "Kouassi Jean",
    "Type de Congé": "Congé Maladie",
    "Date de Début": "2025-06-02",
    "Date de Fin": "2025-06-04",
    Motif: "Repos médical sur certificat d'arrêt de travail",
    Statut: "Validé",
  },
  {
    Matricule: "EMP-001",
    "Nom & Prénoms": "Kouassi Jean",
    "Type de Congé": "Congé Payé",
    "Date de Début": "2026-03-09",
    "Date de Fin": "2026-03-20",
    Motif: "Congé annuel principal 2026",
    Statut: "Validé",
  },

  // EMP-002
  {
    Matricule: "EMP-002",
    "Nom & Prénoms": "KOUADIO Michel",
    "Type de Congé": "Permission Exceptionnelle",
    "Date de Début": "2025-04-14",
    "Date de Fin": "2025-04-16",
    Motif: "Événement familial grave (mariage)",
    Statut: "Validé",
  },
  {
    Matricule: "EMP-002",
    "Nom & Prénoms": "KOUADIO Michel",
    "Type de Congé": "Congé Payé",
    "Date de Début": "2025-08-04",
    "Date de Fin": "2025-08-22",
    Motif: "Congé payé annuel d'été 2025 (15 jours)",
    Statut: "Validé",
  },
  {
    Matricule: "EMP-002",
    "Nom & Prénoms": "KOUADIO Michel",
    "Type de Congé": "Congé Sans Solde",
    "Date de Début": "2026-01-12",
    "Date de Fin": "2026-01-16",
    Motif: "Convenance personnelle",
    Statut: "En attente",
  },

  // EMP-003
  {
    Matricule: "EMP-003",
    "Nom & Prénoms": "KOUAME Marc",
    "Type de Congé": "Congé Payé",
    "Date de Début": "2025-07-07",
    "Date de Fin": "2025-07-25",
    Motif: "Congé annuel d'été 2025",
    Statut: "Validé",
  },
  {
    Matricule: "EMP-003",
    "Nom & Prénoms": "KOUAME Marc",
    "Type de Congé": "Congé Maladie",
    "Date de Début": "2025-11-10",
    "Date de Fin": "2025-11-12",
    Motif: "Grippe saisonnière sous certificat",
    Statut: "Validé",
  },
  {
    Matricule: "EMP-003",
    "Nom & Prénoms": "KOUAME Marc",
    "Type de Congé": "Congé Payé",
    "Date de Début": "2026-07-06",
    "Date de Fin": "2026-07-24",
    Motif: "Demande de congé annuel principal 2026",
    Statut: "En attente",
  },
];

const worksheet = XLSX.utils.json_to_sheet(leaveRows);
worksheet["!cols"] = [
  { wch: 15 }, // Matricule
  { wch: 22 }, // Nom & Prénoms
  { wch: 26 }, // Type de Congé
  { wch: 16 }, // Date de Début
  { wch: 16 }, // Date de Fin
  { wch: 45 }, // Motif
  { wch: 15 }, // Statut
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Demandes de Congés");

outputDirs.forEach((dir) => {
  const filePath = path.join(dir, "demandes_conges_EMP-001_EMP-002_EMP-003.xlsx");
  XLSX.writeFile(workbook, filePath);
});

console.log(`✅ Fichiers de demandes de congés générés avec succès pour EMP-001, EMP-002 et EMP-003 dans :`);
outputDirs.forEach((dir) => console.log(` - ${dir}`));
