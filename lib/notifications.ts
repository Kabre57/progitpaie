import { prisma } from "@/lib/db";
import { incrUnreadNotifications } from "@/lib/redis";
import { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: (params.type || "info") as NotificationType,
        link: params.link || null,
        isRead: false,
      },
    });

    // Increment unread count in Redis cache
    await incrUnreadNotifications(params.userId);
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}
