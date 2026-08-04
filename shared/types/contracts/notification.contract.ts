import type { NotificationType } from "@prisma/client";

export interface CreateNotificationCommand {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}
