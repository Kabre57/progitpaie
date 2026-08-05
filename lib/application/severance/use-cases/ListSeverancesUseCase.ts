import { SeveranceRepository, ListSeverancesQuery } from "../ports/SeveranceRepository";
import { SeveranceDTO } from "../dto/SeveranceDTO";
import { toSeveranceDTO } from "../mappers/severance-dto.mapper";

export class ListSeverancesUseCase {
  constructor(private readonly repository: SeveranceRepository) {}

  public async execute(query: ListSeverancesQuery): Promise<readonly SeveranceDTO[]> {
    const list = await this.repository.list(query);
    return list.map((item) => toSeveranceDTO(item));
  }
}
