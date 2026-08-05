import { LeaveRepository, ListLeavesQuery } from "../ports/LeaveRepository";
import { LeaveDTO } from "../dto/LeaveDTO";
import { toLeaveDTO } from "../mappers/leave-dto.mapper";

export class ListLeavesUseCase {
  constructor(private readonly repository: LeaveRepository) {}

  public async execute(query: ListLeavesQuery): Promise<readonly LeaveDTO[]> {
    const list = await this.repository.list(query);
    return list.map((item) => toLeaveDTO(item));
  }
}
