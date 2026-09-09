import { SystemHealthRepository } from "../ports/SystemHealthRepository";
import { SystemHealthDTO } from "../dto/SystemHealthDTO";

export class GetSystemHealthUseCase {
  constructor(private readonly healthRepo: SystemHealthRepository) {}

  async execute(): Promise<SystemHealthDTO> {
    return this.healthRepo.getSystemHealth();
  }
}
