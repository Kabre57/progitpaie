---
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.

name: progitpaie-agents-institutionalization
description: Institutionalize an AI-agent repository for a software team by producing a concise sharing message, a practical 30-minute training plan, a process for adding functional skills, and a lightweight maintenance calendar. Use when a team has an AGENTS.md plus skills/ and needs adoption, onboarding, governance, or recurring maintenance documentation.
---

# PROGITPAIE Agents Institutionalization

## Purpose

Transform an existing `.agents/` repository into an adopted team practice. Produce four ready-to-share deliverables: a team announcement, a 30-minute practical training plan, a repeatable process for adding functional skills, and a lightweight maintenance calendar.

Treat the existing `AGENTS.md` as the primary source of project rules. Treat each `skills/*/SKILL.md` as a specialized procedure. Do not invent project rules that are not supported by the repository or explicitly provided by the user.

## Inputs to collect

Before writing, inspect the repository and identify:

- the location and version of `.agents/AGENTS.md`;
- the skill catalog, including `README.md`, `SKILL.template.md`, and existing `SKILL.md` files;
- any existing sharing, onboarding, or maintenance guidance;
- the project stack, architecture, security rules, testing commands, and naming conventions;
- the intended audience, communication channel, and team responsibilities.

If the repository is unavailable, use the user-provided context and clearly mark assumptions. Do not claim to have inspected files that were not available.

## Deliverables

Create these four Markdown documents, preferably under `.agents/adoption/` or another user-specified documentation directory:

1. `01-MESSAGE-PARTAGE.md` — concise email or Slack message.
2. `02-PLAN-FORMATION-30-MIN.md` — timed practical session.
3. `03-PROCESSUS-AJOUT-COMPETENCE.md` — repeatable skill creation process.
4. `04-CALENDRIER-MAINTENANCE.md` — maintenance cadence and checklist.

Create an archive only when useful for distribution. Do not create PDF or slides unless explicitly requested.

## Workflow

Follow this sequence:

1. **Inspect the repository.** Read `AGENTS.md`, the skill catalog, and relevant maintenance files. List the actual skills instead of relying on assumptions.
2. **Extract the non-negotiables.** Summarize rules such as architecture boundaries, strict typing, validation, tenant isolation, money handling, tests, RBAC, secrets, and security headers. Only include rules supported by the source files.
3. **Map the audience.** Distinguish developers, reviewers, technical leads, and business referents. Assign responsibilities without creating unnecessary bureaucracy.
4. **Write the sharing message.** Explain what `.agents/` is, where it lives, why it matters, the critical rules, the available skills, and how to select one. Keep it short enough for email or Slack.
5. **Write the training plan.** Use a 30-minute schedule with timed sections. Include a repository tour, critical rules, a live prompt, the practical exercise “Add a new use case”, review criteria, recap, and Q&A.
6. **Write the skill-addition process.** Require domain identification, reuse of `SKILL.template.md`, explicit scope, architecture and security rules, tests, catalog update, review, and versioning. Include candidate functional skills only when relevant to the project.
7. **Write the maintenance calendar.** Use lightweight frequencies: per feature, per code review, weekly or monthly check, quarterly review, and major-release review. Include a concise checklist for paths, roles, commands, tests, security, tenant rules, and stale skills.
8. **Cross-check the documents.** Verify that names, paths, commands, roles, and skill counts match the repository. Ensure the training demonstrates a realistic task and that the maintenance plan is feasible.
9. **Report the result.** List created or modified files, checks performed, assumptions, and any follow-up decisions needed from the team.

## Required content patterns

### Sharing message

Include:

- a clear subject or opening line;
- repository location, such as `.agents/`;
- purpose and benefits;
- non-negotiable rules;
- available skills grouped by technical and functional domain;
- one concrete prompt example;
- a reminder that agents do not replace code review or business validation.

Keep the message concise. Prefer a short table or compact list over a long explanation.

### 30-minute training

Use this default schedule and adapt it to the repository:

| Time | Topic |
|---:|---|
| 0–3 min | Why the repository exists |
| 3–8 min | `AGENTS.md`, `skills/`, template, catalog, maintenance guide |
| 8–13 min | Non-negotiable architecture, security, tenant, typing, validation, money, and test rules |
| 13–18 min | Demonstration with a targeted agent prompt |
| 18–25 min | Practical exercise: add a new use case |
| 25–28 min | Review diff, tests, permissions, and tenant isolation |
| 28–30 min | Recap and Q&A |

The practical exercise must specify a bounded scope, relevant skill, allowed files, forbidden changes, and targeted validation commands.

### Adding a functional skill

Require these steps:

1. Identify the domain and confirm that an existing skill does not already cover it.
2. Create a `kebab-case` directory and copy `SKILL.template.md`.
3. Write objective, scope, architecture layers, business rules, security, examples, tests, and completion checklist.
4. Update the skill catalog and any adoption report.
5. Obtain technical and domain review when the skill contains business or regulatory rules.
6. Add implementation and regression tests for critical rules.
7. Version and commit the skill with the related code.
8. Announce the new skill to the team.

### Maintenance calendar

Use a low-overhead cadence:

- **Every feature:** ask whether a durable rule or skill update is needed.
- **Every code review:** check whether the change invalidates `.agents/` guidance.
- **Monthly:** review paths, roles, commands, tests, security, `companyId`, validation, money rules, and stale examples.
- **Quarterly:** review architecture, security, skill usefulness, obsolete guidance, and future functional skills.
- **Major release:** update repository and skill versions and record important changes.

Trigger an immediate update after a security incident, regulatory payroll change, architecture change, repeated agent mistake, or newly discovered tenant-isolation rule.

## Quality and safety rules

- Do not expose secrets, credentials, personal data, salary data, or internal tokens in examples or documents.
- Do not weaken `AGENTS.md` rules to make adoption easier.
- Do not present an assumed role, command, path, or skill as fact without checking the repository.
- Keep deliverables concise and practical; avoid generic process language that no one can execute.
- Ensure every new recommendation has an owner, a trigger, or a review point.
- Prefer Markdown files that can be committed and reviewed with the code.
- Do not add `README.md`, `CHANGELOG.md`, or unrelated auxiliary files inside a packaged Manus skill.

## Validation checklist

Before delivery, verify:

- [ ] The four deliverables exist and are non-empty.
- [ ] The sharing message names the real `.agents/` location and current skills.
- [ ] The training plan totals exactly 30 minutes.
- [ ] The practical exercise is concrete and uses a realistic new use case.
- [ ] The skill-addition process mentions `SKILL.template.md`, catalog update, review, tests, and versioning.
- [ ] The maintenance calendar includes feature-level, monthly, quarterly, and major-release actions.
- [ ] The documents preserve the project’s non-negotiable rules.
- [ ] Paths, commands, roles, and skill names were cross-checked against the repository.
- [ ] No secrets or unnecessary personal data are present.

## Suggested final report

Use this concise format when reporting completion:

```text
## Livrables
- [path] — [purpose]

## Vérifications
- [check] — [result]

## Hypothèses ou décisions attendues
- [item]
```
