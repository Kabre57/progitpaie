import type { GlobalSettingsRepository } from "../ports/GlobalSettingsRepository";

export class GetGlobalSettingUseCase {
  public constructor(private readonly repository: GlobalSettingsRepository) {}

  public execute<T = unknown>(key: string): Promise<T | null> {
    return this.repository.getByKey<T>(key);
  }
}

export class SaveGlobalSettingUseCase {
  public constructor(private readonly repository: GlobalSettingsRepository) {}

  public async execute<T>(key: string, value: T): Promise<T> {
    await this.repository.saveByKey(key, value);
    return value;
  }
}
