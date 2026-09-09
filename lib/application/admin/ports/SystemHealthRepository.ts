import { SystemHealthDTO } from "../dto/SystemHealthDTO";

export interface SystemHealthRepository {
  getSystemHealth(): Promise<SystemHealthDTO>;
}
