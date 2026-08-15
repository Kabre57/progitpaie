export interface NotificationRecord {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput {
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
}

export interface NotificationRepository {
  isActiveUserInCompany(companyId: string, userId: string): Promise<boolean>;
  create(input: CreateNotificationInput): Promise<NotificationRecord>;
  listForUser(userId: string, unreadOnly: boolean, limit: number): Promise<readonly NotificationRecord[]>;
  countUnreadForUser(userId: string): Promise<number>;
  findForUser(id: string, userId: string): Promise<NotificationRecord | null>;
  markRead(id: string, userId: string): Promise<void>;
}
