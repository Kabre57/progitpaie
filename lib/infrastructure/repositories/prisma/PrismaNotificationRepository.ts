import type {
  CreateNotificationInput,
  NotificationRecord,
  NotificationRepository,
} from "@/lib/application/notifications/ports/NotificationRepository";
import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

function toRecord(notification: {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}): NotificationRecord {
  return { ...notification, type: notification.type };
}

export class PrismaNotificationRepository implements NotificationRepository {
  public async isActiveUserInCompany(companyId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId, isActive: true },
      select: { id: true },
    });
    return user !== null;
  }

  public async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const notification = await prisma.notification.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type as NotificationType,
        link: input.link,
        isRead: false,
      },
    });
    return toRecord(notification);
  }

  /**
   * Crée une notification en résolvant automatiquement le companyId depuis userId.
   * Utilisé par les helpers de couche service qui n'ont accès qu'au userId.
   * Retourne false si l'utilisateur est introuvable.
   */
  public async createForUserId(params: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
  }): Promise<NotificationRecord | false> {
    const recipient = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { companyId: true },
    });
    if (!recipient) return false;
    return this.create({
      companyId: recipient.companyId,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type as string,
      link: params.link ?? null,
    });
  }

  public async listForUser(userId: string, unreadOnly: boolean, limit: number): Promise<readonly NotificationRecord[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return notifications.map(toRecord);
  }

  public async countUnreadForUser(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  public async findForUser(id: string, userId: string): Promise<NotificationRecord | null> {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    return notification ? toRecord(notification) : null;
  }

  public async markRead(id: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true },
    });
  }
}
