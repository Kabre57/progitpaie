import type {
  PublicEmployeeDirectoryQuery,
  PublicEmployeeDirectoryRepository,
  PublicEmployeeDirectoryResult,
} from "../ports/PublicEmployeeDirectoryRepository";

export class ListPublicEmployeeDirectoryUseCase {
  public constructor(private readonly repository: PublicEmployeeDirectoryRepository) {}

  public execute(query: PublicEmployeeDirectoryQuery): Promise<PublicEmployeeDirectoryResult> {
    return this.repository.list(query);
  }
}
