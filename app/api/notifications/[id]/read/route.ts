import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware-helpers";
import { decrUnreadNotifications } from "@/lib/redis";
import { ApiResponse } from "@/types";
import { MarkNotificationReadUseCase } from "@/lib/application/notifications/use-cases/NotificationUseCases";
import { PrismaNotificationRepository } from "@/lib/infrastructure/repositories/prisma/PrismaNotificationRepository";

const markNotificationRead = new MarkNotificationReadUseCase(new PrismaNotificationRepository());
const idSchema = z.string().trim().min(1);

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const parsedId = idSchema.safeParse((await params).id);
    if (!parsedId.success) {
      return NextResponse.json(
        { success: false, error: "Identifiant de notification invalide", code: "VALIDATION_ERROR", data: null },
        { status: 400 }
      );
    }

    const result = await markNotificationRead.execute(parsedId.data, user.userId);
    if (result.changed) await decrUnreadNotifications(user.userId);

    return NextResponse.json(
      { success: true, data: null, message: "Notification marquée comme lue" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "NOTIFICATION_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Notification introuvable", code: "NOT_FOUND", data: null },
        { status: 404 }
      );
    }
    console.error("Mark read error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de mettre à jour la notification", code: "SERVER_ERROR", data: null },
      { status: 500 }
    );
  }
}
