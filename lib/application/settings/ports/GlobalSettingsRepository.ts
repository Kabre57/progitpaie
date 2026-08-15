export interface GlobalSettingsRepository {
  getByKey<T = unknown>(key: string): Promise<T | null>;
  saveByKey<T>(key: string, value: T): Promise<void>;
}
