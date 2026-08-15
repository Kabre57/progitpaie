import type {
  CreateNotificationInput,
  NotificationRecord,
  NotificationRepository,
} from "../ports/NotificationRepository";

export class CreateNotificationUseCase {
  public constructor(private readonly repository: NotificationRepository) {}

  public async execute(input: CreateNotificationInput): Promise<NotificationRecord> {
    const recipientExists = await this.repository.isActiveUserInCompany(input.companyId, input.userId);
    if (!recipientExists) throw new Error("NOTIFICATION_RECIPIENT_NOT_FOUND");
    return this.repository.create(input);
  }
}

export class ListNotificationsUseCase {
  public constructor(private readonly repository: NotificationRepository) {}

  public async execute(userId: string, unreadOnly: boolean, limit: number): Promise<{
    notifications: readonly NotificationRecord[];
    unreadCount: number;
  }> {
    const [notifications, unreadCount] = await Promise.all([
      this.repository.listForUser(userId, unreadOnly, limit),
      this.repository.countUnreadForUser(userId),
    ]);
    return { notifications, unreadCount };
  }
}

export class MarkNotificationReadUseCase {
  public constructor(private readonly repository: NotificationRepository) {}

  public async execute(id: string, userId: string): Promise<{ changed: boolean }> {
    const notification = await this.repository.findForUser(id, userId);
    if (!notification) throw new Error("NOTIFICATION_NOT_FOUND");
    if (notification.isRead) return { changed: false };
    await this.repository.markRead(id, userId);
    return { changed: true };
  }
}
