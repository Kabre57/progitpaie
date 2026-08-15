import { PrismaNotificationRepository } from "@/lib/infrastructure/repositories/prisma/PrismaNotificationRepository";
import { incrUnreadNotifications } from "@/lib/redis";

const notificationRepo = new PrismaNotificationRepository();

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}) {
  try {
    const result = await notificationRepo.createForUserId({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      link: params.link || null,
    });
    if (!result) return false;

    // Increment unread count in Redis cache
    await incrUnreadNotifications(params.userId);
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}
