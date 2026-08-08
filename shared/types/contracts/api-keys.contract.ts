export interface ApiKeyPermissionsDTO {
  [key: string]: boolean | string[] | undefined;
}

export interface ApiKeyItemDTO {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: Record<string, boolean> | string[] | ApiKeyPermissionsDTO;
  lastUsedAt?: string;
  createdAt: string;
  isActive: boolean;
}
