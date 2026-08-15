# Message de partage — Référentiel des agents IA PROGITPAIE

**Objet : Mise en place du référentiel `.agents/` pour les agents IA**

Bonjour à toutes et à tous,

Nous avons mis en place le référentiel `.agents/` dans le dépôt PROGITPAIE afin de fournir aux agents IA un cadre de travail commun, cohérent et sécurisé.

Le référentiel se trouve à la racine du projet :

```text
.agents/
├── AGENTS.md
├── skills/
│   ├── README.md
│   ├── SKILL.template.md
│   ├── clean-architecture/
│   ├── super-admin/
│   ├── payroll-calculator/
│   ├── testing/
│   ├── contract-negotiation/
│   ├── security-audit/
│   ├── leave-management/
│   ├── employee-onboarding/
│   └── expense-management/
└── adoption/
```

`AGENTS.md` contient les règles générales obligatoires du projet : Clean Architecture, TypeScript strict, absence de `any`, validation avec Zod, filtrage systématique par `companyId`, utilisation de `Money` pour les montants, tests par couche, RBAC, protection des secrets et headers de sécurité.

Les compétences `SKILL.md` donnent des consignes spécialisées pour les tâches d’architecture, d’administration, de paie, de tests, de sécurité, de contrats, d’absences, d’onboarding salarié et de dépenses. Il faut charger uniquement la compétence pertinente pour la tâche demandée.

Exemple de demande :

```text
Lis `.agents/AGENTS.md` et `.agents/skills/payroll-calculator/SKILL.md`.
Ajoute la nouvelle règle de calcul dans le domaine de la paie.
Respecte Money, companyId et l’architecture existante.
Ajoute les tests ciblés et ne modifie pas les fichiers hors périmètre.
```

Le référentiel ne remplace pas la revue de code ni l’expertise métier. Il sert à réduire les écarts de pratique, à rendre les demandes aux agents plus précises et à préserver les règles critiques du projet.

Merci de lire `.agents/AGENTS.md` avant toute intervention assistée par IA et de proposer une mise à jour du référentiel lorsqu’une nouvelle règle durable apparaît.

Cordialement,

**Équipe technique PROGITPAIE**
