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
    const recipient = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { companyId: true },
    });
    if (!recipient) return false;
    await prisma.notification.create({
      data: {
        companyId: recipient.companyId,
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
