# Skill — Clean Architecture
## Gestionnaire de paquets obligatoire

Utiliser exclusivement **pnpm 11.21.0** dans PROGITPAIE. Ne jamais utiliser `npm`, `npx` ou Yarn. Utiliser `pnpm`, `pnpm exec` et `pnpm-lock.yaml`.


## Objectif
Concevoir ou refactorer une fonctionnalité selon les quatre couches de PROGITPAIE : Domain, Application, Infrastructure et Presentation.

## Règles
Les dépendances pointent vers l’intérieur. Le Domain reste pur et ne connaît ni Next.js ni Prisma. L’Application dépend de ports et de DTO, jamais d’implémentations concrètes. L’Infrastructure implémente les ports et réalise les mappings. La Presentation valide, authentifie, compose et sérialise.

## Procédure
1. Identifier l’invariant métier et le bounded context concerné.
2. Créer ou réutiliser les entités et value objects dans `lib/domain/`.
3. Définir le port dans `lib/application/*/ports/` et le cas d’utilisation dans `use-cases/`.
4. Implémenter le repository ou service dans `lib/infrastructure/` avec mapping explicite.
5. Ajouter le contrat Zod et la route versionnée dans `app/api/v2/`.
6. Tester chaque frontière et l’isolation `companyId`.

## Exemple
```ts
export interface EmployeeRepository {
  findById(companyId: string, id: string): Promise<Employee | null>;
}

export class GetEmployeeUseCase {
  constructor(private readonly repository: EmployeeRepository) {}
  execute(companyId: string, id: string) {
    return this.repository.findById(companyId, id);
  }
}
```

## Interdits
Importer `PrismaClient` dans le Domain ou l’Application, mettre des règles métier dans une route, retourner directement un modèle Prisma ou créer un second mécanisme d’injection.

## Checklist
- [ ] Invariants dans le Domain.
- [ ] Port et cas d’utilisation dans l’Application.
- [ ] Adaptateur concret dans l’Infrastructure.
- [ ] Validation et autorisation dans la Presentation.
- [ ] Tests de couche et de contrat ajoutés.
