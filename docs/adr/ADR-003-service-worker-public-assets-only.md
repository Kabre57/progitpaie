# ADR-003 — Cache du service worker limité aux actifs publics

- Statut : accepté
- Date : 2026-08-03

Le service worker ne traite plus les routes API, administrateur, employé ou toute
autre navigation authentifiée. Seuls les actifs publics listés explicitement et
les ressources statiques versionnées de Next.js peuvent entrer dans Cache Storage.
Cette décision empêche la restitution hors ligne de données d'une session après
déconnexion ou changement d'utilisateur sur le même appareil.
