import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { decrUnreadNotifications } from "@/lib/redis";
import { ApiResponse } from "@/types";

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.userId },
    });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (!notification.isRead) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      await decrUnreadNotifications(user.userId);
    }

    return NextResponse.json(
      {
        success: true,
        data: null,
        message: "Notification marked as read",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update notification",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
