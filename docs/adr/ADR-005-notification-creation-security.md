# ADR-005 — Création de notifications réservée aux administrateurs du tenant

- Statut : accepté
- Date : 2026-08-03

Le `POST /api/notifications` exige une session administrateur active, applique
une limite de 30 créations par minute et valide strictement son entrée. Le
destinataire doit être un salarié actif de la même société. Les liens externes
sont refusés afin de prévenir les redirections malveillantes.
