export interface DefaultPermissionItem {
  name: string;
  code: string;
  action: "read" | "create" | "update" | "delete" | "approve" | "export" | "custom";
  description: string;
}

export interface DefaultModuleItem {
  name: string;
  code: string;
  description: string;
  icon: string;
  permissions: DefaultPermissionItem[];
}

export const DEFAULT_PERMISSION_CATALOG: DefaultModuleItem[] = [
  {
    name: "Salariés & Personnel",
    code: "employees",
    description: "Gestion des fiches du personnel, coordonnées et carrières",
    icon: "Users",
    permissions: [
      { name: "Consulter les salariés", code: "employees.read", action: "read", description: "Accès à la liste et aux fiches des employés" },
      { name: "Créer un salarié", code: "employees.create", action: "create", description: "Ajouter de nouveaux salariés" },
      { name: "Modifier les salariés", code: "employees.update", action: "update", description: "Modifier les informations administratives et salariales" },
      { name: "Supprimer / Archiver", code: "employees.delete", action: "delete", description: "Archiver ou supprimer un compte salarié" },
      { name: "Exporter l'annuaire", code: "employees.export", action: "export", description: "Exporter la liste des salariés en Excel ou PDF" },
    ],
  },
  {
    name: "Pointages & Présences",
    code: "attendance",
    description: "Suivi des pointages quotidiens, retards et présences géolocalisées",
    icon: "ClipboardCheck",
    permissions: [
      { name: "Consulter les pointages", code: "attendance.read", action: "read", description: "Voir l'historique et le tableau des présences" },
      { name: "Pointage manuel", code: "attendance.create", action: "create", description: "Pointer manuellement pour un salarié" },
      { name: "Régulariser les anomalies", code: "attendance.override", action: "update", description: "Modifier les heures et justifier les retards" },
      { name: "Exporter les feuilles d'heures", code: "attendance.export", action: "export", description: "Générer les rapports de présence mensuels" },
    ],
  },
  {
    name: "Congés & Absences",
    code: "leaves",
    description: "Gestion des demandes de congés, soldes et justificatifs d'absence",
    icon: "Calendar",
    permissions: [
      { name: "Consulter le planning congés", code: "leaves.read", action: "read", description: "Voir le calendrier et les soldes de congés" },
      { name: "Poser un congé pour autrui", code: "leaves.apply", action: "create", description: "Enregistrer une absence pour un collaborateur" },
      { name: "Valider les congés (N1/N2)", code: "leaves.approve", action: "approve", description: "Approuver ou rejeter les demandes de congés" },
      { name: "Ajuster les soldes annuels", code: "leaves.update", action: "update", description: "Créditer ou débiter manuellement les jours de congés" },
    ],
  },
  {
    name: "Gestion de la Paie",
    code: "payroll",
    description: "Calculs salariaux, génération des bulletins et clôture de paie",
    icon: "DollarSign",
    permissions: [
      { name: "Consulter les bulletins", code: "payroll.read", action: "read", description: "Accéder aux états de salaires et fiches de paie" },
      { name: "Calculer la paie mensuelle", code: "payroll.calculate", action: "create", description: "Lancer le moteur de calcul des cotisations et impôts" },
      { name: "Clôturer la période de paie", code: "payroll.close", action: "update", description: "Valider définitivement les salaires du mois" },
      { name: "Exporter les bulletins (PDF/Excel)", code: "payroll.export", action: "export", description: "Télécharger les fiches de paie et le livre de paie" },
    ],
  },
  {
    name: "Contrats de Travail",
    code: "contracts",
    description: "Génération, suivi et renouvellement des contrats CDI, CDD, Stages",
    icon: "FileText",
    permissions: [
      { name: "Consulter les contrats", code: "contracts.read", action: "read", description: "Voir la liste des contrats en cours et passés" },
      { name: "Créer un nouveau contrat", code: "contracts.create", action: "create", description: "Générer un contrat ou une lettre d'embauche" },
      { name: "Modifier / Renouveler", code: "contracts.update", action: "update", description: "Avenants et renouvellements de contrats" },
      { name: "Supprimer un contrat", code: "contracts.delete", action: "delete", description: "Supprimer un projet de contrat" },
    ],
  },
  {
    name: "Heures Supplémentaires",
    code: "overtime",
    description: "Validation et majorations des heures supplémentaires",
    icon: "Timer",
    permissions: [
      { name: "Consulter les heures supp", code: "overtime.read", action: "read", description: "Voir les déclarations d'heures supplémentaires" },
      { name: "Saisir des heures supp", code: "overtime.create", action: "create", description: "Déclarer des heures effectuées au-delà du forfait" },
      { name: "Valider et majorer", code: "overtime.approve", action: "approve", description: "Approuver pour intégration sur le bulletin de paie" },
    ],
  },
  {
    name: "Prêts & Avances",
    code: "loans",
    description: "Octroi d'avances sur salaire, prêts entreprise et échéanciers",
    icon: "CreditCard",
    permissions: [
      { name: "Consulter les prêts", code: "loans.read", action: "read", description: "Voir les demandes de prêts et l'état des remboursements" },
      { name: "Créer un prêt ou une avance", code: "loans.create", action: "create", description: "Enregistrer une demande avec échéancier" },
      { name: "Valider le déblocage", code: "loans.approve", action: "approve", description: "Approuver le prêt pour déduction automatique en paie" },
    ],
  },
  {
    name: "Déclarations Fiscales & Sociales",
    code: "declarations",
    description: "États récapitulatifs DGI, DISA, FDFP et cotisations CNPS",
    icon: "FileSpreadsheet",
    permissions: [
      { name: "Consulter les déclarations", code: "declarations.read", action: "read", description: "Voir l'historique des déclarations fiscales et CNPS" },
      { name: "Générer les déclarations officielles", code: "declarations.generate", action: "export", description: "Générer et télécharger les états officiels" },
    ],
  },
  {
    name: "Comptabilité & RNS CNPS",
    code: "accounting",
    description: "Écritures comptables OHADA et relevé nominatif de salaire",
    icon: "BookOpen",
    permissions: [
      { name: "Consulter les écritures", code: "accounting.read", action: "read", description: "Visualiser le journal comptable de paie" },
      { name: "Exporter le journal comptable", code: "accounting.export", action: "export", description: "Exporter les écritures pour logiciel tiers" },
      { name: "Gérer le Relevé RNS", code: "rns.manage", action: "update", description: "Éditer et exporter le relevé nominatif CNPS" },
    ],
  },
  {
    name: "Paramètres & Sécurité",
    code: "settings",
    description: "Configuration de la société, gestion des rôles et clés d'accès",
    icon: "Settings",
    permissions: [
      { name: "Consulter les paramètres", code: "settings.read", action: "read", description: "Voir la configuration de l'entreprise" },
      { name: "Modifier les paramètres généraux", code: "settings.manage", action: "update", description: "Mettre à jour les taux, horaires et coordonnées" },
      { name: "Gérer les Rôles & Permissions", code: "roles.manage", action: "update", description: "Créer des rôles et modifier le catalogue de permissions" },
    ],
  },
];
