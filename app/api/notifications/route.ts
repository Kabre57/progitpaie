import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware-helpers";
import { incrUnreadNotifications } from "@/lib/redis";
import { ApiResponse } from "@/types";
import { requireTenant } from "@/lib/database/tenant-context";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";
import { createNotificationSchema } from "@/shared/validation/notification.schema";
import {
  CreateNotificationUseCase,
  ListNotificationsUseCase,
} from "@/lib/application/notifications/use-cases/NotificationUseCases";
import type { NotificationRecord } from "@/lib/application/notifications/ports/NotificationRepository";
import { PrismaNotificationRepository } from "@/lib/infrastructure/repositories/prisma/PrismaNotificationRepository";

const repository = new PrismaNotificationRepository();
const createNotification = new CreateNotificationUseCase(repository);
const listNotifications = new ListNotificationsUseCase(repository);
const limitSchema = z.coerce.number().int().min(1).max(100).catch(20);

function serializeNotification(notification: NotificationRecord): Record<string, unknown> {
  return { ...notification, _id: notification.id };
}

// POST /api/notifications - Create a notification (internal use)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await enforceRateLimit(request, "notifications:create", 30, 60);
    if (rateLimitResponse) return rateLimitResponse;

    const tenant = await requireTenant(request, "admin");
    if (tenant instanceof NextResponse) return tenant;

    const validation = await validateBody(request, createNotificationSchema);
    if (!validation.success) return validation.response;
    const { userId, title, message, type, link } = validation.data;

    const notification = await createNotification.execute({
      companyId: tenant.companyId,
      userId,
      title,
      message,
      type,
      link: link || null,
    });
    await incrUnreadNotifications(userId);

    return NextResponse.json({ success: true, data: serializeNotification(notification) }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOTIFICATION_RECIPIENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Destinataire introuvable dans votre société", code: "RECIPIENT_NOT_FOUND" },
        { status: 404 }
      );
    }
    console.error("Create notification error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de créer la notification", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = limitSchema.parse(searchParams.get("limit") ?? undefined);
    const result = await listNotifications.execute(user.userId, unreadOnly, limit);

    return NextResponse.json(
      {
        success: true,
        data: result.notifications.map(serializeNotification),
        unreadCount: result.unreadCount,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer les notifications", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
