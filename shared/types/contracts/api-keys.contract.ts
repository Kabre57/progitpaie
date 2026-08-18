export interface ApiKeyPermissionsDTO {
  [key: string]: boolean | string[] | undefined;
}

export interface ApiKeyItemDTO {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: Record<string, boolean> | string[] | ApiKeyPermissionsDTO;
  lastUsedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  isActive: boolean;
}
